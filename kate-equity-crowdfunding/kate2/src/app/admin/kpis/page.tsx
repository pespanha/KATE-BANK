import prisma from '@/lib/prisma'
import type { Metadata } from 'next'
import { BarChart3, TrendingUp, Users, Building2, Coins, Clock, Wallet, ListOrdered } from 'lucide-react'

export const metadata: Metadata = { title: 'KPIs' }

export default async function AdminKpisPage() {
  const [
    totalUsers,
    totalIssuers,
    totalOffers,
    activeOffers,
    pendingReservations,
    confirmedAgg,
    settledAgg,
    totalWallets,
    recentActivity,
    topOffers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.issuer.count(),
    prisma.offer.count(),
    prisma.offer.count({ where: { status: 'active' } }),
    prisma.reservation.count({ where: { status: 'pending' } }),
    prisma.reservation.aggregate({
      where: { status: 'confirmed' },
      _sum:  { amount_brz: true },
      _count: { id: true },
    }),
    prisma.reservation.aggregate({
      where: { status: 'settled' },
      _sum:  { amount_brz: true },
      _count: { id: true },
    }),
    prisma.wallet.count(),
    prisma.auditLog.findMany({
      take:    10,
      orderBy: { created_at: 'desc' },
      include: { actor: { select: { email: true, full_name: true } } },
    }),
    prisma.offer.findMany({
      where:   { status: 'active' },
      include: {
        issuer: true,
        reservations: {
          where:  { status: { in: ['confirmed', 'settled'] } },
          select: { amount_brz: true },
        },
      },
      take: 5,
    }),
  ]).catch(() => [0,0,0,0,0,
    { _sum: { amount_brz: 0 }, _count: { id: 0 } },
    { _sum: { amount_brz: 0 }, _count: { id: 0 } },
    0,[],[],
  ])

  const totalRaised =
    ((confirmedAgg as any)?._sum?.amount_brz ?? 0) +
    ((settledAgg as any)?._sum?.amount_brz ?? 0)

  const kpis = [
    { icon: Users,       label: 'Total Usuários',      value: totalUsers,                                   color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { icon: Building2,   label: 'Emissores',            value: totalIssuers,                                 color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: ListOrdered, label: 'Ofertas (Ativas/Total)', value: `${activeOffers} / ${totalOffers}`,          color: 'text-kate-yellow', bg: 'bg-kate-yellow/10' },
    { icon: TrendingUp,  label: 'Total Captado',        value: `R$ ${totalRaised.toLocaleString('pt-BR')}`,   color: 'text-green-400',  bg: 'bg-green-400/10' },
    { icon: Coins,       label: 'Investimentos Liquid.',  value: (settledAgg as any)?._count?.id ?? 0,        color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
    { icon: Clock,       label: 'Reservas Pendentes',    value: pendingReservations,                          color: 'text-amber-400',  bg: 'bg-amber-400/10' },
    { icon: Wallet,      label: 'Wallets Stellar',       value: totalWallets,                                 color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="text-kate-yellow" /> KPIs da Plataforma
        </h1>
        <p className="text-white/40 text-sm mt-1">Métricas em tempo real · Kate Equity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {kpis.map(k => (
          <div key={k.label} className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon size={18} className={k.color} />
            </div>
            <p className={`text-2xl font-black ${k.color}`}>{String(k.value)}</p>
            <p className="text-white/40 text-xs mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Offers */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-kate-yellow" /> Top Ofertas Ativas
          </h2>
          {(topOffers as any[]).length === 0 ? (
            <p className="text-white/30 text-sm">Nenhuma oferta ativa.</p>
          ) : (
            <div className="space-y-3">
              {(topOffers as any[]).map((offer: any) => {
                const raised = offer.reservations.reduce((s: number, r: any) => s + (r.amount_brz ?? 0), 0)
                const progress = offer.max_target ? Math.min((raised / offer.max_target) * 100, 100) : 0
                return (
                  <div key={offer.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">{offer.issuer.trade_name ?? offer.issuer.legal_name}</span>
                      <span className="text-kate-yellow font-semibold">R$ {raised.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full">
                      <div
                        className="h-full bg-kate-yellow rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-white/30 text-xs mt-0.5">{progress.toFixed(0)}% da meta</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <Clock size={16} className="text-kate-yellow" /> Atividade Recente
          </h2>
          {(recentActivity as any[]).length === 0 ? (
            <p className="text-white/30 text-sm">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-2">
              {(recentActivity as any[]).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/3 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-kate-yellow/60 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-mono">{log.action}</p>
                    <p className="text-white/30 text-xs">{log.actor?.email ?? 'system'} · {log.entity_type}/{log.entity_id?.substring(0, 8)}</p>
                  </div>
                  <p className="text-white/20 text-xs shrink-0">
                    {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
