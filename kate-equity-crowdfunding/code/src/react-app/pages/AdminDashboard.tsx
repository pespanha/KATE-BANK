import { useState, useEffect } from "react";
import { Link } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";

import {
  FileStack,
  Megaphone,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
  Wallet,
  FileCheck,
  FileEdit,
  Timer,
  Coins,
  BarChart3,
  Send,
  AlertTriangle
} from "lucide-react";

interface Stats {
  draft_projects: number;
  pending_projects: number;
  approved_projects: number;
  active_offers: number;
  total_raised: number;
  total_investors: number;
  new_projects_count: number;
}

interface PendingInvestment {
  id: number;
  amount: number;
  status: string;
  proof_sent_at: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  offer_title: string;
  company_name: string;
}

interface InvestmentStats {
  pending_count: number;
  pending_amount: number;
  proof_sent_count: number;
  proof_sent_amount: number;
}

interface ActiveOffer {
  id: number;
  title: string;
  project_name: string;
  current_raised: number;
  min_goal: number;
  max_goal: number;
  end_date: string;
  investors_count: number;
  status: string;
}

interface Alert {
  type: "warning" | "danger" | "info";
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingInvestments, setPendingInvestments] = useState<PendingInvestment[]>([]);
  const [investmentStats, setInvestmentStats] = useState<InvestmentStats | null>(null);
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, investmentsRes, offersRes] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }),
        fetch("/api/admin/pending-investments?limit=5", { credentials: "include" }),
        fetch("/api/admin/offers?status=active&limit=5", { credentials: "include" })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        
        // Build alerts based on stats
        const newAlerts: Alert[] = [];
        
        if (statsData.pending_projects > 0) {
          newAlerts.push({
            type: "warning",
            icon: Clock,
            title: `${statsData.pending_projects} projeto(s) aguardando análise`,
            description: "Projetos submetidos precisam de revisão",
            link: "/admin/projetos?status=pending_review",
            linkText: "Analisar agora"
          });
        }
        
        setAlerts(newAlerts);
      }

      if (investmentsRes.ok) {
        const invData = await investmentsRes.json();
        setPendingInvestments(invData.investments || []);
        setInvestmentStats(invData.stats || null);
        
        // Add investment alerts
        if (invData.stats?.proof_sent_count > 0) {
          setAlerts(prev => [...prev, {
            type: "danger",
            icon: FileCheck,
            title: `${invData.stats.proof_sent_count} comprovante(s) aguardando aprovação`,
            description: `Total: ${formatCurrency(invData.stats.proof_sent_amount)}`,
            link: "/admin/pendentes",
            linkText: "Aprovar pagamentos"
          }]);
        }
      }

      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setActiveOffers(offersData.offers || []);
        
        // Check for expiring offers
        const now = new Date();
        const expiringOffers = (offersData.offers || []).filter((o: ActiveOffer) => {
          const endDate = new Date(o.end_date);
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft <= 7 && daysLeft > 0;
        });
        
        if (expiringOffers.length > 0) {
          setAlerts(prev => [...prev, {
            type: "warning",
            icon: Timer,
            title: `${expiringOffers.length} captação(ões) expirando em breve`,
            description: "Verifique as captações com prazo próximo do fim",
            link: "/admin/ofertas",
            linkText: "Ver ofertas"
          }]);
        }
        
        // Check for offers ready to distribute
        const readyToDistribute = (offersData.offers || []).filter((o: ActiveOffer) => {
          return o.current_raised >= o.min_goal;
        });
        
        if (readyToDistribute.length > 0) {
          setAlerts(prev => [...prev, {
            type: "info",
            icon: Send,
            title: `${readyToDistribute.length} captação(ões) atingiram meta mínima`,
            description: "Prontas para distribuição de tokens quando encerradas",
            link: "/admin/tokens",
            linkText: "Gestão Blockchain"
          }]);
        }
      }
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getDaysLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getProgressPercent = (current: number, minGoal: number) => {
    // Progress based on minimum goal (100% = min goal reached)
    return Math.min((current / minGoal) * 100, 100);
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Visão geral da plataforma">
      
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats?.draft_projects || 0}</p>
                <p className="text-xs text-slate-600">Rascunhos</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-900">{stats?.pending_projects || 0}</p>
                <p className="text-xs text-amber-700">Aguardando Análise</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-kate-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy-deep">{stats?.approved_projects || 0}</p>
                <p className="text-xs text-gray-500">Projetos Aprovados</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-kate-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy-deep">{stats?.active_offers || 0}</p>
                <p className="text-xs text-gray-500">Ofertas Ativas</p>
              </div>

              <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl p-4 border border-gold/20 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-navy-deep" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy-deep">{formatCurrency(stats?.total_raised || 0)}</p>
                <p className="text-xs text-gray-600">Total Captado</p>
              </div>
            </div>

            {/* Urgent Alerts Block */}
            {alerts.length > 0 && (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border flex items-center gap-4 ${
                      alert.type === "danger"
                        ? "bg-red-50 border-red-200"
                        : alert.type === "warning"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.type === "danger"
                        ? "bg-red-100"
                        : alert.type === "warning"
                        ? "bg-amber-100"
                        : "bg-blue-100"
                    }`}>
                      <alert.icon className={`w-5 h-5 ${
                        alert.type === "danger"
                          ? "text-red-600"
                          : alert.type === "warning"
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${
                        alert.type === "danger"
                          ? "text-red-900"
                          : alert.type === "warning"
                          ? "text-amber-900"
                          : "text-blue-900"
                      }`}>
                        {alert.title}
                      </p>
                      <p className={`text-sm ${
                        alert.type === "danger"
                          ? "text-red-700"
                          : alert.type === "warning"
                          ? "text-amber-700"
                          : "text-blue-700"
                      }`}>
                        {alert.description}
                      </p>
                    </div>
                    <Link
                      to={alert.link}
                      className={`px-4 py-2 rounded-lg font-medium text-sm flex-shrink-0 transition-colors ${
                        alert.type === "danger"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : alert.type === "warning"
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {alert.linkText}
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Two Column Layout: Pending Investments + Active Offers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Pending Investments */}
              <div className="bg-white rounded-2xl border border-kate-border">
                <div className="flex items-center justify-between p-5 border-b border-kate-border">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-gold" />
                    <div>
                      <h2 className="font-semibold text-navy-deep">Investimentos Pendentes</h2>
                      {investmentStats && (investmentStats.pending_count + investmentStats.proof_sent_count) > 0 && (
                        <p className="text-xs text-gray-500">
                          {(investmentStats.pending_count || 0) + (investmentStats.proof_sent_count || 0)} pendentes • {formatCurrency((investmentStats.pending_amount || 0) + (investmentStats.proof_sent_amount || 0))}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/admin/pendentes"
                    className="text-sm text-gold-hover hover:underline flex items-center gap-1"
                  >
                    Ver todos <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {pendingInvestments.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum investimento pendente</p>
                  </div>
                ) : (
                  <div className="divide-y divide-kate-border max-h-80 overflow-y-auto">
                    {pendingInvestments.slice(0, 5).map(inv => (
                      <Link
                        key={inv.id}
                        to={`/admin/investimentos/${inv.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          inv.status === "proof_sent" ? "bg-purple-100" : "bg-amber-100"
                        }`}>
                          {inv.status === "proof_sent" ? (
                            <FileCheck className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy-deep text-sm truncate">
                            {inv.user_name || inv.user_email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{inv.company_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-navy-deep text-sm">{formatCurrency(inv.amount)}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            inv.status === "proof_sent" 
                              ? "bg-purple-100 text-purple-700" 
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {inv.status === "proof_sent" ? "Comprovante" : "Pendente"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Active Offers / Fundraising */}
              <div className="bg-white rounded-2xl border border-kate-border">
                <div className="flex items-center justify-between p-5 border-b border-kate-border">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <div>
                      <h2 className="font-semibold text-navy-deep">Captações Ativas</h2>
                      <p className="text-xs text-gray-500">{activeOffers.length} captações em andamento</p>
                    </div>
                  </div>
                  <Link
                    to="/admin/ofertas"
                    className="text-sm text-gold-hover hover:underline flex items-center gap-1"
                  >
                    Ver todas <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {activeOffers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhuma captação ativa</p>
                  </div>
                ) : (
                  <div className="divide-y divide-kate-border max-h-80 overflow-y-auto">
                    {activeOffers.slice(0, 5).map(offer => {
                      const progress = getProgressPercent(offer.current_raised, offer.min_goal);
                      const daysLeft = getDaysLeft(offer.end_date);
                      const reachedMin = offer.current_raised >= offer.min_goal;
                      
                      return (
                        <Link
                          key={offer.id}
                          to={`/admin/ofertas/${offer.id}`}
                          className="p-4 hover:bg-gray-50 transition-colors block"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-navy-deep text-sm truncate flex-1">
                              {offer.project_name}
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                              daysLeft <= 3 
                                ? "bg-red-100 text-red-700" 
                                : daysLeft <= 7
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {daysLeft > 0 ? `${daysLeft} dias` : "Encerrado"}
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                reachedMin ? "bg-green-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {formatCurrency(offer.current_raised)} / {formatCurrency(offer.max_goal)}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Users className="w-3 h-3" />
                              {offer.investors_count} investidores
                            </span>
                          </div>
                          
                          {reachedMin && (
                            <div className="mt-2 flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-[10px] font-medium">Meta mínima atingida</span>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                to="/admin/projetos"
                className="bg-white rounded-xl border border-kate-border p-4 hover:shadow-md transition-shadow group text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center group-hover:bg-navy/20 transition-colors mx-auto mb-2">
                  <FileStack className="w-6 h-6 text-navy" />
                </div>
                <p className="font-medium text-navy-deep text-sm">Projetos</p>
              </Link>

              <Link
                to="/admin/ofertas"
                className="bg-white rounded-xl border border-kate-border p-4 hover:shadow-md transition-shadow group text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors mx-auto mb-2">
                  <Megaphone className="w-6 h-6 text-gold-hover" />
                </div>
                <p className="font-medium text-navy-deep text-sm">Ofertas</p>
              </Link>

              <Link
                to="/admin/tokens"
                className="bg-white rounded-xl border border-kate-border p-4 hover:shadow-md transition-shadow group text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors mx-auto mb-2">
                  <Coins className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-medium text-navy-deep text-sm">Blockchain</p>
              </Link>

              <Link
                to="/admin/investidores"
                className="bg-white rounded-xl border border-kate-border p-4 hover:shadow-md transition-shadow group text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors mx-auto mb-2">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium text-navy-deep text-sm">Investidores</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
