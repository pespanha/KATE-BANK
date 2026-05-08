import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import InvestmentModal from "@/react-app/components/InvestmentModal";
import {
  ArrowLeft,
  Clock,
  Users,
  TrendingUp,
  Target,
  Building2,
  FileText,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Share2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  PieChart,
  Briefcase,
  Globe,
  MapPin,
  BarChart3,
  Shield,
  Sparkles,
  Coins,
  LinkIcon,
  Copy,
  Check
} from "lucide-react";

interface Offer {
  id: number;
  project_id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  image_url: string | null;
  category: string;
  min_goal: number;
  max_goal: number;
  current_amount: number;
  investors_count: number;
  min_investment: number;
  start_date: string;
  end_date: string;
  valuation: string | null;
  equity_offered: string | null;
  use_of_funds: string | null;
  risks: string | null;
  public_docs: string | null;
  status: string;
}

interface Project {
  id: number;
  project_name: string;
  company_name: string | null;
  short_description: string | null;
  full_description: string | null;
  problem_solution: string | null;
  revenue_model: string | null;
  target_market: string | null;
  competitive_advantage: string | null;
  current_revenue: string | null;
  growth_info: string | null;
  key_metrics: string | null;
  team_info: string | null;
  website: string | null;
  address: string | null;
  category: string;
  pitch_deck_url: string | null;
  // Blockchain fields
  token_uid: string | null;
  token_symbol: string | null;
  total_tokens: number | null;
  escrow_address: string | null;
  is_blockchain_verified: number | null;
  current_raised: number | null;
  // NFT fields
  nft_uid: string | null;
  nft_tx_hash: string | null;
  slug: string | null;
  nft_token_link_tx: string | null;
}

interface OfferUpdate {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

type TabId = "about" | "business" | "funds" | "risks" | "docs" | "updates";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "about", label: "Sobre", icon: Building2 },
  { id: "business", label: "Negócio", icon: Briefcase },
  { id: "funds", label: "Uso dos Recursos", icon: PieChart },
  { id: "risks", label: "Riscos", icon: AlertTriangle },
  { id: "docs", label: "Documentos", icon: FileText },
  { id: "updates", label: "Atualizações", icon: Sparkles },
];

