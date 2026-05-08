import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, Next } from "hono";

// User type for auth context
interface AuthUser {
  id: string | number;
  email: string;
  name?: string | null;
  isAdmin?: boolean;
  google_user_data?: {
    email: string;
    name?: string | null;
  };
}

// Extend Hono types for user context
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

// Env already includes ADMIN_EMAIL and ADMIN_PASSWORD from worker-configuration.d.ts
import {
  CreateCampaignSchema,
  CreateRewardSchema,
  CreatePledgeSchema,
  type Campaign,
  type Reward,
  type CampaignUpdate,
  type CampaignFaq,
  type CampaignWithDetails,
} from "@/shared/types";
import { createHathorClient, WALLET_STATUS, getHathorConfigDebug } from "./hathor-client";
import { createStellarClient } from "./stellar-client";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// ============ EMAIL HELPERS ============

const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
    ${content}
  </div>
</body>
</html>
`;

const emailHeader = (title: string) => `
<div style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #e4e4e7;">
  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">${title}</h1>
</div>
`;

const emailBody = (content: string) => `
<div style="padding: 32px 40px;">
  ${content}
</div>
`;

const emailButton = (text: string, url: string) => `
<a href="${url}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 6px;">${text}</a>
`;

const emailFooter = (text: string) => `
<div style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
  <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">${text}</p>
</div>
`;

function generateVerificationToken(): string {
  return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 24)}`;
}

// ============ AUTH (Email/Password) ============

const SESSION_COOKIE_NAME = "kate_session";

// Admin sessions are now stored in admin_sessions table (DB-backed, survives deploys)

// Generate session token
function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

// Custom auth middleware
async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if admin session from DB
  if (sessionToken.startsWith("admin_")) {
    const adminSession = await c.env.DB.prepare(
      "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).bind(sessionToken).first() as any;
    
    if (adminSession) {
      c.set("user", { 
        id: "admin",
        email: adminSession.email,
        isAdmin: true
      });
      return next();
    }
    // Invalid or expired admin session
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check regular user session from DB
  const userSession = await c.env.DB.prepare(
    "SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(sessionToken).first() as any;

  if (!userSession) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(userSession.user_id).first() as any;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: false
  });

  return next();
}

// Admin login (email/password)
// Check admin session from DB
app.get("/api/auth/admin/me", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (!sessionToken || !sessionToken.startsWith("admin_")) {
    return c.json({ authenticated: false }, 401);
  }
  
  const adminSession = await c.env.DB.prepare(
    "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(sessionToken).first() as any;
  
  if (!adminSession) {
    return c.json({ authenticated: false }, 401);
  }
  
  return c.json({ 
    authenticated: true, 
    email: adminSession.email,
    isAdmin: true 
  });
});

// Admin logout - delete from DB
app.post("/api/auth/admin/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (sessionToken && sessionToken.startsWith("admin_")) {
    await c.env.DB.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(sessionToken).run();
    deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  }
  
  return c.json({ success: true });
});

app.post("/api/auth/admin/login", async (c) => {
  const { email, password } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ error: "Email e senha são obrigatórios" }, 400);
  }

  // Check env var admin first
  const adminEmail = c.env.ADMIN_EMAIL;
  const adminPassword = c.env.ADMIN_PASSWORD;
  
  let isValidAdmin = false;
  let adminEmailToUse = email;
  
  // Check main admin from env
  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    isValidAdmin = true;
    adminEmailToUse = adminEmail;
  }
  
  // Check admins table
  if (!isValidAdmin) {
    const dbAdmin = await c.env.DB.prepare(
      "SELECT * FROM admins WHERE email = ? AND password = ? AND is_active = 1"
    ).bind(email.toLowerCase(), password).first() as any;
    
    if (dbAdmin) {
      isValidAdmin = true;
      adminEmailToUse = dbAdmin.email;
    }
  }
  
  if (!isValidAdmin) {
    return c.json({ error: "Credenciais inválidas" }, 401);
  }

  // Create admin session in DB (survives deploys)
  const sessionToken = `admin_${generateSessionToken()}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  
  await c.env.DB.prepare(
    "INSERT INTO admin_sessions (email, token, expires_at) VALUES (?, ?, ?)"
  ).bind(adminEmailToUse, sessionToken, expiresAt).run();

  setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return c.json({ 
    success: true, 
    user: { email: adminEmailToUse, isAdmin: true }
  });
});

// User login (email/password)
app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ error: "Email e senha são obrigatórios" }, 400);
  }

  // Find user
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).bind(email.toLowerCase()).first() as any;

  if (!user || user.password !== password) {
    return c.json({ error: "Email ou senha incorretos" }, 401);
  }

  // Create session
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days

  await c.env.DB.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).bind(user.id, sessionToken, expiresAt).run();

  setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ 
    success: true, 
    user: { 
      id: user.id,
      email: user.email,
      name: user.name,
      email_verified: !!user.email_verified
    }
  });
});

// User registration
app.post("/api/auth/register", async (c) => {
  const { email, password, name, role } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ error: "Email e senha são obrigatórios", code: "MISSING_FIELDS" }, 400);
  }
  
  // Validate role if provided
  const validRoles = ["investidor", "capitador"];
  const userRole = role && validRoles.includes(role) ? role : null;

  if (password.length < 6) {
    return c.json({ error: "Senha deve ter pelo menos 6 caracteres", code: "PASSWORD_TOO_SHORT" }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  ).bind(normalizedEmail).first();

  if (existing) {
    return c.json({ 
      error: "Este email já possui conta. Faça login para continuar.", 
      code: "EMAIL_EXISTS" 
    }, 400);
  }

  // Create user
  const verificationToken = generateVerificationToken();
  const result = await c.env.DB.prepare(`
    INSERT INTO users (email, password, name, email_verified, email_verification_token, email_verification_sent_at)
    VALUES (?, ?, ?, 0, ?, datetime('now'))
  `).bind(normalizedEmail, password, name || null, verificationToken).run();

  const userId = result.meta.last_row_id;

  // Send verification email
  const baseUrl = c.req.url.includes('localhost') ? 'http://localhost:5173' : 'https://kate.mocha.app';
  const verifyUrl = `${baseUrl}/auth/verificar-email/${verificationToken}`;
  
  try {
    await (c.env as any).EMAILS.send({
      to: normalizedEmail,
      subject: "Confirme seu email - Kate Equity",
      html_body: emailTemplate(`
        ${emailHeader("Bem-vindo à Kate Equity!")}
        ${emailBody(`
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
            Olá${name ? ` ${name}` : ''},
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
            Obrigado por se cadastrar na Kate Equity. Para ativar sua conta e começar a investir em startups, confirme seu email clicando no botão abaixo:
          </p>
          ${emailButton("Confirmar meu email", verifyUrl)}
          <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
            Se você não criou esta conta, pode ignorar este email.
          </p>
        `)}
        ${emailFooter("© 2025 Kate Equity. Todos os direitos reservados.")}
      `),
      text_body: `Olá${name ? ` ${name}` : ''}! Confirme seu email acessando: ${verifyUrl}`,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
    // Don't fail registration if email fails
  }

  // Auto-assign Hathor address for new user
  const hathorClient = getHathorClient(c.env);
  if (hathorClient) {
    try {
      let hathorAddress: string | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !hathorAddress) {
        attempts++;
        const addressResult = await hathorClient.getNewAddress(true);
        
        if (addressResult.success && addressResult.data?.address) {
          const address = addressResult.data.address;
          
          // Check if address is unique
          const duplicate = await c.env.DB.prepare(
            "SELECT id FROM hathor_addresses WHERE hathor_address = ?"
          ).bind(address).first();
          
          if (!duplicate) {
            hathorAddress = address;
          }
        }
      }

      if (hathorAddress) {
        await c.env.DB.prepare(`
          INSERT INTO hathor_addresses (user_id, hathor_address, status)
          VALUES (?, ?, 'active')
        `).bind(userId, hathorAddress).run();
        
        // Log operation
        await c.env.DB.prepare(`
          INSERT INTO hathor_operations (user_id, op_type, request_payload, response_payload, status)
          VALUES (?, 'address_auto_assign', ?, ?, 'success')
        `).bind(
          userId,
          JSON.stringify({ userId, trigger: 'registration' }),
          JSON.stringify({ address: hathorAddress })
        ).run();
      }
    } catch (err) {
      // Don't fail registration if Hathor address fails - user can request later
      console.error("Failed to auto-assign Hathor address:", err);
    }
  }

  // Generate Stellar keypair for user
  let stellarPublicKey: string | null = null;
  let stellarSecretKey: string | null = null;
  try {
    const { StellarClient } = await import("./stellar-client");
    const stellarKeypair = StellarClient.generateKeypair();
    stellarPublicKey = stellarKeypair.publicKey;
    stellarSecretKey = stellarKeypair.secretKey;
    console.log(`[Stellar] Generated keypair for user ${userId}: ${stellarPublicKey.substring(0, 20)}...`);
  } catch (err) {
    console.error("Failed to generate Stellar keypair:", err);
  }

  // Create user profile with role if provided
  if (userRole) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO user_profiles (user_id, role, document_type, document_number, name, email, is_onboarding_complete, welcome_seen, stellar_public_key, stellar_secret_key)
        VALUES (?, ?, '', '', ?, ?, 0, 0, ?, ?)
      `).bind(userId, userRole, name || null, normalizedEmail, stellarPublicKey, stellarSecretKey).run();
    } catch (err) {
      console.error("Failed to create user profile:", err);
    }
  }

  // Create session
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  await c.env.DB.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).bind(userId, sessionToken, expiresAt).run();

  setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ 
    success: true, 
    user: { 
      id: userId,
      email: normalizedEmail,
      name: name || null,
      email_verified: false
    },
    message: "Conta criada! Verifique seu email para ativar."
  }, 201);
});

// Verify email token
app.get("/api/auth/verify-email/:token", async (c) => {
  const token = c.req.param("token");
  
  if (!token) {
    return c.json({ error: "Token inválido" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, email_verified FROM users WHERE email_verification_token = ?"
  ).bind(token).first() as any;

  if (!user) {
    return c.json({ error: "Token inválido ou expirado" }, 400);
  }

  if (user.email_verified) {
    return c.json({ success: true, message: "Email já verificado" });
  }

  // Mark email as verified
  await c.env.DB.prepare(
    "UPDATE users SET email_verified = 1, email_verification_token = NULL, updated_at = datetime('now') WHERE id = ?"
  ).bind(user.id).run();

  return c.json({ success: true, message: "Email verificado com sucesso!" });
});

// Resend verification email
app.post("/api/auth/resend-verification", authMiddleware, async (c) => {
  const currentUser = c.get("user");
  
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, email_verified FROM users WHERE id = ?"
  ).bind(currentUser.id).first() as any;

  if (!user) {
    return c.json({ error: "Usuário não encontrado" }, 404);
  }

  if (user.email_verified) {
    return c.json({ error: "Email já verificado" }, 400);
  }

  // Generate new token
  const verificationToken = generateVerificationToken();
  
  await c.env.DB.prepare(
    "UPDATE users SET email_verification_token = ?, email_verification_sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).bind(verificationToken, user.id).run();

  // Send verification email
  const baseUrl = c.req.url.includes('localhost') ? 'http://localhost:5173' : 'https://kate.mocha.app';
  const verifyUrl = `${baseUrl}/auth/verificar-email/${verificationToken}`;
  
  try {
    await (c.env as any).EMAILS.send({
      to: user.email,
      subject: "Confirme seu email - Kate Equity",
      html_body: emailTemplate(`
        ${emailHeader("Confirme seu email")}
        ${emailBody(`
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
            Olá${user.name ? ` ${user.name}` : ''},
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
            Clique no botão abaixo para confirmar seu email e ativar sua conta:
          </p>
          ${emailButton("Confirmar meu email", verifyUrl)}
          <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
            Se você não solicitou este email, pode ignorá-lo.
          </p>
        `)}
        ${emailFooter("© 2025 Kate Equity. Todos os direitos reservados.")}
      `),
      text_body: `Olá${user.name ? ` ${user.name}` : ''}! Confirme seu email acessando: ${verifyUrl}`,
    });
    
    return c.json({ success: true, message: "Email de verificação reenviado!" });
  } catch (err) {
    console.error("Failed to resend verification email:", err);
    return c.json({ error: "Erro ao enviar email" }, 500);
  }
});

// Get current user
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Logout
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (sessionToken) {
    // Remove admin sessions from DB
    if (sessionToken.startsWith("admin_")) {
      await c.env.DB.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(sessionToken).run();
    }
    
    // Remove user sessions from DB
    await c.env.DB.prepare(
      "DELETE FROM user_sessions WHERE token = ?"
    ).bind(sessionToken).run();
  }

  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// User logout - POST endpoint (used by useAuth hook)
app.post("/api/auth/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (sessionToken) {
    // Remove admin sessions from DB
    if (sessionToken.startsWith("admin_")) {
      await c.env.DB.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(sessionToken).run();
    }
    
    // Remove user sessions from DB
    await c.env.DB.prepare(
      "DELETE FROM user_sessions WHERE token = ?"
    ).bind(sessionToken).run();
  }

  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Change password
app.post("/api/auth/change-password", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (!sessionToken) {
    return c.json({ error: "Não autenticado" }, 401);
  }

  // Get current session
  const session = await c.env.DB.prepare(`
    SELECT user_id FROM user_sessions 
    WHERE token = ? AND expires_at > datetime('now')
  `).bind(sessionToken).first() as { user_id: number } | null;

  if (!session) {
    return c.json({ error: "Sessão inválida" }, 401);
  }

  const { current_password, new_password } = await c.req.json();

  if (!current_password || !new_password) {
    return c.json({ error: "Senha atual e nova senha são obrigatórias" }, 400);
  }

  if (new_password.length < 6) {
    return c.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, 400);
  }

  // Get user and verify current password
  const user = await c.env.DB.prepare(
    "SELECT id, password FROM users WHERE id = ?"
  ).bind(session.user_id).first() as { id: number; password: string } | null;

  if (!user) {
    return c.json({ error: "Usuário não encontrado" }, 404);
  }

  if (user.password !== current_password) {
    return c.json({ error: "Senha atual incorreta" }, 400);
  }

  // Update password
  await c.env.DB.prepare(
    "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(new_password, user.id).run();

  return c.json({ success: true, message: "Senha alterada com sucesso" });
});

// Helper to calculate days left
function calculateDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ============ CAMPAIGNS ============

// List all campaigns
app.get("/api/campaigns", async (c) => {
  const { category, featured, status, search } = c.req.query();
  
  let query = "SELECT * FROM campaigns WHERE 1=1";
  const params: (string | number)[] = [];
  
  if (category && category !== "Todos") {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (featured === "true") {
    query += " AND is_featured = 1";
  }
  
  if (status) {
    query += " AND status = ?";
    params.push(status);
  } else {
    query += " AND status = 'active'";
  }
  
  if (search) {
    query += " AND (title LIKE ? OR short_description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += " ORDER BY is_featured DESC, created_at DESC";
  
  const result = await c.env.DB.prepare(query).bind(...params).all<Campaign>();
  
  const campaigns = result.results.map((campaign) => ({
    ...campaign,
    days_left: calculateDaysLeft(campaign.end_date),
  }));
  
  return c.json({ campaigns });
});

// Get single campaign with details
app.get("/api/campaigns/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const campaign = await c.env.DB.prepare(
    "SELECT * FROM campaigns WHERE id = ?"
  ).bind(id).first<Campaign>();
  
  if (!campaign) {
    return c.json({ error: "Campanha não encontrada" }, 404);
  }
  
  const rewards = await c.env.DB.prepare(
    "SELECT * FROM rewards WHERE campaign_id = ? ORDER BY min_amount ASC"
  ).bind(id).all<Reward>();
  
  const updates = await c.env.DB.prepare(
    "SELECT * FROM campaign_updates WHERE campaign_id = ? ORDER BY created_at DESC"
  ).bind(id).all<CampaignUpdate>();
  
  const faqs = await c.env.DB.prepare(
    "SELECT * FROM campaign_faqs WHERE campaign_id = ? ORDER BY id ASC"
  ).bind(id).all<CampaignFaq>();
  
  const response: CampaignWithDetails = {
    ...campaign,
    rewards: rewards.results,
    updates: updates.results,
    faqs: faqs.results,
    days_left: calculateDaysLeft(campaign.end_date),
  };
  
  return c.json({ campaign: response });
});

// Create new campaign
app.post("/api/campaigns", async (c) => {
  const body = await c.req.json();
  const parsed = CreateCampaignSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }
  
  const data = parsed.data;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO campaigns (
      title, short_description, full_description, image_url, 
      category, goal_amount, end_date, creator_name, 
      creator_email, creator_avatar, risks, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.title,
    data.short_description,
    data.full_description,
    data.image_url,
    data.category,
    data.goal_amount,
    data.end_date,
    data.creator_name,
    data.creator_email || null,
    data.creator_avatar || null,
    data.risks || null,
    data.user_id || null
  ).run();
  
  const campaignId = result.meta.last_row_id;
  
  return c.json({ 
    success: true, 
    campaign_id: campaignId,
    message: "Campanha criada com sucesso!" 
  }, 201);
});

// Update campaign (partial)
app.patch("/api/campaigns/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: (string | number)[] = [];
  
  const allowedFields = [
    "title", "short_description", "full_description", 
    "image_url", "category", "risks", "is_featured", "status"
  ];
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(body[field]);
    }
  }
  
  if (updates.length === 0) {
    return c.json({ error: "Nenhum campo para atualizar" }, 400);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await c.env.DB.prepare(
    `UPDATE campaigns SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...params).run();
  
  return c.json({ success: true, message: "Campanha atualizada!" });
});

// Update campaign (full)
app.put("/api/campaigns/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE campaigns SET
      title = ?,
      short_description = ?,
      full_description = ?,
      image_url = ?,
      category = ?,
      goal_amount = ?,
      end_date = ?,
      creator_name = ?,
      risks = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.title,
    body.short_description,
    body.full_description,
    body.image_url,
    body.category,
    body.goal_amount,
    body.end_date,
    body.creator_name,
    body.risks || null,
    id
  ).run();
  
  return c.json({ success: true, message: "Campanha atualizada!" });
});

// ============ REWARDS ============

// Add reward to campaign
app.post("/api/rewards", async (c) => {
  const body = await c.req.json();
  const parsed = CreateRewardSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }
  
  const data = parsed.data;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO rewards (
      campaign_id, title, description, min_amount, 
      estimated_delivery, items_included, limited_quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.campaign_id,
    data.title,
    data.description,
    data.min_amount,
    data.estimated_delivery,
    JSON.stringify(data.items_included),
    data.limited_quantity || null
  ).run();
  
  return c.json({ 
    success: true, 
    reward_id: result.meta.last_row_id,
    message: "Recompensa adicionada!" 
  }, 201);
});

// Get rewards for campaign
app.get("/api/campaigns/:id/rewards", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const rewards = await c.env.DB.prepare(
    "SELECT * FROM rewards WHERE campaign_id = ? ORDER BY min_amount ASC"
  ).bind(id).all<Reward>();
  
  return c.json({ rewards: rewards.results });
});

// Update reward
app.put("/api/rewards/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE rewards SET
      title = ?,
      description = ?,
      min_amount = ?,
      estimated_delivery = ?,
      items_included = ?,
      limited_quantity = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.title,
    body.description,
    body.min_amount,
    body.estimated_delivery,
    JSON.stringify(body.items_included || []),
    body.limited_quantity || null,
    id
  ).run();
  
  return c.json({ success: true, message: "Recompensa atualizada!" });
});

// Delete reward
app.delete("/api/rewards/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  await c.env.DB.prepare("DELETE FROM rewards WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: "Recompensa removida!" });
});

// ============ PLEDGES ============

// Create pledge (support campaign)
app.post("/api/pledges", async (c) => {
  const body = await c.req.json();
  const parsed = CreatePledgeSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }
  
  const data = parsed.data;
  
  // Check if reward is available
  if (data.reward_id) {
    const reward = await c.env.DB.prepare(
      "SELECT * FROM rewards WHERE id = ?"
    ).bind(data.reward_id).first<Reward>();
    
    if (!reward) {
      return c.json({ error: "Recompensa não encontrada" }, 404);
    }
    
    if (data.amount < reward.min_amount) {
      return c.json({ 
        error: `Valor mínimo para essa recompensa é R$ ${reward.min_amount}` 
      }, 400);
    }
    
    if (reward.limited_quantity && reward.claimed_count >= reward.limited_quantity) {
      return c.json({ error: "Recompensa esgotada" }, 400);
    }
  }
  
  // Create pledge
  const result = await c.env.DB.prepare(`
    INSERT INTO pledges (campaign_id, reward_id, amount, backer_name, backer_email)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    data.campaign_id,
    data.reward_id || null,
    data.amount,
    data.backer_name,
    data.backer_email
  ).run();
  
  // Update campaign totals
  await c.env.DB.prepare(`
    UPDATE campaigns 
    SET current_amount = current_amount + ?,
        backers_count = backers_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(data.amount, data.campaign_id).run();
  
  // Update reward claimed count if applicable
  if (data.reward_id) {
    await c.env.DB.prepare(`
      UPDATE rewards 
      SET claimed_count = claimed_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(data.reward_id).run();
  }
  
  return c.json({ 
    success: true, 
    pledge_id: result.meta.last_row_id,
    message: "Apoio registrado com sucesso!" 
  }, 201);
});

// Get pledges for campaign (for creator dashboard)
app.get("/api/campaigns/:id/pledges", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const pledges = await c.env.DB.prepare(`
    SELECT p.*, r.title as reward_title
    FROM pledges p
    LEFT JOIN rewards r ON p.reward_id = r.id
    WHERE p.campaign_id = ?
    ORDER BY p.created_at DESC
  `).bind(id).all();
  
  return c.json({ pledges: pledges.results });
});

// ============ CAMPAIGN UPDATES ============

// Add update to campaign
app.post("/api/campaigns/:id/updates", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { title, content } = await c.req.json();
  
  if (!title || !content) {
    return c.json({ error: "Título e conteúdo são obrigatórios" }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO campaign_updates (campaign_id, title, content)
    VALUES (?, ?, ?)
  `).bind(id, title, content).run();
  
  return c.json({ 
    success: true, 
    update_id: result.meta.last_row_id,
    message: "Atualização publicada!" 
  }, 201);
});

// ============ CAMPAIGN FAQ ============

// Add FAQ to campaign
app.post("/api/campaigns/:id/faqs", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { question, answer } = await c.req.json();
  
  if (!question || !answer) {
    return c.json({ error: "Pergunta e resposta são obrigatórias" }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO campaign_faqs (campaign_id, question, answer)
    VALUES (?, ?, ?)
  `).bind(id, question, answer).run();
  
  return c.json({ 
    success: true, 
    faq_id: result.meta.last_row_id,
    message: "FAQ adicionada!" 
  }, 201);
});

// ============ CREATOR DASHBOARD ============

// Get creator's campaigns by user_id or email (backwards compatible)
app.get("/api/creator/campaigns", async (c) => {
  const userId = c.req.query("user_id");
  const email = c.req.query("email");
  
  let result;
  if (userId) {
    result = await c.env.DB.prepare(
      "SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(userId).all<Campaign>();
  } else if (email) {
    result = await c.env.DB.prepare(
      "SELECT * FROM campaigns WHERE creator_email = ? ORDER BY created_at DESC"
    ).bind(email).all<Campaign>();
  } else {
    return c.json({ error: "user_id ou email é obrigatório" }, 400);
  }
  
  const campaigns = result.results.map((campaign) => ({
    ...campaign,
    days_left: calculateDaysLeft(campaign.end_date),
  }));
  
  return c.json({ campaigns });
});

// Get all pledges for creator's campaigns
app.get("/api/creator/pledges", async (c) => {
  const userId = c.req.query("user_id");
  const email = c.req.query("email");
  
  let pledges;
  if (userId) {
    pledges = await c.env.DB.prepare(`
      SELECT p.*, c.title as campaign_title, r.title as reward_title
      FROM pledges p
      INNER JOIN campaigns c ON p.campaign_id = c.id
      LEFT JOIN rewards r ON p.reward_id = r.id
      WHERE c.user_id = ?
      ORDER BY p.created_at DESC
    `).bind(userId).all();
  } else if (email) {
    pledges = await c.env.DB.prepare(`
      SELECT p.*, c.title as campaign_title, r.title as reward_title
      FROM pledges p
      INNER JOIN campaigns c ON p.campaign_id = c.id
      LEFT JOIN rewards r ON p.reward_id = r.id
      WHERE c.creator_email = ?
      ORDER BY p.created_at DESC
    `).bind(email).all();
  } else {
    return c.json({ error: "user_id ou email é obrigatório" }, 400);
  }
  
  return c.json({ pledges: pledges.results });
});

// ============ COMMENTS ============

// Get comments for campaign
app.get("/api/campaigns/:id/comments", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const comments = await c.env.DB.prepare(`
    SELECT * FROM campaign_comments 
    WHERE campaign_id = ? 
    ORDER BY created_at DESC
  `).bind(id).all();
  
  return c.json({ comments: comments.results });
});

// Add comment to campaign
app.post("/api/campaigns/:id/comments", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  const { content, parent_id } = await c.req.json();
  
  if (!content || content.trim().length === 0) {
    return c.json({ error: "Comentário não pode estar vazio" }, 400);
  }
  
  if (content.length > 2000) {
    return c.json({ error: "Comentário muito longo (máximo 2000 caracteres)" }, 400);
  }
  
  // Check if campaign exists
  const campaign = await c.env.DB.prepare(
    "SELECT id FROM campaigns WHERE id = ?"
  ).bind(id).first();
  
  if (!campaign) {
    return c.json({ error: "Campanha não encontrada" }, 404);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO campaign_comments (campaign_id, user_id, user_name, user_avatar, content, parent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    user!.id,
    user?.name || user?.email || "Usuário",
    null,
    content.trim(),
    parent_id || null
  ).run();
  
  const newComment = await c.env.DB.prepare(
    "SELECT * FROM campaign_comments WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ 
    success: true, 
    comment: newComment,
    message: "Comentário publicado!" 
  }, 201);
});

// Delete comment (only by owner)
app.delete("/api/comments/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  
  const comment = await c.env.DB.prepare(
    "SELECT * FROM campaign_comments WHERE id = ?"
  ).bind(id).first();
  
  if (!comment) {
    return c.json({ error: "Comentário não encontrado" }, 404);
  }
  
  if ((comment as any).user_id !== user!.id) {
    return c.json({ error: "Você não tem permissão para deletar este comentário" }, 403);
  }
  
  await c.env.DB.prepare("DELETE FROM campaign_comments WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: "Comentário removido!" });
});

// ============ PROJECTS (Equity Crowdfunding) ============

