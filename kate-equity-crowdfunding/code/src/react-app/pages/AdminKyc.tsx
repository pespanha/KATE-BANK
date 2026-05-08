import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Shield,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  User,
  FileText,
  Building2,
  Clock,
  AlertTriangle,
  ChevronDown,
  Camera,
  CreditCard
} from "lucide-react";

interface KycSubmission {
  user_id: string;
  email: string;
  name: string;
  document_type: string;
  document_number: string;
  phone: string | null;
  kyc_status: string;
  kyc_submitted_at: string | null;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  proof_of_address_url: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_pix_key: string | null;
  created_at: string;
}

export default function AdminKyc() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [selectedUser, setSelectedUser] = useState<KycSubmission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const endpoint = statusFilter === "pending" 
        ? "/api/admin/kyc/pending"
        : "/api/admin/investors?include_kyc=true";
      const res = await fetch(endpoint, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || data.investors || []);
      }
    } catch (e) {
      console.error("Error fetching KYC submissions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${encodeURIComponent(selectedUser.user_id)}/approve`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setSelectedUser(null);
        fetchSubmissions();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao aprovar KYC");
      }
    } catch (e) {
      console.error("Error approving KYC:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${encodeURIComponent(selectedUser.user_id)}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setSelectedUser(null);
        setShowRejectModal(false);
        setRejectReason("");
        fetchSubmissions();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao rejeitar KYC");
      }
    } catch (e) {
      console.error("Error rejecting KYC:", e);
    } finally {
      setActionLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Pendente</span>;
      case "submitted":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Em análise</span>;
      case "verified":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Verificado</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Rejeitado</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const filteredSubmissions = submissions.filter(sub => 
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.document_number?.includes(searchTerm)
  );

  const pendingCount = submissions.filter(s => s.kyc_status === "submitted").length;

  return (
    <AdminLayout title="Verificação KYC">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Verificação KYC
            </h1>
            <p className="text-gray-500 mt-1">Gerencie verificações de identidade dos investidores</p>
          </div>
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "pending" | "all")}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="pending">Pendentes</option>
                <option value="all">Todos</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma verificação KYC encontrada</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Investidor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enviado em</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sub.name || "—"}</p>
                          <p className="text-sm text-gray-500">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{sub.document_type?.toUpperCase()}</p>
                      <p className="text-sm text-gray-500">{sub.document_number || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub.kyc_status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {sub.kyc_submitted_at ? formatDate(sub.kyc_submitted_at) : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(sub)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verificação KYC</h2>
                <p className="text-gray-500">{selectedUser.name || selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <User className="w-4 h-4" />
                    Nome completo
                  </div>
                  <p className="font-medium">{selectedUser.name || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    Documento
                  </div>
                  <p className="font-medium">{selectedUser.document_type?.toUpperCase()} {selectedUser.document_number}</p>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Documentos enviados
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { url: selectedUser.document_front_url, label: "Frente do documento" },
                    { url: selectedUser.document_back_url, label: "Verso do documento" },
                    { url: selectedUser.selfie_url, label: "Selfie" },
                    { url: selectedUser.proof_of_address_url, label: "Comprovante de endereço" }
                  ].map((doc, i) => (
                    <div key={i} className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden relative group">
                      {doc.url ? (
                        <>
                          <img
                            src={`/api/admin/files/${doc.url}`}
                            alt={doc.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => setImageModal(`/api/admin/files/${doc.url}`)}
                              className="p-2 bg-white rounded-lg"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-xs text-center px-2">Não enviado</span>
                        </div>
                      )}
                      <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center">
                        {doc.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Info */}
              {(selectedUser.bank_name || selectedUser.bank_pix_key) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    Dados bancários
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Banco</p>
                      <p className="font-medium text-sm">{selectedUser.bank_name || "—"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Agência</p>
                      <p className="font-medium text-sm">{selectedUser.bank_agency || "—"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Conta</p>
                      <p className="font-medium text-sm">{selectedUser.bank_account || "—"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Chave PIX</p>
                      <p className="font-medium text-sm truncate">{selectedUser.bank_pix_key || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status & Actions */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Status atual:</span>
                    {getStatusBadge(selectedUser.kyc_status)}
                  </div>
                  
                  {selectedUser.kyc_status === "submitted" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Aprovar KYC
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rejeitar verificação</h3>
            <p className="text-gray-600 mb-4">Informe o motivo da rejeição. O usuário receberá uma notificação.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Documento ilegível, selfie não corresponde ao documento..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setImageModal(null)}
        >
          <img
            src={imageModal}
            alt="Documento"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setImageModal(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
