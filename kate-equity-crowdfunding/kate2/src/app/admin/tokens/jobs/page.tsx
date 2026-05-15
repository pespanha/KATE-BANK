'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Coins, Search, CheckCircle2, XCircle, Clock,
  Loader2, RefreshCw, ExternalLink, User, Megaphone,
  Play, Zap, AlertTriangle, BadgeCheck,
} from 'lucide-react';

const STATUS_FILTERS = ['todos', 'pendente', 'concluído', 'erro'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function TokenJobsPage() {
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<StatusFilter>('todos');
  const [processingId, setId]       = useState<string | null>(null);
  const [batchRunning, setBatch]    = useState(false);
  const [batchResult, setBatchResult] = useState<{ success: number; failed: number } | null>(null);

  const { data: jobs = [], refetch, isLoading } = trpc.admin.listPendingTokenJobs.useQuery(
    undefined, { refetchInterval: 15_000 }
  );

  const processOne = trpc.admin.processTokenJob.useMutation({
    onMutate: ({ reservation_id }) => setId(reservation_id),
    onSettled: () => { setId(null); refetch(); },
    onError: (e) => alert(`Erro: ${e.message}`),
  });

  const processAll = trpc.admin.processAllTokenJobs.useMutation({
    onMutate: () => setBatch(true),
    onSuccess: (r) => { setBatchResult(r); refetch(); },
    onSettled: () => setBatch(false),
    onError: (e) => alert(`Erro: ${e.message}`),
  });

  // Stats derived from data
  const stats = {
    pending:   jobs.length,
    completed: 0, // listPendingTokenJobs only returns pending — completed shown elsewhere
  };

  // Client-side filtering by search
  const filtered = jobs.filter(j => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.investor?.email?.toLowerCase().includes(q) ||
      j.offer?.title?.toLowerCase().includes(q) ||
      j.offer?.issuer?.trade_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Coins className="text-kate-yellow" /> Token Jobs
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Fila de emissão de tokens RWA na rede Stellar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Atualizar
          </button>
          {jobs.length > 0 && (
            <button
              onClick={() => processAll.mutate()}
              disabled={batchRunning || !!processingId}
              className="flex items-center gap-2 px-4 py-2 bg-kate-orange text-kate-navy font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {batchRunning
                ? <><Loader2 size={14} className="animate-spin" /> Emitindo...</>
                : <><Zap size={14} /> Emitir todos ({jobs.length})</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Batch result banner */}
      {batchResult && (
        <div className="mb-6 p-4 bg-green-400/10 border border-green-400/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-green-400 text-sm">
            <BadgeCheck size={18} />
            <span>
              Lote concluído: <strong>{batchResult.success}</strong> emitidos,{' '}
              <strong>{batchResult.failed}</strong> com erro.
            </span>
          </div>
          <button onClick={() => setBatchResult(null)} className="text-white/30 hover:text-white text-xs">fechar</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pendentes',   value: jobs.length,    icon: Clock,       cls: 'text-amber-400 bg-amber-400/10' },
          { label: 'Processando', value: processingId ? 1 : 0, icon: Loader2, cls: 'text-blue-400 bg-blue-400/10' },
          { label: 'Concluídos',  value: '—',            icon: CheckCircle2,cls: 'text-green-400 bg-green-400/10' },
          { label: 'Com erro',    value: '—',            icon: XCircle,     cls: 'text-red-400 bg-red-400/10' },
        ].map((s, i) => (
          <div key={i} className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.cls}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stellar notice */}
      <div className="mb-6 p-4 bg-kate-yellow/5 border border-kate-yellow/20 rounded-xl flex items-start gap-3">
        <Coins size={18} className="text-kate-yellow shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-kate-yellow">Integração Stellar ativa</p>
          <p className="text-xs text-white/40 mt-0.5">
            Tokens RWA são emitidos diretamente na Stellar Testnet. Cada emissão gera um TX Hash verificável no Stellar Expert.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por investidor, oferta ou emissor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-kate-dark-blue border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-kate-yellow/50 transition-colors"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-kate-yellow animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-16 text-center">
          <Coins className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {search ? 'Nenhum resultado para a busca' : 'Nenhum job pendente'}
          </h3>
          <p className="text-white/30 text-sm">
            {search
              ? 'Tente buscar por outro termo.'
              : 'Jobs surgem quando uma reserva é confirmada e ainda não teve tokens emitidos.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Investidor', 'Oferta / Emissor', 'Valor', 'Tokens', 'Data confirm.', 'Ação'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => {
                const isProcessing = processingId === job.id;
                return (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-white/30" />
                        <div>
                          <p className="text-white font-medium">{job.investor?.full_name || '—'}</p>
                          <p className="text-white/30 text-xs">{job.investor?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Megaphone size={13} className="text-white/30" />
                        <div>
                          <p className="text-white/80 text-xs">{job.offer?.title || '—'}</p>
                          <p className="text-white/30 text-xs">{job.offer?.issuer?.trade_name || job.offer?.issuer?.legal_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">
                      R$ {(job.amount_brz ?? 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-5 py-4 text-kate-yellow text-xs font-mono">
                      {(job.token_quantity ?? 0).toFixed(4)}
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs">
                      {job.confirmed_at
                        ? new Date(job.confirmed_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => processOne.mutate({ reservation_id: job.id })}
                        disabled={!!processingId || batchRunning}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-kate-yellow/10 border border-kate-yellow/20 text-kate-yellow hover:bg-kate-yellow/20 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                      >
                        {isProcessing
                          ? <><Loader2 size={12} className="animate-spin" /> Emitindo...</>
                          : <><Play size={12} /> Emitir token</>
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
