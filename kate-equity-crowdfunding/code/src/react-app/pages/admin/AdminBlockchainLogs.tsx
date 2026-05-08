import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  LinkIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Activity,
  Coins,
  Send,
  Wallet,
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";


interface BlockchainLog {
  id: number;
  project_id: number | null;
  investment_id: number | null;
  user_id: string | null;
  action: string;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  token_uid: string | null;
  amount: number | null;
  is_success: number;
  error_message: string | null;
  metadata: string | null;
  created_at: string;
  project_name: string | null;
  user_email: string | null;
  user_name: string | null;
  investment_amount: number | null;
  investment_cotas: number | null;
}

interface HathorOperation {
  id: number;
  user_id: string | null;
  op_type: string;
  idempotency_key: string | null;
  request_payload: string | null;
  response_payload: string | null;
  txid: string | null;
  status: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

interface ProjectNft {
  id: number;
  name: string;
  slug: string | null;
  status: string;
  nft_uid: string | null;
  nft_tx_hash: string | null;
  nft_token_link_tx: string | null;
  token_uid: string | null;
  token_symbol: string | null;
  created_at: string;
  updated_at: string;
}

interface FilterOption {
  id: number;
  project_name: string;
}

const HATHOR_EXPLORER_URL = "https://explorer.hathor.network";

export default function AdminBlockchainLogs() {
  const [activeTab, setActiveTab] = useState<"logs" | "operations" | "project-nfts">("logs");
  const [logs, setLogs] = useState<BlockchainLog[]>([]);
  const [operations, setOperations] = useState<HathorOperation[]>([]);
  const [projectNfts, setProjectNfts] = useState<ProjectNft[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Filters for logs
  const [logFilters, setLogFilters] = useState({
    project_id: "",
    action: "",
    is_success: ""
  });
  const [logFilterOptions, setLogFilterOptions] = useState<{
    actions: string[];
    projects: FilterOption[];
  }>({ actions: [], projects: [] });
  const [logPagination, setLogPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0
  });
  
  // Filters for operations
  const [opFilters, setOpFilters] = useState({
    op_type: "",
    status: ""
  });
  const [opFilterOptions, setOpFilterOptions] = useState<{
    opTypes: string[];
    statuses: string[];
  }>({ opTypes: [], statuses: [] });
  const [opPagination, setOpPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0
  });
  
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [expandedOp, setExpandedOp] = useState<number | null>(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(logPagination.limit)
      });
      if (logFilters.project_id) params.append("project_id", logFilters.project_id);
      if (logFilters.action) params.append("action", logFilters.action);
      if (logFilters.is_success !== "") params.append("is_success", logFilters.is_success);
      
      const response = await fetch(`/api/admin/blockchain-logs?${params}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setLogPagination(data.pagination);
        setLogFilterOptions(data.filters);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(opPagination.limit)
      });
      if (opFilters.op_type) params.append("op_type", opFilters.op_type);
      if (opFilters.status) params.append("status", opFilters.status);
      
      const response = await fetch(`/api/admin/hathor-operations?${params}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations);
        setOpPagination(data.pagination);
        setOpFilterOptions(data.filters);
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectNfts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/projects?include_drafts=true", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        // Filter projects that have NFT data
        const nftProjects = (data.projects || []).filter((p: ProjectNft) => p.nft_uid || p.token_uid);
        setProjectNfts(nftProjects);
      }
    } catch (error) {
      console.error("Error fetching project NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs(1);
    } else if (activeTab === "operations") {
      fetchOperations(1);
    } else if (activeTab === "project-nfts") {
      fetchProjectNfts();
    }
  }, [activeTab]);

  const handleLogFilterChange = () => {
    fetchLogs(1);
  };

  const handleOpFilterChange = () => {
    fetchOperations(1);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateAddress = (address: string, chars = 8) => {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create_token":
        return <Coins className="w-4 h-4" />;
      case "create_nft":
        return <FileText className="w-4 h-4" />;
      case "transfer":
      case "distribute_tokens":
        return <Send className="w-4 h-4" />;
      case "refund":
        return <Wallet className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create_token: "Criar Token",
      create_nft: "Criar NFT",
      transfer: "Transferência",
      distribute_tokens: "Distribuir Tokens",
      refund: "Reembolso",
      mint_tokens: "Mint Tokens",
      melt_tokens: "Melt Tokens"
    };
    return labels[action] || action;
  };

  const getStatusBadge = (isSuccess: number) => {
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle className="w-3 h-3" />
          Sucesso
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" />
        Erro
      </span>
    );
  };

  const getOpStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-500/10 text-green-400 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20"
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.pending}`}>
        {status === "success" && <CheckCircle className="w-3 h-3" />}
        {status === "pending" && <Clock className="w-3 h-3" />}
        {status === "failed" && <XCircle className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin/kpis" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  Blockchain Logs
                </h1>
                <p className="text-sm text-muted-foreground">Auditoria de operações blockchain</p>
              </div>
            </div>
            <button
              onClick={() => activeTab === "logs" ? fetchLogs(logPagination.page) : fetchOperations(opPagination.page)}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "logs"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Blockchain Logs
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "operations"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Hathor Operations
          </button>
          <button
            onClick={() => setActiveTab("project-nfts")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "project-nfts"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            NFTs de Projeto
          </button>
        </div>

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <>
            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Projeto</label>
                  <select
                    value={logFilters.project_id}
                    onChange={(e) => setLogFilters({ ...logFilters, project_id: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Todos os projetos</option>
                    {logFilterOptions.projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Ação</label>
                  <select
                    value={logFilters.action}
                    onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Todas as ações</option>
                    {logFilterOptions.actions.map((a) => (
                      <option key={a} value={a}>{getActionLabel(a)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Status</label>
                  <select
                    value={logFilters.is_success}
                    onChange={(e) => setLogFilters({ ...logFilters, is_success: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Todos</option>
                    <option value="true">Sucesso</option>
                    <option value="false">Erro</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={handleLogFilterChange} className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                    <Search className="w-4 h-4 mr-2" />
                    Filtrar
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Total de Logs</div>
                <div className="text-2xl font-bold text-foreground">{logPagination.total}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Página Atual</div>
                <div className="text-2xl font-bold text-foreground">{logPagination.page} de {logPagination.totalPages || 1}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Exibindo</div>
                <div className="text-2xl font-bold text-foreground">{logs.length} registros</div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  Carregando logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ação</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Projeto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">TX Hash</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Valor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map((log) => (
                        <>
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(log.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                  {getActionIcon(log.action)}
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                  {getActionLabel(log.action)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {log.project_name ? (
                                <Link 
                                  to={`/admin/projetos/${log.project_id}`}
                                  className="text-sm text-primary hover:underline"
                                >
                                  {log.project_name}
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {log.user_name || log.user_email ? (
                                <div className="text-sm">
                                  <div className="text-foreground">{log.user_name || "-"}</div>
                                  <div className="text-muted-foreground text-xs">{log.user_email}</div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {log.tx_hash ? (
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {truncateAddress(log.tx_hash, 6)}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(log.tx_hash!, `tx-${log.id}`)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    {copiedField === `tx-${log.id}` ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <a
                                    href={`${HATHOR_EXPLORER_URL}/transaction/${log.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {log.amount ? (
                                <span className="text-sm font-medium text-foreground">
                                  {log.amount.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(log.is_success)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                className="text-sm text-primary hover:underline"
                              >
                                {expandedLog === log.id ? "Ocultar" : "Ver mais"}
                              </button>
                            </td>
                          </tr>
                          {expandedLog === log.id && (
                            <tr className="bg-muted/20">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  {log.from_address && (
                                    <div>
                                      <div className="text-muted-foreground mb-1">De</div>
                                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                        {truncateAddress(log.from_address)}
                                      </code>
                                    </div>
                                  )}
                                  {log.to_address && (
                                    <div>
                                      <div className="text-muted-foreground mb-1">Para</div>
                                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                        {truncateAddress(log.to_address)}
                                      </code>
                                    </div>
                                  )}
                                  {log.token_uid && (
                                    <div>
                                      <div className="text-muted-foreground mb-1">Token UID</div>
                                      <div className="flex items-center gap-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                          {truncateAddress(log.token_uid)}
                                        </code>
                                        <a
                                          href={`${HATHOR_EXPLORER_URL}/token_detail/${log.token_uid}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-muted-foreground hover:text-primary"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  {log.investment_id && (
                                    <div>
                                      <div className="text-muted-foreground mb-1">Investimento</div>
                                      <Link
                                        to={`/admin/investimentos/${log.investment_id}`}
                                        className="text-primary hover:underline"
                                      >
                                        #{log.investment_id} - R$ {log.investment_amount?.toLocaleString("pt-BR")} ({log.investment_cotas} cotas)
                                      </Link>
                                    </div>
                                  )}
                                  {log.error_message && (
                                    <div className="col-span-full">
                                      <div className="text-muted-foreground mb-1">Erro</div>
                                      <div className="text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                        {log.error_message}
                                      </div>
                                    </div>
                                  )}
                                  {log.metadata && (
                                    <div className="col-span-full">
                                      <div className="text-muted-foreground mb-1">Metadata</div>
                                      <pre className="text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto">
                                        {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {logPagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((logPagination.page - 1) * logPagination.limit) + 1} a {Math.min(logPagination.page * logPagination.limit, logPagination.total)} de {logPagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchLogs(logPagination.page - 1)}
                      disabled={logPagination.page === 1}
                      className="p-1.5 border border-border rounded-lg text-foreground bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Página {logPagination.page} de {logPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchLogs(logPagination.page + 1)}
                      disabled={logPagination.page === logPagination.totalPages}
                      className="p-1.5 border border-border rounded-lg text-foreground bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Operations Tab */}
        {activeTab === "operations" && (
          <>
            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Tipo de Operação</label>
                  <select
                    value={opFilters.op_type}
                    onChange={(e) => setOpFilters({ ...opFilters, op_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Todos os tipos</option>
                    {opFilterOptions.opTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Status</label>
                  <select
                    value={opFilters.status}
                    onChange={(e) => setOpFilters({ ...opFilters, status: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Todos</option>
                    {opFilterOptions.statuses.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={handleOpFilterChange} className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                    <Search className="w-4 h-4 mr-2" />
                    Filtrar
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Total de Operações</div>
                <div className="text-2xl font-bold text-foreground">{opPagination.total}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Página Atual</div>
                <div className="text-2xl font-bold text-foreground">{opPagination.page} de {opPagination.totalPages || 1}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Exibindo</div>
                <div className="text-2xl font-bold text-foreground">{operations.length} registros</div>
              </div>
            </div>

            {/* Operations Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  Carregando operações...
                </div>
              ) : operations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma operação encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">TX ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {operations.map((op) => (
                        <>
                          <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(op.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {op.op_type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {op.user_name || op.user_email ? (
                                <div className="text-sm">
                                  <div className="text-foreground">{op.user_name || "-"}</div>
                                  <div className="text-muted-foreground text-xs">{op.user_email}</div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Sistema</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {op.txid ? (
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {truncateAddress(op.txid, 6)}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(op.txid!, `op-tx-${op.id}`)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    {copiedField === `op-tx-${op.id}` ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <a
                                    href={`${HATHOR_EXPLORER_URL}/transaction/${op.txid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {getOpStatusBadge(op.status)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setExpandedOp(expandedOp === op.id ? null : op.id)}
                                className="text-sm text-primary hover:underline"
                              >
                                {expandedOp === op.id ? "Ocultar" : "Ver mais"}
                              </button>
                            </td>
                          </tr>
                          {expandedOp === op.id && (
                            <tr className="bg-muted/20">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {op.idempotency_key && (
                                    <div>
                                      <div className="text-muted-foreground mb-1">Idempotency Key</div>
                                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                        {op.idempotency_key}
                                      </code>
                                    </div>
                                  )}
                                  {op.request_payload && (
                                    <div className="col-span-full">
                                      <div className="text-muted-foreground mb-1">Request Payload</div>
                                      <pre className="text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto max-h-48">
                                        {JSON.stringify(JSON.parse(op.request_payload), null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {op.response_payload && (
                                    <div className="col-span-full">
                                      <div className="text-muted-foreground mb-1">Response Payload</div>
                                      <pre className="text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto max-h-48">
                                        {JSON.stringify(JSON.parse(op.response_payload), null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {opPagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((opPagination.page - 1) * opPagination.limit) + 1} a {Math.min(opPagination.page * opPagination.limit, opPagination.total)} de {opPagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchOperations(opPagination.page - 1)}
                      disabled={opPagination.page === 1}
                      className="p-1.5 border border-border rounded-lg text-foreground bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Página {opPagination.page} de {opPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchOperations(opPagination.page + 1)}
                      disabled={opPagination.page === opPagination.totalPages}
                      className="p-1.5 border border-border rounded-lg text-foreground bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Project NFTs Tab */}
        {activeTab === "project-nfts" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Projetos com NFT</div>
                <div className="text-2xl font-bold text-foreground">{projectNfts.filter(p => p.nft_uid).length}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Tokens Criados</div>
                <div className="text-2xl font-bold text-foreground">{projectNfts.filter(p => p.token_uid).length}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">NFT + Token Vinculados</div>
                <div className="text-2xl font-bold text-foreground">{projectNfts.filter(p => p.nft_token_link_tx).length}</div>
              </div>
            </div>

            {/* Project NFTs Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  Carregando projetos...
                </div>
              ) : projectNfts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum projeto com NFT encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Projeto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">NFT do Projeto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Token</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vinculação</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Verificação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {projectNfts.map((project) => (
                        <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <Link to={`/admin/projetos/${project.id}`} className="text-sm font-medium text-primary hover:underline">
                              {project.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === "fundraising" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                              project.status === "completed" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              "bg-muted text-muted-foreground border border-border"
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {project.nft_uid ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {truncateAddress(project.nft_uid, 6)}
                                </code>
                                <a href={`${HATHOR_EXPLORER_URL}/token_detail/${project.nft_uid}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {project.token_uid ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{project.token_symbol}</span>
                                <a href={`${HATHOR_EXPLORER_URL}/token_detail/${project.token_uid}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {project.nft_token_link_tx ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <a href={`${HATHOR_EXPLORER_URL}/transaction/${project.nft_token_link_tx}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {project.slug && project.nft_uid ? (
                              <Link to={`/app/verificacao/${project.slug}`} className="text-sm text-primary hover:underline">
                                Ver página
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
