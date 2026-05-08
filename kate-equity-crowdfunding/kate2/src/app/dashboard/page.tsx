import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import prisma           from '@/lib/prisma'
import Link             from 'next/link'
import { Wallet, TrendingUp, Clock, ArrowRight, Star, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard do Investidor' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [dbUser, wallet, reservations, positions, activeOffers] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, include: { investor_profile: true } }).catch(() => null),
    prisma.wallet.findUnique({ where: { user_id: user.id } }).catch(() => null),
    prisma.reservation.findMany({
      where:   { investor_id: user.id },
      include: { offer: { include: { issuer: true } } },
      orderBy: { created_at: 'desc' },
      take: 5,
    }).catch(() => []),
    prisma.investorPosition.findMany({
      where:   { user_id: user.id },
      include: { offer: { include: { issuer: true } }, token_asset: true },
    }).catch(() => []),
    prisma.offer.findMany({
      where: { status: 'active' },
      take:  3,
      include: { issuer: true },
    }).catch(() => []),
  ])

  const totalInvested = reservations
    .filter(r => ['confirmed','settled'].includes(r.status ?? ''))
    .reduce((s, r) => s + (r.amount_brz ?? 0), 0)

  const pendingCount  = reservations.filter(r => r.status === 'pending').length
  const profile       = dbUser?.investor_profile
  const kycComplete   = !!profile
  const hasWallet     = !!wallet

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Welcome */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Olá, {dbUser?.full_name?.split(' ')[0] || user.email?.split('@')[0]} 👋
          </h1>
          <p className="text-white/50 text-sm mt-1">Seu painel de investimentos Kate Equity</p>
        </div>
        <Link href="/offers" className="hidden sm:flex items-center gap-2 bg-kate-yellow text-kate-dark-blue font-bold px-4 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all">
          Novas Oportunidades <ArrowRight size={14} />
        </Link>
      </div>

      {/* Alerts */}
      {!kycComplete && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0" />
          <div className="flex-1 text-sm text-amber-200/80">
            <strong className="text-amber-400">Complete seu perfil de investidor</strong> para poder investir.
          </div>
          <Link href="/onboarding" className="text-amber-400 text-xs font-bold hover:underline shrink-0">
            Completar KYC →
          </Link>
        </div>
      )}
      {!hasWallet && kycComplete && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Wallet size={18} className="text-blue-400 shrink-0" />
          <div className="flex-1 text-sm text-blue-200/80">
            <strong className="text-blue-400">Ative sua wallet Stellar</strong> para receber tokens.
          </div>
          <Link href="/onboarding" className="text-blue-400 text-xs font-bold hover:underline shrink-0">
            Ativar Wallet →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: TrendingUp,
            label: 'Total Investido',
            value: `R$ ${totalInvested.toLocaleString('pt-BR')}`,
            color: 'text-green-400',
            bg:    'bg-green-400/10',
          },
          {
            icon: Star,
            label: 'Posições',
            value: positions.length.toString(),
            color: 'text-kate-yellow',
            bg:    'bg-kate-yellow/10',
          },
          {
            icon: Clock,
            label: 'Pendentes',
            value: pendingCount.toString(),
            color: 'text-amber-400',
            bg:    'bg-amber-400/10',
          },
          {
            icon: Wallet,
            label: 'Wallet Stellar',
            value: hasWallet ? 'Ativa' : 'Inativa',
            color: hasWallet ? 'text-green-400' : 'text-white/30',
            bg:    hasWallet ? 'bg-green-400/10' : 'bg-white/5',
          },
        ].map(k => (
          <div key={k.label} className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon size={22} className={k.color} />
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">{k.label}</p>
              <p className={`font-bold text-lg ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservations */}
        <div className="lg:col-span-2 bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-white">Minhas Reservas</h2>
            <span className="text-xs text-white/40">{reservations.length} total</span>
          </div>
          {reservations.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp size={36} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40 text-sm">Nenhuma reserva ainda.</p>
              <Link href="/offers" className="text-kate-yellow text-sm hover:underline mt-2 inline-block">
                Explorar oportunidades →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(r => {
                const statusColor: Record<string, string> = {
                  pending:   'text-amber-400 bg-amber-400/10',
                  confirmed: 'text-blue-400 bg-blue-400/10',
                  settled:   'text-green-400 bg-green-400/10',
                  refunded:  'text-white/40 bg-white/5',
                  withdrawn: 'text-red-400 bg-red-400/10',
                }
                const sc = statusColor[r.status ?? 'pending'] ?? statusColor['pending']
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-white/3 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {r.offer.issuer.trade_name || r.offer.issuer.legal_name}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-white font-bold text-sm">R$ {(r.amount_brz ?? 0).toLocaleString('pt-BR')}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active Offers Sidebar */}
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4">Ofertas Abertas</h2>
          {activeOffers.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma oferta ativa no momento.</p>
          ) : (
            <div className="space-y-3">
              {activeOffers.map(o => (
                <Link key={o.id} href={`/offers/${o.id}`}
                  className="block p-3 bg-white/3 hover:bg-white/5 rounded-xl transition-colors group">
                  <p className="text-white font-medium text-sm group-hover:text-kate-yellow transition-colors truncate">
                    {o.issuer.trade_name || o.issuer.legal_name}
                  </p>
                  <p className="text-white/40 text-xs">{o.issuer.sector}</p>
                  <p className="text-kate-yellow text-xs font-semibold mt-1">
                    Mín. R$ {(o.min_investment ?? 0).toLocaleString('pt-BR')}
                  </p>
                </Link>
              ))}
              <Link href="/offers" className="block text-center text-xs text-kate-yellow hover:underline mt-1 pt-1">
                Ver todas as ofertas →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Info */}
      {wallet && (
        <div className="mt-6 bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-kate-yellow" /> Minha Wallet Stellar
          </h2>
          <div className="flex flex-wrap gap-6">
            <div>
              <span className="text-white/40 text-xs block mb-1">Chave Pública</span>
              <code className="text-white/80 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-lg">
                {wallet.stellar_public_key}
              </code>
            </div>
            <div>
              <span className="text-white/40 text-xs block mb-1">Status</span>
              <span className="text-green-400 text-sm font-medium">{wallet.status}</span>
            </div>
            <div>
              <span className="text-white/40 text-xs block mb-1">Custodia</span>
              <span className="text-white/80 text-sm">{wallet.custody_type}</span>
            </div>
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${wallet.stellar_public_key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-kate-yellow hover:underline mt-3"
          >
            Ver na Stellar Explorer →
          </a>
        </div>
      )}
    </div>
  )
}
