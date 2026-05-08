import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import {
  Building2,
  Briefcase,
  TrendingUp,
  Target,
  Upload,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  Percent,
  Link as LinkIcon,
  Sparkles
} from "lucide-react";

interface ProjectData {
  id?: number;
  document_type: string;
  document_number: string;
  company_name: string;
  address: string;
  legal_representative: string;
  responsible_name: string;
  email: string;
  whatsapp: string;
  project_name: string;
  short_description: string;
  full_description: string;
  problem_solution: string;
  revenue_model: string;
  target_market: string;
  competitive_advantage: string;
  current_revenue: string;
  growth_info: string;
  key_metrics: string;
  team_info: string;
  min_goal: string;
  max_goal: string;
  deadline_date: string;
  target_valuation: string;
  equity_offered: string;
  use_of_funds: string;
  pitch_deck_url: string;
  social_contract_url: string;
  cap_table_url: string;
  financial_report_url: string;
  other_docs_url: string;
  status: string;
  submission_progress: number;
  category: string;
}

const INITIAL_DATA: ProjectData = {
  document_type: "cnpj",
  document_number: "",
  company_name: "",
  address: "",
  legal_representative: "",
  responsible_name: "",
  email: "",
  whatsapp: "",
  project_name: "",
  short_description: "",
  full_description: "",
  problem_solution: "",
  revenue_model: "",
  target_market: "",
  competitive_advantage: "",
  current_revenue: "",
  growth_info: "",
  key_metrics: "",
  team_info: "",
  min_goal: "",
  max_goal: "",
  deadline_date: "",
  target_valuation: "",
  equity_offered: "",
  use_of_funds: "",
  pitch_deck_url: "",
  social_contract_url: "",
  cap_table_url: "",
  financial_report_url: "",
  other_docs_url: "",
  status: "draft",
  submission_progress: 0,
  category: ""
};

const STEPS = [
  { id: 1, title: "Emissor", fullTitle: "Perfil do Emissor", icon: Building2 },
  { id: 2, title: "Negócio", fullTitle: "Sobre o Negócio", icon: Briefcase },
  { id: 3, title: "Tração", fullTitle: "Tração e Números", icon: TrendingUp },
  { id: 4, title: "Oferta", fullTitle: "Proposta de Oferta", icon: Target },
  { id: 5, title: "Docs", fullTitle: "Documentos", icon: Upload },
  { id: 6, title: "Enviar", fullTitle: "Revisão e Envio", icon: Send }
];