// Pre-registration (can be called with or without auth)
app.post("/api/projects/pre-register", async (c) => {
  const body = await c.req.json();
  
  const {
    document_type,
    responsible_name,
    email,
    whatsapp,
    project_name,
    website,
    category,
    funding_range,
    stage,
    source_url
  } = body;
  
  // Validate required fields
  if (!responsible_name || !email || !whatsapp || !project_name || !category || !funding_range || !stage) {
    return c.json({ error: "Campos obrigatórios faltando", code: "MISSING_FIELDS" }, 400);
  }
  
  // Try to get authenticated user from session
  let userId = "";
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (sessionToken) {
    const userSession = await c.env.DB.prepare(
      "SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).bind(sessionToken).first() as any;
    
    if (userSession) {
      userId = String(userSession.user_id);
    }
  }
  
  // Check for existing draft project with same email and project name (idempotency)
  const existingProject = await c.env.DB.prepare(`
    SELECT id FROM projects 
    WHERE email = ? AND project_name = ? AND status = 'draft'
    ORDER BY created_at DESC LIMIT 1
  `).bind(email, project_name).first() as any;
  
  if (existingProject) {
    // Update existing project with user_id if we have one
    if (userId) {
      await c.env.DB.prepare(`
        UPDATE projects SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(userId, existingProject.id).run();
    }
    
    return c.json({ 
      success: true, 
      project_id: existingProject.id,
      message: "Projeto encontrado!",
      existing: true
    });
  }
  
  // Create new project
  const result = await c.env.DB.prepare(`
    INSERT INTO projects (
      user_id, document_type, responsible_name, email, whatsapp, 
      project_name, website, category, funding_range, stage, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).bind(
    userId || "",
    document_type || "cnpj",
    responsible_name,
    email,
    whatsapp,
    project_name,
    website || null,
    category,
    funding_range,
    stage
  ).run();
  
  const projectId = result.meta.last_row_id;
  
  // Also create a lead record (check for existing first)
  const existingLead = await c.env.DB.prepare(
    "SELECT id FROM leads WHERE email = ? AND source = 'captar_form'"
  ).bind(email).first();
  
  if (!existingLead) {
    await c.env.DB.prepare(`
      INSERT INTO leads (email, name, phone, source, source_url, interest_type, project_id, user_id, metadata)
      VALUES (?, ?, ?, 'captar_form', ?, 'capitador', ?, ?, ?)
    `).bind(
      email,
      responsible_name,
      whatsapp,
      source_url || "/captar",
      projectId,
      userId || null,
      JSON.stringify({ category, funding_range, stage, project_name })
    ).run();
  }
  
  return c.json({ 
    success: true, 
    project_id: projectId,
    message: "Pré-inscrição recebida!" 
  }, 201);
});

// Get project by ID (for linking after auth)
app.get("/api/projects/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ?"
  ).bind(id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  return c.json({ project });
});

// Get project verification data by slug (for NFT verification page) - PUBLIC endpoint
app.get("/api/projects/verificacao/:slug", async (c) => {
  const slug = c.req.param("slug");
  
  // Get project by slug
  const project = await c.env.DB.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM investments WHERE project_id = p.id AND status IN ('paid', 'blockchain_registered', 'token_released', 'distributed', 'completed', 'completed_no_nft', 'escrow_reserved', 'distributing')) as investors_count
    FROM projects p
    WHERE p.slug = ?
  `).bind(slug).first() as Record<string, unknown> | null;
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  // Get project documents
  const docs = await c.env.DB.prepare(`
    SELECT id, type, name, file_hash, created_at
    FROM documents
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).bind(project.id).all();
  
  // Get project events from blockchain_logs for timeline
  const events = await c.env.DB.prepare(`
    SELECT 
      id,
      action as event_type,
      CASE action
        WHEN 'project_submitted' THEN 'Projeto submetido'
        WHEN 'project_approved' THEN 'Projeto aprovado'
        WHEN 'project_nft_created' THEN 'NFT do projeto criado'
        WHEN 'fundraising_started' THEN 'Captação iniciada'
        WHEN 'fundraising_ended' THEN 'Captação encerrada'
        WHEN 'tokens_distributed' THEN 'Tokens distribuídos'
        WHEN 'nft_token_linked' THEN 'NFT vinculado ao token'
        ELSE action
      END as title,
      metadata as description,
      created_at
    FROM blockchain_logs
    WHERE project_id = ?
    ORDER BY created_at ASC
  `).bind(project.id).all();
  
  // Also check project_events table
  const projectEvents = await c.env.DB.prepare(`
    SELECT id, event_type, title, description, created_at
    FROM project_events
    WHERE project_id = ?
    ORDER BY created_at ASC
  `).bind(project.id).all();
  
  // Merge events
  const allEvents = [...(events.results || []), ...(projectEvents.results || [])];
  
  return c.json({ 
    project: {
      ...project,
      documents: docs.results || [],
      events: allEvents
    }
  });
});

// Claim project (link to user after auth)
app.post("/api/projects/:id/claim", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ?"
  ).bind(id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  // Only allow claiming if project has no user_id
  if ((project as any).user_id) {
    return c.json({ error: "Projeto já vinculado a um usuário" }, 400);
  }
  
  await c.env.DB.prepare(
    "UPDATE projects SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(user!.id, id).run();
  
  return c.json({ success: true, message: "Projeto vinculado à sua conta!" });
});

// Get user's projects (for dashboard)
app.get("/api/user/projects", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = String(user!.id);
  const userEmail = user!.email;
  
  // Auto-link any orphaned projects by email (created before session was established)
  if (userEmail) {
    await c.env.DB.prepare(`
      UPDATE projects 
      SET user_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE email = ? AND (user_id = '' OR user_id IS NULL OR user_id = '0')
    `).bind(userId, userEmail).run();
  }
  
  const projects = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();
  
  return c.json({ projects: projects.results });
});

// Update project (for wizard submission)
app.patch("/api/projects/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  const body = await c.req.json();
  
  // Verify ownership
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado ou acesso negado" }, 404);
  }
  
  const allowedFields = [
    "document_number", "company_name", "address", "legal_representative",
    "short_description", "full_description", "problem_solution", "revenue_model",
    "target_market", "competitive_advantage", "current_revenue", "growth_info",
    "key_metrics", "team_info", "min_goal", "max_goal", "deadline_date",
    "target_valuation", "equity_offered", "use_of_funds",
    "pitch_deck_url", "social_contract_url", "cap_table_url",
    "financial_report_url", "other_docs_url", "submission_progress"
  ];
  
  const updates: string[] = [];
  const params: any[] = [];
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(body[field]);
    }
  }
  
  if (updates.length === 0) {
    return c.json({ error: "Nenhum campo para atualizar" }, 400);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await c.env.DB.prepare(
    `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...params).run();
  
  return c.json({ success: true, message: "Projeto atualizado!" });
});

// Submit project for review
app.post("/api/projects/:id/submit", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("user");
  
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado ou acesso negado" }, 404);
  }
  
  // Check if already submitted
  if ((project as any).status !== "draft") {
    return c.json({ error: "Projeto já foi submetido" }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE projects 
    SET status = 'pending_review', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();
  
  // Create timeline event
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'status_change', 'Projeto enviado para análise', 'Seu projeto foi submetido e está na fila de análise da equipe Kate.')
  `).bind(id).run();
  
  return c.json({ success: true, message: "Projeto enviado para análise!" });
});

// Get user's project events (for timeline)
app.get("/api/user/project-events", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const events = await c.env.DB.prepare(`
    SELECT pe.*, p.project_name 
    FROM project_events pe
    INNER JOIN projects p ON pe.project_id = p.id
    WHERE p.user_id = ?
    ORDER BY pe.created_at DESC
    LIMIT 20
  `).bind(user!.id).all();
  
  return c.json({ events: events.results });
});

// ============ USER PROFILES ============

// Get user profile
app.get("/api/user-profile", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();
  
  return c.json({ profile: profile || null });
});

// Create or update user profile
app.post("/api/user-profile", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const { role, document_type, document_number, company_name, phone } = body;
  
  // Validate required fields - document_number is optional for capitador (filled later in wizard)
  if (!role || !document_type) {
    return c.json({ error: "Campos obrigatórios: role, document_type" }, 400);
  }
  
  if (!["investidor", "capitador"].includes(role)) {
    return c.json({ error: "Role deve ser 'investidor' ou 'capitador'" }, 400);
  }
  
  if (!["cpf", "cnpj"].includes(document_type)) {
    return c.json({ error: "Tipo de documento deve ser 'cpf' ou 'cnpj'" }, 400);
  }
  
  // Check if profile already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();
  
  // Get user name, email, and avatar from Mocha auth
  const userName = user!.google_user_data?.name || user!.email?.split('@')[0] || null;
  const userEmail = user!.email || null;
  const userAvatar = (user!.google_user_data as any)?.picture || null;
  
  if (existing) {
    // Update existing profile - check if Stellar keys needed
    let stellarPublicKey: string | null = null;
    let stellarSecretKey: string | null = null;
    
    const existingProfile = await c.env.DB.prepare(
      "SELECT stellar_public_key FROM user_profiles WHERE user_id = ?"
    ).bind(user!.id).first<{ stellar_public_key: string | null }>();
    
    if (!existingProfile?.stellar_public_key) {
      try {
        const { StellarClient } = await import("./stellar-client");
        const stellarKeypair = StellarClient.generateKeypair();
        stellarPublicKey = stellarKeypair.publicKey;
        stellarSecretKey = stellarKeypair.secretKey;
      } catch (err) {
        console.error("Failed to generate Stellar keypair:", err);
      }
    }
    
    // Update existing profile
    await c.env.DB.prepare(`
      UPDATE user_profiles SET
        role = ?,
        document_type = ?,
        document_number = ?,
        company_name = ?,
        phone = ?,
        name = ?,
        email = ?,
        avatar_url = ?,
        is_onboarding_complete = 1,
        stellar_public_key = COALESCE(stellar_public_key, ?),
        stellar_secret_key = COALESCE(stellar_secret_key, ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(
      role,
      document_type,
      document_number,
      company_name || null,
      phone || null,
      userName,
      userEmail,
      userAvatar,
      stellarPublicKey,
      stellarSecretKey,
      user!.id
    ).run();
  } else {
    // Generate Stellar keypair for new profile
    let stellarPublicKey: string | null = null;
    let stellarSecretKey: string | null = null;
    try {
      const { StellarClient } = await import("./stellar-client");
      const stellarKeypair = StellarClient.generateKeypair();
      stellarPublicKey = stellarKeypair.publicKey;
      stellarSecretKey = stellarKeypair.secretKey;
    } catch (err) {
      console.error("Failed to generate Stellar keypair:", err);
    }
    
    // Create new profile
    await c.env.DB.prepare(`
      INSERT INTO user_profiles (user_id, role, document_type, document_number, company_name, phone, name, email, avatar_url, is_onboarding_complete, stellar_public_key, stellar_secret_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      user!.id,
      role,
      document_type,
      document_number,
      company_name || null,
      phone || null,
      userName,
      userEmail,
      userAvatar,
      stellarPublicKey,
      stellarSecretKey
    ).run();
  }
  
  // Link any leads with matching email to this user
  if (userEmail) {
    await c.env.DB.prepare(`
      UPDATE leads SET user_id = ?, converted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE email = ? AND user_id IS NULL
    `).bind(user!.id, userEmail).run();
    
    // Also link any draft projects with matching email
    await c.env.DB.prepare(`
      UPDATE projects SET user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ? AND (user_id IS NULL OR user_id = '')
    `).bind(user!.id, userEmail).run();
  }
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();
  
  return c.json({ 
    success: true, 
    profile,
    message: "Perfil salvo com sucesso!" 
  });
});

// Mark welcome modal as seen
app.put("/api/user-profile/welcome-seen", authMiddleware, async (c) => {
  const user = c.get("user");
  
  await c.env.DB.prepare(
    "UPDATE user_profiles SET welcome_seen = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).bind(user!.id).run();
  
  return c.json({ success: true });
});

// Update extended profile fields (used by /app/configuracoes)
app.put("/api/user-profile/extended", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { section, data } = body;

  if (!section || !data) {
    return c.json({ error: "section and data are required" }, 400);
  }

  let updateFields: string[] = [];
  let bindValues: any[] = [];

  if (section === "personal") {
    updateFields = [
      "phone = ?",
      "birth_date = ?",
      "nationality = ?",
      "marital_status = ?",
      "occupation = ?",
      "company_name = ?"
    ];
    bindValues = [
      data.phone || null,
      data.birth_date || null,
      data.nationality || null,
      data.marital_status || null,
      data.occupation || null,
      data.company_name || null
    ];
  } else if (section === "address") {
    updateFields = [
      "address_cep = ?",
      "address_street = ?",
      "address_number = ?",
      "address_complement = ?",
      "address_neighborhood = ?",
      "address_city = ?",
      "address_state = ?"
    ];
    bindValues = [
      data.cep || null,
      data.street || null,
      data.number || null,
      data.complement || null,
      data.neighborhood || null,
      data.city || null,
      data.state || null
    ];
  } else if (section === "investor") {
    updateFields = [
      "income_range = ?",
      "investment_experience = ?",
      "risk_profile = ?"
    ];
    bindValues = [
      data.income_range || null,
      data.investment_experience || null,
      data.risk_profile || null
    ];
  } else if (section === "notifications") {
    updateFields = [
      "notification_email = ?",
      "notification_push = ?",
      "notification_whatsapp = ?"
    ];
    bindValues = [
      data.email ? 1 : 0,
      data.push ? 1 : 0,
      data.whatsapp ? 1 : 0
    ];
  } else {
    return c.json({ error: "Invalid section" }, 400);
  }

  updateFields.push("updated_at = CURRENT_TIMESTAMP");
  bindValues.push(user!.id);

  const sql = `UPDATE user_profiles SET ${updateFields.join(", ")} WHERE user_id = ?`;
  await c.env.DB.prepare(sql).bind(...bindValues).run();

  return c.json({ success: true });
});

// Accept terms endpoint
app.post("/api/user-profile/accept-terms", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const updateFields: string[] = [];
  const bindValues: any[] = [];
  
  if (body.terms) {
    updateFields.push("terms_accepted_at = CURRENT_TIMESTAMP");
  }
  if (body.privacy) {
    updateFields.push("privacy_accepted_at = CURRENT_TIMESTAMP");
  }
  if (body.risk) {
    updateFields.push("risk_accepted_at = CURRENT_TIMESTAMP");
  }
  
  if (updateFields.length === 0) {
    return c.json({ success: true });
  }
  
  updateFields.push("updated_at = CURRENT_TIMESTAMP");
  bindValues.push(user!.id);
  
  const sql = `UPDATE user_profiles SET ${updateFields.join(", ")} WHERE user_id = ?`;
  await c.env.DB.prepare(sql).bind(...bindValues).run();
  
  return c.json({ success: true });
});

// Generate Stellar keypair for existing user
app.post("/api/user-profile/stellar-keypair", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user already has Stellar keypair
  const existing = await c.env.DB.prepare(`
    SELECT stellar_public_key FROM user_profiles WHERE user_id = ?
  `).bind(user!.id).first<{ stellar_public_key: string | null }>();
  
  if (existing?.stellar_public_key) {
    return c.json({ 
      success: true, 
      stellar_public_key: existing.stellar_public_key,
      message: "Carteira Stellar já configurada" 
    });
  }
  
  try {
    const { StellarClient } = await import("./stellar-client");
    const stellarKeypair = StellarClient.generateKeypair();
    
    await c.env.DB.prepare(`
      UPDATE user_profiles SET 
        stellar_public_key = ?,
        stellar_secret_key = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(stellarKeypair.publicKey, stellarKeypair.secretKey, user!.id).run();
    
    return c.json({ 
      success: true, 
      stellar_public_key: stellarKeypair.publicKey,
      message: "Carteira Stellar criada com sucesso" 
    });
  } catch (err) {
    console.error("Failed to generate Stellar keypair:", err);
    return c.json({ success: false, error: "Falha ao criar carteira Stellar" }, 500);
  }
});

// ============ KYC ENDPOINTS ============

// Get KYC data
app.get("/api/user-profile/kyc", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(`
    SELECT 
      kyc_status, kyc_rejection_reason,
      document_type, document_number,
      document_front_url, document_back_url,
      selfie_url, proof_of_address_url,
      bank_code, bank_name, bank_agency, bank_account,
      bank_account_type, bank_pix_key, bank_pix_key_type
    FROM user_profiles WHERE user_id = ?
  `).bind(user!.id).first();
  
  return c.json(profile || {
    kyc_status: "pending",
    kyc_rejection_reason: null,
    document_type: null,
    document_number: null,
    document_front_url: null,
    document_back_url: null,
    selfie_url: null,
    proof_of_address_url: null,
    bank_code: null,
    bank_name: null,
    bank_agency: null,
    bank_account: null,
    bank_account_type: null,
    bank_pix_key: null,
    bank_pix_key_type: null
  });
});

// Update KYC data (save draft)
app.put("/api/user-profile/kyc", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  // Only allow updates if status is pending or rejected
  const currentProfile = await c.env.DB.prepare(
    "SELECT kyc_status FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first<{ kyc_status: string | null }>();
  
  const status = currentProfile?.kyc_status || "pending";
  if (status !== "pending" && status !== "rejected") {
    return c.json({ error: "Não é possível editar após envio para análise" }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE user_profiles SET
      document_type = ?,
      document_number = ?,
      bank_code = ?,
      bank_name = ?,
      bank_agency = ?,
      bank_account = ?,
      bank_account_type = ?,
      bank_pix_key = ?,
      bank_pix_key_type = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(
    body.document_type || null,
    body.document_number || null,
    body.bank_code || null,
    body.bank_name || null,
    body.bank_agency || null,
    body.bank_account || null,
    body.bank_account_type || null,
    body.bank_pix_key || null,
    body.bank_pix_key_type || null,
    user!.id
  ).run();
  
  return c.json({ success: true });
});

// Upload KYC file
app.post("/api/user-profile/kyc/upload", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check status
  const currentProfile = await c.env.DB.prepare(
    "SELECT kyc_status FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first<{ kyc_status: string | null }>();
  
  const status = currentProfile?.kyc_status || "pending";
  if (status !== "pending" && status !== "rejected") {
    return c.json({ error: "Não é possível editar após envio para análise" }, 400);
  }
  
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const field = formData.get("field") as string | null;
  
  if (!file || !field) {
    return c.json({ error: "Arquivo e campo são obrigatórios" }, 400);
  }
  
  const validFields = ["document_front_url", "document_back_url", "selfie_url", "proof_of_address_url"];
  if (!validFields.includes(field)) {
    return c.json({ error: "Campo inválido" }, 400);
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Arquivo muito grande. Máximo 5MB." }, 400);
  }
  
  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    return c.json({ error: "Formato inválido. Use JPG, PNG, WebP ou PDF." }, 400);
  }
  
  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const key = `kyc/${user!.id}/${field}_${timestamp}.${ext}`;
  
  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.R2_BUCKET.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type
    }
  });
  
  // Generate URL
  const url = `/api/files/${key}`;
  
  // Update profile with file URL
  await c.env.DB.prepare(`
    UPDATE user_profiles SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).bind(url, user!.id).run();
  
  return c.json({ success: true, url });
});

// Submit KYC for review
app.post("/api/user-profile/kyc/submit", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check current status
  const currentProfile = await c.env.DB.prepare(
    "SELECT kyc_status, document_type, document_number, document_front_url, selfie_url FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first<{
    kyc_status: string | null;
    document_type: string | null;
    document_number: string | null;
    document_front_url: string | null;
    selfie_url: string | null;
  }>();
  
  const status = currentProfile?.kyc_status || "pending";
  if (status !== "pending" && status !== "rejected") {
    return c.json({ error: "Documentos já enviados para análise" }, 400);
  }
  
  // Validate required fields
  if (!currentProfile?.document_type || !currentProfile?.document_number) {
    return c.json({ error: "Tipo e número do documento são obrigatórios" }, 400);
  }
  
  if (!currentProfile?.document_front_url) {
    return c.json({ error: "Frente do documento é obrigatória" }, 400);
  }
  
  if (!currentProfile?.selfie_url) {
    return c.json({ error: "Selfie com documento é obrigatória" }, 400);
  }
  
  // Update status to submitted
  await c.env.DB.prepare(`
    UPDATE user_profiles SET 
      kyc_status = 'submitted',
      kyc_rejection_reason = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(user!.id).run();
  
  return c.json({ success: true });
});

// Serve KYC files
app.get("/api/files/kyc/:userId/:filename", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = c.req.param("userId");
  const filename = c.req.param("filename");
  
  // Users can only access their own files (admins handled separately)
  if (String(user!.id) !== userId) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  
  const key = `kyc/${userId}/${filename}`;
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "Arquivo não encontrado" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  
  return c.body(object.body, { headers });
});

// ============ INVESTOR CLASSIFICATION (CVM 88) ============

// Get investor classification
app.get("/api/user-profile/classification", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(`
    SELECT 
      income_range, net_worth, investment_experience, risk_tolerance,
      investment_horizon, previous_startup_investments,
      investor_classification, investor_classification_at
    FROM user_profiles WHERE user_id = ?
  `).bind(user!.id).first<{
    income_range: string | null;
    net_worth: string | null;
    investment_experience: string | null;
    risk_tolerance: string | null;
    investment_horizon: string | null;
    previous_startup_investments: string | null;
    investor_classification: string | null;
    investor_classification_at: string | null;
  }>();
  
  return c.json({
    data: {
      income_range: profile?.income_range || "",
      net_worth: profile?.net_worth || "",
      investment_experience: profile?.investment_experience || "",
      risk_tolerance: profile?.risk_tolerance || "",
      investment_horizon: profile?.investment_horizon || "",
      previous_startup_investments: profile?.previous_startup_investments || "",
      investor_classification: profile?.investor_classification || null,
      investor_classification_at: profile?.investor_classification_at || null,
    }
  });
});

// Save investor classification
app.put("/api/user-profile/classification", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    income_range: string;
    net_worth: string;
    investment_experience: string;
    risk_tolerance: string;
    investment_horizon: string;
    previous_startup_investments: string;
    investor_classification: string;
  }>();
  
  const {
    income_range, net_worth, investment_experience,
    risk_tolerance, investment_horizon, previous_startup_investments,
    investor_classification
  } = body;
  
  // Validate classification
  if (!["conservador", "moderado", "arrojado"].includes(investor_classification)) {
    return c.json({ error: "Classificação inválida" }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE user_profiles SET
      income_range = ?,
      net_worth = ?,
      investment_experience = ?,
      risk_tolerance = ?,
      investment_horizon = ?,
      previous_startup_investments = ?,
      investor_classification = ?,
      investor_classification_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(
    income_range, net_worth, investment_experience,
    risk_tolerance, investment_horizon, previous_startup_investments,
    investor_classification, user!.id
  ).run();
  
  return c.json({
    success: true,
    data: {
      income_range,
      net_worth,
      investment_experience,
      risk_tolerance,
      investment_horizon,
      previous_startup_investments,
      investor_classification,
      investor_classification_at: new Date().toISOString(),
    }
  });
});

// ============ OFFERS (Public Equity Crowdfunding) ============

// Get bank config for payment (public)
app.get("/api/platform/bank-config", async (c) => {
  const configs = await c.env.DB.prepare(
    "SELECT config_key, config_value FROM platform_config WHERE config_key IN ('pix_key', 'bank_name', 'bank_agency', 'bank_account', 'bank_account_holder', 'bank_cnpj', 'payment_whatsapp')"
  ).all<{ config_key: string; config_value: string | null }>();
  
  const configMap: Record<string, string> = {};
  for (const row of configs.results || []) {
    configMap[row.config_key] = row.config_value || "";
  }
  
  return c.json({
    config: {
      pix_key: configMap.pix_key || "",
      bank_name: configMap.bank_name || "",
      bank_agency: configMap.bank_agency || "",
      bank_account: configMap.bank_account || "",
      bank_account_holder: configMap.bank_account_holder || "",
      bank_cnpj: configMap.bank_cnpj || "",
      payment_whatsapp: configMap.payment_whatsapp || ""
    }
  });
});

// List active offers (public)
app.get("/api/offers", async (c) => {
  const { category, status, sort, min_investment, limit } = c.req.query();
  
  let query = "SELECT * FROM offers WHERE 1=1";
  const params: (string | number)[] = [];
  
  // Default to active offers
  if (status) {
    query += " AND status = ?";
    params.push(status);
  } else {
    query += " AND status = 'active'";
  }
  
  if (category && category !== "all") {
    query += " AND LOWER(category) = LOWER(?)";
    params.push(category);
  }
  
  if (min_investment) {
    query += " AND min_investment <= ?";
    params.push(parseInt(min_investment));
  }
  
  // Sorting
  switch (sort) {
    case "ending":
      query += " ORDER BY end_date ASC";
      break;
    case "popular":
      query += " ORDER BY investors_count DESC";
      break;
    case "funded":
      query += " ORDER BY current_amount DESC";
      break;
    default:
      query += " ORDER BY created_at DESC";
  }
  
  // Limit results
  if (limit) {
    query += " LIMIT ?";
    params.push(parseInt(limit));
  }
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ offers: result.results });
});

// Create investment (requires auth)
app.post("/api/investments", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const { offer_id, amount } = body;
  
  if (!offer_id || !amount) {
    return c.json({ error: "offer_id e amount são obrigatórios" }, 400);
  }
  
  // Get offer
  const offer = await c.env.DB.prepare(
    "SELECT * FROM offers WHERE id = ? AND status = 'active'"
  ).bind(offer_id).first() as any;
  
  if (!offer) {
    return c.json({ error: "Oferta não encontrada ou não está ativa" }, 404);
  }
  
  // Validate amount
  if (amount < offer.min_investment) {
    return c.json({ error: `Valor mínimo é R$ ${offer.min_investment}` }, 400);
  }
  
  const availableToInvest = offer.max_goal - offer.current_amount;
  if (amount > availableToInvest) {
    return c.json({ error: "Valor excede o disponível para captação" }, 400);
  }
  
  // Check if offer has ended
  const endDate = new Date(offer.end_date);
  if (endDate < new Date()) {
    return c.json({ error: "Esta oferta já foi encerrada" }, 400);
  }
  
  // Check user profile (must be investor)
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first() as any;
  
  if (!profile || !profile.is_onboarding_complete) {
    return c.json({ error: "Complete seu cadastro antes de investir" }, 400);
  }
  
  // Create investment
  const result = await c.env.DB.prepare(`
    INSERT INTO investments (user_id, offer_id, amount, risk_acknowledged_at, status)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'pending')
  `).bind(user!.id, offer_id, amount).run();
  
  // Update offer totals
  await c.env.DB.prepare(`
    UPDATE offers 
    SET current_amount = current_amount + ?,
        investors_count = investors_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(amount, offer_id).run();
  
  return c.json({
    success: true,
    investment_id: result.meta.last_row_id,
    message: "Reserva registrada com sucesso!"
  }, 201);
});

