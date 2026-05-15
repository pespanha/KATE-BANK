import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import prisma           from '@/lib/prisma'
import { Settings, Shield, User, Wallet } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações — Kate Equity' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [dbUser, wallet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { investor_profile: true },
    }).catch(() => null),
    prisma.wallet.findUnique({ where: { user_id: user.id } }).catch(() => null),
  ])

  const profile = dbUser?.investor_profile

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="text-kate-yellow" /> Configurações
        </h1>
        <p className="text-white/40 text-sm mt-1">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile Card */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-4">
          <User size={16} className="text-kate-yellow" /> Dados Pessoais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-xs mb-1">Nome</p>
            <p className="text-white font-medium">{dbUser?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">E-mail</p>
            <p className="text-white font-medium">{user.email || '—'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">CPF</p>
            <p className="text-white font-medium font-mono">{dbUser?.cpf || '—'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Função</p>
            <p className="text-white font-medium capitalize">{dbUser?.role || '—'}</p>
          </div>
        </div>
      </div>

      {/* KYC Status */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-4">
          <Shield size={16} className="text-kate-yellow" /> Status KYC
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-xs mb-1">Perfil de Investidor</p>
            {profile ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">
                ✓ Completo
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
                Pendente
              </span>
            )}
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Perfil de Risco</p>
            <p className="text-white font-medium capitalize">{profile?.risk_profile || '—'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Renda Anual</p>
            <p className="text-white font-medium">
              {profile?.annual_income
                ? `R$ ${Number(profile.annual_income).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Aceite CVM 88</p>
            {profile?.suitability_score ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">
                ✓ Aceito
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 font-medium">
                Pendente
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-4">
          <Wallet size={16} className="text-kate-yellow" /> Wallet Stellar
        </h2>
        {wallet ? (
          <div>
            <p className="text-white/40 text-xs mb-1">Endereço Público</p>
            <code className="text-white/70 text-xs font-mono bg-white/5 px-3 py-2 rounded-lg block break-all">
              {wallet.stellar_public_key}
            </code>
            <p className="text-white/40 text-xs mt-3 mb-1">Rede</p>
            <p className="text-white font-medium">Stellar Testnet</p>
          </div>
        ) : (
          <p className="text-white/40 text-sm">Wallet ainda não ativada.</p>
        )}
      </div>
    </div>
  )
}
