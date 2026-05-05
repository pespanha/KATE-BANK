'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import KaseLogo from './KaseLogo';
import styles from './DashboardLayout.module.css';

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '🚀', label: 'Ofertas', href: '/dashboard/ofertas' },
  { icon: '🏪', label: 'Marketplace', href: '/dashboard/mercado' },
  { icon: '💼', label: 'Portfólio', href: '/dashboard/portfolio' },
  { icon: '📄', label: 'Extrato', href: '/dashboard/extrato' },
];

const bottomItems = [
  { icon: '👤', label: 'Perfil', href: '/dashboard/perfil' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function DashboardLayout({ children, title, breadcrumb }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${styles.sidebar}
          ${sidebarCollapsed ? styles.collapsed : ''}
          ${mobileMenuOpen ? styles.mobileOpen : ''}
        `}
      >
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <a href="/dashboard" className={styles.logoLink}>
            <KaseLogo variant={sidebarCollapsed ? 'icon' : 'full'} size={sidebarCollapsed ? 'sm' : 'md'} />
          </a>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                {isActive(item.href) && <div className={styles.activeIndicator} />}
              </a>
            ))}
          </div>

          <div className={styles.navDivider} />

          <div className={styles.navGroup}>
            {bottomItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                {isActive(item.href) && <div className={styles.activeIndicator} />}
              </a>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <a href="/" className={`${styles.navItem} ${styles.logoutItem}`}>
            <span className={styles.navIcon}>🚪</span>
            {!sidebarCollapsed && <span className={styles.navLabel}>Sair</span>}
          </a>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`${styles.main} ${sidebarCollapsed ? styles.mainExpanded : ''}`}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>

            <div className={styles.breadcrumbArea}>
              {breadcrumb ? (
                <nav className={styles.breadcrumb}>
                  {breadcrumb.map((item, i) => (
                    <span key={i} className={styles.breadcrumbItem}>
                      {item.href ? (
                        <a href={item.href}>{item.label}</a>
                      ) : (
                        <span className={styles.breadcrumbCurrent}>{item.label}</span>
                      )}
                      {i < breadcrumb.length - 1 && <span className={styles.breadcrumbSep}>/</span>}
                    </span>
                  ))}
                </nav>
              ) : title ? (
                <h1 className={styles.pageTitle}>{title}</h1>
              ) : null}
            </div>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.balanceChip}>
              <span className={styles.balanceLabel}>Saldo</span>
              <span className={styles.balanceValue}>R$ 15.770</span>
            </div>

            <button className={styles.notificationBtn} aria-label="Notificações">
              🔔
              <span className={styles.notifBadge}>3</span>
            </button>

            <a href="/dashboard/perfil" className={styles.avatarLink}>
              <div className={styles.avatar}>GO</div>
              <div className={styles.avatarInfo}>
                <span className={styles.avatarName}>Gabriel O.</span>
                <span className={styles.avatarRole}>Investidor</span>
              </div>
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
