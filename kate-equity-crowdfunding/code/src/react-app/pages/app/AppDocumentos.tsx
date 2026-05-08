import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  FileText,
  Download,
  ExternalLink,
  FolderOpen,
  FileCheck,
  Receipt,
  Building2,
  Coins,
  Shield,
  Calendar,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  Search,
  Filter,
  X
} from "lucide-react";

interface Investment {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  token_released_at: string | null;
  offer_title: string;
  offer_slug: string;
}

interface Project {
  id: number;
  project_name: string;
  status: string;
  pitch_deck_url: string | null;
  social_contract_url: string | null;
  cap_table_url: string | null;
  financial_report_url: string | null;
  other_docs_url: string | null;
  created_at: string;
}

interface DocumentItem {
  id: string;
  type: "investment" | "project" | "platform";
  category: string;
  title: string;
  description: string;
  date: string;
  status?: "available" | "pending" | "processing";
  downloadUrl?: string;
  linkedTo?: string;
  linkedToUrl?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

const PLATFORM_DOCS: DocumentItem[] = [
  {
    id: "terms",
    type: "platform",
    category: "Termos e Políticas",
    title: "Termos de Uso",
    description: "Termos e condições de uso da plataforma Kate",
    date: "",
    status: "available",
    downloadUrl: "#",
    icon: FileText,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    id: "privacy",
    type: "platform",
    category: "Termos e Políticas",
    title: "Política de Privacidade",
    description: "Como tratamos seus dados pessoais",
    date: "",
    status: "available",
    downloadUrl: "#",
    icon: Shield,
    iconColor: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    id: "risk",
    type: "platform",
    category: "Termos e Políticas",
    title: "Aviso de Riscos",
    description: "Informações sobre riscos de investimento em equity crowdfunding",
    date: "",
    status: "available",
    downloadUrl: "#",
    icon: AlertCircle,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50"
  }
];

const FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "investment", label: "Investimentos" },
  { id: "project", label: "Projetos" },
  { id: "platform", label: "Plataforma" }
];

