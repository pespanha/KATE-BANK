import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Coins,
  RefreshCw,
  Calendar,
  ExternalLink,
  CreditCard,
  FileText,
  Users,
  Building2,
  Target,
  Loader2,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Wallet,
  XCircle,
  LinkIcon,
  Shield,
  Copy,
  Check,

  ShieldCheck
} from "lucide-react";



interface InvestmentDetail {
  id: number;
  user_id: string;
  offer_id: number;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_id: string | null;
  paid_at: string | null;
  token_amount: number | null;
  token_released_at: string | null;
  refunded_at: string | null;
  risk_acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  // Manual payment fields
  cotas_reserved: number | null;
  payment_proof_url: string | null;
  proof_sent_at: string | null;
  rejection_reason: string | null;
  // Blockchain fields
  tokens_reserved: number | null;
  tokens_received: number | null;
  escrow_tx_hash: string | null;
  distribution_tx_hash: string | null;
  distribution_date: string | null;
  refund_tx_hash: string | null;
  refund_date: string | null;
  offer: {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    image_url: string | null;
    category: string;
    min_goal: number;
    max_goal: number;
    current_amount: number;
    investors_count: number;
    min_investment: number;
    start_date: string;
    end_date: string;
    valuation: string | null;
    equity_offered: string | null;
    status: string;
  };
  // Project NFT fields (1 NFT por projeto)
  project_slug: string | null;
  project_nft_uid: string | null;
  project_nft_tx_hash: string | null;
  project_nft_token_link_tx: string | null;
}

const STATUS_CONFIG = {
  pending: {
    label: "Aguardando pagamento",
    description: "Seu investimento foi registrado. Realize o pagamento e envie o comprovante.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    icon: Timer,
    iconColor: "text-amber-500"
  },
  proof_sent: {
    label: "Comprovante enviado",
    description: "Seu comprovante foi enviado e está aguardando análise pela nossa equipe.",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    icon: Clock,
    iconColor: "text-purple-500"
  },
  pending_approval: {
    label: "Aguardando aprovação",
    description: "Seu comprovante foi enviado e está sendo analisado pela nossa equipe.",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    icon: Clock,
    iconColor: "text-purple-500"
  },
  paid: {
    label: "Pagamento confirmado",
    description: "Seu pagamento foi aprovado. Aguarde o encerramento da oferta para receber seus tokens.",
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    icon: CheckCircle2,
    iconColor: "text-blue-500"
  },
  escrow_reserved: {
    label: "Reserva Confirmada",
    description: "Seus tokens foram reservados em escrow. Aguarde o encerramento da campanha para recebê-los.",
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    textColor: "text-amber-700",
    icon: Shield,
    iconColor: "text-amber-500"
  },
  distributing: {
    label: "Distribuindo Tokens",
    description: "A campanha foi encerrada com sucesso. Seus tokens estão sendo distribuídos.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    icon: RefreshCw,
    iconColor: "text-blue-500"
  },
  completed: {
    label: "NFT Emitido",
    description: "Parabéns! Seu NFT de investidor foi emitido e está disponível na sua carteira.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    icon: CheckCircle2,
    iconColor: "text-green-500"
  },
  blockchain_registered: {
    label: "Registrado na Blockchain",
    description: "Seu investimento foi registrado na blockchain. Aguarde a distribuição dos tokens.",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    icon: Shield,
    iconColor: "text-indigo-500"
  },
  token_released: {
    label: "Tokens liberados",
    description: "Parabéns! Seus tokens foram emitidos e estão disponíveis na sua carteira.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    icon: CheckCircle2,
    iconColor: "text-green-500"
  },
  refunded: {
    label: "Reembolsado",
    description: "Seu investimento foi reembolsado. O valor será devolvido em até 5 dias úteis.",
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-600",
    icon: RefreshCw,
    iconColor: "text-gray-500"
  },
  rejected: {
    label: "Pagamento rejeitado",
    description: "Seu comprovante de pagamento foi rejeitado. Verifique o motivo e envie novamente.",
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    icon: XCircle,
    iconColor: "text-red-500"
  },
  cancelled: {
    label: "Cancelado",
    description: "Este investimento foi cancelado.",
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    icon: XCircle,
    iconColor: "text-red-500"
  }
};