// Get user's wallet (tokens and assets)
app.get("/api/user/wallet", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get user's Hathor address
  const hathorAddress = await c.env.DB.prepare(`
    SELECT hathor_address FROM hathor_addresses WHERE user_id = ?
  `).bind(user!.id).first<{ hathor_address: string }>();
  
  // Get all investments with blockchain data (paid, blockchain_registered, or tokens distributed)
  const investments = await c.env.DB.prepare(`
    SELECT 
      i.id,
      i.offer_id,
      i.amount,
      i.status,
      i.created_at,
      i.paid_at,
      i.project_id,
      i.nft_uid,
      i.nft_tx_hash,
      i.nft_data,
      i.tokens_reserved,
      i.tokens_received,
      i.cotas_reserved,
      i.distribution_tx_hash,
      i.distribution_date,
      i.escrow_tx_hash,
      i.refund_tx_hash,
      i.refund_date,
      o.title as offer_title,
      o.slug as offer_slug,
      o.image_url as offer_image_url,
      o.category as offer_category,
      p.project_name,
      p.token_uid as project_token_uid,
      p.token_symbol as project_token_symbol,
      p.escrow_address as project_escrow_address,
      p.total_tokens as project_total_tokens,
      p.nft_uid as project_nft_uid,
      p.nft_tx_hash as project_nft_tx_hash,
      p.slug as project_slug,
      p.nft_token_link_tx as project_nft_token_link_tx,
      p.blockchain as project_blockchain,
      p.stellar_asset_code,
      p.stellar_asset_issuer,
      i.blockchain as investment_blockchain,
      i.stellar_tx_hash,
      i.stellar_trustline_tx
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    LEFT JOIN projects p ON i.project_id = p.id
    WHERE i.user_id = ? 
      AND i.status IN ('paid', 'escrow_reserved', 'distributing', 'blockchain_registered', 'completed', 'completed_no_nft', 'token_released', 'distributed', 'refunded')
    ORDER BY i.created_at DESC
  `).bind(user!.id).all();
  
  // Calculate totals
  const totalInvested = investments.results.reduce((sum, inv: any) => 
    sum + (inv.amount || 0), 0);
  const totalTokensReserved = investments.results.reduce((sum, inv: any) => 
    sum + (inv.tokens_reserved || 0), 0);
  const totalTokensReceived = investments.results.reduce((sum, inv: any) => 
    sum + (inv.tokens_received || 0), 0);
  const tokensPending = investments.results.reduce((sum, inv: any) => 
    sum + ((inv.tokens_reserved || 0) - (inv.tokens_received || 0)), 0);
  
  // Count unique projects/tokens
  const uniqueTokens = new Set(
    investments.results
      .filter((inv: any) => inv.project_token_symbol)
      .map((inv: any) => inv.project_token_symbol)
  ).size;
  
  // Count pending approvals (paid but not blockchain registered yet)
  const pendingApproval = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM investments 
    WHERE user_id = ? AND status = 'pending'
  `).bind(user!.id).first<{ count: number }>();
  
  // Build assets list with 4 card states:
  // 1. escrow_reserved - Tokens reserved in escrow, waiting for fundraising to end
  // 2. distributing - Tokens being transferred (in progress)
  // 3. completed - Tokens distributed + NFT created
  // 4. refunded - Project didn't reach goal, investment refunded
  const assets = investments.results.map((inv: any) => {
    // Map database status to card state
    let cardState = 'escrow_reserved'; // default
    
    switch (inv.status) {
      case 'paid':
      case 'escrow_reserved':
        cardState = 'escrow_reserved';
        break;
      case 'distributing':
        cardState = 'distributing';
        break;
      case 'completed':
      case 'completed_no_nft':
      case 'blockchain_registered':
      case 'token_released':
      case 'distributed':
        cardState = 'completed';
        break;
      case 'refunded':
        cardState = 'refunded';
        break;
    }
    
    return {
      id: inv.id,
      project_name: inv.project_name || inv.offer_title,
      offer_title: inv.offer_title,
      offer_slug: inv.offer_slug,
      offer_image_url: inv.offer_image_url,
      offer_category: inv.offer_category,
      token_symbol: inv.project_token_symbol,
      token_uid: inv.project_token_uid,
      amount_invested: inv.amount,
      cotas_reserved: inv.cotas_reserved || Math.floor(inv.amount / 1000),
      tokens_reserved: inv.tokens_reserved || 0,
      tokens_received: inv.tokens_received || 0,
      // Project NFT data (único NFT por projeto)
      project_nft_uid: inv.project_nft_uid,
      project_nft_tx_hash: inv.project_nft_tx_hash,
      project_slug: inv.project_slug,
      project_nft_token_link_tx: inv.project_nft_token_link_tx,
      // Blockchain info
      blockchain: inv.investment_blockchain || inv.project_blockchain || 'hathor',
      stellar_asset_code: inv.stellar_asset_code,
      stellar_asset_issuer: inv.stellar_asset_issuer,
      stellar_tx_hash: inv.stellar_tx_hash,
      stellar_trustline_tx: inv.stellar_trustline_tx,
      escrow_tx_hash: inv.escrow_tx_hash,
      distribution_tx_hash: inv.distribution_tx_hash,
      distribution_date: inv.distribution_date,
      refund_tx_hash: inv.refund_tx_hash,
      refund_date: inv.refund_date,
      status: cardState,
      db_status: inv.status,
      investment_date: inv.created_at,
      approved_date: inv.paid_at
    };
  });
  
  // Build transaction history
  const transactions = investments.results.map((inv: any) => {
    const events: any[] = [];
    
    // NFT created event
    if (inv.nft_uid) {
      events.push({
        id: `nft_${inv.id}`,
        type: 'nft_created',
        offer_title: inv.offer_title,
        project_name: inv.project_name || inv.offer_title,
        token_symbol: inv.project_token_symbol,
        tokens_reserved: inv.tokens_reserved,
        amount: inv.amount,
        cotas: inv.cotas_reserved || Math.floor(inv.amount / 1000),
        tx_hash: inv.nft_tx_hash,
        date: inv.paid_at || inv.created_at
      });
    }
    
    // Distribution event
    if (inv.distribution_tx_hash) {
      events.push({
        id: `dist_${inv.id}`,
        type: 'tokens_distributed',
        offer_title: inv.offer_title,
        project_name: inv.project_name || inv.offer_title,
        token_symbol: inv.project_token_symbol,
        tokens_received: inv.tokens_received,
        tx_hash: inv.distribution_tx_hash,
        date: inv.distribution_date
      });
    }
    
    // Refund event
    if (inv.refund_tx_hash) {
      events.push({
        id: `refund_${inv.id}`,
        type: 'refunded',
        offer_title: inv.offer_title,
        project_name: inv.project_name || inv.offer_title,
        amount: inv.amount,
        tx_hash: inv.refund_tx_hash,
        date: inv.refund_date
      });
    }
    
    return events;
  }).flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return c.json({
    hathor_address: hathorAddress?.hathor_address || null,
    assets,
    summary: {
      total_tokens: totalTokensReserved,
      total_tokens_received: totalTokensReceived,
      total_invested: totalInvested,
      assets_count: uniqueTokens,
      pending_tokens: tokensPending > 0 ? tokensPending : 0,
      pending_approval_count: pendingApproval?.count || 0
    },
    transactions: transactions.slice(0, 20)
  });
});

// Get single investment detail
app.get("/api/user/investments/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  const investment = await c.env.DB.prepare(`
    SELECT i.*, 
           o.id as offer_id,
           o.title as offer_title, 
           o.slug as offer_slug, 
           o.short_description as offer_short_description,
           o.image_url as offer_image_url,
           o.category as offer_category,
           o.min_goal as offer_min_goal,
           o.max_goal as offer_max_goal,
           o.current_amount as offer_current_amount,
           o.investors_count as offer_investors_count,
           o.min_investment as offer_min_investment,
           o.start_date as offer_start_date,
           o.end_date as offer_end_date,
           o.valuation as offer_valuation,
           o.equity_offered as offer_equity_offered,
           o.status as offer_status,
           p.slug as project_slug,
           p.nft_uid as project_nft_uid
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    LEFT JOIN projects p ON o.project_id = p.id
    WHERE i.id = ? AND i.user_id = ?
  `).bind(id, user!.id).first() as any;
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Format response
  const formatted = {
    id: investment.id,
    user_id: investment.user_id,
    offer_id: investment.offer_id,
    amount: investment.amount,
    status: investment.status,
    payment_method: investment.payment_method,
    payment_id: investment.payment_id,
    paid_at: investment.paid_at,
    token_amount: investment.token_amount,
    token_released_at: investment.token_released_at,
    refunded_at: investment.refunded_at,
    risk_acknowledged_at: investment.risk_acknowledged_at,
    created_at: investment.created_at,
    updated_at: investment.updated_at,
    // Manual payment fields
    cotas_reserved: investment.cotas_reserved,
    payment_proof_url: investment.payment_proof_url,
    proof_sent_at: investment.proof_sent_at,
    rejection_reason: investment.rejection_reason,
    // Blockchain fields
    nft_uid: investment.nft_uid,
    nft_tx_hash: investment.nft_tx_hash,
    nft_data: investment.nft_data ? JSON.parse(investment.nft_data) : null,
    tokens_reserved: investment.tokens_reserved,
    tokens_received: investment.tokens_received,
    escrow_tx_hash: investment.escrow_tx_hash,
    distribution_tx_hash: investment.distribution_tx_hash,
    distribution_date: investment.distribution_date,
    refund_tx_hash: investment.refund_tx_hash,
    refund_date: investment.refund_date,
    offer: {
      id: investment.offer_id,
      title: investment.offer_title,
      slug: investment.offer_slug,
      short_description: investment.offer_short_description,
      image_url: investment.offer_image_url,
      category: investment.offer_category,
      min_goal: investment.offer_min_goal,
      max_goal: investment.offer_max_goal,
      current_amount: investment.offer_current_amount,
      investors_count: investment.offer_investors_count,
      min_investment: investment.offer_min_investment,
      start_date: investment.offer_start_date,
      end_date: investment.offer_end_date,
      valuation: investment.offer_valuation,
      equity_offered: investment.offer_equity_offered,
      status: investment.offer_status
    },
    project_slug: investment.project_slug,
    project_nft_uid: investment.project_nft_uid
  };
  
  return c.json({ investment: formatted });
});

// Get user's investments
app.get("/api/user/investments", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const investments = await c.env.DB.prepare(`
    SELECT i.*, 
           o.title as offer_title, 
           o.slug as offer_slug, 
           o.image_url as offer_image_url,
           o.category as offer_category,
           o.status as offer_status, 
           o.min_goal as offer_min_goal, 
           o.current_amount as offer_current_amount,
           o.end_date as offer_end_date,
           p.token_uid as project_token_uid,
           p.token_symbol as project_token_symbol,
           p.escrow_address as project_escrow_address
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    LEFT JOIN projects p ON i.project_id = p.id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `).bind(user!.id).all();
  
  return c.json({ investments: investments.results });
});

// Get single offer by slug or ID (public)
app.get("/api/offers/:identifier", async (c) => {
  const identifier = c.req.param("identifier");
  
  let offer;
  if (/^\d+$/.test(identifier)) {
    // It's an ID
    offer = await c.env.DB.prepare(
      "SELECT * FROM offers WHERE id = ?"
    ).bind(parseInt(identifier)).first();
  } else {
    // It's a slug
    offer = await c.env.DB.prepare(
      "SELECT * FROM offers WHERE slug = ?"
    ).bind(identifier).first();
  }
  
  if (!offer) {
    return c.json({ error: "Oferta não encontrada" }, 404);
  }
  
  // Get project details including blockchain fields
  const project = await c.env.DB.prepare(
    `SELECT id, project_name, company_name, short_description, full_description,
     problem_solution, revenue_model, target_market, competitive_advantage,
     current_revenue, growth_info, key_metrics, team_info, website, address,
     category, pitch_deck_url, token_uid, token_symbol, total_tokens,
     escrow_address, is_blockchain_verified, current_raised,
     nft_uid, nft_tx_hash, slug, nft_token_link_tx
     FROM projects WHERE id = ?`
  ).bind((offer as any).project_id).first();
  
  // Get offer updates
  const updates = await c.env.DB.prepare(
    "SELECT * FROM offer_updates WHERE offer_id = ? ORDER BY created_at DESC"
  ).bind((offer as any).id).all();
  
  return c.json({ 
    offer,
    project,
    updates: updates.results
  });
});

// ============ PIX PAYMENTS ============

// Helper to generate PIX code (simulated EMV format)
function generatePixCode(amount: number, txId: string): string {
  // This is a simplified simulation. In production, use a real PIX provider (e.g., Mercado Pago, PagSeguro, etc.)
  const formattedAmount = amount.toFixed(2);
  // Simulated PIX code in EMV format structure
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${txId}520400005303986540${formattedAmount}5802BR5913Kate Invest6008SAOPAULO62070503***6304`;
  return pixCode;
}

// Helper to generate QR code as base64 (simulated - returns a placeholder URL)
function generateQrCodeUrl(pixCode: string): string {
  // In production, use a QR code library like 'qrcode'
  // For now, return a placeholder that generates QR via external service
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
}

// Generate PIX payment for an investment
app.post("/api/investments/:id/pix", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  // Get investment
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first() as any;
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  if (investment.status !== "pending") {
    return c.json({ error: "Este investimento já foi processado" }, 400);
  }
  
  // Check if PIX already exists and is not expired
  const existingPix = await c.env.DB.prepare(
    "SELECT * FROM pix_payments WHERE investment_id = ? AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1"
  ).bind(id).first() as any;
  
  if (existingPix) {
    return c.json({
      pix_payment: {
        id: existingPix.id,
        pix_code: existingPix.pix_code,
        qr_code_url: generateQrCodeUrl(existingPix.pix_code),
        amount: existingPix.amount,
        expires_at: existingPix.expires_at,
        status: existingPix.status
      }
    });
  }
  
  // Generate new PIX payment
  const txId = `KATE${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const pixCode = generatePixCode(investment.amount, txId);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
  
  const result = await c.env.DB.prepare(`
    INSERT INTO pix_payments (investment_id, pix_code, amount, expires_at, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).bind(id, pixCode, investment.amount, expiresAt).run();
  
  // Update investment payment method
  await c.env.DB.prepare(
    "UPDATE investments SET payment_method = 'pix', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(id).run();
  
  return c.json({
    pix_payment: {
      id: result.meta.last_row_id,
      pix_code: pixCode,
      qr_code_url: generateQrCodeUrl(pixCode),
      amount: investment.amount,
      expires_at: expiresAt,
      status: "pending"
    }
  }, 201);
});

// Check PIX payment status
app.get("/api/investments/:id/pix", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  // Get investment
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first() as any;
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Get latest PIX payment
  const pixPayment = await c.env.DB.prepare(
    "SELECT * FROM pix_payments WHERE investment_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(id).first() as any;
  
  if (!pixPayment) {
    return c.json({ error: "Pagamento PIX não encontrado" }, 404);
  }
  
  // Check if expired
  const isExpired = new Date(pixPayment.expires_at) < new Date();
  const status = isExpired && pixPayment.status === "pending" ? "expired" : pixPayment.status;
  
  return c.json({
    pix_payment: {
      id: pixPayment.id,
      pix_code: pixPayment.pix_code,
      qr_code_url: generateQrCodeUrl(pixPayment.pix_code),
      amount: pixPayment.amount,
      expires_at: pixPayment.expires_at,
      status,
      paid_at: pixPayment.paid_at
    },
    investment_status: investment.status
  });
});

// Confirm PIX payment (simulated - in production this would be a webhook from the payment provider)
app.post("/api/investments/:id/pix/confirm", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  // Get investment
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first() as any;
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  if (investment.status !== "pending") {
    return c.json({ error: "Este investimento já foi processado" }, 400);
  }
  
  // Get pending PIX payment
  const pixPayment = await c.env.DB.prepare(
    "SELECT * FROM pix_payments WHERE investment_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1"
  ).bind(id).first() as any;
  
  if (!pixPayment) {
    return c.json({ error: "Pagamento PIX não encontrado ou já processado" }, 404);
  }
  
  // Check if expired
  if (new Date(pixPayment.expires_at) < new Date()) {
    return c.json({ error: "Pagamento PIX expirado. Por favor, gere um novo código." }, 400);
  }
  
  const paymentId = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  
  // Update PIX payment
  await c.env.DB.prepare(`
    UPDATE pix_payments SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(pixPayment.id).run();
  
  // Update investment
  await c.env.DB.prepare(`
    UPDATE investments SET 
      status = 'paid', 
      payment_id = ?,
      paid_at = CURRENT_TIMESTAMP, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(paymentId, id).run();
  
  return c.json({
    success: true,
    message: "Pagamento confirmado com sucesso!",
    payment_id: paymentId
  });
});

// Get presigned URL for proof upload
app.post("/api/investments/:id/upload-proof-url", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const { filename } = await c.req.json();
  
  // Verify investment belongs to user
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first();
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Generate unique filename
  const ext = filename.split('.').pop() || 'pdf';
  const uniqueFilename = `proofs/${id}_${Date.now()}.${ext}`;
  
  // Return direct upload path
  return c.json({
    upload_url: `/api/upload/proof/${id}/${uniqueFilename}`,
    file_url: uniqueFilename
  });
});

// Direct upload proof endpoint
app.put("/api/upload/proof/:investmentId/:path{.+}", authMiddleware, async (c) => {
  const user = c.get("user");
  const investmentId = parseInt(c.req.param("investmentId"));
  const path = c.req.param("path");
  
  // Verify investment belongs to user
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(investmentId, user!.id).first();
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  const body = await c.req.arrayBuffer();
  const contentType = c.req.header("Content-Type") || "application/octet-stream";
  
  await c.env.R2_BUCKET.put(path, body, {
    httpMetadata: { contentType }
  });
  
  return c.json({ success: true });
});

// Save proof URL to investment
app.post("/api/investments/:id/save-proof", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const { proof_url } = await c.req.json();
  
  // Verify investment belongs to user
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first();
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Update investment with proof URL
  await c.env.DB.prepare(`
    UPDATE investments 
    SET payment_proof_url = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(proof_url, id).run();
  
  return c.json({ success: true });
});

// Mark proof as sent (user clicked "já enviei o comprovante")
app.post("/api/investments/:id/proof-sent", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  // Verify investment belongs to user
  const investment = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE id = ? AND user_id = ?"
  ).bind(id, user!.id).first();
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Update investment status to proof_sent (awaiting admin approval)
  await c.env.DB.prepare(`
    UPDATE investments 
    SET status = 'proof_sent', proof_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(id).run();
  
  return c.json({ success: true, message: "Comprovante registrado. Aguarde aprovação." });
});

// Register investment on blockchain (reserves tokens for escrow)
// NOTE: NFT Receipt individual foi removido. Investidores recebem apenas tokens.
// O único NFT é do projeto (criado na aprovação) e vincula ao token após distribuição.
app.post("/api/investments/:id/register-blockchain", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  // Get investment with offer and project details
  const investment = await c.env.DB.prepare(`
    SELECT i.*, o.title as offer_title, o.project_id, p.token_uid, p.token_symbol, p.escrow_address, 
           p.total_tokens, p.max_goal, p.project_name
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    INNER JOIN projects p ON o.project_id = p.id
    WHERE i.id = ? AND i.user_id = ?
  `).bind(id, user!.id).first() as any;
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  if (investment.status !== "paid") {
    return c.json({ error: "Investimento deve estar pago para registrar na blockchain" }, 400);
  }
  
  if (investment.status === "escrow_reserved") {
    return c.json({ error: "Investimento já está registrado no escrow" }, 400);
  }
  
  if (!investment.token_uid || !investment.escrow_address) {
    return c.json({ error: "Projeto não possui token ou endereço de escrow configurado" }, 400);
  }
  
  // Calculate tokens reserved based on investment amount and project goal
  // tokens_reserved = (investment_amount / max_goal) * total_tokens
  const tokensReserved = Math.floor((investment.amount / investment.max_goal) * investment.total_tokens);
  
  if (tokensReserved <= 0) {
    return c.json({ error: "Valor investido muito baixo para reservar tokens" }, 400);
  }
  
  // Calculate cotas based on min_investment (default R$1000 per cota)
  const minInvestment = 1000;
  const cotasReserved = Math.floor(investment.amount / minInvestment);
  
  try {
    // Update investment with escrow reservation (no NFT creation)
    await c.env.DB.prepare(`
      UPDATE investments SET 
        project_id = ?,
        tokens_reserved = ?,
        cotas_reserved = ?,
        status = 'escrow_reserved',
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(investment.project_id, tokensReserved, cotasReserved, id).run();
    
    // Update project current_raised
    await c.env.DB.prepare(`
      UPDATE projects SET 
        current_raised = current_raised + ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(investment.amount, investment.project_id).run();
    
    // Add project event
    await c.env.DB.prepare(`
      INSERT INTO project_events (project_id, event_type, title, description)
      VALUES (?, 'investment_registered', 'Investimento Registrado no Escrow', ?)
    `).bind(
      investment.project_id,
      `Investimento #${id} de R$ ${investment.amount.toLocaleString('pt-BR')} - ${tokensReserved} tokens reservados.`
    ).run();
    
    // Log the reservation
    await c.env.DB.prepare(`
      INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, token_uid, amount, is_success, metadata)
      VALUES (?, ?, ?, 'escrow_reserved', ?, ?, 1, ?)
    `).bind(
      investment.project_id, id, user!.id, investment.token_uid, tokensReserved,
      JSON.stringify({ cotas: cotasReserved, amount_brl: investment.amount })
    ).run();
    
    return c.json({
      success: true,
      message: "Investimento registrado no escrow com sucesso!",
      tokens_reserved: tokensReserved,
      cotas_reserved: cotasReserved
    });
  } catch (error) {
    console.error("Escrow registration error:", error);
    return c.json({ error: "Erro ao registrar investimento no escrow" }, 500);
  }
});

// ============ LEADS ============

// Create a lead (public - for newsletter, landing pages, etc.)
app.post("/api/leads", async (c) => {
  const body = await c.req.json();
  const { email, name, phone, source, source_url, interest_type, metadata } = body;
  
  if (!email || !name || !source) {
    return c.json({ error: "email, name e source são obrigatórios" }, 400);
  }
  
  // Check if lead with same email and source already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM leads WHERE email = ? AND source = ?"
  ).bind(email, source).first();
  
  if (existing) {
    // Update existing lead
    await c.env.DB.prepare(`
      UPDATE leads SET name = ?, phone = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, phone || null, metadata ? JSON.stringify(metadata) : null, (existing as any).id).run();
    
    return c.json({ success: true, message: "Lead atualizado!" });
  }
  
  await c.env.DB.prepare(`
    INSERT INTO leads (email, name, phone, source, source_url, interest_type, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    email,
    name,
    phone || null,
    source,
    source_url || null,
    interest_type || null,
    metadata ? JSON.stringify(metadata) : null
  ).run();
  
  return c.json({ success: true, message: "Lead registrado!" }, 201);
});

// ============ ADMIN ============

// Admin middleware - checks if user is admin
async function adminMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Não autenticado" }, 401);
  }
  
  // Check if admin via session or via ADMIN_EMAIL env
  const adminEmail = c.env.ADMIN_EMAIL;
  if (user.isAdmin || (adminEmail && user.email === adminEmail)) {
    return next();
  }
  
  return c.json({ error: "Acesso negado" }, 403);
}

// Admin KPIs
app.get("/api/admin/kpis", authMiddleware, adminMiddleware, async (c) => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  
  // Investidores
  const totalInvestors = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) as count FROM user_profiles WHERE role = 'investidor'"
  ).first<{ count: number }>();
  
  const newInvestorsMonth = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'investidor' AND created_at >= ?"
  ).bind(firstDayOfMonth).first<{ count: number }>();
  
  const lastMonthInvestors = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'investidor' AND created_at >= ? AND created_at < ?"
  ).bind(lastMonth, firstDayOfMonth).first<{ count: number }>();
  
  const investorsGrowth = lastMonthInvestors?.count ? 
    ((newInvestorsMonth?.count || 0) - lastMonthInvestors.count) / lastMonthInvestors.count * 100 : 0;
  
  // Emissores
  const totalIssuers = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) as count FROM user_profiles WHERE role = 'capitador'"
  ).first<{ count: number }>();
  
  const newIssuersMonth = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'capitador' AND created_at >= ?"
  ).bind(firstDayOfMonth).first<{ count: number }>();
  
  const lastMonthIssuers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'capitador' AND created_at >= ? AND created_at < ?"
  ).bind(lastMonth, firstDayOfMonth).first<{ count: number }>();
  
  const issuersGrowth = lastMonthIssuers?.count ? 
    ((newIssuersMonth?.count || 0) - lastMonthIssuers.count) / lastMonthIssuers.count * 100 : 0;
  
  // Financeiro
  const totalRaised = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(current_amount), 0) as total FROM offers"
  ).first<{ total: number }>();
  
  const raisedThisMonth = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE status IN ('paid', 'token_pending', 'token_released', 'pending_approval', 'escrow_reserved', 'blockchain_registered', 'distributing', 'completed', 'completed_no_nft') AND (paid_at >= ? OR created_at >= ?)"
  ).bind(firstDayOfMonth, firstDayOfMonth).first<{ total: number }>();
  
  const raisedLastMonth = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE status IN ('paid', 'token_pending', 'token_released', 'pending_approval', 'escrow_reserved', 'blockchain_registered', 'distributing', 'completed', 'completed_no_nft') AND (paid_at >= ? OR created_at >= ?) AND (paid_at < ? OR created_at < ?)"
  ).bind(lastMonth, lastMonth, firstDayOfMonth, firstDayOfMonth).first<{ total: number }>();
  
  const raisedGrowth = raisedLastMonth?.total ? 
    ((raisedThisMonth?.total || 0) - raisedLastMonth.total) / raisedLastMonth.total * 100 : 0;
  
  const avgInvestment = await c.env.DB.prepare(
    "SELECT COALESCE(AVG(amount), 0) as avg FROM investments WHERE status IN ('paid', 'token_pending', 'token_released', 'pending_approval', 'escrow_reserved', 'blockchain_registered', 'distributing', 'completed', 'completed_no_nft')"
  ).first<{ avg: number }>();
  
  // Ofertas
  const totalOffers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM offers"
  ).first<{ count: number }>();
  
  const activeOffers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM offers WHERE status = 'active'"
  ).first<{ count: number }>();
  
  const successfulOffers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM offers WHERE status = 'closed_success'"
  ).first<{ count: number }>();
  
  const failedOffers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM offers WHERE status = 'closed_fail'"
  ).first<{ count: number }>();
  
  const closedOffers = (successfulOffers?.count || 0) + (failedOffers?.count || 0);
  const successRate = closedOffers > 0 ? (successfulOffers?.count || 0) / closedOffers * 100 : 0;
  
  // Projetos
  const totalProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects"
  ).first<{ count: number }>();
  
  const pendingProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status = 'pending_review'"
  ).first<{ count: number }>();
  
  const approvedProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status IN ('approved', 'offer_created')"
  ).first<{ count: number }>();
  
  const rejectedProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status = 'rejected'"
  ).first<{ count: number }>();
  
  // Tokens
  const tokensPending = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM token_jobs WHERE status = 'pending'"
  ).first<{ count: number }>();
  
  const tokensCompleted = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM token_jobs WHERE status = 'completed'"
  ).first<{ count: number }>();
  
  const tokensFailed = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM token_jobs WHERE status = 'failed'"
  ).first<{ count: number }>();
  
  // By Category
  const offersByCategory = await c.env.DB.prepare(`
    SELECT category, COUNT(*) as count, COALESCE(SUM(current_amount), 0) as amount 
    FROM offers GROUP BY category ORDER BY amount DESC LIMIT 5
  `).all() as any;
  
  // Monthly raised (last 6 months)
  const monthlyRaised: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = monthStart.toLocaleDateString("pt-BR", { month: "short" });
    
    const result = await c.env.DB.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE status IN ('paid', 'token_pending', 'token_released', 'pending_approval', 'escrow_reserved', 'blockchain_registered', 'distributing', 'completed', 'completed_no_nft') AND (paid_at >= ? OR created_at >= ?) AND (paid_at <= ? OR created_at <= ?)"
    ).bind(monthStart.toISOString(), monthStart.toISOString(), monthEnd.toISOString(), monthEnd.toISOString()).first<{ total: number }>();
    
    monthlyRaised.push({ month: monthName, amount: result?.total || 0 });
  }
  
  return c.json({
    total_investors: totalInvestors?.count || 0,
    new_investors_month: newInvestorsMonth?.count || 0,
    investors_growth: investorsGrowth,
    total_issuers: totalIssuers?.count || 0,
    new_issuers_month: newIssuersMonth?.count || 0,
    issuers_growth: issuersGrowth,
    total_raised: totalRaised?.total || 0,
    raised_this_month: raisedThisMonth?.total || 0,
    raised_growth: raisedGrowth,
    average_investment: avgInvestment?.avg || 0,
    total_offers: totalOffers?.count || 0,
    active_offers: activeOffers?.count || 0,
    successful_offers: successfulOffers?.count || 0,
    failed_offers: failedOffers?.count || 0,
    success_rate: successRate,
    total_projects: totalProjects?.count || 0,
    pending_projects: pendingProjects?.count || 0,
    approved_projects: approvedProjects?.count || 0,
    rejected_projects: rejectedProjects?.count || 0,
    tokens_pending: tokensPending?.count || 0,
    tokens_completed: tokensCompleted?.count || 0,
    tokens_failed: tokensFailed?.count || 0,
    offers_by_category: offersByCategory.results || [],
    monthly_raised: monthlyRaised
  });
});

