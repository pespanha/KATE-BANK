import { Link } from "react-router";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Shield,
  Coins,
  RefreshCw
} from "lucide-react";

const HATHOR_EXPLORER_URL = "https://explorer.hathor.network";
const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

// Card status types matching backend response
export type CardStatus = "escrow_reserved" | "distributing" | "completed" | "refunded";

export interface InvestmentAsset {
  id: number;
  project_name: string;
  offer_title: string;
  offer_slug: string;
  offer_image_url: string | null;
  offer_category: string;
  token_symbol: string | null;
  token_uid: string | null;
  amount_invested: number;
  cotas_reserved: number;
  tokens_reserved: number;
  tokens_received: number;
  // Project NFT data (único NFT por projeto)
  project_nft_uid: string | null;
  project_nft_tx_hash: string | null;
  project_slug: string | null;
  project_nft_token_link_tx: string | null;
  // Blockchain info
  blockchain: "hathor" | "stellar";
  stellar_asset_code: string | null;
  stellar_asset_issuer: string | null;
  stellar_tx_hash: string | null;
  stellar_trustline_tx: string | null;
  escrow_tx_hash: string | null;
  distribution_tx_hash: string | null;
  distribution_date: string | null;
  refund_tx_hash: string | null;
  refund_date: string | null;
  status: CardStatus;
  db_status?: string;
  investment_date: string;
  approved_date: string | null;
}

interface InvestmentCardProps {
  asset: InvestmentAsset;
  onCopy: (text: string) => void;
  copiedText: string | null;
  hathorAddress: string | null;
}