export default function AppInvestimentoDetalhe() {
  const { id } = useParams();
  const [investment, setInvestment] = useState<InvestmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };



  useEffect(() => {
    if (id) {
      fetchInvestment();
    }
  }, [id]);

  const fetchInvestment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/investments/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvestment(data.investment);
      } else if (res.status === 404) {
        setError("Investimento não encontrado");
      } else {
        setError("Erro ao carregar investimento");
      }
    } catch (e) {
      console.error("Error fetching investment:", e);
      setError("Erro ao carregar investimento");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr: string, full = false) => {
    const options: Intl.DateTimeFormatOptions = full
      ? { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" };
    return new Date(dateStr).toLocaleDateString("pt-BR", options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error || !investment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-navy-deep mb-2">
          {error || "Investimento não encontrado"}
        </h2>
        <p className="text-gray-500 mb-6">
          Não foi possível carregar os detalhes deste investimento.
        </p>
        <Link
          to="/app/investimentos"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos investimentos
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[investment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const offerProgress = Math.min(100, Math.round((investment.offer.current_amount / investment.offer.min_goal) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(investment.offer.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Build timeline events
  const timelineEvents = [
    {
      date: investment.created_at,
      title: "Reserva realizada",
      description: `Você reservou ${formatCurrency(investment.amount)} na oferta`,
      icon: FileText,
      color: "text-navy"
    }
  ];

  if (investment.risk_acknowledged_at) {
    timelineEvents.push({
      date: investment.risk_acknowledged_at,
      title: "Termo de ciência assinado",
      description: "Você aceitou os termos e riscos do investimento",
      icon: CheckCircle2,
      color: "text-green-500"
    });
  }

  if (investment.paid_at) {
    timelineEvents.push({
      date: investment.paid_at,
      title: "Pagamento confirmado",
      description: `Pagamento via ${investment.payment_method || "PIX"} confirmado`,
      icon: CreditCard,
      color: "text-blue-500"
    });
  }

  if (investment.token_released_at) {
    timelineEvents.push({
      date: investment.token_released_at,
      title: "Tokens emitidos",
      description: `${investment.token_amount?.toLocaleString("pt-BR")} tokens creditados na sua carteira`,
      icon: Coins,
      color: "text-gold"
    });
  }

  if (investment.refunded_at) {
    timelineEvents.push({
      date: investment.refunded_at,
      title: "Reembolso processado",
      description: "O valor do investimento foi devolvido",
      icon: RefreshCw,
      color: "text-gray-500"
    });
  }

  // Sort by date descending
  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/app/investimentos"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-navy-deep transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos investimentos
      </Link>

      {/* Status Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${statusConfig.color} p-6 text-white`}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <StatusIcon className="w-full h-full" />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <StatusIcon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{statusConfig.label}</h2>
            <p className="text-white/90">{statusConfig.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rejection Reason Alert */}
          {investment.status === "rejected" && investment.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Motivo da rejeição</h3>
                  <p className="text-red-700">{investment.rejection_reason}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Por favor, revise o motivo acima e envie um novo comprovante de pagamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Proof Section */}
          {(investment.status === "pending" || investment.status === "rejected" || investment.status === "pending_approval") && (
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h3 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold" />
                Comprovante de Pagamento
              </h3>

              {investment.payment_proof_url ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Comprovante enviado</p>
                        {investment.proof_sent_at && (
                          <p className="text-sm text-green-700">
                            Enviado em {formatDate(investment.proof_sent_at, true)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={investment.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-kate-border rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                    Ver comprovante enviado
                  </a>
                  
                  {investment.status === "rejected" && (
                    <Link
                      to={`/oferta/${investment.offer.slug}`}
                      className="block w-full text-center px-4 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
                    >
                      Enviar novo comprovante
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Timer className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="font-semibold text-navy-deep mb-2">Aguardando comprovante</h4>
                  <p className="text-gray-500 mb-4">
                    Realize o pagamento via transferência bancária e envie o comprovante para confirmar seu investimento.
                  </p>
                  <Link
                    to={`/oferta/${investment.offer.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Enviar comprovante
                  </Link>
                </div>
              )}

              {investment.status === "pending_approval" && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    <div>
                      <p className="font-medium text-purple-900">Em análise</p>
                      <p className="text-sm text-purple-700">
                        Nossa equipe está verificando seu comprovante. Você receberá uma notificação assim que for aprovado.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Offer Card */}
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
                <img
                  src={investment.offer.image_url || "https://images.unsplash.com/photo-1560472355-536de3962603?w=400"}
                  alt={investment.offer.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-navy-deep text-xs font-semibold rounded-lg">
                  {investment.offer.category}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 p-5">
                <Link
                  to={`/oferta/${investment.offer.slug}`}
                  className="text-xl font-bold text-navy-deep hover:text-gold-hover transition-colors"
                >
                  {investment.offer.title}
                </Link>
                <p className="text-gray-500 text-sm mt-1 mb-4 line-clamp-2">
                  {investment.offer.short_description}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">Captado</span>
                    <span className="font-semibold text-navy-deep">{offerProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold-hover rounded-full transition-all duration-500"
                      style={{ width: `${offerProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-navy-deep font-semibold">
                      {formatCurrency(investment.offer.current_amount)}
                    </span>
                    <span className="text-gray-500">
                      Meta: {formatCurrency(investment.offer.min_goal)}
                    </span>
                  </div>
                </div>

                {/* Offer stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Investidores</p>
                      <p className="text-sm font-semibold text-navy-deep">{investment.offer.investors_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Dias restantes</p>
                      <p className="text-sm font-semibold text-navy-deep">{daysLeft > 0 ? daysLeft : "Encerrada"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <Target className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Mín. invest.</p>
                      <p className="text-sm font-semibold text-navy-deep">{formatCurrency(investment.offer.min_investment)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <h3 className="text-lg font-bold text-navy-deep mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              Histórico do investimento
            </h3>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />

              <div className="space-y-6">
                {timelineEvents.map((event, index) => {
                  const EventIcon = event.icon;
                  return (
                    <div key={index} className="relative flex gap-4">
                      {/* Icon */}
                      <div className="relative z-10 w-10 h-10 bg-white border-2 border-kate-border rounded-xl flex items-center justify-center flex-shrink-0">
                        <EventIcon className={`w-5 h-5 ${event.color}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-navy-deep">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(event.date, true)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Blockchain Section */}
          {(investment.project_nft_uid || investment.tokens_reserved) && (
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h3 className="text-lg font-bold text-navy-deep mb-5 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-gold" />
                Informações Blockchain
              </h3>

              {/* Security Notice */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Registrado na Hathor Network</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Seu investimento está protegido e registrado de forma imutável na blockchain.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Project NFT */}
                {investment.project_nft_uid && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-purple-900">NFT do Projeto</p>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg">
                        {investment.project_nft_token_link_tx ? "Vinculado ao Token" : "Emitido"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white/50 px-3 py-2 rounded-lg font-mono text-gray-700 truncate">
                        {investment.project_nft_uid}
                      </code>
                      <button
                        onClick={() => copyToClipboard(investment.project_nft_uid!)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedText === investment.project_nft_uid ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      {investment.project_nft_tx_hash && (
                        <a
                          href={`https://explorer.hathor.network/transaction/${investment.project_nft_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          title="Ver na blockchain"
                        >
                          <ExternalLink className="w-4 h-4 text-purple-600" />
                        </a>
                      )}
                    </div>
                    {investment.project_slug && (
                      <Link
                        to={`/verificacao/${investment.project_slug}`}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Ver página de verificação
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Tokens Reserved/Received */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {investment.tokens_reserved && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-900">Tokens Reservados</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">
                        {investment.tokens_reserved?.toLocaleString("pt-BR") || "0"}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Aguardando distribuição
                      </p>
                    </div>
                  )}
                  
                  {investment.tokens_received && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-900">Tokens Recebidos</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {investment.tokens_received?.toLocaleString("pt-BR") || "0"}
                      </p>
                      {investment.distribution_date && (
                        <p className="text-xs text-green-600 mt-1">
                          Distribuídos em {formatDate(investment.distribution_date)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Link to Wallet */}
                {(investment.tokens_reserved || investment.tokens_received) && (
                  <div className="pt-2">
                    <Link
                      to="/app/carteira"
                      className="inline-flex items-center gap-2 text-sm font-medium text-gold-hover hover:text-gold transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Ver na minha carteira
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {/* Transaction Hashes */}
                {(investment.escrow_tx_hash || investment.distribution_tx_hash || investment.refund_tx_hash) && (
                  <div className="border-t border-kate-border pt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Transações na Blockchain</p>
                    
                    {investment.escrow_tx_hash && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Escrow TX</p>
                          <code className="text-xs font-mono text-gray-700">
                            {investment.escrow_tx_hash.slice(0, 12)}...{investment.escrow_tx_hash.slice(-8)}
                          </code>
                        </div>
                        <a
                          href={`https://explorer.hathor.network/transaction/${investment.escrow_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold-hover hover:underline flex items-center gap-1"
                        >
                          Verificar <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    
                    {investment.distribution_tx_hash && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-xs text-green-600">Distribuição TX</p>
                          <code className="text-xs font-mono text-green-700">
                            {investment.distribution_tx_hash.slice(0, 12)}...{investment.distribution_tx_hash.slice(-8)}
                          </code>
                        </div>
                        <a
                          href={`https://explorer.hathor.network/transaction/${investment.distribution_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline flex items-center gap-1"
                        >
                          Verificar <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    
                    {investment.refund_tx_hash && (
                      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Reembolso TX</p>
                          <code className="text-xs font-mono text-gray-700">
                            {investment.refund_tx_hash.slice(0, 12)}...{investment.refund_tx_hash.slice(-8)}
                          </code>
                        </div>
                        <a
                          href={`https://explorer.hathor.network/transaction/${investment.refund_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-600 hover:underline flex items-center gap-1"
                        >
                          Verificar <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seção removida - NFT agora é por projeto, não por investidor */}
          {false && (
            <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Prova Blockchain</h3>
                    <p className="text-white/80 text-sm">Recibo de Investimento #{investment.nft_data.investment.id}</p>
                  </div>
                </div>
                <p className="text-white/70 text-xs mt-3">
                  Versão {investment.nft_data.version} • Tipo: {investment.nft_data.type}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Investment & Project Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investment Details */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Dados do Investimento
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Valor</span>
                        <span className="font-semibold text-blue-900">
                          {investment.nft_data.investment.amount_brl?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Tokens Reservados</span>
                        <span className="font-semibold text-blue-900">
                          {investment.nft_data.investment.tokens_reserved?.toLocaleString("pt-BR") || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Data</span>
                        <span className="font-medium text-blue-900">
                          {new Date(investment.nft_data.investment.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Dados do Projeto
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-600">Nome</span>
                        <span className="font-semibold text-emerald-900 truncate ml-2">
                          {investment.nft_data.project.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-600">Token</span>
                        <span className="font-semibold text-emerald-900">
                          {investment.nft_data.project.token_symbol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-600">Token UID</span>
                        <code className="text-xs font-mono text-emerald-900 truncate ml-2 max-w-[120px]">
                          {investment.nft_data.project.token_uid?.slice(0, 12)}...
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investor Info */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" />
                    Dados do Investidor
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-amber-600">Nome</span>
                      <p className="font-semibold text-amber-900">{investment.nft_data.investor.name}</p>
                    </div>
                    {investment.nft_data.investor.address && (
                      <div>
                        <span className="text-amber-600">Endereço Hathor</span>
                        <p className="font-mono text-xs text-amber-900 truncate">
                          {investment.nft_data.investor.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents with Verification */}
                {investment.nft_data.documents.length > 0 && (
                  <div className="border border-kate-border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-kate-border">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-gray-600" />
                        Documentos Registrados
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Hashes SHA-256 dos documentos registrados na blockchain
                      </p>
                    </div>
                    <div className="divide-y divide-kate-border">
                      {investment.nft_data.documents.map((doc) => {
                        const result = verificationResults[doc.type];
                        const isVerifying = verifyingDoc === doc.type;
                        
                        return (
                          <div key={doc.type} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{doc.name}</span>
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                    {doc.type}
                                  </span>
                                </div>
                                
                                {doc.hash && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Hash className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">Hash SHA-256</span>
                                    </div>
                                    <code className="text-xs font-mono text-gray-700 break-all">
                                      {doc.hash}
                                    </code>
                                  </div>
                                )}
                                
                                {result && (
                                  <div className={`mt-2 p-2 rounded-lg ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                      {result.valid ? (
                                        <>
                                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-medium text-green-900">
                                            Documento verificado com sucesso!
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-4 h-4 text-red-600" />
                                          <span className="text-sm font-medium text-red-900">
                                            Hash não corresponde!
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                                      Hash calculado: {result.computedHash}
                                    </p>
                                  </div>
                                )}
                                
                                {doc.uploaded_at && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    Enviado em {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                {doc.url && doc.hash && (
                                  <button
                                    onClick={() => verifyDocument(doc)}
                                    disabled={isVerifying}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    {isVerifying ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Verificando...
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="w-3 h-3" />
                                        Verificar
                                      </>
                                    )}
                                  </button>
                                )}
                                {doc.url && (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    Baixar
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Termos e Condições
                  </h4>
                  <div className="space-y-3 text-sm">
                    <p className="text-slate-700">{investment.nft_data.terms.condition}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 text-xs">Meta Mínima</span>
                        <p className="font-semibold text-slate-900">
                          {investment.nft_data.terms.minimum_goal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Meta Máxima</span>
                        <p className="font-semibold text-slate-900">
                          {investment.nft_data.terms.maximum_goal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"}
                        </p>
                      </div>
                    </div>
                    {investment.nft_data.terms.deadline && (
                      <div>
                        <span className="text-slate-500 text-xs">Prazo</span>
                        <p className="font-medium text-slate-900">
                          {new Date(investment.nft_data.terms.deadline).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-xs">Política de Reembolso</span>
                      <p className="text-slate-800 mt-1">{investment.nft_data.terms.refund_policy}</p>
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-violet-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Conformidade Regulatória
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-violet-600 text-xs">Plataforma</span>
                      <p className="font-semibold text-violet-900">{investment.nft_data.compliance.platform}</p>
                    </div>
                    <div>
                      <span className="text-violet-600 text-xs">Framework</span>
                      <p className="font-semibold text-violet-900">{investment.nft_data.compliance.regulatory_framework}</p>
                    </div>
                    <div>
                      <span className="text-violet-600 text-xs">KYC Investidor</span>
                      <p className={`font-semibold ${investment.nft_data.compliance.investor_kyc_verified ? 'text-green-600' : 'text-amber-600'}`}>
                        {investment.nft_data.compliance.investor_kyc_verified ? 'Verificado' : 'Pendente'}
                      </p>
                    </div>
                    {investment.nft_data.compliance.project_approved_at && (
                      <div>
                        <span className="text-violet-600 text-xs">Projeto Aprovado</span>
                        <p className="font-medium text-violet-900">
                          {new Date(investment.nft_data.compliance.project_approved_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offer Details */}
          {(investment.offer.valuation || investment.offer.equity_offered) && (
            <div className="bg-white rounded-2xl border border-kate-border p-6">
              <h3 className="text-lg font-bold text-navy-deep mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                Detalhes da oferta
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {investment.offer.valuation && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Valuation</p>
                    <p className="text-lg font-bold text-navy-deep">{investment.offer.valuation}</p>
                  </div>
                )}
                {investment.offer.equity_offered && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Equity oferecido</p>
                    <p className="text-lg font-bold text-navy-deep">{investment.offer.equity_offered}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Investment Summary */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <h3 className="text-lg font-bold text-navy-deep mb-4">Resumo do investimento</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-kate-border">
                <span className="text-gray-500">Valor investido</span>
                <span className="text-xl font-bold text-navy-deep">{formatCurrency(investment.amount)}</span>
              </div>

              {investment.token_amount && (
                <div className="flex justify-between items-center py-3 border-b border-kate-border">
                  <span className="text-gray-500">Tokens recebidos</span>
                  <span className="text-lg font-bold text-gold">{investment.token_amount?.toLocaleString("pt-BR") || "0"}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-b border-kate-border">
                <span className="text-gray-500">Data da reserva</span>
                <span className="font-medium text-navy-deep">{formatDate(investment.created_at)}</span>
              </div>

              {investment.payment_method && (
                <div className="flex justify-between items-center py-3 border-b border-kate-border">
                  <span className="text-gray-500">Método de pagamento</span>
                  <span className="font-medium text-navy-deep">{investment.payment_method}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500">ID do investimento</span>
                <span className="font-mono text-sm text-gray-400">#{investment.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <h3 className="text-lg font-bold text-navy-deep mb-4">Ações rápidas</h3>

            <div className="space-y-3">
              {investment.status === "pending" && (
                <button className="w-full flex items-center justify-between px-4 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar agora</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {investment.status === "token_released" && (
                <Link
                  to="/app/carteira"
                  className="w-full flex items-center justify-between px-4 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5" />
                    <span>Ver na carteira</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}

              <Link
                to={`/oferta/${investment.offer.slug}`}
                className="w-full flex items-center justify-between px-4 py-3 border border-kate-border hover:bg-gray-50 text-navy-deep rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  <span>Ver página da oferta</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              {investment.project_slug && investment.project_nft_uid && (
                <Link
                  to={`/app/verificacao/${investment.project_slug}`}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 text-indigo-900 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">Ver verificação do projeto</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-indigo-400" />
                </Link>
              )}

              <Link
                to="/app/mensagens"
                className="w-full flex items-center justify-between px-4 py-3 border border-kate-border hover:bg-gray-50 text-navy-deep rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span>Falar com suporte</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-br from-navy-deep to-navy p-6 rounded-2xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h4 className="font-semibold">Precisa de ajuda?</h4>
            </div>
            <p className="text-white/80 text-sm mb-4">
              Nossa equipe está disponível para tirar suas dúvidas sobre seu investimento.
            </p>
            <Link
              to="/app/mensagens"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-lg transition-colors text-sm"
            >
              Enviar mensagem
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
