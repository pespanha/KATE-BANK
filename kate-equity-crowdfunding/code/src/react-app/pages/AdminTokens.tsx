import { useState, useEffect } from "react";
import { Link } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Coins,
  FileText,
  Wallet,
  Activity,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  ArrowLeftRight,
  Loader2
} from "lucide-react";

interface Stats {
  tokens_created: number;
  nfts_issued: number;
  total_in_escrow: number;
  total_operations: number;
}

interface TokenizedProject {
  id: number;
  project_name: string;
  token_uid: string;
  token_symbol: string;
  total_tokens: number;
  escrow_address: string;
  current_raised: number;
  status: string;
  tokens_in_circulation: number;
  investors_count: number;
  fundraising_started_at: string | null;
  blockchain: string | null;
}

interface ProjectNFT {
  id: number;
  name: string;
  slug: string | null;
  nft_uid: string | null;
  nft_tx_hash: string | null;
  nft_token_link_tx: string | null;
  token_uid: string | null;
  token_symbol: string | null;
  status: string;
  approved_at: string | null;
  fundraising_started_at: string | null;
}

interface EscrowAddress {
  id: number;
  project_name: string;
  escrow_address: string;
  token_symbol: string;
  status: string;
  current_raised: number;
  tokens_reserved: number;
  investors_count: number;
}

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
}

interface FilterOption {
  id: number;
  project_name: string;
}

const HATHOR_EXPLORER_URL = "https://explorer.hathor.network";
const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

type Tab = "projects" | "nfts" | "operations" | "escrow";

const BlockchainBadge = ({ blockchain }: { blockchain: string | null }) => {
  if (!blockchain) return <span className="text-xs text-gray-400">-</span>;
  
  if (blockchain === "stellar") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
        Stellar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
      Hathor
    </span>
  );
};

const getExplorerUrl = (blockchain: string | null, type: "token" | "tx", hash: string): string => {
  if (blockchain === "stellar") {
    return type === "token" 
      ? `${STELLAR_EXPLORER_URL}/asset/${hash}`
      : `${STELLAR_EXPLORER_URL}/tx/${hash}`;
  }
  return type === "token"
    ? `${HATHOR_EXPLORER_URL}/token_detail/${hash}`
    : `${HATHOR_EXPLORER_URL}/transaction/${hash}`;
};

