import prisma from '@/lib/prisma'
import type { Metadata } from 'next'
import { CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Pagamentos' }

const statusStyle: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendente',   cls: 'bg-amber-400/10 text-amber-400' },
  confirmed: { label: 'Confirmado', cls: 'bg-blue-400/10 text-blue-400' },
  settled:   { label: 'Liquidado',  cls: 'bg-green-400/10 text-green-400' },
  refunded:  { label: 'Reembolsado',cls: 'bg-white/10 text-white/40' },
}

export default async function AdminPagamentosPage() {
  const [allReservations, agg] = await Promise.all([
    prisma.reservation.findMany({
      include: {
        investor: { select: { email: true, full_name: true } },
        offer:    { include: { issuer: true } },
      },
      orderBy: { created_at: 'desc' },
      take:    100,
    }).catch(() => []),
    prisma.reservation.groupBy({
      by:    ['status'],
      _sum:  { amount_brz: true },
      _count: { id: true },
    }).catch(() => []),
  ])

  const pendingTotal   = (agg.find((a: any) => a.status === 'pending')?._sum?.amount_brz ?? 0)
  const confirmedTotal = (agg.find((a: any) => a.status === 'confirmed')?._sum?.amount_brz ?? 0)
  const settledTotal   = (agg.find((a: any) => a.status === 'settled')?._sum?.amount_brz ?? 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <CreditCard className="text-kate-yellow" /> Pagamentos
        </h1>
        <p className="text-white/40 text-sm mt-1">Fluxo financeiro da plataforma</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pendente',   value: pendingTotal,   icon: Clock,        color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Confirmado', value: confirmedTotal, icon: TrendingUp,   color: 'text-blue-400',  bg: 'bg-blue-400/10' },
          { label: 'Liquidado',  value: settledTotal,   icon: CheckCircle,  color: 'text-green-400', bg: 'bg-green-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <p className="text-white/40 text-xs">{s.label}</p>
              <p className={`font-black text-xl ${s.color}`}>
                R$ {s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reservation table */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-white">Todas as Reservas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Data', 'Investidor', 'Oferta', 'Valor (BRZ)', 'Tokens', 'Status', 'Tx Hash'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allReservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-white/30">Nenhuma reserva.</td>
                </tr>
              )}
              {allReservations.map((r: any) => {
                const st = statusStyle[r.status ?? 'pending'] ?? statusStyle.pending
                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 text-white/40 text-xs">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-white/80 text-xs">{r.investor.full_name || '—'}</p>
                      <p className="text-white/40 text-xs">{r.investor.email}</p>
                    </td>
                    <td className="px-5 py-3 text-white/60 text-xs">
                      {r.offer.issuer.trade_name ?? r.offer.issuer.legal_name}
                    </td>
                    <td className="px-5 py-3 text-white font-semibold text-xs">
                      R$ {(r.amount_brz ?? 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-5 py-3 text-kate-yellow font-mono text-xs">
                      {(r.token_quantity ?? 0).toFixed(4)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.blockchain_tx_hash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${r.blockchain_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-kate-yellow/60 hover:text-kate-yellow transition-colors"
                        >
                          {r.blockchain_tx_hash.substring(0, 12)}...
                        </a>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
