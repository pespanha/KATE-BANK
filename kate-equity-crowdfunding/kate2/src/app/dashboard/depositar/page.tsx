'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { ArrowLeft, QrCode, Banknote, CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react'

type DepositStage = 'input' | 'qrcode' | 'processing' | 'success'

export default function DepositarPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [stage, setStage] = useState<DepositStage>('input')
  const [txHash, setTxHash] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const pixDeposit = trpc.stellar.simulatePixDeposit.useMutation({
    onSuccess: (data) => {
      setTxHash(data.txHash)
      setStage('success')
    },
    onError: (err) => {
      setErrorMsg(err.message)
      setStage('qrcode')
    },
  })

  const numericAmount = parseFloat(amount) || 0
  const isValidAmount = numericAmount >= 10 && numericAmount <= 100000

  const handleGeneratePix = () => {
    if (!isValidAmount) return
    setErrorMsg('')
    setStage('qrcode')
  }

  const handleSimulatePayment = () => {
    setStage('processing')
    setErrorMsg('')
    pixDeposit.mutate({ amount: numericAmount.toFixed(2) })
  }

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="max-w-lg mx-auto py-8 px-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={18} className="text-white/60" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Depositar via PIX</h1>
          <p className="text-white/40 text-sm">Converta Reais (R$) em BRZ na Stellar Testnet</p>
        </div>
      </div>

      {/* ── STAGE: INPUT ── */}
      {stage === 'input' && (
        <div className="animate-fade-in">
          <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 mb-4">
            <label className="text-white/50 text-xs font-medium block mb-2">
              Valor do depósito (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kate-yellow font-bold text-lg">
                R$
              </span>
              <input
                id="deposit-amount"
                type="number"
                min="10"
                max="100000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-14 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold outline-none focus:border-kate-yellow/50 transition-colors placeholder:text-white/20"
              />
            </div>
            <div className="flex gap-2 mt-3">
              {[100, 500, 1000, 5000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v.toString())}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-kate-yellow/10 hover:border-kate-yellow/30 hover:text-kate-yellow transition-all"
                >
                  {formatBRL(v)}
                </button>
              ))}
            </div>
            {amount && !isValidAmount && (
              <p className="text-red-400/80 text-xs mt-3 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Valor mínimo R$ 10,00 — máximo R$ 100.000,00
              </p>
            )}
          </div>

          {/* Info card */}
          <div className="bg-kate-yellow/5 border border-kate-yellow/15 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="text-kate-yellow shrink-0 mt-0.5" />
              <div className="text-xs text-white/50 leading-relaxed">
                <strong className="text-kate-yellow">Simulação Testnet.</strong>{' '}
                O depósito PIX é simulado e os tokens BRZ são emitidos diretamente na rede Stellar Testnet.
                Em produção, isso seria integrado a um gateway de pagamento real.
              </div>
            </div>
          </div>

          <button
            id="btn-generate-pix"
            type="button"
            disabled={!isValidAmount}
            onClick={handleGeneratePix}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isValidAmount
                ? 'bg-kate-yellow text-kate-dark-blue hover:brightness-110 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <QrCode size={20} />
            Gerar PIX
          </button>
        </div>
      )}

      {/* ── STAGE: QR CODE ── */}
      {stage === 'qrcode' && (
        <div className="animate-fade-in">
          <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 text-center">
            {/* Amount badge */}
            <div className="inline-flex items-center gap-2 bg-kate-yellow/10 border border-kate-yellow/20 rounded-full px-4 py-1.5 mb-6">
              <Banknote size={16} className="text-kate-yellow" />
              <span className="text-kate-yellow font-bold">{formatBRL(numericAmount)}</span>
            </div>

            {/* Fake QR Code */}
            <div className="mx-auto w-52 h-52 bg-white rounded-2xl p-3 mb-5 relative overflow-hidden">
              <div className="w-full h-full relative">
                {/* QR pattern simulation */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Corner markers */}
                  <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#14213C" strokeWidth="6"/>
                  <rect x="20" y="20" width="30" height="30" rx="2" fill="#14213C"/>
                  <rect x="140" y="10" width="50" height="50" rx="4" fill="none" stroke="#14213C" strokeWidth="6"/>
                  <rect x="150" y="20" width="30" height="30" rx="2" fill="#14213C"/>
                  <rect x="10" y="140" width="50" height="50" rx="4" fill="none" stroke="#14213C" strokeWidth="6"/>
                  <rect x="20" y="150" width="30" height="30" rx="2" fill="#14213C"/>
                  {/* Data pattern */}
                  {Array.from({ length: 12 }, (_, row) =>
                    Array.from({ length: 12 }, (_, col) => {
                      const isCorner = (row < 4 && col < 4) || (row < 4 && col > 8) || (row > 8 && col < 4)
                      if (isCorner) return null
                      const shouldFill = ((row * 7 + col * 13 + row * col) % 3) !== 0
                      if (!shouldFill) return null
                      return (
                        <rect
                          key={`${row}-${col}`}
                          x={10 + col * 15}
                          y={10 + row * 15}
                          width="12"
                          height="12"
                          rx="1"
                          fill="#14213C"
                          opacity={0.85}
                        />
                      )
                    })
                  )}
                  {/* Center logo */}
                  <circle cx="100" cy="100" r="18" fill="#FCA310"/>
                  <text x="100" y="105" textAnchor="middle" fill="#14213C" fontSize="14" fontWeight="bold">K</text>
                </svg>
              </div>
            </div>

            <p className="text-white/40 text-xs mb-1">Chave PIX (simulada)</p>
            <code className="text-white/70 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-lg inline-block mb-6">
              kate-equity-{numericAmount.toFixed(0)}@pix.testnet
            </code>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                {errorMsg}
              </div>
            )}

            <button
              id="btn-simulate-payment"
              type="button"
              onClick={handleSimulatePayment}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Simular Pagamento Compensado
            </button>

            <button
              type="button"
              onClick={() => setStage('input')}
              className="mt-3 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              ← Alterar valor
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: PROCESSING ── */}
      {stage === 'processing' && (
        <div className="animate-fade-in">
          <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-kate-yellow/10 flex items-center justify-center animate-pulse">
              <Loader2 size={32} className="text-kate-yellow animate-spin" />
            </div>
            <h2 className="text-white font-bold text-lg mb-2">Processando depósito...</h2>
            <p className="text-white/40 text-sm">
              Criando trustline BRZ e emitindo tokens na Stellar Testnet
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {['Verificando pagamento PIX', 'Estabelecendo trustline BRZ', 'Emitindo tokens na blockchain'].map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-kate-yellow animate-pulse" style={{ animationDelay: `${i * 400}ms` }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE: SUCCESS ── */}
      {stage === 'success' && (
        <div className="animate-fade-in">
          <div className="bg-kate-dark-blue border border-emerald-500/20 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Depósito Confirmado! 🎉</h2>
            <p className="text-white/50 text-sm mb-6">
              <span className="text-emerald-400 font-bold">{formatBRL(numericAmount)}</span> convertidos em{' '}
              <span className="text-kate-yellow font-bold">{numericAmount.toFixed(2)} BRZ</span> na Stellar Testnet
            </p>

            {/* Tx details */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/40 text-xs">Transaction Hash</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kate-yellow text-xs hover:underline"
                >
                  Ver na Explorer →
                </a>
              </div>
              <code className="text-white/60 text-[10px] font-mono break-all leading-relaxed">
                {txHash}
              </code>
            </div>

            <button
              id="btn-go-dashboard"
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 rounded-xl bg-kate-yellow text-kate-dark-blue font-bold text-base hover:brightness-110 transition-all"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
