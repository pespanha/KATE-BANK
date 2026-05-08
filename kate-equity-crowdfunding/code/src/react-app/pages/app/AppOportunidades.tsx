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
  Building2,
  Zap,
  Leaf,
  Cpu,
  Landmark,
  BarChart3,
  Heart,
  Bell
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

export default function AppOportunidades() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [minInvestmentFilter, setMinInvestmentFilter] = useState<string>("");
  const [watchlist, setWatchlist] = useState<number[]>([]);

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
      
      const res = await fetch(`/api/offers?${params}`, { credentials: "include" });
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

  const toggleWatchlist = (offerId: number) => {
    setWatchlist(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    );
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchTerm || 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.short_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMinInvestment = !minInvestmentFilter || 
      offer.min_investment <= parseInt(minInvestmentFilter);
    
    return matchesSearch && matchesMinInvestment;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setMinInvestmentFilter("");
  };

  const hasActiveFilters = selectedCategory !== "all" || minInvestmentFilter || searchTerm;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-deep">Oportunidades</h1>
          <p className="text-gray-500 mt-1">
            Explore ofertas abertas para investimento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-navy border border-kate-border rounded-xl hover:bg-gray-50 transition-colors">
            <Bell className="w-4 h-4" />
            Alertas
          </button>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="bg-white rounded-2xl border border-kate-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, setor ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl text-navy-deep placeholder-gray-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {CATEGORIES.slice(0, 5).map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gold text-navy-deep"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-kate-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filtros:</span>
          </div>

          <select
            value={minInvestmentFilter}
            onChange={(e) => setMinInvestmentFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-kate-border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white"
          >
            <option value="">Investimento mín.</option>
            <option value="500">Até R$ 500</option>
            <option value="1000">Até R$ 1.000</option>
            <option value="5000">Até R$ 5.000</option>
            <option value="10000">Até R$ 10.000</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-kate-border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gold-hover hover:underline"
            >
              Limpar filtros
            </button>
          )}

          <div className="ml-auto text-sm text-gray-500">
            {filteredOffers.length} {filteredOffers.length === 1 ? 'oferta' : 'ofertas'}
          </div>
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold-hover rounded-full text-sm">
              {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              <button onClick={() => setSelectedCategory("all")} className="hover:opacity-70">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {minInvestmentFilter && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold-hover rounded-full text-sm">
              Até R$ {parseInt(minInvestmentFilter).toLocaleString("pt-BR")}
              <button onClick={() => setMinInvestmentFilter("")} className="hover:opacity-70">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold-hover rounded-full text-sm">
              "{searchTerm}"
              <button onClick={() => setSearchTerm("")} className="hover:opacity-70">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : filteredOffers.length === 0 ? (
        <EmptyState searchTerm={searchTerm} onClear={clearFilters} />
      ) : (
        <div className="grid gap-4">
          {filteredOffers.map(offer => (
            <OfferCard 
              key={offer.id} 
              offer={offer} 
              isWatched={watchlist.includes(offer.id)}
              onToggleWatch={() => toggleWatchlist(offer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ searchTerm, onClear }: { searchTerm: string; onClear: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Sparkles className="w-8 h-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-navy-deep mb-2">
        Nenhuma oportunidade encontrada
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {searchTerm 
          ? "Não encontramos ofertas que correspondam à sua busca. Tente outros termos ou ajuste os filtros." 
          : "Novas oportunidades de investimento serão adicionadas em breve."}
      </p>
      {searchTerm && (
        <button
          onClick={onClear}
          className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

interface OfferCardProps {
  offer: Offer;
  isWatched: boolean;
  onToggleWatch: () => void;
}

function OfferCard({ offer, isWatched, onToggleWatch }: OfferCardProps) {
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
    <div className="group bg-white rounded-2xl border border-kate-border overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-56 h-44 sm:h-auto relative overflow-hidden flex-shrink-0">
          <img
            src={offer.image_url || "https://images.unsplash.com/photo-1560472355-536de3962603?w=600"}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-navy-deep text-xs font-semibold rounded-lg">
            <CategoryIcon className="w-3.5 h-3.5" />
            {offer.category}
          </span>
          {daysLeft <= 7 && daysLeft > 0 && (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
              {daysLeft}d restantes
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <Link 
                to={`/oferta/${offer.slug || offer.id}`}
                className="text-lg font-bold text-navy-deep group-hover:text-gold-hover transition-colors hover:underline"
              >
                {offer.title}
              </Link>
              <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                {offer.short_description}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleWatch();
              }}
              className={`p-2 rounded-xl transition-colors ${
                isWatched 
                  ? "bg-red-50 text-red-500" 
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
              title={isWatched ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={`w-5 h-5 ${isWatched ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-end justify-between mb-1.5">
              <div>
                <span className="text-xl font-bold text-navy-deep">
                  {formatCurrency(offer.current_amount)}
                </span>
                <span className="text-gray-400 text-sm ml-1.5">
                  / {formatCurrency(offer.min_goal)}
                </span>
              </div>
              <span className={`text-sm font-semibold ${progress >= 100 ? "text-green-600" : "text-gold"}`}>
                {progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 100 
                    ? "bg-gradient-to-r from-green-500 to-green-400" 
                    : "bg-gradient-to-r from-gold to-gold-hover"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Users className="w-4 h-4" />
              <span><strong className="text-navy-deep">{offer.investors_count}</strong> investidores</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-4 h-4" />
              <span><strong className="text-navy-deep">{daysLeft}</strong> dias</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <TrendingUp className="w-4 h-4" />
              <span>Mín. <strong className="text-navy-deep">R$ {offer.min_investment.toLocaleString("pt-BR")}</strong></span>
            </div>
            {offer.equity_offered && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <BarChart3 className="w-4 h-4" />
                <span><strong className="text-navy-deep">{offer.equity_offered}</strong></span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-kate-border">
            <Link
              to={`/oferta/${offer.slug || offer.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
            >
              Ver detalhes
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/oferta/${offer.slug || offer.id}#investir`}
              className="px-4 py-2.5 border border-navy text-navy font-medium rounded-xl hover:bg-navy hover:text-white transition-colors"
            >
              Investir
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
