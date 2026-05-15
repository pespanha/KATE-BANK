import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Shield, Zap, Globe, TrendingUp, Users, FileCheck,
  ChevronRight, CheckCircle2, AlertTriangle, Star,
  BookOpen, Scale, Coins, Lock, BarChart3, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre a Kate Equity | Plataforma de Equity Crowdfunding Regulada',
  description: 'Conheça a Kate Equity, a plataforma de equity crowdfunding regulada pela CVM 88 que conecta investidores a startups por meio de tokens RWA na rede Stellar.',
};

const PILARES = [
  {
    icon: Shield,
    title: 'Regulação CVM 88',
    desc: 'Operamos em conformidade com a Resolução CVM nº 88. Due diligence rigorosa, KYC/PLD integrado e relatórios automáticos (Anexo G/H).',
  },
  {
    icon: Zap,
    title: 'Blockchain Stellar',
    desc: 'Somos a primeira plataforma brasileira de ECF com tokenização nativa na Stellar. Liquidação instantânea, taxas mínimas e controle de titularidade on-chain.',
  },
  {
    icon: Globe,
    title: 'Infraestrutura para originadores',
    desc: 'APIs abertas para gestoras, sindicatos e whitelabels. Emita tokens RWA regulados com escrow programável em BRZ.',
  },
  {
    icon: TrendingUp,
    title: 'Mercado de acesso',
    desc: 'Mural de transações subsequentes bilateral e regulado — liquidez parcial sem caracterizar bolsa, conforme CVM 88.',
  },
];

const PROCESSO = [
  { step: '01', title: 'Cadastro e KYC', desc: 'Crie sua conta, passe pelo processo de KYC/PLD e receba sua carteira Stellar custodiada.' },
  { step: '02', title: 'Explore ofertas', desc: 'Analise as oportunidades disponíveis: setor, valuation, captable, documentos e histórico da empresa.' },
  { step: '03', title: 'Invista com segurança', desc: 'Reserve seu investimento. O BRZ fica em escrow programável até o encerramento da oferta.' },
  { step: '04', title: 'Receba tokens RWA', desc: 'Se a meta mínima for atingida, os tokens do ativo real são emitidos diretamente na sua carteira Stellar.' },
  { step: '05', title: 'Acompanhe seu portfólio', desc: 'Dashboard completo com seus ativos, documentos, informes da empresa e elegibilidade para mercado subsequente.' },
];

const AVISOS = [
  'Investimento em startups envolve alto risco e pode resultar em perda total do capital.',
  'Os valores mobiliários têm baixa liquidez e podem não ser possíveis de vender a qualquer momento.',
  'Rentabilidades passadas não garantem rentabilidades futuras.',
  'A Kate Equity não garante o retorno do investimento.',
  'Leia todas as informações essenciais antes de investir.',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-kate-dark-blue text-white">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-kate-dark-blue via-[#0d162a] to-[#060b18]" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #F4C71422 0%, transparent 50%), radial-gradient(circle at 80% 50%, #1a3a6a22 0%, transparent 50%)' }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-kate-yellow/10 border border-kate-yellow/20 rounded-full text-kate-yellow text-sm font-medium mb-8">
            <Star className="w-4 h-4" /> Plataforma regulada pela CVM
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Investimentos reais,<br />
            <span className="text-kate-yellow">transparência</span> on-chain.
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
            A Kate Equity é uma plataforma de Equity Crowdfunding regulada pela CVM 88 que conecta investidores a startups e PMEs por meio de tokens de ativos reais (RWA) na rede Stellar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/offers" className="flex items-center gap-2 px-8 py-4 bg-kate-orange text-kate-navy font-bold rounded-xl hover:opacity-90 transition-opacity text-base">
              Ver oportunidades <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth" className="flex items-center gap-2 px-8 py-4 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors text-base">
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 'R$ 15M', label: 'Limite por captação (CVM 88)' },
            { value: '100%', label: 'Regulamentado' },
            { value: 'Stellar', label: 'Blockchain de liquidação' },
            { value: '5 dias', label: 'Direito de desistência' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-bold text-kate-yellow mb-1">{s.value}</p>
              <p className="text-sm text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nossa missão */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-kate-yellow text-sm font-semibold uppercase tracking-wider mb-4">Nossa missão</p>
            <h2 className="text-3xl font-bold mb-6">Democratizar o acesso a investimentos de alto impacto</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              A Kate Equity nasceu para conectar startups inovadoras e PMEs a investidores que buscam diversificar seus portfólios com ativos reais. Acreditamos que o futuro do mercado de capitais é tokenizado, transparente e acessível.
            </p>
            <p className="text-white/60 leading-relaxed">
              Atuamos como uma plataforma de <strong className="text-white">Equity Crowdfunding</strong> registrada, trazendo oportunidades que antes eram restritas a fundos de Venture Capital para qualquer brasileiro.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileCheck, label: 'Due diligence', desc: 'Análise rigorosa de cada emissor' },
              { icon: Lock,      label: 'Custódia segura', desc: 'Chaves protegidas por KMS' },
              { icon: BarChart3, label: 'Cap table on-chain', desc: 'Titularidade verificável' },
              { icon: Coins,     label: 'Escrow BRZ', desc: 'Recursos protegidos até liquidação' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <item.icon className="w-6 h-6 text-kate-yellow mb-3" />
                <p className="font-semibold text-sm text-white mb-1">{item.label}</p>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="bg-white/2 border-y border-white/5 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-kate-yellow text-sm font-semibold uppercase tracking-wider mb-4">Diferenciais</p>
            <h2 className="text-3xl font-bold">Por que a Kate Equity?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PILARES.map((p, i) => (
              <div key={i} className="flex gap-5 p-6 bg-kate-dark-blue border border-white/10 rounded-2xl hover:border-kate-yellow/20 transition-colors">
                <div className="w-12 h-12 bg-kate-yellow/10 rounded-xl flex items-center justify-center shrink-0">
                  <p.icon className="w-6 h-6 text-kate-yellow" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-kate-yellow text-sm font-semibold uppercase tracking-wider mb-4">Como funciona</p>
          <h2 className="text-3xl font-bold">Seu caminho do cadastro ao investimento</h2>
        </div>
        <div className="space-y-4">
          {PROCESSO.map((p, i) => (
            <div key={i} className="flex gap-6 p-6 bg-white/3 border border-white/8 rounded-2xl items-start hover:border-kate-yellow/20 transition-colors">
              <span className="text-3xl font-black text-kate-yellow/30 shrink-0 leading-none">{p.step}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{p.title}</h3>
                <p className="text-white/50 text-sm">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aviso CVM obrigatório */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <h3 className="font-bold text-amber-400 text-lg">Aviso obrigatório — CVM 88</h3>
          </div>
          <ul className="space-y-3">
            {AVISOS.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0 mt-1.5" />
                {a}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-white/30">
            A Kate Equity Ltda. atua como plataforma eletrônica de investimento participativo nos termos da Resolução CVM nº 88/2022. O registro e a aprovação dos valores mobiliários não implicam, por parte da CVM, garantia de veracidade das informações prestadas ou julgamento sobre a qualidade da emissora.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/2 to-kate-dark-blue py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-white/50 mb-8">Crie sua conta gratuitamente e explore as oportunidades disponíveis na Kate Equity.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth" className="px-8 py-4 bg-kate-orange text-kate-navy font-bold rounded-xl hover:opacity-90 transition-opacity">
              Criar conta de investidor
            </Link>
            <Link href="/captar" className="px-8 py-4 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors">
              Captar para minha empresa
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
