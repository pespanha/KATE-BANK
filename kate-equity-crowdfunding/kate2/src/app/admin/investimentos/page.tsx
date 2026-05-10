'use client'
import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { CreditCard, CheckCircle, XCircle, RefreshCw, Search, Filter, Eye } from 'lucide-react'

type Reservation = {
  id: string
  status: string | null
  amount_brz: number | null
  token_quantity: number | null
  created_at: Date
  confirmed_at: Date | null
  blockchain_tx_hash: string | null
  investor: { email: string; full_name: string | null }
  offer: { title: string | null; issuer: { trade_name: string | null; legal_name: string } }
}

const statusStyle: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendente',   cls: 'bg-amber-400/15 text-amber-400' },
  confirmed: { label: 'Confirmado', cls: 'bg-blue-400/15 text-blue-400' },
  settled:   { label: 'Liquidado',  cls: 'bg-green-400/15 text-green-400' },
  refunded:  { label: 'Reembolsado',cls: 'bg-white/10 text-white/40' },
}

export default function AdminInvestimentosPage() {
  const [search, setSearch]       = useState('')
  const [statusFilter, setFilter] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { data: pending, refetch: refetchPending } = trpc.investors.listPendingReservations.useQuery()
  const confirmRes = trpc.investors.confirmReservation.useMutation({
    onSuccess: () => { refetchPending(); setProcessingId(null) },
    onError:   (e) => { alert(e.message); setProcessingId(null) },
  })
  const rejectRes = trpc.investors.rejectReservation.useMutation({
    onSuccess: () => { refetchPending(); setProcessingId(null) },
    onError:   (e) => { alert(e.message); setProcessingId(null) },
  })

  // We show pending reservations with confirm/reject actions
  const reservations = (pending ?? []) as Reservation[]
  const filtered = reservations.filter(r => {
    const matchSearch = !search ||
      r.investor.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.investor.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="text-kate-yellow" /> Investimentos
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {reservations.length} reserva(s) pendente(s)
          </p>
        </div>
        <button
          onClick={() => refetchPending()}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar investidor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-kate-dark-blue border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-kate-yellow/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-kate-dark-blue border border-white/10 rounded-xl text-sm text-white focus:outline-none appearance-none"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusStyle).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Investidor', 'Oferta', 'Valor', 'Tokens', 'Data', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-white/30">
                  Nenhuma reserva pendente.
                </td>
              </tr>
            )}
            {filtered.map(r => {
              const st = statusStyle[r.status ?? 'pending'] ?? statusStyle.pending
              const isProcessing = processingId === r.id

              return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{r.investor.full_name || '—'}</p>
                    <p className="text-white/40 text-xs">{r.investor.email}</p>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs">
                    {r.offer.issuer.trade_name ?? r.offer.issuer.legal_name}
                  </td>
                  <td className="px-5 py-4 text-white font-semibold">
                    R$ {(r.amount_brz ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-4 text-kate-yellow text-xs font-mono">
                    {(r.token_quantity ?? 0).toFixed(4)}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs">
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/investimentos/${r.id}`}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-kate-yellow transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={13} /> Detalhes
                      </Link>
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setProcessingId(r.id)
                            confirmRes.mutate({ reservation_id: r.id })
                          }}
                          disabled={!!processingId}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-40 transition-colors"
                          title="Confirmar"
                        >
                          {isProcessing
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <CheckCircle size={13} />
                          }
                          Confirmar
                        </button>
                        <button
                          onClick={() => {
                            setProcessingId(r.id)
                            rejectRes.mutate({ reservation_id: r.id })
                          }}
                          disabled={!!processingId}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                          title="Rejeitar"
                        >
                          <XCircle size={13} /> Rejeitar
                        </button>
                      </div>
                    )}
                    {r.status === 'confirmed' && (
                      <span className="text-xs text-blue-400">Aguarda emissão</span>
                    )}
                    {r.status === 'settled' && r.blockchain_tx_hash && (
                      <code className="text-xs text-green-400/60 font-mono truncate max-w-[80px] block" title={r.blockchain_tx_hash}>
                        {r.blockchain_tx_hash.substring(0, 12)}...
                      </code>
                    )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
