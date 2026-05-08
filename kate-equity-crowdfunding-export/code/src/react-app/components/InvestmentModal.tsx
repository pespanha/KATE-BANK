import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  FileText,
  BadgeCheck,
  Copy,
  Check,
  Upload,
  Building2,
  MessageCircle,
  ExternalLink
} from "lucide-react";

interface Offer {
  id: number;
  project_id: number;
  title: string;
  min_investment: number;
  max_goal: number;
  current_amount: number;
  equity_offered: string | null;
  valuation: string | null;
  end_date: string;
  // Tokenization fields
  token_symbol?: string;
  total_tokens?: number;
}

interface BankConfig {
  pix_key: string;
  bank_name: string;
  bank_agency: string;
  bank_account: string;
  bank_account_holder: string;
  bank_cnpj: string;
  payment_whatsapp: string;
}

interface InvestmentModalProps {
  offer: Offer;
  isOpen: boolean;
  onClose: () => void;
}

interface PixPayment {
  id: number;
  pix_code: string;
  qr_code_url: string;
  amount: number;
  expires_at: string;
  status: string;
  paid_at?: string;
}

type Step = "amount" | "risks" | "confirm" | "bank_payment" | "success";

const RISK_ITEMS = [
  "Investir em startups e empresas em crescimento envolve riscos significativos, incluindo a possibilidade de perda total do capital investido.",
  "Não há garantia de retorno sobre o investimento. A empresa pode não atingir suas metas ou pode falir.",
  "Os tokens recebidos podem não ter liquidez. Pode não haver mercado secundário para revenda.",
  "Futuras rodadas de investimento podem diluir sua participação na empresa.",
  "O prazo para retorno do investimento é incerto e pode levar anos.",
  "Você deve investir apenas o que pode perder sem afetar sua situação financeira."
];

