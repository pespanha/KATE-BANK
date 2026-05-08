import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { fetchCurrentUser, clearUserCache } from "@/react-app/hooks/useApi";
import { 
  Loader2, 
  ArrowLeft, 
  Check, 
  TrendingUp, 
  Briefcase,
  Shield,
  Zap,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User
} from "lucide-react";

type IntentType = "investidor" | "capitador" | null;

// Password validation helper
function validatePassword(pwd: string): { valid: boolean; errors: string[]; strength: number } {
  const errors: string[] = [];
  let strength = 0;
  
  if (pwd.length >= 8) strength++;
  else errors.push("Mínimo 8 caracteres");
  
  if (/[a-zA-Z]/.test(pwd)) strength++;
  else errors.push("Pelo menos uma letra");
  
  if (/[0-9]/.test(pwd)) strength++;
  else errors.push("Pelo menos um número");
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength++;
  else errors.push("Pelo menos um símbolo (!@#$%...)");
  
  return { valid: errors.length === 0, errors, strength };
}

export default function AuthCadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [intent, setIntent] = useState<IntentType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Get context from URL params
  const context = searchParams.get("context"); // "invest" or "captar"
  const contextId = searchParams.get("contextId");

  // Pre-select intent based on context
  useEffect(() => {
    if (context === "invest") {
      setIntent("investidor");
    } else if (context === "captar") {
      setIntent("capitador");
    }
  }, [context]);

  // Store context and intent in localStorage for post-login routing
  useEffect(() => {
    if (intent) {
      localStorage.setItem("kate_auth_context", JSON.stringify({
        type: context || (intent === "investidor" ? "invest" : "captar"),
        id: contextId,
        intent,
        redirect: "/app",
        isNewUser: true,
        timestamp: Date.now()
      }));
    }
  }, [intent, context, contextId]);

  // Check if already logged in - only once
  const hasCheckedAuth = useRef(false);
  
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    
    const checkAuth = async () => {
      const result = await fetchCurrentUser();
      if (result.user) {
        navigate("/onboarding", { replace: true });
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!intent) {
      setError("Selecione como você quer usar a Kate");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      setError("Senha fraca: " + pwdValidation.errors.join(", "));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name, role: intent })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        return;
      }

      // Clear cache so new session is fetched
      clearUserCache();

      // Use full page reload to ensure cookie is properly set before next request
      window.location.href = "/app";
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-deep via-navy to-navy-light flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-deep via-navy to-navy-light flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Back link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-navy-deep px-8 py-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center">
                <span className="text-navy-deep font-bold text-xl">K</span>
              </div>
              <span className="text-2xl font-bold text-white">Kate</span>
            </Link>
            <h1 className="text-xl font-bold text-white mb-2">Criar sua conta</h1>
            <p className="text-white/70 text-sm">
              Junte-se a milhares de investidores e empreendedores
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Intent selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Como você quer usar a Kate?
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIntent("investidor")}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                      intent === "investidor"
                        ? "border-gold bg-gold/5"
                        : "border-kate-border hover:border-gold/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      intent === "investidor" ? "bg-gold/20" : "bg-gray-100"
                    }`}>
                      <TrendingUp className={`w-6 h-6 ${intent === "investidor" ? "text-gold-hover" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${intent === "investidor" ? "text-navy-deep" : "text-gray-700"}`}>
                        Quero Investir
                      </p>
                      <p className="text-xs text-gray-500">
                        Investir em projetos e diversificar meu portfólio
                      </p>
                    </div>
                    {intent === "investidor" && (
                      <Check className="w-5 h-5 text-gold" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntent("capitador")}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                      intent === "capitador"
                        ? "border-gold bg-gold/5"
                        : "border-kate-border hover:border-gold/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      intent === "capitador" ? "bg-navy/20" : "bg-gray-100"
                    }`}>
                      <Briefcase className={`w-6 h-6 ${intent === "capitador" ? "text-navy" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${intent === "capitador" ? "text-navy-deep" : "text-gray-700"}`}>
                        Quero Captar
                      </p>
                      <p className="text-xs text-gray-500">
                        Tenho um projeto e quero captar recursos
                      </p>
                    </div>
                    {intent === "capitador" && (
                      <Check className="w-5 h-5 text-gold" />
                    )}
                  </button>
                </div>
              </div>

              {/* Name field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres com letra, número e símbolo"
                    className="w-full pl-10 pr-12 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => {
                        const pwdInfo = validatePassword(password);
                        const color = pwdInfo.strength >= level 
                          ? pwdInfo.strength <= 1 ? "bg-red-500" 
                          : pwdInfo.strength === 2 ? "bg-orange-500"
                          : pwdInfo.strength === 3 ? "bg-yellow-500"
                          : "bg-green-500"
                          : "bg-gray-200";
                        return <div key={level} className={`h-1 flex-1 rounded ${color}`} />;
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {validatePassword(password).errors.map((err, i) => (
                        <span key={i} className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">{err}</span>
                      ))}
                      {validatePassword(password).valid && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Senha forte
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !intent}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all font-bold ${
                  intent 
                    ? "bg-gold hover:bg-gold-hover text-navy-deep"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-kate-border">
              <p className="text-xs text-gray-500 text-center mb-4">Ao criar sua conta você terá acesso a:</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-5 h-5 text-gold-hover" />
                  </div>
                  <p className="text-xs text-gray-600">Investimentos<br/>regulados</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-gold-hover" />
                  </div>
                  <p className="text-xs text-gray-600">Tokens<br/>digitais</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-gold-hover" />
                  </div>
                  <p className="text-xs text-gray-600">Comunidade<br/>exclusiva</p>
                </div>
              </div>
            </div>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Já tem uma conta?{" "}
                <Link
                  to={`/auth/login${context ? `?context=${context}&contextId=${contextId || ""}` : ""}`}
                  className="text-gold-hover font-semibold hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <p className="text-center text-xs text-gray-500">
              Ao continuar, você concorda com nossos{" "}
              <a href="/termos" className="text-gold-hover hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="/privacidade" className="text-gold-hover hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