export default function OfertaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<OfferUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("about");
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      const res = await fetch(`/api/offers/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Oferta não encontrada");
        } else {
          setError("Erro ao carregar oferta");
        }
        return;
      }
      const data = await res.json();
      setOffer(data.offer);
      setProject(data.project);
      setUpdates(data.updates || []);
    } catch (e) {
      console.error("Error fetching offer:", e);
      setError("Erro ao carregar oferta");
    } finally {
      setLoading(false);
    }
  };

  const handleInvestClick = () => {
    if (!user) {
      navigate("/onboarding");
      return;
    }
    setShowInvestModal(true);
  };

  const handleCloseInvestModal = () => {
    setShowInvestModal(false);
    // Refresh offer data to get updated amounts
    fetchOffer();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy-deep mb-3">{error || "Oferta não encontrada"}</h1>
          <p className="text-gray-500 mb-6">
            A oferta que você está procurando pode ter sido encerrada ou não existe.
          </p>
          <Link
            to="/oportunidades"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Ver todas as oportunidades
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, Math.round((offer.current_amount / offer.min_goal) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(offer.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isEnding = daysLeft <= 7 && daysLeft > 0;
  const isEnded = daysLeft === 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Investment Modal */}
      {offer && (
        <InvestmentModal
          offer={offer}
          isOpen={showInvestModal}
          onClose={handleCloseInvestModal}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-kate-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/oportunidades" className="text-gray-500 hover:text-gold-hover transition-colors">
              Oportunidades
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-navy-deep font-medium truncate">{offer.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(247,163,18,0.1),transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Image */}
            <div className="lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden aspect-video lg:aspect-[4/3]">
                <img
                  src={offer.image_url || "https://images.unsplash.com/photo-1560472355-536de3962603?w=800"}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                
                {/* Status badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-navy-deep text-sm font-semibold rounded-lg">
                    {offer.category}
                  </span>
                  {isEnding && !isEnded && (
                    <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-lg">
                      Últimos dias!
                    </span>
                  )}
                  {isEnded && (
                    <span className="px-3 py-1.5 bg-gray-800 text-white text-sm font-bold rounded-lg">
                      Encerrada
                    </span>
                  )}
                </div>
                
                {/* Share button */}
                <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors">
                  <Share2 className="w-5 h-5 text-navy-deep" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="lg:w-1/2 flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {offer.title}
              </h1>
              <p className="text-lg text-white/80 mb-6">
                {offer.short_description}
              </p>

              {/* Progress Card */}
              <div className="bg-white rounded-2xl p-6 flex-1">
                {/* Amount raised */}
                <div className="mb-4">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-3xl font-bold text-navy-deep">
                        {formatCurrency(offer.current_amount)}
                      </span>
                      <span className="text-gray-500 ml-2">
                        de {formatCurrency(offer.min_goal)}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gold">{progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold-hover rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {offer.max_goal > offer.min_goal && (
                    <p className="text-sm text-gray-500 mt-2">
                      Meta máxima: {formatCurrency(offer.max_goal)}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <Users className="w-5 h-5 text-navy mx-auto mb-1" />
                    <div className="text-lg font-bold text-navy-deep">{offer.investors_count}</div>
                    <div className="text-xs text-gray-500">Investidores</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <Clock className="w-5 h-5 text-navy mx-auto mb-1" />
                    <div className="text-lg font-bold text-navy-deep">{daysLeft}</div>
                    <div className="text-xs text-gray-500">Dias restantes</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <Target className="w-5 h-5 text-navy mx-auto mb-1" />
                    <div className="text-lg font-bold text-navy-deep">R$ {offer.min_investment.toLocaleString("pt-BR")}</div>
                    <div className="text-xs text-gray-500">Mín. investir</div>
                  </div>
                </div>

                {/* Investment details */}
                {(offer.equity_offered || offer.valuation) && (
                  <div className="flex gap-4 mb-6 p-4 bg-gold/5 rounded-xl border border-gold/20">
                    {offer.equity_offered && (
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">Equity oferecido</div>
                        <div className="text-lg font-bold text-navy-deep">{offer.equity_offered}</div>
                      </div>
                    )}
                    {offer.valuation && (
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">Valuation</div>
                        <div className="text-lg font-bold text-navy-deep">{offer.valuation}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA Button */}
                {!isEnded ? (
                  <button
                    onClick={handleInvestClick}
                    className="w-full py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Investir agora
                  </button>
                ) : (
                  <div className="w-full py-4 bg-gray-200 text-gray-500 font-bold text-lg rounded-xl text-center">
                    Captação encerrada
                  </div>
                )}

                <p className="text-xs text-center text-gray-500 mt-3">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  Investimento protegido pela regulamentação CVM 88
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs & Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-4 mb-8 border-b border-kate-border">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-gold text-navy-deep"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "updates" && updates.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-navy/10 text-navy text-xs rounded-full">
                      {updates.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {activeTab === "about" && (
                <TabAbout offer={offer} project={project} />
              )}
              {activeTab === "business" && (
                <TabBusiness project={project} />
              )}
              {activeTab === "funds" && (
                <TabFunds offer={offer} />
              )}
              {activeTab === "risks" && (
                <TabRisks offer={offer} />
              )}
              {activeTab === "docs" && (
                <TabDocs offer={offer} project={project} />
              )}
              {activeTab === "updates" && (
                <TabUpdates updates={updates} formatDate={formatDate} />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Company Info Card */}
                {project && (
                  <div className="bg-white rounded-2xl border border-kate-border p-6">
                    <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gold" />
                      Sobre a empresa
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Nome</div>
                        <div className="font-medium text-navy-deep">
                          {project.company_name || project.project_name}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Setor</div>
                        <div className="font-medium text-navy-deep">{project.category}</div>
                      </div>
                      {project.address && (
                        <div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            Localização
                          </div>
                          <div className="font-medium text-navy-deep">{project.address}</div>
                        </div>
                      )}
                      {project.website && (
                        <a
                          href={project.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gold-hover hover:underline text-sm"
                        >
                          <Globe className="w-4 h-4" />
                          Visitar site
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Dates */}
                <div className="bg-white rounded-2xl border border-kate-border p-6">
                  <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gold" />
                    Datas importantes
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Início</span>
                      <span className="font-medium text-navy-deep text-sm">{formatDate(offer.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Encerramento</span>
                      <span className="font-medium text-navy-deep text-sm">{formatDate(offer.end_date)}</span>
                    </div>
                  </div>
                </div>

                {/* NFT do Projeto Card - Proeminente */}
                {project?.nft_uid && (
                  <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-gold/40 p-6 shadow-lg relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-200/30 rounded-full blur-xl" />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-navy-deep flex items-center gap-2">
                          <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-gold" />
                          </div>
                          NFT do Projeto
                        </h3>
                        <span className="px-2.5 py-1 bg-gold/20 text-gold-hover text-xs font-bold rounded-full uppercase tracking-wide">
                          Certificado
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Este projeto possui um NFT único na blockchain que certifica sua autenticidade e rastreabilidade.
                      </p>
                      
                      {/* NFT UID */}
                      <div className="bg-white/70 rounded-xl p-3 mb-3">
                        <div className="text-xs text-gray-500 mb-1">NFT UID</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-navy-deep font-mono flex-1 truncate">
                            {truncateAddress(project.nft_uid)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(project.nft_uid!, 'nft')}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Copiar"
                          >
                            {copiedField === 'nft' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <a
                            href={`https://explorer.hathor.network/token_detail/${project.nft_uid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Ver no Hathor Explorer"
                          >
                            <ExternalLink className="w-4 h-4 text-gold" />
                          </a>
                        </div>
                      </div>
                      
                      {/* NFT TX Hash */}
                      {project.nft_tx_hash && (
                        <div className="bg-white/70 rounded-xl p-3 mb-3">
                          <div className="text-xs text-gray-500 mb-1">Transação de Criação</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-navy-deep font-mono flex-1 truncate">
                              {truncateAddress(project.nft_tx_hash)}
                            </code>
                            <a
                              href={`https://explorer.hathor.network/transaction/${project.nft_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Ver transação"
                            >
                              <ExternalLink className="w-4 h-4 text-gold" />
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {/* NFT↔Token Link */}
                      {project.nft_token_link_tx && (
                        <div className="bg-green-50 rounded-xl p-3 mb-3 border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <LinkIcon className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">NFT vinculado ao Token</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-green-800 font-mono flex-1 truncate">
                              {truncateAddress(project.nft_token_link_tx)}
                            </code>
                            <a
                              href={`https://explorer.hathor.network/transaction/${project.nft_token_link_tx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-green-100 rounded transition-colors"
                              title="Ver vinculação"
                            >
                              <ExternalLink className="w-4 h-4 text-green-600" />
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {/* Verification Link */}
                      {project.slug && (
                        <Link
                          to={`/app/verificacao/${project.slug}`}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors mt-4"
                        >
                          <Shield className="w-4 h-4" />
                          Ver Página de Verificação
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Tokenization Card */}
                {project?.token_uid && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
                    <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-purple-600" />
                      Tokenização Blockchain
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Token Info */}
                      <div className="bg-white/60 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Token do Projeto</div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-deep text-lg">{project.token_symbol}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Hathor Network
                          </span>
                        </div>
                      </div>
                      
                      {/* Token UID */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Token UID</div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-navy-deep font-mono bg-white/60 px-2 py-1 rounded flex-1 truncate">
                            {truncateAddress(project.token_uid)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(project.token_uid!, 'token')}
                            className="p-1.5 hover:bg-white/60 rounded transition-colors"
                            title="Copiar"
                          >
                            {copiedField === 'token' ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                          <a
                            href={`https://explorer.hathor.network/token_detail/${project.token_uid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-white/60 rounded transition-colors"
                            title="Ver no Explorer"
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                          </a>
                        </div>
                      </div>
                      
                      {/* Escrow Address */}
                      {project.escrow_address && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Endereço Escrow</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-navy-deep font-mono bg-white/60 px-2 py-1 rounded flex-1 truncate">
                              {truncateAddress(project.escrow_address)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(project.escrow_address!, 'escrow')}
                              className="p-1.5 hover:bg-white/60 rounded transition-colors"
                              title="Copiar"
                            >
                              {copiedField === 'escrow' ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </button>
                            <a
                              href={`https://explorer.hathor.network/address/${project.escrow_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-white/60 rounded transition-colors"
                              title="Ver no Explorer"
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {/* Token Stats */}
                      {project.total_tokens && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-white/60 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-navy-deep">
                              {project.total_tokens.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-500">Total Tokens</div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-green-600">
                              {project.is_blockchain_verified ? '✓' : '○'}
                            </div>
                            <div className="text-xs text-gray-500">Verificado</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Security Note */}
                      <div className="flex items-start gap-2 pt-2 border-t border-purple-200">
                        <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600">
                          Investimentos tokenizados na Hathor Network garantem transparência e rastreabilidade.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Help Card */}
                <div className="bg-gradient-to-br from-navy/5 to-gold/5 rounded-2xl p-6 border border-kate-border">
                  <h3 className="font-semibold text-navy-deep mb-2">Tem dúvidas?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Nossa equipe está pronta para ajudar você a entender melhor esta oportunidade.
                  </p>
                  <Link
                    to="/como-funciona"
                    className="text-sm font-medium text-gold-hover hover:underline flex items-center gap-1"
                  >
                    Saiba como funciona
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA (mobile sticky) */}
      {!isEnded && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-kate-border p-4 z-50">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex-1">
              <div className="text-sm text-gray-500">A partir de</div>
              <div className="font-bold text-navy-deep">R$ {offer.min_investment.toLocaleString("pt-BR")}</div>
            </div>
            <button
              onClick={handleInvestClick}
              className="flex-1 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-colors"
            >
              Investir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Components
function TabAbout({ offer, project }: { offer: Offer; project: Project | null }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-kate-border p-6">
        <h2 className="text-xl font-bold text-navy-deep mb-4">Sobre a oportunidade</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 whitespace-pre-wrap">{offer.full_description}</p>
        </div>
      </div>

      {project?.problem_solution && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h2 className="text-xl font-bold text-navy-deep mb-4">Problema & Solução</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{project.problem_solution}</p>
        </div>
      )}
    </div>
  );
}

function TabBusiness({ project }: { project: Project | null }) {
  if (!project) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <p className="text-gray-500">Informações do negócio não disponíveis.</p>
      </div>
    );
  }

  const sections = [
    { title: "Modelo de Receita", content: project.revenue_model },
    { title: "Mercado Alvo", content: project.target_market },
    { title: "Diferencial Competitivo", content: project.competitive_advantage },
    { title: "Receita Atual", content: project.current_revenue },
    { title: "Crescimento", content: project.growth_info },
    { title: "Métricas Chave", content: project.key_metrics },
    { title: "Equipe", content: project.team_info },
  ].filter(s => s.content);

  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Detalhes do negócio serão adicionados em breve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <div key={i} className="bg-white rounded-2xl border border-kate-border p-6">
          <h2 className="text-xl font-bold text-navy-deep mb-4">{section.title}</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{section.content}</p>
        </div>
      ))}
    </div>
  );
}

