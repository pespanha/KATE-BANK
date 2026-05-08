import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, Sparkles, Target, Image, User, AlertTriangle, Gift, Plus, Trash2, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/shared/types";
import { useAuth } from "@/react-app/hooks/useAuth";

interface RewardInput {
  id: string;
  title: string;
  description: string;
  min_amount: number;
  estimated_delivery: string;
  items_included: string[];
  limited_quantity?: number;
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
  creator_email: string;
  risks: string;
  rewards: RewardInput[];
}

const STEPS = [
  { id: 1, title: "Básico", icon: Sparkles },
  { id: 2, title: "Detalhes", icon: Target },
  { id: 3, title: "Mídia", icon: Image },
  { id: 4, title: "Recompensas", icon: Gift },
  { id: 5, title: "Criador", icon: User },
];

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    short_description: "",
    full_description: "",
    image_url: "",
    category: "",
    goal_amount: 5000,
    end_date: "",
    creator_name: "",
    creator_email: "",
    risks: "",
    rewards: [],
  });
  
  // Pre-fill creator info from logged-in user
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        creator_name: user.google_user_data?.name || prev.creator_name,
        creator_email: user.email,
      }));
    }
  }, [user]);

  const updateField = (field: keyof FormData, value: string | number | RewardInput[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const addReward = () => {
    const newReward: RewardInput = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      min_amount: 50,
      estimated_delivery: "",
      items_included: [""],
      limited_quantity: undefined,
    };
    updateField("rewards", [...formData.rewards, newReward]);
  };

  const updateReward = (id: string, field: keyof RewardInput, value: string | number | string[] | undefined) => {
    const updated = formData.rewards.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    );
    updateField("rewards", updated);
  };

  const removeReward = (id: string) => {
    updateField("rewards", formData.rewards.filter(r => r.id !== id));
  };

  const addRewardItem = (rewardId: string) => {
    const reward = formData.rewards.find(r => r.id === rewardId);
    if (reward) {
      updateReward(rewardId, "items_included", [...reward.items_included, ""]);
    }
  };

  const updateRewardItem = (rewardId: string, index: number, value: string) => {
    const reward = formData.rewards.find(r => r.id === rewardId);
    if (reward) {
      const items = [...reward.items_included];
      items[index] = value;
      updateReward(rewardId, "items_included", items);
    }
  };

  const removeRewardItem = (rewardId: string, index: number) => {
    const reward = formData.rewards.find(r => r.id === rewardId);
    if (reward && reward.items_included.length > 1) {
      updateReward(rewardId, "items_included", reward.items_included.filter((_, i) => i !== index));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.title || formData.title.length < 5) {
        newErrors.title = "Título deve ter pelo menos 5 caracteres";
      }
      if (!formData.short_description || formData.short_description.length < 10) {
        newErrors.short_description = "Descrição curta deve ter pelo menos 10 caracteres";
      }
      if (!formData.category) {
        newErrors.category = "Selecione uma categoria";
      }
    }
    
    if (step === 2) {
      if (!formData.full_description || formData.full_description.length < 50) {
        newErrors.full_description = "Descrição completa deve ter pelo menos 50 caracteres";
      }
      if (formData.goal_amount < 100) {
        newErrors.goal_amount = "Meta mínima é R$ 100";
      }
      if (!formData.end_date) {
        newErrors.end_date = "Selecione uma data de encerramento";
      }
    }
    
    if (step === 3) {
      if (!formData.image_url) {
        newErrors.image_url = "Adicione uma imagem para sua campanha";
      }
    }
    
    if (step === 5) {
      if (!formData.creator_name || formData.creator_name.length < 2) {
        newErrors.creator_name = "Nome do criador é obrigatório";
      }
      if (formData.creator_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.creator_email)) {
        newErrors.creator_email = "Email inválido";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      // Create campaign
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          short_description: formData.short_description,
          full_description: formData.full_description,
          image_url: formData.image_url,
          category: formData.category,
          goal_amount: formData.goal_amount,
          end_date: formData.end_date,
          creator_name: formData.creator_name,
          creator_email: formData.creator_email || undefined,
          risks: formData.risks || undefined,
          user_id: user?.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar campanha");
      }
      
      const campaignId = data.campaign_id;
      
      // Create rewards
      for (const reward of formData.rewards) {
        if (reward.title && reward.description) {
          await fetch("/api/rewards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              campaign_id: campaignId,
              title: reward.title,
              description: reward.description,
              min_amount: reward.min_amount,
              estimated_delivery: reward.estimated_delivery,
              items_included: reward.items_included.filter(i => i.trim()),
              limited_quantity: reward.limited_quantity || undefined,
            }),
          });
        }
      }
      
      navigate(`/campaign/${campaignId}`);
    } catch (error) {
      console.error(error);
      setErrors({ submit: error instanceof Error ? error.message : "Erro ao criar campanha" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-white">Criar Campanha</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Mobile: Compact progress indicator */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              Etapa {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm text-white/60">
              {STEPS[currentStep - 1].title}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentStep >= step.id ? "bg-violet-500" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Full progress steps */}
        <div className="hidden sm:flex items-center justify-between mb-12">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-sm ${isActive ? "text-white" : "text-white/50"}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 mt-[-1.5rem] ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-8">
          {/* Step 1: Básico */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Informações Básicas</h2>
                <p className="text-white/60">Comece com um título chamativo e categoria</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Título da Campanha *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Ex: Livro ilustrado sobre sustentabilidade"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.title ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Descrição Curta *
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => updateField("short_description", e.target.value)}
                  placeholder="Uma frase impactante que resume sua campanha"
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.short_description ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none`}
                />
                {errors.short_description && <p className="mt-1 text-sm text-red-400">{errors.short_description}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.category ? "border-red-500" : "border-white/10"
                  } text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                >
                  <option value="" className="bg-slate-900">Selecione uma categoria</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Detalhes */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Detalhes do Projeto</h2>
                <p className="text-white/60">Conte sua história e defina sua meta</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Descrição Completa *
                </label>
                <textarea
                  value={formData.full_description}
                  onChange={(e) => updateField("full_description", e.target.value)}
                  placeholder="Descreva seu projeto em detalhes: o que é, por que é importante, como será realizado..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.full_description ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none`}
                />
                {errors.full_description && <p className="mt-1 text-sm text-red-400">{errors.full_description}</p>}
                <p className="mt-1 text-sm text-white/40">{formData.full_description.length}/50 caracteres mínimos</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Meta de Arrecadação (R$) *
                  </label>
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
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Data de Encerramento *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateField("end_date", e.target.value)}
                    min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
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
                  placeholder="Seja transparente sobre possíveis desafios na execução do projeto"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Mídia */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Imagem da Campanha</h2>
                <p className="text-white/60">Uma boa imagem aumenta suas chances de sucesso</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  URL da Imagem Principal *
                </label>
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
                <p className="mt-1 text-sm text-white/40">Use imagens do Unsplash, Pexels ou seu próprio servidor</p>
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
          )}

          {/* Step 4: Recompensas */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Recompensas</h2>
                  <p className="text-white/60">Ofereça benefícios exclusivos para apoiadores</p>
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
                  <p className="text-sm text-white/30 mt-1">Recompensas são opcionais, mas aumentam a motivação dos apoiadores</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.rewards.map((reward, index) => (
                    <div key={reward.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Recompensa #{index + 1}</h3>
                        <button
                          onClick={() => removeReward(reward.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                          placeholder="Descreva o que o apoiador receberá..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                              <button
                                onClick={() => removeRewardItem(reward.id, itemIndex)}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addRewardItem(reward.id)}
                          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          + Adicionar item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Criador */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Sobre Você</h2>
                <p className="text-white/60">Apresente-se para os apoiadores</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  value={formData.creator_name}
                  onChange={(e) => updateField("creator_name", e.target.value)}
                  placeholder="Como você quer ser chamado"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.creator_name ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                />
                {errors.creator_name && <p className="mt-1 text-sm text-red-400">{errors.creator_name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email de Contato
                </label>
                <input
                  type="email"
                  value={formData.creator_email}
                  onChange={(e) => updateField("creator_email", e.target.value)}
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.creator_email ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                />
                {errors.creator_email && <p className="mt-1 text-sm text-red-400">{errors.creator_email}</p>}
              </div>
              
              {errors.submit && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                  <p className="text-red-300">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                currentStep === 1
                  ? "opacity-50 cursor-not-allowed text-white/50"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Anterior
            </button>
            
            {currentStep < STEPS.length ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all"
              >
                Próximo
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Publicar Campanha
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
