'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, User, Mail, Phone, FileText, Globe, Tag,
  TrendingUp, Rocket, ArrowRight, Sparkles, Clock,
  Shield, Users, Loader2, Lock, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const CATEGORIES = ['Startup', 'PME', 'Imobiliário', 'Energia', 'Agro', 'Tecnologia', 'Saúde', 'Outro'];
const FUNDING_RANGES = [
  { value: 'ate_500k',  label: 'Até R$ 500 mil' },
  { value: '500k_2m',  label: 'R$ 500 mil – R$ 2 mi' },
  { value: '2m_10m',   label: 'R$ 2 mi – R$ 10 mi' },
  { value: 'acima_10m', label: 'Acima de R$ 10 mi' },
];
const STAGES = [
  { value: 'ideia',    label: 'Ideia',    desc: 'Conceito em desenvolvimento' },
  { value: 'operacao', label: 'Operação', desc: 'Produto/serviço funcionando' },
  { value: 'receita',  label: 'Receita',  desc: 'Gerando faturamento' },
  { value: 'tracao',   label: 'Tração',   desc: 'Crescimento consistente' },
];

type FormData = {
  responsible_name: string;
  email: string;
  whatsapp: string;
  legal_name: string;
  website: string;
  sector: string;
  funding_range: string;
  stage: string;
  cnpj: string;
};

