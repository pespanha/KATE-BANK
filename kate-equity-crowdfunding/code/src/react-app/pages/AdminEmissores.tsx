import { useState, useEffect } from "react";
import { Link } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Building2,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Wallet,
  ChevronDown,
  Loader2,
  User,
  FileText,
  Eye,
  X,
  ExternalLink,
  FileStack,
  Megaphone,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface Issuer {
  user_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  document_type: string;
  document_number: string;
  company_name: string | null;
  phone: string | null;
  projects_count: number;
  approved_projects: number;
  active_offers: number;
  total_raised: number;
  created_at: string;
}

interface IssuerProject {
  id: number;
  project_name: string;
  company_name: string | null;
  category: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  offer_id: number | null;
  offer_title: string | null;
  offer_status: string | null;
  offer_current_amount: number | null;
}

interface IssuerDetail extends Issuer {
  projects: IssuerProject[];
}

export default function AdminEmissores() {
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "raised" | "projects">("recent");
  const [selectedIssuer, setSelectedIssuer] = useState<IssuerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    this_month: 0,
    total_raised: 0
  });

  useEffect(() => {
    fetchIssuers();
  }, [sortBy]);

  const fetchIssuers = async () => {
    try {
      const res = await fetch(`/api/admin/issuers?sort=${sortBy}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setIssuers(data.issuers);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching issuers:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssuerDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/issuers/${encodeURIComponent(userId)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSelectedIssuer(data.issuer);
      }
    } catch (e) {
      console.error("Error fetching issuer detail:", e);
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

  const getProjectStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600", icon: FileText },
      pending_review: { label: "Em análise", color: "bg-amber-100 text-amber-700", icon: Clock },
      approved: { label: "Aprovado", color: "bg-green-100 text-green-700", icon: CheckCircle },
      rejected: { label: "Rejeitado", color: "bg-red-100 text-red-600", icon: XCircle },
      offer_created: { label: "Com oferta", color: "bg-blue-100 text-blue-700", icon: Megaphone }
    };
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-600", icon: FileText };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  const filteredIssuers = issuers.filter(issuer => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      issuer.email?.toLowerCase().includes(term) ||
      issuer.name?.toLowerCase().includes(term) ||
      issuer.company_name?.toLowerCase().includes(term) ||
      issuer.document_number?.includes(term)
    );
  });

  return (
    <AdminLayout title="Emissores" subtitle="Gestão de emissores e captadores">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total de Emissores</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FileStack className="w-6 h-6 text-green-600" />
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
              <span className="text-sm text-gray-600">Total Captado</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{formatCurrency(stats.total_raised)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-kate-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, empresa, email ou documento..."
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
                <option value="raised">Maior captação</option>
                <option value="projects">Mais projetos</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Issuers List */}
        <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filteredIssuers.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "Nenhum emissor encontrado" : "Nenhum emissor cadastrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-kate-border bg-gray-50">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Emissor</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Empresa</th>
                    <th className="text-center py-4 px-5 text-sm font-semibold text-gray-600">Projetos</th>
                    <th className="text-center py-4 px-5 text-sm font-semibold text-gray-600">Ofertas Ativas</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Total Captado</th>
                    <th className="text-right py-4 px-5 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kate-border">
                  {filteredIssuers.map((issuer) => (
                    <tr key={issuer.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {issuer.avatar_url ? (
                            <img 
                              src={issuer.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-navy-deep">{issuer.name || "—"}</p>
                            <p className="text-sm text-gray-500">{issuer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-600">{issuer.company_name || "—"}</span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-medium text-navy-deep">{issuer.projects_count}</span>
                          {issuer.approved_projects > 0 && (
                            <span className="text-xs text-green-600">({issuer.approved_projects} aprov.)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`font-medium ${issuer.active_offers > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {issuer.active_offers}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-navy-deep">{formatCurrency(issuer.total_raised)}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => fetchIssuerDetail(issuer.user_id)}
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

      {/* Issuer Detail Modal */}
      {(selectedIssuer || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !detailLoading && setSelectedIssuer(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            ) : selectedIssuer && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-kate-border">
                  <div className="flex items-center gap-4">
                    {selectedIssuer.avatar_url ? (
                      <img src={selectedIssuer.avatar_url} alt="" className="w-14 h-14 rounded-full" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-navy-deep">{selectedIssuer.name || "Emissor"}</h2>
                      <p className="text-gray-500">{selectedIssuer.company_name || selectedIssuer.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIssuer(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                      <p className="font-medium text-navy-deep text-sm truncate">{selectedIssuer.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </div>
                      <p className="font-medium text-navy-deep">{selectedIssuer.phone || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FileText className="w-4 h-4" />
                        Documento
                      </div>
                      <p className="font-medium text-navy-deep text-sm">
                        {selectedIssuer.document_type?.toUpperCase()}: {selectedIssuer.document_number || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        Membro desde
                      </div>
                      <p className="font-medium text-navy-deep">{formatDate(selectedIssuer.created_at)}</p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-purple-700">{selectedIssuer.projects_count}</p>
                      <p className="text-sm text-purple-600">Projetos</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">{selectedIssuer.active_offers}</p>
                      <p className="text-sm text-blue-600">Ofertas Ativas</p>
                    </div>
                    <div className="bg-gradient-to-br from-gold/10 to-gold/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-navy-deep">{formatCurrency(selectedIssuer.total_raised)}</p>
                      <p className="text-sm text-gray-600">Captado</p>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div>
                    <h3 className="font-semibold text-navy-deep mb-4">Projetos ({selectedIssuer.projects.length})</h3>
                    {selectedIssuer.projects.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum projeto cadastrado</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedIssuer.projects.map((proj) => (
                          <div key={proj.id} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-navy-deep">{proj.project_name}</p>
                                  {getProjectStatusBadge(proj.status)}
                                </div>
                                <p className="text-sm text-gray-500">{proj.category} • {proj.company_name || "Sem empresa"}</p>
                                {proj.submitted_at && (
                                  <p className="text-xs text-gray-400 mt-1">Submetido em {formatDate(proj.submitted_at)}</p>
                                )}
                              </div>
                              <Link
                                to={`/admin/projetos/${proj.id}`}
                                className="p-2 text-gray-400 hover:text-navy-deep hover:bg-white rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                            
                            {/* Offer info if exists */}
                            {proj.offer_id && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Megaphone className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-navy-deep">{proj.offer_title}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      proj.offer_status === 'active' ? 'bg-green-100 text-green-700' : 
                                      proj.offer_status === 'closed_success' ? 'bg-blue-100 text-blue-700' : 
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {proj.offer_status === 'active' ? 'Ativa' : 
                                       proj.offer_status === 'closed_success' ? 'Sucesso' :
                                       proj.offer_status === 'closed_fail' ? 'Encerrada' : proj.offer_status}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-navy-deep">
                                    {formatCurrency(proj.offer_current_amount || 0)}
                                  </span>
                                </div>
                              </div>
                            )}
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
