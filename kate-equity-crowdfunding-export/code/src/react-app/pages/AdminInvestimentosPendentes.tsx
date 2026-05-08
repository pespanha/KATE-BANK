import { useState, useEffect } from "react";
import { Link } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  FileCheck,
  Search,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Image,
  User,
  Building2,
  Calendar,
  Wallet,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Copy,
  Coins,
  Shield
} from "lucide-react";

interface PendingInvestment {
  id: number;
  user_id: string;
  offer_id: number;
  amount: number;
  cotas_reserved: number;
  status: string;
  payment_proof_url: string | null;
  proof_sent_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Joined fields
  offer_title: string;
  company_name: string;
  project_name: string;
  user_email: string;
  user_name: string;
  user_phone: string | null;
}

interface Stats {
  pending_count: number;
  pending_amount: number;
  approved_count: number;
  approved_amount: number;
  rejected_count: number;
}

interface ApprovalResult {
  success: boolean;
  message: string;
  investment: {
    id: number;
    amount: number;
    status: string;
    tokens_reserved: number;
    cotas_reserved: number;
  };
  investor: {
    id: string;
    name: string;
    email: string;
    hathor_address: string | null;
  };
  nft: {
    uid: string;
    tx_hash: string;
    explorer_url: string;
  } | null;
  project: {
    id: number;
    name: string;
    token_uid: string;
    token_symbol: string;
    escrow_address: string;
    current_raised: number;
  };
}

