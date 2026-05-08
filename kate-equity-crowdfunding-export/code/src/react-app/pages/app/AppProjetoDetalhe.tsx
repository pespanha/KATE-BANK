import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  Edit,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  BarChart3,
  Info,
  Shield,
  Coins,
  LinkIcon,
  Copy,
  Check
} from "lucide-react";

interface Project {
  id: number;
  project_name: string;
  short_description: string;
  full_description: string;
  category: string;
  status: string;
  submission_progress: number;
  min_goal: number;
  max_goal: number;
  deadline_date: string;
  current_raised: number;
  investor_count: number;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  document_type: string;
  document_number: string;
  company_name: string;
  responsible_name: string;
  email: string;
  whatsapp: string;
  website: string;
  address: string;
  legal_representative: string;
  target_market: string;
  competitive_advantage: string;
  revenue_model: string;
  problem_solution: string;
  current_revenue: string;
  growth_info: string;
  key_metrics: string;
  team_info: string;
  target_valuation: number;
  equity_offered: number;
  use_of_funds: string;
  pitch_deck_url: string;
  social_contract_url: string;
  cap_table_url: string;
  financial_report_url: string;
  other_docs_url: string;
  rejection_reason: string;
  // Blockchain fields
  token_uid: string | null;
  token_symbol: string | null;
  token_tx_hash: string | null;
  total_tokens: number | null;
  escrow_address: string | null;
  is_blockchain_verified: number | null;
  fundraising_started_at: string | null;
  fundraising_ended_at: string | null;
}

interface TimelineEvent {
  id: number;
  project_id: number;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; description: string }> = {
  draft: { 
    label: "Rascunho", 
    color: "text-gray-600", 
    bg: "bg-gray-100", 
    icon: FileText,
    description: "Complete a submissão para enviar para análise"
  },
  pending_review: { 
    label: "Em Análise", 
    color: "text-amber-600", 
    bg: "bg-amber-100", 
    icon: Clock,
    description: "Sua submissão está sendo avaliada pela equipe Kate"
  },
  under_diligence: { 
    label: "Due Diligence", 
    color: "text-blue-600", 
    bg: "bg-blue-100", 
    icon: Eye,
    description: "Verificação detalhada em andamento"
  },
  changes_requested: { 
    label: "Ajustes Solicitados", 
    color: "text-orange-600", 
    bg: "bg-orange-100", 
    icon: AlertCircle,
    description: "A equipe Kate solicitou alterações no projeto"
  },
  approved: { 
    label: "Aprovado", 
    color: "text-green-600", 
    bg: "bg-green-100", 
    icon: CheckCircle2,
    description: "Projeto aprovado! Aguardando criação da oferta"
  },
  offer_created: { 
    label: "Oferta Criada", 
    color: "text-purple-600", 
    bg: "bg-purple-100", 
    icon: Target,
    description: "Sua oferta foi configurada e está pronta para publicação"
  },
  live: { 
    label: "Em Captação", 
    color: "text-gold-hover", 
    bg: "bg-gold/20", 
    icon: TrendingUp,
    description: "Sua oferta está ativa e recebendo investimentos"
  },
  funded: { 
    label: "Meta Atingida", 
    color: "text-emerald-600", 
    bg: "bg-emerald-100", 
    icon: Target,
    description: "Parabéns! A meta mínima foi atingida"
  },
  closed_success: { 
    label: "Encerrado - Sucesso", 
    color: "text-green-700", 
    bg: "bg-green-200", 
    icon: CheckCircle2,
    description: "Captação concluída com sucesso"
  },
  closed_failed: { 
    label: "Não Atingiu Meta", 
    color: "text-red-600", 
    bg: "bg-red-100", 
    icon: XCircle,
    description: "A captação foi encerrada sem atingir a meta"
  },
  rejected: { 
    label: "Recusado", 
    color: "text-red-600", 
    bg: "bg-red-100", 
    icon: XCircle,
    description: "Projeto não foi aprovado"
  }
};

const TIMELINE_STEPS = [
  { key: "draft", label: "Rascunho", icon: FileText },
  { key: "pending_review", label: "Análise", icon: Clock },
  { key: "approved", label: "Aprovado", icon: CheckCircle2 },
  { key: "offer_created", label: "Oferta", icon: Target },
  { key: "live", label: "Captação", icon: TrendingUp },
];