// Admin Investors list
app.get("/api/admin/investors", authMiddleware, adminMiddleware, async (c) => {
  const { sort } = c.req.query();
  
  let orderBy = "up.created_at DESC";
  if (sort === "invested") orderBy = "total_invested DESC";
  if (sort === "count") orderBy = "investments_count DESC";
  
  const investors = await c.env.DB.prepare(`
    SELECT 
      up.user_id,
      up.name,
      up.email,
      up.avatar_url,
      up.document_type,
      up.document_number,
      up.phone,
      up.created_at,
      COALESCE(SUM(i.amount), 0) as total_invested,
      COUNT(i.id) as investments_count,
      MIN(i.created_at) as first_investment_at,
      MAX(i.created_at) as last_investment_at
    FROM user_profiles up
    LEFT JOIN investments i ON up.user_id = i.user_id AND i.status IN ('paid', 'token_pending', 'token_released', 'pending_approval', 'escrow_reserved', 'blockchain_registered', 'distributing', 'completed', 'completed_no_nft')
    WHERE up.role = 'investidor'
    GROUP BY up.user_id, up.name, up.email, up.avatar_url, up.document_type, up.document_number, up.phone, up.created_at
    ORDER BY ${orderBy}
    LIMIT 100
  `).all() as any;
  
  // Get stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const totalInvestors = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'investidor'"
  ).first<{ count: number }>();
  
  const thisMonth = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'investidor' AND created_at >= ?"
  ).bind(firstDayOfMonth).first<{ count: number }>();
  
  const totalInvested = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE status IN ('paid', 'token_pending', 'token_released', 'pending_approval', 'escrow_reserved', 'blockchain_registered', 'distributing', 'completed', 'completed_no_nft')"
  ).first<{ total: number }>();
  
  return c.json({
    investors: investors.results.map((inv: any) => ({
      ...inv,
      email: inv.email || "",
      name: inv.name || "",
      avatar_url: inv.avatar_url || null
    })),
    stats: {
      total: totalInvestors?.count || 0,
      this_month: thisMonth?.count || 0,
      total_invested: totalInvested?.total || 0
    }
  });
});

// Admin Investor detail
app.get("/api/admin/investors/:userId", authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param("userId");
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first() as any;
  
  if (!profile) {
    return c.json({ error: "Investidor não encontrado" }, 404);
  }
  
  const investments = await c.env.DB.prepare(`
    SELECT i.*, o.title as offer_title
    FROM investments i
    LEFT JOIN offers o ON i.offer_id = o.id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `).bind(userId).all() as any;
  
  const totals = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_invested,
      COUNT(*) as investments_count
    FROM investments 
    WHERE user_id = ? AND status IN ('paid', 'token_pending', 'token_released')
  `).bind(userId).first() as any;
  
  return c.json({
    investor: {
      user_id: userId,
      email: "",
      name: "",
      avatar_url: null,
      document_type: profile.document_type,
      document_number: profile.document_number,
      phone: profile.phone,
      total_invested: totals?.total_invested || 0,
      investments_count: totals?.investments_count || 0,
      created_at: profile.created_at,
      investments: investments.results
    }
  });
});

// Admin: Get KYC files (can view any user's files)
app.get("/api/admin/files/kyc/:userId/:filename", authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param("userId");
  const filename = c.req.param("filename");
  
  const key = `kyc/${userId}/${filename}`;
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "Arquivo não encontrado" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  
  return c.body(object.body, { headers });
});

// Admin: List pending KYC submissions
app.get("/api/admin/kyc/pending", authMiddleware, adminMiddleware, async (c) => {
  const pendingKyc = await c.env.DB.prepare(`
    SELECT 
      user_id, name, email, document_type, document_number,
      document_front_url, document_back_url, selfie_url, proof_of_address_url,
      bank_code, bank_name, bank_agency, bank_account, bank_account_type,
      bank_pix_key, bank_pix_key_type, kyc_status, updated_at
    FROM user_profiles 
    WHERE kyc_status = 'submitted'
    ORDER BY updated_at ASC
  `).all();
  
  return c.json({ submissions: pendingKyc.results || [] });
});

// Admin: Approve KYC
app.post("/api/admin/kyc/:userId/approve", authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param("userId");
  
  const profile = await c.env.DB.prepare(
    "SELECT kyc_status FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first<{ kyc_status: string | null }>();
  
  if (!profile) {
    return c.json({ error: "Usuário não encontrado" }, 404);
  }
  
  if (profile.kyc_status !== "submitted") {
    return c.json({ error: "KYC não está pendente de aprovação" }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE user_profiles SET 
      kyc_status = 'verified',
      kyc_verified_at = CURRENT_TIMESTAMP,
      kyc_rejection_reason = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(userId).run();
  
  // Create notification
  await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, message, created_at, updated_at)
    VALUES (?, 'kyc_approved', 'Documentos aprovados', 'Seus documentos foram verificados com sucesso! Você já pode investir.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(userId).run();
  
  return c.json({ success: true });
});

// Admin: Reject KYC
app.post("/api/admin/kyc/:userId/reject", authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();
  const reason = body.reason || "Documentos inválidos ou ilegíveis";
  
  const profile = await c.env.DB.prepare(
    "SELECT kyc_status FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first<{ kyc_status: string | null }>();
  
  if (!profile) {
    return c.json({ error: "Usuário não encontrado" }, 404);
  }
  
  if (profile.kyc_status !== "submitted") {
    return c.json({ error: "KYC não está pendente de aprovação" }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE user_profiles SET 
      kyc_status = 'rejected',
      kyc_rejection_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(reason, userId).run();
  
  // Create notification
  await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, message, created_at, updated_at)
    VALUES (?, 'kyc_rejected', 'Documentos recusados', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(userId, `Motivo: ${reason}. Por favor, envie novamente.`).run();
  
  return c.json({ success: true });
});

// Admin Issuers list
app.get("/api/admin/issuers", authMiddleware, adminMiddleware, async (c) => {
  const { sort } = c.req.query();
  
  let orderBy = "up.created_at DESC";
  if (sort === "raised") orderBy = "total_raised DESC";
  if (sort === "projects") orderBy = "projects_count DESC";
  
  const issuers = await c.env.DB.prepare(`
    SELECT 
      up.user_id,
      up.name,
      up.email,
      up.avatar_url,
      up.document_type,
      up.document_number,
      up.company_name,
      up.phone,
      up.created_at,
      COUNT(DISTINCT p.id) as projects_count,
      COUNT(DISTINCT CASE WHEN p.status IN ('approved', 'offer_created') THEN p.id END) as approved_projects,
      COUNT(DISTINCT CASE WHEN o.status = 'active' THEN o.id END) as active_offers,
      COALESCE(SUM(o.current_amount), 0) as total_raised
    FROM user_profiles up
    LEFT JOIN projects p ON up.user_id = p.user_id
    LEFT JOIN offers o ON p.id = o.project_id
    WHERE up.role = 'capitador'
    GROUP BY up.user_id, up.name, up.email, up.avatar_url, up.document_type, up.document_number, up.company_name, up.phone, up.created_at
    ORDER BY ${orderBy}
    LIMIT 100
  `).all() as any;
  
  // Get stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const totalIssuers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'capitador'"
  ).first<{ count: number }>();
  
  const thisMonth = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'capitador' AND created_at >= ?"
  ).bind(firstDayOfMonth).first<{ count: number }>();
  
  const totalRaised = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(current_amount), 0) as total FROM offers"
  ).first<{ total: number }>();
  
  return c.json({
    issuers: issuers.results.map((issuer: any) => ({
      ...issuer,
      email: issuer.email || "",
      name: issuer.name || "",
      avatar_url: issuer.avatar_url || null
    })),
    stats: {
      total: totalIssuers?.count || 0,
      this_month: thisMonth?.count || 0,
      total_raised: totalRaised?.total || 0
    }
  });
});

// Admin Issuer detail
app.get("/api/admin/issuers/:userId", authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param("userId");
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first() as any;
  
  if (!profile) {
    return c.json({ error: "Emissor não encontrado" }, 404);
  }
  
  const projects = await c.env.DB.prepare(`
    SELECT 
      p.*,
      o.id as offer_id,
      o.title as offer_title,
      o.status as offer_status,
      o.current_amount as offer_current_amount
    FROM projects p
    LEFT JOIN offers o ON p.id = o.project_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `).bind(userId).all() as any;
  
  const totals = await c.env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT p.id) as projects_count,
      COUNT(DISTINCT CASE WHEN p.status IN ('approved', 'offer_created') THEN p.id END) as approved_projects,
      COUNT(DISTINCT CASE WHEN o.status = 'active' THEN o.id END) as active_offers,
      COALESCE(SUM(o.current_amount), 0) as total_raised
    FROM projects p
    LEFT JOIN offers o ON p.id = o.project_id
    WHERE p.user_id = ?
  `).bind(userId).first() as any;
  
  return c.json({
    issuer: {
      user_id: userId,
      email: "",
      name: "",
      avatar_url: null,
      document_type: profile.document_type,
      document_number: profile.document_number,
      company_name: profile.company_name,
      phone: profile.phone,
      projects_count: totals?.projects_count || 0,
      approved_projects: totals?.approved_projects || 0,
      active_offers: totals?.active_offers || 0,
      total_raised: totals?.total_raised || 0,
      created_at: profile.created_at,
      projects: projects.results
    }
  });
});

// Admin PIX payments list
app.get("/api/admin/pix-payments", authMiddleware, adminMiddleware, async (c) => {
  const { status } = c.req.query();
  
  let whereClause = "";
  if (status && status !== "all") {
    if (status === "expired") {
      whereClause = "WHERE p.status = 'pending' AND p.expires_at < datetime('now')";
    } else {
      whereClause = `WHERE p.status = '${status}'`;
    }
  }
  
  const payments = await c.env.DB.prepare(`
    SELECT 
      p.*,
      i.user_id,
      o.title as offer_title
    FROM pix_payments p
    LEFT JOIN investments i ON p.investment_id = i.id
    LEFT JOIN offers o ON i.offer_id = o.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT 100
  `).all() as any;
  
  // Stats
  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM pix_payments"
  ).first<{ count: number }>();
  
  const pending = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM pix_payments WHERE status = 'pending' AND expires_at > datetime('now')"
  ).first<{ count: number }>();
  
  const paid = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM pix_payments WHERE status = 'paid'"
  ).first<{ count: number }>();
  
  const expired = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM pix_payments WHERE status = 'pending' AND expires_at <= datetime('now')"
  ).first<{ count: number }>();
  
  const totalPaidAmount = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM pix_payments WHERE status = 'paid'"
  ).first<{ total: number }>();
  
  const totalPendingAmount = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM pix_payments WHERE status = 'pending' AND expires_at > datetime('now')"
  ).first<{ total: number }>();
  
  return c.json({
    payments: payments.results,
    stats: {
      total: total?.count || 0,
      pending: pending?.count || 0,
      paid: paid?.count || 0,
      expired: expired?.count || 0,
      total_paid_amount: totalPaidAmount?.total || 0,
      total_pending_amount: totalPendingAmount?.total || 0
    }
  });
});

// Admin pending investments list (bank transfer awaiting approval)
app.get("/api/admin/pending-investments", authMiddleware, adminMiddleware, async (c) => {
  const { status, limit } = c.req.query();
  const queryLimit = limit ? parseInt(limit) : 100;
  
  // Default: pending_payment or proof_sent (awaiting admin approval)
  let whereClause = "WHERE i.status IN ('pending_payment', 'proof_sent')";
  if (status === "approved_today") {
    whereClause = "WHERE i.status = 'paid' AND DATE(i.paid_at) = DATE('now')";
  } else if (status === "rejected") {
    whereClause = "WHERE i.status = 'rejected'";
  } else if (status && status !== "pending") {
    whereClause = `WHERE i.status = '${status}'`;
  }
  
  const investments = await c.env.DB.prepare(`
    SELECT 
      i.*,
      o.title as offer_title,
      o.slug as offer_slug,
      p.project_name,
      p.token_uid as project_token_uid,
      p.token_symbol as project_token_symbol,
      p.total_tokens as project_total_tokens,
      p.escrow_address as project_escrow_address,
      p.max_goal as project_max_goal,
      u.email as user_email,
      up.name as user_name,
      up.phone as user_phone
    FROM investments i
    LEFT JOIN offers o ON i.offer_id = o.id
    LEFT JOIN projects p ON o.project_id = p.id
    LEFT JOIN users u ON CAST(i.user_id AS TEXT) = CAST(u.id AS TEXT)
    LEFT JOIN user_profiles up ON i.user_id = up.user_id
    ${whereClause}
    ORDER BY i.proof_sent_at DESC, i.created_at DESC
    LIMIT ?
  `).bind(queryLimit).all() as any;
  
  // Stats
  const pending = await c.env.DB.prepare(
    "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM investments WHERE status IN ('pending_payment', 'proof_sent')"
  ).first<{ count: number; total: number }>();
  
  const proofSent = await c.env.DB.prepare(
    "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM investments WHERE status = 'proof_sent'"
  ).first<{ count: number; total: number }>();
  
  const approved = await c.env.DB.prepare(
    "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM investments WHERE status = 'paid' AND approved_by_admin_id IS NOT NULL"
  ).first<{ count: number; total: number }>();
  
  const rejected = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM investments WHERE status = 'rejected'"
  ).first<{ count: number }>();
  
  return c.json({
    investments: investments.results,
    stats: {
      pending_count: pending?.count || 0,
      pending_amount: pending?.total || 0,
      proof_sent_count: proofSent?.count || 0,
      proof_sent_amount: proofSent?.total || 0,
      approved_count: approved?.count || 0,
      approved_amount: approved?.total || 0,
      rejected_count: rejected?.count || 0
    }
  });
});

// Get single investment with full details for admin
app.get("/api/admin/investments/:id", authMiddleware, adminMiddleware, async (c) => {
  const investmentId = parseInt(c.req.param("id"));
  
  const investment = await c.env.DB.prepare(`
    SELECT i.*, 
           o.title as offer_title, o.max_goal,
           p.id as project_id, p.project_name, p.company_name, 
           p.token_uid, p.token_symbol, p.escrow_address, p.total_tokens,
           u.email as user_email,
           up.name as user_name, up.phone as user_phone, up.document_number as user_document,
           ha.hathor_address
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    INNER JOIN projects p ON o.project_id = p.id
    INNER JOIN users u ON i.user_id = CAST(u.id AS TEXT)
    LEFT JOIN user_profiles up ON i.user_id = up.user_id
    LEFT JOIN hathor_addresses ha ON i.user_id = ha.user_id
    WHERE i.id = ?
  `).bind(investmentId).first<any>();
  
  if (!investment) {
    return c.json({ error: "Investment not found" }, 404);
  }
  
  return c.json(investment);
});

// Admin approve investment - approves payment and creates blockchain NFT
// APPROVE INVESTMENT - Reserves tokens in escrow (NO NFT created here)
// NFTs are only created when fundraising ends successfully via distribute-tokens endpoint
app.post("/api/admin/investments/:id/approve", authMiddleware, adminMiddleware, async (c) => {
  const investmentId = parseInt(c.req.param("id"));
  const adminUser = c.get("user");
  const adminId = adminUser?.id;
  
  // Get investment with full project details
  const investment = await c.env.DB.prepare(`
    SELECT i.*, o.title as offer_title, o.project_id, 
           p.token_uid, p.token_symbol, p.escrow_address, 
           p.total_tokens, p.max_goal, p.project_name,
           p.blockchain, p.stellar_asset_code, p.stellar_asset_issuer
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    INNER JOIN projects p ON o.project_id = p.id
    WHERE i.id = ?
  `).bind(investmentId).first<any>();
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Accept pending_payment, proof_sent, or pending_approval status
  if (!['pending_payment', 'proof_sent', 'pending_approval'].includes(investment.status)) {
    return c.json({ error: "Este investimento não está aguardando aprovação" }, 400);
  }
  
  // Calculate cotas and tokens
  const minInvestment = 1000;
  const cotasReserved = Math.floor(investment.amount / minInvestment);
  let tokensReserved = 0;
  let investorBlockchainAddress: string | null = null;
  let stellarTrustlineTx: string | null = null;
  
  // Determine which blockchain the project uses
  const projectBlockchain = investment.blockchain || 'hathor';
  
  if (projectBlockchain === 'stellar') {
    // ===== STELLAR BLOCKCHAIN =====
    // Get investor's Stellar keypair from user_profiles
    const investorProfile = await c.env.DB.prepare(
      "SELECT stellar_public_key, stellar_secret_key FROM user_profiles WHERE user_id = ?"
    ).bind(investment.user_id).first<any>();
    
    if (investorProfile?.stellar_public_key) {
      investorBlockchainAddress = investorProfile.stellar_public_key;
      
      // Create trustline for the asset if needed
      if (investment.stellar_asset_code && investment.stellar_asset_issuer && investorProfile.stellar_secret_key) {
        try {
          const { createStellarClient } = await import("./stellar-client");
          const stellarClient = createStellarClient(c.env as any);
          
          if (stellarClient) {
            const trustlineResult = await stellarClient.createTrustline(
              investorProfile.stellar_secret_key,
              investment.stellar_asset_code,
              investment.stellar_asset_issuer
            );
            
            if (trustlineResult.success && trustlineResult.txHash) {
              stellarTrustlineTx = trustlineResult.txHash;
              console.log(`[Stellar] Created trustline for investor ${investment.user_id}: ${stellarTrustlineTx}`);
            }
          }
        } catch (err) {
          console.error("[Stellar] Error creating trustline:", err);
          // Continue without trustline - it can be created later
        }
      }
    }
    
    // Calculate tokens for Stellar
    if (investment.stellar_asset_code && investment.total_tokens > 0) {
      tokensReserved = Math.floor((investment.amount / investment.max_goal) * investment.total_tokens);
      
      // Log escrow reservation to blockchain_logs
      await c.env.DB.prepare(`
        INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, to_address, token_uid, amount, is_success, metadata)
        VALUES (?, ?, ?, 'escrow_reserve', ?, ?, ?, 1, ?)
      `).bind(
        investment.project_id,
        investmentId,
        investment.user_id,
        investment.stellar_asset_issuer,
        investment.stellar_asset_code,
        tokensReserved,
        JSON.stringify({ 
          blockchain: 'stellar',
          cotas: cotasReserved, 
          amount_brl: investment.amount,
          investor_address: investorBlockchainAddress,
          trustline_tx: stellarTrustlineTx,
          note: "Tokens reservados. Serão distribuídos quando a captação for concluída com sucesso."
        })
      ).run();
      
      console.log(`[Stellar] Tokens reserved for investment ${investmentId}: ${tokensReserved} tokens, ${cotasReserved} cotas`);
    }
  } else {
    // ===== HATHOR BLOCKCHAIN (default) =====
    // Get or create investor's Hathor address for future use
    let investorAddress = await c.env.DB.prepare(
      "SELECT hathor_address FROM hathor_addresses WHERE user_id = ?"
    ).bind(investment.user_id).first() as any;
    
    // Create Hathor client
    const hathorClient = createHathorClient(c.env);
    
    // If investor doesn't have Hathor address, create one now (needed for future distribution)
    if (!investorAddress?.hathor_address && hathorClient) {
      try {
        const addressResult = await hathorClient.getNewAddress(true);
        if (addressResult.success && addressResult.data?.address) {
          await c.env.DB.prepare(
            "INSERT INTO hathor_addresses (user_id, hathor_address) VALUES (?, ?)"
          ).bind(investment.user_id, addressResult.data.address).run();
          investorAddress = { hathor_address: addressResult.data.address };
          console.log(`Created Hathor address for investor ${investment.user_id}: ${addressResult.data.address}`);
        }
      } catch (err) {
        console.error("Error creating Hathor address for investor:", err);
      }
    }
    
    investorBlockchainAddress = investorAddress?.hathor_address || null;
    
    // If project has blockchain configured, reserve tokens (but DON'T create NFT)
    if (investment.token_uid && investment.escrow_address && investment.total_tokens > 0) {
      tokensReserved = Math.floor((investment.amount / investment.max_goal) * investment.total_tokens);
      
      // Log escrow reservation to blockchain_logs
      await c.env.DB.prepare(`
        INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, to_address, token_uid, amount, is_success, metadata)
        VALUES (?, ?, ?, 'escrow_reserve', ?, ?, ?, 1, ?)
      `).bind(
        investment.project_id,
        investmentId,
        investment.user_id,
        investment.escrow_address,
        investment.token_uid,
        tokensReserved,
        JSON.stringify({ 
          blockchain: 'hathor',
          cotas: cotasReserved, 
          amount_brl: investment.amount,
          investor_address: investorBlockchainAddress,
          note: "Tokens reserved in escrow. NFT will be created when fundraising ends successfully."
        })
      ).run();
      
      console.log(`[Hathor] Tokens reserved for investment ${investmentId}: ${tokensReserved} tokens, ${cotasReserved} cotas`);
    }
  }
  
  // Update investment to escrow_reserved status (NO NFT yet)
  const newStatus = (tokensReserved > 0) ? 'escrow_reserved' : 'paid';
  await c.env.DB.prepare(`
    UPDATE investments 
    SET status = ?, 
        paid_at = CURRENT_TIMESTAMP,
        approved_by_admin_id = ?, 
        project_id = ?,
        cotas_reserved = ?,
        tokens_reserved = ?,
        blockchain = ?,
        stellar_trustline_tx = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(newStatus, adminId, investment.project_id, cotasReserved, tokensReserved, projectBlockchain, stellarTrustlineTx, investmentId).run();
  
  // Update offer totals
  await c.env.DB.prepare(`
    UPDATE offers 
    SET current_amount = current_amount + ?, 
        investors_count = investors_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(investment.amount, investment.offer_id).run();
  
  // Update project current_raised
  await c.env.DB.prepare(`
    UPDATE projects SET 
      current_raised = current_raised + ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(investment.amount, investment.project_id).run();
  
  // Create notification for investor
  const notificationMessage = tokensReserved > 0
    ? `Seu investimento de R$ ${investment.amount.toLocaleString('pt-BR')} foi aprovado! ${tokensReserved} tokens ${investment.token_symbol} foram reservados. O NFT de comprovação será emitido quando a captação for concluída com sucesso.`
    : `Seu investimento de R$ ${investment.amount.toLocaleString('pt-BR')} foi aprovado e confirmado!`;
  
  await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link, created_at)
    VALUES (?, 'payment_approved', 'Reserva Confirmada! 🎉', ?, ?, CURRENT_TIMESTAMP)
  `).bind(investment.user_id, notificationMessage, `/app/investimentos/${investmentId}`).run();
  
  // Add project event
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'investment_approved', 'Reserva Confirmada', ?)
  `).bind(
    investment.project_id,
    `Investimento #${investmentId} de R$ ${investment.amount.toLocaleString('pt-BR')} (${cotasReserved} cotas, ${tokensReserved} tokens) reservado em escrow`
  ).run();
  
  // Get user and profile for response
  const user = await c.env.DB.prepare("SELECT id, email, name FROM users WHERE id = ?").bind(investment.user_id).first<any>();
  const investorProfile = await c.env.DB.prepare("SELECT name, phone FROM user_profiles WHERE user_id = ?").bind(investment.user_id).first<any>();
  
  // Get updated project current_raised
  const updatedProject = await c.env.DB.prepare("SELECT current_raised FROM projects WHERE id = ?").bind(investment.project_id).first<any>();
  
  return c.json({ 
    success: true, 
    message: tokensReserved > 0 
      ? "Investimento aprovado! Tokens reservados em escrow. NFT será emitido ao final da captação."
      : "Investimento aprovado com sucesso!",
    investment: {
      id: investmentId,
      amount: investment.amount,
      status: newStatus,
      tokens_reserved: tokensReserved,
      cotas_reserved: cotasReserved,
      blockchain: projectBlockchain
    },
    investor: {
      id: investment.user_id,
      name: investorProfile?.name || user?.name || "Investidor",
      email: user?.email,
      blockchain_address: investorBlockchainAddress
    },
    escrow: tokensReserved > 0 ? {
      address: projectBlockchain === 'stellar' ? investment.stellar_asset_issuer : investment.escrow_address,
      tokens_reserved: tokensReserved,
      blockchain: projectBlockchain,
      stellar_trustline_tx: stellarTrustlineTx,
      note: "NFT de comprovação será emitido quando a captação encerrar com sucesso"
    } : null,
    project: {
      id: investment.project_id,
      name: investment.project_name,
      token_uid: investment.token_uid,
      token_symbol: investment.token_symbol,
      escrow_address: investment.escrow_address,
      current_raised: updatedProject?.current_raised || 0
    }
  });
});

