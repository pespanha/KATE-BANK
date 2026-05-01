import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

/* ──────── Hero Stats ──────── */
const heroStats = [
  { value: 'R$ 0', label: 'Em Captações', prefix: '', suffix: '+' },
  { value: '0', label: 'Investidores', suffix: '+' },
  { value: 'CVM 88', label: 'Regulamentado' },
  { value: '< 5s', label: 'Liquidação Blockchain' },
];

/* ──────── Asset Types ──────── */
const assetTypes = [
  {
    icon: '📈',
    title: 'Ações Ordinárias',
    tag: 'ON',
    description:
      'Participe do crescimento de empresas com direito a voto em assembleias. Tokenização com transparência total.',
  },
  {
    icon: '💎',
    title: 'Ações Preferenciais',
    tag: 'PN',
    description:
      'Prioridade na distribuição de dividendos. Ideal para quem busca renda passiva com segurança.',
  },
  {
    icon: '🏦',
    title: 'Dívida',
    tag: 'DEBT',
    description:
      'Títulos de dívida com retorno previsível. Diversas opções de cupom e vencimento.',
  },
  {
    icon: '🔄',
    title: 'Dívida Conversível',
    tag: 'CONV',
    description:
      'Comece como credor, torne-se sócio. Conversão em equity nos termos acordados.',
  },
  {
    icon: '📄',
    title: 'Recebíveis',
    tag: 'REC',
    description:
      'Invista em recebíveis com lastro verificável. Diversificação inteligente de portfólio.',
  },
];

/* ──────── How It Works Steps ──────── */
const steps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description:
      'Cadastro rápido com autenticação biométrica. Sem seed phrases, sem complicação — sua segurança é garantida por Passkey.',
    accent: 'Biometria + Passkey',
  },
  {
    number: '02',
    title: 'Escolha investimentos',
    description:
      'Explore ofertas verificadas com data room completo: projeções, documentos legais e histórico da empresa.',
    accent: 'Data Room completo',
  },
  {
    number: '03',
    title: 'Invista com segurança',
    description:
      'Deposite via Pix e adquira tokens que representam sua participação. Tudo registrado na blockchain Stellar.',
    accent: 'Pix → Blockchain',
  },
  {
    number: '04',
    title: 'Gerencie e negocie',
    description:
      'Acompanhe seu portfólio em tempo real. Compre e venda no mercado secundário entre investidores.',
    accent: 'Mercado Secundário',
  },
];

