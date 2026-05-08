import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, LogIn, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { fetchCurrentUser, clearUserCache } from "@/react-app/hooks/useApi";

export default function AuthLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Get redirect context from URL params
  const redirectTo = searchParams.get("redirect") || "/app";
  const context = searchParams.get("context"); // "invest" or "captar"
  const contextId = searchParams.get("contextId"); // offer slug or lead id
  const isAdmin = searchParams.get("admin") === "true";

  // Store context in localStorage for post-login routing
  useEffect(() => {
    if (context) {
      localStorage.setItem("kate_auth_context", JSON.stringify({
        type: context,
        id: contextId,
        redirect: redirectTo,
        timestamp: Date.now()
      }));
    }
  }, [context, contextId, redirectTo]);

  // Check if already logged in - only once on mount
  const hasCheckedAuth = useRef(false);
  
  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    
    const checkAuth = async () => {
      // Use fetchCurrentUser with caching to prevent duplicate calls
      const result = await fetchCurrentUser();
      
      if (result.user) {
        if (isAdmin && result.user.isAdmin) {
          navigate("/admin", { replace: true });
        } else if (!isAdmin) {
          navigate(redirectTo, { replace: true });
        }
      }
      // For any error (auth or otherwise), just show login form
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate, redirectTo, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isAdmin ? "/api/auth/admin/login" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
      }

      // Clear cache so new session is fetched
      clearUserCache();

      // Use full page reload to ensure cookie is properly set before next request
      if (isAdmin || data.user?.isAdmin) {
        window.location.href = "/admin";
      } else {
        window.location.href = redirectTo;
      }
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
      </div>

      <div className="relative w-full max-w-md">
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
            <h1 className="text-xl font-bold text-white mb-2">
              {isAdmin ? "Acesso Administrativo" : "Entrar na sua conta"}
            </h1>
            <p className="text-white/70 text-sm">
              {isAdmin 
                ? "Entre com suas credenciais de administrador"
                : "Acesse sua conta para investir ou gerenciar seus projetos"
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Context message */}
            {context === "invest" && (
              <div className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-xl">
                <p className="text-sm text-navy-deep">
                  <strong>Quase lá!</strong> Faça login para continuar seu investimento.
                </p>
              </div>
            )}
            {context === "captar" && (
              <div className="mb-6 p-4 bg-navy/10 border border-navy/30 rounded-xl">
                <p className="text-sm text-navy-deep">
                  <strong>Bem-vindo!</strong> Faça login para completar a submissão do seu projeto.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="••••••••"
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* Register link (only for non-admin) */}
            {!isAdmin && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-kate-border" />
                  <span className="text-sm text-gray-400">ou</span>
                  <div className="flex-1 h-px bg-kate-border" />
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-3">Ainda não tem conta?</p>
                  <Link
                    to={`/auth/cadastro${context ? `?context=${context}&contextId=${contextId || ""}` : ""}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-navy-deep hover:bg-navy text-white font-semibold rounded-xl transition-colors"
                  >
                    Criar conta gratuita
                  </Link>
                </div>

                {/* Forgot password */}
                <div className="mt-6 text-center">
                  <Link
                    to="/auth/esqueci-senha"
                    className="text-sm text-gold-hover hover:underline"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </>
            )}
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

        {/* Security note */}
        <p className="text-center text-xs text-white/50 mt-6">
          🔒 Seus dados estão protegidos com criptografia de ponta a ponta
        </p>
      </div>
    </div>
  );
}