export default function InvestmentModal({ offer, isOpen, onClose }: InvestmentModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(offer.min_investment);
  const [riskChecks, setRiskChecks] = useState<boolean[]>(new Array(RISK_ITEMS.length).fill(false));
  const [generalRiskAck, setGeneralRiskAck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investmentId, setInvestmentId] = useState<number | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  // State for PIX flow (kept for interface compatibility)
  const [, ] = useState(false); // checkingStatus removed
  const [, ] = useState<string>(""); // timeLeft removed
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);

  // Fetch bank config on mount
  useEffect(() => {
    const fetchBankConfig = async () => {
      try {
        const res = await fetch("/api/platform/bank-config");
        if (res.ok) {
          const data = await res.json();
          setBankConfig(data.config);
        }
      } catch (e) {
        console.error("Error fetching bank config:", e);
      }
    };
    fetchBankConfig();
  }, []);

  // PIX payment timer removed - now using bank transfer flow

  // Check payment status periodically
  useEffect(() => {
    if (step !== "bank_payment" || !investmentId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/investments/${investmentId}/pix`);
        if (res.ok) {
          const data = await res.json();
          if (data.investment_status === "paid" || data.pix_payment.status === "paid") {
            setStep("success");
          } else if (data.pix_payment.status === "expired") {
            setPixPayment(prev => prev ? { ...prev, status: "expired" } : null);
          }
        }
      } catch (e) {
        console.error("Error checking payment status:", e);
      }
    };

    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [step, investmentId, pixPayment?.status]);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const availableToInvest = offer.max_goal - offer.current_amount;
  const maxAmount = Math.min(availableToInvest, 1000000);

  const handleAmountChange = (delta: number) => {
    const newAmount = amount + delta;
    if (newAmount >= offer.min_investment && newAmount <= maxAmount) {
      setAmount(newAmount);
    }
  };

  const handleCustomAmount = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ""));
    if (!isNaN(numValue)) {
      setAmount(Math.max(offer.min_investment, Math.min(numValue, maxAmount)));
    }
  };

  const allRisksAcknowledged = riskChecks.every(Boolean) && generalRiskAck;

  const allTermsAccepted = termsAccepted && privacyAccepted && riskAccepted;

  const handleSubmitInvestment = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Save terms acceptance to user profile
      await fetch("/api/user-profile/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          terms: termsAccepted,
          privacy: privacyAccepted,
          risk: riskAccepted
        })
      });

      // Create investment reservation with pending_payment status
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          offer_id: offer.id,
          amount,
          cotas_reserved: Math.floor(amount / 1000)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao processar investimento");
        return;
      }

      setInvestmentId(data.investment_id);
      setStep("bank_payment");
    } catch (e) {
      console.error("Error submitting investment:", e);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProof = async (file: File) => {
    if (!investmentId) return;
    setUploadingProof(true);
    setError(null);

    try {
      // Get presigned URL for upload
      const urlRes = await fetch(`/api/investments/${investmentId}/upload-proof-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          filename: file.name,
          content_type: file.type 
        })
      });

      if (!urlRes.ok) {
        const data = await urlRes.json();
        setError(data.error || "Erro ao preparar upload");
        return;
      }

      const { upload_url, file_url } = await urlRes.json();

      // Upload file
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!uploadRes.ok) {
        setError("Erro ao fazer upload do arquivo");
        return;
      }

      // Save proof URL to investment
      const saveRes = await fetch(`/api/investments/${investmentId}/save-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ proof_url: file_url })
      });

      if (!saveRes.ok) {
        setError("Erro ao salvar comprovante");
        return;
      }

      setProofUploaded(true);
    } catch (e) {
      console.error("Error uploading proof:", e);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleMarkProofSent = async () => {
    if (!investmentId) return;
    setIsConfirmingPayment(true);
    setError(null);

    try {
      const res = await fetch(`/api/investments/${investmentId}/proof-sent`, {
        method: "POST",
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao atualizar status");
        return;
      }

      setStep("success");
    } catch (e) {
      console.error("Error marking proof sent:", e);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // PIX flow functions removed - using manual bank transfer flow

  const handleClose = () => {
    setStep("amount");
    setAmount(offer.min_investment);
    setRiskChecks(new Array(RISK_ITEMS.length).fill(false));
    setGeneralRiskAck(false);
    setError(null);
    setInvestmentId(null);
    setPixPayment(null);
    setCopied(false);
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setRiskAccepted(false);
    onClose();
  };

  const handleGoToDashboard = () => {
    handleClose();
    navigate("/app/investimentos");
  };

  const getStepNumber = (s: Step) => {
    const steps = ["amount", "risks", "confirm", "bank_payment"];
    return steps.indexOf(s);
  };

  // Calculate cotas and tokens
  const cotasReserved = Math.floor(amount / 1000);
  const tokensReserved = offer.total_tokens ? Math.floor((amount / offer.max_goal) * offer.total_tokens) : cotasReserved;
  const equityPercent = offer.equity_offered 
    ? (parseFloat(offer.equity_offered.replace('%', '').replace(',', '.')) * (amount / offer.max_goal)).toFixed(4)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step !== "success" && step !== "bank_payment" ? handleClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-kate-border bg-gradient-to-r from-navy-deep via-navy to-navy-deep">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
              {step === "bank_payment" ? (
                <Building2 className="w-5 h-5 text-gold" />
              ) : (
                <TrendingUp className="w-5 h-5 text-gold" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {step === "bank_payment" ? "Pagamento" : "Investir"}
              </h2>
              <p className="text-sm text-white/70 truncate max-w-[200px]">{offer.title}</p>
            </div>
          </div>
          {step !== "success" && step !== "bank_payment" && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {step !== "success" && (
          <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-kate-border">
            {["amount", "risks", "confirm", "bank_payment"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s ? "bg-gold text-navy-deep" :
                  getStepNumber(step) > i ? "bg-green-500 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {getStepNumber(step) > i ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : i + 1}
                </div>
                {i < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 ${
                    getStepNumber(step) > i ? "bg-green-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "amount" && (
            <StepAmount
              amount={amount}
              minInvestment={offer.min_investment}
              maxAmount={maxAmount}
              equity={offer.equity_offered}
              valuation={offer.valuation}
              onAmountChange={handleAmountChange}
              onCustomAmount={handleCustomAmount}
              formatCurrency={formatCurrency}
              cotasReserved={cotasReserved}
              tokensReserved={tokensReserved}
              tokenSymbol={offer.token_symbol}
              equityPercent={equityPercent}
            />
          )}
          
          {step === "risks" && (
            <StepRisks
              riskChecks={riskChecks}
              setRiskChecks={setRiskChecks}
              generalRiskAck={generalRiskAck}
              setGeneralRiskAck={setGeneralRiskAck}
            />
          )}
          
          {step === "confirm" && (
            <StepConfirm
              offer={offer}
              amount={amount}
              formatCurrency={formatCurrency}
              error={error}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              privacyAccepted={privacyAccepted}
              setPrivacyAccepted={setPrivacyAccepted}
              riskAccepted={riskAccepted}
              setRiskAccepted={setRiskAccepted}
            />
          )}

          {step === "bank_payment" && bankConfig && (
            <StepBankPayment
              bankConfig={bankConfig}
              amount={amount}
              investmentId={investmentId}
              offerTitle={offer.title}
              formatCurrency={formatCurrency}
              copied={copied}
              setCopied={setCopied}
              error={error}
              onUploadProof={handleUploadProof}
              uploadingProof={uploadingProof}
              proofUploaded={proofUploaded}
            />
          )}
          
          {step === "success" && (
            <StepSuccess
              amount={amount}
              offerTitle={offer.title}
              formatCurrency={formatCurrency}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-kate-border bg-gray-50">
          {step === "amount" && (
            <button
              onClick={() => setStep("risks")}
              className="w-full py-3.5 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Continuar
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          
          {step === "risks" && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep("amount")}
                className="px-6 py-3.5 border border-kate-border text-navy-deep font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!allRisksAcknowledged}
                className="flex-1 py-3.5 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {step === "confirm" && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep("risks")}
                disabled={isSubmitting}
                className="px-6 py-3.5 border border-kate-border text-navy-deep font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
              <button
                onClick={handleSubmitInvestment}
                disabled={isSubmitting || !allTermsAccepted}
                className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-5 h-5" />
                    Confirmar e Pagar
                  </>
                )}
              </button>
            </div>
          )}

          {step === "bank_payment" && (
            <div className="space-y-3">
              <button
                onClick={handleMarkProofSent}
                disabled={isConfirmingPayment}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isConfirmingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Já enviei o comprovante
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3 text-gray-600 hover:text-navy-deep font-medium transition-colors text-sm"
              >
                Pagar depois
              </button>
            </div>
          )}
          
          {step === "success" && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3.5 border border-kate-border text-navy-deep font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                Voltar à oferta
              </button>
              <button
                onClick={handleGoToDashboard}
                className="flex-1 py-3.5 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-colors"
              >
                Ver meus investimentos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepAmount({
  amount,
  minInvestment,
  maxAmount,
  equity,
  valuation,
  onAmountChange,
  onCustomAmount,
  formatCurrency,
  cotasReserved,
  tokensReserved,
  tokenSymbol,
  equityPercent
}: {
  amount: number;
  minInvestment: number;
  maxAmount: number;
  equity: string | null;
  valuation: string | null;
  onAmountChange: (delta: number) => void;
  onCustomAmount: (value: string) => void;
  formatCurrency: (v: number) => string;
  cotasReserved: number;
  tokensReserved: number;
  tokenSymbol?: string;
  equityPercent: string | null;
}) {
  const presetAmounts = [1000, 2000, 5000, 10000, 25000, 50000].filter(
    a => a >= minInvestment && a <= maxAmount
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Valor do investimento</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onAmountChange(-1000)}
            disabled={amount <= minInvestment}
            className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Minus className="w-5 h-5 text-navy-deep" />
          </button>
          <div className="relative">
            <input
              type="text"
              value={formatCurrency(amount)}
              onChange={(e) => onCustomAmount(e.target.value)}
              className="text-4xl font-bold text-navy-deep text-center bg-transparent w-56 focus:outline-none"
            />
          </div>
          <button
            onClick={() => onAmountChange(1000)}
            disabled={amount >= maxAmount}
            className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5 text-navy-deep" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Mínimo: {formatCurrency(minInvestment)} • Múltiplos de R$ 1.000
        </p>
      </div>

      {/* Preset amounts */}
      <div className="grid grid-cols-3 gap-2">
        {presetAmounts.slice(0, 6).map(preset => (
          <button
            key={preset}
            onClick={() => onCustomAmount(preset.toString())}
            className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
              amount === preset
                ? "bg-gold text-navy-deep"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {formatCurrency(preset)}
          </button>
        ))}
      </div>

      {/* Cotas & Tokens Calculation */}
      <div className="bg-gradient-to-br from-navy/5 to-navy/10 rounded-xl p-4 border border-navy/20">
        <h4 className="text-sm font-semibold text-navy-deep mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          Seu investimento
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-navy-deep">{cotasReserved}</div>
            <div className="text-xs text-gray-500">Cotas</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gold">{tokensReserved.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              Tokens {tokenSymbol ? `(${tokenSymbol})` : ''}
            </div>
          </div>
        </div>
        {equityPercent && (
          <div className="mt-3 pt-3 border-t border-navy/10 flex justify-between items-center">
            <span className="text-sm text-gray-600">Sua participação estimada</span>
            <span className="font-bold text-navy-deep">{equityPercent}%</span>
          </div>
        )}
      </div>

      {/* Investment details */}
      {(equity || valuation) && (
        <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-4 border border-gold/20">
          <h4 className="text-sm font-semibold text-navy-deep mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            Detalhes da rodada
          </h4>
          <div className="space-y-2 text-sm">
            {equity && (
              <div className="flex justify-between">
                <span className="text-gray-600">Equity total oferecido</span>
                <span className="font-medium text-navy-deep">{equity}</span>
              </div>
            )}
            {valuation && (
              <div className="flex justify-between">
                <span className="text-gray-600">Valuation</span>
                <span className="font-medium text-navy-deep">{valuation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Pagamento via transferência bancária. Após aceitar os riscos, você receberá os dados para pagamento.
        </p>
      </div>
    </div>
  );
}

function StepRisks({
  riskChecks,
  setRiskChecks,
  generalRiskAck,
  setGeneralRiskAck
}: {
  riskChecks: boolean[];
  setRiskChecks: (checks: boolean[]) => void;
  generalRiskAck: boolean;
  setGeneralRiskAck: (ack: boolean) => void;
}) {
  const toggleRisk = (index: number) => {
    const newChecks = [...riskChecks];
    newChecks[index] = !newChecks[index];
    setRiskChecks(newChecks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800 mb-1">Ciência de Riscos Obrigatória</h4>
          <p className="text-sm text-amber-700">
            Para prosseguir, você deve ler e confirmar que compreende cada um dos riscos abaixo.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {RISK_ITEMS.map((risk, index) => (
          <label
            key={index}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
              riskChecks[index]
                ? "bg-green-50 border-green-200"
                : "bg-white border-kate-border hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              checked={riskChecks[index]}
              onChange={() => toggleRisk(index)}
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className={`text-sm ${riskChecks[index] ? "text-green-800" : "text-gray-600"}`}>
              {risk}
            </span>
          </label>
        ))}
      </div>

      <div className="pt-4 border-t border-kate-border">
        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
          generalRiskAck
            ? "bg-navy-deep border-navy"
            : "bg-white border-kate-border hover:border-gray-300"
        }`}>
          <input
            type="checkbox"
            checked={generalRiskAck}
            onChange={(e) => setGeneralRiskAck(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-navy-deep focus:ring-navy"
          />
          <span className={`text-sm font-medium ${generalRiskAck ? "text-white" : "text-navy-deep"}`}>
            Declaro que li, compreendi e aceito todos os riscos envolvidos neste investimento conforme a Resolução CVM 88.
          </span>
        </label>
      </div>
    </div>
  );
}

