import { Link } from "react-router";
import { Clock, Users } from "lucide-react";
import type { Campaign } from "@/react-app/hooks/useCampaigns";

interface CampaignCardProps {
  campaign: Campaign;
  featured?: boolean;
}

export default function CampaignCard({ campaign, featured = false }: CampaignCardProps) {
  const progressPercent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
  const isFullyFunded = campaign.currentAmount >= campaign.goalAmount;

  return (
    <Link
      to={`/campaign/${campaign.id}`}
      className={`group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? "h-64 md:h-80" : "h-48"}`}>
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
            {campaign.category}
          </span>
        </div>

        {/* Fully Funded Badge */}
        {isFullyFunded && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-emerald-500 text-xs font-bold text-white rounded-full shadow-lg">
              META ATINGIDA
            </span>
          </div>
        )}

        {/* Creator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <img
            src={campaign.creatorAvatar}
            alt={campaign.creatorName}
            className="w-8 h-8 rounded-full border-2 border-white object-cover"
          />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {campaign.creatorName}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className={`font-bold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-2 ${
          featured ? "text-xl" : "text-lg"
        }`}>
          {campaign.title}
        </h3>
        <p className={`mt-2 text-gray-500 line-clamp-2 ${featured ? "text-base" : "text-sm"}`}>
          {campaign.shortDescription}
        </p>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyFunded
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">
              R$ {campaign.currentAmount.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-gray-500">
              de R$ {campaign.goalAmount.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{campaign.backersCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{campaign.daysLeft}d</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
