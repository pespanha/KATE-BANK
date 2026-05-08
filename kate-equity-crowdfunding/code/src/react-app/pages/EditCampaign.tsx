import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Save, Sparkles, Target, Image, Gift, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { CATEGORIES } from "@/shared/types";
import { useAuth } from "@/react-app/hooks/useAuth";

interface RewardInput {
  id: number | string;
  title: string;
  description: string;
  min_amount: number;
  estimated_delivery: string;
  items_included: string[];
  limited_quantity?: number;
  isNew?: boolean;
}

interface FormData {
  title: string;
  short_description: string;
  full_description: string;
  image_url: string;
  category: string;
  goal_amount: number;
  end_date: string;
  creator_name: string;
  risks: string;
  rewards: RewardInput[];
}

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPending } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unauthorized, setUnauthorized] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    short_description: "",
    full_description: "",
    image_url: "",
    category: "",
    goal_amount: 5000,
    end_date: "",
    creator_name: "",
    risks: "",
    rewards: [],
  });

  // Load campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/campaigns/${id}`);
        if (!response.ok) throw new Error("Campaign not found");

        const data = await response.json();
        const campaign = data.campaign;

        // Check if user owns this campaign
        if (user && campaign.user_id && campaign.user_id !== user.id) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setFormData({
          title: campaign.title,
          short_description: campaign.short_description,
          full_description: campaign.full_description,
          image_url: campaign.image_url,
          category: campaign.category,
          goal_amount: campaign.goal_amount,
          end_date: campaign.end_date.split("T")[0],
          creator_name: campaign.creator_name,
          risks: campaign.risks || "",
          rewards: (data.rewards || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            min_amount: r.min_amount,
            estimated_delivery: r.estimated_delivery,
            items_included: JSON.parse(r.items_included || "[]"),
            limited_quantity: r.limited_quantity,
            isNew: false,
          })),
        });
      } catch (error) {
        console.error("Failed to load campaign:", error);
        setErrors({ load: "Falha ao carregar campanha" });
      } finally {
        setLoading(false);
      }
    };

    if (!isPending && id) {
      fetchCampaign();
    }
  }, [id, user, isPending]);

  const updateField = (field: keyof FormData, value: string | number | RewardInput[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addReward = () => {
    const newReward: RewardInput = {
      id: `new-${Date.now()}`,
      title: "",
      description: "",
      min_amount: 50,
      estimated_delivery: "",
      items_included: [""],
      limited_quantity: undefined,
      isNew: true,
    };
    updateField("rewards", [...formData.rewards, newReward]);
  };

  const updateReward = (id: number | string, field: keyof RewardInput, value: string | number | string[] | undefined) => {
    const updated = formData.rewards.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    updateField("rewards", updated);
  };

  const removeReward = (id: number | string) => {
    updateField(
      "rewards",
      formData.rewards.filter((r) => r.id !== id)
    );
  };

  const addRewardItem = (rewardId: number | string) => {
    const reward = formData.rewards.find((r) => r.id === rewardId);
    if (reward) {
      updateReward(rewardId, "items_included", [...reward.items_included, ""]);
    }
  };

  const updateRewardItem = (rewardId: number | string, index: number, value: string) => {
    const reward = formData.rewards.find((r) => r.id === rewardId);
    if (reward) {
      const items = [...reward.items_included];
      items[index] = value;
      updateReward(rewardId, "items_included", items);
    }
  };

  const removeRewardItem = (rewardId: number | string, index: number) => {
    const reward = formData.rewards.find((r) => r.id === rewardId);
    if (reward && reward.items_included.length > 1) {
      updateReward(
        rewardId,
        "items_included",
        reward.items_included.filter((_, i) => i !== index)
      );
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = "Título deve ter pelo menos 5 caracteres";
    }
    if (!formData.short_description || formData.short_description.length < 10) {
      newErrors.short_description = "Descrição curta deve ter pelo menos 10 caracteres";
    }
    if (!formData.category) {
      newErrors.category = "Selecione uma categoria";
    }
    if (!formData.full_description || formData.full_description.length < 50) {
      newErrors.full_description = "Descrição completa deve ter pelo menos 50 caracteres";
    }
    if (formData.goal_amount < 100) {
      newErrors.goal_amount = "Meta mínima é R$ 100";
    }
    if (!formData.end_date) {
      newErrors.end_date = "Selecione uma data de encerramento";
    }
    if (!formData.image_url) {
      newErrors.image_url = "Adicione uma imagem para sua campanha";
    }
    if (!formData.creator_name || formData.creator_name.length < 2) {
      newErrors.creator_name = "Nome do criador é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Update campaign
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          short_description: formData.short_description,
          full_description: formData.full_description,
          image_url: formData.image_url,
          category: formData.category,
          goal_amount: formData.goal_amount,
          end_date: formData.end_date,
          creator_name: formData.creator_name,
          risks: formData.risks || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar campanha");
      }

      // Handle rewards
      for (const reward of formData.rewards) {
        if (reward.isNew && reward.title && reward.description) {
          // Create new reward
          await fetch("/api/rewards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              campaign_id: id,
              title: reward.title,
              description: reward.description,
              min_amount: reward.min_amount,
              estimated_delivery: reward.estimated_delivery,
              items_included: reward.items_included.filter((i) => i.trim()),
              limited_quantity: reward.limited_quantity || undefined,
            }),
          });
        } else if (!reward.isNew && reward.title && reward.description) {
          // Update existing reward
          await fetch(`/api/rewards/${reward.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: reward.title,
              description: reward.description,
              min_amount: reward.min_amount,
              estimated_delivery: reward.estimated_delivery,
              items_included: reward.items_included.filter((i) => i.trim()),
              limited_quantity: reward.limited_quantity || undefined,
            }),
          });
        }
      }

      navigate(`/campaign/${id}`);
    } catch (error) {
      console.error(error);
      setErrors({ submit: error instanceof Error ? error.message : "Erro ao atualizar campanha" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Unauthorized
  if (unauthorized || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={`/campaign/${id}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
            <p className="text-white/60 mb-6">Você não tem permissão para editar esta campanha.</p>
            <Link
              to={`/campaign/${id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl"
            >
              Ver Campanha
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error loading
  if (errors.load) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-red-400">{errors.load}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={`/campaign/${id}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Editar Campanha</h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {errors.submit && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
            <p className="text-red-300">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Informações Básicas</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Título da Campanha *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.title ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Descrição Curta *</label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => updateField("short_description", e.target.value)}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.short_description ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none`}
                />
                {errors.short_description && <p className="mt-1 text-sm text-red-400">{errors.short_description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Categoria *</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.category ? "border-red-500" : "border-white/10"
                  } text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                >
                  <option value="" className="bg-slate-900">
                    Selecione uma categoria
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900">
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Nome do Criador *</label>
                <input
                  type="text"
                  value={formData.creator_name}
                  onChange={(e) => updateField("creator_name", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.creator_name ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                />
                {errors.creator_name && <p className="mt-1 text-sm text-red-400">{errors.creator_name}</p>}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Detalhes do Projeto</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Descrição Completa *</label>
                <textarea
                  value={formData.full_description}
                  onChange={(e) => updateField("full_description", e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.full_description ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none`}
                />
                {errors.full_description && <p className="mt-1 text-sm text-red-400">{errors.full_description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Meta de Arrecadação (R$) *</label>
                  <input
                    type="number"
                    value={formData.goal_amount}
                    onChange={(e) => updateField("goal_amount", parseFloat(e.target.value) || 0)}
                    min={100}
                    step={100}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.goal_amount ? "border-red-500" : "border-white/10"
                    } text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  />
                  {errors.goal_amount && <p className="mt-1 text-sm text-red-400">{errors.goal_amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Data de Encerramento *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateField("end_date", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                      errors.end_date ? "border-red-500" : "border-white/10"
                    } text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  />
                  {errors.end_date && <p className="mt-1 text-sm text-red-400">{errors.end_date}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Riscos e Desafios (opcional)
                </label>
                <textarea
                  value={formData.risks}
                  onChange={(e) => updateField("risks", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Image className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Imagem da Campanha</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">URL da Imagem Principal *</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  errors.image_url ? "border-red-500" : "border-white/10"
                } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
              />
              {errors.image_url && <p className="mt-1 text-sm text-red-400">{errors.image_url}</p>}
            </div>

            {formData.image_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-white/80 mb-2">Pré-visualização:</p>
                <div className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Recompensas</h2>
              </div>
              <button
                onClick={addReward}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {formData.rewards.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                <Gift className="w-12 h-12 mx-auto text-white/30 mb-4" />
                <p className="text-white/50">Nenhuma recompensa adicionada</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.rewards.map((reward, index) => (
                  <div key={reward.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Recompensa #{index + 1} {reward.isNew && <span className="text-xs text-emerald-400">(Nova)</span>}
                      </h3>
                      <button onClick={() => removeReward(reward.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Título</label>
                        <input
                          type="text"
                          value={reward.title}
                          onChange={(e) => updateReward(reward.id, "title", e.target.value)}
                          placeholder="Ex: Early Bird"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Valor Mínimo (R$)</label>
                        <input
                          type="number"
                          value={reward.min_amount}
                          onChange={(e) => updateReward(reward.id, "min_amount", parseFloat(e.target.value) || 0)}
                          min={1}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm text-white/60 mb-1">Descrição</label>
                      <textarea
                        value={reward.description}
                        onChange={(e) => updateReward(reward.id, "description", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Entrega Estimada</label>
                        <input
                          type="text"
                          value={reward.estimated_delivery}
                          onChange={(e) => updateReward(reward.id, "estimated_delivery", e.target.value)}
                          placeholder="Ex: Março 2025"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Quantidade Limitada</label>
                        <input
                          type="number"
                          value={reward.limited_quantity || ""}
                          onChange={(e) => updateReward(reward.id, "limited_quantity", e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Ilimitado"
                          min={1}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Itens Inclusos</label>
                      {reward.items_included.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateRewardItem(reward.id, itemIndex, e.target.value)}
                            placeholder="Ex: 1x Livro autografado"
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                          />
                          {reward.items_included.length > 1 && (
                            <button onClick={() => removeRewardItem(reward.id, itemIndex)} className="p-2 text-white/40 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addRewardItem(reward.id)} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                        + Adicionar item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
