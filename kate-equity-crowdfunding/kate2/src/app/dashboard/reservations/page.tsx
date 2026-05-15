import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import prisma           from '@/lib/prisma'
import Link             from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Minhas Reservas — Kate Equity' }

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const reservations = await prisma.reservation.findMany({
    where:   { investor_id: user.id },
    include: { offer: { include: { issuer: true } } },
    orderBy: { created_at: 'desc' },
  }).catch(() => [])

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    pending_escrow: 'Escrow',
    confirmed: 'Confirmada',
    settled: 'Liquidada',
    refunded: 'Reembolsada',
    withdrawn: 'Desistência',
  }

  const statusColor: Record<string, string> = {
    pending:        'text-amber-400 bg-amber-400/10',
    pending_escrow: 'text-amber-400 bg-amber-400/10',
    confirmed:      'text-blue-400 bg-blue-400/10',
    settled:        'text-green-400 bg-green-400/10',
    refunded:       'text-white/40 bg-white/5',
    withdrawn:      'text-red-400 bg-red-400/10',
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calendar className="text-kate-yellow" /> Minhas Reservas
        </h1>
        <p className="text-white/40 text-sm mt-1">Histórico de investimentos e reservas</p>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-16 text-center">
          <Calendar size={40} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/40 text-sm">Nenhuma reserva encontrada.</p>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 mt-4 bg-kate-orange text-kate-navy font-bold px-4 py-2 rounded-xl text-sm hover:brightness-110 transition-all"
          >
            Ver Oportunidades <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Empresa', 'Data', 'Valor (BRZ)', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => {
                const sc = statusColor[r.status ?? 'pending'] ?? statusColor['pending']
                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{r.offer.issuer.trade_name || r.offer.issuer.legal_name}</p>
                      <p className="text-white/30 text-xs">{r.offer.title}</p>
                    </td>
                    <td className="px-5 py-4 text-white/60 text-xs">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4 text-white font-bold">
                      R$ {(r.amount_brz ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc}`}>
                        {statusLabels[r.status ?? 'pending'] ?? r.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