function TabFunds({ offer }: { offer: Offer }) {
  if (!offer.use_of_funds) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Informações sobre uso dos recursos serão disponibilizadas em breve.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-kate-border p-6">
      <h2 className="text-xl font-bold text-navy-deep mb-4">Como os recursos serão utilizados</h2>
      <p className="text-gray-600 whitespace-pre-wrap">{offer.use_of_funds}</p>
    </div>
  );
}

function TabRisks({ offer }: { offer: Offer }) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 mb-2">Aviso importante</h3>
            <p className="text-amber-700 text-sm">
              Investir em startups e empresas em crescimento envolve riscos significativos, incluindo a possibilidade de perda total do capital investido. Leia atentamente todos os materiais antes de investir.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-kate-border p-6">
        <h2 className="text-xl font-bold text-navy-deep mb-4">Fatores de Risco</h2>
        {offer.risks ? (
          <p className="text-gray-600 whitespace-pre-wrap">{offer.risks}</p>
        ) : (
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-navy/60 flex-shrink-0 mt-0.5" />
              <span>Risco de mercado: condições econômicas podem afetar o desempenho da empresa</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-navy/60 flex-shrink-0 mt-0.5" />
              <span>Risco de liquidez: pode não haver mercado secundário para revenda dos tokens</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-navy/60 flex-shrink-0 mt-0.5" />
              <span>Risco operacional: a empresa pode não atingir suas metas de crescimento</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-navy/60 flex-shrink-0 mt-0.5" />
              <span>Risco de diluição: futuras rodadas podem diluir sua participação</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

function TabDocs({ offer, project }: { offer: Offer; project: Project | null }) {
  const publicDocs = offer.public_docs ? JSON.parse(offer.public_docs) : null;
  
  const allDocs = [
    { name: "Pitch Deck", url: project?.pitch_deck_url },
    ...(publicDocs || [])
  ].filter(d => d.url);

  if (allDocs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Documentos públicos serão disponibilizados em breve.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-kate-border p-6">
      <h2 className="text-xl font-bold text-navy-deep mb-4">Documentos Públicos</h2>
      <div className="space-y-3">
        {allDocs.map((doc, i) => (
          <a
            key={i}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-navy" />
              <span className="font-medium text-navy-deep">{doc.name}</span>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        ))}
      </div>
    </div>
  );
}

function TabUpdates({ updates, formatDate }: { updates: OfferUpdate[]; formatDate: (d: string) => string }) {
  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Nenhuma atualização publicada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map(update => (
        <div key={update.id} className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            {formatDate(update.created_at)}
          </div>
          <h3 className="text-lg font-bold text-navy-deep mb-3">{update.title}</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{update.content}</p>
        </div>
      ))}
    </div>
  );
}
