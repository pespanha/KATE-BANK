import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Coins,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink,
  User,
  Megaphone,
  Play,
  Zap
} from "lucide-react";

interface TokenJob {
  id: number;
  offer_id: number;
  investment_id: number;
  user_id: string;
  status: string;
  provider: string;
  tx_id: string | null;
  token_amount: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  offer_title?: string;
  user_email?: string;
  investment_amount?: number;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

type StatusFilter = "all" | "pending" | "processing" | "completed" | "failed";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Processando" },
  { value: "completed", label: "Concluído" },
  { value: "failed", label: "Falhou" },
];

export default function AdminTokenJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<TokenJob[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "all"
  );
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/admin/token-jobs?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setStats(data.stats || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
      }
    } catch (e) {
      console.error("Error fetching token jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };

  const handleProcessJob = async (job: TokenJob) => {
    if (processing) return;
    
    setProcessing(job.id);
    try {
      const res = await fetch(`/api/admin/token-jobs/${job.id}/process`, {
        method: "POST",
        credentials: "include"
      });
      
      if (res.ok) {
        fetchJobs();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao processar job");
      }
    } catch (e) {
      console.error("Error processing job:", e);
      alert("Erro ao processar job");
    } finally {
      setProcessing(null);
    }
  };

  const handleRetryJob = async (job: TokenJob) => {
    if (processing) return;
    
    setProcessing(job.id);
    try {
      const res = await fetch(`/api/admin/token-jobs/${job.id}/retry`, {
        method: "POST",
        credentials: "include"
      });
      
      if (res.ok) {
        fetchJobs();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao reprocessar job");
      }
    } catch (e) {
      console.error("Error retrying job:", e);
      alert("Erro ao reprocessar job");
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessAllPending = async () => {
    if (processing) return;
    
    const pendingJobs = jobs.filter(j => j.status === "pending");
    if (pendingJobs.length === 0) {
      alert("Nenhum job pendente");
      return;
    }
    
    if (!confirm(`Processar ${pendingJobs.length} jobs pendentes?`)) return;
    
    setProcessing(-1);
    try {
      const res = await fetch("/api/admin/token-jobs/process-all", {
        method: "POST",
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Jobs processados");
        fetchJobs();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao processar jobs");
      }
    } catch (e) {
      console.error("Error processing all jobs:", e);
      alert("Erro ao processar jobs");
    } finally {
      setProcessing(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      job.offer_title?.toLowerCase().includes(searchLower) ||
      job.user_email?.toLowerCase().includes(searchLower) ||
      job.tx_id?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: any }> = {
      pending: { color: "bg-amber-100 text-amber-700", label: "Pendente", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-700", label: "Processando", icon: Loader2 },
      completed: { color: "bg-green-100 text-green-700", label: "Concluído", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-700", label: "Falhou", icon: XCircle },
    };
    const { color, label, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${color}`}>
        <Icon className={`w-3.5 h-3.5 ${status === "processing" ? "animate-spin" : ""}`} />
        {label}
      </span>
    );
  };

  return (
    <AdminLayout 
      title="Token Jobs" 
      subtitle={`${stats.total} jobs • ${stats.pending} pendentes • ${stats.completed} concluídos`}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pendentes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.processing}</p>
                <p className="text-sm text-gray-500">Processando</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.completed}</p>
                <p className="text-sm text-gray-500">Concluídos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.failed}</p>
                <p className="text-sm text-gray-500">Falharam</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por oferta, usuário ou tx_id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            />
          </div>

          <button
            onClick={() => fetchJobs()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-kate-border text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          {stats.pending > 0 && (
            <button
              onClick={handleProcessAllPending}
              disabled={processing !== null}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Zap className="w-5 h-5" />
              Processar Todos
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === option.value
                  ? "bg-gold text-navy-deep"
                  : "bg-white border border-kate-border text-gray-600 hover:border-gold/50"
              }`}
            >
              {option.label}
              {option.value === "pending" && stats.pending > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {stats.pending}
                </span>
              )}
              {option.value === "failed" && stats.failed > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {stats.failed}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Hathor Integration Notice */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Integração Hathor Network</h3>
              <p className="text-sm text-purple-700 mt-1">
                Os Token Jobs estão em modo simulado. A integração com a Hathor Network para emissão 
                real de tokens será implementada em breve.
              </p>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
            <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhum Token Job encontrado</h3>
            <p className="text-gray-500">
              {search 
                ? "Tente buscar por outro termo" 
                : "Token Jobs são criados quando uma oferta é encerrada com sucesso"
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-kate-border">
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Job</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Oferta</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Investidor</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Valor</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Tokens</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Data</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kate-border">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-navy-deep">#{job.id}</p>
                        <p className="text-xs text-gray-400">{job.provider}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-navy-deep">{job.offer_title || `Oferta #${job.offer_id}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">
                            {job.user_email || job.user_id.slice(0, 8) + "..."}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-navy-deep">
                          {job.investment_amount ? formatCurrency(job.investment_amount) : "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-600">
                          {job.token_amount ? (job.token_amount ?? 0).toLocaleString("pt-BR") : "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(job.status)}
                        {job.error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={job.error_message}>
                            {job.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-500">{formatDate(job.created_at)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {job.tx_id && (
                            <a
                              href={`https://explorer.hathor.network/transaction/${job.tx_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                              title="Ver transação"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {job.status === "pending" && (
                            <button
                              onClick={() => handleProcessJob(job)}
                              disabled={processing !== null}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Processar"
                            >
                              {processing === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {job.status === "failed" && (
                            <button
                              onClick={() => handleRetryJob(job)}
                              disabled={processing !== null}
                              className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Reprocessar"
                            >
                              {processing === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
