import prisma from '@/lib/prisma'
import Link   from 'next/link'
import { Users, ListOrdered, Building2, Coins, TrendingUp, Clock, CheckCircle, Wallet } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const [
    totalUsers, totalOffers, activeOffers,
    totalIssuers, pendingReservations,
    raisedAgg, totalWallets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.offer.count(),
    prisma.offer.count({ where: { status: 'active' } }),
    prisma.issuer.count(),
    prisma.reservation.count({ where: { status: 'pending' } }),
    prisma.reservation.aggregate({
      where: { status: { in: ['confirmed','settled'] } },
      _sum:  { amount_brz: true },
      _count: { id: true },
    }),
    prisma.wallet.count(),
  ]).catch(() => [0,0,0,0,0,{ _sum: { amount_brz: 0 }, _count: { id: 0 } },0])

  const kpis = [
    { icon: Users,       label: 'Usuários',             value: totalUsers,                         color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { icon: ListOrdered, label: 'Ofertas Ativas',        value: `${activeOffers} / ${totalOffers}`, color: 'text-kate-yellow', bg: 'bg-kate-yellow/10' },
    { icon: Building2,   label: 'Emissores',             value: totalIssuers,                       color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: TrendingUp,  label: 'Total Captado',         value: `R$ ${((raisedAgg as any)._sum?.amount_brz ?? 0).toLocaleString('pt-BR')}`, color: 'text-green-400', bg: 'bg-green-400/10' },
    { icon: Clock,       label: 'Investimentos Pending', value: pendingReservations,                 color: 'text-amber-400',  bg: 'bg-amber-400/10' },
    { icon: Wallet,      label: 'Wallets Stellar',       value: totalWallets,                       color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
  ]

  const recentReservations = await prisma.reservation.findMany({
    orderBy: { created_at: 'desc' },
    take:    10,
    include: {
      investor: { select: { full_name: true, email: true } },
      offer:    { include: { issuer: true } },
    },
  }).catch(() => [])

  const pendingTokenJobs = await prisma.reservation.findMany({
    where:   { status: 'confirmed', blockchain_tx_hash: null },
    include: {
      investor: { include: { wallet: true } },
      offer:    { include: { token_assets: true, issuer: true } },
    },
    take: 5,
  }).catch(() => [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
        <p className="text-white/40 text-sm mt-1">Visão geral da plataforma Kate Equity</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon size={22} className={k.color} />
            </div>
            <div>
              <p className="text-white/40 text-xs">{k.label}</p>
              <p className={`font-bold text-xl ${k.color}`}>{String(k.value)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Token Jobs */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Coins size={16} className="text-kate-yellow" />
              Emissões Pendentes (Stellar)
            </h2>
            <Link href="/admin/tokens" className="text-xs text-kate-yellow hover:underline">Ver todas →</Link>
          </div>
          {pendingTokenJobs.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 text-sm py-4">
              <CheckCircle size={16} /> Nenhuma emissão pendente
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTokenJobs.map(r => (
                <div key={r.id} className="p-3 bg-white/3 rounded-xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">
                      {r.investor.full_name || r.investor.email}
                    </span>
                    <span className="text-kate-yellow font-bold">
                      R$ {(r.amount_brz ?? 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">
                    {r.offer.issuer.trade_name} · {r.offer.token_assets[0]?.token_symbol ?? 'N/A'} · {(r.token_quantity ?? 0).toFixed(2)} tokens
                  </p>
                  {!r.investor.wallet && (
                    <p className="text-amber-400 text-xs mt-1">⚠ Investidor sem wallet Stellar</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reservations */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-white">Reservas Recentes</h2>
            <Link href="/admin/investimentos" className="text-xs text-kate-yellow hover:underline">Ver todas →</Link>
          </div>
          {recentReservations.length === 0 ? (
            <p className="text-white/40 text-sm py-4">Nenhuma reserva ainda.</p>
          ) : (
            <div className="space-y-2">
              {recentReservations.map(r => {
                const sc: Record<string, string> = {
                  pending:   'text-amber-400',
                  confirmed: 'text-blue-400',
                  settled:   'text-green-400',
                  refunded:  'text-white/40',
                }
                return (
                  <div key={r.id} className="flex items-center justify-between p-2.5 bg-white/3 rounded-xl text-sm">
                    <div className="min-w-0">
                      <p className="text-white/80 truncate">{r.investor.email}</p>
                      <p className="text-white/40 text-xs">{r.offer.issuer.trade_name ?? r.offer.issuer.legal_name}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-white font-semibold">R$ {(r.amount_brz ?? 0).toLocaleString('pt-BR')}</p>
                      <p className={`text-xs font-medium ${sc[r.status ?? 'pending'] ?? 'text-white/40'}`}>{r.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
