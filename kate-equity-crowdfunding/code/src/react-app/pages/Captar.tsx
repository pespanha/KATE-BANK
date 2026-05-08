import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Globe, 
  Tag, 
  TrendingUp, 
  Rocket,
  ArrowRight,
  Sparkles,
  Clock,
  Shield,
  Users,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import { useAuth } from "@/react-app/hooks/useAuth";

const CATEGORIES = [
  "Startup",
  "PME",
  "Imobiliário",
  "Energia",
  "Agro",
  "Tecnologia",
  "Saúde",
  "Outro"
];

const FUNDING_RANGES = [
  { value: "ate_500k", label: "Até R$ 500 mil" },
  { value: "500k_2m", label: "R$ 500 mil a R$ 2 milhões" },
  { value: "2m_10m", label: "R$ 2 milhões a R$ 10 milhões" },
  { value: "acima_10m", label: "Acima de R$ 10 milhões" }
];

const STAGES = [
  { value: "ideia", label: "Ideia", description: "Conceito em desenvolvimento" },
  { value: "operacao", label: "Operação", description: "Produto/serviço funcionando" },
  { value: "receita", label: "Receita", description: "Gerando faturamento" },
  { value: "tracao", label: "Tração", description: "Crescimento consistente" }
];

// Loading states for better UX
type LoadingState = "idle" | "creating_account" | "saving_profile" | "saving_project" | "done";