export default function AppDocumentos() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, projRes] = await Promise.all([
        fetch("/api/user/investments", { credentials: "include" }),
        fetch("/api/user/projects", { credentials: "include" })
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvestments(invData.investments || []);
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      }
    } catch (e) {
      console.error("Error fetching documents:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Build documents list
  const documents: DocumentItem[] = [];

  // Investment documents
  investments.forEach((inv) => {
    // Reservation receipt
    documents.push({
      id: `inv-${inv.id}-reservation`,
      type: "investment",
      category: "Comprovantes",
      title: "Comprovante de Reserva",
      description: `Reserva de ${inv.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      date: inv.created_at,
      status: "available",
      linkedTo: inv.offer_title,
      linkedToUrl: `/oferta/${inv.offer_slug}`,
      icon: Receipt,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50"
    });

    // Payment confirmation (if paid)
    if (inv.paid_at) {
      documents.push({
        id: `inv-${inv.id}-payment`,
        type: "investment",
        category: "Comprovantes",
        title: "Confirmação de Pagamento",
        description: `Pagamento confirmado para ${inv.offer_title}`,
        date: inv.paid_at,
        status: "available",
        linkedTo: inv.offer_title,
        linkedToUrl: `/oferta/${inv.offer_slug}`,
        icon: FileCheck,
        iconColor: "text-green-600",
        bgColor: "bg-green-50"
      });
    }

    // Token certificate (if released)
    if (inv.token_released_at) {
      documents.push({
        id: `inv-${inv.id}-token`,
        type: "investment",
        category: "Certificados",
        title: "Certificado de Tokens",
        description: `Tokens emitidos para ${inv.offer_title}`,
        date: inv.token_released_at,
        status: "available",
        linkedTo: inv.offer_title,
        linkedToUrl: `/oferta/${inv.offer_slug}`,
        icon: Coins,
        iconColor: "text-gold",
        bgColor: "bg-gold/10"
      });
    }

    // Risk acknowledgement
    documents.push({
      id: `inv-${inv.id}-risk`,
      type: "investment",
      category: "Termos Assinados",
      title: "Termo de Ciência de Riscos",
      description: `Aceite dos termos e riscos do investimento`,
      date: inv.created_at,
      status: "available",
      linkedTo: inv.offer_title,
      linkedToUrl: `/oferta/${inv.offer_slug}`,
      icon: Shield,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50"
    });
  });

  // Project documents
  projects.forEach((proj) => {
    if (proj.pitch_deck_url) {
      documents.push({
        id: `proj-${proj.id}-pitch`,
        type: "project",
        category: "Documentos do Projeto",
        title: "Pitch Deck",
        description: `Apresentação do projeto ${proj.project_name}`,
        date: proj.created_at,
        status: "available",
        downloadUrl: proj.pitch_deck_url,
        linkedTo: proj.project_name,
        linkedToUrl: `/app/projetos/${proj.id}`,
        icon: Building2,
        iconColor: "text-navy",
        bgColor: "bg-navy/10"
      });
    }

    if (proj.social_contract_url) {
      documents.push({
        id: `proj-${proj.id}-contract`,
        type: "project",
        category: "Documentos do Projeto",
        title: "Contrato Social",
        description: `Contrato social de ${proj.project_name}`,
        date: proj.created_at,
        status: "available",
        downloadUrl: proj.social_contract_url,
        linkedTo: proj.project_name,
        linkedToUrl: `/app/projetos/${proj.id}`,
        icon: FileText,
        iconColor: "text-navy",
        bgColor: "bg-navy/10"
      });
    }

    if (proj.cap_table_url) {
      documents.push({
        id: `proj-${proj.id}-cap`,
        type: "project",
        category: "Documentos do Projeto",
        title: "Cap Table",
        description: `Tabela de capitalização de ${proj.project_name}`,
        date: proj.created_at,
        status: "available",
        downloadUrl: proj.cap_table_url,
        linkedTo: proj.project_name,
        linkedToUrl: `/app/projetos/${proj.id}`,
        icon: FileText,
        iconColor: "text-navy",
        bgColor: "bg-navy/10"
      });
    }

    if (proj.financial_report_url) {
      documents.push({
        id: `proj-${proj.id}-financial`,
        type: "project",
        category: "Documentos do Projeto",
        title: "Relatório Financeiro",
        description: `Demonstrativos financeiros de ${proj.project_name}`,
        date: proj.created_at,
        status: "available",
        downloadUrl: proj.financial_report_url,
        linkedTo: proj.project_name,
        linkedToUrl: `/app/projetos/${proj.id}`,
        icon: FileText,
        iconColor: "text-navy",
        bgColor: "bg-navy/10"
      });
    }

    if (proj.other_docs_url) {
      documents.push({
        id: `proj-${proj.id}-other`,
        type: "project",
        category: "Documentos do Projeto",
        title: "Documentos Adicionais",
        description: `Outros documentos de ${proj.project_name}`,
        date: proj.created_at,
        status: "available",
        downloadUrl: proj.other_docs_url,
        linkedTo: proj.project_name,
        linkedToUrl: `/app/projetos/${proj.id}`,
        icon: FileText,
        iconColor: "text-navy",
        bgColor: "bg-navy/10"
      });
    }
  });

  // Add platform docs
  documents.push(...PLATFORM_DOCS);

  // Filter and search
  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch = !searchTerm ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.linkedTo && doc.linkedTo.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Platform docs at the end, others sorted by date
      if (a.type === "platform" && b.type !== "platform") return 1;
      if (a.type !== "platform" && b.type === "platform") return -1;
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Group by category
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocumentItem[]>);

  const hasActiveFilters = typeFilter !== "all" || searchTerm;

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
  };

  // Summary stats
  const investmentDocsCount = documents.filter((d) => d.type === "investment").length;
  const projectDocsCount = documents.filter((d) => d.type === "project").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-deep">Documentos</h1>
        <p className="text-gray-500 mt-1">
          Acesse seus comprovantes, certificados e documentos importantes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Docs de Investimentos</p>
              <p className="text-xl font-bold text-navy-deep">{investmentDocsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-navy/20 to-navy/5 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-navy" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Docs de Projetos</p>
              <p className="text-xl font-bold text-navy-deep">{projectDocsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-kate-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Termos e Políticas</p>
              <p className="text-xl font-bold text-navy-deep">{PLATFORM_DOCS.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-kate-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
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

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = typeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTypeFilter(opt.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gold text-navy-deep"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count and clear filters */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-kate-border">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {filteredDocuments.length} {filteredDocuments.length === 1 ? "documento" : "documentos"}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gold-hover hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState hasDocuments={documents.length > 0} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-navy-deep mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gold" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} formatDate={formatDate} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasDocuments }: { hasDocuments: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-kate-border p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <FileWarning className="w-8 h-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-navy-deep mb-2">
        {hasDocuments ? "Nenhum documento encontrado" : "Você ainda não tem documentos"}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {hasDocuments
          ? "Nenhum documento corresponde aos filtros selecionados."
          : "Seus comprovantes e certificados aparecerão aqui conforme você investe ou submete projetos."}
      </p>
      <Link
        to="/app/oportunidades"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors"
      >
        Ver oportunidades
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function DocumentCard({
  document,
  formatDate
}: {
  document: DocumentItem;
  formatDate: (date: string) => string;
}) {
  const Icon = document.icon;

  return (
    <div className="group bg-white rounded-2xl border border-kate-border p-5 hover:border-gold/50 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 ${document.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${document.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy-deep group-hover:text-gold-hover transition-colors">
            {document.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
            {document.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {document.date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(document.date)}
              </span>
            )}

            {document.linkedTo && document.linkedToUrl && (
              <Link
                to={document.linkedToUrl}
                className="inline-flex items-center gap-1 text-xs text-gold-hover hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {document.linkedTo}
              </Link>
            )}

            {document.status === "pending" && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <Clock className="w-3.5 h-3.5" />
                Pendente
              </span>
            )}

            {document.status === "available" && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Disponível
              </span>
            )}
          </div>
        </div>

        {/* Download button */}
        <button
          className="p-2.5 rounded-xl border border-kate-border text-gray-400 hover:text-navy hover:bg-gray-50 hover:border-gold/50 transition-all flex-shrink-0"
          title="Baixar documento"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
