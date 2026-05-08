'use client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Coins, Zap, CheckCircle, XCircle, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react'

export default function AdminTokensPage() {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const stellarConfig    = trpc.stellar.getConfig.useQuery()
  const stellarStatus    = trpc.stellar.testConnection.useQuery()
  const pendingJobs      = trpc.admin.listPendingTokenJobs.useQuery()
  const settleReservation = trpc.admin.settleReservation.useMutation({
    onSuccess: () => {
      pendingJobs.refetch()
      setProcessingId(null)
    },
    onError: (err) => {
      alert(`Erro: ${err.message}`)
      setProcessingId(null)
    },
  })
  const transferTokens = trpc.stellar.transferTokens.useMutation()

  async function handleEmitTokens(reservationId: string, investorPublicKey: string, assetCode: string, amount: number) {
    setProcessingId(reservationId)
    try {
      const result = await transferTokens.mutateAsync({
        investorPublicKey,
        assetCode,
        amount,
        memo: `KATE_INV_${reservationId.substring(0, 10)}`,
      })
      if (result.success && result.txHash) {
        await settleReservation.mutateAsync({ reservation_id: reservationId, blockchain_tx_hash: result.txHash })
      } else {
        alert(`Falha na transferência Stellar: ${result.error}`)
        setProcessingId(null)
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`)
      setProcessingId(null)
    }
  }

  const isConnected = stellarStatus.data?.connected
  const isSimulated = stellarConfig.data?.isSimulated

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Coins className="text-kate-yellow" /> Tokens Stellar
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Emissão e transferência de tokens para investidores confirmados
        </p>
      </div>

      {/* Stellar Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            {stellarStatus.isLoading ? (
              <RefreshCw size={16} className="text-white/40 animate-spin" />
            ) : isConnected ? (
              <Wifi size={16} className="text-green-400" />
            ) : (
              <WifiOff size={16} className="text-red-400" />
            )}
            <span className="text-sm font-medium text-white">Status da Rede</span>
          </div>
          <p className={`text-lg font-bold ${isConnected ? 'text-green-400' : stellarStatus.isLoading ? 'text-white/40' : 'text-red-400'}`}>
            {stellarStatus.isLoading ? 'Verificando...' : isConnected ? 'Conectado' : 'Desconectado'}
          </p>
          <p className="text-white/40 text-xs mt-1">{stellarStatus.data?.network ?? '—'}</p>
        </div>

        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-medium text-white mb-2">Modo</p>
          <p className={`text-lg font-bold ${isSimulated ? 'text-amber-400' : 'text-green-400'}`}>
            {isSimulated ? 'Simulado' : 'Produção'}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {isSimulated ? 'Transações não vão para blockchain real' : stellarConfig.data?.isTestnet ? 'Testnet' : 'Mainnet'}
          </p>
        </div>

        <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-medium text-white mb-2">Kate Public Key</p>
          <code className="text-kate-yellow text-xs font-mono break-all">
            {stellarConfig.data?.katePublicKey ?? '—'}
          </code>
        </div>
      </div>

      {/* Pending Token Jobs */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Zap size={18} className="text-kate-yellow" />
            Emissões Pendentes
            {pendingJobs.data && (
              <span className="bg-kate-yellow/20 text-kate-yellow text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                {pendingJobs.data.length}
              </span>
            )}
          </h2>
          <button onClick={() => pendingJobs.refetch()} className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>

        {pendingJobs.isLoading && (
          <div className="text-center py-10 text-white/40 text-sm">Carregando...</div>
        )}

        {pendingJobs.data?.length === 0 && (
          <div className="flex items-center justify-center gap-3 py-10 text-green-400">
            <CheckCircle size={24} />
            <div>
              <p className="font-medium">Nenhuma emissão pendente!</p>
              <p className="text-sm text-green-400/60">Todos os tokens foram emitidos com sucesso.</p>
            </div>
          </div>
        )}

        {pendingJobs.data && pendingJobs.data.length > 0 && (
          <div className="space-y-4">
            {pendingJobs.data.map((job: any) => {
              const tokenAsset     = job.offer.token_assets[0]
              const investorWallet = job.investor.wallet
              const canEmit        = !!investorWallet && !!tokenAsset
              const isProcessing   = processingId === job.id

              return (
                <div key={job.id} className="border border-white/10 rounded-xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">
                          {job.investor.full_name || job.investor.email}
                        </span>
                        <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full">Confirmado</span>
                      </div>
                      <p className="text-white/40 text-xs">{job.investor.email}</p>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <span className="text-white/30 text-xs block">Oferta</span>
                          <span className="text-white/80 text-sm font-medium">{job.offer.issuer.trade_name ?? job.offer.issuer.legal_name}</span>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs block">Token</span>
                          <span className="text-kate-yellow text-sm font-bold font-mono">{tokenAsset?.token_symbol ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs block">Quantidade</span>
                          <span className="text-white text-sm font-bold">{(job.token_quantity ?? 0).toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-white/30 text-xs block">Valor</span>
                          <span className="text-white text-sm font-bold">R$ {(job.amount_brz ?? 0).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Wallet */}
                      {investorWallet ? (
                        <div className="mt-2 text-xs text-white/30">
                          Wallet: <code className="text-white/50">{investorWallet.stellar_public_key.substring(0, 20)}...</code>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                          <XCircle size={12} /> Investidor não possui wallet Stellar — não é possível emitir tokens
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {canEmit ? (
                        <button
                          onClick={() => handleEmitTokens(
                            job.id,
                            investorWallet!.stellar_public_key,
                            tokenAsset!.token_symbol!,
                            job.token_quantity ?? 0
                          )}
                          disabled={isProcessing || !!processingId}
                          className="flex items-center gap-2 bg-kate-yellow text-kate-dark-blue font-bold px-5 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <><RefreshCw size={14} className="animate-spin" /> Emitindo...</>
                          ) : (
                            <><Zap size={14} /> Emitir Tokens</>
                          )}
                        </button>
                      ) : (
                        <button disabled className="flex items-center gap-2 bg-white/5 text-white/30 font-bold px-5 py-2.5 rounded-xl text-sm cursor-not-allowed border border-white/10">
                          <XCircle size={14} /> Sem Wallet
                        </button>
                      )}

                      {tokenAsset && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/asset/${tokenAsset.token_symbol}-${stellarConfig.data?.katePublicKey}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-white/30 hover:text-kate-yellow justify-center transition-colors"
                        >
                          <ExternalLink size={11} /> Ver na Stellar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Simulation Notice */}
      {isSimulated && (
        <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200/70">
          <strong className="text-amber-400">Modo Simulado Ativo:</strong> As transações acima são simuladas e não interagem com a blockchain real da Stellar.
          Para usar a rede real, configure <code className="bg-black/30 px-1 rounded">STELLAR_KATE_SECRET_KEY</code> e defina
          <code className="bg-black/30 px-1 rounded ml-1">STELLAR_SIMULATION_MODE=false</code> no arquivo <code className="bg-black/30 px-1 rounded">.env</code>.
        </div>
      )}
    </div>
  )
}