// Admin reject investment
app.post("/api/admin/investments/:id/reject", authMiddleware, adminMiddleware, async (c) => {
  const investmentId = parseInt(c.req.param("id"));
  const adminUser = c.get("user");
  const adminId = adminUser?.id;
  const { reason, observations } = await c.req.json<{ reason?: string; observations?: string }>();
  
  // Get investment with project info
  const investment = await c.env.DB.prepare(`
    SELECT i.*, o.project_id, p.project_name
    FROM investments i
    INNER JOIN offers o ON i.offer_id = o.id
    INNER JOIN projects p ON o.project_id = p.id
    WHERE i.id = ?
  `).bind(investmentId).first<any>();
  
  if (!investment) {
    return c.json({ error: "Investimento não encontrado" }, 404);
  }
  
  // Accept pending_payment, proof_sent, or pending_approval status
  if (!['pending_payment', 'proof_sent', 'pending_approval'].includes(investment.status)) {
    return c.json({ error: "Este investimento não está aguardando aprovação" }, 400);
  }
  
  // Build rejection reason
  const fullReason = observations ? `${reason} - ${observations}` : (reason || 'Motivo não especificado');
  
  // Update investment to rejected
  await c.env.DB.prepare(`
    UPDATE investments 
    SET status = 'rejected', 
        rejected_by_admin_id = ?,
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(adminId, fullReason, investmentId).run();
  
  // Create notification for investor
  await c.env.DB.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link, created_at)
    VALUES (?, 'payment_rejected', 'Pagamento Não Aprovado', ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    investment.user_id, 
    `Seu investimento de R$ ${investment.amount.toLocaleString('pt-BR')} não foi aprovado. Motivo: ${fullReason}`,
    `/app/investimentos/${investmentId}`
  ).run();
  
  return c.json({ success: true, message: "Investimento rejeitado" });
});

// Admin config
app.get("/api/admin/config", authMiddleware, adminMiddleware, async (c) => {
  // Get all configs from platform_config table
  const configs = await c.env.DB.prepare(
    "SELECT config_key, config_value FROM platform_config"
  ).all<{ config_key: string; config_value: string | null }>();
  
  // Convert to object
  const configMap: Record<string, string | null> = {};
  for (const row of configs.results || []) {
    configMap[row.config_key] = row.config_value;
  }
  
  return c.json({
    config: {
      min_investment: Number(configMap.min_investment) || 1000,
      max_investment: Number(configMap.max_investment) || 1000000,
      platform_fee_percent: Number(configMap.platform_fee_percent) || 5,
      pix_expiration_hours: Number(configMap.pix_expiration_hours) || 24,
      admin_emails: configMap.admin_emails || "teste@mannah.io",
      require_document_verification: configMap.require_document_verification === "true",
      allow_secondary_market: configMap.allow_secondary_market === "true",
      email_notifications_enabled: configMap.email_notifications_enabled !== "false",
      maintenance_mode: configMap.maintenance_mode === "true",
      // Bank settings
      pix_key: configMap.pix_key || "",
      bank_name: configMap.bank_name || "",
      bank_agency: configMap.bank_agency || "",
      bank_account: configMap.bank_account || "",
      bank_account_holder: configMap.bank_account_holder || "",
      bank_cnpj: configMap.bank_cnpj || "",
      payment_whatsapp: configMap.payment_whatsapp || ""
    }
  });
});

app.put("/api/admin/config", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  
  // List of all config keys to save
  const configKeys = [
    'min_investment', 'max_investment', 'platform_fee_percent', 'pix_expiration_hours',
    'admin_emails', 'require_document_verification', 'allow_secondary_market',
    'email_notifications_enabled', 'maintenance_mode',
    'pix_key', 'bank_name', 'bank_agency', 'bank_account',
    'bank_account_holder', 'bank_cnpj', 'payment_whatsapp'
  ];
  
  // Update each config value
  for (const key of configKeys) {
    if (body[key] !== undefined) {
      const value = typeof body[key] === 'boolean' ? String(body[key]) : String(body[key]);
      
      // Try to update first
      const result = await c.env.DB.prepare(
        "UPDATE platform_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?"
      ).bind(value, key).run();
      
      // If no rows updated, insert
      if (result.meta.changes === 0) {
        await c.env.DB.prepare(
          "INSERT INTO platform_config (config_key, config_value) VALUES (?, ?)"
        ).bind(key, value).run();
      }
    }
  }
  
  return c.json({ success: true });
});

app.get("/api/admin/config/stats", authMiddleware, adminMiddleware, async (c) => {
  const totalUsers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles"
  ).first<{ count: number }>();
  
  const totalInvestors = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'investidor'"
  ).first<{ count: number }>();
  
  const totalIssuers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE role = 'capitador'"
  ).first<{ count: number }>();
  
  const totalProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects"
  ).first<{ count: number }>();
  
  const totalOffers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM offers"
  ).first<{ count: number }>();
  
  return c.json({
    total_users: totalUsers?.count || 0,
    total_investors: totalInvestors?.count || 0,
    total_issuers: totalIssuers?.count || 0,
    total_projects: totalProjects?.count || 0,
    total_offers: totalOffers?.count || 0
  });
});

// Admin leads list
app.get("/api/admin/leads", authMiddleware, adminMiddleware, async (c) => {
  const { source, converted } = c.req.query();
  
  let query = "SELECT * FROM leads WHERE 1=1";
  const params: string[] = [];
  
  if (source) {
    query += " AND source = ?";
    params.push(source);
  }
  
  if (converted === "true") {
    query += " AND user_id IS NOT NULL";
  } else if (converted === "false") {
    query += " AND user_id IS NULL";
  }
  
  query += " ORDER BY created_at DESC LIMIT 200";
  
  const leads = await c.env.DB.prepare(query).bind(...params).all();
  
  // Stats
  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM leads"
  ).first<{ count: number }>();
  
  const convertedCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM leads WHERE user_id IS NOT NULL"
  ).first<{ count: number }>();
  
  const bySource = await c.env.DB.prepare(`
    SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC
  `).all();
  
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const thisMonthCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM leads WHERE created_at >= ?"
  ).bind(thisMonth).first<{ count: number }>();
  
  return c.json({
    leads: leads.results,
    stats: {
      total: total?.count || 0,
      converted: convertedCount?.count || 0,
      conversion_rate: total?.count ? ((convertedCount?.count || 0) / total.count * 100).toFixed(1) : "0",
      this_month: thisMonthCount?.count || 0,
      by_source: (bySource.results || []) as Array<{ source: string; count: number }>
    }
  });
});

// Admin stats
app.get("/api/admin/stats", authMiddleware, adminMiddleware, async (c) => {
  const draftProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status = 'draft'"
  ).first<{ count: number }>();
  
  const pendingProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status = 'pending_review'"
  ).first<{ count: number }>();
  
  const approvedProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status = 'approved'"
  ).first<{ count: number }>();
  
  const activeOffers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM offers WHERE status = 'active'"
  ).first<{ count: number }>();
  
  const totalRaised = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(current_amount), 0) as total FROM offers"
  ).first<{ total: number }>();
  
  const totalInvestors = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) as count FROM investments"
  ).first<{ count: number }>();
  
  // Count all new projects (draft + pending_review) for sidebar badge
  const newProjectsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status IN ('draft', 'pending_review')"
  ).first<{ count: number }>();
  
  return c.json({
    draft_projects: draftProjects?.count || 0,
    pending_projects: pendingProjects?.count || 0,
    approved_projects: approvedProjects?.count || 0,
    active_offers: activeOffers?.count || 0,
    total_raised: totalRaised?.total || 0,
    total_investors: totalInvestors?.count || 0,
    new_projects_count: newProjectsCount?.count || 0
  });
});

// List all projects (admin)
app.get("/api/admin/projects", authMiddleware, adminMiddleware, async (c) => {
  const { status, limit, include_drafts } = c.req.query();
  
  let query = "SELECT * FROM projects WHERE 1=1";
  const params: (string | number)[] = [];
  
  if (status) {
    query += " AND status = ?";
    params.push(status);
  } else if (include_drafts === "true") {
    // Include both drafts and pending_review for dashboard recent list
    query += " AND status IN ('draft', 'pending_review')";
  }
  
  query += " ORDER BY submitted_at DESC NULLS LAST, created_at DESC";
  
  if (limit) {
    query += " LIMIT ?";
    params.push(parseInt(limit));
  }
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ projects: result.results });
});

// Get single project (admin)
app.get("/api/admin/projects/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const project = await c.env.DB.prepare(`
    SELECT p.*, o.id as offer_id, o.status as offer_status 
    FROM projects p 
    LEFT JOIN offers o ON o.project_id = p.id 
    WHERE p.id = ?
  `).bind(id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  return c.json({ project });
});

// Get project investments (admin)
app.get("/api/admin/projects/:id/investments", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  // Check project exists
  const project = await c.env.DB.prepare("SELECT id FROM projects WHERE id = ?").bind(id).first();
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  // Get all investments for this project with user and blockchain data
  const result = await c.env.DB.prepare(`
    SELECT 
      i.*,
      u.email as user_email,
      u.name as user_name,
      up.document_number,
      up.phone as user_phone,
      ha.hathor_address as investor_hathor_address,
      o.title as offer_title
    FROM investments i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN user_profiles up ON up.user_id = i.user_id
    LEFT JOIN hathor_addresses ha ON ha.user_id = i.user_id
    LEFT JOIN offers o ON o.id = i.offer_id
    WHERE i.project_id = ?
    ORDER BY i.created_at DESC
  `).bind(id).all();
  
  // Calculate stats
  const investments = result.results || [];
  const stats = {
    total_count: investments.length,
    total_amount: investments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0),
    blockchain_registered: investments.filter((inv: any) => inv.nft_uid).length,
    tokens_distributed: investments.filter((inv: any) => inv.tokens_received).length,
    refunded: investments.filter((inv: any) => inv.refund_tx_hash).length,
    pending: investments.filter((inv: any) => ['pending_payment', 'proof_sent', 'pending_approval'].includes(inv.status)).length
  };
  
  return c.json({ investments, stats });
});

// Approve project (admin) - creates Project NFT with verification link
app.post("/api/admin/projects/:id/approve", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ?"
  ).bind(id).first() as any;
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  if (project.status !== "pending_review") {
    return c.json({ error: "Projeto não está aguardando análise" }, 400);
  }
  
  // Generate slug if not exists
  let slug = project.slug;
  if (!slug) {
    slug = project.project_name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
      .replace(/[^a-z0-9]+/g, '-')  // replace special chars with hyphen
      .replace(/^-|-$/g, '');       // trim hyphens
    
    // Ensure uniqueness
    const existingSlug = await c.env.DB.prepare(
      "SELECT id FROM projects WHERE slug = ? AND id != ?"
    ).bind(slug, id).first();
    
    if (existingSlug) {
      slug = `${slug}-${id}`;
    }
  }
  
  // Update project status and slug
  await c.env.DB.prepare(`
    UPDATE projects 
    SET status = 'approved', slug = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(slug, id).run();
  
  // Create timeline event
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'status_change', 'Projeto aprovado!', 'Parabéns! Seu projeto foi aprovado pela equipe Kate. Em breve entraremos em contato para os próximos passos.')
  `).bind(id).run();
  
  // Try to create NFT for the project
  let nftCreated = false;
  let nftUid = null;
  
  try {
    const hathorClient = createHathorClient(c.env);
    
    if (hathorClient) {
      // Check wallet status
      const statusResult = await hathorClient.getStatus();
      const walletReady = statusResult.success && statusResult.data?.statusCode === 3;
      
      if (walletReady) {
        // Build NFT data string (must fit in 150 chars)
        const nftDataString = `kate.mocha.app/verificacao/${slug}`;
        
        // Create NFT symbol (max 5 chars)
        const nftSymbol = `K${slug.substring(0, 4).toUpperCase()}`;
        
        // Create NFT on Hathor
        const nftResult = await hathorClient.createNFT({
          name: `Kate - ${project.project_name}`.substring(0, 30),
          symbol: nftSymbol,
          amount: 1,
          data: nftDataString
        });
        
        if (nftResult.success && (nftResult.data?.hash || nftResult.data?.uid)) {
          nftUid = nftResult.data?.hash || nftResult.data?.uid;
          
          // Save NFT UID to project
          await c.env.DB.prepare(`
            UPDATE projects SET nft_uid = ?, nft_tx_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(nftUid, nftUid, id).run();
          
          // Log blockchain operation
          await c.env.DB.prepare(`
            INSERT INTO blockchain_logs (project_id, action, tx_hash, metadata, is_success, created_at)
            VALUES (?, 'project_nft_created', ?, ?, 1, datetime('now'))
          `).bind(
            id, 
            nftUid, 
            JSON.stringify({ slug, nftData: nftDataString, symbol: nftSymbol })
          ).run();
          
          nftCreated = true;
          console.log(`NFT created for project ${id}: ${nftUid}`);
        } else {
          console.error(`Failed to create NFT for project ${id}:`, nftResult.error);
          // Log failure but don't block approval
          await c.env.DB.prepare(`
            INSERT INTO blockchain_logs (project_id, action, metadata, is_success, error_message, created_at)
            VALUES (?, 'project_nft_created', ?, 0, ?, datetime('now'))
          `).bind(id, JSON.stringify({ slug }), nftResult.error || 'Unknown error').run();
        }
      } else {
        console.warn(`Wallet not ready for NFT creation (project ${id})`);
      }
    }
  } catch (nftError: any) {
    console.error(`Error creating NFT for project ${id}:`, nftError);
    // Log error but don't block approval
    await c.env.DB.prepare(`
      INSERT INTO blockchain_logs (project_id, action, metadata, is_success, error_message, created_at)
      VALUES (?, 'project_nft_created', ?, 0, ?, datetime('now'))
    `).bind(id, JSON.stringify({ slug }), nftError.message || 'Unknown error').run();
  }
  
  return c.json({ 
    success: true, 
    message: nftCreated ? "Projeto aprovado e NFT criado!" : "Projeto aprovado! (NFT será criado posteriormente)",
    nft_uid: nftUid,
    slug
  });
});

// Start fundraising for a project (creates token and escrow address)
app.post("/api/admin/projects/:id/start-fundraising", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      return c.json({ success: false, error: "Corpo da requisição inválido" }, 400);
    }
    
    const { offer_id, total_tokens, token_symbol, blockchain = "hathor" } = body;

    if (!offer_id || !total_tokens || !token_symbol) {
      return c.json({ success: false, error: "offer_id, total_tokens e token_symbol são obrigatórios" }, 400);
    }

    // Validate blockchain choice
    if (blockchain !== "hathor" && blockchain !== "stellar") {
      return c.json({ success: false, error: "blockchain deve ser 'hathor' ou 'stellar'" }, 400);
    }

    // Validate token_symbol (max 5 chars, uppercase)
    const symbolClean = token_symbol.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 5);
    if (symbolClean.length < 2) {
      return c.json({ success: false, error: "Símbolo do token deve ter pelo menos 2 caracteres" }, 400);
    }

    // Get project
    const project = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE id = ?"
    ).bind(id).first() as any;

    if (!project) {
      return c.json({ success: false, error: "Projeto não encontrado" }, 404);
    }

    if (project.status !== "approved" && project.status !== "offer_created") {
      return c.json({ success: false, error: "Projeto precisa estar aprovado para iniciar captação" }, 400);
    }

    // Check if project already has a token
    if (project.token_uid) {
      return c.json({ success: false, error: "Projeto já possui um token criado" }, 400);
    }

    // Get offer
    const offer = await c.env.DB.prepare(
      "SELECT * FROM offers WHERE id = ? AND project_id = ?"
    ).bind(offer_id, id).first() as any;

    if (!offer) {
      return c.json({ success: false, error: "Oferta não encontrada ou não pertence a este projeto" }, 404);
    }

    if (offer.status !== "draft") {
      return c.json({ success: false, error: "Oferta precisa estar em rascunho para iniciar captação" }, 400);
    }

    // Generate slug if not exists
    let projectSlug = project.slug;
    if (!projectSlug) {
      projectSlug = project.project_name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const existingSlug = await c.env.DB.prepare(
        "SELECT id FROM projects WHERE slug = ? AND id != ?"
      ).bind(projectSlug, id).first();
      
      if (existingSlug) {
        projectSlug = `${projectSlug}-${id}`;
      }
    }

    // ===== STELLAR BLOCKCHAIN =====
    if (blockchain === "stellar") {
      const stellarClient = createStellarClient(c.env as unknown as import("./stellar-client").StellarEnv);
      if (!stellarClient) {
        return c.json({ success: false, error: "Integração Stellar não configurada" }, 503);
      }

      // Test connection
      try {
        const connectionResult = await stellarClient.testConnection();
        if (!connectionResult.connected) {
          return c.json({ 
            success: false,
            error: "Stellar não está pronto: erro de conexão"
          }, 503);
        }
      } catch (err) {
        return c.json({ 
          success: false,
          error: "Stellar não está pronto: " + (err instanceof Error ? err.message : "erro desconhecido")
        }, 503);
      }

      // Create project asset on Stellar
      let assetResult;
      try {
        assetResult = await stellarClient.createProjectAsset(
          symbolClean,
          total_tokens,
          {
            projectId: id,
            projectName: project.project_name,
            nftUid: project.nft_uid || undefined
          }
        );
      } catch (err) {
        return c.json({ 
          success: false,
          error: "Falha ao criar asset Stellar: " + (err instanceof Error ? err.message : "erro desconhecido")
        }, 500);
      }

      // Update project with Stellar info
      await c.env.DB.prepare(`
        UPDATE projects SET 
          blockchain = 'stellar',
          stellar_asset_code = ?,
          stellar_asset_issuer = ?,
          stellar_tx_hash = ?,
          token_symbol = ?,
          total_tokens = ?,
          slug = ?,
          is_blockchain_verified = 1,
          fundraising_started_at = CURRENT_TIMESTAMP,
          current_raised = 0,
          status = 'fundraising',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        assetResult.assetCode,
        assetResult.issuer,
        assetResult.txHash,
        symbolClean,
        total_tokens,
        projectSlug,
        id
      ).run();

      // Activate the offer
      await c.env.DB.prepare(`
        UPDATE offers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(offer_id).run();

      // Record operation
      await c.env.DB.prepare(`
        INSERT INTO hathor_operations (op_type, request_payload, txid, status)
        VALUES ('stellar_asset_created', ?, ?, 'confirmed')
      `).bind(
        JSON.stringify({ 
          project_id: id, 
          offer_id, 
          symbol: symbolClean, 
          blockchain: "stellar",
          issuer: assetResult.issuer,
          total_tokens 
        }),
        assetResult.txHash
      ).run();

      // Add timeline event
      await c.env.DB.prepare(`
        INSERT INTO project_events (project_id, event_type, title, description)
        VALUES (?, 'fundraising_started', 'Captação iniciada!', ?)
      `).bind(
        id, 
        `Asset ${symbolClean} criado na Stellar com ${total_tokens.toLocaleString("pt-BR")} unidades. A captação está oficialmente aberta para investidores!`
      ).run();

      return c.json({ 
        success: true, 
        message: "Captação iniciada com sucesso na Stellar!",
        data: {
          blockchain: "stellar",
          asset_code: assetResult.assetCode,
          asset_issuer: assetResult.issuer,
          stellar_tx_hash: assetResult.txHash,
          total_tokens: total_tokens,
          explorer_url: stellarClient.getExplorerUrl(assetResult.txHash)
        }
      });
    }

    // ===== HATHOR BLOCKCHAIN (default) =====
    // Create Hathor client
    const hathorClient = createHathorClient(c.env);
    if (!hathorClient) {
      return c.json({ success: false, error: "Integração Hathor não configurada" }, 503);
    }

    // Check wallet status
    const statusResult = await hathorClient.getStatus();
    if (!statusResult.success || (statusResult.data?.statusCode !== 3 && statusResult.data?.statusCode !== undefined)) {
      return c.json({ 
        success: false,
        error: "Carteira Hathor não está pronta. Status: " + (statusResult.data?.statusMessage || statusResult.error || "desconhecido")
      }, 503);
    }

    // STEP 1: Create Project NFT if it doesn't exist yet
    let projectNftUid = project.nft_uid;
    
    if (!projectNftUid) {
      // Create NFT for the project with verification link
      const nftDataString = `kate.mocha.app/verificacao/${projectSlug}`;
      const nftSymbol = `K${projectSlug.substring(0, 4).toUpperCase()}`;
      
      const nftResult = await hathorClient.createNFT({
        name: `Kate - ${project.project_name}`.substring(0, 30),
        symbol: nftSymbol,
        amount: 1,
        data: nftDataString
      });
      
      if (!nftResult.success || (!nftResult.data?.hash && !nftResult.data?.uid)) {
        return c.json({ 
          success: false,
          error: "Falha ao criar NFT do projeto: " + (nftResult.error || "erro desconhecido")
        }, 500);
      }
      
      projectNftUid = nftResult.data?.hash || nftResult.data?.uid;
      
      // Save NFT to project
      await c.env.DB.prepare(`
        UPDATE projects SET nft_uid = ?, nft_tx_hash = ?, slug = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(projectNftUid, projectNftUid, projectSlug, id).run();
      
      // Log NFT creation
      await c.env.DB.prepare(`
        INSERT INTO blockchain_logs (project_id, action, tx_hash, metadata, is_success, created_at)
        VALUES (?, 'project_nft_created', ?, ?, 1, datetime('now'))
      `).bind(
        id,
        projectNftUid,
        JSON.stringify({
          name: `Kate - ${project.project_name}`.substring(0, 30),
          symbol: nftSymbol,
          data: nftDataString
        })
      ).run();
      
      // Create timeline event
      await c.env.DB.prepare(`
        INSERT INTO project_events (project_id, event_type, title, description)
        VALUES (?, 'blockchain', 'NFT do Projeto criado', 'O NFT de certificação do projeto foi criado na blockchain Hathor.')
      `).bind(id).run();
    }

    // STEP 2: Create escrow address for this project
    const addressResult = await hathorClient.getNewAddress();
    if (!addressResult.success || !addressResult.data?.address) {
      return c.json({ success: false, error: "Falha ao criar endereço de escrow: " + (addressResult.error || "erro desconhecido") }, 500);
    }
    const escrowAddress = addressResult.data.address;

    // STEP 3: Create token for this project with NFT reference
    // Format: "ProjectName [NFT:abc123]" - max 30 chars total
    // " [NFT:" (6) + nftRef (8) + "]" (1) = 15 fixed chars, leaves 15 for name
    const nftRef = projectNftUid.substring(0, 8);
    const baseName = project.project_name.substring(0, 15);
    const tokenName = `${baseName} [NFT:${nftRef}]`;
    
    // Hathor API uses amount in "cents" (2 decimal places)
    // So to create 100 tokens, we pass 10000 (100 * 100)
    const tokenAmountInCents = total_tokens * 100;
    
    const createTokenResult = await hathorClient.createToken({
      name: tokenName,
      symbol: symbolClean,
      amount: tokenAmountInCents,
      address: escrowAddress,
      create_mint: true,
      create_melt: true,
    });

    if (!createTokenResult.success || !createTokenResult.data?.hash) {
      const errorDetail = createTokenResult.error || JSON.stringify(createTokenResult.data) || "erro desconhecido";
      console.error("[start-fundraising] Token creation failed:", errorDetail);
      return c.json({ 
        success: false,
        error: "Falha ao criar token: " + errorDetail
      }, 500);
    }

    const tokenTxHash = createTokenResult.data.hash;
    // Token UID is the same as the transaction hash for new tokens
    const tokenUid = tokenTxHash;

    // Update project with token info
    await c.env.DB.prepare(`
      UPDATE projects SET 
        blockchain = 'hathor',
        token_uid = ?,
        token_symbol = ?,
        token_tx_hash = ?,
        total_tokens = ?,
        escrow_address = ?,
        slug = ?,
        is_blockchain_verified = 1,
        fundraising_started_at = CURRENT_TIMESTAMP,
        current_raised = 0,
        status = 'fundraising',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(tokenUid, symbolClean, tokenTxHash, total_tokens, escrowAddress, projectSlug, id).run();

    // Activate the offer
    await c.env.DB.prepare(`
      UPDATE offers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(offer_id).run();

    // Record token operation
    await c.env.DB.prepare(`
      INSERT INTO hathor_operations (op_type, request_payload, txid, status)
      VALUES ('token_created', ?, ?, 'confirmed')
    `).bind(
      JSON.stringify({ project_id: id, offer_id, symbol: symbolClean, name: tokenName, escrow_address: escrowAddress, total_tokens }),
      tokenTxHash
    ).run();

    // Add timeline event
    await c.env.DB.prepare(`
      INSERT INTO project_events (project_id, event_type, title, description)
      VALUES (?, 'fundraising_started', 'Captação iniciada!', ?)
    `).bind(
      id, 
      `Token ${symbolClean} criado com ${total_tokens.toLocaleString("pt-BR")} unidades. A captação está oficialmente aberta para investidores!`
    ).run();

    return c.json({ 
      success: true, 
      message: "Captação iniciada com sucesso!",
      data: {
        blockchain: "hathor",
        token_uid: tokenUid,
        token_symbol: symbolClean,
        token_tx_hash: tokenTxHash,
        escrow_address: escrowAddress,
        total_tokens: total_tokens
      }
    });
  } catch (error) {
    console.error("Error in start-fundraising:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno ao criar token" 
    }, 500);
  }
});

// Admin endpoint to distribute tokens AND create NFTs when goal is reached
// This is the ONLY place where NFTs are created - after successful fundraising ends
app.post("/api/admin/projects/:id/distribute-tokens", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));

  // Get project with offer info (including blockchain type)
  const project = await c.env.DB.prepare(`
    SELECT p.*, o.min_goal, o.max_goal, o.id as offer_id, o.end_date,
           p.blockchain, p.stellar_asset_code, p.stellar_asset_issuer
    FROM projects p
    LEFT JOIN offers o ON o.project_id = p.id
    WHERE p.id = ?
  `).bind(id).first() as any;

  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }

  if (project.status !== "fundraising") {
    return c.json({ error: "Projeto não está em captação" }, 400);
  }

  // Determine blockchain type
  const projectBlockchain = project.blockchain || "hathor";
  
  // Validate blockchain-specific configuration
  if (projectBlockchain === "stellar") {
    if (!project.stellar_asset_code) {
      return c.json({ error: "Projeto não possui asset Stellar configurado" }, 400);
    }
  } else {
    if (!project.token_uid || !project.escrow_address) {
      return c.json({ error: "Projeto não possui token ou endereço de escrow configurados" }, 400);
    }
  }

  // Check if goal was reached
  const currentRaised = project.current_raised || 0;
  if (currentRaised < project.min_goal) {
    return c.json({ 
      error: `Meta mínima não atingida. Arrecadado: R$ ${currentRaised.toLocaleString("pt-BR")}, Meta: R$ ${project.min_goal.toLocaleString("pt-BR")}`
    }, 400);
  }

  // Get all investments with status escrow_reserved (tokens reserved)
  const investments = await c.env.DB.prepare(`
    SELECT i.*, u.email as user_email, ha.hathor_address, 
           up.name as investor_name, up.is_onboarding_complete,
           up.stellar_public_key, up.stellar_secret_key
    FROM investments i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN hathor_addresses ha ON ha.user_id = i.user_id
    LEFT JOIN user_profiles up ON up.user_id = i.user_id
    WHERE i.project_id = ? AND i.tokens_reserved > 0 AND i.status = 'escrow_reserved'
  `).bind(id).all();

  if (!investments.results || investments.results.length === 0) {
    return c.json({ error: "Nenhum investimento encontrado para distribuição (status escrow_reserved)" }, 404);
  }

  // Create blockchain client based on project type
  let hathorClient: ReturnType<typeof createHathorClient> | null = null;
  let stellarClient: ReturnType<typeof createStellarClient> | null = null;
  
  if (projectBlockchain === "stellar") {
    try {
      stellarClient = createStellarClient(c.env as any);
      const testResult = await stellarClient.testConnection();
      if (!testResult.connected) {
        return c.json({ error: "Integração Stellar não disponível: " + (testResult.network || "desconhecido") }, 503);
      }
    } catch (stellarError: any) {
      return c.json({ error: "Erro ao inicializar cliente Stellar: " + stellarError.message }, 503);
    }
  } else {
    hathorClient = createHathorClient(c.env);
    if (!hathorClient) {
      return c.json({ error: "Integração Hathor não configurada" }, 503);
    }
    
    // Check wallet status
    const statusResult = await hathorClient.getStatus();
    if (!statusResult.success || !statusResult.data?.statusMessage?.includes("Ready")) {
      return c.json({ 
        error: "Carteira Hathor não está pronta. Status: " + (statusResult.data?.statusMessage || statusResult.error || "desconhecido")
      }, 503);
    }
  }

  const results: Array<{
    investment_id: number;
    user_id: string;
    cotas: number;
    tokens: number;
    success: boolean;
    token_tx_hash?: string;
    stellar_tx_hash?: string;
    nft_uid?: string;
    nft_tx_hash?: string;
    error?: string;
  }> = [];

  // Process each investment: transfer tokens
  for (const inv of investments.results as any[]) {
    // Check for blockchain-specific address
    const hasAddress = projectBlockchain === "stellar" 
      ? !!inv.stellar_public_key 
      : !!inv.hathor_address;
    
    if (!hasAddress) {
      results.push({
        investment_id: inv.id,
        user_id: inv.user_id,
        cotas: inv.cotas_reserved || 0,
        tokens: inv.tokens_reserved,
        success: false,
        error: projectBlockchain === "stellar" 
          ? "Investidor não possui chave Stellar cadastrada"
          : "Investidor não possui endereço Hathor cadastrado"
      });
      continue;
    }

    // Mark as distributing
    await c.env.DB.prepare("UPDATE investments SET status = 'distributing', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(inv.id).run();

    try {
      let tokenTxHash: string | undefined;
      let stellarTxHash: string | undefined;
      
      if (projectBlockchain === "stellar" && stellarClient) {
        // Stellar token transfer
        const transferResult = await stellarClient.transferTokens(
          inv.stellar_public_key,
          project.stellar_asset_code,
          inv.tokens_reserved,
          `INV-${inv.id}` // memo
        );
        
        if (!transferResult.success || !transferResult.txHash) {
          results.push({
            investment_id: inv.id,
            user_id: inv.user_id,
            cotas: inv.cotas_reserved || 0,
            tokens: inv.tokens_reserved,
            success: false,
            error: transferResult.error || "Falha na transferência de tokens Stellar"
          });
          await c.env.DB.prepare("UPDATE investments SET status = 'escrow_reserved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(inv.id).run();
          continue;
        }
        
        stellarTxHash = transferResult.txHash;
        
        // Log Stellar distribution
        await c.env.DB.prepare(`
          INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, tx_hash, to_address, amount, is_success, blockchain, metadata)
          VALUES (?, ?, ?, 'token_distributed', ?, ?, ?, 1, 'stellar', ?)
        `).bind(
          id, inv.id, inv.user_id, stellarTxHash, inv.stellar_public_key,
          inv.tokens_reserved,
          JSON.stringify({ cotas: inv.cotas_reserved, amount_brl: inv.amount, asset_code: project.stellar_asset_code })
        ).run();
        
      } else if (hathorClient) {
        // Hathor token transfer (existing logic)
        const tokenValueInCents = inv.tokens_reserved * 100;
        const transferResult = await hathorClient.transfer({
          address: inv.hathor_address,
          value: tokenValueInCents,
          token: project.token_uid
        });

        if (!transferResult.success || !transferResult.data?.hash) {
          results.push({
            investment_id: inv.id,
            user_id: inv.user_id,
            cotas: inv.cotas_reserved || 0,
            tokens: inv.tokens_reserved,
            success: false,
            error: transferResult.error || "Falha na transferência de tokens"
          });
          await c.env.DB.prepare("UPDATE investments SET status = 'escrow_reserved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(inv.id).run();
          continue;
        }

        tokenTxHash = transferResult.data.hash;

        // Log Hathor distribution
        await c.env.DB.prepare(`
          INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, tx_hash, from_address, to_address, token_uid, amount, is_success, blockchain, metadata)
          VALUES (?, ?, ?, 'token_distributed', ?, ?, ?, ?, ?, 1, 'hathor', ?)
        `).bind(
          id, inv.id, inv.user_id, tokenTxHash, project.escrow_address, inv.hathor_address,
          project.token_uid, inv.tokens_reserved,
          JSON.stringify({ cotas: inv.cotas_reserved, amount_brl: inv.amount })
        ).run();
      }
      
      const distributionTxHash = stellarTxHash || tokenTxHash;

      // NOTE: NFT Receipt individual foi removido. Investidores recebem APENAS tokens.
      // O único NFT é do projeto (criado na aprovação) e será vinculado ao token após distribuição.

      // Update investment with distribution data (no individual NFT)
      await c.env.DB.prepare(`
        UPDATE investments SET 
          status = 'completed',
          tokens_received = ?,
          distribution_tx_hash = ?,
          stellar_tx_hash = ?,
          blockchain = ?,
          distribution_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(inv.tokens_reserved, distributionTxHash, stellarTxHash || null, projectBlockchain, inv.id).run();

      // Create notification for investor
      await c.env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link, created_at)
        VALUES (?, 'tokens_distributed', 'Tokens Distribuídos! 🎉', ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        inv.user_id,
        `Parabéns! Seus ${inv.tokens_reserved} tokens ${project.token_symbol} foram transferidos para sua carteira.`,
        `/app/carteira`
      ).run();

      results.push({
        investment_id: inv.id,
        user_id: inv.user_id,
        cotas: inv.cotas_reserved || 0,
        tokens: inv.tokens_reserved,
        success: true,
        token_tx_hash: tokenTxHash,
        stellar_tx_hash: stellarTxHash
      });

    } catch (error: any) {
      console.error(`Distribution error for investment ${inv.id}:`, error);
      results.push({
        investment_id: inv.id,
        user_id: inv.user_id,
        cotas: inv.cotas_reserved || 0,
        tokens: inv.tokens_reserved,
        success: false,
        error: error.message || "Erro inesperado"
      });
      // Revert to escrow_reserved
      await c.env.DB.prepare("UPDATE investments SET status = 'escrow_reserved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(inv.id).run();
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalTokensDistributed = results.filter(r => r.success).reduce((sum, r) => sum + r.tokens, 0);

  // If all distributions succeeded, mark project as completed
  if (successCount === results.length) {
    await c.env.DB.prepare(`
      UPDATE projects SET 
        status = 'completed',
        fundraising_ended_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    // Close the offer
    if (project.offer_id) {
      await c.env.DB.prepare(`
        UPDATE offers SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(project.offer_id).run();
    }

    // PARTE 3: Self-transfer do NFT do projeto para vincular ao token
    // Se o projeto tem NFT (criado na aprovação), faz self-transfer com dados TOKEN:{token_uid}
    if (project.nft_uid && hathorClient) {
      try {
        // Get platform address (owner of project NFT)
        const platformAddressResult = await hathorClient.getNewAddress(false);
        const platformAddress = platformAddressResult.data?.address;
        
        if (platformAddress) {
          // Self-transfer do NFT com output de dados para registro de vinculação com token
          // O output type: "data" grava o token_uid on-chain, visível no Explorer como [Data]
          const linkResult = await hathorClient.sendTx({
            outputs: [
              {
                type: "data",
                data: `TOKEN:${project.token_uid}`
              },
              {
                address: platformAddress, // self-transfer
                value: 1,
                token: project.nft_uid
              }
            ]
          });

          if (linkResult.success && linkResult.data?.hash) {
            const nftTokenLinkTx = linkResult.data.hash;
            
            // Salvar nft_token_link_tx no projeto
            await c.env.DB.prepare(`
              UPDATE projects SET nft_token_link_tx = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `).bind(nftTokenLinkTx, id).run();

            // Log da operação
            await c.env.DB.prepare(`
              INSERT INTO blockchain_logs (project_id, action, tx_hash, token_uid, is_success, metadata)
              VALUES (?, 'nft_token_linked', ?, ?, 1, ?)
            `).bind(
              id, 
              nftTokenLinkTx, 
              project.nft_uid,
              JSON.stringify({ token_uid: project.token_uid })
            ).run();
          } else {
            // Log error but don't block distribution
            console.error(`NFT-Token link failed for project ${id}:`, linkResult.error);
            await c.env.DB.prepare(`
              INSERT INTO blockchain_logs (project_id, action, is_success, error_message)
              VALUES (?, 'nft_token_linked', 0, ?)
            `).bind(id, linkResult.error || "Self-transfer failed").run();
          }
        }
      } catch (linkError: any) {
        console.error(`NFT-Token link error for project ${id}:`, linkError);
        await c.env.DB.prepare(`
          INSERT INTO blockchain_logs (project_id, action, is_success, error_message)
          VALUES (?, 'nft_token_linked', 0, ?)
        `).bind(id, linkError.message || "Unexpected error").run();
      }
    }

    // Add timeline event
    await c.env.DB.prepare(`
      INSERT INTO project_events (project_id, event_type, title, description)
      VALUES (?, 'fundraising_completed', 'Captação Concluída com Sucesso! 🎉', ?)
    `).bind(
      id,
      `${totalTokensDistributed.toLocaleString("pt-BR")} tokens ${project.token_symbol} distribuídos para ${successCount} investidores.`
    ).run();
  }

  return c.json({
    success: successCount > 0,
    message: `${successCount}/${results.length} distribuições de tokens realizadas`,
    data: {
      total_investments: results.length,
      successful: successCount,
      failed: results.length - successCount,
      total_tokens_distributed: totalTokensDistributed,
      project_completed: successCount === results.length,
      details: results
    }
  });
});

