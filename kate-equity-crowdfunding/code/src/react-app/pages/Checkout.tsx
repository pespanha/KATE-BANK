import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { ArrowLeft, Check, Gift, Loader2, CreditCard, User, Mail, Heart, Shield } from "lucide-react";
import Header from "@/react-app/components/Header";
import Footer from "@/react-app/components/Footer";
import { useCampaignDetail, type RewardDetail } from "@/react-app/hooks/useCampaignDetail";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const rewardId = searchParams.get("reward");

  const { campaign, loading: campaignLoading } = useCampaignDetail(id);
  
  const [selectedReward, setSelectedReward] = useState<RewardDetail | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [backerName, setBackerName] = useState("");
  const [backerEmail, setBackerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set selected reward when campaign loads
  useEffect(() => {
    if (campaign && rewardId) {
      const reward = campaign.rewards.find(r => r.id === parseInt(rewardId));
      if (reward) {
        setSelectedReward(reward);
        setCustomAmount(reward.minAmount.toString());
      }
    }
  }, [campaign, rewardId]);

  const minAmount = selectedReward ? selectedReward.minAmount : 1;
  const currentAmount = parseFloat(customAmount) || 0;
  const isValidAmount = currentAmount >= minAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign || !isValidAmount || !backerName.trim() || !backerEmail.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          campaign_id: campaign.id,
          reward_id: selectedReward?.id || null,
          amount: currentAmount,
          backer_name: backerName.trim(),
          backer_email: backerEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar apoio");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Not found
  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campanha não encontrada</h1>
          <Link to="/" className="text-violet-600 hover:text-violet-700 font-medium">
            Voltar para a página inicial
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-emerald-500 fill-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Obrigado pelo apoio!</h1>
            <p className="text-gray-600 mb-6">
              Seu apoio de <span className="font-bold text-violet-600">R$ {currentAmount.toLocaleString("pt-BR")}</span> para{" "}
              <span className="font-medium">{campaign.title}</span> foi registrado com sucesso.
            </p>
            {selectedReward && (
              <div className="bg-violet-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-violet-700 mb-1">Sua recompensa:</p>
                <p className="font-bold text-gray-900">{selectedReward.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Entrega estimada: {selectedReward.estimatedDelivery}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Enviamos um email de confirmação para <span className="font-medium">{backerEmail}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/campaign/${campaign.id}`}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-center"
              >
                Ver campanha
              </Link>
              <Link
                to="/"
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-center"
              >
                Explorar mais projetos
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          to={`/campaign/${campaign.id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-violet-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a campanha
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar apoio</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reward selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Recompensa selecionada
                  </label>
                  
                  {/* No reward option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReward(null);
                      setCustomAmount("");
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-3 ${
                      !selectedReward
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !selectedReward ? "border-violet-500 bg-violet-500" : "border-gray-300"
                      }`}>
                        {!selectedReward && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Apoio sem recompensa</p>
                        <p className="text-sm text-gray-500">Contribua com qualquer valor a partir de R$ 1</p>
                      </div>
                    </div>
                  </button>

                  {/* Reward options */}
                  {campaign.rewards.map((reward) => {
                    const isSelected = selectedReward?.id === reward.id;
                    const isSoldOut = reward.limitedQuantity !== null && 
                      reward.claimedCount >= reward.limitedQuantity;
                    
                    return (
                      <button
                        key={reward.id}
                        type="button"
                        onClick={() => {
                          if (!isSoldOut) {
                            setSelectedReward(reward);
                            setCustomAmount(reward.minAmount.toString());
                          }
                        }}
                        disabled={isSoldOut}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-3 ${
                          isSoldOut
                            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 hover:border-violet-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold text-gray-900">{reward.title}</p>
                              <p className="font-bold text-violet-600">R$ {reward.minAmount}+</p>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                            {reward.itemsIncluded.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Gift className="w-3 h-3" />
                                {reward.itemsIncluded.length} item(s) incluído(s)
                              </div>
                            )}
                            {isSoldOut && (
                              <p className="text-sm text-red-500 font-medium mt-2">Esgotado</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do apoio
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min={minAmount}
                      step="0.01"
                      placeholder={minAmount.toString()}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        customAmount && !isValidAmount
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-violet-500"
                      }`}
                    />
                  </div>
                  {selectedReward && (
                    <p className="text-sm text-gray-500 mt-1">
                      Valor mínimo para esta recompensa: R$ {selectedReward.minAmount}
                    </p>
                  )}
                  {customAmount && !isValidAmount && (
                    <p className="text-sm text-red-500 mt-1">
                      O valor mínimo é R$ {minAmount}
                    </p>
                  )}
                </div>

                {/* Backer info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-violet-500" />
                    Seus dados
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={backerName}
                      onChange={(e) => setBackerName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={backerEmail}
                        onChange={(e) => setBackerEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !isValidAmount || !backerName.trim() || !backerEmail.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirmar apoio de R$ {currentAmount > 0 ? currentAmount.toLocaleString("pt-BR") : "0"}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                  <Shield className="w-4 h-4" />
                  Seus dados estão seguros e protegidos
                </p>
              </form>
            </div>
          </div>

          {/* Summary column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Resumo do apoio</h2>
              
              {/* Campaign info */}
              <div className="flex gap-4 pb-4 border-b border-gray-100">
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 line-clamp-2">{campaign.title}</p>
                  <p className="text-sm text-gray-500 mt-1">por {campaign.creatorName}</p>
                </div>
              </div>

              {/* Selected reward */}
              {selectedReward && (
                <div className="py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Recompensa</p>
                  <p className="font-medium text-gray-900">{selectedReward.title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Entrega: {selectedReward.estimatedDelivery}
                  </p>
                </div>
              )}

              {/* Amount */}
              <div className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Valor do apoio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {currentAmount > 0 ? currentAmount.toLocaleString("pt-BR") : "0"}
                  </p>
                </div>
              </div>

              {/* Progress info */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Arrecadado</span>
                  <span>R$ {campaign.currentAmount.toLocaleString("pt-BR")}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ 
                      width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                  <span>{campaign.backersCount} apoiadores</span>
                  <span>{campaign.daysLeft} dias restantes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
