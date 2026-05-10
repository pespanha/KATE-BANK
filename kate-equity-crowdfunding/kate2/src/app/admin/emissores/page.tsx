import prisma from '@/lib/prisma'
import type { Metadata } from 'next'
import { Building2, Globe, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Emissores' }

export default async function AdminEmissoresPage() {
  const issuers = await prisma.issuer.findMany({
    include: {
      controllers: true,
      offers:      { select: { id: true, status: true } },
    },
    orderBy: { created_at: 'desc' },
  }).catch(() => [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Building2 className="text-kate-yellow" /> Emissores
        </h1>
        <p className="text-white/40 text-sm mt-1">{issuers.length} emissores cadastrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {issuers.length === 0 && (
          <div className="col-span-3 text-center py-16 text-white/30">Nenhum emissor cadastrado.</div>
        )}
        {issuers.map(issuer => {
          const activeOffers = issuer.offers.filter(o => o.status === 'active').length
          return (
            <div key={issuer.id} className="bg-kate-dark-blue border border-white/10 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold">{issuer.trade_name ?? issuer.legal_name}</p>
                  {issuer.trade_name && (
                    <p className="text-white/40 text-xs truncate">{issuer.legal_name}</p>
                  )}
                  <p className="text-white/30 text-xs font-mono mt-0.5">{issuer.cnpj}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/3 rounded-xl p-2 text-center">
                  <p className="text-kate-yellow font-bold text-lg">{issuer.offers.length}</p>
                  <p className="text-white/30 text-xs">Ofertas</p>
                </div>
                <div className="bg-white/3 rounded-xl p-2 text-center">
                  <p className="text-green-400 font-bold text-lg">{activeOffers}</p>
                  <p className="text-white/30 text-xs">Ativas</p>
                </div>
                <div className="bg-white/3 rounded-xl p-2 text-center">
                  <p className="text-blue-400 font-bold text-lg">{issuer.controllers.length}</p>
                  <p className="text-white/30 text-xs">Controllers</p>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                {issuer.website && (
                  <a
                    href={issuer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kate-yellow/70 hover:text-kate-yellow flex items-center gap-1 transition-colors"
                  >
                    <Globe size={10} /> {issuer.website}
                  </a>
                )}
                {issuer.sector && (
                  <p className="text-white/30">Setor: {issuer.sector}</p>
                )}
              </div>

              {issuer.controllers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/30 text-xs mb-1.5 flex items-center gap-1">
                    <Users size={10} /> Controllers
                  </p>
                  {issuer.controllers.map(c => (
                    <div key={c.id} className="text-xs text-white/50 truncate">
                      {c.name} · <span className="font-mono">{c.cpf_cnpj}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
