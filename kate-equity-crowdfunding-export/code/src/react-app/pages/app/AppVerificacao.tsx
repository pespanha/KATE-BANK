import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  Link2,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Users,
  Target,
  Calendar,
  Globe,
  Mail,
  MapPin,
  Coins,
  Shield,
  AlertCircle
} from "lucide-react";

interface ProjectVerification {
  // Project data
  id: number;
  name: string;
  company_name: string | null;
  document_number: string | null;
  category: string;
  short_description: string | null;
  responsible_name: string;
  email: string;
  address: string | null;
  website: string | null;
  slug: string;
  
  // Fundraising data
  min_goal: number | null;
  max_goal: number | null;
  current_raised: number;
  equity_offered: string | null;
  target_valuation: string | null;
  deadline_date: string | null;
  fundraising_started_at: string | null;
  fundraising_ended_at: string | null;
  status: string;
  investors_count: number;
  
  // Blockchain data
  nft_uid: string | null;
  nft_tx_hash: string | null;
  token_uid: string | null;
  token_symbol: string | null;
  token_tx_hash: string | null;
  total_tokens: number | null;
  escrow_address: string | null;
  nft_token_link_tx: string | null;
  
  // Documents
  documents: {
    id: number;
    type: string;
    name: string;
    file_hash: string | null;
    created_at: string;
  }[];
  
  // Timeline events
  events: {
    id: number;
    event_type: string;
    title: string;
    description: string | null;
    created_at: string;
  }[];
}

