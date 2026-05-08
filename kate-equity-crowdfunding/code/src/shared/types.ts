import z from "zod";

// Campaign schemas
export const CampaignSchema = z.object({
  id: z.number(),
  title: z.string(),
  short_description: z.string(),
  full_description: z.string(),
  image_url: z.string(),
  category: z.string(),
  goal_amount: z.number(),
  current_amount: z.number(),
  backers_count: z.number(),
  end_date: z.string(),
  creator_name: z.string(),
  creator_email: z.string().nullable(),
  creator_avatar: z.string().nullable(),
  is_featured: z.number(),
  status: z.string(),
  risks: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

export const CreateCampaignSchema = z.object({
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  short_description: z.string().min(10, "Descrição curta deve ter pelo menos 10 caracteres"),
  full_description: z.string().min(50, "Descrição completa deve ter pelo menos 50 caracteres"),
  image_url: z.string().url("URL da imagem inválida"),
  category: z.string().min(1, "Categoria é obrigatória"),
  goal_amount: z.number().min(100, "Meta mínima é R$ 100"),
  end_date: z.string(),
  creator_name: z.string().min(2, "Nome do criador é obrigatório"),
  creator_email: z.string().email("Email inválido").optional(),
  creator_avatar: z.string().url().optional(),
  risks: z.string().optional(),
  user_id: z.string().optional(),
});

export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;

// Reward schemas
export const RewardSchema = z.object({
  id: z.number(),
  campaign_id: z.number(),
  title: z.string(),
  description: z.string(),
  min_amount: z.number(),
  estimated_delivery: z.string(),
  items_included: z.string(),
  limited_quantity: z.number().nullable(),
  claimed_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Reward = z.infer<typeof RewardSchema>;

export const CreateRewardSchema = z.object({
  campaign_id: z.number(),
  title: z.string().min(2, "Título da recompensa é obrigatório"),
  description: z.string().min(10, "Descrição é obrigatória"),
  min_amount: z.number().min(1, "Valor mínimo é R$ 1"),
  estimated_delivery: z.string(),
  items_included: z.array(z.string()),
  limited_quantity: z.number().optional(),
});

export type CreateReward = z.infer<typeof CreateRewardSchema>;

// Pledge schemas
export const PledgeSchema = z.object({
  id: z.number(),
  campaign_id: z.number(),
  reward_id: z.number().nullable(),
  amount: z.number(),
  backer_name: z.string(),
  backer_email: z.string(),
  status: z.string(),
  payment_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Pledge = z.infer<typeof PledgeSchema>;

export const CreatePledgeSchema = z.object({
  campaign_id: z.number(),
  reward_id: z.number().optional(),
  amount: z.number().min(1, "Valor mínimo é R$ 1"),
  backer_name: z.string().min(2, "Nome é obrigatório"),
  backer_email: z.string().email("Email inválido"),
});

export type CreatePledge = z.infer<typeof CreatePledgeSchema>;

// Campaign Update schemas
export const CampaignUpdateSchema = z.object({
  id: z.number(),
  campaign_id: z.number(),
  title: z.string(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CampaignUpdate = z.infer<typeof CampaignUpdateSchema>;

// FAQ schemas
export const CampaignFaqSchema = z.object({
  id: z.number(),
  campaign_id: z.number(),
  question: z.string(),
  answer: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CampaignFaq = z.infer<typeof CampaignFaqSchema>;

// API Response types
export interface CampaignWithDetails extends Campaign {
  rewards: Reward[];
  updates: CampaignUpdate[];
  faqs: CampaignFaq[];
  days_left: number;
}

export const CATEGORIES = [
  "Sustentabilidade",
  "Arte & Cultura",
  "Tecnologia",
  "Cinema",
  "Jogos",
  "Música",
  "Design",
  "Educação",
  "Social",
  "Esportes",
] as const;
