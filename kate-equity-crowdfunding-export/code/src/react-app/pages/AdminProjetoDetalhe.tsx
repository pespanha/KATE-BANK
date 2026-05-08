import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Target,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Megaphone,
  Calendar,
  Coins,
  Send,
  RefreshCw,
  Link as LinkIcon,
  Shield,
  Copy,
  BadgeCheck,
  ShieldCheck
} from "lucide-react";

interface Project {
  id: number;
  user_id: string;
  project_name: string;
  company_name: string | null;
  responsible_name: string;
  email: string;
  whatsapp: string;
  website: string | null;
  document_type: string;
  document_number: string | null;
  address: string | null;
  legal_representative: string | null;
  category: string;
  funding_range: string;
  stage: string;
  short_description: string | null;
  full_description: string | null;
  problem_solution: string | null;
  revenue_model: string | null;
  target_market: string | null;
  competitive_advantage: string | null;
  current_revenue: string | null;
  growth_info: string | null;
  key_metrics: string | null;
  team_info: string | null;
  min_goal: number | null;
  max_goal: number | null;
  deadline_date: string | null;
  target_valuation: string | null;
  equity_offered: string | null;
  use_of_funds: string | null;
  pitch_deck_url: string | null;
  social_contract_url: string | null;
  cap_table_url: string | null;
  financial_report_url: string | null;
  other_docs_url: string | null;
  status: string;
  rejection_reason: string | null;
  submission_progress: number;
  submitted_at: string | null;
  created_at: string;
  // Blockchain fields
  token_uid: string | null;
  token_symbol: string | null;
  token_tx_hash: string | null;
  total_tokens: number | null;
  escrow_address: string | null;
  is_blockchain_verified: number | null;
  current_raised: number | null;
  fundraising_started_at: string | null;
  fundraising_ended_at: string | null;
  // NFT do Projeto fields
  nft_uid: string | null;
  nft_tx_hash: string | null;
  slug: string | null;
  nft_token_link_tx: string | null;
  // Offer relation
  offer_id: number | null;
  offer_status: string | null;
}