export default function AdminInvestimentosPendentes() {
  const [investments, setInvestments] = useState<PendingInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvestment, setSelectedInvestment] = useState<PendingInvestment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showApprovalLoading, setShowApprovalLoading] = useState(false);
  const [approvalStep, setApprovalStep] = useState(0);
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    pending_count: 0,
    pending_amount: 0,
    approved_count: 0,
    approved_amount: 0,
    rejected_count: 0
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending-investments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvestments(data.investments);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching pending investments:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setShowApprovalLoading(true);
    setApprovalStep(0);
    setApprovalResult(null);
    
    try {
      // Step 1: Validating
      setApprovalStep(1);
      await new Promise(r => setTimeout(r, 500));
      
      // Step 2: Creating NFT
      setApprovalStep(2);
      
      const res = await fetch(`/api/admin/investments/${id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Step 3: Finalizing
        setApprovalStep(3);
        await new Promise(r => setTimeout(r, 300));
        
        setApprovalResult(data as ApprovalResult);
        setShowApprovalLoading(false);
        setShowApprovalSuccess(true);
        setSelectedInvestment(null);
        fetchInvestments();
      } else {
        setShowApprovalLoading(false);
        alert(data.error || "Erro ao aprovar");
      }
    } catch (e) {
      console.error("Error approving:", e);
      setShowApprovalLoading(false);
      alert("Erro ao aprovar investimento");
    }
  };
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  
  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const handleReject = async () => {
    if (!selectedInvestment) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${selectedInvestment.id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || undefined })
      });
      
      if (res.ok) {
        setSelectedInvestment(null);
        setShowRejectModal(false);
        setRejectReason("");
        fetchInvestments();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao rejeitar");
      }
    } catch (e) {
      console.error("Error rejecting:", e);
      alert("Erro ao rejeitar investimento");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      proof_sent: { label: "Comprovante Enviado", color: "bg-amber-100 text-amber-700", icon: FileCheck },
      pending_approval: { label: "Aguardando Aprovação", color: "bg-orange-100 text-orange-700", icon: Clock },
      paid: { label: "Aprovado", color: "bg-green-100 text-green-700", icon: CheckCircle },
      blockchain_registered: { label: "NFT Emitido", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      rejected: { label: "Rejeitado", color: "bg-red-100 text-red-600", icon: XCircle }
    };
    
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-600", icon: Clock };
    const Icon = s.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  const filteredInvestments = investments.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.user_email?.toLowerCase().includes(term) ||
      inv.user_name?.toLowerCase().includes(term) ||
      inv.offer_title?.toLowerCase().includes(term) ||
      inv.company_name?.toLowerCase().includes(term) ||
      inv.id.toString().includes(term)
    );
  });

  return (
    <AdminLayout title="Investimentos Pendentes" subtitle="Aprovação de pagamentos via transferência bancária">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <span className="text-sm text-amber-800">Aguardando Aprovação</span>
            </div>
            <p className="text-3xl font-bold text-amber-900">{stats.pending_count}</p>
            <p className="text-sm text-amber-700 mt-1">{formatCurrency(stats.pending_amount)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Aprovados (Manual)</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.approved_count}</p>
            <p className="text-sm text-green-600 mt-1">{formatCurrency(stats.approved_amount)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-sm text-gray-500">Rejeitados</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.rejected_count}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-kate-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, oferta ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
              />
            </div>
            <button
              onClick={fetchInvestments}
              className="flex items-center gap-2 px-4 py-2.5 bg-navy-deep text-white rounded-xl hover:bg-navy-deep/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Investments List */}
        <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="text-center py-20">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "Nenhum investimento encontrado" : "Nenhum investimento pendente de aprovação"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-kate-border bg-gray-50">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Investidor</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Oferta</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Comprovante</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Enviado em</th>
                    <th className="text-right py-4 px-5 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kate-border">
                  {filteredInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono text-sm text-gray-600">#{inv.id}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-navy" />
                          </div>
                          <div>
                            <p className="font-medium text-navy-deep text-sm">{inv.user_name || "—"}</p>
                            <p className="text-xs text-gray-500">{inv.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-medium text-navy-deep text-sm">{inv.offer_title}</p>
                        <p className="text-xs text-gray-500">{inv.company_name}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-navy-deep">{formatCurrency(inv.amount)}</span>
                        {inv.cotas_reserved > 0 && (
                          <p className="text-xs text-gray-500">{inv.cotas_reserved} cotas</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {inv.payment_proof_url ? (
                          <a
                            href={inv.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Image className="w-4 h-4" />
                            Ver
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-600">
                          {inv.proof_sent_at ? formatDate(inv.proof_sent_at) : "—"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedInvestment(inv)}
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

      {/* Investment Detail Modal */}
      {selectedInvestment && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedInvestment(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-kate-border">
              <div>
                <h2 className="text-xl font-bold text-navy-deep">Investimento #{selectedInvestment.id}</h2>
                <div className="mt-1">{getStatusBadge(selectedInvestment.status)}</div>
              </div>
              <button
                onClick={() => setSelectedInvestment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Amount */}
              <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl p-5 border border-gold/20 text-center">
                <p className="text-sm text-gray-600 mb-1">Valor do Investimento</p>
                <p className="text-3xl font-bold text-navy-deep">{formatCurrency(selectedInvestment.amount)}</p>
                {selectedInvestment.cotas_reserved > 0 && (
                  <p className="text-sm text-gold mt-1">{selectedInvestment.cotas_reserved} cotas reservadas</p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <User className="w-4 h-4" />
                    Investidor
                  </div>
                  <p className="font-medium text-navy-deep">{selectedInvestment.user_name || "—"}</p>
                  <p className="text-sm text-gray-500">{selectedInvestment.user_email}</p>
                  {selectedInvestment.user_phone && (
                    <p className="text-sm text-gray-500">{selectedInvestment.user_phone}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Building2 className="w-4 h-4" />
                    Oferta
                  </div>
                  <p className="font-medium text-navy-deep">{selectedInvestment.offer_title}</p>
                  <p className="text-sm text-gray-500">{selectedInvestment.company_name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    Data do Investimento
                  </div>
                  <p className="font-medium text-navy-deep">{formatDate(selectedInvestment.created_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Wallet className="w-4 h-4" />
                    Comprovante Enviado
                  </div>
                  <p className="font-medium text-navy-deep">
                    {selectedInvestment.proof_sent_at ? formatDate(selectedInvestment.proof_sent_at) : "Não enviado"}
                  </p>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedInvestment.payment_proof_url && (
                <div>
                  <h3 className="font-semibold text-navy-deep mb-3 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Comprovante de Pagamento
                  </h3>
                  <div className="border border-kate-border rounded-xl overflow-hidden">
                    <img
                      src={selectedInvestment.payment_proof_url}
                      alt="Comprovante"
                      className="w-full max-h-96 object-contain bg-gray-50"
                    />
                    <div className="p-3 bg-gray-50 border-t border-kate-border">
                      <a
                        href={selectedInvestment.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Abrir em nova aba
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {selectedInvestment.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Motivo da Rejeição
                  </div>
                  <p className="text-red-700">{selectedInvestment.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-6 border-t border-kate-border bg-gray-50">
              <Link
                to={`/admin/investimentos/${selectedInvestment.id}`}
                className="py-3 px-4 border border-kate-border text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Ver Página Completa
              </Link>
              {["pending_payment", "proof_sent", "pending_approval"].includes(selectedInvestment.status) && (
                <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Rejeitar
                </button>
                <button
                  onClick={() => handleApprove(selectedInvestment.id)}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Aprovar Investimento
                </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-kate-border">
              <h2 className="text-xl font-bold text-navy-deep">Rejeitar Investimento</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">Atenção</p>
                <p>O investidor será notificado sobre a rejeição e o motivo informado.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da rejeição (opcional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Comprovante ilegível, valor divergente, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-kate-border">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 px-4 border border-kate-border text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Loading Modal */}
      {showApprovalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-navy-deep mb-2">Processando Aprovação</h3>
              <p className="text-gray-500 mb-8">Aguarde enquanto registramos na blockchain...</p>
              
              <div className="space-y-3 text-left">
                {[
                  { step: 1, label: "Validando investimento" },
                  { step: 2, label: "Criando NFT de compromisso" },
                  { step: 3, label: "Finalizando registro" }
                ].map(({ step, label }) => (
                  <div key={step} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    approvalStep >= step ? "bg-green-50" : "bg-gray-50"
                  }`}>
                    {approvalStep > step ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : approvalStep === step ? (
                      <Loader2 className="w-5 h-5 text-gold animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={approvalStep >= step ? "text-gray-900" : "text-gray-400"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Success Modal */}
      {showApprovalSuccess && approvalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Investimento Aprovado!</h3>
              <p className="text-green-100">{approvalResult.message}</p>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Investment Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Valor investido</span>
                  <span className="text-xl font-bold text-navy-deep">
                    {(approvalResult.investment.amount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Cotas reservadas</span>
                  <span className="font-semibold text-navy-deep">{approvalResult.investment.cotas_reserved}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tokens reservados</span>
                  <span className="font-semibold text-gold">
                    {(approvalResult.investment.tokens_reserved ?? 0).toLocaleString()} {approvalResult.project.token_symbol}
                  </span>
                </div>
              </div>

              {/* Investor Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-navy-deep flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Investidor
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">Nome:</span> {approvalResult.investor.name}</p>
                  <p><span className="text-gray-500">Email:</span> {approvalResult.investor.email}</p>
                  {approvalResult.investor.hathor_address && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Carteira:</span>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">{truncateAddress(approvalResult.investor.hathor_address)}</code>
                      <button onClick={() => copyToClipboard(approvalResult.investor.hathor_address!, "investor_wallet")} className="text-gray-400 hover:text-gray-600">
                        {copiedField === "investor_wallet" ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* NFT Info */}
              {approvalResult.nft && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-navy-deep flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    NFT de Compromisso
                  </h4>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">NFT UID</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white px-2 py-1 rounded">{truncateAddress(approvalResult.nft.uid)}</code>
                          <button onClick={() => copyToClipboard(approvalResult.nft!.uid, "nft_uid")} className="text-gray-400 hover:text-gray-600">
                            {copiedField === "nft_uid" ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">TX Hash</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white px-2 py-1 rounded">{truncateAddress(approvalResult.nft.tx_hash)}</code>
                          <a href={approvalResult.nft.explorer_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-navy-deep flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Projeto: {approvalResult.project.name}
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Token</span>
                    <span className="font-mono font-semibold">{approvalResult.project.token_symbol}</span>
                  </div>
                  {approvalResult.project.escrow_address && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Escrow</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded">{truncateAddress(approvalResult.project.escrow_address)}</code>
                        <button onClick={() => copyToClipboard(approvalResult.project.escrow_address, "escrow")} className="text-gray-400 hover:text-gray-600">
                          {copiedField === "escrow" ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total captado</span>
                    <span className="font-semibold text-green-600">
                      {(approvalResult.project.current_raised ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-kate-border">
              <button
                onClick={() => setShowApprovalSuccess(false)}
                className="w-full py-3 bg-navy-deep text-white rounded-xl font-semibold hover:bg-navy-deep/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
