import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Clock, Users, Share2, Heart, ChevronRight, AlertTriangle, HelpCircle, Loader2, ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/react-app/hooks/useAuth";
import Header from "@/react-app/components/Header";
import Footer from "@/react-app/components/Footer";
import RewardCard from "@/react-app/components/RewardCard";
import ProgressTracker from "@/react-app/components/ProgressTracker";
import Comments from "@/react-app/components/Comments";
import { useCampaignDetail, type RewardDetail } from "@/react-app/hooks/useCampaignDetail";

type Tab = "about" | "updates" | "faq" | "comments";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [isLiked, setIsLiked] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { campaign, loading, error } = useCampaignDetail(id);

  // Check if current user is the campaign owner
  const isOwner = user && campaign?.userId === user.id;

  // Loading state
  if (loading) {
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

  // Error or not found state
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Campanha não encontrada"}
          </h1>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página inicial
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const progressPercent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
  const isFullyFunded = campaign.currentAmount >= campaign.goalAmount;

  const handleSelectReward = (reward: RewardDetail) => {
    navigate(`/campaign/${id}/checkout?reward=${reward.id}`);
  };

  const handleSupportWithoutReward = () => {
    navigate(`/campaign/${id}/checkout`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "Sobre" },
    { id: "updates", label: `Atualizações (${campaign.updates.length})` },
    { id: "faq", label: "FAQ" },
    { id: "comments", label: "Comentários" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-violet-600 transition-colors">
              Início
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/explore" className="text-gray-500 hover:text-violet-600 transition-colors">
              {campaign.category}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate">{campaign.title}</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              {isFullyFunded && (
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-full shadow-lg">
                    META ATINGIDA 🎉
                  </span>
                </div>
              )}
            </div>

            {/* Campaign title and creator - Mobile only */}
            <div className="lg:hidden">
              <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full mb-3">
                {campaign.category}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
              <div className="flex items-center gap-3">
                <img
                  src={campaign.creatorAvatar}
                  alt={campaign.creatorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{campaign.creatorName}</p>
                  <p className="text-sm text-gray-500">Criador</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 sm:pb-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                      activeTab === tab.id
                        ? "border-violet-500 text-violet-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
              {activeTab === "about" && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-lg text-gray-600 mb-6">{campaign.shortDescription}</p>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {campaign.fullDescription}
                  </div>
                  
                  {campaign.risks && (
                    <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        Riscos e Desafios
                      </div>
                      <p className="text-amber-800">{campaign.risks}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "updates" && (
                <div className="space-y-6">
                  {campaign.updates.length > 0 ? (
                    campaign.updates.map((update) => (
                      <div key={update.id} className="border-l-4 border-violet-500 pl-4 py-2">
                        <p className="text-sm text-gray-500 mb-1">{formatDate(update.createdAt)}</p>
                        <h3 className="font-bold text-gray-900 mb-2">{update.title}</h3>
                        <p className="text-gray-600 whitespace-pre-wrap">{update.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma atualização ainda.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "faq" && (
                <div className="space-y-4">
                  {campaign.faqs.length > 0 ? (
                    campaign.faqs.map((faq) => (
                      <div key={faq.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                            <p className="text-gray-600">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma pergunta frequente ainda.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "comments" && (
                <Comments campaignId={campaign.id} />
              )}
            </div>
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Campaign info card - Desktop */}
            <div className="hidden lg:block space-y-6 sticky top-24">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full mb-3">
                  {campaign.category}
                </span>
                <h1 className="text-xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
                
                {/* Creator */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <img
                    src={campaign.creatorAvatar}
                    alt={campaign.creatorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.creatorName}</p>
                    <p className="text-sm text-gray-500">Criador</p>
                  </div>
                </div>
              </div>

              {/* Progress Tracker */}
              <ProgressTracker
                currentAmount={campaign.currentAmount}
                goalAmount={campaign.goalAmount}
                backersCount={campaign.backersCount}
                daysLeft={campaign.daysLeft}
                createdAt={campaign.createdAt}
              />
              
              {/* Stats */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{campaign.backersCount}</p>
                    <p className="text-xs text-gray-500">apoiadores</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{campaign.daysLeft}</p>
                    <p className="text-xs text-gray-500">dias restantes</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <button 
                  onClick={handleSupportWithoutReward}
                  className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                  Apoiar este projeto
                </button>
                {isOwner && (
                  <Link
                    to={`/campaign/${id}/edit`}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar Campanha
                  </Link>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      isLiked
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                    Salvar
                  </button>
                  <button className="flex-1 py-3 px-4 bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 rounded-xl font-medium flex items-center justify-center gap-2 transition-all">
                    <Share2 className="w-5 h-5" />
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile sticky bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-3 sm:p-4 z-50 safe-area-inset-bottom">
              <div className="flex items-center gap-3 sm:gap-4 max-w-lg mx-auto">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    R$ {campaign.currentAmount.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-gray-500">{Math.round(progressPercent)}% • {campaign.daysLeft} dias</p>
                </div>
                <button 
                  onClick={handleSupportWithoutReward}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl text-sm sm:text-base flex-shrink-0"
                >
                  Apoiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards section */}
        <section className="mt-12 lg:pb-0 pb-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Escolha sua recompensa</h2>
          
          {campaign.rewards.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaign.rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  onSelect={handleSelectReward}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-500">Esta campanha ainda não tem recompensas definidas.</p>
            </div>
          )}

          {/* Custom amount */}
          <div className="mt-6 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
            <p className="text-gray-600 mb-4">
              Quer apoiar com outro valor? Faça uma contribuição livre sem recompensa.
            </p>
            <button 
              onClick={handleSupportWithoutReward}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Apoiar sem recompensa
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
