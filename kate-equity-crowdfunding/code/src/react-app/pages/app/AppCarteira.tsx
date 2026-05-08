import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Loader2,
  Wallet,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowDownRight,
  Clock,
  PieChart,
  Shield,
  ChevronRight,
  Info,
  FileText,
  AlertCircle,
  Coins
} from "lucide-react";
import { InvestmentCard, type InvestmentAsset } from "@/react-app/components/InvestmentCards";

const HATHOR_EXPLORER_URL = "https://explorer.hathor.network";

// Using InvestmentAsset from InvestmentCards component
type Asset = InvestmentAsset;

interface WalletSummary {
  total_tokens: number;
  total_tokens_received: number;
  total_invested: number;
  assets_count: number;
  pending_tokens: number;
  pending_approval_count: number;
}

interface Transaction {
  id: string;
  type: "nft_created" | "tokens_distributed" | "refunded";
  offer_title: string;
  project_name: string;
  token_symbol: string | null;
  tokens_reserved?: number;
  tokens_received?: number;
  amount?: number;
  cotas?: number;
  tx_hash: string | null;
  date: string;
}

export default function AppCarteira() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hathorAddress, setHathorAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletData();
    // Polling every 30 seconds to check for updates
    const interval = setInterval(fetchWalletData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await fetch("/api/user/wallet", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setSummary(data.summary || null);
        setTransactions(data.transactions || []);
        setHathorAddress(data.hathor_address || null);
      }
    } catch (e) {
      console.error("Error fetching wallet data:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const truncateAddress = (addr: string, chars: number = 8) => {
    if (addr.length <= chars * 2) return addr;
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-deep">Carteira</h1>
          <p className="text-gray-500 mt-1">
            Seus tokens e ativos digitais
          </p>
        </div>
        <Link
          to="/app/oportunidades"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Investir mais
        </Link>
      </div>

      {/* Hathor Address Card */}
      {hathorAddress && (
        <div className="bg-gradient-to-r from-navy to-navy-deep rounded-2xl p-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-white/70">Seu Endereço Hathor</p>
                <p className="font-mono text-sm sm:text-base">{truncateAddress(hathorAddress, 12)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(hathorAddress)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                {copiedText === hathorAddress ? (
                  <><Check className="w-4 h-4 text-green-400" /> Copiado</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar</>
                )}
              </button>
              <a
                href={`${HATHOR_EXPLORER_URL}/address/${hathorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" /> Explorer
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-5 border border-gold/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
              <Coins className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded-lg">Total</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total em tokens</p>
          <p className="text-2xl font-bold text-navy-deep">{(summary?.total_tokens || 0).toLocaleString("pt-BR")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total investido</p>
          <p className="text-2xl font-bold text-navy-deep">
            {(summary?.total_invested || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Ativos diferentes</p>
          <p className="text-2xl font-bold text-navy-deep">{summary?.assets_count || 0}</p>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Tokens pendentes</p>
          <p className="text-2xl font-bold text-navy-deep">{(summary?.pending_tokens || 0).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Pending Approval Notice */}
      {(summary?.pending_approval_count || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Investimentos aguardando aprovação</h4>
            <p className="text-sm text-amber-700">
              Você tem {summary?.pending_approval_count} investimento(s) aguardando aprovação do administrador.
              Após aprovado, seu NFT de compromisso será criado automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-semibold text-green-900 mb-1">Seus tokens estão seguros</h4>
          <p className="text-sm text-green-700">
            Todos os tokens são emitidos na blockchain Hathor Network e registrados de forma imutável. 
            Cada investimento recebe um NFT de compromisso que garante seus direitos.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Assets List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-navy-deep">Seus Ativos</h2>
          
          {assets.length === 0 ? (
            <EmptyAssetsState />
          ) : (
            <div className="space-y-4">
              {assets.map(asset => (
                <InvestmentCard 
                  key={asset.id} 
                  asset={asset} 
                  onCopy={copyToClipboard}
                  copiedText={copiedText}
                  hathorAddress={hathorAddress}
                />
              ))}
            </div>
          )}
        </div>

        {/* Transactions Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy-deep">Histórico</h2>
          
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-kate-border p-6 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-kate-border divide-y divide-kate-border">
              {transactions.map(tx => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
            </div>
          )}

          {/* Info Card */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-navy-deep mb-1">Sobre seus tokens</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tokens representam sua participação nos projetos investidos. 
                  Ao investir, você recebe um NFT de compromisso. Quando a meta é atingida, 
                  os tokens são transferidos para sua carteira Hathor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function EmptyAssetsState() {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Sparkles className="w-8 h-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-navy-deep mb-2">
        Sua carteira está vazia
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Invista em ofertas abertas para receber tokens quando as captações forem concluídas com sucesso.
      </p>
      <Link
        to="/app/oportunidades"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
      >
        Explorar oportunidades
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// Removed NftDataModal - NFT individual por investidor foi eliminado
// Agora o sistema usa apenas 1 NFT por projeto

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getIcon = () => {
    switch (transaction.type) {
      case "nft_created":
        return <FileText className="w-4 h-4" />;
      case "tokens_distributed":
        return <ArrowDownRight className="w-4 h-4" />;
      case "refunded":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (transaction.type) {
      case "nft_created":
        return "NFT de Compromisso Recebido";
      case "tokens_distributed":
        return "Tokens Distribuídos";
      case "refunded":
        return "Reembolso Realizado";
      default:
        return "";
    }
  };

  const getColor = () => {
    switch (transaction.type) {
      case "nft_created":
        return "bg-purple-50 text-purple-600";
      case "tokens_distributed":
        return "bg-green-50 text-green-600";
      case "refunded":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{getLabel()}</p>
          <p className="text-sm font-medium text-navy-deep truncate">
            {transaction.project_name}
          </p>
          {transaction.tokens_reserved && (
            <p className="text-xs text-gray-500">{transaction.tokens_reserved} tokens reservados</p>
          )}
          {transaction.tokens_received && (
            <p className="text-xs text-green-600 font-medium">+{transaction.tokens_received} {transaction.token_symbol}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
          {transaction.tx_hash && (
            <a
              href={`${HATHOR_EXPLORER_URL}/transaction/${transaction.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold hover:text-gold-hover"
            >
              Ver TX
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
