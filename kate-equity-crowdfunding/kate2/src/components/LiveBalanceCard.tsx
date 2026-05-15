'use client'

import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'
import { Coins, Gem, ArrowDownToLine, RefreshCw, ExternalLink } from 'lucide-react'

export function LiveBalanceCard() {
  const { data, isLoading, isError, refetch, isFetching } = trpc.stellar.getLiveBalances.useQuery(
    undefined,
    { refetchInterval: 30_000 } // auto-refresh every 30s
  )

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-kate-dark-blue to-[#1a2a4a] border border-white/10 rounded-2xl p-6 mb-8 animate-pulse">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div>
            <div className="h-3 w-32 bg-white/10 rounded mb-2" />
            <div className="h-2 w-20 bg-white/5 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 h-24" />
          <div className="bg-white/5 rounded-xl p-4 h-24" />
        </div>
      </div>
    )
  }

  if (isError || !data?.hasWallet) {
    return null // Hide card if no wallet
  }

  const brzNum = parseFloat(data.brz)
  const xlmNum = parseFloat(data.xlm)

  return (
    <div className="bg-gradient-to-br from-kate-dark-blue to-[#1a2a4a] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-kate-yellow/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kate-yellow/10 flex items-center justify-center">
            <Coins size={20} className="text-kate-yellow" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Saldo na Blockchain</h2>
            <p className="text-white/30 text-xs">Stellar Testnet · Tempo real</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Atualizar saldos"
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kate-yellow"
          title="Atualizar saldos"
        >
          <RefreshCw size={14} className={`text-white/40 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        {/* BRZ Balance */}
        <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-bold">R$</span>
            </div>
            <span className="text-white/40 text-xs font-medium">BRZ (Stablecoin)</span>
          </div>
          <p className="text-white font-bold text-2xl tracking-tight">
            {brzNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-white/25 text-xs mt-1">
            ≈ R$ {brzNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* XLM Balance */}
        <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Gem size={14} className="text-blue-400" />
            </div>
            <span className="text-white/40 text-xs font-medium">XLM (Lumens)</span>
          </div>
          <p className="text-white font-bold text-2xl tracking-tight">
            {xlmNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
          <p className="text-white/25 text-xs mt-1">
            Taxa de rede / reserva mínima
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06] relative">
        <Link
          href="/dashboard/depositar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-kate-yellow hover:brightness-125 transition-all"
        >
          <ArrowDownToLine size={14} />
          Depositar BRZ
        </Link>

        {data.publicKey && (
          <a
            href={`https://stellar.expert/explorer/testnet/account/${data.publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            Ver na Explorer <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  )
}
