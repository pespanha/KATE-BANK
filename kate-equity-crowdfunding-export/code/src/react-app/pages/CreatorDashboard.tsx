import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Plus,
  ChevronRight,
  Target,
  Gift,
  Loader2,
  BarChart3,
  FileText,
  LogIn,
} from "lucide-react";
import Header from "@/react-app/components/Header";
import Footer from "@/react-app/components/Footer";

interface CreatorCampaign {
  id: number;
  title: string;
  short_description: string;
  image_url: string;
  category: string;
  goal_amount: number;
  current_amount: number;
  backers_count: number;
  end_date: string;
  status: string;
  is_featured: number;
  created_at: string;
  days_left: number;
}

interface Pledge {
  id: number;
  campaign_id: number;
  campaign_title: string;
  reward_id: number | null;
  reward_title: string | null;
  amount: number;
  backer_name: string;
  backer_email: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  totalRaised: number;
  totalBackers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  fundedCampaigns: number;
}

export default function CreatorDashboard() {
  const { user, isPending, redirectToLogin } = useAuth();

  const [campaigns, setCampaigns] = useState<CreatorCampaign[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "pledges">("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch creator's campaigns
        const campaignsRes = await fetch(`/api/creator/campaigns?user_id=${encodeURIComponent(user.id)}`);
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);

        // Fetch all pledges for creator's campaigns
        const pledgesRes = await fetch(`/api/creator/pledges?user_id=${encodeURIComponent(user.id)}`);
        const pledgesData = await pledgesRes.json();
        setPledges(pledgesData.pledges || []);

        // Calculate stats
        const creatorCampaigns = campaignsData.campaigns || [];

        setStats({
          totalRaised: creatorCampaigns.reduce((sum: number, c: CreatorCampaign) => sum + c.current_amount, 0),
          totalBackers: creatorCampaigns.reduce((sum: number, c: CreatorCampaign) => sum + c.backers_count, 0),
          totalCampaigns: creatorCampaigns.length,
          activeCampaigns: creatorCampaigns.filter((c: CreatorCampaign) => c.status === "active").length,
          fundedCampaigns: creatorCampaigns.filter((c: CreatorCampaign) => c.current_amount >= c.goal_amount).length,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Loading auth state
  if (isPending) {
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

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard do Criador
            </h1>
            <p className="text-gray-600 mb-8">
              Faça login para acessar suas campanhas e gerenciar seus apoiadores.
            </p>

            <button
              onClick={redirectToLogin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Entrar com Google
            </button>

            <p className="text-sm text-gray-500 mt-6">
              Ainda não tem uma campanha?{" "}
              <Link to="/create" className="text-violet-600 hover:text-violet-700 font-medium">
                Crie uma agora
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading data
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

  const filteredPledges = selectedCampaign
    ? pledges.filter((p) => p.campaign_id === selectedCampaign)
    : pledges;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Criador</h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              Olá, {user.google_user_data?.given_name || user.email}!
            </p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Campanha
          </Link>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-500">Total Arrecadado</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRaised)}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-sm text-gray-500">Total Apoiadores</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBackers}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Campanhas Ativas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-gray-500">Metas Atingidas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.fundedCampaigns}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {[
            { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
            { id: "campaigns", label: "Campanhas", icon: FileText },
            { id: "pledges", label: "Apoios Recebidos", icon: Gift },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-white text-violet-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* No campaigns state */}
        {campaigns.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma campanha encontrada</h2>
            <p className="text-gray-600 mb-6">
              Você ainda não criou nenhuma campanha. Comece agora!
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Campanha
            </Link>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && campaigns.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Campaigns */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-500" />
                Suas Campanhas
              </h2>
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => {
                  const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                  return (
                    <div key={campaign.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/campaign/${campaign.id}`}
                          className="font-medium text-gray-900 hover:text-violet-600 truncate block"
                        >
                          {campaign.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(campaign.current_amount)}</p>
                        <p className="text-sm text-gray-500">{campaign.backers_count} apoiadores</p>
                      </div>
                      <Link
                        to={`/campaign/${campaign.id}`}
                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Pledges */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-violet-500" />
                Apoios Recentes
              </h2>
              {pledges.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum apoio recebido ainda.</p>
              ) : (
                <div className="space-y-3">
                  {pledges.slice(0, 8).map((pledge) => (
                    <div key={pledge.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{pledge.backer_name}</p>
                        <p className="text-xs text-gray-500">{formatDate(pledge.created_at)}</p>
                      </div>
                      <p className="font-bold text-emerald-600">{formatCurrency(pledge.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && campaigns.length > 0 && (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const progress = (campaign.current_amount / campaign.goal_amount) * 100;
              const isFunded = campaign.current_amount >= campaign.goal_amount;

              return (
                <div key={campaign.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-full md:w-48 h-32 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              campaign.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : campaign.status === "funded"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {campaign.status === "active" ? "Ativa" : campaign.status === "funded" ? "Financiada" : "Encerrada"}
                            </span>
                            {campaign.is_featured === 1 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                Destaque
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/campaign/${campaign.id}`}
                            className="text-xl font-bold text-gray-900 hover:text-violet-600 transition-colors"
                          >
                            {campaign.title}
                          </Link>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{campaign.short_description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Arrecadado</p>
                          <p className="font-bold text-gray-900">{formatCurrency(campaign.current_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Meta</p>
                          <p className="font-bold text-gray-900">{formatCurrency(campaign.goal_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Apoiadores</p>
                          <p className="font-bold text-gray-900">{campaign.backers_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Dias Restantes</p>
                          <p className="font-bold text-gray-900">{campaign.days_left}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progresso</span>
                          <span className="font-medium text-gray-900">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFunded
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Link
                          to={`/campaign/${campaign.id}`}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Campanha
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign.id);
                            setActiveTab("pledges");
                          }}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Gift className="w-4 h-4" />
                          Ver Apoios ({campaign.backers_count})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pledges Tab */}
        {activeTab === "pledges" && campaigns.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm">
            {/* Filter */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filtrar por campanha:</label>
                <select
                  value={selectedCampaign || ""}
                  onChange={(e) => setSelectedCampaign(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                >
                  <option value="">Todas as campanhas</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pledges list */}
            {filteredPledges.length === 0 ? (
              <div className="p-12 text-center">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum apoio encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPledges.map((pledge) => (
                  <div key={pledge.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <span className="text-violet-600 font-bold">
                            {pledge.backer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{pledge.backer_name}</p>
                          <p className="text-sm text-gray-500">{pledge.backer_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-lg">{formatCurrency(pledge.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(pledge.created_at)}</p>
                      </div>
                    </div>
                    {pledge.reward_title && (
                      <div className="mt-3 ml-14 flex items-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-violet-500" />
                        <span className="text-gray-600">Recompensa:</span>
                        <span className="font-medium text-gray-900">{pledge.reward_title}</span>
                      </div>
                    )}
                    {!selectedCampaign && (
                      <div className="mt-2 ml-14">
                        <Link
                          to={`/campaign/${pledge.campaign_id}`}
                          className="text-sm text-violet-600 hover:text-violet-700"
                        >
                          {pledge.campaign_title}
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