export default function AppProjetoNovo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, authState, isPending } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && authState === "unauthenticated") {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      window.location.href = redirectUrl;
    }
  }, [authState, isPending]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectData>(INITIAL_DATA);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      const projectIdParam = searchParams.get("project");
      
      if (projectIdParam) {
        try {
          await fetch(`/api/projects/${projectIdParam}/claim`, { method: "POST", credentials: "include" });
          const res = await fetch(`/api/projects/${projectIdParam}`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setProjectId(parseInt(projectIdParam));
            setFormData(prev => ({ ...prev, ...data.project }));
            if (data.project.submission_progress > 0) {
              const step = Math.min(Math.ceil(data.project.submission_progress / 20) + 1, 6);
              setCurrentStep(step);
            }
          }
        } catch (e) {
          console.error("Error loading project:", e);
        }
      } else {
        const pendingProject = localStorage.getItem("kate_pending_project");
        if (pendingProject) {
          try {
            await fetch(`/api/projects/${pendingProject}/claim`, { method: "POST", credentials: "include" });
            const res = await fetch(`/api/projects/${pendingProject}`, { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              setProjectId(parseInt(pendingProject));
              setFormData(prev => ({ ...prev, ...data.project }));
            }
          } catch (e) {
            console.error("Error loading pending project:", e);
          }
          localStorage.removeItem("kate_pending_project");
        } else {
          try {
            const res = await fetch("/api/user/projects", { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              const draftProject = data.projects?.find((p: any) => p.status === "draft");
              if (draftProject) {
                setProjectId(draftProject.id);
                setFormData(prev => ({ ...prev, ...draftProject }));
                if (draftProject.submission_progress > 0) {
                  const step = Math.min(Math.ceil(draftProject.submission_progress / 20) + 1, 6);
                  setCurrentStep(step);
                }
              }
            }
          } catch (e) {
            console.error("Error loading user projects:", e);
          }
        }
      }
      setLoading(false);
    };
    
    if (user) {
      loadProject();
    } else if (user === null) {
      // User is not logged in - redirect to login
      navigate("/auth/login?redirect=/app/projetos/novo" + (searchParams.get("project") ? `?project=${searchParams.get("project")}` : ""));
    }
    // If user is undefined, auth is still loading - wait
  }, [user, searchParams, navigate]);

  // Autosave function
  const saveProject = useCallback(async (showIndicator = true) => {
    if (!projectId || saving) return;
    
    if (showIndicator) setSaving(true);
    try {
      const progress = calculateProgress();
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, submission_progress: progress })
      });
      
      if (res.ok) {
        setLastSaved(new Date());
        setHasChanges(false);
      }
    } catch (e) {
      console.error("Error saving project:", e);
    } finally {
      if (showIndicator) setSaving(false);
    }
  }, [projectId, formData, saving]);

  // Debounced autosave on changes
  useEffect(() => {
    if (!projectId || !hasChanges) return;
    
    const timeout = setTimeout(() => {
      saveProject();
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [formData, projectId, hasChanges]);

  // Save on step change
  useEffect(() => {
    if (projectId && hasChanges) {
      saveProject(false);
    }
  }, [currentStep]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const calculateProgress = () => {
    const requiredFields = [
      "document_number", "company_name", "address", "legal_representative",
      "short_description", "full_description", "problem_solution",
      "min_goal", "max_goal", "deadline_date", "equity_offered",
      "pitch_deck_url", "social_contract_url", "cap_table_url"
    ];
    const filledFields = requiredFields.filter(f => formData[f as keyof ProjectData]);
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.document_number) newErrors.document_number = "Obrigatório";
      if (!formData.company_name) newErrors.company_name = "Obrigatório";
      if (!formData.address) newErrors.address = "Obrigatório";
      if (!formData.legal_representative) newErrors.legal_representative = "Obrigatório";
    } else if (step === 2) {
      if (!formData.short_description) newErrors.short_description = "Obrigatório";
      if (!formData.full_description) newErrors.full_description = "Obrigatório";
      if (!formData.problem_solution) newErrors.problem_solution = "Obrigatório";
    } else if (step === 4) {
      if (!formData.min_goal) newErrors.min_goal = "Obrigatório";
      if (!formData.max_goal) newErrors.max_goal = "Obrigatório";
      if (!formData.deadline_date) newErrors.deadline_date = "Obrigatório";
      if (!formData.equity_offered) newErrors.equity_offered = "Obrigatório";
    } else if (step === 5) {
      if (!formData.pitch_deck_url) newErrors.pitch_deck_url = "Obrigatório";
      if (!formData.social_contract_url) newErrors.social_contract_url = "Obrigatório";
      if (!formData.cap_table_url) newErrors.cap_table_url = "Obrigatório";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveProject();
      setCurrentStep(prev => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setErrors({ terms: "Aceite os termos para continuar" });
      return;
    }
    
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/submit`, { method: "POST", credentials: "include" });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || "Erro ao enviar" });
      }
    } catch {
      setErrors({ submit: "Erro de conexão" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-deep mb-3">Projeto enviado!</h2>
          <p className="text-gray-600 mb-6">
            Sua submissão foi recebida e está na fila de análise. 
            Acompanhe o status na página de Projetos.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/app/projetos")}
              className="w-full px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
            >
              Ver Meus Projetos
            </button>
            <button
              onClick={() => navigate("/app")}
              className="w-full px-6 py-3 text-navy hover:bg-gray-50 rounded-xl transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  // Show loading while checking auth
  if (isPending || authState === "loading") {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-navy-deep">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render if unauthenticated (redirect happening)
  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Top Bar */}
      <div className="bg-white border-b border-kate-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/app/projetos")}
              className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Meus Projetos</span>
            </button>
            
            <div className="flex items-center gap-3">
              {saving ? (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Salvando...</span>
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Salvo</span>
                </span>
              ) : null}
              
              <button
                onClick={() => saveProject()}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-navy rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Salvar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-hover rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-navy-deep" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-deep">
                {formData.project_name || "Novo Projeto"}
              </h1>
              <p className="text-sm text-gray-500">
                {progress}% completo • Passo {currentStep} de 6
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-gradient-to-r from-gold to-gold-hover transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="bg-white rounded-xl border border-kate-border p-2 mb-6 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const StepIcon = step.icon;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1 min-w-fit ${
                    isActive
                      ? "bg-gold/10 text-gold-hover"
                      : isCompleted
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? "bg-gold text-navy-deep"
                      : isCompleted
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium hidden lg:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-kate-border shadow-sm">
          <div className="p-6 border-b border-kate-border">
            <h2 className="text-lg font-semibold text-navy-deep">
              {STEPS[currentStep - 1].fullTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentStep === 1 && "Informações sobre a empresa/pessoa responsável"}
              {currentStep === 2 && "Conte sobre sua empresa e proposta de valor"}
              {currentStep === 3 && "Métricas e resultados (opcional, mas recomendado)"}
              {currentStep === 4 && "Defina os termos da sua captação"}
              {currentStep === 5 && "Links para documentos obrigatórios"}
              {currentStep === 6 && "Revise e envie para análise"}
            </p>
          </div>
          
          <div className="p-6">
            {currentStep === 1 && (
              <StepIssuerProfile formData={formData} errors={errors} onChange={handleChange} />
            )}
            {currentStep === 2 && (
              <StepAboutBusiness formData={formData} errors={errors} onChange={handleChange} />
            )}
            {currentStep === 3 && (
              <StepTraction formData={formData} onChange={handleChange} />
            )}
            {currentStep === 4 && (
              <StepOfferProposal formData={formData} errors={errors} onChange={handleChange} />
            )}
            {currentStep === 5 && (
              <StepDocuments formData={formData} errors={errors} onChange={handleChange} />
            )}
            {currentStep === 6 && (
              <StepReview 
                formData={formData} 
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                errors={errors}
                formatCurrency={formatCurrency}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-kate-border flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>
            
            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !termsAccepted}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar para Análise
                  </>
                )}
              </button>
            )}
          </div>
          
          {errors.submit && (
            <div className="mx-6 mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {errors.submit}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepIssuerProfile({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5">
            {formData.document_type === "cnpj" ? "CNPJ" : "CPF"} *
          </label>
          <input
            type="text"
            value={formData.document_number}
            onChange={(e) => onChange("document_number", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.document_number ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder={formData.document_type === "cnpj" ? "00.000.000/0001-00" : "000.000.000-00"}
          />
          {errors.document_number && <p className="mt-1 text-xs text-red-500">{errors.document_number}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5">
            {formData.document_type === "cnpj" ? "Razão Social" : "Nome Completo"} *
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.company_name ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder={formData.document_type === "cnpj" ? "Empresa LTDA" : "Seu nome completo"}
          />
          {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Endereço completo *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.address ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          placeholder="Rua, número, bairro, cidade - estado, CEP"
        />
        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Representante legal *</label>
        <input
          type="text"
          value={formData.legal_representative}
          onChange={(e) => onChange("legal_representative", e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.legal_representative ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          placeholder="Nome do representante legal"
        />
        {errors.legal_representative && <p className="mt-1 text-xs text-red-500">{errors.legal_representative}</p>}
      </div>

      {formData.responsible_name && (
        <div className="bg-kate-bg rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contato da pré-inscrição</p>
          <p className="text-sm text-navy-deep">{formData.responsible_name} • {formData.email} • {formData.whatsapp}</p>
        </div>
      )}
    </div>
  );
}

function StepAboutBusiness({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Descrição curta (1-2 linhas) *</label>
        <input
          type="text"
          value={formData.short_description}
          onChange={(e) => onChange("short_description", e.target.value)}
          maxLength={200}
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.short_description ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          placeholder="Resumo objetivo do que sua empresa faz"
        />
        <div className="flex justify-between mt-1">
          {errors.short_description && <p className="text-xs text-red-500">{errors.short_description}</p>}
          <p className="text-xs text-gray-400 ml-auto">{formData.short_description?.length || 0}/200</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">História completa *</label>
        <textarea
          value={formData.full_description}
          onChange={(e) => onChange("full_description", e.target.value)}
          rows={4}
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.full_description ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none`}
          placeholder="Conte a história da empresa, como surgiu, trajetória..."
        />
        {errors.full_description && <p className="mt-1 text-xs text-red-500">{errors.full_description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Problema / Solução *</label>
        <textarea
          value={formData.problem_solution}
          onChange={(e) => onChange("problem_solution", e.target.value)}
          rows={3}
          className={`w-full px-4 py-2.5 rounded-xl border ${errors.problem_solution ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none`}
          placeholder="Qual problema vocês resolvem e como?"
        />
        {errors.problem_solution && <p className="mt-1 text-xs text-red-500">{errors.problem_solution}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5">Modelo de receita</label>
          <textarea
            value={formData.revenue_model}
            onChange={(e) => onChange("revenue_model", e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            placeholder="Como a empresa ganha dinheiro?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5">Mercado-alvo</label>
          <textarea
            value={formData.target_market}
            onChange={(e) => onChange("target_market", e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            placeholder="Quem são seus clientes?"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Diferencial competitivo</label>
        <textarea
          value={formData.competitive_advantage}
          onChange={(e) => onChange("competitive_advantage", e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="O que diferencia vocês da concorrência?"
        />
      </div>
    </div>
  );
}

function StepTraction({ formData, onChange }: { formData: ProjectData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3 mb-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Todos os campos são opcionais, mas quanto mais informações você fornecer, 
          melhor será a análise e mais atrativa sua oferta ficará para investidores.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5">Receita atual</label>
          <input
            type="text"
            value={formData.current_revenue}
            onChange={(e) => onChange("current_revenue", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50"
            placeholder="Ex: R$ 50.000/mês"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5">Crescimento</label>
          <input
            type="text"
            value={formData.growth_info}
            onChange={(e) => onChange("growth_info", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50"
            placeholder="Ex: 15% ao mês"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Principais métricas</label>
        <textarea
          value={formData.key_metrics}
          onChange={(e) => onChange("key_metrics", e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="Ex: 5.000 clientes ativos, NPS 72, ticket médio R$ 150..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Time (pessoas-chave)</label>
        <textarea
          value={formData.team_info}
          onChange={(e) => onChange("team_info", e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="Fundadores e pessoas-chave. Pode incluir links do LinkedIn."
        />
      </div>
    </div>
  );
}

function StepOfferProposal({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-gray-400" />
            Meta mínima *
          </label>
          <input
            type="number"
            value={formData.min_goal}
            onChange={(e) => onChange("min_goal", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.min_goal ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder="500000"
          />
          <p className="mt-1 text-xs text-gray-400">Valor mínimo para sucesso</p>
          {errors.min_goal && <p className="text-xs text-red-500">{errors.min_goal}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-gray-400" />
            Meta máxima *
          </label>
          <input
            type="number"
            value={formData.max_goal}
            onChange={(e) => onChange("max_goal", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.max_goal ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder="2000000"
          />
          <p className="mt-1 text-xs text-gray-400">Valor máximo da captação</p>
          {errors.max_goal && <p className="text-xs text-red-500">{errors.max_goal}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            Data final da captação *
          </label>
          <input
            type="date"
            value={formData.deadline_date}
            onChange={(e) => onChange("deadline_date", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.deadline_date ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          />
          {errors.deadline_date && <p className="mt-1 text-xs text-red-500">{errors.deadline_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-1.5 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-gray-400" />
            % oferecida *
          </label>
          <input
            type="text"
            value={formData.equity_offered}
            onChange={(e) => onChange("equity_offered", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.equity_offered ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder="Ex: 10% a 20%"
          />
          {errors.equity_offered && <p className="mt-1 text-xs text-red-500">{errors.equity_offered}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Valuation alvo</label>
        <input
          type="text"
          value={formData.target_valuation}
          onChange={(e) => onChange("target_valuation", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50"
          placeholder="Ex: R$ 10 milhões pre-money"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-1.5">Uso dos recursos</label>
        <textarea
          value={formData.use_of_funds}
          onChange={(e) => onChange("use_of_funds", e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="• 40% Marketing&#10;• 30% Produto&#10;• 20% Equipe&#10;• 10% Operacional"
        />
      </div>
    </div>
  );
}

function StepDocuments({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  const docs = [
    { field: "pitch_deck_url", label: "Pitch Deck", required: true, desc: "Apresentação da empresa" },
    { field: "social_contract_url", label: "Contrato Social", required: true, desc: "Documento de constituição" },
    { field: "cap_table_url", label: "Cap Table", required: true, desc: "Tabela de capitalização" },
    { field: "financial_report_url", label: "DRE / Financeiro", required: false, desc: "Demonstrativos financeiros" },
    { field: "other_docs_url", label: "Outros", required: false, desc: "Contratos, patentes..." }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3 mb-2">
        <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Dica de compartilhamento</p>
          <p>Use Google Drive ou Dropbox com "Qualquer pessoa com o link pode ver".</p>
        </div>
      </div>

      {docs.map(doc => (
        <div key={doc.field} className="bg-kate-bg rounded-xl p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-navy-deep mb-2">
            <Upload className="w-4 h-4 text-gray-400" />
            {doc.label} {doc.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="url"
            value={(formData as any)[doc.field] || ""}
            onChange={(e) => onChange(doc.field, e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors[doc.field] ? "border-red-400 bg-red-50/50" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50 bg-white`}
            placeholder="https://drive.google.com/..."
          />
          <p className="mt-1 text-xs text-gray-500">{doc.desc}</p>
          {errors[doc.field] && <p className="mt-1 text-xs text-red-500">{errors[doc.field]}</p>}
        </div>
      ))}
    </div>
  );
}

function StepReview({ formData, termsAccepted, setTermsAccepted, errors, formatCurrency }: { 
  formData: ProjectData; 
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  errors: Record<string, string>;
  formatCurrency: (v: string) => string;
}) {
  const docsChecklist = [
    { label: "Pitch Deck", done: !!formData.pitch_deck_url },
    { label: "Contrato Social", done: !!formData.social_contract_url },
    { label: "Cap Table", done: !!formData.cap_table_url },
    { label: "Financeiro", done: !!formData.financial_report_url, optional: true },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-kate-bg rounded-xl p-4">
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Emissor</h4>
          <p className="font-medium text-navy-deep">{formData.company_name || "-"}</p>
          <p className="text-sm text-gray-600">{formData.document_type?.toUpperCase()}: {formData.document_number || "-"}</p>
        </div>
        <div className="bg-kate-bg rounded-xl p-4">
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Captação</h4>
          <p className="font-medium text-navy-deep">
            {formData.min_goal ? formatCurrency(formData.min_goal) : "-"} - {formData.max_goal ? formatCurrency(formData.max_goal) : "-"}
          </p>
          <p className="text-sm text-gray-600">Equity: {formData.equity_offered || "-"}</p>
        </div>
      </div>

      {/* Docs Checklist */}
      <div className="bg-kate-bg rounded-xl p-4">
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Documentos</h4>
        <div className="grid grid-cols-2 gap-2">
          {docsChecklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <div className={`w-4 h-4 rounded-full border-2 ${item.optional ? "border-gray-300" : "border-red-400"}`} />
              )}
              <span className={`text-sm ${item.done ? "text-gray-700" : item.optional ? "text-gray-400" : "text-red-600"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="bg-amber-50 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-gold focus:ring-gold"
          />
          <span className="text-sm text-gray-700">
            Declaro que todas as informações são verdadeiras e concordo com os{" "}
            <a href="/termos" className="text-navy underline" target="_blank">Termos de Uso</a> e{" "}
            <a href="/regulamento" className="text-navy underline" target="_blank">Regulamento da Plataforma</a>.
          </span>
        </label>
        {errors.terms && <p className="mt-2 text-sm text-red-500">{errors.terms}</p>}
      </div>

      {/* Timeline */}
      <div className="border border-kate-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-navy-deep mb-3">Próximos passos</h4>
        <div className="space-y-2.5">
          {[
            { icon: Clock, label: "Pré-análise", desc: "1-2 dias" },
            { icon: FileText, label: "Due diligence", desc: "3-5 dias" },
            { icon: Target, label: "Estruturação da oferta", desc: "Definição final" },
            { icon: Send, label: "Publicação", desc: "Oferta vai ao ar" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <step.icon className="w-3.5 h-3.5 text-gold-hover" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-navy-deep">{step.label}</span>
                <span className="text-xs text-gray-500">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
