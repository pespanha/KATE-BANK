import prisma from '@/lib/prisma'
import type { Metadata } from 'next'
import { FileCheck, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'KYC' }

const investorTypeLabel: Record<string, string> = {
  retail:       'Varejo',
  qualified:    'Qualificado',
  professional: 'Profissional',
  lead:         'Lead',
}

const investorTypeBadge: Record<string, string> = {
  retail:       'bg-blue-400/10 text-blue-400 border-blue-400/20',
  qualified:    'bg-green-400/10 text-green-400 border-green-400/20',
  professional: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  lead:         'bg-amber-400/10 text-amber-400 border-amber-400/20',
}

export default async function AdminKycPage() {
  const profiles = await prisma.investorProfile.findMany({
    include: {
      user: { select: { email: true, full_name: true, created_at: true } },
    },
    orderBy: { created_at: 'desc' },
  }).catch(() => [])

  const counts = {
    retail:    profiles.filter(p => p.investor_type === 'retail').length,
    qualified: profiles.filter(p => p.investor_type === 'qualified' || p.investor_type === 'professional').length,
    limited:   profiles.filter(p => p.annual_limit != null && (p.used_limit ?? 0) / (p.annual_limit ?? 1) > 0.8).length,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileCheck className="text-kate-yellow" /> KYC — Know Your Customer
        </h1>
        <p className="text-white/40 text-sm mt-1">{profiles.length} perfis cadastrados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Varejo',          count: counts.retail,    color: 'text-blue-400',  bg: 'bg-blue-400/10' },
          { label: 'Qualif./Prof.',   count: counts.qualified, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: '> 80% do Limite', count: counts.limited,   color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-white/10 rounded-2xl p-5`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-white/40 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Investidor', 'Tipo', 'Renda Anual', 'Patrimônio', 'Limite CVM', 'Utilizado', 'Alerta', 'Cadastro'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-white/30">Nenhum perfil KYC cadastrado.</td>
                </tr>
              )}
              {profiles.map(p => {
                const limitPct = p.annual_limit ? (p.used_limit ?? 0) / p.annual_limit : 0
                const badgeCls = investorTypeBadge[p.investor_type ?? 'retail'] ?? investorTypeBadge.retail
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{p.user.full_name || '—'}</p>
                      <p className="text-white/40 text-xs">{p.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${badgeCls}`}>
                        {investorTypeLabel[p.investor_type ?? ''] ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {p.annual_income != null ? `R$ ${p.annual_income.toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {p.financial_investments != null ? `R$ ${p.financial_investments.toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/80 text-xs font-semibold">
                      {p.annual_limit != null ? `R$ ${p.annual_limit.toLocaleString('pt-BR')}` : 'Ilimitado'}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      R$ {(p.used_limit ?? 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      {limitPct > 0.8 && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle size={11} /> Limite próximo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">
                      {new Date(p.user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
