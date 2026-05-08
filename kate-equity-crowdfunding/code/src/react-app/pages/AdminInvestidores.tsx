import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Users,
  Search,
  Filter,
  Phone,
  Calendar,
  Wallet,
  TrendingUp,
  ChevronDown,
  Loader2,
  User,
  FileText,
  Eye,
  X
} from "lucide-react";

interface Investor {
  user_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  document_type: string;
  document_number: string;
  phone: string | null;
  total_invested: number;
  investments_count: number;
  first_investment_at: string | null;
  last_investment_at: string | null;
  created_at: string;
}

interface InvestorInvestment {
  id: number;
  offer_id: number;
  offer_title: string;
  amount: number;
  status: string;
  created_at: string;
}

interface InvestorDetail extends Investor {
  investments: InvestorInvestment[];
}

export default function AdminInvestidores() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "invested" | "count">("recent");
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    this_month: 0,
    total_invested: 0
  });

  useEffect(() => {
    fetchInvestors();
  }, [sortBy]);

  const fetchInvestors = async () => {
    try {
      const res = await fetch(`/api/admin/investors?sort=${sortBy}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvestors(data.investors);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching investors:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestorDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/investors/${encodeURIComponent(userId)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSelectedInvestor(data.investor);
      }
    } catch (e) {
      console.error("Error fetching investor detail:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
      paid: { label: "Pago", color: "bg-blue-100 text-blue-700" },
      token_pending: { label: "Token pendente", color: "bg-purple-100 text-purple-700" },
      token_released: { label: "Concluído", color: "bg-green-100 text-green-700" },
      refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-600" }
    };
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  const filteredInvestors = investors.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.email?.toLowerCase().includes(term) ||
      inv.name?.toLowerCase().includes(term) ||
      inv.document_number?.includes(term)
    );
  });

  return (
    <AdminLayout title="Investidores" subtitle="Gestão de investidores da plataforma">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total de Investidores</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Novos este mês</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">+{stats.this_month}</p>
          </div>

          <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl p-5 border border-gold/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center">
                <Wallet className="w-6 h-6 text-navy-deep" />
              </div>
              <span className="text-sm text-gray-600">Volume Total</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{formatCurrency(stats.total_invested)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-kate-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-10 pr-10 py-2.5 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none appearance-none bg-white min-w-[180px]"
              >
                <option value="recent">Mais recentes</option>
                <option value="invested">Maior volume</option>
                <option value="count">Mais investimentos</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Investors List */}
        <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "Nenhum investidor encontrado" : "Nenhum investidor cadastrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-kate-border bg-gray-50">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Investidor</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Documento</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Investimentos</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Volume Total</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Cadastro</th>
                    <th className="text-right py-4 px-5 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kate-border">
                  {filteredInvestors.map((investor) => (
                    <tr key={investor.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {investor.avatar_url ? (
                            <img 
                              src={investor.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-navy" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-navy-deep">{investor.name || "—"}</p>
                            <p className="text-sm text-gray-500">{investor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-600">
                          {investor.document_type?.toUpperCase()}: {investor.document_number || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-medium text-navy-deep">{investor.investments_count}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-navy-deep">{formatCurrency(investor.total_invested)}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-500">{formatDate(investor.created_at)}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => fetchInvestorDetail(investor.user_id)}
                          className="p-2 text-gray-500 hover:text-navy-deep hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Investor Detail Modal */}
      {(selectedInvestor || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !detailLoading && setSelectedInvestor(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            ) : selectedInvestor && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-kate-border">
                  <div className="flex items-center gap-4">
                    {selectedInvestor.avatar_url ? (
                      <img src={selectedInvestor.avatar_url} alt="" className="w-14 h-14 rounded-full" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center">
                        <User className="w-7 h-7 text-navy" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-navy-deep">{selectedInvestor.name || "Investidor"}</h2>
                      <p className="text-gray-500">{selectedInvestor.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInvestor(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FileText className="w-4 h-4" />
                        Documento
                      </div>
                      <p className="font-medium text-navy-deep">
                        {selectedInvestor.document_type?.toUpperCase()}: {selectedInvestor.document_number || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </div>
                      <p className="font-medium text-navy-deep">{selectedInvestor.phone || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Wallet className="w-4 h-4" />
                        Volume Total
                      </div>
                      <p className="font-bold text-navy-deep text-lg">{formatCurrency(selectedInvestor.total_invested)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        Membro desde
                      </div>
                      <p className="font-medium text-navy-deep">{formatDate(selectedInvestor.created_at)}</p>
                    </div>
                  </div>

                  {/* Investments */}
                  <div>
                    <h3 className="font-semibold text-navy-deep mb-4">Histórico de Investimentos ({selectedInvestor.investments.length})</h3>
                    {selectedInvestor.investments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum investimento registrado</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedInvestor.investments.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <p className="font-medium text-navy-deep">{inv.offer_title}</p>
                              <p className="text-sm text-gray-500">{formatDate(inv.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-navy-deep">{formatCurrency(inv.amount)}</p>
                              {getStatusBadge(inv.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