export default function AdminProjetoDetalhe() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showStartFundraisingModal, setShowStartFundraisingModal] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalTokens, setTotalTokens] = useState("1000000");
  const [selectedBlockchain, setSelectedBlockchain] = useState<"hathor" | "stellar">("hathor");
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [investments, setInvestments] = useState<any[]>([]);
  const [investmentStats, setInvestmentStats] = useState<any>(null);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const HATHOR_EXPLORER_URL = "https://explorer.hathor.network";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateAddress = (address: string, start = 8, end = 8) => {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  useEffect(() => {
    fetchProject();
    fetchInvestments();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { credentials: "include" });
      if (!res.ok) {
        setError("Projeto não encontrado");
        return;
      }
      const data = await res.json();
      setProject(data.project);
    } catch (e) {
      console.error("Error fetching project:", e);
      setError("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    setLoadingInvestments(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}/investments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setInvestments(data.investments || []);
        setInvestmentStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching investments:", err);
    } finally {
      setLoadingInvestments(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Tem certeza que deseja aprovar este projeto?")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        await fetchProject();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao aprovar projeto");
      }
    } catch (e) {
      console.error("Error approving project:", e);
      alert("Erro ao aprovar projeto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.ok) {
        setShowRejectModal(false);
        await fetchProject();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao rejeitar projeto");
      }
    } catch (e) {
      console.error("Error rejecting project:", e);
      alert("Erro ao rejeitar projeto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartFundraising = async () => {
    if (!tokenSymbol.trim()) {
      alert("Informe o símbolo do token");
      return;
    }
    if (!totalTokens || parseInt(totalTokens) < 100) {
      alert("Quantidade mínima de tokens é 100");
      return;
    }

    setBlockchainLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/start-fundraising`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          offer_id: project?.offer_id,
          token_symbol: tokenSymbol.toUpperCase(),
          total_tokens: parseInt(totalTokens),
          blockchain: selectedBlockchain
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Captação iniciada com sucesso! Token criado na blockchain.");
        setShowStartFundraisingModal(false);
        await fetchProject();
      } else {
        alert(data.error || "Erro ao iniciar captação");
      }
    } catch (e) {
      console.error("Error starting fundraising:", e);
      alert("Erro ao iniciar captação");
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handleDistributeTokens = async () => {
    if (!confirm("Tem certeza que deseja distribuir os tokens para todos os investidores? Esta ação não pode ser desfeita.")) return;

    setBlockchainLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/distribute-tokens`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Distribuição concluída!\n\n${data.data.successful}/${data.data.total_investments} transferências realizadas.\n${(data.data.total_tokens_distributed ?? 0).toLocaleString("pt-BR")} tokens distribuídos.`);
        await fetchProject();
      } else {
        alert(data.error || "Erro ao distribuir tokens");
      }
    } catch (e) {
      console.error("Error distributing tokens:", e);
      alert("Erro ao distribuir tokens");
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handleRefundInvestors = async () => {
    if (!confirm("Tem certeza que deseja reembolsar todos os investidores? Esta ação irá cancelar o projeto e não pode ser desfeita.")) return;

    setBlockchainLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}/refund-investors`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Reembolsos processados!\n\n${data.data.successful}/${data.data.total_investments} reembolsos realizados.\nTotal reembolsado: R$ ${(data.data.total_refunded ?? 0).toLocaleString("pt-BR")}`);
        await fetchProject();
      } else {
        alert(data.error || "Erro ao processar reembolsos");
      }
    } catch (e) {
      console.error("Error refunding investors:", e);
      alert("Erro ao processar reembolsos");
    } finally {
      setBlockchainLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Carregando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !project) {
    return (
      <AdminLayout title="Erro">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/admin/projetos" className="text-gold-hover hover:underline">
            Voltar para lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = () => {
    const config: Record<string, { color: string; label: string; icon: any }> = {
      draft: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "Rascunho", icon: FileText },
      pending_review: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Em análise", icon: Clock },
      approved: { color: "bg-green-100 text-green-700 border-green-200", label: "Aprovado", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejeitado", icon: XCircle },
    };
    const { color, label, icon: Icon } = config[project.status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border ${color}`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  const documents = [
    { label: "Pitch Deck", url: project.pitch_deck_url },
    { label: "Contrato Social", url: project.social_contract_url },
    { label: "Cap Table", url: project.cap_table_url },
    { label: "Relatório Financeiro", url: project.financial_report_url },
    { label: "Outros Documentos", url: project.other_docs_url },
  ].filter(d => d.url);

  return (
    <AdminLayout 
      title={project.project_name}
      subtitle={`Submetido em ${project.submitted_at ? formatDate(project.submitted_at) : formatDate(project.created_at)}`}
    >
      <div className="space-y-6">
        {/* Back link and status */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            to="/admin/projetos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-navy-deep transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para lista
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Action buttons for pending projects */}
        {project.status === "pending_review" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Este projeto aguarda sua análise</p>
                  <p className="text-sm text-amber-700">Revise as informações e tome uma decisão</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 border border-red-300 text-red-700 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Rejeitar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Aprovar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approved - Create Offer */}
        {project.status === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Projeto aprovado</p>
                  <p className="text-sm text-green-700">Você pode criar uma oferta para este projeto</p>
                </div>
              </div>
              <Link
                to={`/admin/ofertas/criar?project_id=${project.id}`}
                className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                Criar Oferta
              </Link>
            </div>
          </div>
        )}

        {/* Blockchain Controls - For approved/offer_created projects with offer */}
        {(project.status === "approved" || project.status === "offer_created") && project.offer_id && !project.token_uid && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="font-medium text-indigo-800">Blockchain</p>
                  <p className="text-sm text-indigo-700">Iniciar captação na blockchain Hathor</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTokenSymbol(project.project_name.slice(0, 4).toUpperCase());
                  setShowStartFundraisingModal(true);
                }}
                disabled={blockchainLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Iniciar Captação
              </button>
            </div>
          </div>
        )}

        {/* Blockchain Info - For projects with token created */}
        {project.token_uid && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <LinkIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-indigo-900">Informações Blockchain</p>
                <p className="text-sm text-indigo-700">Token criado na rede Hathor</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Símbolo</p>
                <p className="font-bold text-indigo-900">{project.token_symbol}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Total Tokens</p>
                <p className="font-bold text-indigo-900">{project.total_tokens?.toLocaleString("pt-BR")}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Arrecadado</p>
                <p className="font-bold text-green-700">{formatCurrency(project.current_raised || 0)}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Meta Mínima</p>
                <p className="font-bold text-gray-700">{formatCurrency(project.min_goal || 0)}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Token UID:</span>
                <code className="bg-white/80 px-2 py-0.5 rounded text-xs font-mono text-indigo-800 break-all">
                  {project.token_uid}
                </code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Escrow:</span>
                <code className="bg-white/80 px-2 py-0.5 rounded text-xs font-mono text-indigo-800 break-all">
                  {project.escrow_address}
                </code>
              </div>
            </div>

            {/* Action buttons based on status */}
            {project.status !== "completed" && project.status !== "cancelled" && (
              <div className="flex flex-wrap gap-3 pt-3 border-t border-indigo-200">
                {(project.current_raised || 0) >= (project.min_goal || 0) && (
                  <button
                    onClick={handleDistributeTokens}
                    disabled={blockchainLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {blockchainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Distribuir Tokens
                  </button>
                )}
                <button
                  onClick={handleRefundInvestors}
                  disabled={blockchainLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {blockchainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Reembolsar Investidores
                </button>
              </div>
            )}

            {project.status === "completed" && (
              <div className="flex items-center gap-2 pt-3 border-t border-indigo-200 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Tokens distribuídos com sucesso</span>
              </div>
            )}

            {project.status === "cancelled" && (
              <div className="flex items-center gap-2 pt-3 border-t border-indigo-200 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Projeto cancelado - investidores reembolsados</span>
              </div>
            )}
          </div>
        )}

        {/* Blockchain Verification Card */}
        {project.token_uid && (
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-deep">Verificação Blockchain</h2>
                <p className="text-sm text-gray-500">Auditoria e verificação na rede Hathor</p>
              </div>
            </div>

            {/* Verification Status Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Token</span>
                </div>
                <p className="text-xs text-green-700">Verificado na rede</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Escrow</span>
                </div>
                <p className="text-xs text-blue-700">Endereço ativo</p>
              </div>

              <div className={`bg-gradient-to-br ${investmentStats?.blockchain_registered > 0 ? 'from-purple-50 to-violet-50 border-purple-200' : 'from-gray-50 to-slate-50 border-gray-200'} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className={`w-5 h-5 ${investmentStats?.blockchain_registered > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${investmentStats?.blockchain_registered > 0 ? 'text-purple-800' : 'text-gray-600'}`}>NFTs</span>
                </div>
                <p className={`text-xs ${investmentStats?.blockchain_registered > 0 ? 'text-purple-700' : 'text-gray-500'}`}>
                  {investmentStats?.blockchain_registered || 0} registrados
                </p>
              </div>

              <div className={`bg-gradient-to-br ${project.status === 'completed' ? 'from-emerald-50 to-teal-50 border-emerald-200' : 'from-amber-50 to-yellow-50 border-amber-200'} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  {project.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  <span className={`text-sm font-medium ${project.status === 'completed' ? 'text-emerald-800' : 'text-amber-800'}`}>Status</span>
                </div>
                <p className={`text-xs ${project.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {project.status === 'completed' ? 'Finalizado' : project.status === 'cancelled' ? 'Cancelado' : 'Em andamento'}
                </p>
              </div>
            </div>

            {/* Blockchain Identifiers */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                    <Coins className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Token UID</p>
                    <p className="font-mono text-sm text-gray-800 truncate" title={project.token_uid}>
                      {truncateAddress(project.token_uid, 12, 12)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(project.token_uid!, 'token')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    {copiedField === 'token' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <a
                    href={`${HATHOR_EXPLORER_URL}/token/${project.token_uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Ver no Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Endereço Escrow</p>
                    <p className="font-mono text-sm text-gray-800 truncate" title={project.escrow_address || ''}>
                      {project.escrow_address ? truncateAddress(project.escrow_address, 12, 12) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => project.escrow_address && copyToClipboard(project.escrow_address, 'escrow')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copiar"
                    disabled={!project.escrow_address}
                  >
                    {copiedField === 'escrow' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className={`w-4 h-4 ${project.escrow_address ? 'text-gray-500' : 'text-gray-300'}`} />
                    )}
                  </button>
                  {project.escrow_address && (
                    <a
                      href={`${HATHOR_EXPLORER_URL}/address/${project.escrow_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Ver no Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                </div>
              </div>

              {project.token_tx_hash && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">TX Hash (Criação)</p>
                      <p className="font-mono text-sm text-gray-800 truncate" title={project.token_tx_hash}>
                        {truncateAddress(project.token_tx_hash, 12, 12)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(project.token_tx_hash!, 'txhash')}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Copiar"
                    >
                      {copiedField === 'txhash' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <a
                      href={`${HATHOR_EXPLORER_URL}/transaction/${project.token_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      title="Ver no Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-green-600" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-kate-border">
              <a
                href={`${HATHOR_EXPLORER_URL}/token/${project.token_uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Verificar Token
              </a>
              {project.escrow_address && (
                <a
                  href={`${HATHOR_EXPLORER_URL}/address/${project.escrow_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Verificar Escrow
                </a>
              )}
              <Link
                to={`/admin/blockchain-logs?project_id=${project.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                Ver Logs
              </Link>
            </div>
          </div>
        )}

        {/* NFT do Projeto */}
        {project.nft_uid && (
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-purple-900">NFT do Projeto</h2>
                <p className="text-sm text-purple-700">Certificado de autenticidade na blockchain</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {/* NFT UID */}
              <div className="flex items-center justify-between bg-white/60 rounded-xl p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-purple-600">NFT UID</p>
                    <p className="font-mono text-sm text-purple-900 truncate" title={project.nft_uid}>
                      {truncateAddress(project.nft_uid, 12, 12)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(project.nft_uid!, 'nft')}
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    {copiedField === 'nft' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-purple-500" />
                    )}
                  </button>
                  <a
                    href={`${HATHOR_EXPLORER_URL}/token_detail/${project.nft_uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Ver no Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                  </a>
                </div>
              </div>

              {/* NFT TX Hash */}
              {project.nft_tx_hash && (
                <div className="flex items-center justify-between bg-white/60 rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 bg-violet-100 rounded-lg flex-shrink-0">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-purple-600">TX Hash (Criação NFT)</p>
                      <p className="font-mono text-sm text-purple-900 truncate" title={project.nft_tx_hash}>
                        {truncateAddress(project.nft_tx_hash, 12, 12)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(project.nft_tx_hash!, 'nft_tx')}
                      className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
                      title="Copiar"
                    >
                      {copiedField === 'nft_tx' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-violet-500" />
                      )}
                    </button>
                    <a
                      href={`${HATHOR_EXPLORER_URL}/transaction/${project.nft_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
                      title="Ver no Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-violet-600" />
                    </a>
                  </div>
                </div>
              )}

              {/* NFT ↔ Token Link */}
              {project.nft_token_link_tx && (
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 bg-emerald-100 rounded-lg flex-shrink-0">
                      <LinkIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-emerald-600">Vínculo NFT ↔ Token</p>
                      <p className="font-mono text-sm text-emerald-900 truncate" title={project.nft_token_link_tx}>
                        {truncateAddress(project.nft_token_link_tx, 12, 12)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(project.nft_token_link_tx!, 'link_tx')}
                      className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Copiar"
                    >
                      {copiedField === 'link_tx' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                    <a
                      href={`${HATHOR_EXPLORER_URL}/transaction/${project.nft_token_link_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Ver no Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-600" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-purple-200">
              <a
                href={`${HATHOR_EXPLORER_URL}/token_detail/${project.nft_uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Ver NFT no Explorer
              </a>
              {project.slug && (
                <Link
                  to={`/app/verificacao/${project.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-xl transition-colors text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Página de Verificação
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Rejected reason */}
        {project.status === "rejected" && project.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Motivo da rejeição</p>
                <p className="text-sm text-red-700 mt-1">{project.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                Informações da Empresa
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoItem label="Nome do Projeto" value={project.project_name} />
                <InfoItem label="Razão Social" value={project.company_name} />
                <InfoItem label="Documento" value={`${project.document_type?.toUpperCase()}: ${project.document_number || "Não informado"}`} />
                <InfoItem label="Representante Legal" value={project.legal_representative} />
                <InfoItem label="Categoria" value={project.category} />
                <InfoItem label="Estágio" value={project.stage} />
              </div>
            </div>

            {/* Description */}
            {(project.short_description || project.full_description) && (
              <div className="bg-white rounded-2xl border border-kate-border p-6">
                <h2 className="text-lg font-bold text-navy-deep mb-4">Descrição</h2>
                {project.short_description && (
                  <p className="text-gray-600 mb-4">{project.short_description}</p>
                )}
                {project.full_description && (
                  <p className="text-gray-600 whitespace-pre-wrap">{project.full_description}</p>
                )}
              </div>
            )}

            {/* Business Details */}
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Detalhes do Negócio
              </h2>
              <div className="space-y-4">
                {project.problem_solution && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Problema & Solução</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.problem_solution}</p>
                  </div>
                )}
                {project.revenue_model && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Modelo de Receita</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.revenue_model}</p>
                  </div>
                )}
                {project.target_market && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Mercado Alvo</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.target_market}</p>
                  </div>
                )}
                {project.competitive_advantage && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Diferencial Competitivo</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.competitive_advantage}</p>
                  </div>
                )}
                {project.current_revenue && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Receita Atual</h3>
                    <p className="text-gray-700">{project.current_revenue}</p>
                  </div>
                )}
                {project.key_metrics && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Métricas Chave</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.key_metrics}</p>
                  </div>
                )}
                {project.team_info && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Equipe</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.team_info}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Details */}
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                Detalhes da Captação
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoItem label="Faixa de Captação" value={project.funding_range} />
                <InfoItem label="Meta Mínima" value={project.min_goal ? formatCurrency(project.min_goal) : null} />
                <InfoItem label="Meta Máxima" value={project.max_goal ? formatCurrency(project.max_goal) : null} />
                <InfoItem label="Prazo" value={project.deadline_date ? formatDate(project.deadline_date) : null} />
                <InfoItem label="Valuation Alvo" value={project.target_valuation} />
                <InfoItem label="Equity Oferecido" value={project.equity_offered} />
              </div>
              {project.use_of_funds && (
                <div className="mt-4 pt-4 border-t border-kate-border">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Uso dos Recursos</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.use_of_funds}</p>
                </div>
              )}
            </div>

            {/* Blockchain Investments Section */}
            {project.token_uid && (
              <div className="bg-white rounded-2xl border border-kate-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-navy-deep flex items-center gap-2">
                    <Coins className="w-5 h-5 text-gold" />
                    Investimentos Blockchain
                  </h2>
                  <button
                    onClick={fetchInvestments}
                    disabled={loadingInvestments}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingInvestments ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>

                {/* Stats Grid */}
                {investmentStats && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-navy-deep">{investmentStats.total_count}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-indigo-600">{investmentStats.blockchain_registered}</p>
                      <p className="text-xs text-gray-500">Na Blockchain</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-green-600">{investmentStats.tokens_distributed}</p>
                      <p className="text-xs text-gray-500">Distribuídos</p>
                    </div>
                  </div>
                )}

                {/* Investments Table */}
                {loadingInvestments ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : investments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Nenhum investimento registrado</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {investments.map((inv) => (
                      <div key={inv.id} className="border border-kate-border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-navy-deep">{inv.user_name || inv.user_email}</p>
                            <p className="text-xs text-gray-500">{inv.user_email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-navy-deep">{formatCurrency(inv.amount)}</p>
                            {inv.cotas_reserved && (
                              <p className="text-xs text-gray-500">{inv.cotas_reserved} cotas</p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            inv.status === 'blockchain_registered' ? 'bg-indigo-100 text-indigo-700' :
                            inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                            inv.status === 'refunded' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {inv.status === 'blockchain_registered' ? 'Blockchain ✓' :
                             inv.status === 'paid' ? 'Pago' :
                             inv.status === 'refunded' ? 'Reembolsado' :
                             inv.status}
                          </span>
                          {inv.tokens_received && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              Tokens Recebidos
                            </span>
                          )}
                        </div>

                        {/* Blockchain Data */}
                        {inv.nft_uid && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">NFT UID:</span>
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-white px-2 py-0.5 rounded font-mono">
                                  {truncateAddress(inv.nft_uid)}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(inv.nft_uid, `nft-${inv.id}`)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  {copiedField === `nft-${inv.id}` ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <LinkIcon className="w-3 h-3 text-gray-400" />
                                  )}
                                </button>
                                <a
                                  href={`https://explorer.hathor.network/token_detail/${inv.nft_uid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <ExternalLink className="w-3 h-3 text-indigo-500" />
                                </a>
                              </div>
                            </div>
                            {inv.tokens_reserved && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Tokens Reservados:</span>
                                <span className="font-medium">{(inv.tokens_reserved ?? 0).toLocaleString()} {project.token_symbol}</span>
                              </div>
                            )}
                            {inv.tokens_received && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Tokens Recebidos:</span>
                                <span className="font-medium text-green-600">{(inv.tokens_received ?? 0).toLocaleString()} {project.token_symbol}</span>
                              </div>
                            )}
                            {inv.investor_hathor_address && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Wallet:</span>
                                <code className="text-xs bg-white px-2 py-0.5 rounded font-mono">
                                  {truncateAddress(inv.investor_hathor_address)}
                                </code>
                              </div>
                            )}
                            {inv.distribution_tx_hash && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">TX Distribuição:</span>
                                <a
                                  href={`https://explorer.hathor.network/transaction/${inv.distribution_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1"
                                >
                                  Ver <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {inv.refund_tx_hash && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">TX Reembolso:</span>
                                <a
                                  href={`https://explorer.hathor.network/transaction/${inv.refund_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1"
                                >
                                  Ver <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Link to detail page */}
                        <a
                          href={`/admin/investimentos/${inv.id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          Ver detalhes completos <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                Contato
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-deep">{project.responsible_name}</p>
                    <p className="text-xs text-gray-500">Responsável</p>
                  </div>
                </div>
                <a 
                  href={`mailto:${project.email}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">{project.email}</span>
                </a>
                <a 
                  href={`https://wa.me/${project.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{project.whatsapp}</span>
                </a>
                {project.website && (
                  <a 
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700 truncate">{project.website}</span>
                  </a>
                )}
                {project.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">{project.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Documentos
              </h2>
              {documents.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <span className="text-sm font-medium text-navy-deep">{doc.label}</span>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Timeline
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Criado em</span>
                  <span className="text-navy-deep">{formatDate(project.created_at)}</span>
                </div>
                {project.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submetido em</span>
                    <span className="text-navy-deep">{formatDate(project.submitted_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-navy-deep mb-4">Rejeitar Projeto</h3>
            <p className="text-sm text-gray-500 mb-4">
              Informe o motivo da rejeição. Essa informação será enviada ao responsável pelo projeto.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo da rejeição..."
              rows={4}
              className="w-full p-3 border border-kate-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 border border-kate-border text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Fundraising Modal - Redesigned */}
      {showStartFundraisingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStartFundraisingModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg my-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                <Coins className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-deep">Iniciar Captação</h3>
                <p className="text-sm text-gray-500">Criar token na blockchain para este projeto</p>
              </div>
            </div>

            {/* Blockchain Selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blockchain
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedBlockchain("hathor")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedBlockchain === "hathor"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${selectedBlockchain === "hathor" ? "bg-indigo-500" : "bg-gray-300"}`} />
                    <span className="font-bold text-gray-900">Hathor</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Rede brasileira, sem taxas de transação, escalável
                  </p>
                </button>
                <button
                  onClick={() => setSelectedBlockchain("stellar")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedBlockchain === "stellar"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${selectedBlockchain === "stellar" ? "bg-indigo-500" : "bg-gray-300"}`} />
                    <span className="font-bold text-gray-900">Stellar</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Rede global, pagamentos rápidos, amplamente adotada
                  </p>
                </button>
              </div>
            </div>

            {/* Project Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Resumo do Projeto</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Meta Mínima</p>
                  <p className="font-bold text-navy-deep">{formatCurrency(project.min_goal || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Meta Máxima</p>
                  <p className="font-bold text-navy-deep">{formatCurrency(project.max_goal || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Equity Oferecido</p>
                  <p className="font-bold text-navy-deep">{project.equity_offered || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Valuation</p>
                  <p className="font-medium text-gray-700">{project.target_valuation || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prazo</p>
                  <p className="font-medium text-gray-700">
                    {project.deadline_date ? new Date(project.deadline_date).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Token Symbol Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Símbolo do Token
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5);
                    setTokenSymbol(value);
                  }}
                  placeholder="KATE"
                  maxLength={5}
                  className="flex-1 p-3 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 uppercase font-mono text-lg tracking-wider"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Máximo 5 caracteres (letras maiúsculas)</p>
            </div>
            
            {/* Total Tokens Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Quantidade Total de Tokens (Cotas)
              </label>
              <input
                type="text"
                value={parseInt(totalTokens || "0").toLocaleString("pt-BR")}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setTotalTokens(rawValue || "0");
                }}
                placeholder="Ex: 1.000"
                className="w-full p-3 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-lg font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 100 tokens</p>
            </div>

            {/* Quick Suggestions */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Sugestões rápidas:</p>
              <div className="flex gap-2">
                {[100, 1000, 10000].map((qty) => {
                  const valorPorCota = (project.min_goal || 0) / qty;
                  return (
                    <button
                      key={qty}
                      onClick={() => setTotalTokens(qty.toString())}
                      className={`flex-1 px-3 py-2 rounded-xl border transition-all text-center ${
                        parseInt(totalTokens) === qty
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="font-bold text-sm">{qty.toLocaleString("pt-BR")} cotas</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(valorPorCota)}/cota
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto Calculation Block */}
            {parseInt(totalTokens) > 0 && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Cálculo automático</span>
                </div>
                
                {(() => {
                  const tokens = parseInt(totalTokens) || 1;
                  const valorPorCota = (project.min_goal || 0) / tokens;
                  const investimentoMinimo = valorPorCota;
                  const investimentoMaximo = project.max_goal || 0;
                  const cotasMaximas = tokens;

                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-green-700">Valor por cota:</span>
                          <p className="text-xs text-green-600">(Meta mínima ÷ Total de tokens)</p>
                        </div>
                        <span className="font-bold text-lg text-green-800">{formatCurrency(valorPorCota)}</span>
                      </div>
                      <div className="border-t border-green-200 pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Investimento mínimo:</span>
                          <span className="font-medium text-green-800">{formatCurrency(investimentoMinimo)} (1 cota)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Investimento máximo:</span>
                          <span className="font-medium text-green-800">{formatCurrency(investimentoMaximo)} ({cotasMaximas.toLocaleString("pt-BR")} cotas)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Warnings */}
            {(() => {
              const tokens = parseInt(totalTokens) || 1;
              const valorPorCota = (project.min_goal || 0) / tokens;
              
              if (valorPorCota < 1 && tokens > 0) {
                return (
                  <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Valor por cota abaixo de R$ 1,00. Considere reduzir a quantidade de tokens.
                      </p>
                    </div>
                  </div>
                );
              }
              
              if (valorPorCota > 10000) {
                return (
                  <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Valor por cota acima de R$ 10.000. Pode limitar o número de investidores.
                      </p>
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Final Warning */}
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>Atenção:</strong> Esta ação criará um token na blockchain {selectedBlockchain === "hathor" ? "Hathor" : "Stellar"} e um endereço de escrow. 
                  A captação será iniciada imediatamente. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartFundraisingModal(false)}
                className="flex-1 py-3 border border-kate-border text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStartFundraising}
                disabled={blockchainLoading || !tokenSymbol.trim() || parseInt(totalTokens) < 100}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {blockchainLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                Criar Token e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-navy-deep font-medium">{value || "—"}</p>
    </div>
  );
}