function StepConfirm({
  offer,
  amount,
  formatCurrency,
  error,
  termsAccepted,
  setTermsAccepted,
  privacyAccepted,
  setPrivacyAccepted,
  riskAccepted,
  setRiskAccepted
}: {
  offer: Offer;
  amount: number;
  formatCurrency: (v: number) => string;
  error: string | null;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  privacyAccepted: boolean;
  setPrivacyAccepted: (v: boolean) => void;
  riskAccepted: boolean;
  setRiskAccepted: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-navy-deep mb-2">Confirme sua reserva</h3>
        <p className="text-gray-500">Revise os detalhes antes de prosseguir para o pagamento</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-kate-border">
          <span className="text-gray-600">Oportunidade</span>
          <span className="font-medium text-navy-deep text-right max-w-[200px] truncate">{offer.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Valor do investimento</span>
          <span className="text-xl font-bold text-navy-deep">{formatCurrency(amount)}</span>
        </div>
        {offer.equity_offered && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Equity da rodada</span>
            <span className="font-medium text-navy-deep">{offer.equity_offered}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-4 border-t border-kate-border">
          <span className="text-gray-600">Forma de pagamento</span>
          <span className="font-medium text-navy-deep flex items-center gap-2">
            <Building2 className="w-4 h-4 text-green-600" />
            PIX
          </span>
        </div>
      </div>

      {/* Terms Acceptance */}
      <div className="space-y-3">
        <h4 className="font-semibold text-navy-deep text-sm">Aceite obrigatório</h4>
        
        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
          termsAccepted ? "bg-green-50 border-green-200" : "bg-white border-kate-border hover:border-gray-300"
        }`}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Li e aceito os{" "}
            <a href="/termos" target="_blank" className="text-gold-hover hover:underline font-medium">
              Termos de Uso
            </a>
          </span>
        </label>

        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
          privacyAccepted ? "bg-green-50 border-green-200" : "bg-white border-kate-border hover:border-gray-300"
        }`}>
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Li e aceito a{" "}
            <a href="/privacidade" target="_blank" className="text-gold-hover hover:underline font-medium">
              Política de Privacidade
            </a>
          </span>
        </label>

        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
          riskAccepted ? "bg-green-50 border-green-200" : "bg-white border-kate-border hover:border-gray-300"
        }`}>
          <input
            type="checkbox"
            checked={riskAccepted}
            onChange={(e) => setRiskAccepted(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Li e compreendo o{" "}
            <a href="/riscos" target="_blank" className="text-gold-hover hover:underline font-medium">
              Aviso de Riscos
            </a>{" "}
            conforme CVM 88
          </span>
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Próximo passo:</p>
          <p className="text-blue-700">
            Ao confirmar, você receberá os dados para pagamento via PIX.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepBankPayment({
  bankConfig,
  amount,
  investmentId,
  offerTitle,
  formatCurrency,
  copied,
  setCopied,
  error,
  onUploadProof,
  uploadingProof,
  proofUploaded
}: {
  bankConfig: BankConfig;
  amount: number;
  investmentId: number | null;
  offerTitle: string;
  formatCurrency: (v: number) => string;
  copied: boolean;
  setCopied: (v: boolean) => void;
  error: string | null;
  onUploadProof: (file: File) => void;
  uploadingProof: boolean;
  proofUploaded: boolean;
}) {
  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(bankConfig.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadProof(file);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá! Realizei o investimento #${investmentId} na oferta "${offerTitle}" no valor de ${formatCurrency(amount)}. Segue o comprovante.`
  );
  const whatsappUrl = `https://wa.me/${bankConfig.payment_whatsapp?.replace(/\D/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="space-y-5">
      {/* Amount header */}
      <div className="text-center pb-4 border-b border-kate-border">
        <p className="text-sm text-gray-500 mb-1">Valor a transferir</p>
        <p className="text-3xl font-bold text-navy-deep">{formatCurrency(amount)}</p>
        <p className="text-xs text-gray-400 mt-1">Reserva #{investmentId}</p>
      </div>

      {/* Bank Details */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-navy-deep flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-gold" />
          Dados para transferência
        </h4>
        
        {/* PIX Key with copy */}
        <div className="bg-white rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-500">Chave PIX</div>
              <div className="font-mono text-sm text-navy-deep break-all">{bankConfig.pix_key}</div>
            </div>
            <button
              onClick={handleCopyPix}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Other bank details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500">Banco</div>
            <div className="font-medium text-navy-deep">{bankConfig.bank_name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Agência</div>
            <div className="font-medium text-navy-deep">{bankConfig.bank_agency}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Conta</div>
            <div className="font-medium text-navy-deep">{bankConfig.bank_account}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">CNPJ</div>
            <div className="font-medium text-navy-deep">{bankConfig.bank_cnpj}</div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">Favorecido</div>
          <div className="font-medium text-navy-deep">{bankConfig.bank_account_holder}</div>
        </div>
      </div>

      {/* Upload Proof */}
      <div className="bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl p-4 border border-gold/20">
        <h4 className="font-semibold text-navy-deep flex items-center gap-2 text-sm mb-3">
          <Upload className="w-4 h-4 text-gold" />
          Enviar comprovante
        </h4>
        
        {proofUploaded ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Comprovante enviado!</span>
          </div>
        ) : (
          <label className="block">
            <div className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gold/40 rounded-xl bg-white hover:bg-gold/5 transition-colors cursor-pointer">
              {uploadingProof ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Upload className="w-5 h-5" />
                  <span>Clique para enviar arquivo</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploadingProof}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* WhatsApp Link */}
      {bankConfig.payment_whatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Enviar comprovante pelo WhatsApp
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2 text-sm">Próximos passos:</h4>
        <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
          <li>Faça a transferência via PIX ou TED</li>
          <li>Envie o comprovante acima ou via WhatsApp</li>
          <li>Aguarde a confirmação do administrador</li>
          <li>Receba seus tokens após aprovação</li>
        </ol>
      </div>
    </div>
  );
}

function StepSuccess({
  amount,
  offerTitle,
  formatCurrency
}: {
  amount: number;
  offerTitle: string;
  formatCurrency: (v: number) => string;
}) {
  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      
      <h3 className="text-2xl font-bold text-navy-deep mb-2">Pagamento confirmado!</h3>
      <p className="text-gray-500 mb-6">
        Seu investimento foi registrado com sucesso.
      </p>

      <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-6 mb-6 border border-gold/20">
        <div className="text-sm text-gray-600 mb-1">Valor investido</div>
        <div className="text-3xl font-bold text-navy-deep mb-3">{formatCurrency(amount)}</div>
        <div className="text-sm text-gray-600">em</div>
        <div className="font-medium text-navy-deep">{offerTitle}</div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-left">
        <h4 className="font-semibold text-blue-800 mb-2">O que acontece agora?</h4>
        <ul className="text-sm text-blue-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            Seu investimento está confirmado e registrado
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            Ao final da captação, você receberá seus tokens
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            Acompanhe o status em "Meus Investimentos"
          </li>
        </ul>
      </div>
    </div>
  );
}