// Admin endpoint to refund investors when goal is not reached
app.post("/api/admin/projects/:id/refund-investors", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));

  // Get project with offer info and blockchain config
  const project = await c.env.DB.prepare(`
    SELECT p.*, o.min_goal, o.max_goal, o.end_date, o.id as offer_id,
           p.blockchain, p.stellar_asset_code, p.stellar_asset_issuer
    FROM projects p
    LEFT JOIN offers o ON o.project_id = p.id
    WHERE p.id = ?
  `).bind(id).first() as any;

  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }

  if (project.status !== "fundraising") {
    return c.json({ error: "Projeto não está em captação" }, 400);
  }

  // Check if goal was NOT reached
  const currentRaised = project.current_raised || 0;
  if (currentRaised >= project.min_goal) {
    return c.json({ 
      error: `Meta mínima foi atingida. Use o endpoint de distribuição de tokens. Arrecadado: R$ ${currentRaised.toLocaleString("pt-BR")}, Meta: R$ ${project.min_goal.toLocaleString("pt-BR")}`
    }, 400);
  }

  // Get all investments that need refund
  const investments = await c.env.DB.prepare(`
    SELECT i.*, u.email as user_email, ha.hathor_address,
           up.stellar_public_key, up.stellar_secret_key
    FROM investments i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN hathor_addresses ha ON ha.user_id = i.user_id
    LEFT JOIN user_profiles up ON up.user_id = i.user_id
    WHERE i.project_id = ? AND i.status IN ('paid', 'blockchain_registered', 'escrow_reserved') AND i.refund_tx_hash IS NULL
  `).bind(id).all();

  if (!investments.results || investments.results.length === 0) {
    return c.json({ error: "Nenhum investimento encontrado para reembolso" }, 404);
  }

  // Determine which blockchain the project uses
  const projectBlockchain = project.blockchain || "hathor";

  // Create blockchain client based on project type
  let hathorClient: ReturnType<typeof createHathorClient> | null = null;
  let stellarClient: ReturnType<typeof createStellarClient> | null = null;
  
  if (projectBlockchain === "stellar") {
    try {
      stellarClient = createStellarClient(c.env as any);
      const testResult = await stellarClient.testConnection();
      if (!testResult.connected) {
        return c.json({ error: "Integração Stellar não disponível: " + (testResult.network || "desconhecido") }, 503);
      }
    } catch (stellarError: any) {
      return c.json({ error: "Erro ao inicializar cliente Stellar: " + stellarError.message }, 503);
    }
  } else {
    // Hathor
    hathorClient = createHathorClient(c.env);
    if (!hathorClient) {
      return c.json({ error: "Integração Hathor não configurada" }, 503);
    }

    // Check wallet status
    const statusResult = await hathorClient.getStatus();
    if (!statusResult.success || (statusResult.data?.statusCode !== 3 && statusResult.data?.statusCode !== undefined)) {
      return c.json({ 
        error: "Carteira Hathor não está pronta. Status: " + (statusResult.data?.statusMessage || statusResult.error || "desconhecido")
      }, 503);
    }
  }

  const results: Array<{
    investment_id: number;
    user_id: string;
    amount: number;
    success: boolean;
    tx_hash?: string;
    stellar_tx_hash?: string;
    blockchain: string;
    error?: string;
  }> = [];

  // Refund each investor based on blockchain type
  for (const inv of investments.results as any[]) {
    // Check for appropriate blockchain address
    if (projectBlockchain === "stellar") {
      if (!inv.stellar_public_key) {
        results.push({
          investment_id: inv.id,
          user_id: inv.user_id,
          amount: inv.amount,
          success: false,
          blockchain: "stellar",
          error: "Investidor não possui chave pública Stellar cadastrada"
        });
        continue;
      }

      try {
        // For Stellar refunds, we transfer the tokens back from investor to issuer
        // This effectively "burns" the tokens or returns them to project control
        // Note: In practice, refunds on Stellar typically involve native XLM transfer
        // since the custom asset represents equity, not funds
        
        // Mark as refunded in database (actual fund return would be off-chain)
        const refundTxHash = `REFUND-${Date.now()}-${inv.id}`;
        
        await c.env.DB.prepare(`
          UPDATE investments SET 
            refund_tx_hash = ?,
            stellar_tx_hash = ?,
            blockchain = ?,
            refund_date = CURRENT_TIMESTAMP,
            status = 'refunded',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(refundTxHash, refundTxHash, projectBlockchain, inv.id).run();

        // Log to blockchain_logs
        await c.env.DB.prepare(`
          INSERT INTO blockchain_logs (project_id, investment_id, operation, status, tx_hash, blockchain, details, created_at)
          VALUES (?, ?, 'refund', 'completed', ?, 'stellar', ?, CURRENT_TIMESTAMP)
        `).bind(
          id,
          inv.id,
          refundTxHash,
          JSON.stringify({ 
            investor_stellar_key: inv.stellar_public_key, 
            amount: inv.amount,
            reason: 'goal_not_reached'
          })
        ).run();

        // Create notification
        await c.env.DB.prepare(`
          INSERT INTO notifications (user_id, title, message, type, related_id, related_type, created_at)
          VALUES (?, ?, ?, 'refund', ?, 'investment', CURRENT_TIMESTAMP)
        `).bind(
          inv.user_id,
          "Investimento reembolsado",
          `Seu investimento de R$ ${inv.amount.toLocaleString("pt-BR")} no projeto ${project.name} foi reembolsado pois a meta mínima não foi atingida.`,
          inv.id
        ).run();

        results.push({
          investment_id: inv.id,
          user_id: inv.user_id,
          amount: inv.amount,
          success: true,
          stellar_tx_hash: refundTxHash,
          blockchain: "stellar"
        });
      } catch (error: any) {
        results.push({
          investment_id: inv.id,
          user_id: inv.user_id,
          amount: inv.amount,
          success: false,
          blockchain: "stellar",
          error: error.message || "Erro inesperado"
        });
      }
    } else {
      // Hathor refund
      if (!inv.hathor_address) {
        results.push({
          investment_id: inv.id,
          user_id: inv.user_id,
          amount: inv.amount,
          success: false,
          blockchain: "hathor",
          error: "Investidor não possui endereço Hathor cadastrado"
        });
        continue;
      }

      try {
        // Transfer HTR (native token) back to investor
        const transferResult = await hathorClient!.transfer({
          address: inv.hathor_address,
          value: Math.floor(inv.amount * 100), // Convert to cents/smallest unit
        });

        if (transferResult.success && transferResult.data?.hash) {
          // Update investment record
          await c.env.DB.prepare(`
            UPDATE investments SET 
              refund_tx_hash = ?,
              blockchain = ?,
              refund_date = CURRENT_TIMESTAMP,
              status = 'refunded',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(transferResult.data.hash, projectBlockchain, inv.id).run();

          // Record operation
          await c.env.DB.prepare(`
            INSERT INTO hathor_operations (op_type, request_payload, txid, status)
            VALUES ('refund', ?, ?, 'confirmed')
          `).bind(
            JSON.stringify({ project_id: id, investment_id: inv.id, user_id: inv.user_id, from: project.escrow_address, to: inv.hathor_address, amount: inv.amount, reason: 'goal_not_reached' }),
            transferResult.data.hash
          ).run();

          // Log to blockchain_logs
          await c.env.DB.prepare(`
            INSERT INTO blockchain_logs (project_id, investment_id, operation, status, tx_hash, blockchain, details, created_at)
            VALUES (?, ?, 'refund', 'completed', ?, 'hathor', ?, CURRENT_TIMESTAMP)
          `).bind(
            id,
            inv.id,
            transferResult.data.hash,
            JSON.stringify({ 
              hathor_address: inv.hathor_address, 
              amount: inv.amount,
              reason: 'goal_not_reached'
            })
          ).run();

          // Create notification
          await c.env.DB.prepare(`
            INSERT INTO notifications (user_id, title, message, type, related_id, related_type, created_at)
            VALUES (?, ?, ?, 'refund', ?, 'investment', CURRENT_TIMESTAMP)
          `).bind(
            inv.user_id,
            "Investimento reembolsado",
            `Seu investimento de R$ ${inv.amount.toLocaleString("pt-BR")} no projeto ${project.name} foi reembolsado pois a meta mínima não foi atingida.`,
            inv.id
          ).run();

          results.push({
            investment_id: inv.id,
            user_id: inv.user_id,
            amount: inv.amount,
            success: true,
            tx_hash: transferResult.data.hash,
            blockchain: "hathor"
          });
        } else {
          results.push({
            investment_id: inv.id,
            user_id: inv.user_id,
            amount: inv.amount,
            success: false,
            blockchain: "hathor",
            error: transferResult.error || "Falha na transferência"
          });
        }
      } catch (error: any) {
        results.push({
          investment_id: inv.id,
          user_id: inv.user_id,
          amount: inv.amount,
          success: false,
          blockchain: "hathor",
          error: error.message || "Erro inesperado"
        });
      }
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalRefunded = results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0);

  // If all refunds succeeded, mark project as failed/cancelled
  if (successCount === results.length) {
    await c.env.DB.prepare(`
      UPDATE projects SET 
        status = 'cancelled',
        fundraising_ended_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    // Close the offer
    if (project.offer_id) {
      await c.env.DB.prepare(`
        UPDATE offers SET status = 'cancelled', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(project.offer_id).run();
    }

    // Add timeline event
    await c.env.DB.prepare(`
      INSERT INTO project_events (project_id, event_type, title, description)
      VALUES (?, 'refunds_processed', 'Reembolsos processados', ?)
    `).bind(
      id,
      `A meta mínima de R$ ${project.min_goal.toLocaleString("pt-BR")} não foi atingida. R$ ${totalRefunded.toLocaleString("pt-BR")} foram reembolsados para ${successCount} investidores.`
    ).run();
  }

  return c.json({
    success: successCount > 0,
    message: `${successCount}/${results.length} reembolsos realizados`,
    data: {
      blockchain: projectBlockchain,
      total_investments: results.length,
      successful: successCount,
      failed: results.length - successCount,
      total_refunded: totalRefunded,
      project_cancelled: successCount === results.length,
      details: results
    }
  });
});

// ============ AUTOMATED DEADLINE CHECKING ============

// Cron job endpoint to check and process fundraising deadlines automatically
// Can be called by external cron service or manually by admin
app.post("/api/admin/cron/check-deadlines", authMiddleware, adminMiddleware, async (c) => {
  const results: {
    projects_checked: number;
    max_goal_reached: Array<{ id: number; name: string; action: string; result: any }>;
    deadline_expired_success: Array<{ id: number; name: string; action: string; result: any }>;
    deadline_expired_refund: Array<{ id: number; name: string; action: string; result: any }>;
    errors: Array<{ id: number; name: string; error: string }>;
  } = {
    projects_checked: 0,
    max_goal_reached: [],
    deadline_expired_success: [],
    deadline_expired_refund: [],
    errors: []
  };

  // Create Hathor client
  const hathorClient = createHathorClient(c.env);
  if (!hathorClient) {
    return c.json({ error: "Integração Hathor não configurada" }, 503);
  }

  // Check wallet status
  const statusResult = await hathorClient.getStatus();
  if (!statusResult.success || !statusResult.data?.statusMessage?.includes("Ready")) {
    return c.json({ 
      error: "Carteira Hathor não está pronta. Status: " + (statusResult.data?.statusMessage || statusResult.error || "desconhecido"),
      wallet_status: statusResult.data
    }, 503);
  }

  // Get all active fundraising projects with their offers
  const activeProjects = await c.env.DB.prepare(`
    SELECT p.*, o.min_goal as offer_min_goal, o.max_goal as offer_max_goal, o.end_date as offer_end_date, o.id as offer_id
    FROM projects p
    LEFT JOIN offers o ON o.project_id = p.id
    WHERE p.status = 'fundraising'
  `).all();

  if (!activeProjects.results || activeProjects.results.length === 0) {
    return c.json({
      success: true,
      message: "Nenhum projeto em captação ativa",
      data: results
    });
  }

  results.projects_checked = activeProjects.results.length;
  const now = new Date();

  for (const project of activeProjects.results as any[]) {
    const projectId = project.id;
    const projectName = project.project_name;
    const currentRaised = project.current_raised || 0;
    const minGoal = project.offer_min_goal || project.min_goal || 0;
    const maxGoal = project.offer_max_goal || project.max_goal || 0;
    const endDate = project.offer_end_date || project.deadline_date;
    const deadlineDate = endDate ? new Date(endDate) : null;

    try {
      // CONDITION A: Max goal reached -> immediate close and distribute
      if (maxGoal > 0 && currentRaised >= maxGoal) {
        console.log(`Project ${projectId} (${projectName}): Max goal reached! Current: R$${currentRaised}, Max: R$${maxGoal}`);
        
        // Call internal distribution logic
        const distributeResult = await processDistribution(c.env, projectId, hathorClient);
        
        results.max_goal_reached.push({
          id: projectId,
          name: projectName,
          action: "distribute_tokens",
          result: distributeResult
        });
        continue;
      }

      // CONDITION B: Deadline expired
      if (deadlineDate && now > deadlineDate) {
        // B1: Goal reached -> distribute
        if (currentRaised >= minGoal) {
          console.log(`Project ${projectId} (${projectName}): Deadline expired with goal reached. Current: R$${currentRaised}, Min: R$${minGoal}`);
          
          const distributeResult = await processDistribution(c.env, projectId, hathorClient);
          
          results.deadline_expired_success.push({
            id: projectId,
            name: projectName,
            action: "distribute_tokens",
            result: distributeResult
          });
        } 
        // B2: Goal NOT reached -> refund
        else {
          console.log(`Project ${projectId} (${projectName}): Deadline expired without reaching goal. Current: R$${currentRaised}, Min: R$${minGoal}`);
          
          const refundResult = await processRefunds(c.env, projectId, hathorClient);
          
          results.deadline_expired_refund.push({
            id: projectId,
            name: projectName,
            action: "refund_investors",
            result: refundResult
          });
        }
      }
    } catch (error: any) {
      console.error(`Error processing project ${projectId}:`, error);
      results.errors.push({
        id: projectId,
        name: projectName,
        error: error.message || "Erro desconhecido"
      });
    }
  }

  const totalActions = results.max_goal_reached.length + 
                       results.deadline_expired_success.length + 
                       results.deadline_expired_refund.length;

  return c.json({
    success: true,
    message: `Verificação concluída. ${results.projects_checked} projetos verificados, ${totalActions} ações executadas.`,
    data: results
  });
});

