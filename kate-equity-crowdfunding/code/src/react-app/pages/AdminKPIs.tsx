import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  TrendingUp,
  Users,
  Wallet,
  Building2,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface KPIStats {
  // Investidores
  total_investors: number;
  new_investors_month: number;
  investors_growth: number;
  
  // Emissores
  total_issuers: number;
  new_issuers_month: number;
  issuers_growth: number;
  
  // Financeiro
  total_raised: number;
  raised_this_month: number;
  raised_growth: number;
  average_investment: number;
  
  // Ofertas
  total_offers: number;
  active_offers: number;
  successful_offers: number;
  failed_offers: number;
  success_rate: number;
  
  // Projetos
  total_projects: number;
  pending_projects: number;
  approved_projects: number;
  rejected_projects: number;
  
  // Tokens
  tokens_pending: number;
  tokens_completed: number;
  tokens_failed: number;
  
  // By Category
  offers_by_category: { category: string; count: number; amount: number }[];
  
  // Timeline
  monthly_raised: { month: string; amount: number }[];
}

export default function AdminKPIs() {
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const res = await fetch("/api/admin/kpis", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching KPIs:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <AdminLayout title="KPIs" subtitle="Indicadores de performance da plataforma">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="KPIs" subtitle="Indicadores de performance da plataforma">
        <div className="text-center py-20">
          <p className="text-gray-500">Erro ao carregar dados</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="KPIs" subtitle="Indicadores de performance da plataforma">
      <div className="space-y-6">
        {/* Principal KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Captado */}
          <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl p-5 border border-gold/20">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-navy-deep" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.raised_growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.raised_growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {formatPercent(stats.raised_growth)}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Captado</p>
            <p className="text-2xl font-bold text-navy-deep">{formatCurrency(stats.total_raised)}</p>
            <p className="text-xs text-gray-400 mt-2">Este mês: {formatCurrency(stats.raised_this_month)}</p>
          </div>

          {/* Investidores */}
          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.investors_growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.investors_growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {formatPercent(stats.investors_growth)}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Investidores</p>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_investors}</p>
            <p className="text-xs text-gray-400 mt-2">Novos este mês: +{stats.new_investors_month}</p>
          </div>

          {/* Emissores */}
          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.issuers_growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.issuers_growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {formatPercent(stats.issuers_growth)}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Emissores</p>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_issuers}</p>
            <p className="text-xs text-gray-400 mt-2">Novos este mês: +{stats.new_issuers_month}</p>
          </div>

          {/* Ticket Médio */}
          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
            <p className="text-2xl font-bold text-navy-deep">{formatCurrency(stats.average_investment)}</p>
            <p className="text-xs text-gray-400 mt-2">Por investimento</p>
          </div>
        </div>

        {/* Ofertas & Projetos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ofertas Status */}
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="p-5 border-b border-kate-border">
              <h3 className="font-semibold text-navy-deep flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                Status das Ofertas
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-navy-deep">{stats.total_offers}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">{stats.active_offers}</p>
                  <p className="text-sm text-gray-500">Ativas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{stats.successful_offers}</p>
                  <p className="text-sm text-gray-500">Sucesso</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-3xl font-bold text-red-500">{stats.failed_offers}</p>
                  <p className="text-sm text-gray-500">Não atingiram</p>
                </div>
              </div>
              
              {/* Success Rate Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Taxa de sucesso</span>
                  <span className="font-medium text-navy-deep">{stats.success_rate.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats.success_rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Projetos Pipeline */}
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="p-5 border-b border-kate-border">
              <h3 className="font-semibold text-navy-deep flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                Pipeline de Projetos
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-gray-600">Aguardando análise</span>
                  </div>
                  <span className="text-xl font-bold text-navy-deep">{stats.pending_projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-gray-600">Aprovados</span>
                  </div>
                  <span className="text-xl font-bold text-navy-deep">{stats.approved_projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-gray-600">Rejeitados</span>
                  </div>
                  <span className="text-xl font-bold text-navy-deep">{stats.rejected_projects}</span>
                </div>
                <div className="pt-4 border-t border-kate-border flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total de projetos</span>
                  <span className="text-xl font-bold text-navy-deep">{stats.total_projects}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Jobs & Categorias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Token Jobs Status */}
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="p-5 border-b border-kate-border">
              <h3 className="font-semibold text-navy-deep flex items-center gap-2">
                <PieChart className="w-5 h-5 text-gold" />
                Token Jobs
              </h3>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl font-bold text-amber-600">{stats.tokens_pending}</span>
                  </div>
                  <p className="text-sm text-gray-500">Pendentes</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl font-bold text-green-600">{stats.tokens_completed}</span>
                  </div>
                  <p className="text-sm text-gray-500">Concluídos</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl font-bold text-red-500">{stats.tokens_failed}</span>
                  </div>
                  <p className="text-sm text-gray-500">Falhas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Por Categoria */}
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="p-5 border-b border-kate-border">
              <h3 className="font-semibold text-navy-deep flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Ofertas por Categoria
              </h3>
            </div>
            <div className="p-5">
              {stats.offers_by_category.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sem dados disponíveis</p>
              ) : (
                <div className="space-y-3">
                  {stats.offers_by_category.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-navy-deep">{cat.category}</p>
                        <p className="text-xs text-gray-400">{cat.count} oferta{cat.count !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="font-semibold text-navy-deep">{formatCurrency(cat.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Timeline */}
        {stats.monthly_raised.length > 0 && (
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="p-5 border-b border-kate-border">
              <h3 className="font-semibold text-navy-deep flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Captação Mensal
              </h3>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2 h-48">
                {stats.monthly_raised.map((month, idx) => {
                  const maxAmount = Math.max(...stats.monthly_raised.map(m => m.amount));
                  const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center flex-1 justify-end">
                        <span className="text-xs text-gray-500 mb-1">{formatCurrency(month.amount)}</span>
                        <div 
                          className="w-full bg-gradient-to-t from-gold to-gold/60 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 mt-2">{month.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
