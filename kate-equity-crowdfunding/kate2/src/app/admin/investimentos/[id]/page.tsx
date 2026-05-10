'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import {
  ArrowLeft, User, Building2, CreditCard, Hash, Calendar,
  ExternalLink, CheckCircle2, XCircle, RefreshCw, Clock,
  Coins, BadgeCheck, AlertTriangle,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pendente',    cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  icon: <Clock size={14}/> },
  confirmed: { label: 'Confirmado',  cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20',    icon: <CheckCircle2 size={14}/> },
  settled:   { label: 'Liquidado',   cls: 'text-green-400 bg-green-400/10 border-green-400/20', icon: <BadgeCheck size={14}/> },
  withdrawn: { label: 'Desistência', cls: 'text-white/40 bg-white/5 border-white/10',            icon: <XCircle size={14}/> },
  refunded:  { label: 'Reembolsado', cls: 'text-white/40 bg-white/5 border-white/10',            icon: <RefreshCw size={14}/> },
};

export default function InvestimentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const { data: reservations, isLoading } = trpc.investors.listPendingReservations.useQuery();
  const confirmRes = trpc.investors.confirmReservation.useMutation({ onSuccess: () => router.push('/admin/investimentos') });
  const rejectRes  = trpc.investors.rejectReservation.useMutation({ onSuccess: () => router.push('/admin/investimentos') });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-kate-yellow animate-spin" />
      </div>
    );
  }

  const r = (reservations ?? []).find((res: any) => res.id === id);

  if (!r) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto text-center py-16">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Reserva não encontrada</h2>
          <p className="text-white/40 mb-6">Este investimento pode já ter sido processado ou não existe.</p>
          <Link href="/admin/investimentos" className="text-kate-yellow hover:underline text-sm">
            ← Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  const st = statusConfig[r.status ?? 'pending'] ?? statusConfig.pending;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/investimentos"
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Investimentos
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60 text-sm font-mono">{id.slice(0, 8)}...</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="text-kate-yellow" />
            Detalhe do Investimento
          </h1>
          <p className="text-white/40 text-sm mt-1 font-mono">{id}</p>
        </div>
        <span className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border font-medium ${st.cls}`}>
          {st.icon} {st.label}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Investor card */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={14} /> Investidor
          </h2>
          <div className="space-y-3">
            <InfoRow label="Nome" value={r.investor?.full_name ?? '—'} />
            <InfoRow label="E-mail" value={r.investor?.email ?? '—'} mono />
          </div>
        </div>

        {/* Offer card */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 size={14} /> Oferta / Emissor
          </h2>
          <div className="space-y-3">
            <InfoRow label="Oferta"   value={r.offer?.title ?? '—'} />
            <InfoRow label="Emissor"  value={r.offer?.issuer?.trade_name ?? r.offer?.issuer?.legal_name ?? '—'} />
          </div>
        </div>

        {/* Investment details */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Coins size={14} /> Valores
          </h2>
          <div className="space-y-3">
            <InfoRow
              label="Valor (BRZ)"
              value={`R$ ${(r.amount_brz ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              highlight
            />
            <InfoRow label="Quantidade de tokens" value={(r.token_quantity ?? 0).toFixed(6)} mono />
            <InfoRow
              label="Preço unitário"
              value={r.token_quantity && r.amount_brz
                ? `R$ ${(r.amount_brz / r.token_quantity).toFixed(4)}`
                : '—'
              }
            />
          </div>
        </div>

        {/* Dates & chain */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={14} /> Datas & Blockchain
          </h2>
          <div className="space-y-3">
            <InfoRow
              label="Criado em"
              value={new Date(r.created_at).toLocaleString('pt-BR')}
            />
            {r.confirmed_at && (
              <InfoRow
                label="Confirmado em"
                value={new Date(r.confirmed_at).toLocaleString('pt-BR')}
              />
            )}
            {r.blockchain_tx_hash && (
              <div>
                <p className="text-xs text-white/40 mb-1">TX Hash</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${r.blockchain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-kate-yellow hover:underline text-xs font-mono break-all"
                >
                  {r.blockchain_tx_hash.slice(0, 32)}...
                  <ExternalLink size={11} className="shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {r.status === 'pending' && (
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => confirmRes.mutate({ reservation_id: id })}
            disabled={confirmRes.isPending || rejectRes.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-xl font-semibold transition-colors disabled:opacity-40"
          >
            {confirmRes.isPending ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirmar reserva
          </button>
          <button
            onClick={() => rejectRes.mutate({ reservation_id: id })}
            disabled={confirmRes.isPending || rejectRes.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl font-semibold transition-colors disabled:opacity-40"
          >
            {rejectRes.isPending ? <RefreshCw size={16} className="animate-spin" /> : <XCircle size={16} />}
            Rejeitar reserva
          </button>
        </div>
      )}

      {r.status === 'confirmed' && (
        <div className="mt-8 p-4 bg-blue-400/10 border border-blue-400/20 rounded-xl flex items-center gap-3 text-blue-400 text-sm">
          <CheckCircle2 size={16} />
          Reserva confirmada — aguardando liquidação via token admin (aba Tokens).
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: {
  label: string; value: string; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-white/30 mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? 'text-kate-yellow font-bold text-base' : 'text-white'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
