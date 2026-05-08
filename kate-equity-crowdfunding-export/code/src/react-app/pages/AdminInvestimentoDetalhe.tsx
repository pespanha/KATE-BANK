import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Coins,
  Hash,
  RefreshCw,
  Shield,
  CreditCard,
  Download,
  Eye,
  CircleDot,
  Send,
  Award
} from "lucide-react";

// Timeline step configuration
interface TimelineStep {
  id: string;
  label: string;
  icon: typeof CheckCircle2;
  description: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { id: "created", label: "Investimento Criado", icon: CircleDot, description: "Reserva de cotas iniciada" },
  { id: "payment_approved", label: "Pagamento Aprovado", icon: CreditCard, description: "Comprovante verificado" },
  { id: "escrow_reserved", label: "Tokens Reservados", icon: Shield, description: "Tokens reservados em escrow" },
  { id: "awaiting_close", label: "Aguardando Encerramento", icon: Clock, description: "Captação em andamento" },
  { id: "tokens_sent", label: "Tokens Transferidos", icon: Send, description: "Tokens enviados para carteira" },
  { id: "nft_issued", label: "NFT Emitido", icon: Award, description: "Comprovante NFT criado" }
];

function getTimelineStatus(investment: Investment): Record<string, "completed" | "current" | "pending" | "failed"> {
  const status: Record<string, "completed" | "current" | "pending" | "failed"> = {
    created: "completed",
    payment_approved: "pending",
    escrow_reserved: "pending",
    awaiting_close: "pending",
    tokens_sent: "pending",
    nft_issued: "pending"
  };

  if (investment.status === "rejected" || investment.status === "cancelled") {
    return { ...status, created: "failed" };
  }

  if (investment.status === "refunded") {
    status.payment_approved = "completed";
    status.escrow_reserved = "completed";
    status.awaiting_close = "failed";
    return status;
  }

  // Payment proof sent or approved
  if (["proof_sent", "pending_approval", "paid", "escrow_reserved", "blockchain_registered", "distributing", "completed", "completed_no_nft"].includes(investment.status)) {
    status.payment_approved = investment.status === "proof_sent" || investment.status === "pending_approval" ? "current" : "completed";
  }

  // Escrow reserved
  if (["escrow_reserved", "blockchain_registered", "distributing", "completed", "completed_no_nft"].includes(investment.status)) {
    status.escrow_reserved = "completed";
    status.awaiting_close = investment.status === "escrow_reserved" ? "current" : "completed";
  }

  // Distributing
  if (investment.status === "distributing") {
    status.tokens_sent = "current";
  }

  // Tokens sent
  if (investment.distribution_tx_hash || ["completed", "completed_no_nft"].includes(investment.status)) {
    status.tokens_sent = "completed";
    status.nft_issued = investment.nft_uid ? "completed" : (investment.status === "completed_no_nft" ? "failed" : "pending");
  }

  return status;
}

interface Investment {
  id: number;
  user_id: string;
  offer_id: number;
  amount: number;
  cotas_reserved: number;
  status: string;
  payment_method: string;
  payment_proof_url: string | null;
  proof_sent_at: string | null;
  nft_uid: string | null;
  nft_tx_hash: string | null;
  tokens_reserved: number | null;
  tokens_received: number | null;
  escrow_tx_hash: string | null;
  distribution_tx_hash: string | null;
  hathor_address: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  offer_title: string;
  max_goal: number;
  project_id: number;
  project_name: string;
  company_name: string;
  token_uid: string | null;
  token_symbol: string | null;
  escrow_address: string | null;
  total_tokens: number | null;
  user_email: string;
  user_name: string | null;
  user_phone: string | null;
  user_document: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pendente", color: "amber", icon: Clock },
  pending_payment: { label: "Aguardando Pagamento", color: "amber", icon: Clock },
  proof_sent: { label: "Comprovante Enviado", color: "purple", icon: AlertCircle },
  pending_approval: { label: "Aguardando Aprovação", color: "blue", icon: AlertCircle },
  paid: { label: "Pago", color: "green", icon: CheckCircle2 },
  escrow_reserved: { label: "Reservado em Escrow", color: "purple", icon: Shield },
  blockchain_registered: { label: "Registrado na Blockchain", color: "indigo", icon: Hash },
  distributing: { label: "Distribuindo Tokens", color: "blue", icon: RefreshCw },
  token_released: { label: "Tokens Liberados", color: "green", icon: Coins },
  completed: { label: "Concluído", color: "green", icon: CheckCircle2 },
  refunded: { label: "Reembolsado", color: "gray", icon: RefreshCw },
  rejected: { label: "Rejeitado", color: "red", icon: XCircle },
  cancelled: { label: "Cancelado", color: "gray", icon: XCircle }
};

