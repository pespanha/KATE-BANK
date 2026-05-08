import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Users,
  ChevronRight,
  Loader2,
  Sparkles,
  Filter,
  X,
  SlidersHorizontal,
  Building2,
  Zap,
  Leaf,
  Cpu,
  Landmark,
  BarChart3
} from "lucide-react";

interface Offer {
  id: number;
  title: string;
  slug: string;
  short_description: string;
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
  status: string;
}

const CATEGORIES = [
  { id: "all", label: "Todas", icon: BarChart3 },
  { id: "energia", label: "Energia", icon: Zap },
  { id: "agronegocio", label: "Agronegócio", icon: Leaf },
  { id: "tecnologia", label: "Tecnologia", icon: Cpu },
  { id: "imobiliario", label: "Imobiliário", icon: Building2 },
  { id: "infraestrutura", label: "Infraestrutura", icon: Landmark },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Mais recentes" },
  { id: "ending", label: "Encerrando em breve" },
  { id: "popular", label: "Mais populares" },
  { id: "funded", label: "Mais captado" },
];

export default function Oportunidades() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [minInvestmentFilter, setMinInvestmentFilter] = useState<string>("");

  useEffect(() => {
    fetchOffers();
  }, [selectedCategory, sortBy]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", "active");
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      params.append("sort", sortBy);
      
      const res = await fetch(`/api/offers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } catch (e) {
      console.error("Error fetching offers:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchTerm || 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.short_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMinInvestment = !minInvestmentFilter || 
      offer.min_investment <= parseInt(minInvestmentFilter);
    
    return matchesSearch && matchesMinInvestment;
  });

  const activeCount = offers.length;

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(247,163,18,0.15),transparent_70%)]" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Oportunidades de <span className="text-gold">Investimento</span>
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Explore empresas cuidadosamente selecionadas e invista em projetos 
              com alto potencial de crescimento. Tokenização via Hathor Network.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, setor ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-12 py-4 bg-white rounded-2xl text-navy-deep placeholder-gray-400 focus:ring-2 focus:ring-gold/50 outline-none shadow-xl"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-kate-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">
                  <strong className="text-navy-deep">{activeCount}</strong> ofertas ativas
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy hover:bg-gray-50 rounded-xl transition-colors md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
              <div className="bg-white rounded-2xl border border-kate-border p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-navy-deep flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 mb-3 block">
                    Categoria
                  </label>
                  <div className="space-y-1">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                            selectedCategory === cat.id
                              ? "bg-gold/10 text-gold-hover font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Min Investment Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 mb-3 block">
                    Investimento mínimo até
                  </label>
                  <select
                    value={minInvestmentFilter}
                    onChange={(e) => setMinInvestmentFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-kate-border rounded-xl text-sm focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
                  >
                    <option value="">Qualquer valor</option>
                    <option value="500">Até R$ 500</option>
                    <option value="1000">Até R$ 1.000</option>
                    <option value="5000">Até R$ 5.000</option>
                    <option value="10000">Até R$ 10.000</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-3 block">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 border border-kate-border rounded-xl text-sm focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedCategory !== "all" || minInvestmentFilter || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setMinInvestmentFilter("");
                      setSearchTerm("");
                    }}
                    className="mt-4 w-full px-4 py-2 text-sm text-gold-hover hover:bg-gold/5 rounded-xl transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </aside>

            {/* Results */}
            <main className="flex-1">
              {/* Active Filters Pills */}
              {(selectedCategory !== "all" || minInvestmentFilter || searchTerm) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold-hover rounded-full text-sm">
                      {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                      <button onClick={() => setSelectedCategory("all")}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {minInvestmentFilter && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold-hover rounded-full text-sm">
                      Até R$ {parseInt(minInvestmentFilter).toLocaleString("pt-BR")}
                      <button onClick={() => setMinInvestmentFilter("")}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold-hover rounded-full text-sm">
                      "{searchTerm}"
                      <button onClick={() => setSearchTerm("")}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
              ) : filteredOffers.length === 0 ? (
                <EmptyState searchTerm={searchTerm} onClear={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setMinInvestmentFilter("");
                }} />
              ) : (
                <div className="grid gap-6">
                  {filteredOffers.map(offer => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-navy-deep to-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Quer captar recursos para sua empresa?
          </h2>
          <p className="text-white/70 mb-8">
            A Kate conecta empresas inovadoras a uma comunidade de investidores qualificados.
            Submeta seu projeto e descubra se sua empresa está pronta para uma rodada de equity crowdfunding.
          </p>
          <Link
            to="/captar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
          >
            Submeter meu projeto
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ searchTerm, onClear }: { searchTerm: string; onClear: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-gold" />
      </div>
      <h3 className="text-xl font-semibold text-navy-deep mb-3">
        Nenhuma oportunidade encontrada
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {searchTerm 
          ? "Não encontramos ofertas que correspondam à sua busca. Tente outros termos ou ajuste os filtros." 
          : "Novas oportunidades de investimento serão adicionadas em breve. Cadastre-se para ser notificado."}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {searchTerm && (
          <button
            onClick={onClear}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Limpar busca
          </button>
        )}
        <Link
          to="/onboarding"
          className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}

interface OfferCardProps {
  offer: Offer;
}

function OfferCard({ offer }: OfferCardProps) {
  const progress = Math.min(100, Math.round((offer.current_amount / offer.min_goal) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(offer.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category.toLowerCase());
    return cat?.icon || BarChart3;
  };

  const CategoryIcon = getCategoryIcon(offer.category);

  return (
    <Link
      to={`/oferta/${offer.slug || offer.id}`}
      className="group bg-white rounded-2xl border border-kate-border overflow-hidden hover:border-gold/50 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-64 h-48 sm:h-auto relative overflow-hidden">
          <img
            src={offer.image_url || "https://images.unsplash.com/photo-1560472355-536de3962603?w=600"}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-navy-deep text-xs font-semibold rounded-lg">
            <CategoryIcon className="w-3.5 h-3.5" />
            {offer.category}
          </span>
          {daysLeft <= 7 && daysLeft > 0 && (
            <span className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">
              Últimos dias!
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-navy-deep group-hover:text-gold-hover transition-colors mb-2">
                {offer.title}
              </h3>
              <p className="text-gray-500 line-clamp-2">
                {offer.short_description}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 group-hover:bg-gold/10 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gold transition-colors" />
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className="text-2xl font-bold text-navy-deep">
                  {formatCurrency(offer.current_amount)}
                </span>
                <span className="text-gray-500 ml-2">
                  de {formatCurrency(offer.min_goal)}
                </span>
              </div>
              <span className="text-lg font-semibold text-gold">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-hover rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-navy/60" />
              <span><strong className="text-navy-deep">{offer.investors_count}</strong> investidores</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-navy/60" />
              <span><strong className="text-navy-deep">{daysLeft}</strong> dias restantes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <TrendingUp className="w-4 h-4 text-navy/60" />
              <span>Mín. <strong className="text-navy-deep">R$ {offer.min_investment.toLocaleString("pt-BR")}</strong></span>
            </div>
            {offer.equity_offered && (
              <div className="flex items-center gap-2 text-gray-600">
                <BarChart3 className="w-4 h-4 text-navy/60" />
                <span><strong className="text-navy-deep">{offer.equity_offered}</strong> equity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
