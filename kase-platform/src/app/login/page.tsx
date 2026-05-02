'use client';

import { useState } from 'react';
import KaseLogo from '@/components/KaseLogo';
import styles from './page.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handlePasskeyLogin = () => {
    setLoading(true);
    /* Mock — just redirect after a delay */
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.gridBg} />

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <KaseLogo variant="full" size="lg" />
        </div>

        <h1 className={styles.title}>Bem-vindo de volta</h1>
        <p className={styles.subtitle}>
          Acesse sua conta com autenticação biométrica.
          <br />
          Sem senha. Sem seed phrase.
        </p>

        <button
          className={`${styles.passkeyBtn} ${loading ? styles.passkeyBtnLoading : ''}`}
          onClick={handlePasskeyLogin}
          disabled={loading}
          id="btn-passkey-login"
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              Autenticando...
            </>
          ) : (
            <>
              <span className={styles.passkeyIcon}>🔐</span>
              Entrar com Passkey
            </>
          )}
        </button>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button className={styles.altBtn} id="btn-email-login">
          📧 Entrar com Email
        </button>

        <p className={styles.securityNote}>
          🛡️ Sua biometria é sua chave. Protegida por hardware, nunca compartilhada.
        </p>

        <div className={styles.footer}>
          <span className={styles.footerText}>Não tem conta?</span>
          <a href="/cadastro" className={styles.footerLink}>Criar conta gratuita →</a>
        </div>
      </div>

      <p className={styles.legal}>
        KASE — Kate Assets Stellar Exchange. Nos termos da Resolução CVM nº 88/2022.
      </p>
    </div>
  );
}
