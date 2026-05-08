import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  TrendingUp,
  Users,
  Plus,
  ChevronRight,
  Loader2,
  MessageSquare,
  Target,
  ArrowRight,
  Building2,
  Sparkles,
  Edit,
  Calendar
} from "lucide-react";

interface Project {
  id: number;
  project_name: string;
  short_description: string;
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
}

interface TimelineEvent {
  id: number;
  project_id: number;
  project_name: string;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Rascunho", color: "text-gray-600", bg: "bg-gray-100", icon: FileText },
  pending_review: { label: "Em Análise", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  under_diligence: { label: "Due Diligence", color: "text-blue-600", bg: "bg-blue-100", icon: Eye },
  changes_requested: { label: "Ajustes Solicitados", color: "text-orange-600", bg: "bg-orange-100", icon: AlertCircle },
  approved: { label: "Aprovado", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
  offer_created: { label: "Oferta Criada", color: "text-purple-600", bg: "bg-purple-100", icon: Target },
  live: { label: "Em Captação", color: "text-gold-hover", bg: "bg-gold/20", icon: TrendingUp },
  funded: { label: "Meta Atingida", color: "text-emerald-600", bg: "bg-emerald-100", icon: Target },
  closed_success: { label: "Encerrado - Sucesso", color: "text-green-700", bg: "bg-green-200", icon: CheckCircle2 },
  closed_failed: { label: "Não Atingiu Meta", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
  rejected: { label: "Recusado", color: "text-red-600", bg: "bg-red-100", icon: XCircle }
};

const TIMELINE_STEPS = [
  { key: "draft", label: "Rascunho" },
  { key: "pending_review", label: "Análise" },
  { key: "approved", label: "Aprovado" },
  { key: "offer_created", label: "Oferta" },
  { key: "live", label: "Captação" },
];

export default function AppProjetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    pendingReview: 0,
    approved: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/user/projects", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        
        const projectList = data.projects || [];
        setStats({
          total: projectList.length,
          live: projectList.filter((p: Project) => p.status === "live").length,
          pendingReview: projectList.filter((p: Project) => p.status === "pending_review").length,
          approved: projectList.filter((p: Project) => ["approved", "offer_created"].includes(p.status)).length
        });
      }
      
      const eventsRes = await fetch("/api/user/project-events", { credentials: "include" });
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-deep">Meus Projetos</h1>
          <p className="text-gray-500 mt-1">
            Gerencie seus projetos de captação
          </p>
        </div>
        <Link
          to="/app/projetos/novo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo projeto
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-navy/10 to-navy/5 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-navy" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de projetos</p>
              <p className="text-xl font-bold text-navy-deep">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em análise</p>
              <p className="text-xl font-bold text-navy-deep">{stats.pendingReview}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprovados</p>
              <p className="text-xl font-bold text-navy-deep">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em captação</p>
              <p className="text-xl font-bold text-navy-deep">{stats.live}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-navy-deep">Seus Projetos</h2>
          
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  formatCurrency={formatCurrency}
                  getStatusStepIndex={getStatusStepIndex}
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy-deep">Atividade Recente</h2>
          
          {events.length === 0 ? (
            <NoActivityState hasProjects={projects.length > 0} />
          ) : (
            <div className="bg-white rounded-2xl border border-kate-border divide-y divide-kate-border">
              {events.slice(0, 8).map((event) => (
                <ActivityItem 
                  key={event.id} 
                  event={event} 
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </div>
          )}

          {/* Help Card */}
          <div className="bg-gradient-to-br from-navy to-navy-deep rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-5 h-5 text-gold" />
              <h4 className="font-semibold">Precisa de ajuda?</h4>
            </div>
            <p className="text-sm text-white/70 mb-4">
              Nossa equipe está disponível para auxiliar em cada etapa do processo de captação.
            </p>
            <Link
              to="/app/mensagens"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:underline"
            >
              Enviar mensagem
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Sparkles className="w-8 h-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-navy-deep mb-2">
        Comece sua jornada de captação
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Submeta seu projeto para análise e alcance investidores em todo o Brasil através da plataforma Kate.
      </p>
      <Link
        to="/app/projetos/novo"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        Criar primeiro projeto
      </Link>
    </div>
  );
}

function NoActivityState({ hasProjects }: { hasProjects: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-6 text-center">
      <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">
        {hasProjects 
          ? "Nenhuma atividade recente" 
          : "Crie seu primeiro projeto para ver atividades aqui"}
      </p>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  formatCurrency: (v: number) => string;
  getStatusStepIndex: (s: string) => number;
}

function ProjectCard({ project, formatCurrency, getStatusStepIndex }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const currentStepIndex = getStatusStepIndex(project.status);
  const isRejected = project.status === "rejected";

  const getActionLink = () => {
    if (project.status === "draft") {
      return `/app/projetos/novo?project=${project.id}`;
    }
    return `/app/projetos/${project.id}`;
  };

  const getActionLabel = () => {
    if (project.status === "draft") return "Continuar";
    if (project.status === "pending_review") return "Acompanhar";
    return "Ver detalhes";
  };

  return (
    <div className="group bg-white rounded-2xl border border-kate-border overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all duration-300">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white/70" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {project.category && (
                  <span className="px-2 py-0.5 bg-kate-bg text-gray-600 text-xs font-medium rounded-full">
                    {project.category}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>
              <h3 className="font-bold text-navy-deep text-lg truncate">
                {project.project_name || "Projeto sem nome"}
              </h3>
              {project.short_description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {project.short_description}
                </p>
              )}
            </div>
          </div>
          
          <Link
            to={getActionLink()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gold-hover hover:bg-gold/10 rounded-lg transition-colors flex-shrink-0"
          >
            {getActionLabel()}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Progress Steps */}
        {!isRejected && (
          <div className="mb-4">
            <div className="flex items-center gap-1">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center">
                    <div className={`w-full h-1.5 rounded-full mb-2 ${
                      isCompleted
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-gold"
                        : "bg-gray-100"
                    }`} />
                    <span className={`text-[10px] text-center ${
                      isCurrent ? "text-navy-deep font-medium" : "text-gray-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejected Notice */}
        {isRejected && (
          <div className="mb-4 p-3 bg-red-50 rounded-xl">
            <p className="text-sm text-red-700">
              Projeto não aprovado. Entre em contato para mais informações.
            </p>
          </div>
        )}

        {/* Draft Progress */}
        {project.status === "draft" && project.submission_progress !== undefined && (
          <div className="pt-4 border-t border-kate-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Progresso da submissão
              </span>
              <span className="font-medium text-navy-deep">{project.submission_progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${project.submission_progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Goal Info for approved+ */}
        {(project.status === "approved" || project.status === "offer_created" || project.status === "live") && project.min_goal > 0 && (
          <div className="pt-4 border-t border-kate-border">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Meta mínima</p>
                <p className="text-sm font-semibold text-navy-deep">{formatCurrency(project.min_goal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Meta máxima</p>
                <p className="text-sm font-semibold text-navy-deep">{formatCurrency(project.max_goal || project.min_goal)}</p>
              </div>
              {project.deadline_date && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Prazo</p>
                  <p className="text-sm font-semibold text-navy-deep flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(project.deadline_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Stats */}
        {project.status === "live" && (
          <div className="mt-4 pt-4 border-t border-kate-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Captado</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(project.current_raised || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Investidores</p>
                <p className="text-lg font-bold text-navy-deep flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  {project.investor_count || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  event: TimelineEvent;
  formatTimeAgo: (d: string) => string;
}

function ActivityItem({ event, formatTimeAgo }: ActivityItemProps) {
  const eventIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    status_change: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    offer_created: { icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
    offer_status: { icon: TrendingUp, color: "text-gold-hover", bg: "bg-gold/10" },
    offer_closed: { icon: CheckCircle2, color: "text-navy", bg: "bg-navy/10" },
    message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    document: { icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
    default: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100" }
  };
  
  const config = eventIcons[event.event_type] || eventIcons.default;
  const Icon = config.icon;
  
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-navy-deep line-clamp-1">{event.title}</p>
          {event.project_name && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{event.project_name}</p>
          )}
          {event.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{formatTimeAgo(event.created_at)}</span>
      </div>
    </div>
  );
}
