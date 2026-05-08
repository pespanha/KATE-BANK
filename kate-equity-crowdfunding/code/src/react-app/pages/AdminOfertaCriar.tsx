import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Building2,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";

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
  status: string;
}

export default function AdminOfertaCriar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectIdParam = searchParams.get("project_id");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch approved projects for selection
      const res = await fetch("/api/admin/projects?status=approved", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        
        // If project_id is provided, try to find and select it
        if (projectIdParam) {
          const projectId = parseInt(projectIdParam);
          const foundProject = (data.projects || []).find((p: Project) => p.id === projectId);
          
          if (foundProject) {
            handleProjectSelect(foundProject);
          } else {
            // Project not in approved list, fetch it directly
            const projectRes = await fetch(`/api/admin/projects/${projectId}`, { credentials: "include" });
            if (projectRes.ok) {
              const projectData = await projectRes.json();
              if (projectData.project) {
                handleProjectSelect(projectData.project);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
      setError("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    const slug = project.project_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Calculate end date (90 days from now if not specified)
    const endDate = project.deadline_date || 
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    setFormData(prev => ({
      ...prev,
      title: project.project_name,
      slug: slug,
      short_description: project.short_description || "",
      min_goal: project.min_goal?.toString() || "",
      max_goal: project.max_goal?.toString() || "",
      end_date: endDate,
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
        // Redirect to project detail page to start fundraising
        navigate(`/admin/projetos/${selectedProject.id}`);
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

  if (loading) {
    return (
      <AdminLayout title="Criar Oferta">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Criar Oferta" 
      subtitle={selectedProject ? `Para: ${selectedProject.project_name}` : "Selecione um projeto aprovado"}
    >
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-navy-deep mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            {!selectedProject ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecione um projeto aprovado
                </label>
                {projects.length === 0 ? (
                  <div className="p-6 bg-amber-50 rounded-xl text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                    <p className="text-amber-800 font-medium">Nenhum projeto aprovado disponível</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Aprove projetos na fila antes de criar ofertas
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/projetos")}
                      className="mt-4 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
                    >
                      Ver Projetos
                    </button>
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
                    <p className="text-sm text-green-600">
                      {selectedProject.status === "approved" ? "Projeto aprovado" : `Status: ${selectedProject.status}`}
                    </p>
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
                    onClick={() => navigate(-1)}
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
    </AdminLayout>
  );
}
