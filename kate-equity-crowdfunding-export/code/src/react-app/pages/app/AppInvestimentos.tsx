import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Search,
  Clock, 
  TrendingUp,
  ChevronRight,
  Loader2,
  Wallet,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Timer,
  Coins,
  RefreshCw,
  Calendar,
  ExternalLink,
  BarChart3,
  Shield
} from "lucide-react";

interface Investment {
  id: number;
  user_id: string;
  offer_id: number;
  amount: number;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  token_amount: number | null;
  token_released_at: string | null;
  refunded_at: string | null;
  created_at: string;
  offer_title: string;
  offer_slug: string;
  offer_image_url: string | null;
  offer_category: string;
  offer_status: string;
  offer_end_date: string;
  offer_current_amount: number;
  offer_min_goal: number;
  // Blockchain fields
  nft_uid: string | null;
  nft_tx_hash: string | null;
  tokens_reserved: number | null;
  tokens_received: number | null;
  escrow_tx_hash: string | null;
  project_token_uid: string | null;
  project_token_symbol: string | null;
}

const STATUS_CONFIG = {
  pending: {
    label: "Aguardando pagamento",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Timer,
    iconColor: "text-amber-500"
  },
  proof_sent: {
    label: "Comprovante enviado",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Clock,
    iconColor: "text-purple-500"
  },
  pending_approval: {
    label: "Aguardando aprovação",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Clock,
    iconColor: "text-purple-500"
  },
  paid: {
    label: "Pago - Aguardando tokens",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
    iconColor: "text-blue-500"
  },
  escrow_reserved: {
    label: "Reserva confirmada",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Shield,
    iconColor: "text-blue-500"
  },
  blockchain_registered: {
    label: "Registrado na Blockchain",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Shield,
    iconColor: "text-indigo-500"
  },
  distributing: {
    label: "Distribuindo tokens",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
    iconColor: "text-blue-500"
  },
  completed: {
    label: "Tokens recebidos",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-500"
  },
  completed_no_nft: {
    label: "Tokens recebidos",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-500"
  },
  token_released: {
    label: "Tokens liberados",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-500"
  },
  refunded: {
    label: "Reembolsado",
    color: "bg-gray-50 text-gray-600 border-gray-200",
    icon: RefreshCw,
    iconColor: "text-gray-500"
  },
  rejected: {
    label: "Rejeitado",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-500"
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-500"
  }
};

const FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Aguardando pagamento" },
  { id: "pending_approval", label: "Aguardando aprovação" },
  { id: "paid", label: "Pagos" },
  { id: "token_released", label: "Tokens liberados" },
  { id: "refunded", label: "Reembolsados" },
];