// Helper functions
const truncateAddress = (addr: string, chars: number = 6) => {
  if (!addr || addr.length <= chars * 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

// Get explorer URL based on blockchain
const getExplorerUrl = (blockchain: "hathor" | "stellar", type: "tx" | "token", hash: string) => {
  if (blockchain === "stellar") {
    if (type === "tx") {
      return `${STELLAR_EXPLORER_URL}/tx/${hash}`;
    }
    // For Stellar assets, format is code-issuer
    return `${STELLAR_EXPLORER_URL}/asset/${hash}`;
  }
  // Hathor
  if (type === "tx") {
    return `${HATHOR_EXPLORER_URL}/transaction/${hash}`;
  }
  return `${HATHOR_EXPLORER_URL}/token_detail/${hash}`;
};

// Blockchain badge component
const BlockchainBadge = ({ blockchain }: { blockchain: "hathor" | "stellar" }) => {
  if (blockchain === "stellar") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full">
        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
        Stellar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
      Hathor
    </span>
  );
};

// ============================================
// CARD STATE 1: ESCROW RESERVED
// Tokens reserved, waiting for fundraising to end
// Visual: Dashed amber border, amber accents
// ============================================
export function EscrowReservedCard({ asset, onCopy, copiedText }: InvestmentCardProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 overflow-hidden hover:border-amber-400 hover:shadow-lg transition-all duration-300">
      {/* Header with dashed style indication */}
      <div className="p-4 border-b border-dashed border-amber-200 bg-gradient-to-r from-amber-50 to-amber-25">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {asset.token_symbol && (
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold text-sm border border-amber-200">
                {asset.token_symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {asset.token_symbol && (
                  <span className="font-bold text-amber-800">{asset.token_symbol}</span>
                )}
                <span className="text-gray-400">•</span>
                <Link 
                  to={`/oferta/${asset.offer_slug}`}
                  className="font-semibold text-navy-deep hover:text-gold transition-colors"
                >
                  {asset.project_name}
                </Link>
              </div>
              <p className="text-xs text-gray-500">{asset.offer_category}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Reserva Confirmada
          </span>
        </div>
        <BlockchainBadge blockchain={asset.blockchain} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Investment Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Investido</p>
            <p className="font-semibold text-navy-deep text-sm">
              {asset.amount_invested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Cotas</p>
            <p className="font-semibold text-navy-deep text-sm">{asset.cotas_reserved}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <p className="text-xs text-amber-600 mb-1">Tokens Reservados</p>
            <p className="font-bold text-amber-800 text-sm">
              {asset.tokens_reserved?.toLocaleString("pt-BR") || 0}
            </p>
          </div>
        </div>

        {/* Escrow Info Box */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Tokens em Custódia</h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                Seus tokens estão reservados no endereço de escrow do projeto. Quando a captação atingir a meta, 
                os tokens serão transferidos para sua carteira e você receberá um NFT de comprovação.
              </p>
            </div>
          </div>
        </div>

        {/* Token Details */}
        {asset.token_uid && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Token UID:</span>
            <div className="flex items-center gap-1">
              <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                {truncateAddress(asset.token_uid, 8)}
              </code>
              <button
                onClick={() => onCopy(asset.token_uid!)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {copiedText === asset.token_uid ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-dashed border-amber-200">
          <p className="text-xs text-gray-500">
            Investido em {formatDate(asset.investment_date)}
          </p>
          <Link
            to={`/oferta/${asset.offer_slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            Acompanhar <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CARD STATE 2: DISTRIBUTING
// Tokens being transferred (in progress)
// Visual: Animated blue border, pulsing effect
// ============================================
export function DistributingCard({ asset }: InvestmentCardProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-blue-300 overflow-hidden shadow-lg shadow-blue-100 animate-pulse-subtle relative">
      {/* Animated border glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-blue-400/20 animate-shimmer" />
      
      {/* Header */}
      <div className="relative p-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {asset.token_symbol && (
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm border border-blue-200 relative">
                {asset.token_symbol.slice(0, 2)}
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {asset.token_symbol && (
                  <span className="font-bold text-blue-800">{asset.token_symbol}</span>
                )}
                <span className="text-gray-400">•</span>
                <Link 
                  to={`/oferta/${asset.offer_slug}`}
                  className="font-semibold text-navy-deep hover:text-gold transition-colors"
                >
                  {asset.project_name}
                </Link>
              </div>
              <p className="text-xs text-gray-500">{asset.offer_category}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Distribuindo...
          </span>
        </div>
        <BlockchainBadge blockchain={asset.blockchain} />
      </div>

      {/* Content */}
      <div className="relative p-4 space-y-4">
        {/* Investment Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Investido</p>
            <p className="font-semibold text-navy-deep text-sm">
              {asset.amount_invested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Cotas</p>
            <p className="font-semibold text-navy-deep text-sm">{asset.cotas_reserved}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-xs text-blue-600 mb-1">Tokens</p>
            <p className="font-bold text-blue-800 text-sm">
              {asset.tokens_reserved?.toLocaleString("pt-BR") || 0}
            </p>
          </div>
        </div>

        {/* Distribution Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Transferência em Andamento</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                A meta foi atingida! Seus tokens estão sendo transferidos do escrow para sua carteira Hathor. 
                Isso pode levar alguns minutos.
              </p>
            </div>
          </div>
          {/* Progress animation */}
          <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-progress" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processando na blockchain...
          </p>
          <Link
            to={`/oferta/${asset.offer_slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
          >
            Ver Projeto <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CARD STATE 3: COMPLETED
// Tokens distributed, Project NFT available
// Visual: Solid green border, success styling
// ============================================
export function CompletedCard({ asset, onCopy, copiedText, hathorAddress }: InvestmentCardProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-green-300 overflow-hidden hover:border-green-400 hover:shadow-lg hover:shadow-green-100 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {asset.token_symbol && (
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold text-sm border border-green-200">
                {asset.token_symbol.slice(0, 2)}
                <CheckCircle2 className="w-4 h-4 absolute -bottom-1 -right-1 text-green-600 bg-white rounded-full" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {asset.token_symbol && (
                  <span className="font-bold text-green-800">{asset.token_symbol}</span>
                )}
                <span className="text-gray-400">•</span>
                <Link 
                  to={`/oferta/${asset.offer_slug}`}
                  className="font-semibold text-navy-deep hover:text-gold transition-colors"
                >
                  {asset.project_name}
                </Link>
              </div>
              <p className="text-xs text-gray-500">{asset.offer_category}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </span>
        </div>
        <BlockchainBadge blockchain={asset.blockchain} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Investment Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Investido</p>
            <p className="font-semibold text-navy-deep text-sm">
              {asset.amount_invested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Cotas</p>
            <p className="font-semibold text-navy-deep text-sm">{asset.cotas_reserved}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-xs text-green-600 mb-1">Tokens Recebidos</p>
            <p className="font-bold text-green-800 text-sm">
              {(asset.tokens_received || asset.tokens_reserved)?.toLocaleString("pt-BR") || 0}
            </p>
          </div>
        </div>

        {/* Project NFT Section */}
        {asset.project_nft_uid && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">NFT do Projeto</span>
              {asset.project_nft_token_link_tx && (
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Vinculado ao Token</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">NFT UID:</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-white/70 px-2 py-0.5 rounded font-mono text-purple-800">
                    {truncateAddress(asset.project_nft_uid, 8)}
                  </code>
                  <button
                    onClick={() => onCopy(asset.project_nft_uid!)}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    {copiedText === asset.project_nft_uid ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {asset.project_nft_tx_hash && (
                  <a
                    href={getExplorerUrl(asset.blockchain, "tx", asset.project_nft_tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-medium"
                  >
                    Ver NFT <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {asset.project_slug && (
                  <Link
                    to={`/verificacao/${asset.project_slug}`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-medium"
                  >
                    Página de Verificação <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Distribution Info */}
        {asset.distribution_tx_hash && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900">Tokens na sua Carteira</span>
            </div>
            {asset.distribution_date && (
              <p className="text-xs text-green-700 mb-2">
                Distribuído em {formatDate(asset.distribution_date)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">TX Hash:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-white/70 px-2 py-0.5 rounded font-mono">
                  {truncateAddress(asset.distribution_tx_hash, 8)}
                </code>
                <a
                  href={getExplorerUrl(asset.blockchain, "tx", asset.distribution_tx_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-white/50 rounded"
                >
                  <ExternalLink className="w-3 h-3 text-green-600" />
                </a>
              </div>
            </div>
            {hathorAddress && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-gray-600 mb-1">Seu endereço Hathor:</p>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-white/70 px-2 py-1 rounded font-mono flex-1 truncate">
                    {hathorAddress}
                  </code>
                  <button
                    onClick={() => onCopy(hathorAddress)}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    {copiedText === hathorAddress ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-green-200">
          <p className="text-xs text-gray-500">
            Investido em {formatDate(asset.investment_date)}
          </p>
          <Link
            to={`/oferta/${asset.offer_slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900 transition-colors"
          >
            Ver Projeto <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CARD STATE 4: REFUNDED
// Project didn't reach goal, investment refunded
// Visual: Solid red border, muted styling
// ============================================
export function RefundedCard({ asset, onCopy, copiedText }: InvestmentCardProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden opacity-90">
      {/* Header */}
      <div className="p-4 border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {asset.token_symbol && (
              <div className="w-10 h-10 bg-red-100 text-red-400 rounded-xl flex items-center justify-center font-bold text-sm border border-red-200 opacity-75">
                {asset.token_symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {asset.token_symbol && (
                  <span className="font-bold text-red-400 line-through">{asset.token_symbol}</span>
                )}
                <span className="text-gray-400">•</span>
                <Link 
                  to={`/oferta/${asset.offer_slug}`}
                  className="font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {asset.project_name}
                </Link>
              </div>
              <p className="text-xs text-gray-400">{asset.offer_category}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Reembolsado
          </span>
        </div>
        <BlockchainBadge blockchain={asset.blockchain} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Investment Stats - muted */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Investido</p>
            <p className="font-semibold text-gray-500 text-sm line-through">
              {asset.amount_invested.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Cotas</p>
            <p className="font-semibold text-gray-500 text-sm line-through">{asset.cotas_reserved}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-xs text-red-500 mb-1">Tokens</p>
            <p className="font-bold text-red-400 text-sm line-through">
              {asset.tokens_reserved?.toLocaleString("pt-BR") || 0}
            </p>
          </div>
        </div>

        {/* Refund Info */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-1">Projeto Não Atingiu a Meta</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                O projeto não alcançou a meta mínima de captação. Seu investimento foi reembolsado integralmente 
                conforme as regras da CVM 88.
              </p>
              {asset.refund_date && (
                <p className="text-xs text-red-600 mt-2">
                  Reembolsado em {formatDate(asset.refund_date)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Refund Transaction */}
        {asset.refund_tx_hash && (
          <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500">TX de Reembolso:</span>
            <div className="flex items-center gap-1">
              <code className="bg-white px-2 py-0.5 rounded font-mono text-gray-600">
                {truncateAddress(asset.refund_tx_hash, 8)}
              </code>
              <button
                onClick={() => onCopy(asset.refund_tx_hash!)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {copiedText === asset.refund_tx_hash ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <a
                href={getExplorerUrl(asset.blockchain, "tx", asset.refund_tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-red-200">
          <p className="text-xs text-gray-400">
            Investido em {formatDate(asset.investment_date)}
          </p>
          <Link
            to="/app/oportunidades"
            className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-hover transition-colors"
          >
            Ver Novas Oportunidades <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN CARD COMPONENT
// Renders the appropriate card based on status
// ============================================
export function InvestmentCard(props: InvestmentCardProps) {
  const { asset } = props;
  
  switch (asset.status) {
    case "escrow_reserved":
      return <EscrowReservedCard {...props} />;
    case "distributing":
      return <DistributingCard {...props} />;
    case "completed":
      return <CompletedCard {...props} />;
    case "refunded":
      return <RefundedCard {...props} />;
    default:
      // Fallback to escrow_reserved for unknown states
      return <EscrowReservedCard {...props} />;
  }
}
