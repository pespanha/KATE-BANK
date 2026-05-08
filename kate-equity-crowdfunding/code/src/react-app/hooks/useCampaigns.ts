import { useState, useEffect } from "react";
import type { Campaign as ApiCampaign } from "@/shared/types";

// Frontend campaign type with camelCase
export interface Campaign {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  imageUrl: string;
  creatorName: string;
  creatorAvatar: string;
  goalAmount: number;
  currentAmount: number;
  backersCount: number;
  daysLeft: number;
  featured: boolean;
}

interface ApiResponse {
  campaigns: (ApiCampaign & { days_left: number })[];
}

// Transform API response to frontend format
function transformCampaign(apiCampaign: ApiCampaign & { days_left: number }): Campaign {
  return {
    id: String(apiCampaign.id),
    title: apiCampaign.title,
    shortDescription: apiCampaign.short_description,
    category: apiCampaign.category,
    imageUrl: apiCampaign.image_url,
    creatorName: apiCampaign.creator_name,
    creatorAvatar: apiCampaign.creator_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    goalAmount: apiCampaign.goal_amount,
    currentAmount: apiCampaign.current_amount,
    backersCount: apiCampaign.backers_count,
    daysLeft: apiCampaign.days_left,
    featured: apiCampaign.is_featured === 1,
  };
}

interface UseCampaignsOptions {
  category?: string;
  featured?: boolean;
  search?: string;
  sortBy?: string;
  fundingStatus?: string;
}

export function useCampaigns(options: UseCampaignsOptions = {}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (options.category && options.category !== "Todos") {
          params.set("category", options.category);
        }
        if (options.featured) {
          params.set("featured", "true");
        }
        if (options.search) {
          params.set("search", options.search);
        }
        if (options.sortBy) {
          params.set("sort", options.sortBy);
        }
        if (options.fundingStatus && options.fundingStatus !== "all") {
          params.set("funding_status", options.fundingStatus);
        }
        
        const url = `/api/campaigns${params.toString() ? `?${params}` : ""}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("Falha ao carregar campanhas");
        }
        
        const data: ApiResponse = await response.json();
        let result = data.campaigns.map(transformCampaign);
        
        // Client-side sorting
        if (options.sortBy === "popular") {
          result.sort((a, b) => b.backersCount - a.backersCount);
        } else if (options.sortBy === "trending") {
          result.sort((a, b) => {
            const aProgress = a.currentAmount / a.goalAmount;
            const bProgress = b.currentAmount / b.goalAmount;
            return bProgress - aProgress;
          });
        } else if (options.sortBy === "ending") {
          result.sort((a, b) => a.daysLeft - b.daysLeft);
        }
        
        // Client-side funding status filter
        if (options.fundingStatus === "funded") {
          result = result.filter(c => c.currentAmount >= c.goalAmount);
        } else if (options.fundingStatus === "near") {
          result = result.filter(c => {
            const progress = (c.currentAmount / c.goalAmount) * 100;
            return progress >= 75 && progress < 100;
          });
        } else if (options.fundingStatus === "halfway") {
          result = result.filter(c => {
            const progress = (c.currentAmount / c.goalAmount) * 100;
            return progress >= 50 && progress < 75;
          });
        } else if (options.fundingStatus === "starting") {
          result = result.filter(c => {
            const progress = (c.currentAmount / c.goalAmount) * 100;
            return progress < 25;
          });
        }
        
        setCampaigns(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [options.category, options.featured, options.search, options.sortBy, options.fundingStatus]);

  return { campaigns, loading, error };
}

export function usePlatformStats() {
  const [stats, setStats] = useState({
    totalRaised: 0,
    totalCampaigns: 0,
    totalBackers: 0,
    fundedCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalRaised: data.total_raised,
            totalCampaigns: data.total_campaigns,
            totalBackers: data.total_backers,
            fundedCampaigns: data.funded_campaigns,
          });
        }
      } catch {
        // Use default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
