import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import AppLayout from "@/react-app/components/AppLayout";
import ProjectSuccessModal from "@/react-app/components/ProjectSuccessModal";

import {
  TrendingUp,
  Briefcase,
  FileText,
  ArrowRight,
  ChevronRight,
  Loader2,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  Eye,
  RefreshCw,
  Wallet,
  Send
} from "lucide-react";

interface AuthContext {
  type: string;
  id?: string;
  intent?: string;
  redirect?: string;
  isNewUser?: boolean;
  timestamp: number;
}

interface Project {
  id: number;
  project_name: string;
  status: string;
  created_at: string;
}

interface Investment {
  id: number;
  offer_title: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  link?: string;
  created_at: string;
  read_at?: string;
}

export default function AppDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [stats, setStats] = useState({
    projectsDraft: 0,
    projectsSubmitted: 0,
    projectsApproved: 0,
    investmentsPending: 0,
    investmentsDelivered: 0,
    totalInvested: 0
  });

  useEffect(() => {
    // Check if user just submitted a new project
    const newProjectSubmitted = localStorage.getItem("kate_new_project_submitted");
    if (newProjectSubmitted === "true") {
      setShowSuccessModal(true);
      localStorage.removeItem("kate_new_project_submitted");
    }

    // Check for auth context (pending actions)
    const storedContext = localStorage.getItem("kate_auth_context");
    if (storedContext) {
      try {
        const ctx = JSON.parse(storedContext) as AuthContext;
        // Only use context if less than 24 hours old
        if (Date.now() - ctx.timestamp < 24 * 60 * 60 * 1000) {
          setAuthContext(ctx);
        } else {
          localStorage.removeItem("kate_auth_context");
        }
      } catch (e) {
        localStorage.removeItem("kate_auth_context");
      }
    }

    fetchDashboardData();
  }, []);

  // Clear auth context if no pending investments exist
  useEffect(() => {
    if (authContext?.type === "invest" && investments.length > 0) {
      // Only keep the banner if there are investments pending payment
      const pendingStatuses = ["pending", "pending_payment", "pending_approval"];
      const hasPendingInvestment = investments.some((inv) => 
        pendingStatuses.includes(inv.status)
      );
      if (!hasPendingInvestment) {
        dismissContext();
      }
    }
  }, [authContext, investments]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's projects
      const projectsRes = await fetch("/api/user/projects", { credentials: "include" });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects?.slice(0, 5) || []);
        
        // Calculate project stats
        const allProjects = projectsData.projects || [];
        setStats(prev => ({
          ...prev,
          projectsDraft: allProjects.filter((p: Project) => p.status === "draft").length,
          projectsSubmitted: allProjects.filter((p: Project) => 
            ["submitted", "pending_review", "in_review", "changes_requested"].includes(p.status)
          ).length,
          projectsApproved: allProjects.filter((p: Project) => p.status === "approved").length
        }));
      }

      // Fetch investments
      const investmentsRes = await fetch("/api/user/investments", { credentials: "include" });
      if (investmentsRes.ok) {
        const investmentsData = await investmentsRes.json();
        setInvestments(investmentsData.investments?.slice(0, 5) || []);
        
        // Calculate investment stats
        const allInvestments = investmentsData.investments || [];
        const totalInvested = allInvestments.reduce((sum: number, inv: Investment) => sum + inv.amount, 0);
        setStats(prev => ({
          ...prev,
          investmentsPending: allInvestments.filter((i: Investment) => 
            ["pending", "pending_payment", "escrow_reserved"].includes(i.status)
          ).length,
          investmentsDelivered: allInvestments.filter((i: Investment) => 
            ["completed", "completed_no_nft", "token_released", "distributed"].includes(i.status)
          ).length,
          totalInvested
        }));
      }

      // Mock notifications (TODO: implement real notifications API)
      setNotifications([
        {
          id: 1,
          type: "info",
          title: "Bem-vindo à Kate!",
          body: "Complete seu perfil para começar a investir ou captar recursos.",
          link: "/app/perfil",
          created_at: new Date().toISOString()
        }
      ]);

    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const dismissContext = () => {
    localStorage.removeItem("kate_auth_context");
    setAuthContext(null);
  };

  const handleResumeAction = () => {
    if (!authContext) return;

    if (authContext.type === "invest" && authContext.id) {
      navigate(`/oferta/${authContext.id}`);
      dismissContext();
    } else if (authContext.type === "captar") {
      navigate("/app/projetos/novo");
      dismissContext();
    }
  };

  const displayName = user?.google_user_data?.given_name || user?.google_user_data?.name?.split(" ")[0] || "usuário";

  return (
    <AppLayout
      title={`Olá, ${displayName}!`}
      subtitle="Aqui está um resumo da sua conta"
    >
      {/* Success modal */}
      <ProjectSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resume action card - show if user has draft projects */}
          {projects.length > 0 && projects.some((p: Project) => p.status === "draft") && (
            <div className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Send className="w-6 h-6 text-gold-hover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy-deep">
                    Continuar submissão do projeto
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Você tem projetos em rascunho. Complete a submissão para enviar para análise.
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <Link
                      to="/app/projetos"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-lg transition-colors"
                    >
                      Completar agora
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume action card - for other auth contexts */}
          {authContext && authContext.type === "invest" && (
            <div className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-gold-hover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy-deep">
                    Retomar investimento
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Você estava no meio de um investimento. Clique para continuar de onde parou.
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleResumeAction}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-lg transition-colors"
                    >
                      Continuar investindo
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={dismissContext}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Dispensar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickAction
                icon={FileText}
                label="Submeter projeto"
                href="/app/projetos/novo"
                color="gold"
              />
              <QuickAction
                icon={Eye}
                label="Ver oportunidades"
                href="/app/oportunidades"
                color="navy"
              />
              <QuickAction
                icon={Wallet}
                label="Ver carteira"
                href="/app/carteira"
                color="green"
              />
              <QuickAction
                icon={Briefcase}
                label="Meus projetos"
                href="/app/projetos"
                color="purple"
              />
            </div>
          </div>

          {/* Two column layout for situation and notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Minha situação */}
            <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
              <div className="px-5 py-4 border-b border-kate-border flex items-center justify-between">
                <h2 className="font-bold text-navy-deep">Minha Situação</h2>
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="divide-y divide-kate-border">
                {/* Projects section */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-navy" />
                    <span className="text-sm font-medium text-gray-700">Projetos</span>
                  </div>
                  
                  {projects.length > 0 ? (
                    <div className="space-y-2">
                      {projects.slice(0, 3).map((project) => (
                        <Link
                          key={project.id}
                          to={`/app/projetos/${project.id}`}
                          className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <span className="text-sm font-medium text-navy-deep truncate">
                            {project.project_name}
                          </span>
                          <StatusBadge status={project.status} />
                        </Link>
                      ))}
                      {projects.length > 3 && (
                        <Link
                          to="/app/projetos"
                          className="block text-center py-2 text-sm text-gold-hover hover:underline"
                        >
                          Ver todos ({projects.length})
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">Nenhum projeto ainda</p>
                      <Link
                        to="/app/projetos/novo"
                        className="text-sm text-gold-hover hover:underline"
                      >
                        Criar primeiro projeto
                      </Link>
                    </div>
                  )}
                </div>

                {/* Investments section */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-gold-hover" />
                    <span className="text-sm font-medium text-gray-700">Investimentos</span>
                  </div>
                  
                  {investments.length > 0 ? (
                    <div className="space-y-2">
                      {investments.slice(0, 3).map((investment) => (
                        <Link
                          key={investment.id}
                          to={`/app/investimentos/${investment.id}`}
                          className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-navy-deep truncate block">
                              {investment.offer_title}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatCurrency(investment.amount)}
                            </span>
                          </div>
                          <InvestmentStatusBadge status={investment.status} />
                        </Link>
                      ))}
                      {investments.length > 3 && (
                        <Link
                          to="/app/investimentos"
                          className="block text-center py-2 text-sm text-gold-hover hover:underline"
                        >
                          Ver todos ({investments.length})
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">Nenhum investimento ainda</p>
                      <Link
                        to="/app/oportunidades"
                        className="text-sm text-gold-hover hover:underline"
                      >
                        Ver oportunidades
                      </Link>
                    </div>
                  )}
                </div>

                {/* Summary stats */}
                <div className="p-5 bg-kate-bg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-navy-deep">{stats.projectsDraft}</p>
                      <p className="text-xs text-gray-500">Rascunhos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gold-hover">{stats.investmentsPending}</p>
                      <p className="text-xs text-gray-500">Reservas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.investmentsDelivered}</p>
                      <p className="text-xs text-gray-500">Tokens</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
              <div className="px-5 py-4 border-b border-kate-border flex items-center justify-between">
                <h2 className="font-bold text-navy-deep flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notificações
                </h2>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {notifications.filter(n => !n.read_at).length}
                  </span>
                )}
              </div>
              
              <div className="divide-y divide-kate-border max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Nenhuma notificação</p>
                  </div>
                )}
              </div>

              {notifications.length > 5 && (
                <div className="p-4 border-t border-kate-border bg-gray-50">
                  <Link
                    to="/app/mensagens"
                    className="flex items-center justify-center gap-2 text-sm text-gold-hover hover:underline"
                  >
                    Ver todas
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-gradient-to-r from-navy to-navy-deep rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  Pronto para expandir?
                </h3>
                <p className="text-white/70 text-sm">
                  Explore oportunidades de investimento ou submeta seu projeto para captação.
                </p>
              </div>
              <Link
                to="/app/oportunidades"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Explorar
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  color: "gold" | "navy" | "green" | "purple";
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  const colorClasses = {
    gold: "bg-gold/10 text-gold-hover hover:bg-gold/20",
    navy: "bg-navy/10 text-navy hover:bg-navy/20",
    green: "bg-green-100 text-green-700 hover:bg-green-200",
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200"
  };

  return (
    <Link
      to={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${colorClasses[color]}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium text-center">{label}</span>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Rascunho", icon: Clock },
    submitted: { bg: "bg-blue-100", text: "text-blue-700", label: "Enviado", icon: Send },
    in_review: { bg: "bg-amber-100", text: "text-amber-700", label: "Em análise", icon: Clock },
    changes_requested: { bg: "bg-orange-100", text: "text-orange-700", label: "Ajustes", icon: AlertCircle },
    approved: { bg: "bg-green-100", text: "text-green-700", label: "Aprovado", icon: CheckCircle },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "Reprovado", icon: XCircle }
  };

  const { bg, text, label, icon: Icon } = config[status] || config.draft;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function InvestmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pendente" },
    pending_payment: { bg: "bg-amber-100", text: "text-amber-700", label: "Aguardando" },
    proof_sent: { bg: "bg-purple-100", text: "text-purple-700", label: "Comprovante enviado" },
    pending_approval: { bg: "bg-purple-100", text: "text-purple-700", label: "Em análise" },
    paid: { bg: "bg-blue-100", text: "text-blue-700", label: "Pago" },
    escrow_reserved: { bg: "bg-blue-100", text: "text-blue-700", label: "Reservado" },
    blockchain_registered: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Blockchain" },
    distributing: { bg: "bg-blue-100", text: "text-blue-700", label: "Processando" },
    completed: { bg: "bg-green-100", text: "text-green-700", label: "Concluído" },
    completed_no_nft: { bg: "bg-green-100", text: "text-green-700", label: "Concluído" },
    token_released: { bg: "bg-green-100", text: "text-green-700", label: "Liberado" },
    delivered: { bg: "bg-green-100", text: "text-green-700", label: "Liberado" },
    refunded: { bg: "bg-gray-100", text: "text-gray-600", label: "Estornado" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejeitado" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" }
  };

  const { bg, text, label } = config[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg ${bg} ${text}`}>
      {label}
    </span>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const iconConfig: Record<string, { bg: string; icon: React.ElementType; color: string }> = {
    info: { bg: "bg-blue-100", icon: Bell, color: "text-blue-600" },
    success: { bg: "bg-green-100", icon: CheckCircle, color: "text-green-600" },
    warning: { bg: "bg-amber-100", icon: AlertCircle, color: "text-amber-600" },
    error: { bg: "bg-red-100", icon: XCircle, color: "text-red-600" }
  };

  const { bg, icon: Icon, color } = iconConfig[notification.type] || iconConfig.info;

  const content = (
    <div className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${!notification.read_at ? "bg-gold/5" : ""}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-navy-deep ${!notification.read_at ? "font-semibold" : ""}`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDate(notification.created_at)}
        </p>
      </div>
      {!notification.read_at && (
        <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-2" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link to={notification.link}>{content}</Link>;
  }

  return content;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays} dias`;
  
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