export default function Captar() {
  const { user, isPending } = useAuth();
  const isMountedRef = useRef(true);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [formData, setFormData] = useState({
    document_type: "cnpj",
    responsible_name: "",
    email: "",
    whatsapp: "",
    project_name: "",
    website: "",
    category: "",
    funding_range: "",
    stage: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user && isMountedRef.current) {
      setFormData(prev => ({
        ...prev,
        responsible_name: user.google_user_data?.name || user.email?.split('@')[0] || prev.responsible_name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Normalize WhatsApp number
  const normalizeWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    // Add Brazil code if not present
    if (digits.length === 11) {
      return `55${digits}`;
    }
    if (digits.length === 10) {
      return `55${digits}`;
    }
    return digits;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.responsible_name.trim()) {
      newErrors.responsible_name = "Nome é obrigatório";
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email válido é obrigatório";
    }
    
    // Validate WhatsApp - must have at least 10 digits (DDD + number)
    const whatsappDigits = formData.whatsapp.replace(/\D/g, "");
    if (whatsappDigits.length < 10) {
      newErrors.whatsapp = "Informe WhatsApp com DDD (somente números)";
    }
    
    if (!formData.project_name.trim()) {
      newErrors.project_name = "Nome do projeto é obrigatório";
    }
    
    if (!formData.category) {
      newErrors.category = "Selecione uma categoria";
    }
    
    if (!formData.funding_range) {
      newErrors.funding_range = "Selecione a faixa de captação";
    }
    
    if (!formData.stage) {
      newErrors.stage = "Selecione o estágio";
    }
    
    if (!user) {
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = "Senha deve ter pelo menos 6 caracteres";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não coincidem";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create profile and project (reusable for both new signup and login)
  const createProfileAndProject = async () => {
    if (!isMountedRef.current) return;
    
    console.log("[profile_upsert_start]", { email: formData.email });
    if (isMountedRef.current) setLoadingState("saving_profile");
    
    // Create/update user profile as capitador
    const profileRes = await fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        role: "capitador",
        document_type: formData.document_type,
        document_number: "", // Will be filled later in wizard
        phone: normalizeWhatsApp(formData.whatsapp)
      })
    });

    const profileData = await profileRes.json();
    
    if (!profileRes.ok) {
      console.log("[profile_upsert_fail]", { error: profileData.error, code: profileData.code });
      throw new Error(profileData.error || "Erro ao criar perfil");
    }
    
    console.log("[profile_upsert_success]");

    // Create project
    if (!isMountedRef.current) return;
    console.log("[project_draft_create_start]", { project_name: formData.project_name });
    if (isMountedRef.current) setLoadingState("saving_project");
    
    const projectRes = await fetch("/api/projects/pre-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        document_type: formData.document_type,
        responsible_name: formData.responsible_name,
        email: formData.email,
        whatsapp: normalizeWhatsApp(formData.whatsapp),
        project_name: formData.project_name,
        website: formData.website || null,
        category: formData.category,
        funding_range: formData.funding_range,
        stage: formData.stage,
        source_url: window.location.pathname
      })
    });
    
    const projectData = await projectRes.json();
    
    if (!projectRes.ok) {
      console.log("[project_draft_create_fail]", { error: projectData.error });
      throw new Error(projectData.error || "Erro ao enviar projeto");
    }
    
    console.log("[project_draft_create_success]", { project_id: projectData.project_id });

    // Mark as new project submission
    localStorage.setItem("kate_new_project_submitted", "true");
    
    // Verify session is properly established before navigating
    console.log("[session_verify_start]");
    const sessionRes = await fetch("/api/users/me", {
      method: "GET",
      credentials: "include"
    });
    
    if (!sessionRes.ok) {
      console.log("[session_verify_fail]", { status: sessionRes.status });
      if (isMountedRef.current) {
        setErrors({ submit: "Conta criada, mas a sessão não persistiu. Por favor, faça login novamente." });
        setLoadingState("idle");
        // Don't navigate - session didn't persist
        return;
      }
    }
    
    console.log("[session_verify_success]");
    
    if (isMountedRef.current) {
      setLoadingState("done");
      // Session verified - use full page reload to ensure cookie propagates
      window.location.href = "/app/projetos";
    }
  };

  // Handle login from modal
  const handleLoginAndSubmit = async () => {
    if (!loginPassword) {
      setLoginError("Digite sua senha");
      return;
    }
    
    if (!isMountedRef.current) return;
    setIsLoggingIn(true);
    setLoginError("");
    
    console.log("[login_start]", { email: formData.email });
    
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: loginPassword
        })
      });

      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        console.log("[login_fail]", { error: loginData.error });
        if (isMountedRef.current) {
          setLoginError(loginData.error || "Email ou senha incorretos");
          setIsLoggingIn(false);
        }
        return;
      }
      
      console.log("[login_success]");
      if (isMountedRef.current) setShowLoginModal(false);
      
      // Now create profile and project
      await createProfileAndProject();
      
    } catch (err) {
      console.log("[login_fail]", { error: err });
      if (isMountedRef.current) {
        setLoginError("Erro de conexão. Tente novamente.");
        setIsLoggingIn(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    if (!isMountedRef.current) return;
    
    setLoadingState("creating_account");
    
    try {
      // If not logged in, try to create account first
      if (!user) {
        console.log("[signup_start]", { email: formData.email });
        
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.responsible_name,
            role: "capitador"
          })
        });

        const registerData = await registerRes.json();
        
        if (!registerRes.ok) {
          console.log("[signup_fail]", { error: registerData.error, code: registerData.code });
          
          // If email already exists, show login modal
          if (registerData.code === "EMAIL_EXISTS") {
            if (isMountedRef.current) {
              setLoadingState("idle");
              setShowLoginModal(true);
            }
            return;
          }
          
          if (isMountedRef.current) {
            setErrors({ submit: registerData.error || "Erro ao criar conta" });
            setLoadingState("idle");
          }
          return;
        }
        
        console.log("[signup_success]");
      }

      // Create profile and project
      await createProfileAndProject();
      
    } catch (err: any) {
      console.log("[submit_error]", { error: err.message });
      if (isMountedRef.current) {
        setErrors({ submit: err.message || "Erro de conexão. Tente novamente." });
        setLoadingState("idle");
      }
    }
  };

  const getLoadingText = () => {
    switch (loadingState) {
      case "creating_account":
        return "Criando sua conta...";
      case "saving_profile":
        return "Salvando seu perfil...";
      case "saving_project":
        return "Salvando seu projeto...";
      default:
        return user ? "Enviando projeto..." : "Criando conta e enviando...";
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-navy-deep mb-2">
              Entrar para continuar
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Este email já possui conta. Digite sua senha para fazer login e enviar seu projeto.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-kate-border bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword || ""}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLoginAndSubmit()}
                    autoFocus
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
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
              
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              
              <button
                onClick={handleLoginAndSubmit}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar e enviar projeto
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <p className="text-center text-sm text-gray-500">
                <Link to="/auth/recuperar-senha" className="text-gold-hover hover:underline">
                  Esqueci minha senha
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Pré-inscrição em 2 minutos
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Capte recursos para seu projeto
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Preencha a pré-inscrição e nossa equipe entrará em contato para 
            avaliar seu projeto e iniciar o processo de captação.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: "Processo ágil", desc: "Análise em até 7 dias" },
            { icon: Shield, label: "Compliance CVM", desc: "100% regulamentado" },
            { icon: Users, label: "Smart money", desc: "Rede de investidores" },
            { icon: TrendingUp, label: "Até R$ 15M", desc: "Por captação" }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-kate-border text-center">
              <item.icon className="w-6 h-6 text-gold mx-auto mb-2" />
              <p className="font-semibold text-navy-deep text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-kate-border p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-navy-deep mb-3">
                Tipo de pessoa
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChange("document_type", "cnpj")}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    formData.document_type === "cnpj"
                      ? "border-gold bg-gold/5"
                      : "border-kate-border hover:border-gray-300"
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${formData.document_type === "cnpj" ? "text-gold" : "text-gray-400"}`} />
                  <span className={formData.document_type === "cnpj" ? "font-semibold text-navy-deep" : "text-gray-600"}>
                    CNPJ
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("document_type", "cpf")}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    formData.document_type === "cpf"
                      ? "border-gold bg-gold/5"
                      : "border-kate-border hover:border-gray-300"
                  }`}
                >
                  <User className={`w-5 h-5 ${formData.document_type === "cpf" ? "text-gold" : "text-gray-400"}`} />
                  <span className={formData.document_type === "cpf" ? "font-semibold text-navy-deep" : "text-gray-600"}>
                    CPF
                  </span>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-deep mb-2">
                  Nome do responsável *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.responsible_name || ""}
                    onChange={(e) => handleChange("responsible_name", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                      errors.responsible_name ? "border-red-400" : "border-kate-border"
                    } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold`}
                    placeholder="Seu nome completo"
                  />
                </div>
                {errors.responsible_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.responsible_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-deep mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={!!user}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                      errors.email ? "border-red-400" : "border-kate-border"
                    } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold ${user ? "bg-gray-50" : ""}`}
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-deep mb-2">
                  WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.whatsapp || ""}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                      errors.whatsapp ? "border-red-400" : "border-kate-border"
                    } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold`}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                {errors.whatsapp && (
                  <p className="mt-1 text-sm text-red-500">{errors.whatsapp}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-deep mb-2">
                  Nome do projeto *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.project_name || ""}
                    onChange={(e) => handleChange("project_name", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                      errors.project_name ? "border-red-400" : "border-kate-border"
                    } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold`}
                    placeholder="Nome da sua empresa ou projeto"
                  />
                </div>
                {errors.project_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.project_name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-deep mb-2">
                Site ou Instagram (opcional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  placeholder="www.suaempresa.com.br ou @instagram"
                />
              </div>
            </div>

            {/* Password fields (only if not logged in) */}
            {!user && (
              <div className="pt-4 border-t border-kate-border space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-navy-deep mb-1">Criar sua senha</h3>
                  <p className="text-xs text-gray-500">Para finalizar o cadastro e acessar o dashboard</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-deep mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password || ""}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                          errors.password ? "border-red-400" : "border-kate-border"
                        } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold`}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy-deep mb-2">
                      Confirmar senha *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword || ""}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.confirmPassword ? "border-red-400" : "border-kate-border"
                        } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold`}
                        placeholder="Repita a senha"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-navy-deep mb-2">
                Categoria do negócio *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.category || ""}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    errors.category ? "border-red-400" : "border-kate-border"
                  } focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold appearance-none bg-white`}
                >
                  <option value="">Selecione a categoria</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Funding Range */}
            <div>
              <label className="block text-sm font-medium text-navy-deep mb-3">
                Faixa de captação desejada *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FUNDING_RANGES.map(range => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => handleChange("funding_range", range.value)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      formData.funding_range === range.value
                        ? "border-gold bg-gold/5 font-semibold text-navy-deep"
                        : "border-kate-border hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              {errors.funding_range && (
                <p className="mt-2 text-sm text-red-500">{errors.funding_range}</p>
              )}
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-medium text-navy-deep mb-3">
                Estágio atual *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {STAGES.map(stage => (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => handleChange("stage", stage.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.stage === stage.value
                        ? "border-gold bg-gold/5"
                        : "border-kate-border hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className={`w-4 h-4 ${formData.stage === stage.value ? "text-gold" : "text-gray-400"}`} />
                      <span className={formData.stage === stage.value ? "font-semibold text-navy-deep" : "text-gray-700"}>
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{stage.description}</p>
                  </button>
                ))}
              </div>
              {errors.stage && (
                <p className="mt-2 text-sm text-red-500">{errors.stage}</p>
              )}
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loadingState !== "idle"}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingState !== "idle" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {getLoadingText()}
                </>
              ) : (
                <>
                  {user ? "Enviar projeto" : "Criar conta e enviar projeto"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Ao enviar, você concorda com nossos{" "}
          <Link to="/termos" className="text-navy hover:text-gold transition-colors">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link to="/privacidade" className="text-navy hover:text-gold transition-colors">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