export default function AdminTokens() {
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [stats, setStats] = useState<Stats>({
    tokens_created: 0,
    nfts_issued: 0,
    total_in_escrow: 0,
    total_operations: 0
  });
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Projects tab
  const [projects, setProjects] = useState<TokenizedProject[]>([]);
  const [blockchainFilter, setBlockchainFilter] = useState<"all" | "hathor" | "stellar">("all");
  
  // NFTs tab - agora mostra NFTs de projetos, não de investidores individuais
  const [nfts, setNfts] = useState<ProjectNFT[]>([]);
  
  // Operations tab
  const [logs, setLogs] = useState<BlockchainLog[]>([]);
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
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  
  // Escrow tab
  const [escrow, setEscrow] = useState<EscrowAddress[]>([]);

  useEffect(() => {
    fetchStats();
    fetchTabData();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/blockchain/stats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "projects":
          await fetchProjects();
          break;
        case "nfts":
          await fetchNFTs();
          break;
        case "operations":
          await fetchLogs(1);
          break;
        case "escrow":
          await fetchEscrow();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const res = await fetch("/api/admin/blockchain/projects", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
    }
  };

  const fetchNFTs = async () => {
    const res = await fetch("/api/admin/blockchain/nfts", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setNfts(data.nfts || []);
    }
  };

  const fetchLogs = async (page = 1) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(logPagination.limit)
    });
    if (logFilters.project_id) params.append("project_id", logFilters.project_id);
    if (logFilters.action) params.append("action", logFilters.action);
    if (logFilters.is_success !== "") params.append("is_success", logFilters.is_success);
    
    const res = await fetch(`/api/admin/blockchain-logs?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
      setLogPagination(data.pagination);
      setLogFilterOptions(data.filters);
    }
  };

  const fetchEscrow = async () => {
    const res = await fetch("/api/admin/blockchain/escrow", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setEscrow(data.escrow || []);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateAddress = (address: string, chars = 8) => {
    if (!address) return "-";
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getProjectStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      fundraising: { bg: "bg-green-100", text: "text-green-700", label: "Ativo" },
      completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Distribuído" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
      approved: { bg: "bg-amber-100", text: "text-amber-700", label: "Aprovado" },
    };
    const { bg, text, label } = config[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getProjectNFTStatusBadge = (nft_uid: string | null, nft_token_link_tx: string | null) => {
    if (!nft_uid) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3" />
          Pendente
        </span>
      );
    }
    if (nft_token_link_tx) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Vinculado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        <CheckCircle className="w-3 h-3" />
        Emitido
      </span>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create_token": return <Coins className="w-4 h-4" />;
      case "create_nft": return <FileText className="w-4 h-4" />;
      case "transfer":
      case "distribute_tokens": return <Send className="w-4 h-4" />;
      case "refund": return <ArrowLeftRight className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create_token: "Criar Token",
      create_nft: "Criar NFT",
      transfer: "Transferência",
      distribute_tokens: "Distribuir Tokens",
      refund: "Reembolso",
    };
    return labels[action] || action;
  };

  const getLogStatusBadge = (isSuccess: number) => {
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Sucesso
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" />
        Erro
      </span>
    );
  };

  const tabs = [
    { id: "projects" as Tab, label: "Projetos Tokenizados", icon: Coins },
    { id: "nfts" as Tab, label: "NFTs de Projetos", icon: FileText },
    { id: "operations" as Tab, label: "Operações", icon: Activity },
    { id: "escrow" as Tab, label: "Escrow", icon: Wallet },
  ];

  return (
    <AdminLayout 
      title="Gestão Blockchain" 
      subtitle="Tokens, NFTs e operações on-chain"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.tokens_created}</p>
                <p className="text-sm text-gray-500">Tokens Criados</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.nfts_issued}</p>
                <p className="text-sm text-gray-500">NFTs Emitidos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{formatCurrency(stats.total_in_escrow)}</p>
                <p className="text-sm text-gray-500">Em Escrow</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-kate-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-deep">{stats.total_operations}</p>
                <p className="text-sm text-gray-500">Operações Totais</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-gold text-navy-deep"
                    : "bg-white border border-kate-border text-gray-600 hover:border-gold/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : (
          <>
            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                {/* Blockchain Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 mr-2">Blockchain:</span>
                  <button
                    onClick={() => setBlockchainFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      blockchainFilter === "all"
                        ? "bg-navy-deep text-white"
                        : "bg-white border border-kate-border text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setBlockchainFilter("hathor")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      blockchainFilter === "hathor"
                        ? "bg-green-600 text-white"
                        : "bg-white border border-kate-border text-gray-600 hover:border-green-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${blockchainFilter === "hathor" ? "bg-white" : "bg-green-500"}`}></span>
                    Hathor
                  </button>
                  <button
                    onClick={() => setBlockchainFilter("stellar")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      blockchainFilter === "stellar"
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-kate-border text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${blockchainFilter === "stellar" ? "bg-white" : "bg-indigo-500"}`}></span>
                    Stellar
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
                {projects.filter(p => blockchainFilter === "all" || p.blockchain === blockchainFilter).length === 0 ? (
                  <div className="p-12 text-center">
                    <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhum projeto tokenizado</h3>
                    <p className="text-gray-500">Projetos tokenizados aparecerão aqui após a criação do token</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-kate-border">
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Projeto</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Blockchain</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Token</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Token UID</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Supply</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Em Circulação</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Investidores</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Status</th>
                          <th className="px-5 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kate-border">
                        {projects.filter(p => blockchainFilter === "all" || p.blockchain === blockchainFilter).map(project => (
                          <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <Link to={`/admin/projetos/${project.id}`} className="font-medium text-navy-deep hover:text-gold">
                                {project.project_name}
                              </Link>
                            </td>
                            <td className="px-5 py-4">
                              <BlockchainBadge blockchain={project.blockchain} />
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                                {project.token_symbol}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                  {truncateAddress(project.token_uid, 6)}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(project.token_uid, `token-${project.id}`)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `token-${project.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={getExplorerUrl(project.blockchain, "token", project.token_uid)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-gold"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {project.total_tokens?.toLocaleString("pt-BR") || 0}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {project.tokens_in_circulation?.toLocaleString("pt-BR") || 0}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {project.investors_count || 0}
                            </td>
                            <td className="px-5 py-4">
                              {getProjectStatusBadge(project.status)}
                            </td>
                            <td className="px-5 py-4">
                              <Link
                                to={`/admin/projetos/${project.id}`}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors inline-flex"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </div>
            )}

            {/* NFTs Tab - agora mostra NFTs de projetos */}
            {activeTab === "nfts" && (
              <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
                {nfts.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhum NFT de projeto emitido</h3>
                    <p className="text-gray-500">NFTs são criados quando projetos são aprovados para captação</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-kate-border">
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Projeto</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">NFT UID</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">TX Hash</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Token Vinculado</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">NFT↔Token Link</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Verificação</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Status</th>
                          <th className="px-5 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kate-border">
                        {nfts.map(nft => (
                          <tr key={nft.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <Link to={`/admin/projetos/${nft.id}`} className="font-medium text-navy-deep hover:text-gold">
                                {nft.name}
                              </Link>
                              {nft.token_symbol && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                  {nft.token_symbol}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {nft.nft_uid ? (
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono border border-indigo-200">
                                    {truncateAddress(nft.nft_uid, 6)}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(nft.nft_uid!, `nft-uid-${nft.id}`)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    {copiedField === `nft-uid-${nft.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Não emitido</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {nft.nft_tx_hash ? (
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    {truncateAddress(nft.nft_tx_hash, 6)}
                                  </code>
                                  <a
                                    href={`${HATHOR_EXPLORER_URL}/transaction/${nft.nft_tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gold"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {nft.token_uid ? (
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono">
                                    {truncateAddress(nft.token_uid, 6)}
                                  </code>
                                  <a
                                    href={`${HATHOR_EXPLORER_URL}/token_detail/${nft.token_uid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gold"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {nft.nft_token_link_tx ? (
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-mono border border-green-200">
                                    {truncateAddress(nft.nft_token_link_tx, 6)}
                                  </code>
                                  <a
                                    href={`${HATHOR_EXPLORER_URL}/transaction/${nft.nft_token_link_tx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-700"
                                    title="Ver vinculação NFT↔Token"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Pendente</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {nft.slug ? (
                                <a
                                  href={`/verificacao/${nft.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-hover font-medium"
                                >
                                  Ver página
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {getProjectNFTStatusBadge(nft.nft_uid, nft.nft_token_link_tx)}
                            </td>
                            <td className="px-5 py-4">
                              <Link
                                to={`/admin/projetos/${nft.id}`}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors inline-flex"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Operations Tab */}
            {activeTab === "operations" && (
              <>
                {/* Filters */}
                <div className="bg-white rounded-xl border border-kate-border p-4">
                  <div className="flex items-center gap-2 mb-4 text-gray-500">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtros</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Projeto</label>
                      <select
                        value={logFilters.project_id}
                        onChange={(e) => setLogFilters({ ...logFilters, project_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-kate-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="">Todos os projetos</option>
                        {logFilterOptions.projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.project_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Ação</label>
                      <select
                        value={logFilters.action}
                        onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-kate-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="">Todas as ações</option>
                        {logFilterOptions.actions.map((a) => (
                          <option key={a} value={a}>{getActionLabel(a)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Status</label>
                      <select
                        value={logFilters.is_success}
                        onChange={(e) => setLogFilters({ ...logFilters, is_success: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-kate-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="">Todos</option>
                        <option value="true">Sucesso</option>
                        <option value="false">Erro</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => fetchLogs(1)} 
                        className="w-full px-4 py-2 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Filtrar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
                  {logs.length === 0 ? (
                    <div className="p-12 text-center">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhuma operação encontrada</h3>
                      <p className="text-gray-500">Operações blockchain aparecerão aqui</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-kate-border">
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Data</th>
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Ação</th>
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Projeto</th>
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Usuário</th>
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">TX Hash</th>
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Valor</th>
                              <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Status</th>
                              <th className="px-5 py-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-kate-border">
                            {logs.map((log) => (
                              <>
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {formatDate(log.created_at)}
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <span className="p-1.5 rounded-lg bg-gold/10 text-gold">
                                        {getActionIcon(log.action)}
                                      </span>
                                      <span className="text-sm font-medium text-navy-deep">
                                        {getActionLabel(log.action)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    {log.project_name ? (
                                      <Link 
                                        to={`/admin/projetos/${log.project_id}`}
                                        className="text-sm text-gold hover:underline"
                                      >
                                        {log.project_name}
                                      </Link>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {log.user_name || log.user_email ? (
                                      <div className="text-sm">
                                        <div className="text-navy-deep">{log.user_name || "-"}</div>
                                        <div className="text-gray-500 text-xs">{log.user_email}</div>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {log.tx_hash ? (
                                      <div className="flex items-center gap-2">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                          {truncateAddress(log.tx_hash, 6)}
                                        </code>
                                        <button
                                          onClick={() => copyToClipboard(log.tx_hash!, `tx-${log.id}`)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          {copiedField === `tx-${log.id}` ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                        <a
                                          href={`${HATHOR_EXPLORER_URL}/transaction/${log.tx_hash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-gray-400 hover:text-gold"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {log.amount ? (
                                      <span className="text-sm font-medium text-navy-deep">
                                        {(log.amount ?? 0).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    {getLogStatusBadge(log.is_success)}
                                  </td>
                                  <td className="px-5 py-4">
                                    <button
                                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                      className="text-sm text-gold hover:underline"
                                    >
                                      {expandedLog === log.id ? "Ocultar" : "Ver mais"}
                                    </button>
                                  </td>
                                </tr>
                                {expandedLog === log.id && (
                                  <tr className="bg-gray-50">
                                    <td colSpan={8} className="px-5 py-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        {log.from_address && (
                                          <div>
                                            <div className="text-gray-500 mb-1">De</div>
                                            <code className="text-xs bg-white px-2 py-1 rounded font-mono border">
                                              {truncateAddress(log.from_address)}
                                            </code>
                                          </div>
                                        )}
                                        {log.to_address && (
                                          <div>
                                            <div className="text-gray-500 mb-1">Para</div>
                                            <code className="text-xs bg-white px-2 py-1 rounded font-mono border">
                                              {truncateAddress(log.to_address)}
                                            </code>
                                          </div>
                                        )}
                                        {log.token_uid && (
                                          <div>
                                            <div className="text-gray-500 mb-1">Token UID</div>
                                            <div className="flex items-center gap-2">
                                              <code className="text-xs bg-white px-2 py-1 rounded font-mono border">
                                                {truncateAddress(log.token_uid)}
                                              </code>
                                              <a
                                                href={`${HATHOR_EXPLORER_URL}/token_detail/${log.token_uid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-gold"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            </div>
                                          </div>
                                        )}
                                        {log.investment_id && (
                                          <div>
                                            <div className="text-gray-500 mb-1">Investimento</div>
                                            <Link
                                              to={`/admin/investimentos/${log.investment_id}`}
                                              className="text-gold hover:underline"
                                            >
                                              #{log.investment_id}
                                            </Link>
                                          </div>
                                        )}
                                        {log.error_message && (
                                          <div className="col-span-full">
                                            <div className="text-gray-500 mb-1">Erro</div>
                                            <div className="text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                              {log.error_message}
                                            </div>
                                          </div>
                                        )}
                                        {log.metadata && (
                                          <div className="col-span-full">
                                            <div className="text-gray-500 mb-1">Metadata</div>
                                            <pre className="text-xs bg-white px-3 py-2 rounded-lg overflow-x-auto border">
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

                      {/* Pagination */}
                      {logPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-4 border-t border-kate-border">
                          <div className="text-sm text-gray-500">
                            Mostrando {((logPagination.page - 1) * logPagination.limit) + 1} a {Math.min(logPagination.page * logPagination.limit, logPagination.total)} de {logPagination.total}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchLogs(logPagination.page - 1)}
                              disabled={logPagination.page === 1}
                              className="p-1.5 border border-kate-border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">
                              Página {logPagination.page} de {logPagination.totalPages}
                            </span>
                            <button
                              onClick={() => fetchLogs(logPagination.page + 1)}
                              disabled={logPagination.page === logPagination.totalPages}
                              className="p-1.5 border border-kate-border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Escrow Tab */}
            {activeTab === "escrow" && (
              <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
                {escrow.length === 0 ? (
                  <div className="p-12 text-center">
                    <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhum endereço escrow</h3>
                    <p className="text-gray-500">Endereços escrow aparecerão aqui quando projetos iniciarem captação</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-kate-border">
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Projeto</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Endereço Escrow</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Token</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Valor Captado</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Tokens Reservados</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Investidores</th>
                          <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kate-border">
                        {escrow.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <Link to={`/admin/projetos/${item.id}`} className="font-medium text-navy-deep hover:text-gold">
                                {item.project_name}
                              </Link>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                  {truncateAddress(item.escrow_address, 8)}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(item.escrow_address, `escrow-${item.id}`)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {copiedField === `escrow-${item.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={`${HATHOR_EXPLORER_URL}/address/${item.escrow_address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-gold"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {item.token_symbol ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                  {item.token_symbol}
                                </span>
                              ) : "-"}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-navy-deep">
                              {formatCurrency(item.current_raised || 0)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {item.tokens_reserved?.toLocaleString("pt-BR") || 0}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {item.investors_count || 0}
                            </td>
                            <td className="px-5 py-4">
                              {getProjectStatusBadge(item.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
