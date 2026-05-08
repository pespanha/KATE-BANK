import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="hero" style={{padding: '4rem 0'}}>
        <div className="container text-center">
          <h1 className="text-h1 mb-4">Sobre a Kate Equity</h1>
          <p className="text-h3 opacity-90" style={{maxWidth: '800px', margin: '0 auto'}}>
            Democratizando o acesso a investimentos de alto impacto com a segurança da regulação e a eficiência da blockchain.
          </p>
        </div>
      </section>

      <div className="container section-padding">
        <div className="content-grid" style={{gap: '4rem'}}>
          <div className="main-col">
            <h2 className="text-h2 mb-6">Nossa Missão</h2>
            <p className="text-body mb-4">
              A Kate Equity nasceu com o propósito de conectar startups inovadoras a investidores que buscam diversificar seus portfólios com ativos reais. Acreditamos que o futuro do mercado de capitais é tokenizado, transparente e acessível.
            </p>
            <p className="text-body mb-8">
              Atuamos como uma plataforma de <strong>Equity Crowdfunding</strong> registrada e autorizada, trazendo oportunidades que antes eram restritas a fundos de Venture Capital.
            </p>

            <h2 className="text-h2 mb-6">Regulação CVM 88</h2>
            <p className="text-body mb-4">
              Operamos em total conformidade com a Resolução CVM nº 88, garantindo segurança jurídica para emissores e investidores. Nossa plataforma realiza due diligence rigorosa das startups e implementa processos rígidos de KYC (Conheça seu Cliente) e PLD (Prevenção à Lavagem de Dinheiro).
            </p>
          </div>

          <div className="sidebar-col">
            <div className="card p-6" style={{backgroundColor: 'var(--kate-dark-blue)', color: 'white'}}>
              <h3 className="text-h3 mb-4" style={{color: 'var(--kate-yellow)'}}>Tecnologia Stellar</h3>
              <p className="text-body mb-4">
                Somos a primeira plataforma brasileira de crowdfunding a integrar nativamente a blockchain <strong>Stellar</strong>.
              </p>
              <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9}}>
                <li>✅ Tokenização de ativos (Security Tokens)</li>
                <li>✅ Liquidação quase instantânea</li>
                <li>✅ Taxas de transação frações de centavo</li>
                <li>✅ Transparência total no cap table</li>
              </ul>
              
              <div className="mt-8">
                <Link href="/auth" className="btn-primary" style={{display: 'block', textAlign: 'center'}}>
                  Junte-se à Kate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
