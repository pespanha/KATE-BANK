import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  FileStack,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Building2,
  Calendar,
  TrendingUp
} from "lucide-react";

interface Project {
  id: number;
  project_name: string;
  company_name: string | null;
  responsible_name: string;
  email: string;
  category: string;
  funding_range: string;
  stage: string;
  status: string;
  blockchain: string | null;
  submission_progress: number;
  submitted_at: string | null;
  created_at: string;
}

type StatusFilter = "all" | "pending_review" | "approved" | "fundraising" | "completed" | "rejected" | "draft";

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: "all", label: "Todos", color: "bg-gray-100 text-gray-700" },
  { value: "draft", label: "Rascunho", color: "bg-gray-100 text-gray-500" },
  { value: "pending_review", label: "Aguardando", color: "bg-amber-100 text-amber-700" },
  { value: "approved", label: "Aprovados", color: "bg-green-100 text-green-700" },
  { value: "fundraising", label: "Em captação", color: "bg-blue-100 text-blue-700" },
  { value: "completed", label: "Finalizados", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "Rejeitados", color: "bg-red-100 text-red-700" },
];

export default function AdminProjetos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "all"
  );

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      const res = await fetch(`/api/admin/projects?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
    } finally {
      setLoading(false);
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

  const filteredProjects = projects.filter(project => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      project.project_name.toLowerCase().includes(searchLower) ||
      project.responsible_name.toLowerCase().includes(searchLower) ||
      project.email.toLowerCase().includes(searchLower) ||
      (project.company_name && project.company_name.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: any }> = {
      draft: { color: "bg-gray-100 text-gray-600", label: "Rascunho", icon: FileStack },
      pending_review: { color: "bg-amber-100 text-amber-700", label: "Em análise", icon: Clock },
      approved: { color: "bg-green-100 text-green-700", label: "Aprovado", icon: CheckCircle },
      fundraising: { color: "bg-blue-100 text-blue-700", label: "Em captação", icon: TrendingUp },
      completed: { color: "bg-emerald-100 text-emerald-700", label: "Finalizado", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado", icon: XCircle },
      rejected: { color: "bg-red-100 text-red-700", label: "Rejeitado", icon: XCircle },
    };
    const { color, label, icon: Icon } = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  const pendingCount = projects.filter(p => p.status === "pending_review").length;

  const BlockchainBadge = ({ blockchain }: { blockchain: string | null }) => {
    if (!blockchain) return <span className="text-xs text-gray-400">-</span>;
    
    if (blockchain === "stellar") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          Stellar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
        Hathor
      </span>
    );
  };

  return (
    <AdminLayout 
      title="Projetos" 
      subtitle={`${projects.length} projetos${pendingCount > 0 ? ` • ${pendingCount} aguardando análise` : ""}`}
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, responsável ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-kate-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
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
                {option.value === "pending_review" && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
            <FileStack className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-deep mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-500">
              {search ? "Tente buscar por outro termo" : "Não há projetos com este status"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-kate-border">
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Projeto</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Responsável</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Categoria</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Captação</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Blockchain</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">Data</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kate-border">
                  {filteredProjects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-navy" />
                          </div>
                          <div>
                            <p className="font-medium text-navy-deep">{project.project_name}</p>
                            {project.company_name && (
                              <p className="text-xs text-gray-500">{project.company_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-navy-deep">{project.responsible_name}</p>
                        <p className="text-xs text-gray-500">{project.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                          {project.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-navy-deep">{project.funding_range}</p>
                        <p className="text-xs text-gray-500">{project.stage}</p>
                      </td>
                      <td className="px-5 py-4">
                        <BlockchainBadge blockchain={project.blockchain} />
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(project.status)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(project.submitted_at || project.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/projetos/${project.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy/5 hover:bg-navy/10 text-navy-deep text-sm font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
