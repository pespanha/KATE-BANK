import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import AppLayout from "@/react-app/components/AppLayout";
import {
  Building2,
  FileText,
  TrendingUp,
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
  Target,
  DollarSign,
  Calendar,
  Percent,
  Link as LinkIcon,
  Briefcase
} from "lucide-react";

interface ProjectData {
  id?: number;
  // Step 1 - Issuer Profile
  document_type: string;
  document_number: string;
  company_name: string;
  address: string;
  legal_representative: string;
  responsible_name: string;
  email: string;
  whatsapp: string;
  // Step 2 - About the Business
  project_name: string;
  short_description: string;
  full_description: string;
  problem_solution: string;
  revenue_model: string;
  target_market: string;
  competitive_advantage: string;
  // Step 3 - Traction
  current_revenue: string;
  growth_info: string;
  key_metrics: string;
  team_info: string;
  // Step 4 - Offer Proposal
  min_goal: string;
  max_goal: string;
  deadline_date: string;
  target_valuation: string;
  equity_offered: string;
  use_of_funds: string;
  // Step 5 - Documents
  pitch_deck_url: string;
  social_contract_url: string;
  cap_table_url: string;
  financial_report_url: string;
  other_docs_url: string;
  // Meta
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
  { id: 1, title: "Perfil do Emissor", icon: Building2 },
  { id: 2, title: "Sobre o Negócio", icon: Briefcase },
  { id: 3, title: "Tração e Números", icon: TrendingUp },
  { id: 4, title: "Proposta de Oferta", icon: Target },
  { id: 5, title: "Documentos", icon: Upload },
  { id: 6, title: "Revisão e Envio", icon: Send }
];