/* ──────── Security Features ──────── */
const securityFeatures = [
  {
    icon: '🔐',
    title: 'Custódia na Blockchain',
    description:
      'Seus ativos são tokens na Stellar — imutáveis, rastreáveis e transparentes.',
  },
  {
    icon: '⚖️',
    title: 'Regulamentação CVM',
    description:
      'Operamos nos termos da Resolução CVM nº 88/2022. Compliance total com a regulação brasileira.',
  },
  {
    icon: '🛡️',
    title: 'Autenticação Biométrica',
    description:
      'Passkey powered — FaceID, TouchID ou chave de segurança. Sem senhas para vazar.',
  },
  {
    icon: '🌐',
    title: 'Blockchain Stellar',
    description:
      'Liquidação em menos de 5 segundos. Taxas próximas de zero. Infraestrutura institucional.',
  },
  {
    icon: '📊',
    title: 'Transparência Total',
    description:
      'Todas as transações são públicas e verificáveis. Relatórios de custódia disponíveis a qualquer momento.',
  },
  {
    icon: '🔑',
    title: 'Controle do Emissor',
    description:
      'Compliance built-in: congelamento, clawback e autorização de investidores verificados.',
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        {/* ═══════ HERO ═══════ */}
        <section className={styles.hero} id="hero">
          {/* Background Effects */}
          <div className={styles.heroBgGrid} />
          <div className={styles.heroGlow} />

          <div className={`container ${styles.heroContent}`}>
            <div className={styles.heroBadge}>
              <span className="badge badge-brand">🚀 Novidade</span>
              <span className={styles.heroBadgeText}>
                Investimentos tokenizados na blockchain Stellar
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              <span className="gradient-text">Cada investimento</span>
              <br />
              é um caso de{' '}
              <span className={styles.heroHighlight}>sucesso</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Invista em ações, dívidas e recebíveis tokenizados com a segurança
              da blockchain Stellar e a regulamentação da CVM. Simples como Pix,
              poderoso como o futuro.
            </p>

            <div className={styles.heroCtas}>
              <a href="/cadastro" className="btn btn-primary btn-lg" id="hero-cta-primary">
                Comece a Investir
                <span className={styles.ctaArrow}>→</span>
              </a>
              <a href="#como-funciona" className="btn btn-secondary btn-lg" id="hero-cta-secondary">
                Como Funciona
              </a>
            </div>

            <div className={styles.heroStats}>
              {heroStats.map((stat) => (
                <div key={stat.label} className={styles.heroStat}>
                  <span className={styles.heroStatValue}>
                    {stat.prefix}
                    {stat.value}
                    {stat.suffix}
                  </span>
                  <span className={styles.heroStatLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ ASSET TYPES ═══════ */}
        <section className={`section ${styles.assets}`} id="investimentos">
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className="badge badge-brand">Ativos Disponíveis</span>
              <h2 className={styles.sectionTitle}>
                Diversifique com ativos{' '}
                <span className="gradient-text-brand">tokenizados</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Cinco categorias de investimento para montar seu portfólio
                digital com a segurança da blockchain.
              </p>
            </div>

            <div className={`${styles.assetGrid} stagger`}>
              {assetTypes.map((asset) => (
                <div key={asset.tag} className={`glass-card ${styles.assetCard}`}>
                  <div className={styles.assetIcon}>{asset.icon}</div>
                  <div className={styles.assetTag}>
                    <span className="badge badge-brand">{asset.tag}</span>
                  </div>
                  <h3 className={styles.assetTitle}>{asset.title}</h3>
                  <p className={styles.assetDescription}>{asset.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section className={`section ${styles.howItWorks}`} id="como-funciona">
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className="badge badge-brand">Processo Simples</span>
              <h2 className={styles.sectionTitle}>
                Do cadastro ao investimento em{' '}
                <span className="gradient-text-brand">4 passos</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Projetado para investidores que valorizam simplicidade sem abrir
                mão da segurança.
              </p>
            </div>

            <div className={styles.stepsGrid}>
              {steps.map((step) => (
                <div key={step.number} className={styles.step}>
                  <div className={styles.stepNumber}>{step.number}</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDescription}>{step.description}</p>
                    <span className={`badge badge-brand ${styles.stepAccent}`}>
                      {step.accent}
                    </span>
                  </div>
                  {step.number !== '04' && (
                    <div className={styles.stepConnector} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ SECURITY ═══════ */}
        <section className={`section ${styles.security}`} id="seguranca">
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className="badge badge-brand">Segurança & Compliance</span>
              <h2 className={styles.sectionTitle}>
                Construído para{' '}
                <span className="gradient-text-brand">confiança</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Regulamentação CVM, blockchain Stellar e autenticação biométrica
                — tripla camada de segurança.
              </p>
            </div>

            <div className={`${styles.securityGrid} stagger`}>
              {securityFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className={`glass-card ${styles.securityCard}`}
                >
                  <div className={styles.securityIcon}>{feature.icon}</div>
                  <h3 className={styles.securityTitle}>{feature.title}</h3>
                  <p className={styles.securityDescription}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ CTA FINAL ═══════ */}
        <section className={`section ${styles.ctaSection}`} id="cta-final">
          <div className="container">
            <div className={styles.ctaCard}>
              <div className={styles.ctaGlow} />
              <h2 className={styles.ctaTitle}>
                Pronto para seu próximo{' '}
                <span className="gradient-text-brand">caso de sucesso</span>?
              </h2>
              <p className={styles.ctaSubtitle}>
                Crie sua conta em menos de 2 minutos. Autenticação biométrica,
                sem complicação.
              </p>
              <a href="/cadastro" className="btn btn-primary btn-lg" id="final-cta">
                Criar Minha Conta Gratuita
                <span className={styles.ctaArrow}>→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