export default function CaptarPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    responsible_name: '',
    email: '',
    whatsapp: '',
    legal_name: '',
    website: '',
    sector: '',
    funding_range: '',
    stage: '',
    cnpj: '',
  });

  const createIssuer = trpc.issuers.create.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setErrors({ submit: e.message }),
  });

  const set = (field: keyof FormData, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.responsible_name.trim()) e.responsible_name = 'Nome é obrigatório';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'E-mail inválido';
    if (form.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'WhatsApp inválido';
    if (!form.legal_name.trim()) e.legal_name = 'Nome da empresa é obrigatório';
    if (!form.sector) e.sector = 'Selecione o setor';
    if (!form.funding_range) e.funding_range = 'Selecione a faixa';
    if (!form.stage) e.stage = 'Selecione o estágio';
    if (!form.cnpj.replace(/\D/g, '').match(/^\d{14}$/)) e.cnpj = 'CNPJ inválido (14 dígitos)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createIssuer.mutate({
      legal_name: form.legal_name,
      cnpj: form.cnpj.replace(/\D/g, ''),
      sector: form.sector,
      website: form.website || undefined,
      headquarters_address: `Responsável: ${form.responsible_name} | WhatsApp: ${form.whatsapp} | Captação: ${form.funding_range} | Estágio: ${form.stage}`,
    });
  };

  const formatCNPJ = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 14);
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
            .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4')
            .replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
            .replace(/^(\d{2})(\d{3})$/, '$1.$2')
            .replace(/^(\d{2})$/, '$1');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-kate-dark-blue flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-kate-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-kate-yellow" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Pré-inscrição enviada!</h1>
          <p className="text-white/60 mb-8">
            Nossa equipe analisará seu projeto e entrará em contato em até 7 dias úteis no e-mail <strong className="text-white">{form.email}</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/offers" className="px-6 py-3 bg-kate-orange text-kate-navy font-bold rounded-xl hover:opacity-90 transition-opacity">
              Ver oportunidades
            </Link>
            <Link href="/" className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kate-dark-blue">
      {/* Hero */}
      <div className="bg-gradient-to-br from-kate-dark-blue via-[#0d162a] to-[#0a1020] py-16 lg:py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-kate-yellow/10 rounded-full text-kate-yellow text-sm font-medium mb-6 border border-kate-yellow/20">
            <Sparkles className="w-4 h-4" />
            Pré-inscrição em 2 minutos
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Capte recursos para seu projeto
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Preencha a pré-inscrição e nossa equipe entrará em contato para avaliar e iniciar o processo de captação via Equity Crowdfunding.
          </p>
        </div>
      </div>

      {/* Benefits bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Clock,     label: 'Análise ágil',    desc: 'Resposta em 7 dias' },
            { icon: Shield,    label: 'CVM 88',          desc: '100% regulamentado' },
            { icon: Users,     label: 'Smart money',     desc: 'Rede de investidores' },
            { icon: TrendingUp,label: 'Até R$ 15 mi',   desc: 'Por captação' },
          ].map((item, i) => (
            <div key={i} className="bg-[#0d162a] border border-white/10 rounded-xl p-4 text-center shadow-lg">
              <item.icon className="w-6 h-6 text-kate-yellow mx-auto mb-2" />
              <p className="font-semibold text-white text-sm">{item.label}</p>
              <p className="text-xs text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10">
          <h2 className="text-xl font-bold text-white mb-6">Dados da pré-inscrição</h2>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Responsável + Email */}
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Nome do responsável *"
                icon={<User className="w-4 h-4" />}
                value={form.responsible_name}
                onChange={v => set('responsible_name', v)}
                placeholder="Seu nome completo"
                error={errors.responsible_name}
              />
              <InputField
                label="E-mail *"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                value={form.email}
                onChange={v => set('email', v)}
                placeholder="seu@email.com"
                error={errors.email}
              />
            </div>

            {/* WhatsApp + CNPJ */}
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="WhatsApp *"
                icon={<Phone className="w-4 h-4" />}
                type="tel"
                value={form.whatsapp}
                onChange={v => set('whatsapp', v)}
                placeholder="(11) 99999-9999"
                error={errors.whatsapp}
              />
              <InputField
                label="CNPJ *"
                icon={<Building2 className="w-4 h-4" />}
                value={form.cnpj}
                onChange={v => set('cnpj', formatCNPJ(v))}
                placeholder="00.000.000/0001-00"
                error={errors.cnpj}
                maxLength={18}
              />
            </div>

            {/* Empresa + Website */}
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Nome da empresa *"
                icon={<FileText className="w-4 h-4" />}
                value={form.legal_name}
                onChange={v => set('legal_name', v)}
                placeholder="Razão social ou nome fantasia"
                error={errors.legal_name}
              />
              <InputField
                label="Site ou Instagram (opcional)"
                icon={<Globe className="w-4 h-4" />}
                value={form.website}
                onChange={v => set('website', v)}
                placeholder="www.empresa.com ou @instagram"
              />
            </div>

            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Setor *</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <select
                  value={form.sector}
                  onChange={e => set('sector', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-kate-yellow/40 ${errors.sector ? 'border-red-400/60' : 'border-white/10'}`}
                >
                  <option value="" className="bg-[#0d162a]">Selecione o setor</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0d162a]">{c}</option>)}
                </select>
              </div>
              {errors.sector && <p className="mt-1 text-xs text-red-400">{errors.sector}</p>}
            </div>

            {/* Faixa de captação */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Faixa de captação desejada *</label>
              <div className="grid grid-cols-2 gap-3">
                {FUNDING_RANGES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('funding_range', r.value)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all text-left ${
                      form.funding_range === r.value
                        ? 'border-kate-yellow bg-kate-yellow/10 text-white font-semibold'
                        : 'border-white/10 hover:border-white/20 text-white/60'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.funding_range && <p className="mt-1 text-xs text-red-400">{errors.funding_range}</p>}
            </div>

            {/* Estágio */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Estágio atual *</label>
              <div className="grid grid-cols-2 gap-3">
                {STAGES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set('stage', s.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.stage === s.value
                        ? 'border-kate-yellow bg-kate-yellow/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className={`w-4 h-4 ${form.stage === s.value ? 'text-kate-yellow' : 'text-white/30'}`} />
                      <span className={`text-sm font-semibold ${form.stage === s.value ? 'text-white' : 'text-white/60'}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-white/40">{s.desc}</p>
                  </button>
                ))}
              </div>
              {errors.stage && <p className="mt-1 text-xs text-red-400">{errors.stage}</p>}
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-500/10 border border-red-400/30 rounded-xl text-sm text-red-400">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={createIssuer.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-kate-orange text-kate-navy font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-base"
            >
              {createIssuer.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando pré-inscrição...</>
              ) : (
                <>Enviar pré-inscrição <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <p className="text-center text-xs text-white/30">
              Ao enviar, você concorda com nossos{' '}
              <Link href="/about" className="text-kate-yellow/60 hover:text-kate-yellow underline">Termos de Uso</Link>
              {' '}e{' '}
              <Link href="/about" className="text-kate-yellow/60 hover:text-kate-yellow underline">Política de Privacidade</Link>.
            </p>
          </form>
        </div>

        {/* Already have account */}
        <p className="text-center text-sm text-white/30 mt-6">
          Já tem uma conta de emissor?{' '}
          <Link href="/auth" className="text-kate-yellow hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Reusable input field ────────────────────────────────────────────────────
function InputField({
  label, icon, value, onChange, placeholder, type = 'text', error, maxLength,
}: {
  label: string; icon?: React.ReactNode; value: string;
  onChange: (v: string) => void; placeholder?: string;
  type?: string; error?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border bg-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-kate-yellow/40 transition-colors ${
            error ? 'border-red-400/60' : 'border-white/10 focus:border-kate-yellow/40'
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
