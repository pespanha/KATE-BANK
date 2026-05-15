'use client'
import { useState } from 'react'
import { Settings, Save, RefreshCw, Eye, EyeOff } from 'lucide-react'

export default function AdminConfiguracoesPage() {
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="text-kate-yellow" /> Configurações
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Parâmetros globais da plataforma Kate Equity
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Platform */}
        <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5 pb-3 border-b border-white/10">Plataforma</h2>
          <div className="space-y-4">
            <div>
              <label className="text-white/50 text-xs block mb-1.5">Nome da Plataforma</label>
              <input
                defaultValue="Kate Equity"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-kate-yellow/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Taxa de Administração (%)</label>
                <input
                  type="number"
                  defaultValue="3.5"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-kate-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Prazo de Desistência (dias)</label>
                <input
                  type="number"
                  defaultValue="5"
                  min="1"
                  max="30"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-kate-yellow/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1.5">Limite Padrão Varejo — CVM 88 (R$)</label>
              <input
                type="number"
                defaultValue="20000"
                step="1000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-kate-yellow/50 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Stellar */}
        <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            Stellar Blockchain
            <span className="text-xs bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full">Via .env</span>
          </h2>
          <p className="text-white/30 text-xs mb-5">
            Variáveis sensíveis devem ser configuradas no arquivo <code>.env</code> do servidor.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-white/50 text-xs block mb-1.5">STELLAR_KATE_PUBLIC_KEY</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="G..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-kate-yellow/50 transition-colors"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Rede</label>
                <select
                  defaultValue="testnet"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none appearance-none"
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Modo Simulação</label>
                <select
                  defaultValue="false"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none appearance-none"
                >
                  <option value="false">Desativado (real)</option>
                  <option value="true">Ativado (mock)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              saved
                ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                : 'bg-kate-orange text-kate-navy hover:brightness-110'
            }`}
          >
            {saved
              ? <><RefreshCw size={14} /> Salvo!</>
              : <><Save size={14} /> Salvar Configurações</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
