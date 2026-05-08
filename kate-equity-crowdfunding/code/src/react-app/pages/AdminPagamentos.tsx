import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  CreditCard,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  Copy,
  RefreshCw,
  Calendar,
  Wallet
} from "lucide-react";

interface PixPayment {
  id: number;
  investment_id: number;
  pix_code: string;
  amount: number;
  status: string;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  // Joined fields
  user_id: string;
  offer_title: string;
}

export default function AdminPagamentos() {
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PixPayment | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    expired: 0,
    total_paid_amount: 0,
    total_pending_amount: 0
  });

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pix-payments?status=${statusFilter}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching payments:", e);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date() && status === "pending";
    
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <XCircle className="w-3.5 h-3.5" />
          Expirado
        </span>
      );
    }
    
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: "Aguardando", color: "bg-amber-100 text-amber-700", icon: Clock },
      paid: { label: "Pago", color: "bg-green-100 text-green-700", icon: CheckCircle },
      expired: { label: "Expirado", color: "bg-gray-100 text-gray-600", icon: XCircle },
      failed: { label: "Falhou", color: "bg-red-100 text-red-600", icon: AlertCircle }
    };
    
    const s = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-600", icon: AlertCircle };
    const Icon = s.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredPayments = payments.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.offer_title?.toLowerCase().includes(term) ||
      p.pix_code?.toLowerCase().includes(term) ||
      p.investment_id?.toString().includes(term)
    );
  });

  return (
    <AdminLayout title="Pagamentos PIX" subtitle="Acompanhamento de pagamentos via PIX">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Aguardando</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.pending}</p>
            <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.total_pending_amount)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Pagos</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.paid}</p>
            <p className="text-sm text-green-600 mt-1">{formatCurrency(stats.total_paid_amount)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-kate-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">Expirados</span>
            </div>
            <p className="text-3xl font-bold text-navy-deep">{stats.expired}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-kate-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por oferta, código PIX ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none appearance-none bg-white min-w-[160px]"
              >
                <option value="all">Todos</option>
                <option value="pending">Aguardando</option>
                <option value="paid">Pagos</option>
                <option value="expired">Expirados</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={fetchPayments}
              className="flex items-center gap-2 px-4 py-2.5 bg-navy-deep text-white rounded-xl hover:bg-navy-deep/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-20">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-kate-border bg-gray-50">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Oferta</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Criado em</th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-600">Expira em</th>
                    <th className="text-right py-4 px-5 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kate-border">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono text-sm text-gray-600">#{payment.id}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-medium text-navy-deep">{payment.offer_title || "—"}</p>
                          <p className="text-xs text-gray-500">Inv. #{payment.investment_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-navy-deep">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="py-4 px-5">
                        {getStatusBadge(payment.status, payment.expires_at)}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-600">{formatDate(payment.created_at)}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-sm ${new Date(payment.expires_at) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                          {formatDate(payment.expires_at)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedPayment(payment)}
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

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPayment(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-kate-border">
              <div>
                <h2 className="text-xl font-bold text-navy-deep">Pagamento #{selectedPayment.id}</h2>
                <p className="text-sm text-gray-500">Investimento #{selectedPayment.investment_id}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Amount */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedPayment.status, selectedPayment.expires_at)}
                <span className="text-2xl font-bold text-navy-deep">{formatCurrency(selectedPayment.amount)}</span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <CreditCard className="w-4 h-4" />
                    Oferta
                  </div>
                  <p className="font-medium text-navy-deep text-sm">{selectedPayment.offer_title || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Criado em
                  </div>
                  <p className="font-medium text-navy-deep text-sm">{formatDate(selectedPayment.created_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Expira em
                  </div>
                  <p className={`font-medium text-sm ${new Date(selectedPayment.expires_at) < new Date() ? 'text-red-500' : 'text-navy-deep'}`}>
                    {formatDate(selectedPayment.expires_at)}
                  </p>
                </div>
                {selectedPayment.paid_at && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                      <Wallet className="w-4 h-4" />
                      Pago em
                    </div>
                    <p className="font-medium text-green-700 text-sm">{formatDate(selectedPayment.paid_at)}</p>
                  </div>
                )}
              </div>

              {/* PIX Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código PIX</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedPayment.pix_code}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-kate-border rounded-xl font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedPayment.pix_code)}
                    className="p-3 bg-navy-deep text-white rounded-xl hover:bg-navy-deep/90 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
