import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Check, Flame, Clock, TrendingUp, Target } from "lucide-react";

export interface FilterState {
  search: string;
  category: string;
  sortBy: string;
  fundingStatus: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  totalResults?: number;
}

const SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes", icon: Clock },
  { value: "popular", label: "Mais populares", icon: Flame },
  { value: "trending", label: "Em alta", icon: TrendingUp },
  { value: "ending", label: "Terminando em breve", icon: Target },
];

const FUNDING_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "funded", label: "Meta atingida" },
  { value: "near", label: "Quase lá (>75%)" },
  { value: "halfway", label: "Na metade (>50%)" },
  { value: "starting", label: "Começando (<25%)" },
];

export default function SearchFilters({
  filters,
  onFiltersChange,
  categories,
  totalResults,
}: SearchFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ ...filters, sortBy });
    setShowSortDropdown(false);
  };

  const handleFundingStatusChange = (fundingStatus: string) => {
    onFiltersChange({ ...filters, fundingStatus });
  };

  const clearSearch = () => {
    setSearchInput("");
    onFiltersChange({ ...filters, search: "" });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    onFiltersChange({
      search: "",
      category: "Todos",
      sortBy: "recent",
      fundingStatus: "all",
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.category !== "Todos" || 
    filters.sortBy !== "recent" || 
    filters.fundingStatus !== "all";

  const currentSort = SORT_OPTIONS.find(opt => opt.value === filters.sortBy) || SORT_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar campanhas..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            showFilters || hasActiveFilters
              ? "bg-violet-50 border-violet-200 text-violet-600"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Filtros</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-violet-500 rounded-full" />
          )}
        </button>

        {/* Sort Dropdown */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all text-gray-600"
          >
            <currentSort.icon className="w-5 h-5" />
            <span className="hidden md:inline font-medium">{currentSort.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
          </button>
          
          {showSortDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-20">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    filters.sortBy === option.value
                      ? "bg-violet-50 text-violet-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="flex-1">{option.label}</span>
                  {filters.sortBy === option.value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Funding Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status de financiamento
            </label>
            <div className="flex flex-wrap gap-2">
              {FUNDING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFundingStatusChange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.fundingStatus === option.value
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {totalResults !== undefined && (
                  <span>{totalResults} {totalResults === 1 ? "resultado" : "resultados"}</span>
                )}
              </p>
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filters.category === category
                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
              Busca: "{filters.search}"
              <button onClick={clearSearch} className="hover:text-violet-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.fundingStatus !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              {FUNDING_OPTIONS.find(o => o.value === filters.fundingStatus)?.label}
              <button onClick={() => handleFundingStatusChange("all")} className="hover:text-emerald-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
