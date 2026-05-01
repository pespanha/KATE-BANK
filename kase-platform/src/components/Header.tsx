'use client';

import { useState, useEffect } from 'react';
import KaseLogo from './KaseLogo';
import styles from './Header.module.css';

const navLinks = [
  { label: 'Investimentos', href: '#investimentos' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Segurança', href: '#seguranca' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <a href="/" className={styles.logo} aria-label="KASE Home">
          <KaseLogo variant="full" size="md" />
        </a>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} id="main-nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <a href="/login" className="btn btn-ghost" id="btn-login">
            Entrar
          </a>
          <a href="/cadastro" className="btn btn-primary" id="btn-signup">
            Criar Conta
          </a>
        </div>

        <button
          className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          id="btn-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