// Helper function to process token distribution for a project
async function processDistribution(env: any, projectId: number, hathorClient: any) {
  // Get project with full details
  const project = await env.DB.prepare(`
    SELECT p.*, o.min_goal, o.max_goal, o.id as offer_id, o.end_date
    FROM projects p
    LEFT JOIN offers o ON o.project_id = p.id
    WHERE p.id = ?
  `).bind(projectId).first() as any;

  if (!project || project.status !== "fundraising") {
    return { success: false, error: "Projeto não está em captação" };
  }

  if (!project.token_uid || !project.escrow_address) {
    return { success: false, error: "Projeto sem configuração blockchain" };
  }

  // Get investments with status escrow_reserved
  const investments = await env.DB.prepare(`
    SELECT i.*, u.email as user_email, ha.hathor_address, up.name as investor_name, up.is_onboarding_complete
    FROM investments i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN hathor_addresses ha ON ha.user_id = i.user_id
    LEFT JOIN user_profiles up ON up.user_id = i.user_id
    WHERE i.project_id = ? AND i.tokens_reserved > 0 AND i.status = 'escrow_reserved'
  `).bind(projectId).all();

  if (!investments.results || investments.results.length === 0) {
    return { success: false, error: "Nenhum investimento para distribuir", total: 0 };
  }

  const results: any[] = [];
  let successCount = 0;
  let totalTokensDistributed = 0;

  for (const inv of investments.results as any[]) {
    if (!inv.hathor_address) {
      results.push({ investment_id: inv.id, success: false, error: "Sem endereço Hathor" });
      continue;
    }

    // Mark as distributing
    await env.DB.prepare("UPDATE investments SET status = 'distributing', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(inv.id).run();

    try {
      // Step 1: Transfer tokens to investor
      // Hathor uses values in "cents" (2 decimal places)
      const tokenValueInCents = inv.tokens_reserved * 100;
      const transferResult = await hathorClient.transfer({
        address: inv.hathor_address,
        value: tokenValueInCents,
        token: project.token_uid
      });

      if (!transferResult.success || !transferResult.data?.hash) {
        results.push({ investment_id: inv.id, success: false, error: transferResult.error || "Falha na transferência" });
        await env.DB.prepare("UPDATE investments SET status = 'escrow_reserved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(inv.id).run();
        continue;
      }

      const tokenTxHash = transferResult.data.hash;

      // Log token distribution
      await env.DB.prepare(`
        INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, tx_hash, from_address, to_address, token_uid, amount, is_success, metadata)
        VALUES (?, ?, ?, 'token_distributed', ?, ?, ?, ?, ?, 1, ?)
      `).bind(
        projectId, inv.id, inv.user_id, tokenTxHash, project.escrow_address, inv.hathor_address,
        project.token_uid, inv.tokens_reserved,
        JSON.stringify({ cotas: inv.cotas_reserved, amount_brl: inv.amount, automated: true })
      ).run();

      // NOTE: NFT Receipt individual foi removido. Investidores recebem APENAS tokens.
      // O único NFT é do projeto (criado na aprovação) e será vinculado ao token após distribuição.

      // Update investment with distribution data (no individual NFT)
      await env.DB.prepare(`
        UPDATE investments SET 
          status = 'completed', tokens_received = ?, distribution_tx_hash = ?, distribution_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(inv.tokens_reserved, tokenTxHash, inv.id).run();

      // Create notification
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link, created_at)
        VALUES (?, 'tokens_distributed', 'Tokens Distribuídos! 🎉', ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        inv.user_id,
        `Seus ${inv.tokens_reserved} tokens ${project.token_symbol} foram transferidos para sua carteira.`,
        `/app/carteira`
      ).run();

      successCount++;
      totalTokensDistributed += inv.tokens_reserved;
      results.push({ investment_id: inv.id, success: true, token_tx: tokenTxHash });

    } catch (error: any) {
      console.error(`Distribution error for investment ${inv.id}:`, error);
      results.push({ investment_id: inv.id, success: false, error: error.message });
      await env.DB.prepare("UPDATE investments SET status = 'escrow_reserved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(inv.id).run();
    }
  }

  // If all succeeded, mark project as completed
  if (successCount === results.length && successCount > 0) {
    await env.DB.prepare(`
      UPDATE projects SET status = 'completed', fundraising_ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(projectId).run();

    if (project.offer_id) {
      await env.DB.prepare(`
        UPDATE offers SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(project.offer_id).run();
    }

    await env.DB.prepare(`
      INSERT INTO project_events (project_id, event_type, title, description)
      VALUES (?, 'fundraising_completed', 'Captação Concluída (Automático) 🎉', ?)
    `).bind(projectId, `${totalTokensDistributed} tokens distribuídos para ${successCount} investidores.`).run();
  }

  return {
    success: successCount > 0,
    total: results.length,
    successful: successCount,
    failed: results.length - successCount,
    tokens_distributed: totalTokensDistributed,
    details: results
  };
}

// Helper function to process refunds for a project
async function processRefunds(env: any, projectId: number, hathorClient: any) {
  const project = await env.DB.prepare(`
    SELECT p.*, o.min_goal, o.max_goal, o.id as offer_id
    FROM projects p
    LEFT JOIN offers o ON o.project_id = p.id
    WHERE p.id = ?
  `).bind(projectId).first() as any;

  if (!project || project.status !== "fundraising") {
    return { success: false, error: "Projeto não está em captação" };
  }

  // Get investments that need refund (escrow_reserved status)
  const investments = await env.DB.prepare(`
    SELECT i.*, ha.hathor_address
    FROM investments i
    LEFT JOIN hathor_addresses ha ON ha.user_id = i.user_id
    WHERE i.project_id = ? AND i.status IN ('escrow_reserved', 'paid', 'blockchain_registered') AND i.refund_tx_hash IS NULL
  `).bind(projectId).all();

  if (!investments.results || investments.results.length === 0) {
    return { success: false, error: "Nenhum investimento para reembolsar", total: 0 };
  }

  const results: any[] = [];
  let successCount = 0;
  let totalRefunded = 0;

  for (const inv of investments.results as any[]) {
    if (!inv.hathor_address) {
      results.push({ investment_id: inv.id, success: false, error: "Sem endereço Hathor" });
      continue;
    }

    try {
      // Transfer HTR back to investor (simulated value in smallest unit)
      const transferResult = await hathorClient.transfer({
        address: inv.hathor_address,
        value: Math.floor(inv.amount * 100)
      });

      if (transferResult.success && transferResult.data?.hash) {
        await env.DB.prepare(`
          UPDATE investments SET refund_tx_hash = ?, refund_date = CURRENT_TIMESTAMP, status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(transferResult.data.hash, inv.id).run();

        await env.DB.prepare(`
          INSERT INTO blockchain_logs (project_id, investment_id, user_id, action, tx_hash, to_address, amount, is_success, metadata)
          VALUES (?, ?, ?, 'refund', ?, ?, ?, 1, ?)
        `).bind(projectId, inv.id, inv.user_id, transferResult.data.hash, inv.hathor_address, inv.amount, JSON.stringify({ automated: true })).run();

        // Notify investor
        await env.DB.prepare(`
          INSERT INTO notifications (user_id, type, title, message, link, created_at)
          VALUES (?, 'refund_processed', 'Investimento Reembolsado', ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          inv.user_id,
          `A captação do projeto não atingiu a meta mínima. Seu investimento de R$ ${inv.amount.toLocaleString('pt-BR')} foi reembolsado.`,
          `/app/investimentos/${inv.id}`
        ).run();

        successCount++;
        totalRefunded += inv.amount;
        results.push({ investment_id: inv.id, success: true, tx_hash: transferResult.data.hash });
      } else {
        results.push({ investment_id: inv.id, success: false, error: transferResult.error || "Falha no reembolso" });
      }
    } catch (error: any) {
      results.push({ investment_id: inv.id, success: false, error: error.message });
    }
  }

  // If all succeeded, mark project as cancelled
  if (successCount === results.length && successCount > 0) {
    await env.DB.prepare(`
      UPDATE projects SET status = 'cancelled', fundraising_ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(projectId).run();

    if (project.offer_id) {
      await env.DB.prepare(`
        UPDATE offers SET status = 'cancelled', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(project.offer_id).run();
    }

    await env.DB.prepare(`
      INSERT INTO project_events (project_id, event_type, title, description)
      VALUES (?, 'refunds_processed', 'Reembolsos Processados (Automático)', ?)
    `).bind(projectId, `Meta não atingida. R$ ${totalRefunded.toLocaleString('pt-BR')} reembolsados para ${successCount} investidores.`).run();
  }

  return {
    success: successCount > 0,
    total: results.length,
    successful: successCount,
    failed: results.length - successCount,
    total_refunded: totalRefunded,
    details: results
  };
}

// ============ ADMIN OFFERS ============

// List all offers (admin)
app.get("/api/admin/offers", authMiddleware, adminMiddleware, async (c) => {
  const { status } = c.req.query();
  
  let query = `
    SELECT o.*, p.project_name, p.company_name 
    FROM offers o
    LEFT JOIN projects p ON o.project_id = p.id
    WHERE 1=1
  `;
  const params: string[] = [];
  
  if (status) {
    query += " AND o.status = ?";
    params.push(status);
  }
  
  query += " ORDER BY o.created_at DESC";
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json({ offers: result.results });
});

// Create offer (admin)
app.post("/api/admin/offers", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  
  const {
    project_id,
    title,
    slug,
    short_description,
    full_description,
    image_url,
    min_goal,
    max_goal,
    min_investment,
    start_date,
    end_date,
    valuation,
    equity_offered,
    use_of_funds,
    risks
  } = body;
  
  if (!project_id || !title || !slug || !short_description || !min_goal || !max_goal || !start_date || !end_date) {
    return c.json({ error: "Campos obrigatórios faltando" }, 400);
  }
  
  // Check if project exists and is approved
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND status = 'approved'"
  ).bind(project_id).first() as any;
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado ou não aprovado" }, 404);
  }
  
  // Check if slug is unique
  const existingSlug = await c.env.DB.prepare(
    "SELECT id FROM offers WHERE slug = ?"
  ).bind(slug).first();
  
  if (existingSlug) {
    return c.json({ error: "Já existe uma oferta com este slug" }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO offers (
      project_id, title, slug, short_description, full_description, image_url,
      category, min_goal, max_goal, min_investment, start_date, end_date,
      valuation, equity_offered, use_of_funds, risks, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).bind(
    project_id,
    title,
    slug,
    short_description,
    full_description || project.full_description || "",
    image_url || null,
    project.category,
    min_goal,
    max_goal,
    min_investment || 1000,
    start_date,
    end_date,
    valuation || null,
    equity_offered || null,
    use_of_funds || null,
    risks || null
  ).run();
  
  // Update project status to show it has an offer
  await c.env.DB.prepare(
    "UPDATE projects SET status = 'offer_created', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(project_id).run();
  
  // Add event to project timeline
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'offer_created', 'Oferta criada', 'A equipe Kate criou uma oferta pública para seu projeto.')
  `).bind(project_id).run();
  
  return c.json({ 
    success: true, 
    offer_id: result.meta.last_row_id,
    message: "Oferta criada com sucesso!" 
  }, 201);
});

// Update offer (admin)
app.put("/api/admin/offers/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const offer = await c.env.DB.prepare(
    "SELECT * FROM offers WHERE id = ?"
  ).bind(id).first();
  
  if (!offer) {
    return c.json({ error: "Oferta não encontrada" }, 404);
  }
  
  // Check slug uniqueness if changed
  if (body.slug && body.slug !== (offer as any).slug) {
    const existingSlug = await c.env.DB.prepare(
      "SELECT id FROM offers WHERE slug = ? AND id != ?"
    ).bind(body.slug, id).first();
    
    if (existingSlug) {
      return c.json({ error: "Já existe uma oferta com este slug" }, 400);
    }
  }
  
  await c.env.DB.prepare(`
    UPDATE offers SET
      title = ?,
      slug = ?,
      short_description = ?,
      image_url = ?,
      min_goal = ?,
      max_goal = ?,
      min_investment = ?,
      start_date = ?,
      end_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.title,
    body.slug,
    body.short_description,
    body.image_url || null,
    body.min_goal,
    body.max_goal,
    body.min_investment,
    body.start_date,
    body.end_date,
    id
  ).run();
  
  return c.json({ success: true, message: "Oferta atualizada!" });
});

// Close offer (admin) - creates token jobs or refunds
app.post("/api/admin/offers/:id/close", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { close_type } = await c.req.json();
  
  if (!["success", "fail"].includes(close_type)) {
    return c.json({ error: "Tipo de encerramento inválido" }, 400);
  }
  
  const offer = await c.env.DB.prepare(
    "SELECT * FROM offers WHERE id = ?"
  ).bind(id).first() as any;
  
  if (!offer) {
    return c.json({ error: "Oferta não encontrada" }, 404);
  }
  
  if (offer.status !== "active") {
    return c.json({ error: "Apenas ofertas ativas podem ser encerradas" }, 400);
  }
  
  const newStatus = close_type === "success" ? "closed_success" : "closed_fail";
  
  // Get all investments for this offer
  const investments = await c.env.DB.prepare(
    "SELECT * FROM investments WHERE offer_id = ? AND status IN ('pending', 'confirmed')"
  ).bind(id).all() as any;
  
  if (close_type === "success") {
    // Create token jobs for each investment
    for (const inv of investments.results) {
      // Calculate token amount (simplified: 1 token per R$1)
      const tokenAmount = inv.amount;
      
      await c.env.DB.prepare(`
        INSERT INTO token_jobs (offer_id, investment_id, user_id, status, provider, token_amount)
        VALUES (?, ?, ?, 'pending', 'simulated', ?)
      `).bind(id, inv.id, inv.user_id, tokenAmount).run();
      
      // Update investment status
      await c.env.DB.prepare(
        "UPDATE investments SET status = 'token_pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(inv.id).run();
    }
  } else {
    // Mark investments for refund
    for (const inv of investments.results) {
      await c.env.DB.prepare(
        "UPDATE investments SET status = 'refund_pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(inv.id).run();
    }
  }
  
  // Update offer status
  await c.env.DB.prepare(`
    UPDATE offers SET status = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(newStatus, id).run();
  
  // Add event to project timeline
  const eventTitle = close_type === "success" 
    ? "Captação encerrada com sucesso!" 
    : "Captação encerrada sem atingir meta";
  const eventDesc = close_type === "success"
    ? `A oferta atingiu a meta e foi encerrada. ${investments.results.length} investidores receberão seus tokens.`
    : `A oferta foi encerrada sem atingir a meta mínima. ${investments.results.length} investimentos serão reembolsados.`;
  
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'offer_closed', ?, ?)
  `).bind(offer.project_id, eventTitle, eventDesc).run();
  
  return c.json({ 
    success: true, 
    message: close_type === "success" 
      ? `Oferta encerrada! ${investments.results.length} Token Jobs criados.`
      : `Oferta encerrada. ${investments.results.length} investimentos marcados para reembolso.`
  });
});

// Update offer status (admin)
app.patch("/api/admin/offers/:id/status", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { status } = await c.req.json();
  
  if (!["draft", "active", "closed_success", "closed_fail"].includes(status)) {
    return c.json({ error: "Status inválido" }, 400);
  }
  
  const offer = await c.env.DB.prepare(
    "SELECT * FROM offers WHERE id = ?"
  ).bind(id).first() as any;
  
  if (!offer) {
    return c.json({ error: "Oferta não encontrada" }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE offers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(status, id).run();
  
  // Add event to project timeline
  const statusMessages: Record<string, string> = {
    active: "A oferta foi ativada e está disponível para investimentos.",
    draft: "A oferta foi pausada temporariamente.",
    closed_success: "A oferta foi encerrada com sucesso! Meta atingida.",
    closed_fail: "A oferta foi encerrada sem atingir a meta mínima."
  };
  
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'offer_status', 'Status da oferta alterado', ?)
  `).bind(offer.project_id, statusMessages[status] || "Status alterado").run();
  
  return c.json({ success: true, message: "Status atualizado!" });
});

// Reject project (admin)
app.post("/api/admin/projects/:id/reject", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const { reason } = await c.req.json();
  
  if (!reason) {
    return c.json({ error: "Motivo da rejeição é obrigatório" }, 400);
  }
  
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ?"
  ).bind(id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  if ((project as any).status !== "pending_review") {
    return c.json({ error: "Projeto não está aguardando análise" }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE projects 
    SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(reason, id).run();
  
  // Create timeline event
  await c.env.DB.prepare(`
    INSERT INTO project_events (project_id, event_type, title, description)
    VALUES (?, 'status_change', 'Projeto não aprovado', ?)
  `).bind(id, `Motivo: ${reason}`).run();
  
  return c.json({ success: true, message: "Projeto rejeitado." });
});

// ============ ADMIN TOKEN JOBS ============

// List token jobs (admin)
app.get("/api/admin/token-jobs", authMiddleware, adminMiddleware, async (c) => {
  const { status } = c.req.query();
  
  let query = `
    SELECT tj.*, o.title as offer_title, i.amount as investment_amount
    FROM token_jobs tj
    LEFT JOIN offers o ON tj.offer_id = o.id
    LEFT JOIN investments i ON tj.investment_id = i.id
    WHERE 1=1
  `;
  const params: string[] = [];
  
  if (status) {
    query += " AND tj.status = ?";
    params.push(status);
  }
  
  query += " ORDER BY tj.created_at DESC";
  
  const result = await c.env.DB.prepare(query).bind(...params).all();
  
  // Get stats
  const statsResult = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM token_jobs
  `).first() as any;
  
  return c.json({ 
    jobs: result.results,
    stats: {
      total: statsResult?.total || 0,
      pending: statsResult?.pending || 0,
      processing: statsResult?.processing || 0,
      completed: statsResult?.completed || 0,
      failed: statsResult?.failed || 0,
    }
  });
});

// Process single token job (admin) - simulated
app.post("/api/admin/token-jobs/:id/process", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const job = await c.env.DB.prepare(
    "SELECT * FROM token_jobs WHERE id = ?"
  ).bind(id).first() as any;
  
  if (!job) {
    return c.json({ error: "Token Job não encontrado" }, 404);
  }
  
  if (job.status !== "pending") {
    return c.json({ error: "Job não está pendente" }, 400);
  }
  
  // Mark as processing
  await c.env.DB.prepare(
    "UPDATE token_jobs SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(id).run();
  
  // Simulate token creation (in production, this would call Hathor API)
  const simulatedTxId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Mark as completed
  await c.env.DB.prepare(`
    UPDATE token_jobs SET 
      status = 'completed', 
      tx_id = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(simulatedTxId, id).run();
  
  // Update investment
  await c.env.DB.prepare(`
    UPDATE investments SET 
      status = 'token_released',
      token_amount = ?,
      token_released_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(job.token_amount, job.investment_id).run();
  
  return c.json({ success: true, message: "Token Job processado (simulado)", tx_id: simulatedTxId });
});

// Retry failed token job (admin)
app.post("/api/admin/token-jobs/:id/retry", authMiddleware, adminMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const job = await c.env.DB.prepare(
    "SELECT * FROM token_jobs WHERE id = ?"
  ).bind(id).first() as any;
  
  if (!job) {
    return c.json({ error: "Token Job não encontrado" }, 404);
  }
  
  if (job.status !== "failed") {
    return c.json({ error: "Apenas jobs com falha podem ser reprocessados" }, 400);
  }
  
  // Reset to pending
  await c.env.DB.prepare(`
    UPDATE token_jobs SET 
      status = 'pending', 
      error_message = NULL,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(id).run();
  
  return c.json({ success: true, message: "Job resetado para pendente" });
});

// Process all pending token jobs (admin)
app.post("/api/admin/token-jobs/process-all", authMiddleware, adminMiddleware, async (c) => {
  const pendingJobs = await c.env.DB.prepare(
    "SELECT id FROM token_jobs WHERE status = 'pending'"
  ).all() as any;
  
  let processed = 0;
  let failed = 0;
  
  for (const job of pendingJobs.results) {
    try {
      // Mark as processing
      await c.env.DB.prepare(
        "UPDATE token_jobs SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(job.id).run();
      
      // Get full job data
      const fullJob = await c.env.DB.prepare(
        "SELECT * FROM token_jobs WHERE id = ?"
      ).bind(job.id).first() as any;
      
      // Simulate token creation
      const simulatedTxId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mark as completed
      await c.env.DB.prepare(`
        UPDATE token_jobs SET 
          status = 'completed', 
          tx_id = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(simulatedTxId, job.id).run();
      
      // Update investment
      await c.env.DB.prepare(`
        UPDATE investments SET 
          status = 'token_released',
          token_amount = ?,
          token_released_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(fullJob.token_amount, fullJob.investment_id).run();
      
      processed++;
    } catch (e) {
      // Mark as failed
      await c.env.DB.prepare(`
        UPDATE token_jobs SET 
          status = 'failed', 
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(String(e), job.id).run();
      failed++;
    }
  }
  
  return c.json({ 
    success: true, 
    message: `${processed} jobs processados, ${failed} falharam`,
    processed,
    failed
  });
});

// ============ BLOCKCHAIN LOGS ============

// Get blockchain logs for audit (admin)
app.get("/api/admin/blockchain-logs", authMiddleware, adminMiddleware, async (c) => {
  const { project_id, action, is_success, page = "1", limit = "50" } = c.req.query();
  
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);
  const offset = (pageNum - 1) * limitNum;
  
  let whereConditions: string[] = [];
  let params: any[] = [];
  
  if (project_id) {
    whereConditions.push("bl.project_id = ?");
    params.push(parseInt(project_id));
  }
  
  if (action) {
    whereConditions.push("bl.action = ?");
    params.push(action);
  }
  
  if (is_success !== undefined && is_success !== "") {
    whereConditions.push("bl.is_success = ?");
    params.push(is_success === "true" ? 1 : 0);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
  
  const countQuery = `SELECT COUNT(*) as total FROM blockchain_logs bl ${whereClause}`;
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;
  
  const logsQuery = `
    SELECT 
      bl.*,
      p.project_name,
      u.email as user_email,
      up.name as user_name,
      i.amount as investment_amount,
      i.cotas_reserved as investment_cotas
    FROM blockchain_logs bl
    LEFT JOIN projects p ON bl.project_id = p.id
    LEFT JOIN users u ON bl.user_id = u.id
    LEFT JOIN user_profiles up ON bl.user_id = up.user_id
    LEFT JOIN investments i ON bl.investment_id = i.id
    ${whereClause}
    ORDER BY bl.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const logs = await c.env.DB.prepare(logsQuery).bind(...params, limitNum, offset).all();
  
  // Get distinct actions for filter
  const actionsResult = await c.env.DB.prepare("SELECT DISTINCT action FROM blockchain_logs ORDER BY action").all();
  const actions = actionsResult.results?.map((r: any) => r.action) || [];
  
  // Get projects for filter
  const projectsResult = await c.env.DB.prepare(`
    SELECT DISTINCT p.id, p.project_name 
    FROM blockchain_logs bl 
    JOIN projects p ON bl.project_id = p.id 
    ORDER BY p.project_name
  `).all();
  const projects = projectsResult.results || [];
  
  return c.json({
    logs: logs.results || [],
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    filters: {
      actions,
      projects
    }
  });
});

// Get hathor operations for audit (admin)
app.get("/api/admin/hathor-operations", authMiddleware, adminMiddleware, async (c) => {
  const { op_type, status, page = "1", limit = "50" } = c.req.query();
  
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);
  const offset = (pageNum - 1) * limitNum;
  
  let whereConditions: string[] = [];
  let params: any[] = [];
  
  if (op_type) {
    whereConditions.push("ho.op_type = ?");
    params.push(op_type);
  }
  
  if (status) {
    whereConditions.push("ho.status = ?");
    params.push(status);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
  
  const countQuery = `SELECT COUNT(*) as total FROM hathor_operations ho ${whereClause}`;
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;
  
  const opsQuery = `
    SELECT 
      ho.*,
      u.email as user_email,
      up.name as user_name
    FROM hathor_operations ho
    LEFT JOIN users u ON ho.user_id = u.id
    LEFT JOIN user_profiles up ON ho.user_id = up.user_id
    ${whereClause}
    ORDER BY ho.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const operations = await c.env.DB.prepare(opsQuery).bind(...params, limitNum, offset).all();
  
  // Get distinct op_types for filter
  const opTypesResult = await c.env.DB.prepare("SELECT DISTINCT op_type FROM hathor_operations ORDER BY op_type").all();
  const opTypes = opTypesResult.results?.map((r: any) => r.op_type) || [];
  
  return c.json({
    operations: operations.results || [],
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    filters: {
      opTypes,
      statuses: ['pending', 'success', 'failed']
    }
  });
});

// ============ BLOCKCHAIN MANAGEMENT ============

// Get blockchain management stats
app.get("/api/admin/blockchain/stats", authMiddleware, adminMiddleware, async (c) => {
  // Tokens created (projects with token_uid)
  const tokensResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE token_uid IS NOT NULL"
  ).first<{ count: number }>();
  
  // NFTs issued (investments with nft_uid)
  const nftsResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM investments WHERE nft_uid IS NOT NULL"
  ).first<{ count: number }>();
  
  // Total in escrow (sum of investments in escrow - blockchain_registered status)
  const escrowResult = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM investments 
    WHERE status IN ('blockchain_registered', 'paid') 
    AND EXISTS (SELECT 1 FROM projects p WHERE p.id = investments.project_id AND p.escrow_address IS NOT NULL)
  `).first<{ total: number }>();
  
  // Total operations
  const opsResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM blockchain_logs"
  ).first<{ count: number }>();
  
  return c.json({
    tokens_created: tokensResult?.count || 0,
    nfts_issued: nftsResult?.count || 0,
    total_in_escrow: escrowResult?.total || 0,
    total_operations: opsResult?.count || 0
  });
});

// Get tokenized projects
app.get("/api/admin/blockchain/projects", authMiddleware, adminMiddleware, async (c) => {
  const projects = await c.env.DB.prepare(`
    SELECT 
      p.id,
      p.project_name,
      p.token_uid,
      p.token_symbol,
      p.total_tokens,
      p.escrow_address,
      p.current_raised,
      p.status,
      p.fundraising_started_at,
      p.fundraising_ended_at,
      (SELECT COALESCE(SUM(tokens_reserved), 0) FROM investments WHERE project_id = p.id AND tokens_reserved IS NOT NULL) as tokens_in_circulation,
      (SELECT COUNT(*) FROM investments WHERE project_id = p.id AND status IN ('paid', 'blockchain_registered', 'distributed')) as investors_count
    FROM projects p
    WHERE p.token_uid IS NOT NULL
    ORDER BY p.fundraising_started_at DESC NULLS LAST, p.created_at DESC
  `).all();
  
  return c.json({ projects: projects.results || [] });
});

// Get investment NFTs
app.get("/api/admin/blockchain/nfts", authMiddleware, adminMiddleware, async (c) => {
  // Retorna NFTs de projetos (1 NFT por projeto, não por investidor)
  const nfts = await c.env.DB.prepare(`
    SELECT 
      p.id,
      p.project_name as name,
      p.slug,
      p.nft_uid,
      p.nft_tx_hash,
      p.nft_token_link_tx,
      p.token_uid,
      p.token_symbol,
      p.status,
      p.approved_at,
      p.fundraising_started_at
    FROM projects p
    WHERE p.nft_uid IS NOT NULL OR p.status IN ('approved', 'fundraising', 'completed')
    ORDER BY p.approved_at DESC, p.created_at DESC
  `).all();
  
  return c.json({ nfts: nfts.results || [] });
});

// Get escrow addresses with balances
app.get("/api/admin/blockchain/escrow", authMiddleware, adminMiddleware, async (c) => {
  const escrow = await c.env.DB.prepare(`
    SELECT 
      p.id,
      p.project_name,
      p.escrow_address,
      p.token_symbol,
      p.status,
      p.current_raised,
      (SELECT COALESCE(SUM(tokens_reserved), 0) FROM investments WHERE project_id = p.id AND tokens_reserved IS NOT NULL) as tokens_reserved,
      (SELECT COUNT(DISTINCT user_id) FROM investments WHERE project_id = p.id AND status IN ('paid', 'blockchain_registered')) as investors_count
    FROM projects p
    WHERE p.escrow_address IS NOT NULL
    ORDER BY p.created_at DESC
  `).all();
  
  return c.json({ escrow: escrow.results || [] });
});

// ============ MESSAGES ============

// Get user's conversations (grouped by project)
app.get("/api/user/conversations", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get all projects for this user that have messages
  const conversations = await c.env.DB.prepare(`
    SELECT 
      p.id as project_id,
      p.project_name,
      p.status as project_status,
      (SELECT COUNT(*) FROM messages WHERE project_id = p.id AND is_read = 0 AND sender_type = 'admin') as unread_count,
      (SELECT content FROM messages WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
      (SELECT sender_type FROM messages WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as last_sender_type
    FROM projects p
    WHERE p.user_id = ?
    AND EXISTS (SELECT 1 FROM messages WHERE project_id = p.id)
    ORDER BY last_message_at DESC
  `).bind(user!.id).all();
  
  // Also get projects without messages (for starting new conversations)
  const projectsWithoutMessages = await c.env.DB.prepare(`
    SELECT id as project_id, project_name, status as project_status
    FROM projects
    WHERE user_id = ?
    AND NOT EXISTS (SELECT 1 FROM messages WHERE project_id = projects.id)
    ORDER BY created_at DESC
  `).bind(user!.id).all();
  
  return c.json({ 
    conversations: conversations.results,
    projects_without_messages: projectsWithoutMessages.results
  });
});

// Get messages for a project
app.get("/api/user/messages/:projectId", authMiddleware, async (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Verify user owns this project
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).bind(projectId, user!.id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  // Get messages
  const messages = await c.env.DB.prepare(`
    SELECT * FROM messages 
    WHERE project_id = ? 
    ORDER BY created_at ASC
  `).bind(projectId).all();
  
  // Mark admin messages as read
  await c.env.DB.prepare(`
    UPDATE messages 
    SET is_read = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE project_id = ? AND sender_type = 'admin' AND is_read = 0
  `).bind(projectId).run();
  
  return c.json({ 
    messages: messages.results,
    project: {
      id: (project as any).id,
      project_name: (project as any).project_name,
      status: (project as any).status
    }
  });
});

// Send a message
app.post("/api/user/messages/:projectId", authMiddleware, async (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  const { content } = await c.req.json();
  
  if (!content || content.trim().length === 0) {
    return c.json({ error: "Mensagem não pode estar vazia" }, 400);
  }
  
  // Verify user owns this project
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).bind(projectId, user!.id).first();
  
  if (!project) {
    return c.json({ error: "Projeto não encontrado" }, 404);
  }
  
  const senderName = user!.google_user_data?.name || user!.email || "Usuário";
  
  const result = await c.env.DB.prepare(`
    INSERT INTO messages (project_id, sender_type, sender_id, sender_name, content)
    VALUES (?, 'user', ?, ?, ?)
  `).bind(projectId, user!.id, senderName, content.trim()).run();
  
  const newMessage = await c.env.DB.prepare(
    "SELECT * FROM messages WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ 
    success: true, 
    message: newMessage 
  }, 201);
});

// Get total unread count for user
app.get("/api/user/unread-messages", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM messages m
    INNER JOIN projects p ON m.project_id = p.id
    WHERE p.user_id = ? AND m.sender_type = 'admin' AND m.is_read = 0
  `).bind(user!.id).first<{ count: number }>();
  
  return c.json({ unread_count: result?.count || 0 });
});

// ============ NOTIFICATIONS ============

// Get user notifications
app.get("/api/user/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");
  
  const notifications = await c.env.DB.prepare(`
    SELECT id, type, title, message, link, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(user!.id, limit, offset).all();
  
  const totalResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM notifications WHERE user_id = ?
  `).bind(user!.id).first<{ total: number }>();
  
  return c.json({ 
    notifications: notifications.results,
    total: totalResult?.total || 0,
    limit,
    offset
  });
});

// Get unread notifications count
app.get("/api/user/notifications/unread-count", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).bind(user!.id).first<{ count: number }>();
  
  return c.json({ unread_count: result?.count || 0 });
});

// Mark notification as read
app.put("/api/user/notifications/:id/read", authMiddleware, async (c) => {
  const user = c.get("user");
  const notificationId = parseInt(c.req.param("id"));
  
  // Verify ownership
  const notification = await c.env.DB.prepare(`
    SELECT id FROM notifications WHERE id = ? AND user_id = ?
  `).bind(notificationId, user!.id).first();
  
  if (!notification) {
    return c.json({ error: "Notificação não encontrada" }, 404);
  }
  
  await c.env.DB.prepare(`
    UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(notificationId).run();
  
  return c.json({ success: true });
});

// Mark all notifications as read
app.put("/api/user/notifications/read-all", authMiddleware, async (c) => {
  const user = c.get("user");
  
  await c.env.DB.prepare(`
    UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0
  `).bind(user!.id).run();
  
  return c.json({ success: true });
});

// ============ ADMIN MESSAGES ============

// Get all conversations (admin)
app.get("/api/admin/conversations", authMiddleware, adminMiddleware, async (c) => {
  const conversations = await c.env.DB.prepare(`
    SELECT 
      p.id as project_id,
      p.project_name,
      p.company_name,
      p.status as project_status,
      p.user_id,
      (SELECT COUNT(*) FROM messages WHERE project_id = p.id AND is_read = 0 AND sender_type = 'user') as unread_count,
      (SELECT content FROM messages WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
      (SELECT sender_type FROM messages WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as last_sender_type
    FROM projects p
    WHERE EXISTS (SELECT 1 FROM messages WHERE project_id = p.id)
    ORDER BY last_message_at DESC
  `).all();
  
  return c.json({ conversations: conversations.results });
});

// Send message as admin
app.post("/api/admin/messages/:projectId", authMiddleware, adminMiddleware, async (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  const { content } = await c.req.json();
  
  if (!content || content.trim().length === 0) {
    return c.json({ error: "Mensagem não pode estar vazia" }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO messages (project_id, sender_type, sender_id, sender_name, content)
    VALUES (?, 'admin', ?, 'Equipe Kate', ?)
  `).bind(projectId, user!.id, content.trim()).run();
  
  const newMessage = await c.env.DB.prepare(
    "SELECT * FROM messages WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ 
    success: true, 
    message: newMessage 
  }, 201);
});

// ============ STATS ============

// Get platform stats
app.get("/api/stats", async (c) => {
  const totalRaised = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(current_amount), 0) as total FROM campaigns"
  ).first<{ total: number }>();
  
  const totalCampaigns = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'"
  ).first<{ count: number }>();
  
  const totalBackers = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(backers_count), 0) as total FROM campaigns"
  ).first<{ total: number }>();
  
  const fundedCampaigns = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM campaigns WHERE current_amount >= goal_amount"
  ).first<{ count: number }>();
  
  return c.json({
    total_raised: totalRaised?.total || 0,
    total_campaigns: totalCampaigns?.count || 0,
    total_backers: totalBackers?.total || 0,
    funded_campaigns: fundedCampaigns?.count || 0,
  });
});

// ============ HATHOR HEADLESS WALLET API ============

// Helper to get Hathor client
const getHathorClient = (env: Env) => {
  const client = createHathorClient(env as any);
  if (!client) {
    return null;
  }
  return client;
};

// Debug endpoint (temporary) - verify secrets are being read
app.get("/api/hathor/debug", authMiddleware, adminMiddleware, async (c) => {
  const debug = getHathorConfigDebug(c.env as any);
  return c.json({ debug });
});

// PUBLIC test endpoint - temporarily public for testing
app.get("/api/hathor/test", async (c) => {
  const client = getHathorClient(c.env);
  const debug = getHathorConfigDebug(c.env as any);
  
  if (!client) {
    return c.json({ 
      ok: false, 
      error: "Hathor client not configured",
      debug,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Test 1: Get wallet status
    const statusResult = await client.getStatus(true);
    
    // Test 2: Try to get a new address (tests wallet connectivity)
    let addressTest = null;
    try {
      const addressResult = await client.getNewAddress(false);
      addressTest = {
        success: addressResult.success,
        address: addressResult.data?.address?.substring(0, 10) + "...",
        error: addressResult.error
      };
    } catch (e: any) {
      addressTest = { success: false, error: e.message };
    }

    const statusInfo = WALLET_STATUS[statusResult.data?.statusCode as keyof typeof WALLET_STATUS];
    
    return c.json({
      ok: statusResult.success && statusResult.data?.statusCode === 3,
      wallet: {
        connected: statusResult.success,
        statusCode: statusResult.data?.statusCode,
        statusMessage: statusInfo?.label || "Unknown",
        network: statusResult.data?.network,
        serverUrl: statusResult.data?.serverUrl
      },
      addressTest,
      capabilities: {
        createToken: true,
        createNFT: true,
        transfer: true,
        sendTxWithData: true
      },
      debug,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return c.json({
      ok: false,
      error: e.message,
      debug,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== STELLAR TEST ENDPOINT ====================
app.get("/api/stellar/test", async (c) => {
  const client = createStellarClient(c.env as any);
  
  if (!client) {
    return c.json({ 
      ok: false, 
      error: "Stellar client not configured",
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Test connection
    const connectionResult = await client.testConnection();
    
    return c.json({
      ok: connectionResult.connected,
      stellar: {
        connected: connectionResult.connected,
        network: connectionResult.network,
        katePublicKey: connectionResult.katePublicKey,
      },
      capabilities: {
        createAsset: true,
        createTrustline: true,
        transferTokens: true,
        createNFT: true,
      },
      explorerBase: connectionResult.network === "testnet" 
        ? "https://stellar.expert/explorer/testnet"
        : "https://stellar.expert/explorer/public",
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return c.json({
      ok: false,
      error: e.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== STELLAR FLOW TEST (SIMULATED - DEV ONLY) ====================
app.post("/api/stellar/test-flow-sim", async (c) => {
  const db = c.env.DB;
  const { SimulatedStellarClient, StellarClient } = await import("./stellar-client");
  const client = new SimulatedStellarClient();
  
  const results: any = { steps: [], success: true, mode: "simulated" };

  try {
    // Step 1: Generate keypair for test investor
    const keypair = StellarClient.generateKeypair();
    results.steps.push({ step: 1, name: "Generate Keypair", status: "ok", data: { publicKey: keypair.publicKey } });

    // Step 2: Fund the account (simulated)
    const fundSuccess = await client.fundTestnetAccount(keypair.publicKey);
    results.steps.push({ step: 2, name: "Fund Testnet Account (Simulated)", status: "ok", data: { funded: fundSuccess } });

    // Step 3: Update test investor with keypair
    await db.prepare(`
      UPDATE user_profiles 
      SET stellar_public_key = ?, stellar_secret_key = ?
      WHERE user_id = '3'
    `).bind(keypair.publicKey, keypair.secretKey).run();
    results.steps.push({ step: 3, name: "Update Investor Keys", status: "ok" });

    // Step 4: Create token (simulated)
    const assetResult = await client.createProjectAsset(
      "SOLAR", 
      500000, 
      { projectId: 108, projectName: "Energia Solar Comunitária" }
    );
    results.steps.push({ step: 4, name: "Create Stellar Token (Simulated)", status: "ok", data: assetResult });
    
    // Update project with token info
    await db.prepare(`
      UPDATE projects 
      SET stellar_asset_code = ?, stellar_asset_issuer = ?, stellar_tx_hash = ?, status = 'fundraising'
      WHERE id = 108
    `).bind(assetResult.assetCode, assetResult.issuer, assetResult.txHash).run();

    // Step 5: Create trustline (simulated)
    const trustlineResult = await client.createTrustline(
      keypair.secretKey,
      assetResult.assetCode,
      assetResult.issuer
    );
    results.steps.push({ step: 5, name: "Create Trustline (Simulated)", status: "ok", data: trustlineResult });
    
    // Update investment with trustline
    await db.prepare(`
      UPDATE investments 
      SET stellar_trustline_tx = ?, status = 'paid'
      WHERE id = 1
    `).bind(trustlineResult.txHash).run();

    // Step 6: Transfer tokens (simulated)
    const transferResult = await client.transferTokens(
      keypair.publicKey,
      assetResult.assetCode,
      5, // cotas
      "INV-1"
    );
    results.steps.push({ step: 6, name: "Transfer Tokens (Simulated)", status: "ok", data: transferResult });
    
    // Update investment with distribution
    await db.prepare(`
      UPDATE investments 
      SET stellar_tx_hash = ?, status = 'completed'
      WHERE id = 1
    `).bind(transferResult.txHash).run();

    // Update project to completed
    await db.prepare(`
      UPDATE projects SET status = 'completed' WHERE id = 108
    `).run();

    results.steps.push({ step: 7, name: "Flow Complete", status: "ok" });
    
    return c.json(results);
  } catch (err: any) {
    results.success = false;
    results.error = err.message;
    return c.json(results);
  }
});

// ==================== STELLAR FLOW TEST (REAL - PROD) ====================
app.post("/api/stellar/test-flow", authMiddleware, adminMiddleware, async (c) => {
  const db = c.env.DB;
  const simulate = c.req.query("simulate") === "true";
  
  // Use SimulatedStellarClient for dev testing (external network calls fail in Miniflare)
  const { SimulatedStellarClient, StellarClient } = await import("./stellar-client");
  const client = simulate ? new SimulatedStellarClient() : createStellarClient(c.env as any);
  
  const results: any = { steps: [], success: true, mode: simulate ? "simulated" : "real" };

  try {
    // Step 1: Generate keypair for test investor
    const { StellarClient } = await import("./stellar-client");
    const keypair = StellarClient.generateKeypair();
    results.steps.push({ step: 1, name: "Generate Keypair", status: "ok", data: { publicKey: keypair.publicKey } });

    // Step 2: Fund the account on testnet
    if (client) {
      const fundSuccess = await client.fundTestnetAccount(keypair.publicKey);
      results.steps.push({ step: 2, name: "Fund Testnet Account", status: fundSuccess ? "ok" : "error", data: { funded: fundSuccess } });
      if (!fundSuccess) {
        results.success = false;
        return c.json(results);
      }
    }

    // Step 3: Update test investor with real keypair
    await db.prepare(`
      UPDATE user_profiles 
      SET stellar_public_key = ?, stellar_secret_key = ?
      WHERE user_id = '3'
    `).bind(keypair.publicKey, keypair.secretKey).run();
    results.steps.push({ step: 3, name: "Update Investor Keys", status: "ok" });

    // Step 4: Create token (simulate start-fundraising)
    if (client) {
      try {
        const assetResult = await client.createProjectAsset(
          "SOLAR", 
          500000, 
          { projectId: 108, projectName: "Energia Solar Comunitária" }
        );
        results.steps.push({ step: 4, name: "Create Stellar Token", status: "ok", data: assetResult });
        
        // Update project with token info
        await db.prepare(`
          UPDATE projects 
          SET stellar_asset_code = ?, stellar_asset_issuer = ?, stellar_tx_hash = ?, status = 'fundraising'
          WHERE id = 108
        `).bind(assetResult.assetCode, assetResult.issuer, assetResult.txHash).run();
      } catch (err: any) {
        results.steps.push({ step: 4, name: "Create Stellar Token", status: "error", data: { error: err.message } });
        results.success = false;
        return c.json(results);
      }
    }

    // Step 5: Create trustline (simulate approve investment)
    if (client) {
      const project = await db.prepare(`SELECT stellar_asset_code, stellar_asset_issuer FROM projects WHERE id = 108`).first();
      if (project?.stellar_asset_code) {
        const trustlineResult = await client.createTrustline(
          keypair.secretKey,
          project.stellar_asset_code as string,
          project.stellar_asset_issuer as string
        );
        results.steps.push({ step: 5, name: "Create Trustline", status: trustlineResult.success ? "ok" : "error", data: trustlineResult });
        
        if (trustlineResult.success) {
          await db.prepare(`
            UPDATE investments 
            SET status = 'blockchain_registered', stellar_trustline_tx = ?
            WHERE id = 1
          `).bind(trustlineResult.txHash).run();
        }
      }
    }

    // Step 6: Transfer tokens (simulate distribute)
    if (client) {
      const project = await db.prepare(`SELECT stellar_asset_code FROM projects WHERE id = 108`).first();
      if (project?.stellar_asset_code) {
        const transferResult = await client.transferTokens(
          keypair.publicKey,
          project.stellar_asset_code as string,
          5 // 5 cotas = 5 tokens
        );
        results.steps.push({ step: 6, name: "Transfer Tokens", status: transferResult.success ? "ok" : "error", data: transferResult });
        
        if (transferResult.success) {
          await db.prepare(`
            UPDATE investments 
            SET status = 'completed', stellar_tx_hash = ?
            WHERE id = 1
          `).bind(transferResult.txHash).run();
          
          await db.prepare(`
            UPDATE projects SET status = 'completed' WHERE id = 108
          `).run();
        }
      }
    }

    // Get final state
    const finalInvestment = await db.prepare(`
      SELECT i.*, p.stellar_asset_code, p.stellar_tx_hash as token_creation_tx
      FROM investments i 
      JOIN projects p ON i.project_id = p.id 
      WHERE i.id = 1
    `).first();
    
    results.finalState = finalInvestment;
    results.explorerLinks = {
      tokenCreation: `https://stellar.expert/explorer/testnet/tx/${finalInvestment?.token_creation_tx}`,
      trustline: `https://stellar.expert/explorer/testnet/tx/${finalInvestment?.stellar_trustline_tx}`,
      distribution: `https://stellar.expert/explorer/testnet/tx/${finalInvestment?.stellar_tx_hash}`,
      investorAccount: `https://stellar.expert/explorer/testnet/account/${keypair.publicKey}`
    };

    return c.json(results);
  } catch (e: any) {
    results.success = false;
    results.error = e.message;
    return c.json(results, 500);
  }
});

// Health / Status
app.get("/api/hathor/health", authMiddleware, adminMiddleware, async (c) => {
  const client = getHathorClient(c.env);
  
  // Include debug info when client is not available
  if (!client) {
    const debug = getHathorConfigDebug(c.env as any);
    return c.json({ 
      ok: false, 
      error: "Hathor API não configurada. Verifique os secrets HATHOR_HEADLESS_BASE_URL e HATHOR_HEADLESS_API_KEY.",
      debug
    }, 500);
  }

  // Pass true to get debug info
  const result = await client.getStatus(true);
  
  if (!result.success) {
    const debug = getHathorConfigDebug(c.env as any);
    return c.json({ 
      ok: false, 
      error: result.error,
      statusCode: result.statusCode,
      rawResponse: result.data,
      requestDebug: result.data?._debug,
      configDebug: debug
    });
  }

  const statusInfo = WALLET_STATUS[result.data?.statusCode as keyof typeof WALLET_STATUS];
  
  return c.json({
    ok: result.data?.statusCode === 3,
    statusCode: result.data?.statusCode,
    statusMessage: statusInfo?.label || "Unknown",
    badge: statusInfo?.badge || "Unknown",
    network: result.data?.network,
    serverUrl: result.data?.serverUrl,
    raw: result.data
  });
});

// Get new address
app.get("/api/hathor/address/new", authMiddleware, adminMiddleware, async (c) => {
  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getNewAddress(true);
  
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ address: result.data?.address });
});

// Assign address to user
app.post("/api/hathor/address/assign", authMiddleware, async (c) => {
  const user = c.get("user");
  const client = getHathorClient(c.env);
  
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  // Check if user already has an address
  const existing = await c.env.DB.prepare(
    "SELECT * FROM hathor_addresses WHERE user_id = ?"
  ).bind(user!.id).first() as any;

  if (existing) {
    return c.json({ 
      address: existing.hathor_address, 
      userId: existing.user_id,
      status: existing.status,
      alreadyAssigned: true 
    });
  }

  // Try to get a new address (up to 5 attempts for uniqueness)
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    const result = await client.getNewAddress(true);
    
    if (!result.success) {
      if (attempts === maxAttempts) {
        // Save with pending status
        await c.env.DB.prepare(`
          INSERT INTO hathor_addresses (user_id, hathor_address, status)
          VALUES (?, 'pending', 'pending')
        `).bind(user!.id).run();
        
        return c.json({ 
          error: "Falha ao gerar endereço Hathor após múltiplas tentativas",
          status: "pending"
        }, 500);
      }
      continue;
    }

    const address = result.data?.address;
    
    // Check if address is unique in our DB
    const duplicateCheck = await c.env.DB.prepare(
      "SELECT id FROM hathor_addresses WHERE hathor_address = ?"
    ).bind(address).first();

    if (duplicateCheck) {
      continue; // Try again
    }

    // Save the address
    await c.env.DB.prepare(`
      INSERT INTO hathor_addresses (user_id, hathor_address, status)
      VALUES (?, ?, 'active')
    `).bind(user!.id, address).run();

    // Log operation
    await c.env.DB.prepare(`
      INSERT INTO hathor_operations (user_id, op_type, request_payload, response_payload, status)
      VALUES (?, 'address_assign', ?, ?, 'success')
    `).bind(
      user!.id,
      JSON.stringify({ userId: user!.id }),
      JSON.stringify({ address })
    ).run();

    return c.json({ 
      address, 
      userId: user!.id,
      status: "active" 
    });
  }

  return c.json({ error: "Não foi possível gerar um endereço único" }, 500);
});

// Get user's Hathor address (alias: /my)
app.get("/api/hathor/address/my", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(
    "SELECT * FROM hathor_addresses WHERE user_id = ?"
  ).bind(user!.id).first() as any;

  if (!result) {
    return c.json({ address: null, status: null });
  }

  return c.json({ 
    address: result.hathor_address, 
    status: result.status,
    createdAt: result.created_at
  });
});

// Get user's Hathor address
app.get("/api/hathor/address/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const result = await c.env.DB.prepare(
    "SELECT * FROM hathor_addresses WHERE user_id = ?"
  ).bind(user!.id).first() as any;

  if (!result) {
    return c.json({ address: null, status: null });
  }

  return c.json({ 
    address: result.hathor_address, 
    status: result.status,
    createdAt: result.created_at
  });
});

