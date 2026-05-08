import { useState, useEffect } from "react";
import type { CampaignWithDetails, Reward, CampaignUpdate, CampaignFaq } from "@/shared/types";

// Frontend types with camelCase
export interface CampaignDetail {
  id: number;
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  category: string;
  goalAmount: number;
  currentAmount: number;
  backersCount: number;
  endDate: string;
  creatorName: string;
  creatorEmail: string | null;
  creatorAvatar: string;
  isFeatured: boolean;
  status: string;
  risks: string | null;
  daysLeft: number;
  createdAt: string;
  userId: string | null;
  rewards: RewardDetail[];
  updates: UpdateDetail[];
  faqs: FaqDetail[];
}

export interface RewardDetail {
  id: number;
  campaignId: number;
  title: string;
  description: string;
  minAmount: number;
  estimatedDelivery: string;
  itemsIncluded: string[];
  limitedQuantity: number | null;
  claimedCount: number;
}

export interface UpdateDetail {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface FaqDetail {
  id: number;
  question: string;
  answer: string;
}

function transformReward(apiReward: Reward): RewardDetail {
  let itemsIncluded: string[] = [];
  try {
    itemsIncluded = JSON.parse(apiReward.items_included);
  } catch {
    itemsIncluded = apiReward.items_included ? [apiReward.items_included] : [];
  }
  
  return {
    id: apiReward.id,
    campaignId: apiReward.campaign_id,
    title: apiReward.title,
    description: apiReward.description,
    minAmount: apiReward.min_amount,
    estimatedDelivery: apiReward.estimated_delivery,
    itemsIncluded,
    limitedQuantity: apiReward.limited_quantity,
    claimedCount: apiReward.claimed_count,
  };
}

function transformUpdate(apiUpdate: CampaignUpdate): UpdateDetail {
  return {
    id: apiUpdate.id,
    title: apiUpdate.title,
    content: apiUpdate.content,
    createdAt: apiUpdate.created_at,
  };
}

function transformFaq(apiFaq: CampaignFaq): FaqDetail {
  return {
    id: apiFaq.id,
    question: apiFaq.question,
    answer: apiFaq.answer,
  };
}

function transformCampaign(apiCampaign: CampaignWithDetails): CampaignDetail {
  return {
    id: apiCampaign.id,
    title: apiCampaign.title,
    shortDescription: apiCampaign.short_description,
    fullDescription: apiCampaign.full_description,
    imageUrl: apiCampaign.image_url,
    category: apiCampaign.category,
    goalAmount: apiCampaign.goal_amount,
    currentAmount: apiCampaign.current_amount,
    backersCount: apiCampaign.backers_count,
    endDate: apiCampaign.end_date,
    creatorName: apiCampaign.creator_name,
    creatorEmail: apiCampaign.creator_email,
    creatorAvatar: apiCampaign.creator_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    isFeatured: apiCampaign.is_featured === 1,
    status: apiCampaign.status,
    risks: apiCampaign.risks,
    daysLeft: apiCampaign.days_left,
    createdAt: apiCampaign.created_at,
    userId: (apiCampaign as any).user_id || null,
    rewards: apiCampaign.rewards.map(transformReward),
    updates: apiCampaign.updates.map(transformUpdate),
    faqs: apiCampaign.faqs.map(transformFaq),
  };
}

interface ApiResponse {
  campaign: CampaignWithDetails;
}

export function useCampaignDetail(id: string | undefined) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("ID da campanha não fornecido");
      return;
    }

    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/campaigns/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Campanha não encontrada");
          }
          throw new Error("Falha ao carregar campanha");
        }
        
        const data: ApiResponse = await response.json();
        setCampaign(transformCampaign(data.campaign));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  return { campaign, loading, error };
}
