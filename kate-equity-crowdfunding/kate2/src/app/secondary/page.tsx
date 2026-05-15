'use client'

import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'
import {
  AlertTriangle, Megaphone, ArrowUpDown,
  HandCoins, Tag, User, Clock, Loader2, ScrollText
} from 'lucide-react'

export default function SecondaryMarketPage() {
  const { data: intentions, isLoading } = trpc.secondary.getOpenIntentions.useQuery()

  const sellIntentions = (intentions ?? []).filter(i => i.intention_type === 'sell')
  const buyIntentions  = (intentions ?? []).filter(i => i.intention_type === 'buy')
  const allIntentions  = [...sellIntentions, ...buyIntentions]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* CVM 88 Regulatory Banner */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-8 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-4 relative">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-amber-400 font-bold text-sm mb-1">
              Mercado de Balcão Não Organizado (CVM 88)
            </h2>
            <p className="text-amber-200/60 text-xs leading-relaxed">
              Transações P2P diretas entre investidores. A <strong className="text-amber-300">Kate Equity</strong> não
              atua como formadora de mercado, câmara de compensação ou contraparte central.
              As negociações são bilaterais e liquidadas diretamente na blockchain Stellar.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kate-yellow/10 flex items-center justify-center">
            <Megaphone size={20} className="text-kate-yellow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mural de Classificados</h1>
            <p className="text-white/40 text-xs">Intenções de compra e venda de tokens</p>
          </div>
        </div>
        <Link
          href="/secondary/create-order"
          className="flex items-center gap-2 bg-kate-orange text-kate-navy font-bold px-4 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all"
        >
          <Tag size={14} />
          Publicar Intenção
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total de Anúncios', value: allIntentions.length.toString(), color: 'text-white' },
          { label: 'Ofertas de Venda', value: sellIntentions.length.toString(), color: 'text-red-400' },
          { label: 'Ofertas de Compra', value: buyIntentions.length.toString(), color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-kate-dark-blue border border-white/10 rounded-xl p-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-wider">{s.label}</p>
            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-12 text-center animate-pulse">
          <Loader2 size={32} className="mx-auto text-kate-yellow animate-spin mb-3" />
          <p className="text-white/40 text-sm">Carregando classificados...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allIntentions.length === 0 && (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-12 text-center">
          <ScrollText size={40} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/40 text-sm mb-1">Nenhum anúncio publicado ainda.</p>
          <p className="text-white/25 text-xs">
            Seja o primeiro a publicar uma intenção de compra ou venda.
          </p>
        </div>
      )}

      {/* Classified List */}
      {!isLoading && allIntentions.length > 0 && (
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider border-b border-white/[0.06]">
            <div className="col-span-1">Tipo</div>
            <div className="col-span-4">Startup (Token)</div>
            <div className="col-span-2 text-right">Quantidade</div>
            <div className="col-span-2 text-right">Preço Unit. (BRZ)</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-2 text-right">Ação</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {allIntentions.map(intent => {
              const isSell = intent.intention_type === 'sell'
              const company = intent.token_asset?.issuer?.trade_name
                || intent.token_asset?.issuer?.legal_name
                || '—'
              const symbol = intent.token_asset?.token_symbol ?? '—'
              const qty = intent.quantity ?? 0
              const price = intent.price_per_token ?? 0
              const total = qty * price
              const posterName = intent.user?.full_name?.split(' ')[0] ?? 'Anônimo'
              const daysAgo = Math.floor(
                (Date.now() - new Date(intent.created_at).getTime()) / 86400000
              )

              return (
                <div
                  key={intent.id}
                  className="grid grid-cols-12 gap-2 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Type badge */}
                  <div className="col-span-12 sm:col-span-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                      isSell
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <ArrowUpDown size={9} />
                      {isSell ? 'Venda' : 'Compra'}
                    </span>
                  </div>

                  {/* Startup + Token */}
                  <div className="col-span-6 sm:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-kate-yellow/10 flex items-center justify-center shrink-0">
                      <span className="text-kate-yellow text-xs font-bold font-mono">
                        {symbol.substring(0, 3)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{company}</p>
                      <div className="flex items-center gap-2 text-white/25 text-[10px]">
                        <span className="font-mono">{symbol}</span>
                        <span className="flex items-center gap-0.5">
                          <User size={8} /> {posterName}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={8} /> {daysAgo === 0 ? 'Hoje' : `${daysAgo}d`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <p className="text-white font-bold text-sm">{qty.toLocaleString('pt-BR')}</p>
                    <p className="text-white/20 text-[10px] sm:hidden">tokens</p>
                  </div>

                  {/* Price */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <p className="text-white/80 text-sm font-semibold">
                      R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Total (hidden on mobile) */}
                  <div className="hidden sm:block sm:col-span-1 text-right">
                    <p className="text-white/40 text-xs">
                      R$ {total.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="col-span-12 sm:col-span-2 flex justify-end mt-2 sm:mt-0">
                    <button
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                        isSell
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                      }`}
                    >
                      <HandCoins size={12} />
                      Tenho Interesse
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <p className="text-white/25 text-[10px] leading-relaxed text-center">
          As informações neste mural são fornecidas pelos próprios investidores.
          A Kate Equity não verifica, garante ou recomenda nenhuma negociação.
          Conforme CVM 88, a plataforma não cobra taxa de intermediação no mercado secundário
          de tokens emitidos via equity crowdfunding. Toda liquidação é registrada na blockchain Stellar (Testnet).
        </p>
      </div>
    </div>
  )
}
