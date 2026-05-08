import { Check, Gift, AlertCircle } from "lucide-react";
import type { RewardDetail } from "@/react-app/hooks/useCampaignDetail";

interface RewardCardProps {
  reward: RewardDetail;
  onSelect: (reward: RewardDetail) => void;
}

export default function RewardCard({ reward, onSelect }: RewardCardProps) {
  const isLimited = reward.limitedQuantity !== null;
  const remaining = isLimited ? reward.limitedQuantity! - reward.claimedCount : null;
  const isSoldOut = isLimited && remaining !== null && remaining <= 0;
  const isAlmostGone = isLimited && remaining !== null && remaining <= 10 && remaining > 0;

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
        isSoldOut
          ? "border-gray-200 opacity-60"
          : "border-gray-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10"
      }`}
    >
      {/* Limited badge */}
      {isAlmostGone && (
        <div className="absolute -top-3 right-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
            <AlertCircle className="w-3 h-3" />
            Últimas {remaining}!
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-gray-900">
            R$ {reward.minAmount}
          </span>
          <span className="text-sm text-gray-500">ou mais</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.title}</h3>

        {/* Description */}
        <p className="text-gray-600 mb-4">{reward.description}</p>

        {/* Items included */}
        {reward.itemsIncluded.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-500" />
              Inclui:
            </p>
            <ul className="space-y-1.5">
              {reward.itemsIncluded.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Estimated delivery */}
        <p className="text-sm text-gray-500 mb-4">
          Entrega estimada: <span className="font-medium">{reward.estimatedDelivery}</span>
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{reward.claimedCount} apoiadores</span>
          {isLimited && (
            <span className={isAlmostGone ? "text-amber-600 font-medium" : ""}>
              {isSoldOut ? "Esgotado" : `${remaining} restantes`}
            </span>
          )}
        </div>

        {/* Select button */}
        <button
          onClick={() => onSelect(reward)}
          disabled={isSoldOut}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
            isSoldOut
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25"
          }`}
        >
          {isSoldOut ? "Esgotado" : "Selecionar recompensa"}
        </button>
      </div>
    </div>
  );
}