export default function AdminInvestimentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchInvestment();
  }, [id]);

  const fetchInvestment = async () => {
    try {
      const res = await fetch(`/api/admin/investments/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvestment(data);
      }
    } catch (e) {
      console.error("Error fetching investment:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!investment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investment.id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        await fetchInvestment();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao aprovar investimento");
      }
    } catch (e) {
      console.error("Error approving investment:", e);
      alert("Erro ao aprovar investimento");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!investment || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investment.id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectionReason("");
        await fetchInvestment();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao rejeitar investimento");
      }
    } catch (e) {
      console.error("Error rejecting investment:", e);
      alert("Erro ao rejeitar investimento");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDocument = (doc: string | null) => {
    if (!doc) return "—";
    // Format CPF or CNPJ
    const clean = doc.replace(/\D/g, "");
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return doc;
  };

  if (loading) {
    return (
      <AdminLayout title="Detalhe do Investimento">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!investment) {
    return (
      <AdminLayout title="Detalhe do Investimento">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Investimento não encontrado</p>
          <Link to="/admin/pendentes" className="text-gold hover:text-gold-hover mt-4 inline-block">
            Voltar para lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[investment.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const canApprove = ["pending_approval", "pending", "proof_sent"].includes(investment.status);
  const timelineStatus = getTimelineStatus(investment);

  return (
    <AdminLayout title="Detalhe do Investimento">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy-deep">
            Investimento #{investment.id}
          </h1>
          <p className="text-gray-500 text-sm">
            Criado em {formatDate(investment.created_at)}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg bg-${statusConfig.color}-100 border border-${statusConfig.color}-200`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 text-${statusConfig.color}-600`} />
            <span className={`font-medium text-${statusConfig.color}-700`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Visual Blockchain */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-navy-deep mb-6 flex items-center gap-2">
          <Hash className="w-5 h-5 text-gold" />
          Timeline Blockchain
        </h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 hidden lg:block" />
          
          {/* Timeline steps */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TIMELINE_STEPS.map((step, index) => {
              const stepStatus = timelineStatus[step.id];
              const StepIcon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center text-center relative">
                  {/* Connector line for mobile */}
                  {index > 0 && (
                    <div className="absolute -left-2 top-5 w-4 h-0.5 bg-gray-200 lg:hidden" />
                  )}
                  
                  {/* Icon circle */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    stepStatus === "completed" 
                      ? "bg-green-500 text-white shadow-lg shadow-green-200" 
                      : stepStatus === "current"
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-200 animate-pulse"
                      : stepStatus === "failed"
                      ? "bg-red-500 text-white shadow-lg shadow-red-200"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  }`}>
                    {stepStatus === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : stepStatus === "failed" ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <p className={`text-xs font-medium mb-1 ${
                    stepStatus === "completed" 
                      ? "text-green-700" 
                      : stepStatus === "current"
                      ? "text-blue-700"
                      : stepStatus === "failed"
                      ? "text-red-700"
                      : "text-gray-400"
                  }`}>
                    {step.label}
                  </p>
                  
                  {/* Description */}
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Transaction links */}
        {(investment.distribution_tx_hash || investment.nft_tx_hash) && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
            {investment.distribution_tx_hash && (
              <a
                href={`https://explorer.hathor.network/transaction/${investment.distribution_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Send className="w-3 h-3" />
                Ver transferência no Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {investment.nft_tx_hash && (
              <a
                href={`https://explorer.hathor.network/transaction/${investment.nft_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Award className="w-3 h-3" />
                Ver NFT no Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investment details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gold" />
              Detalhes do Investimento
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Valor investido</p>
                <p className="text-xl font-bold text-navy-deep">
                  {formatCurrency(investment.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cotas reservadas</p>
                <p className="text-xl font-bold text-navy-deep">
                  {investment.cotas_reserved?.toLocaleString("pt-BR") || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Método de pagamento</p>
                <p className="font-medium text-navy-deep">
                  {investment.payment_method === "pix" ? "PIX" : 
                   investment.payment_method === "bank_transfer" ? "Transferência" : 
                   investment.payment_method || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tokens reservados</p>
                <p className="font-medium text-navy-deep">
                  {investment.tokens_reserved?.toLocaleString("pt-BR") || "—"}
                </p>
              </div>
            </div>

            {/* Payment proof */}
            {investment.payment_proof_url && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Comprovante de pagamento</p>
                <div className="flex items-center gap-2">
                  <a
                    href={investment.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-navy-deep transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver comprovante
                  </a>
                  <a
                    href={investment.payment_proof_url}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-navy-deep transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
                {investment.proof_sent_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Enviado em {formatDate(investment.proof_sent_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Blockchain info */}
          {(investment.nft_uid || investment.tokens_received || investment.escrow_tx_hash) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-gold" />
                Dados Blockchain
              </h2>
              <div className="space-y-4">
                {investment.hathor_address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Endereço do investidor</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                        {investment.hathor_address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(investment.hathor_address!, "address")}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        {copied === "address" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <a
                        href={`https://explorer.hathor.network/address/${investment.hathor_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                )}

                {investment.nft_uid && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">NFT UID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                        {investment.nft_uid}
                      </code>
                      <button
                        onClick={() => copyToClipboard(investment.nft_uid!, "nft")}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        {copied === "nft" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <a
                        href={`https://explorer.hathor.network/token_detail/${investment.nft_uid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                )}

                {investment.nft_tx_hash && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">NFT Transaction</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                        {investment.nft_tx_hash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(investment.nft_tx_hash!, "nft_tx")}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        {copied === "nft_tx" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <a
                        href={`https://explorer.hathor.network/transaction/${investment.nft_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                )}

                {investment.escrow_tx_hash && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Escrow Transaction</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                        {investment.escrow_tx_hash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(investment.escrow_tx_hash!, "escrow_tx")}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        {copied === "escrow_tx" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <a
                        href={`https://explorer.hathor.network/transaction/${investment.escrow_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                )}

                {investment.tokens_received && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        {(investment.tokens_received ?? 0).toLocaleString("pt-BR")} tokens distribuídos
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection info */}
          {investment.rejection_reason && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h2 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Motivo da Rejeição
              </h2>
              <p className="text-red-700">{investment.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Investor info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Dados do Investidor
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-navy-deep">{investment.user_name || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-navy-deep">{investment.user_email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-navy-deep">{investment.user_phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-navy-deep">{formatDocument(investment.user_document)}</span>
              </div>
            </div>
          </div>

          {/* Project info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              Projeto
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Projeto</p>
                <p className="font-medium text-navy-deep">{investment.project_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Empresa</p>
                <p className="font-medium text-navy-deep">{investment.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oferta</p>
                <p className="font-medium text-navy-deep">{investment.offer_title}</p>
              </div>
              {investment.token_symbol && (
                <div>
                  <p className="text-sm text-gray-500">Token</p>
                  <p className="font-medium text-navy-deep">{investment.token_symbol}</p>
                </div>
              )}
              <Link
                to={`/admin/projetos/${investment.project_id}`}
                className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-hover mt-2"
              >
                Ver projeto
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Actions */}
          {canApprove && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                Ações
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Aprovar Pagamento
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-navy-deep mb-4">Rejeitar Investimento</h3>
            <p className="text-sm text-gray-600 mb-4">
              Informe o motivo da rejeição. O investidor será notificado.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo da rejeição..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none h-24 text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {actionLoading ? "Rejeitando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