export default function AppInvestimentos() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/investments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvestments(data.investments || []);
      }
    } catch (e) {
      console.error("Error fetching investments:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvestments = investments
    .filter(inv => {
      const matchesSearch = !searchTerm || 
        inv.offer_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "amount") {
        return b.amount - a.amount;
      }
      return 0;
    });

  const totalInvested = investments
    .filter(inv => inv.status !== "refunded" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const activeCount = investments.filter(inv => 
    inv.status === "paid" || inv.status === "token_released" || inv.status === "blockchain_registered"
  ).length;

  const pendingCount = investments.filter(inv => inv.status === "pending").length;
  
  const pendingApprovalCount = investments.filter(inv => inv.status === "pending_approval").length;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const hasActiveFilters = statusFilter !== "all" || searchTerm;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-deep">Meus Investimentos</h1>
          <p className="text-gray-500 mt-1">
            Acompanhe todos os seus investimentos em ofertas
          </p>
        </div>
        <Link
          to="/app/oportunidades"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Nova oportunidade
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total investido</p>
              <p className="text-xl font-bold text-navy-deep">
                {totalInvested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Investimentos ativos</p>
              <p className="text-xl font-bold text-navy-deep">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center">
              <Timer className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aguardando pagamento</p>
              <p className="text-xl font-bold text-navy-deep">{pendingCount}</p>
            </div>
          </div>
        </div>

        {pendingApprovalCount > 0 && (
          <div className="bg-white rounded-2xl border border-kate-border p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aguardando aprovação</p>
                <p className="text-xl font-bold text-navy-deep">{pendingApprovalCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-kate-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome da oferta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl text-navy-deep placeholder-gray-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {FILTER_OPTIONS.map(opt => {
              const isActive = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gold text-navy-deep"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-kate-border">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-kate-border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white"
            >
              <option value="recent">Mais recentes</option>
              <option value="amount">Maior valor</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gold-hover hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            {filteredInvestments.length} {filteredInvestments.length === 1 ? 'investimento' : 'investimentos'}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : filteredInvestments.length === 0 ? (
        <EmptyState hasInvestments={investments.length > 0} />
      ) : (
        <div className="space-y-4">
          {filteredInvestments.map(investment => (
            <InvestmentCard key={investment.id} investment={investment} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasInvestments }: { hasInvestments: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Wallet className="w-8 h-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-navy-deep mb-2">
        {hasInvestments ? "Nenhum investimento encontrado" : "Você ainda não investiu"}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {hasInvestments 
          ? "Nenhum investimento corresponde aos filtros selecionados." 
          : "Comece a investir em oportunidades selecionadas e acompanhe seus investimentos aqui."}
      </p>
      <Link
        to="/app/oportunidades"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
      >
        Ver oportunidades
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function InvestmentCard({ investment }: { investment: Investment }) {
  const statusConfig = STATUS_CONFIG[investment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  
  const offerProgress = Math.min(100, Math.round((investment.offer_current_amount / investment.offer_min_goal) * 100));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-kate-border overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-48 h-36 sm:h-auto relative overflow-hidden flex-shrink-0">
          <img
            src={investment.offer_image_url || "https://images.unsplash.com/photo-1560472355-536de3962603?w=400"}
            alt={investment.offer_title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-navy-deep text-xs font-semibold rounded-lg">
            {investment.offer_category}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${statusConfig.color}`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconColor}`} />
                  {statusConfig.label}
                </span>
                {investment.nft_uid && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                    <Shield className="w-3 h-3" />
                    Blockchain
                  </span>
                )}
              </div>
              <Link 
                to={`/oferta/${investment.offer_slug || investment.offer_id}`}
                className="text-lg font-bold text-navy-deep group-hover:text-gold-hover transition-colors hover:underline"
              >
                {investment.offer_title}
              </Link>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Valor investido</p>
              <p className="text-xl font-bold text-navy-deep">
                {investment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>

          {/* Investment Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Data do investimento</p>
              <p className="text-sm font-semibold text-navy-deep flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(investment.created_at)}
              </p>
            </div>
            
            {investment.paid_at && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Pagamento confirmado</p>
                <p className="text-sm font-semibold text-navy-deep flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {formatDate(investment.paid_at)}
                </p>
              </div>
            )}

            {investment.tokens_reserved && !investment.tokens_received && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tokens reservados</p>
                <p className="text-sm font-semibold text-amber-600 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  {investment.tokens_reserved.toLocaleString("pt-BR")}
                  {investment.project_token_symbol && (
                    <span className="text-xs text-gray-400">{investment.project_token_symbol}</span>
                  )}
                </p>
              </div>
            )}
            
            {investment.tokens_received && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tokens recebidos</p>
                <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-green-500" />
                  {investment.tokens_received.toLocaleString("pt-BR")}
                  {investment.project_token_symbol && (
                    <span className="text-xs text-gray-400">{investment.project_token_symbol}</span>
                  )}
                </p>
              </div>
            )}

            {investment.token_amount && !investment.tokens_received && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tokens recebidos</p>
                <p className="text-sm font-semibold text-navy-deep flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-gold" />
                  {investment.token_amount.toLocaleString("pt-BR")}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-0.5">Captação da oferta</p>
              <p className="text-sm font-semibold text-navy-deep flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                {offerProgress}%
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/app/investimentos/${investment.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy border border-kate-border rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver detalhes
            </Link>

            {investment.status === "pending" && (
              <Link
                to={`/app/investimentos/${investment.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold hover:bg-gold-hover text-navy-deep rounded-xl transition-colors"
              >
                Enviar comprovante
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {investment.status === "pending_approval" && (
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-xl">
                <Clock className="w-4 h-4" />
                Comprovante em análise
              </span>
            )}

            {investment.status === "token_released" && (
              <Link
                to="/app/carteira"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gold-hover border border-gold rounded-xl hover:bg-gold/10 transition-colors"
              >
                <Coins className="w-4 h-4" />
                Ver na carteira
              </Link>
            )}

            {investment.refunded_at && (
              <span className="text-sm text-gray-500">
                Reembolsado em {formatDate(investment.refunded_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