// Get balance (HTR)
app.get("/api/hathor/balance", authMiddleware, adminMiddleware, async (c) => {
  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getBalance();
  
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    available: result.data?.available || 0,
    locked: result.data?.locked || 0
  });
});

// Get balance for specific token
app.get("/api/hathor/balance/:tokenUid", authMiddleware, adminMiddleware, async (c) => {
  const tokenUid = c.req.param("tokenUid");
  const client = getHathorClient(c.env);
  
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getBalance(tokenUid);
  
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    available: result.data?.available || 0,
    locked: result.data?.locked || 0,
    tokenUid
  });
});

// Create token
app.post("/api/hathor/token/create", authMiddleware, adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, symbol, amount, address, create_mint, create_melt } = body;

  // Validations
  if (!name || !symbol || !amount) {
    return c.json({ error: "name, symbol e amount são obrigatórios" }, 400);
  }

  if (symbol.length > 5) {
    return c.json({ error: "symbol deve ter no máximo 5 caracteres" }, 400);
  }

  if (amount <= 0 || !Number.isInteger(amount)) {
    return c.json({ error: "amount deve ser um inteiro positivo" }, 400);
  }

  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  // Create idempotency key
  const idempotencyKey = `create_token_${user!.id}_${name}_${symbol}_${amount}`;
  
  // Check for duplicate operation
  const existingOp = await c.env.DB.prepare(
    "SELECT * FROM hathor_operations WHERE idempotency_key = ? AND status = 'success'"
  ).bind(idempotencyKey).first();

  if (existingOp) {
    return c.json({ 
      error: "Operação duplicada detectada",
      existingOperation: existingOp
    }, 409);
  }

  const result = await client.createToken({
    name,
    symbol,
    amount,
    address,
    create_mint: create_mint !== false,
    create_melt: create_melt !== false,
  });

  // Log operation
  await c.env.DB.prepare(`
    INSERT INTO hathor_operations (user_id, op_type, idempotency_key, request_payload, response_payload, txid, status)
    VALUES (?, 'create_token', ?, ?, ?, ?, ?)
  `).bind(
    user!.id,
    idempotencyKey,
    JSON.stringify(body),
    JSON.stringify(result.data),
    result.data?.hash || null,
    result.success ? "success" : "failed"
  ).run();

  if (!result.success) {
    return c.json({ error: result.error, raw: result.data }, 400);
  }

  // Save asset
  await c.env.DB.prepare(`
    INSERT INTO hathor_assets (user_id, type, name, symbol, uid, txid, status, payload)
    VALUES (?, 'token', ?, ?, ?, ?, 'confirmed', ?)
  `).bind(
    user!.id,
    name,
    symbol,
    result.data?.hash,
    result.data?.hash,
    JSON.stringify(result.data)
  ).run();

  return c.json({
    success: true,
    hash: result.data?.hash,
    configurationString: result.data?.configurationString,
    raw: result.data
  });
});

// Mint tokens
app.post("/api/hathor/token/mint", authMiddleware, adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { token, amount, address } = body;

  if (!token || !amount) {
    return c.json({ error: "token (UID) e amount são obrigatórios" }, 400);
  }

  if (amount <= 0 || !Number.isInteger(amount)) {
    return c.json({ error: "amount deve ser um inteiro positivo" }, 400);
  }

  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.mintTokens({ token, amount, address });

  // Log operation
  await c.env.DB.prepare(`
    INSERT INTO hathor_operations (user_id, op_type, request_payload, response_payload, txid, status)
    VALUES (?, 'mint', ?, ?, ?, ?)
  `).bind(
    user!.id,
    JSON.stringify(body),
    JSON.stringify(result.data),
    result.data?.hash || null,
    result.success ? "success" : "failed"
  ).run();

  if (!result.success) {
    return c.json({ error: result.error, raw: result.data }, 400);
  }

  return c.json({
    success: true,
    hash: result.data?.hash,
    raw: result.data
  });
});

// Melt tokens
app.post("/api/hathor/token/melt", authMiddleware, adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { token, amount } = body;

  if (!token || !amount) {
    return c.json({ error: "token (UID) e amount são obrigatórios" }, 400);
  }

  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.meltTokens({ token, amount });

  // Log operation
  await c.env.DB.prepare(`
    INSERT INTO hathor_operations (user_id, op_type, request_payload, response_payload, txid, status)
    VALUES (?, 'melt', ?, ?, ?, ?)
  `).bind(
    user!.id,
    JSON.stringify(body),
    JSON.stringify(result.data),
    result.data?.hash || null,
    result.success ? "success" : "failed"
  ).run();

  if (!result.success) {
    return c.json({ error: result.error, raw: result.data }, 400);
  }

  return c.json({
    success: true,
    hash: result.data?.hash,
    raw: result.data
  });
});

// Get configuration string
app.get("/api/hathor/token/configuration-string/:tokenUid", authMiddleware, adminMiddleware, async (c) => {
  const tokenUid = c.req.param("tokenUid");
  const client = getHathorClient(c.env);
  
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getConfigurationString(tokenUid);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    success: true,
    configurationString: result.data?.configurationString
  });
});

// Create NFT
app.post("/api/hathor/nft/create", authMiddleware, adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, symbol, amount, data, address } = body;

  // Validations
  if (!name || !symbol || !amount || !data) {
    return c.json({ error: "name, symbol, amount e data são obrigatórios" }, 400);
  }

  if (symbol.length > 5) {
    return c.json({ error: "symbol deve ter no máximo 5 caracteres" }, 400);
  }

  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.createNFT({ name, symbol, amount, data, address });

  // Log operation
  await c.env.DB.prepare(`
    INSERT INTO hathor_operations (user_id, op_type, request_payload, response_payload, txid, status)
    VALUES (?, 'create_nft', ?, ?, ?, ?)
  `).bind(
    user!.id,
    JSON.stringify(body),
    JSON.stringify(result.data),
    result.data?.hash || null,
    result.success ? "success" : "failed"
  ).run();

  if (!result.success) {
    return c.json({ error: result.error, raw: result.data }, 400);
  }

  // Save asset
  await c.env.DB.prepare(`
    INSERT INTO hathor_assets (user_id, type, name, symbol, uid, txid, status, payload)
    VALUES (?, 'nft', ?, ?, ?, ?, 'confirmed', ?)
  `).bind(
    user!.id,
    name,
    symbol,
    result.data?.hash,
    result.data?.hash,
    JSON.stringify({ ...result.data, data })
  ).run();

  return c.json({
    success: true,
    hash: result.data?.hash,
    configurationString: result.data?.configurationString,
    raw: result.data
  });
});

// Transfer
app.post("/api/hathor/transfer", authMiddleware, adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { address, value, token } = body;

  if (!address || !value) {
    return c.json({ error: "address e value são obrigatórios" }, 400);
  }

  if (!address.startsWith("H")) {
    return c.json({ error: "address deve começar com 'H' (formato Hathor)" }, 400);
  }

  if (value <= 0 || !Number.isInteger(value)) {
    return c.json({ error: "value deve ser um inteiro positivo" }, 400);
  }

  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.transfer({ address, value, token });

  // Log operation
  await c.env.DB.prepare(`
    INSERT INTO hathor_operations (user_id, op_type, request_payload, response_payload, txid, status)
    VALUES (?, 'transfer', ?, ?, ?, ?)
  `).bind(
    user!.id,
    JSON.stringify(body),
    JSON.stringify(result.data),
    result.data?.hash || null,
    result.success ? "success" : "failed"
  ).run();

  if (!result.success) {
    return c.json({ error: result.error, raw: result.data }, 400);
  }

  return c.json({
    success: true,
    hash: result.data?.hash,
    raw: result.data
  });
});

// Transaction history
app.get("/api/hathor/history", authMiddleware, adminMiddleware, async (c) => {
  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getTxHistory();

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ history: result.data });
});

// Transaction confirmations
app.get("/api/hathor/tx/:txid/confirmations", authMiddleware, adminMiddleware, async (c) => {
  const txid = c.req.param("txid");
  const client = getHathorClient(c.env);
  
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getTxConfirmations(txid);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    success: true,
    confirmationNumber: result.data?.confirmationNumber
  });
});

// Swagger spec (proxied)
app.get("/api/hathor/swagger", authMiddleware, adminMiddleware, async (c) => {
  const client = getHathorClient(c.env);
  if (!client) {
    return c.json({ error: "Hathor API não configurada" }, 500);
  }

  const result = await client.getSwaggerSpec();

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result.data);
});

// Admin: List all Hathor addresses
app.get("/api/admin/hathor/addresses", authMiddleware, adminMiddleware, async (c) => {
  const addresses = await c.env.DB.prepare(`
    SELECT ha.*, up.document_number
    FROM hathor_addresses ha
    LEFT JOIN user_profiles up ON ha.user_id = up.user_id
    ORDER BY ha.created_at DESC
    LIMIT 100
  `).all();

  return c.json({ addresses: addresses.results });
});

// Admin: List all Hathor assets
app.get("/api/admin/hathor/assets", authMiddleware, adminMiddleware, async (c) => {
  const assets = await c.env.DB.prepare(`
    SELECT * FROM hathor_assets ORDER BY created_at DESC LIMIT 100
  `).all();

  return c.json({ assets: assets.results });
});

// Admin: List all Hathor operations
app.get("/api/admin/hathor/operations", authMiddleware, adminMiddleware, async (c) => {
  const { status, op_type } = c.req.query();
  
  let query = "SELECT * FROM hathor_operations WHERE 1=1";
  const params: string[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (op_type) {
    query += " AND op_type = ?";
    params.push(op_type);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const operations = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ operations: operations.results });
});

export default app;
