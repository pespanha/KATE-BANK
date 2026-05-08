import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Megaphone,
  Search,
  Plus,
  Edit2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  X,
  Building2,
  Ban,
  AlertTriangle
} from "lucide-react";

interface Offer {
  id: number;
  project_id: number;
  title: string;
  slug: string;
  short_description: string;
  category: string;
  min_goal: number;
  max_goal: number;
  current_amount: number;
  investors_count: number;
  min_investment: number;
  start_date: string;
  end_date: string;
  status: string;
  image_url: string | null;
  project_name?: string;
  company_name?: string;
}

interface Project {
  id: number;
  project_name: string;
  company_name: string | null;
  category: string;
  short_description: string;
  min_goal: number | null;
  max_goal: number | null;
  deadline_date: string | null;
  equity_offered: string | null;
  target_valuation: string | null;
  use_of_funds: string | null;
}

type StatusFilter = "all" | "draft" | "active" | "closed_success" | "closed_fail";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativas" },
  { value: "closed_success", label: "Sucesso" },
  { value: "closed_fail", label: "Não atingiram" },
];

export default function AdminOfertas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "all"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOffers();
    fetchApprovedProjects();
  }, [statusFilter]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/admin/offers?${params}`, { credentials: "include" });
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

  const fetchApprovedProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects?status=approved", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setApprovedProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
    }
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };

  const filteredOffers = offers.filter(offer => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      offer.title.toLowerCase().includes(searchLower) ||
      (offer.project_name && offer.project_name.toLowerCase().includes(searchLower)) ||
      (offer.company_name && offer.company_name.toLowerCase().includes(searchLower))
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: any }> = {
      draft: { color: "bg-gray-100 text-gray-600", label: "Rascunho", icon: Edit2 },
      active: { color: "bg-green-100 text-green-700", label: "Ativa", icon: Play },
      closed_success: { color: "bg-blue-100 text-blue-700", label: "Sucesso", icon: CheckCircle },
      closed_fail: { color: "bg-red-100 text-red-700", label: "Não atingiu", icon: XCircle },
    };
    const { color, label, icon: Icon } = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  const getProgress = (current: number, goal: number) => {
    return Math.min(100, (current / goal) * 100);
  };

  const handleToggleStatus = async (offer: Offer) => {
    if (saving) return;
    
    const newStatus = offer.status === "active" ? "draft" : "active";
    setSaving(true);
    
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchOffers();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar status");
      }
    } catch (e) {
      console.error("Error updating status:", e);
      alert("Erro ao atualizar status");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowEditModal(true);
  };

  const openCloseModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowCloseModal(true);
  };

  const activeCount = offers.filter(o => o.status === "active").length;
  const totalRaised = offers.reduce((sum, o) => sum + (o.current_amount || 0), 0);

  return (
    <AdminLayout 
      title="Ofertas" 
      subtitle={`${offers.length} ofertas • ${activeCount} ativas • ${formatCurrency(totalRaised)} captados`}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, projeto ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Oferta
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === option.value
                  ? "bg-gold text-navy-deep"
                  : "bg-white border border-kate-border text-gray-600 hover:border-gold/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhuma oferta encontrada</h3>
            <p className="text-gray-500 mb-6">
              {search ? "Tente buscar por outro termo" : "Crie uma oferta a partir de um projeto aprovado"}
            </p>
            {!search && approvedProjects.length > 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar primeira oferta
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOffers.map(offer => (
              <div key={offer.id} className="bg-white rounded-2xl border border-kate-border p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Image and basic info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                      {offer.image_url ? (
                        <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Megaphone className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy-deep truncate">{offer.title}</h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{offer.short_description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {offer.company_name || offer.project_name || "Projeto #" + offer.project_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 px-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Captado</p>
                      <p className="font-semibold text-navy-deep">{formatCurrency(offer.current_amount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Meta</p>
                      <p className="font-medium text-gray-700">{formatCurrency(offer.min_goal)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Investidores</p>
                      <p className="font-medium text-gray-700 flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        {offer.investors_count}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full lg:w-32">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso</span>
                      <span>{getProgress(offer.current_amount, offer.min_goal).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          getProgress(offer.current_amount, offer.min_goal) >= 100
                            ? "bg-green-500"
                            : "bg-gold"
                        }`}
                        style={{ width: `${Math.min(100, getProgress(offer.current_amount, offer.min_goal))}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/oferta/${offer.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                      title="Ver página pública"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openEditModal(offer)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {(offer.status === "draft" || offer.status === "active") && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(offer)}
                          disabled={saving}
                          className={`p-2.5 rounded-lg transition-colors ${
                            offer.status === "active"
                              ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
                              : "bg-green-100 hover:bg-green-200 text-green-700"
                          }`}
                          title={offer.status === "active" ? "Pausar" : "Ativar"}
                        >
                          {offer.status === "active" ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        {offer.status === "active" && (
                          <button
                            onClick={() => openCloseModal(offer)}
                            className="p-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                            title="Encerrar oferta"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOfferModal
          projects={approvedProjects}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOffers();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOffer && (
        <EditOfferModal
          offer={selectedOffer}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOffer(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedOffer(null);
            fetchOffers();
          }}
        />
      )}

      {/* Close Modal */}
      {showCloseModal && selectedOffer && (
        <CloseOfferModal
          offer={selectedOffer}
          onClose={() => {
            setShowCloseModal(false);
            setSelectedOffer(null);
          }}
          onSuccess={() => {
            setShowCloseModal(false);
            setSelectedOffer(null);
            fetchOffers();
          }}
        />
      )}
    </AdminLayout>
  );
}

// Create Offer Modal
interface CreateModalProps {
  projects: Project[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateOfferModal({ projects, onClose, onSuccess }: CreateModalProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    full_description: "",
    image_url: "",
    min_goal: "",
    max_goal: "",
    min_investment: "1000",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    valuation: "",
    equity_offered: "",
    use_of_funds: "",
    risks: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    const slug = project.project_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    setFormData(prev => ({
      ...prev,
      title: project.project_name,
      slug: slug,
      short_description: project.short_description || "",
      min_goal: project.min_goal?.toString() || "",
      max_goal: project.max_goal?.toString() || "",
      end_date: project.deadline_date || "",
      valuation: project.target_valuation || "",
      equity_offered: project.equity_offered || "",
      use_of_funds: project.use_of_funds || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      setError("Selecione um projeto");
      return;
    }
    
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project_id: selectedProject.id,
          ...formData,
          min_goal: parseFloat(formData.min_goal),
          max_goal: parseFloat(formData.max_goal),
          min_investment: parseFloat(formData.min_investment),
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao criar oferta");
      }
    } catch (e) {
      setError("Erro ao criar oferta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-kate-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-deep">Nova Oferta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Selection */}
          {!selectedProject ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecione um projeto aprovado
              </label>
              {projects.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-xl text-center">
                  <p className="text-gray-500">Nenhum projeto aprovado disponível</p>
                  <p className="text-sm text-gray-400 mt-1">Aprove projetos na fila antes de criar ofertas</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleProjectSelect(project)}
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                    >
                      <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-navy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy-deep">{project.project_name}</p>
                        <p className="text-sm text-gray-500 truncate">{project.company_name || project.category}</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Selected project indicator */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">{selectedProject.project_name}</p>
                  <p className="text-sm text-green-600">Projeto selecionado</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="text-sm text-green-700 hover:text-green-800 underline"
                >
                  Trocar
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título da Oferta</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-kate-border rounded-l-xl text-gray-500 text-sm">
                      /oferta/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="flex-1 px-4 py-2.5 border border-kate-border rounded-r-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
                  <textarea
                    value={formData.short_description}
                    onChange={e => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Mínima (R$)</label>
                  <input
                    type="number"
                    value={formData.min_goal}
                    onChange={e => setFormData(prev => ({ ...prev, min_goal: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Máxima (R$)</label>
                  <input
                    type="number"
                    value={formData.max_goal}
                    onChange={e => setFormData(prev => ({ ...prev, max_goal: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investimento Mínimo (R$)</label>
                  <input
                    type="number"
                    value={formData.min_investment}
                    onChange={e => setFormData(prev => ({ ...prev, min_investment: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valuation</label>
                  <input
                    type="text"
                    value={formData.valuation}
                    onChange={e => setFormData(prev => ({ ...prev, valuation: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="R$ 5.000.000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equity Oferecido</label>
                  <input
                    type="text"
                    value={formData.equity_offered}
                    onChange={e => setFormData(prev => ({ ...prev, equity_offered: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="10%"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-5 py-3 border border-kate-border text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-5 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    "Criar Oferta"
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// Edit Offer Modal
interface EditModalProps {
  offer: Offer;
  onClose: () => void;
  onSuccess: () => void;
}

// Close Offer Modal
interface CloseModalProps {
  offer: Offer;
  onClose: () => void;
  onSuccess: () => void;
}

function CloseOfferModal({ offer, onClose, onSuccess }: CloseModalProps) {
  const [closeType, setCloseType] = useState<"success" | "fail" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const progress = offer.min_goal > 0 ? (offer.current_amount / offer.min_goal) * 100 : 0;
  const metGoal = offer.current_amount >= offer.min_goal;

  const handleClose = async () => {
    if (!closeType) return;
    
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/offers/${offer.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ close_type: closeType })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao encerrar oferta");
      }
    } catch (e) {
      setError("Erro ao encerrar oferta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-kate-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-deep">Encerrar Oferta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Offer Summary */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-navy-deep mb-2">{offer.title}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Captado</p>
                <p className="font-semibold text-navy-deep">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(offer.current_amount)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Meta Mínima</p>
                <p className="font-medium text-gray-700">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(offer.min_goal)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Investidores</p>
                <p className="font-medium text-gray-700">{offer.investors_count}</p>
              </div>
              <div>
                <p className="text-gray-500">Progresso</p>
                <p className={`font-medium ${metGoal ? "text-green-600" : "text-amber-600"}`}>
                  {progress.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Close Type Selection */}
          <div className="space-y-3">
            <p className="font-medium text-gray-700">Como deseja encerrar esta oferta?</p>
            
            <button
              type="button"
              onClick={() => setCloseType("success")}
              disabled={!metGoal}
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                closeType === "success"
                  ? "border-green-500 bg-green-50"
                  : metGoal
                    ? "border-kate-border hover:border-green-300"
                    : "border-kate-border bg-gray-50 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  closeType === "success" ? "bg-green-500 text-white" : "bg-green-100 text-green-600"
                }`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy-deep">Encerrar com Sucesso</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Meta atingida. Token Jobs serão criados para todos os investimentos confirmados.
                  </p>
                  {!metGoal && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Meta mínima não atingida
                    </p>
                  )}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCloseType("fail")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                closeType === "fail"
                  ? "border-red-500 bg-red-50"
                  : "border-kate-border hover:border-red-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  closeType === "fail" ? "bg-red-500 text-white" : "bg-red-100 text-red-600"
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-navy-deep">Encerrar sem Sucesso</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Meta não atingida. Todos os investimentos serão marcados para reembolso.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {closeType && (
            <div className={`p-4 rounded-xl ${
              closeType === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}>
              <p className={`text-sm font-medium ${closeType === "success" ? "text-green-800" : "text-red-800"}`}>
                {closeType === "success" 
                  ? `✓ ${offer.investors_count} Token Jobs serão criados para emissão dos tokens.`
                  : `⚠ ${offer.investors_count} investimentos serão marcados para reembolso.`
                }
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border border-kate-border text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleClose}
              disabled={!closeType || saving}
              className={`flex-1 px-5 py-3 font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                closeType === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : closeType === "fail"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-300 text-gray-500"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Encerrando...
                </span>
              ) : (
                "Confirmar Encerramento"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditOfferModal({ offer, onClose, onSuccess }: EditModalProps) {
  const [formData, setFormData] = useState({
    title: offer.title,
    slug: offer.slug,
    short_description: offer.short_description,
    image_url: offer.image_url || "",
    min_goal: offer.min_goal.toString(),
    max_goal: offer.max_goal.toString(),
    min_investment: offer.min_investment.toString(),
    start_date: offer.start_date,
    end_date: offer.end_date,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          min_goal: parseFloat(formData.min_goal),
          max_goal: parseFloat(formData.max_goal),
          min_investment: parseFloat(formData.min_investment),
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao atualizar oferta");
      }
    } catch (e) {
      setError("Erro ao atualizar oferta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-kate-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-deep">Editar Oferta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
            <textarea
              value={formData.short_description}
              onChange={e => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Mínima (R$)</label>
              <input
                type="number"
                value={formData.min_goal}
                onChange={e => setFormData(prev => ({ ...prev, min_goal: e.target.value }))}
                className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Máxima (R$)</label>
              <input
                type="number"
                value={formData.max_goal}
                onChange={e => setFormData(prev => ({ ...prev, max_goal: e.target.value }))}
                className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investimento Mínimo (R$)</label>
            <input
              type="number"
              value={formData.min_investment}
              onChange={e => setFormData(prev => ({ ...prev, min_investment: e.target.value }))}
              className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border border-kate-border text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-5 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