export default function AppProjetoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "documents" | "activity">("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      } else {
        navigate("/app/projetos");
      }

      // Fetch all events and filter for this project
      const eventsRes = await fetch("/api/user/project-events", { credentials: "include" });
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents((eventsData.events || []).filter((e: TimelineEvent) => e.project_id === parseInt(id || "0")));
      }
    } catch (e) {
      console.error("Error fetching project:", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: string): number => {
    const statusMap: Record<string, number> = {
      draft: 0,
      pending_review: 1,
      under_diligence: 1,
      changes_requested: 1,
      approved: 2,
      offer_created: 3,
      live: 4,
      funded: 4,
      closed_success: 5,
      closed_failed: 5,
      rejected: -1
    };
    return statusMap[status] ?? 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Projeto não encontrado</p>
        <Link to="/app/projetos" className="text-gold-hover hover:underline mt-2 inline-block">
          Voltar para projetos
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const currentStepIndex = getStatusStepIndex(project.status);
  const isRejected = project.status === "rejected";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        to="/app/projetos"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy-deep transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para projetos
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Project Info */}
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center flex-shrink-0">
                <Building2 className="w-10 h-10 text-white/70" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {project.category && (
                    <span className="px-2.5 py-1 bg-kate-bg text-gray-600 text-xs font-medium rounded-full">
                      {project.category}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-navy-deep mb-1">
                  {project.project_name || "Projeto sem nome"}
                </h1>
                {project.company_name && (
                  <p className="text-gray-500">{project.company_name}</p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  {statusConfig.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {project.status === "draft" && (
                <Link
                  to={`/app/projetos/novo?project=${project.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Continuar submissão
                </Link>
              )}
              {project.status === "live" && (
                <a
                  href={`/oportunidades`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver oferta pública
                </a>
              )}
              <Link
                to="/app/mensagens"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-kate-border hover:border-navy/30 text-navy-deep font-medium rounded-xl transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Falar com equipe
              </Link>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {!isRejected && (
          <div className="px-6 pb-6">
            <div className="bg-kate-bg rounded-xl p-4">
              <div className="flex items-center gap-2">
                {TIMELINE_STEPS.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isCurrent
                            ? "bg-gold text-navy-deep"
                            : "bg-white text-gray-400 border border-gray-200"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>
                        <span className={`text-xs text-center font-medium ${
                          isCurrent ? "text-navy-deep" : "text-gray-400"
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < TIMELINE_STEPS.length - 1 && (
                        <div className={`h-1 flex-1 mx-2 mt-[-20px] rounded-full ${
                          index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rejected Notice */}
        {isRejected && (
          <div className="mx-6 mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Projeto não aprovado</p>
                {project.rejection_reason && (
                  <p className="text-sm text-red-700 mt-1">{project.rejection_reason}</p>
                )}
                <p className="text-sm text-red-600 mt-2">
                  Entre em contato para mais informações sobre como proceder.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "overview", label: "Visão Geral", icon: BarChart3 },
          { key: "details", label: "Detalhes", icon: Info },
          { key: "documents", label: "Documentos", icon: FileText },
          { key: "activity", label: "Atividade", icon: Clock }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-navy text-white"
                  : "bg-white border border-kate-border text-gray-600 hover:border-navy/30"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <OverviewTab project={project} formatCurrency={formatCurrency} formatDate={formatDate} />
          )}
          {activeTab === "details" && (
            <DetailsTab project={project} />
          )}
          {activeTab === "documents" && (
            <DocumentsTab project={project} />
          )}
          {activeTab === "activity" && (
            <ActivityTab events={events} formatTimeAgo={formatTimeAgo} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          {(project.status === "live" || project.status === "funded" || project.status === "closed_success") && (
            <div className="bg-white rounded-2xl border border-kate-border p-5">
              <h3 className="font-semibold text-navy-deep mb-4">Captação</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Captado</span>
                    <span className="font-bold text-green-600">{formatCurrency(project.current_raised || 0)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, ((project.current_raised || 0) / project.min_goal) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Meta: {formatCurrency(project.min_goal)} - {formatCurrency(project.max_goal)}
                  </p>
                </div>
                <div className="flex items-center justify-between py-3 border-t border-kate-border">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Investidores</span>
                  </div>
                  <span className="font-bold text-navy-deep">{project.investor_count || 0}</span>
                </div>
                {project.deadline_date && (
                  <div className="flex items-center justify-between py-3 border-t border-kate-border">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Prazo</span>
                    </div>
                    <span className="font-medium text-navy-deep">{formatDate(project.deadline_date)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Goals Card (for non-live projects) */}
          {!["live", "funded", "closed_success", "closed_failed"].includes(project.status) && project.min_goal > 0 && (
            <div className="bg-white rounded-2xl border border-kate-border p-5">
              <h3 className="font-semibold text-navy-deep mb-4">Metas Definidas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Meta mínima</span>
                  <span className="font-semibold text-navy-deep">{formatCurrency(project.min_goal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Meta máxima</span>
                  <span className="font-semibold text-navy-deep">{formatCurrency(project.max_goal || project.min_goal)}</span>
                </div>
                {project.target_valuation && (
                  <div className="flex items-center justify-between pt-3 border-t border-kate-border">
                    <span className="text-sm text-gray-500">Valuation</span>
                    <span className="font-semibold text-navy-deep">{formatCurrency(project.target_valuation)}</span>
                  </div>
                )}
                {project.equity_offered && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Equity oferecido</span>
                    <span className="font-semibold text-navy-deep">{project.equity_offered}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <h3 className="font-semibold text-navy-deep mb-4">Contato</h3>
            <div className="space-y-3">
              {project.responsible_name && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-kate-bg rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Responsável</p>
                    <p className="text-sm font-medium text-navy-deep">{project.responsible_name}</p>
                  </div>
                </div>
              )}
              {project.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-kate-bg rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-navy-deep">{project.email}</p>
                  </div>
                </div>
              )}
              {project.whatsapp && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-kate-bg rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">WhatsApp</p>
                    <p className="text-sm font-medium text-navy-deep">{project.whatsapp}</p>
                  </div>
                </div>
              )}
              {project.website && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-kate-bg rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Website</p>
                    <a 
                      href={project.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gold-hover hover:underline"
                    >
                      {project.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Info */}
          {project.token_uid && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-navy-deep">Blockchain</h3>
                {project.is_blockchain_verified === 1 && (
                  <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Verificado
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Token Info */}
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      Token do Projeto
                    </span>
                    {project.token_symbol && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                        {project.token_symbol}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-navy-deep bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                      {truncateHash(project.token_uid)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(project.token_uid!, 'token')}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copiar"
                    >
                      {copiedField === 'token' ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    <a
                      href={`https://explorer.hathor.network/token_detail/${project.token_uid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver no Explorer"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                    </a>
                  </div>
                  {project.total_tokens && (
                    <p className="text-xs text-gray-500 mt-2">
                      Total: {project.total_tokens.toLocaleString("pt-BR")} tokens
                    </p>
                  )}
                </div>

                {/* Escrow Address */}
                {project.escrow_address && (
                  <div className="bg-white/60 rounded-xl p-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <Shield className="w-3 h-3" />
                      Endereço Escrow
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-navy-deep bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                        {truncateHash(project.escrow_address)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(project.escrow_address!, 'escrow')}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedField === 'escrow' ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={`https://explorer.hathor.network/address/${project.escrow_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver no Explorer"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Token Creation TX */}
                {project.token_tx_hash && (
                  <div className="bg-white/60 rounded-xl p-3">
                    <span className="text-xs text-gray-500 mb-2 block">Transação de Criação</span>
                    <a
                      href={`https://explorer.hathor.network/transaction/${project.token_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {truncateHash(project.token_tx_hash)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Fundraising Dates */}
                {project.fundraising_started_at && (
                  <div className="pt-3 border-t border-purple-200/50 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Captação iniciada</span>
                      <span>{new Date(project.fundraising_started_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {project.fundraising_ended_at && (
                      <div className="flex justify-between">
                        <span>Captação encerrada</span>
                        <span>{new Date(project.fundraising_ended_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Registrado na rede Hathor Network
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <h3 className="font-semibold text-navy-deep mb-4">Datas</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Criado em</span>
                <span className="text-navy-deep">{formatDate(project.created_at)}</span>
              </div>
              {project.submitted_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Submetido em</span>
                  <span className="text-navy-deep">{formatDate(project.submitted_at)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Última atualização</span>
                <span className="text-navy-deep">{formatDate(project.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: Project; formatCurrency: (v: number) => string; formatDate: (d: string) => string }) {
  return (
    <>
      {/* Description */}
      {project.short_description && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h3 className="font-semibold text-navy-deep mb-3">Sobre o Projeto</h3>
          <p className="text-gray-600 leading-relaxed">{project.short_description}</p>
          {project.full_description && (
            <p className="text-gray-600 leading-relaxed mt-3">{project.full_description}</p>
          )}
        </div>
      )}

      {/* Problem & Solution */}
      {project.problem_solution && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h3 className="font-semibold text-navy-deep mb-3">Problema e Solução</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{project.problem_solution}</p>
        </div>
      )}

      {/* Business Info Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {project.target_market && (
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <h4 className="font-medium text-navy-deep mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />
              Mercado Alvo
            </h4>
            <p className="text-sm text-gray-600">{project.target_market}</p>
          </div>
        )}
        {project.competitive_advantage && (
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <h4 className="font-medium text-navy-deep mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-gold" />
              Diferencial
            </h4>
            <p className="text-sm text-gray-600">{project.competitive_advantage}</p>
          </div>
        )}
        {project.revenue_model && (
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <h4 className="font-medium text-navy-deep mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              Modelo de Receita
            </h4>
            <p className="text-sm text-gray-600">{project.revenue_model}</p>
          </div>
        )}
        {project.current_revenue && (
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <h4 className="font-medium text-navy-deep mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gold" />
              Receita Atual
            </h4>
            <p className="text-sm text-gray-600">{project.current_revenue}</p>
          </div>
        )}
      </div>

      {/* Use of Funds */}
      {project.use_of_funds && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h3 className="font-semibold text-navy-deep mb-3">Uso dos Recursos</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{project.use_of_funds}</p>
        </div>
      )}

      {/* Team */}
      {project.team_info && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h3 className="font-semibold text-navy-deep mb-3">Equipe</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{project.team_info}</p>
        </div>
      )}
    </>
  );
}

function DetailsTab({ project }: { project: Project }) {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-6">
      <h3 className="font-semibold text-navy-deep mb-6">Informações da Empresa</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <InfoItem label="Tipo de Documento" value={project.document_type?.toUpperCase()} />
        <InfoItem label="Número do Documento" value={project.document_number} />
        <InfoItem label="Razão Social" value={project.company_name} />
        <InfoItem label="Representante Legal" value={project.legal_representative} />
        <InfoItem label="Endereço" value={project.address} className="md:col-span-2" />
      </div>

      {(project.key_metrics || project.growth_info) && (
        <>
          <h3 className="font-semibold text-navy-deep mt-8 mb-4">Métricas e Crescimento</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {project.key_metrics && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-400 mb-1">Métricas Chave</p>
                <p className="text-gray-700 whitespace-pre-wrap">{project.key_metrics}</p>
              </div>
            )}
            {project.growth_info && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-400 mb-1">Informações de Crescimento</p>
                <p className="text-gray-700 whitespace-pre-wrap">{project.growth_info}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InfoItem({ label, value, className = "" }: { label: string; value: string | undefined; className?: string }) {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-gray-700">{value}</p>
    </div>
  );
}

function DocumentsTab({ project }: { project: Project }) {
  const documents = [
    { label: "Pitch Deck", url: project.pitch_deck_url, icon: FileText },
    { label: "Contrato Social", url: project.social_contract_url, icon: FileText },
    { label: "Cap Table", url: project.cap_table_url, icon: FileText },
    { label: "Relatório Financeiro", url: project.financial_report_url, icon: BarChart3 },
    { label: "Outros Documentos", url: project.other_docs_url, icon: FileText },
  ].filter(doc => doc.url);

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Nenhum documento anexado</p>
        {project.status === "draft" && (
          <Link
            to={`/app/projetos/novo?project=${project.id}`}
            className="inline-flex items-center gap-2 text-gold-hover hover:underline mt-2"
          >
            Adicionar documentos <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-kate-border divide-y divide-kate-border">
      {documents.map((doc, index) => {
        const DocIcon = doc.icon;
        return (
          <a
            key={index}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-kate-bg rounded-xl flex items-center justify-center">
                <DocIcon className="w-5 h-5 text-gray-500" />
              </div>
              <span className="font-medium text-navy-deep">{doc.label}</span>
            </div>
            <div className="flex items-center gap-2 text-gold-hover">
              <span className="text-sm">Abrir</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>
        );
      })}
    </div>
  );
}

function ActivityTab({ events, formatTimeAgo }: { events: TimelineEvent[]; formatTimeAgo: (d: string) => string }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Nenhuma atividade registrada</p>
      </div>
    );
  }

  const eventIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    status_change: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    offer_created: { icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
    offer_status: { icon: TrendingUp, color: "text-gold-hover", bg: "bg-gold/10" },
    offer_closed: { icon: CheckCircle2, color: "text-navy", bg: "bg-navy/10" },
    message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    document: { icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
    default: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100" }
  };

  return (
    <div className="bg-white rounded-2xl border border-kate-border p-6">
      <h3 className="font-semibold text-navy-deep mb-6">Histórico de Atividades</h3>
      <div className="space-y-0">
        {events.map((event, index) => {
          const config = eventIcons[event.event_type] || eventIcons.default;
          const Icon = config.icon;
          
          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                {index < events.length - 1 && (
                  <div className="w-px flex-1 bg-kate-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-navy-deep">{event.title}</p>
                  <span className="text-xs text-gray-400">{formatTimeAgo(event.created_at)}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
