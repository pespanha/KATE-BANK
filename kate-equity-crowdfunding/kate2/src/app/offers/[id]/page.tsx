import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Shield, Calendar, TrendingUp,
  FileText, AlertTriangle, ExternalLink, Users, FolderLock
} from 'lucide-react'
import { PremiumDocumentList } from '@/components/PremiumDocumentList'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { issuer: true },
  }).catch(() => null)
  if (!offer) return { title: 'Oferta não encontrada' }
  return {
    title: offer.title || offer.issuer.trade_name || offer.issuer.legal_name,
    description: `Oferta de ${offer.security_type === 'equity' ? 'equity' : 'dívida'} — Meta R$ ${(offer.max_target ?? 0).toLocaleString('pt-BR')}`,
  }
}

export default async function OfferDetailPage({ params }: Props) {
  const { id } = await params

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      issuer:                { include: { controllers: true } },
      offer_documents:       true,
      essential_offer_infos: { take: 1 },
      token_assets:          true,
      reservations: {
        where:  { status: { in: ['confirmed', 'settled'] } },
        select: { amount_brz: true, token_quantity: true },
      },
    },
  }).catch(() => null)

  if (!offer) notFound()

  const raised       = offer.reservations.reduce((s, r) => s + (r.amount_brz ?? 0), 0)
  const tokensIssued = offer.reservations.reduce((s, r) => s + (r.token_quantity ?? 0), 0)
  const progress     = offer.max_target ? Math.min((raised / offer.max_target) * 100, 100) : 0
  const investorCount = offer.reservations.length
  const tokenAsset   = offer.token_assets[0]
  const info         = offer.essential_offer_infos[0]
  const daysLeft     = offer.end_date
    ? Math.max(0, Math.ceil((new Date(offer.end_date).getTime() - Date.now()) / 86400000))
    : null

  const statusLabel: Record<string, { label: string; color: string }> = {
    active:    { label: 'Aberta',     color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    draft:     { label: 'Rascunho',   color: 'text-white/50 bg-white/5 border-white/10' },
    funded:    { label: 'Financiada', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    failed:    { label: 'Encerrada',  color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    cancelled: { label: 'Cancelada',  color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  }
  const st = statusLabel[offer.status ?? 'draft'] ?? statusLabel['draft']

  // Serialize documents for client component
  const docsForClient = offer.offer_documents.map(d => ({
    id: d.id,
    document_type: d.document_type,
    file_url: d.file_url,
    is_public: d.is_public,
    isPremium: d.isPremium,
    priceXLM: d.priceXLM,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/offers" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Voltar às ofertas
      </Link>

      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-kate-dark-blue to-[#0f1e3d] border border-white/10 rounded-2xl overflow-hidden mb-8 p-8 md:p-10">
        <div className="absolute inset-0 opacity-10 select-none flex items-center justify-end pr-10">
          <span className="text-[180px] font-black text-white leading-none">
            {(offer.issuer.trade_name || offer.issuer.legal_name).substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${st.color}`}>
              {st.label}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-kate-yellow/10 border border-kate-yellow/20 text-kate-yellow uppercase">
              {offer.security_type === 'equity' ? 'Equity' : offer.security_type === 'convertible_debt' ? 'Dívida Conversível' : 'Dívida Simples'}
            </span>
            {tokenAsset && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Token: {tokenAsset.token_symbol}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
            {offer.title || offer.issuer.trade_name || offer.issuer.legal_name}
          </h1>
          <p className="text-white/50">{offer.issuer.trade_name} · {offer.issuer.sector}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Company Info */}
          <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
            <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <Shield size={18} className="text-kate-yellow" /> Sobre a Empresa
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Razão Social',  value: offer.issuer.legal_name },
                { label: 'Nome Comercial', value: offer.issuer.trade_name },
                { label: 'CNPJ',          value: offer.issuer.cnpj },
                { label: 'Setor',         value: offer.issuer.sector },
                { label: 'Tipo Jurídico', value: offer.issuer.legal_type },
                { label: 'Website',       value: offer.issuer.website, isLink: true },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <span className="text-white/40 block mb-0.5">{f.label}</span>
                  {f.isLink ? (
                    <a href={f.value!} target="_blank" rel="noopener noreferrer"
                      className="text-kate-yellow hover:underline flex items-center gap-1">
                      {f.value} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-white font-medium">{f.value}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Offer Info */}
          {info?.company_info && (
            <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
                <FileText size={18} className="text-kate-yellow" /> Informações Essenciais
              </h2>
              <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
                {info.company_info}
              </div>
            </section>
          )}

          {/* Data Room (Documents with Premium Lock) */}
          {offer.offer_documents.length > 0 && (
            <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <FolderLock size={18} className="text-kate-yellow" /> Data Room
              </h2>
              <PremiumDocumentList documents={docsForClient} offerId={offer.id} />
            </section>
          )}

          {/* Blockchain / Token */}
          {tokenAsset && (
            <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold text-white text-lg mb-4">Token na Stellar Network</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40 block mb-0.5">Símbolo</span><span className="text-kate-yellow font-bold font-mono">{tokenAsset.token_symbol}</span></div>
                <div><span className="text-white/40 block mb-0.5">Nome</span><span className="text-white">{tokenAsset.token_name}</span></div>
                <div><span className="text-white/40 block mb-0.5">Tipo</span><span className="text-white">{tokenAsset.token_type ?? 'rwa_security_token'}</span></div>
                <div><span className="text-white/40 block mb-0.5">Oferta Total</span><span className="text-white">{(tokenAsset.total_supply ?? 0).toLocaleString('pt-BR')} tokens</span></div>
              </div>
            </section>
          )}

          {/* Controllers */}
          {offer.issuer.controllers.length > 0 && (
            <section className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Users size={18} className="text-kate-yellow" /> Controladores
              </h2>
              <div className="space-y-3">
                {offer.issuer.controllers.map(c => (
                  <div key={c.id} className="flex justify-between text-sm border-b border-white/5 pb-3">
                    <div>
                      <span className="text-white font-medium">{c.name}</span>
                      {c.cpf_cnpj && <span className="text-white/40 ml-2">· {c.cpf_cnpj}</span>}
                    </div>
                    <span className="text-kate-yellow font-semibold">{c.ownership_percentage}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Risk Warning */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/70">
              <strong className="text-amber-400 block mb-1">Alerta de Risco CVM</strong>
              O investimento em valores mobiliários de startups envolve riscos substanciais,
              incluindo a possibilidade de perda total do capital investido. Não invista
              mais do que pode perder.
            </div>
          </div>
        </div>

        {/* Right: Invest Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-kate-dark-blue border border-white/10 rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-white text-lg">Investir nesta Oferta</h3>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/40">Captado</span>
                <span className="text-white font-bold">R$ {raised.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-kate-yellow rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>{progress.toFixed(1)}% da meta máxima</span>
                <span>R$ {(offer.max_target ?? 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Preço/Token', value: `R$ ${(offer.unit_price ?? 0).toLocaleString('pt-BR')}` },
                { label: 'Mín. Investimento', value: `R$ ${(offer.min_investment ?? 0).toLocaleString('pt-BR')}` },
                { label: 'Investidores', value: investorCount.toString() },
                { label: 'Tokens Emitidos', value: tokensIssued.toLocaleString('pt-BR') },
                ...(daysLeft !== null ? [{ label: 'Dias Restantes', value: daysLeft > 0 ? `${daysLeft} dias` : 'Encerrada' }] : []),
                { label: 'Período Desistência', value: `${offer.withdrawal_period_days ?? 5} dias` },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3">
                  <span className="text-white/40 text-xs block mb-1">{s.label}</span>
                  <span className="text-white font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Deadline */}
            {offer.end_date && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Calendar size={12} />
                Encerra em {new Date(offer.end_date).toLocaleDateString('pt-BR')}
              </div>
            )}

            {/* CTA */}
            {offer.status === 'active' ? (
              <Link
                href={`/checkout?offer=${offer.id}`}
                className="block w-full text-center bg-kate-yellow text-kate-dark-blue font-bold py-3.5 rounded-xl hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-kate-yellow/30 transition-all"
              >
                Investir Agora
              </Link>
            ) : (
              <div className="block w-full text-center bg-white/5 text-white/30 font-bold py-3.5 rounded-xl border border-white/10 cursor-not-allowed">
                Oferta {st.label}
              </div>
            )}

            {/* Stellar badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-white/30 pt-1">
              <TrendingUp size={12} className="text-green-400" />
              Tokens emitidos na Stellar Network
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