export default function SubmissaoWizard() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
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

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      const projectIdParam = searchParams.get("project");
      
      if (projectIdParam) {
        // Try to claim and load existing project
        try {
          await fetch(`/api/projects/${projectIdParam}/claim`, { method: "POST", credentials: "include" });
          const res = await fetch(`/api/projects/${projectIdParam}`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setProjectId(parseInt(projectIdParam));
            setFormData(prev => ({ ...prev, ...data.project }));
          }
        } catch (e) {
          console.error("Error loading project:", e);
        }
      } else {
        // Check for pending project from localStorage
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
          // Load user's most recent draft project
          try {
            const res = await fetch("/api/user/projects", { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              const draftProject = data.projects?.find((p: any) => p.status === "draft");
              if (draftProject) {
                setProjectId(draftProject.id);
                setFormData(prev => ({ ...prev, ...draftProject }));
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
    }
  }, [user, searchParams]);

  // Autosave
  const saveProject = useCallback(async () => {
    if (!projectId || saving) return;
    
    setSaving(true);
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
      }
    } catch (e) {
      console.error("Error saving project:", e);
    } finally {
      setSaving(false);
    }
  }, [projectId, formData, saving]);

  // Debounced autosave
  useEffect(() => {
    if (!projectId) return;
    
    const timeout = setTimeout(() => {
      saveProject();
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [formData, projectId]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setErrors({ terms: "Aceite os termos para continuar" });
      return;
    }
    
    // Validate all required steps
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
      <AppLayout title="Submissão de Projeto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (submitted) {
    return (
      <AppLayout title="Projeto Enviado!">
        <div className="max-w-xl mx-auto text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-deep mb-4">
            Projeto enviado para análise!
          </h2>
          <p className="text-gray-600 mb-8">
            Nossa equipe irá analisar sua submissão. Você pode acompanhar o status 
            e receber atualizações na página de Meus Projetos.
          </p>
          <button
            onClick={() => window.location.href = "/app/projetos"}
            className="px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
          >
            Ver Meus Projetos
          </button>
        </div>
      </AppLayout>
    );
  }

  const progress = calculateProgress();

  return (
    <AppLayout title="Submissão de Projeto" subtitle={formData.project_name || "Complete as etapas para enviar para análise"}>
      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-kate-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-deep">{progress}% completo</span>
            {saving && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Salvando...
              </span>
            )}
            {lastSaved && !saving && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="w-3 h-3" />
                Salvo
              </span>
            )}
          </div>
          <button
            onClick={saveProject}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-navy hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar rascunho
          </button>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold to-gold-hover transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="bg-white rounded-xl border border-kate-border p-4 mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-gold/10 text-gold-hover font-medium"
                      : isCompleted
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    isActive
                      ? "bg-gold text-navy-deep"
                      : isCompleted
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="hidden sm:inline text-sm">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-kate-border p-6">
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
          <StepDocuments formData={formData} onChange={handleChange} />
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

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-kate-border">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>
          
          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
            >
              Próximo
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !termsAccepted}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-4 p-4 bg-red-50 rounded-xl flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {errors.submit}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Step 1: Issuer Profile
function StepIssuerProfile({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-deep mb-1">Perfil do Emissor</h3>
        <p className="text-sm text-gray-500">Informações sobre a pessoa/empresa responsável pela captação</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">
            {formData.document_type === "cnpj" ? "CNPJ" : "CPF"} *
          </label>
          <input
            type="text"
            value={formData.document_number}
            onChange={(e) => onChange("document_number", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.document_number ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder={formData.document_type === "cnpj" ? "00.000.000/0001-00" : "000.000.000-00"}
          />
          {errors.document_number && <p className="mt-1 text-sm text-red-500">{errors.document_number}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">
            {formData.document_type === "cnpj" ? "Razão Social" : "Nome Completo"} *
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.company_name ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder={formData.document_type === "cnpj" ? "Empresa LTDA" : "Seu nome completo"}
          />
          {errors.company_name && <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Endereço completo *</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${errors.address ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          placeholder="Rua, número, bairro, cidade, estado, CEP"
        />
        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Representante legal *</label>
        <input
          type="text"
          value={formData.legal_representative}
          onChange={(e) => onChange("legal_representative", e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${errors.legal_representative ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          placeholder="Nome do representante legal"
        />
        {errors.legal_representative && <p className="mt-1 text-sm text-red-500">{errors.legal_representative}</p>}
      </div>

      <div className="bg-kate-bg rounded-xl p-4">
        <p className="text-sm text-gray-600">
          <strong>Contatos da pré-inscrição:</strong> {formData.responsible_name} • {formData.email} • {formData.whatsapp}
        </p>
      </div>
    </div>
  );
}

// Step 2: About the Business
function StepAboutBusiness({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-deep mb-1">Sobre o Negócio</h3>
        <p className="text-sm text-gray-500">Conte sobre sua empresa e o que ela faz</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Descrição curta (1-2 linhas) *</label>
        <input
          type="text"
          value={formData.short_description}
          onChange={(e) => onChange("short_description", e.target.value)}
          maxLength={200}
          className={`w-full px-4 py-3 rounded-xl border ${errors.short_description ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          placeholder="Resumo objetivo do que sua empresa faz"
        />
        <p className="mt-1 text-xs text-gray-400">{formData.short_description?.length || 0}/200 caracteres</p>
        {errors.short_description && <p className="mt-1 text-sm text-red-500">{errors.short_description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">História completa *</label>
        <textarea
          value={formData.full_description}
          onChange={(e) => onChange("full_description", e.target.value)}
          rows={5}
          className={`w-full px-4 py-3 rounded-xl border ${errors.full_description ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none`}
          placeholder="Conte a história da empresa, como surgiu, trajetória..."
        />
        {errors.full_description && <p className="mt-1 text-sm text-red-500">{errors.full_description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Problema / Solução *</label>
        <textarea
          value={formData.problem_solution}
          onChange={(e) => onChange("problem_solution", e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border ${errors.problem_solution ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none`}
          placeholder="Qual problema vocês resolvem e como?"
        />
        {errors.problem_solution && <p className="mt-1 text-sm text-red-500">{errors.problem_solution}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">Modelo de receita</label>
          <textarea
            value={formData.revenue_model}
            onChange={(e) => onChange("revenue_model", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            placeholder="Como a empresa ganha dinheiro?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">Mercado-alvo</label>
          <textarea
            value={formData.target_market}
            onChange={(e) => onChange("target_market", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            placeholder="Quem são seus clientes?"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Diferencial competitivo</label>
        <textarea
          value={formData.competitive_advantage}
          onChange={(e) => onChange("competitive_advantage", e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="O que diferencia vocês da concorrência?"
        />
      </div>
    </div>
  );
}

// Step 3: Traction
function StepTraction({ formData, onChange }: { formData: ProjectData; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-deep mb-1">Tração e Números</h3>
        <p className="text-sm text-gray-500">Métricas e time (todos os campos são opcionais)</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">Receita atual</label>
          <input
            type="text"
            value={formData.current_revenue}
            onChange={(e) => onChange("current_revenue", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50"
            placeholder="Ex: R$ 50.000/mês ou R$ 600.000/ano"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">Crescimento</label>
          <input
            type="text"
            value={formData.growth_info}
            onChange={(e) => onChange("growth_info", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50"
            placeholder="Ex: 15% ao mês, dobrou no último ano"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Principais métricas</label>
        <textarea
          value={formData.key_metrics}
          onChange={(e) => onChange("key_metrics", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="Ex: 5.000 clientes ativos, NPS 72, ticket médio R$ 150..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Time (pessoas-chave)</label>
        <textarea
          value={formData.team_info}
          onChange={(e) => onChange("team_info", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="Descreva os fundadores e pessoas-chave. Pode incluir links do LinkedIn."
        />
      </div>

      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Estes campos são opcionais, mas quanto mais informações, melhor a análise e mais atrativo para investidores.
        </p>
      </div>
    </div>
  );
}

// Step 4: Offer Proposal
function StepOfferProposal({ formData, errors, onChange }: { formData: ProjectData; errors: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-deep mb-1">Proposta de Oferta</h3>
        <p className="text-sm text-gray-500">Defina os termos da sua captação</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Meta mínima *
          </label>
          <input
            type="number"
            value={formData.min_goal}
            onChange={(e) => onChange("min_goal", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.min_goal ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder="500000"
          />
          <p className="mt-1 text-xs text-gray-400">Valor mínimo para a oferta ser bem-sucedida</p>
          {errors.min_goal && <p className="mt-1 text-sm text-red-500">{errors.min_goal}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Meta máxima *
          </label>
          <input
            type="number"
            value={formData.max_goal}
            onChange={(e) => onChange("max_goal", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.max_goal ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder="2000000"
          />
          <p className="mt-1 text-xs text-gray-400">Valor máximo da captação</p>
          {errors.max_goal && <p className="mt-1 text-sm text-red-500">{errors.max_goal}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data final da captação *
          </label>
          <input
            type="date"
            value={formData.deadline_date}
            onChange={(e) => onChange("deadline_date", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.deadline_date ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
          />
          {errors.deadline_date && <p className="mt-1 text-sm text-red-500">{errors.deadline_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-deep mb-2">
            <Percent className="w-4 h-4 inline mr-1" />
            % oferecida *
          </label>
          <input
            type="text"
            value={formData.equity_offered}
            onChange={(e) => onChange("equity_offered", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.equity_offered ? "border-red-400" : "border-kate-border"} focus:outline-none focus:ring-2 focus:ring-gold/50`}
            placeholder="Ex: 10% a 20%"
          />
          {errors.equity_offered && <p className="mt-1 text-sm text-red-500">{errors.equity_offered}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Valuation alvo (ou faixa)</label>
        <input
          type="text"
          value={formData.target_valuation}
          onChange={(e) => onChange("target_valuation", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50"
          placeholder="Ex: R$ 10 milhões pre-money"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-deep mb-2">Uso dos recursos</label>
        <textarea
          value={formData.use_of_funds}
          onChange={(e) => onChange("use_of_funds", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          placeholder="• 40% Marketing e aquisição de clientes&#10;• 30% Desenvolvimento de produto&#10;• 20% Equipe&#10;• 10% Operacional"
        />
      </div>
    </div>
  );
}

// Step 5: Documents
function StepDocuments({ formData, onChange }: { formData: ProjectData; onChange: (field: string, value: string) => void }) {
  const docs = [
    { field: "pitch_deck_url", label: "Pitch Deck", required: true, description: "Apresentação da empresa e oportunidade" },
    { field: "social_contract_url", label: "Contrato Social / Estatuto", required: true, description: "Documento de constituição da empresa" },
    { field: "cap_table_url", label: "Cap Table", required: true, description: "Tabela de capitalização atual" },
    { field: "financial_report_url", label: "DRE / Relatório Financeiro", required: false, description: "Demonstrativos financeiros (se disponível)" },
    { field: "other_docs_url", label: "Outros documentos", required: false, description: "Contratos, patentes, certificações..." }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-deep mb-1">Documentos</h3>
        <p className="text-sm text-gray-500">Insira os links para os documentos (Google Drive, Dropbox, etc.)</p>
      </div>

      <div className="space-y-4">
        {docs.map(doc => (
          <div key={doc.field} className="bg-kate-bg rounded-xl p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-navy-deep mb-2">
              <Upload className="w-4 h-4" />
              {doc.label} {doc.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="url"
              value={(formData as any)[doc.field] || ""}
              onChange={(e) => onChange(doc.field, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-kate-border focus:outline-none focus:ring-2 focus:ring-gold/50 bg-white"
              placeholder="https://drive.google.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">{doc.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">Dica</p>
          <p className="text-sm text-blue-700">
            Certifique-se de que os links estão com permissão de acesso. 
            Recomendamos usar Google Drive ou Dropbox com "Qualquer pessoa com o link pode ver".
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 6: Review
function StepReview({ formData, termsAccepted, setTermsAccepted, errors, formatCurrency }: { 
  formData: ProjectData; 
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  errors: Record<string, string>;
  formatCurrency: (v: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-deep mb-1">Revisão e Envio</h3>
        <p className="text-sm text-gray-500">Confira as informações antes de enviar</p>
      </div>

      {/* Preview Card */}
      <div className="border-2 border-dashed border-kate-border rounded-2xl p-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Preview do card da oferta</p>
        <div className="bg-white rounded-xl border border-kate-border overflow-hidden max-w-sm">
          <div className="h-32 bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/50" />
          </div>
          <div className="p-4">
            <span className="px-2 py-1 bg-gold/10 text-gold-hover text-xs font-medium rounded-full">
              {formData.category || "Categoria"}
            </span>
            <h4 className="font-bold text-navy-deep mt-2">{formData.project_name || "Nome do projeto"}</h4>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {formData.short_description || "Descrição curta do projeto..."}
            </p>
            <div className="mt-4 pt-4 border-t border-kate-border">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Meta</span>
                <span className="font-semibold text-navy-deep">
                  {formData.min_goal ? formatCurrency(formData.min_goal) : "R$ --"} - {formData.max_goal ? formatCurrency(formData.max_goal) : "R$ --"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-kate-bg rounded-xl p-4">
          <h4 className="font-medium text-navy-deep mb-2">Emissor</h4>
          <p className="text-sm text-gray-600">{formData.company_name || "-"}</p>
          <p className="text-sm text-gray-600">{formData.document_type?.toUpperCase()}: {formData.document_number || "-"}</p>
        </div>
        <div className="bg-kate-bg rounded-xl p-4">
          <h4 className="font-medium text-navy-deep mb-2">Captação</h4>
          <p className="text-sm text-gray-600">
            Meta: {formData.min_goal ? formatCurrency(formData.min_goal) : "-"} - {formData.max_goal ? formatCurrency(formData.max_goal) : "-"}
          </p>
          <p className="text-sm text-gray-600">Equity: {formData.equity_offered || "-"}</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-kate-bg rounded-xl p-4">
        <h4 className="font-medium text-navy-deep mb-3">Checklist de documentos</h4>
        <div className="space-y-2">
          {[
            { label: "Pitch Deck", done: !!formData.pitch_deck_url },
            { label: "Contrato Social", done: !!formData.social_contract_url },
            { label: "Cap Table", done: !!formData.cap_table_url },
            { label: "Relatório Financeiro", done: !!formData.financial_report_url, optional: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 ${item.optional ? "border-gray-300" : "border-red-400"}`} />
              )}
              <span className={`text-sm ${item.done ? "text-gray-700" : item.optional ? "text-gray-400" : "text-red-600"}`}>
                {item.label} {item.optional && "(opcional)"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="bg-yellow-50 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-gold focus:ring-gold"
          />
          <span className="text-sm text-gray-700">
            Declaro que todas as informações fornecidas são verdadeiras e que li e concordo com os{" "}
            <a href="/termos" className="text-navy underline" target="_blank">Termos de Uso</a> e{" "}
            <a href="/regulamento" className="text-navy underline" target="_blank">Regulamento da Plataforma</a>.
            Entendo que a Kate irá analisar minha submissão e pode solicitar ajustes.
          </span>
        </label>
        {errors.terms && <p className="mt-2 text-sm text-red-500">{errors.terms}</p>}
      </div>

      {/* Timeline info */}
      <div className="border border-kate-border rounded-xl p-4">
        <h4 className="font-medium text-navy-deep mb-4">O que acontece depois?</h4>
        <div className="space-y-3">
          {[
            { icon: Clock, label: "Pré-análise", desc: "Verificação inicial dos documentos (1-2 dias)" },
            { icon: FileText, label: "Due diligence", desc: "Análise detalhada do projeto (3-5 dias)" },
            { icon: Target, label: "Estruturação", desc: "Definição dos termos da oferta" },
            { icon: Send, label: "Publicação", desc: "Oferta vai ao ar para investidores" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <step.icon className="w-4 h-4 text-gold-hover" />
              </div>
              <div>
                <p className="font-medium text-navy-deep text-sm">{step.label}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