export default function AppVerificacao() {
  const { slug } = useParams();
  const [project, setProject] = useState<ProjectVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/verificacao/${slug}`, {
        credentials: "include"
      });
      if (!res.ok) {
        if (res.status === 404) {
          setError("Projeto não encontrado");
        } else {
          setError("Erro ao carregar dados do projeto");
        }
        return;
      }
      const data = await res.json();
      setProject(data.project);
    } catch (e) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      draft: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
      pending_review: { label: "Em análise", color: "bg-amber-100 text-amber-700" },
      approved: { label: "Aprovado", color: "bg-green-100 text-green-700" },
      fundraising: { label: "Em captação", color: "bg-blue-100 text-blue-700" },
      completed: { label: "Finalizado com sucesso", color: "bg-green-100 text-green-700" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
      rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700" }
    };
    return labels[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  };

  const getProgressPercent = () => {
    if (!project?.max_goal) return 0;
    return Math.min((project.current_raised / project.max_goal) * 100, 100);
  };

  const hathorExplorerToken = (uid: string) => `https://explorer.hathor.network/token_detail/${uid}`;
  const hathorExplorerTx = (hash: string) => `https://explorer.hathor.network/transaction/${hash}`;
  const hathorExplorerAddress = (addr: string) => `https://explorer.hathor.network/address/${addr}`;

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !project) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-600">{error || "Projeto não encontrado"}</p>
          <Link to="/" className="mt-4 text-gold hover:underline">Voltar ao início</Link>
        </div>
      </PublicLayout>
    );
  }

  const statusInfo = getStatusLabel(project.status);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-deep to-navy rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-white/70 text-sm">Verificação de dados on-chain</p>
            </div>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Section 1: Project Data */}
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-navy" />
            <h2 className="font-semibold text-navy-deep">Dados do Projeto</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nome do Projeto</p>
              <p className="font-medium text-navy-deep">{project.name}</p>
            </div>
            {project.company_name && (
              <div>
                <p className="text-gray-500">Razão Social</p>
                <p className="font-medium text-navy-deep">{project.company_name}</p>
              </div>
            )}
            {project.document_number && (
              <div>
                <p className="text-gray-500">CNPJ/Documento</p>
                <p className="font-medium text-navy-deep">{project.document_number}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Categoria</p>
              <p className="font-medium text-navy-deep">{project.category}</p>
            </div>
            <div>
              <p className="text-gray-500">Responsável</p>
              <p className="font-medium text-navy-deep">{project.responsible_name}</p>
            </div>
            <div>
              <p className="text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
              <p className="font-medium text-navy-deep">{project.email}</p>
            </div>
            {project.address && (
              <div>
                <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Localização</p>
                <p className="font-medium text-navy-deep">{project.address}</p>
              </div>
            )}
            {project.website && (
              <div>
                <p className="text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Website</p>
                <a href={project.website} target="_blank" rel="noopener noreferrer" className="font-medium text-gold hover:underline">
                  {project.website}
                </a>
              </div>
            )}
          </div>
          {project.short_description && (
            <div className="mt-4 pt-4 border-t border-kate-border">
              <p className="text-gray-500 text-sm mb-1">Descrição</p>
              <p className="text-navy-deep">{project.short_description}</p>
            </div>
          )}
        </div>

        {/* Section 2: Fundraising */}
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-gold" />
            <h2 className="font-semibold text-navy-deep">Captação</h2>
          </div>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-navy-deep">{formatCurrency(project.current_raised)}</span>
              <span className="text-gray-500">de {formatCurrency(project.max_goal)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gold to-gold-hover rounded-full transition-all"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Meta mínima: {formatCurrency(project.min_goal)}</span>
              <span>{getProgressPercent().toFixed(1)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Equity</p>
              <p className="font-semibold text-navy-deep">{project.equity_offered || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Valuation</p>
              <p className="font-semibold text-navy-deep">{project.target_valuation || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Investidores</p>
              <p className="font-semibold text-navy-deep">{project.investors_count}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Encerramento</p>
              <p className="font-semibold text-navy-deep">{formatDate(project.deadline_date)}</p>
            </div>
          </div>

          {project.fundraising_started_at && (
            <p className="text-xs text-gray-500 mt-3">
              Captação iniciada em {formatDate(project.fundraising_started_at)}
              {project.fundraising_ended_at && ` • Encerrada em ${formatDate(project.fundraising_ended_at)}`}
            </p>
          )}
        </div>

        {/* Section 3: Documents */}
        {project.documents && project.documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-navy-deep">Documentos do Projeto</h2>
            </div>
            <div className="space-y-3">
              {project.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-navy-deep text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.type} • {formatDate(doc.created_at)}</p>
                    {doc.file_hash && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        SHA-256: {doc.file_hash.substring(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Timeline */}
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-navy-deep">Histórico</h2>
          </div>
          <div className="space-y-4">
            {/* Built-in events based on project data */}
            {project.status !== 'draft' && (
              <TimelineItem 
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Projeto submetido"
                date={project.events?.find(e => e.event_type === 'submitted')?.created_at}
                completed
              />
            )}
            
            {['approved', 'fundraising', 'completed', 'cancelled'].includes(project.status) && (
              <TimelineItem 
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Projeto aprovado pelo admin"
                date={project.events?.find(e => e.event_type === 'approved')?.created_at}
                completed
              />
            )}

            {project.nft_uid && (
              <TimelineItem 
                icon={<Shield className="w-4 h-4" />}
                title="NFT do projeto criado"
                date={project.events?.find(e => e.event_type === 'nft_created')?.created_at}
                completed
              >
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {project.nft_uid.substring(0, 16)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(project.nft_uid!, 'nft')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                  {copiedField === 'nft' && <span className="text-xs text-green-600">Copiado!</span>}
                  <a 
                    href={hathorExplorerToken(project.nft_uid)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gold text-xs flex items-center gap-1 hover:underline"
                  >
                    Ver no Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </TimelineItem>
            )}

            {project.token_uid && (
              <TimelineItem 
                icon={<Coins className="w-4 h-4" />}
                title="Captação iniciada"
                date={project.fundraising_started_at}
                completed
              >
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-600">Token: {project.token_symbol}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {project.token_uid.substring(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(project.token_uid!, 'token')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {copiedField === 'token' && <span className="text-xs text-green-600">Copiado!</span>}
                    <a 
                      href={hathorExplorerToken(project.token_uid)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gold text-xs flex items-center gap-1 hover:underline"
                    >
                      Ver no Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </TimelineItem>
            )}

            {project.fundraising_ended_at && (
              <TimelineItem 
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Captação encerrada"
                date={project.fundraising_ended_at}
                completed
              />
            )}

            {project.nft_token_link_tx && (
              <TimelineItem 
                icon={<Link2 className="w-4 h-4" />}
                title="Tokens distribuídos e vinculados ao NFT"
                date={project.events?.find(e => e.event_type === 'tokens_distributed')?.created_at}
                completed
              >
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {project.nft_token_link_tx.substring(0, 16)}...
                  </code>
                  <a 
                    href={hathorExplorerTx(project.nft_token_link_tx)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gold text-xs flex items-center gap-1 hover:underline"
                  >
                    Ver TX <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </TimelineItem>
            )}

            {/* Additional events from project_events table */}
            {project.events?.filter(e => !['submitted', 'approved', 'nft_created', 'tokens_distributed'].includes(e.event_type)).map(event => (
              <TimelineItem
                key={event.id}
                icon={<Clock className="w-4 h-4" />}
                title={event.title}
                date={event.created_at}
                completed
              >
                {event.description && <p className="text-xs text-gray-600 mt-1">{event.description}</p>}
              </TimelineItem>
            ))}
          </div>
        </div>

        {/* Section 5: Blockchain Data */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-navy-deep">Dados Blockchain</h2>
          </div>

          {/* NFT do Projeto */}
          {project.nft_uid && (
            <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
              <h3 className="font-medium text-navy-deep mb-3 text-sm">NFT do Projeto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">NFT UID:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{project.nft_uid}</code>
                    <button onClick={() => copyToClipboard(project.nft_uid!, 'nft_full')} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3 h-3" />
                    </button>
                    <a href={hathorExplorerToken(project.nft_uid)} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Data on-chain:</span>
                  <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">kate.mocha.app/verificacao/{project.slug}</code>
                </div>
                {project.nft_tx_hash && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">TX de criação:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{project.nft_tx_hash.substring(0, 16)}...</code>
                      <a href={hathorExplorerTx(project.nft_tx_hash)} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Token do Projeto */}
          {project.token_uid && (
            <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
              <h3 className="font-medium text-navy-deep mb-3 text-sm">Token do Projeto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Token:</span>
                  <span className="font-semibold text-navy-deep">{project.token_symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Token UID:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{project.token_uid.substring(0, 24)}...</code>
                    <button onClick={() => copyToClipboard(project.token_uid!, 'token_full')} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3 h-3" />
                    </button>
                    <a href={hathorExplorerToken(project.token_uid)} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total de tokens:</span>
                  <span className="font-medium">{(project.total_tokens ?? 0).toLocaleString("pt-BR")}</span>
                </div>
                {project.escrow_address && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Escrow:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{project.escrow_address.substring(0, 16)}...</code>
                      <button onClick={() => copyToClipboard(project.escrow_address!, 'escrow')} className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="w-3 h-3" />
                      </button>
                      <a href={hathorExplorerAddress(project.escrow_address)} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vínculo NFT ↔ Token */}
          {project.nft_token_link_tx && project.nft_uid && project.token_uid && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <h3 className="font-medium text-navy-deep mb-4 text-sm flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-600" />
                Vínculo NFT ↔ Token (On-chain)
              </h3>
              
              {/* Visual connection card */}
              <div className="flex items-center gap-3 mb-4">
                {/* NFT Box */}
                <div className="flex-1 bg-white rounded-lg p-3 border border-indigo-200 shadow-sm">
                  <p className="text-xs text-indigo-600 font-medium mb-1">NFT do Projeto</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-indigo-50 px-2 py-1 rounded text-indigo-700 truncate flex-1">
                      {project.nft_uid.substring(0, 12)}...
                    </code>
                    <a href={hathorExplorerToken(project.nft_uid)} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                
                {/* Connection arrow */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium mt-1">Vinculado</span>
                </div>
                
                {/* Token Box */}
                <div className="flex-1 bg-white rounded-lg p-3 border border-purple-200 shadow-sm">
                  <p className="text-xs text-purple-600 font-medium mb-1">Token {project.token_symbol}</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-purple-50 px-2 py-1 rounded text-purple-700 truncate flex-1">
                      {project.token_uid.substring(0, 12)}...
                    </code>
                    <a href={hathorExplorerToken(project.token_uid)} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-700">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Transaction details */}
              <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Transação de vinculação:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{project.nft_token_link_tx.substring(0, 20)}...</code>
                    <button onClick={() => copyToClipboard(project.nft_token_link_tx!, 'link_tx')} className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {copiedField === 'link_tx' && <span className="text-xs text-green-600">Copiado!</span>}
                    <a href={hathorExplorerTx(project.nft_token_link_tx)} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Dado gravado no NFT:</span>
                  <code className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">TOKEN:{project.token_uid.substring(0, 16)}...</code>
                </div>
                <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Este vínculo comprova na blockchain que os tokens {project.token_symbol} estão oficialmente associados ao NFT do projeto.
                </p>
              </div>
            </div>
          )}

          {!project.nft_uid && !project.token_uid && (
            <div className="text-center py-6 text-gray-500">
              <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Dados blockchain serão gerados após aprovação e início da captação</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

// Simple public layout for verification page
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Simple header */}
      <header className="bg-navy-deep border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-navy-deep font-bold text-lg">K</span>
            </div>
            <span className="text-white font-semibold">Kate</span>
          </Link>
          <Link to="/" className="text-white/70 hover:text-white text-sm">
            ← Voltar ao início
          </Link>
        </div>
      </header>
      
      {/* Main content */}
      <main className="pb-12">{children}</main>
      
      {/* Simple footer */}
      <footer className="border-t border-kate-border py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Verificação de dados blockchain • Kate Equity Crowdfunding</p>
        </div>
      </footer>
    </div>
  );
}

function TimelineItem({ 
  icon, 
  title, 
  date, 
  completed, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  date?: string | null; 
  completed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${completed ? 'text-navy-deep' : 'text-gray-400'}`}>
          {title}
        </p>
        {date && (
          <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString("pt-BR")}</p>
        )}
        {children}
      </div>
    </div>
  );
}
