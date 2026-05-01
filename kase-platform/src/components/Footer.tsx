import KaseLogo from './KaseLogo';
import styles from './Footer.module.css';

const footerLinks = {
  platform: [
    { label: 'Investimentos', href: '#investimentos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Segurança', href: '#seguranca' },
    { label: 'FAQ', href: '#faq' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Política de Privacidade', href: '/privacidade' },
    { label: 'Regulamentação CVM', href: '/cvm' },
  ],
  company: [
    { label: 'Sobre a KASE', href: '/sobre' },
    { label: 'Contato', href: '/contato' },
    { label: 'Imprensa', href: '/imprensa' },
  ],
};

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <KaseLogo variant="full" size="lg" />
          <p className={styles.tagline}>
            Cada investimento é um caso de sucesso.
          </p>
          <p className={styles.description}>
            Plataforma de investimentos tokenizados na blockchain Stellar,
            regulada pela CVM.
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Plataforma</h4>
            {footerLinks.platform.map((link) => (
              <a key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Legal</h4>
            {footerLinks.legal.map((link) => (
              <a key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Empresa</h4>
            {footerLinks.company.map((link) => (
              <a key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.legal}>
            KASE — Kate Assets Stellar Exchange. Plataforma eletrônica de
            investimento participativo nos termos da Resolução CVM nº 88/2022.
            Investimentos envolvem riscos. Leia os materiais das ofertas antes
            de investir.
          </p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} KASE. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
