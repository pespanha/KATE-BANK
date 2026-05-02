'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AssetBadge from '@/components/AssetBadge';
import ProgressBar from '@/components/ProgressBar';
import { mockOfferings, formatCurrency, type AssetType } from '@/lib/mock-data';
import styles from './page.module.css';

const filterOptions: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ON', label: 'Ação ON' },
  { value: 'PN', label: 'Ação PN' },
  { value: 'DEBT', label: 'Dívida' },
  { value: 'CONV', label: 'Conversível' },
  { value: 'REC', label: 'Recebível' },
];

export default function OfertasPage() {
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? mockOfferings
    : mockOfferings.filter((o) => o.assetType === filter);

  return (
    <DashboardLayout
      title="Ofertas"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Ofertas' },
      ]}
    >
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Marketplace de Investimentos</h2>
          <p className={styles.pageSubtitle}>Explore ofertas verificadas e invista com segurança na blockchain Stellar.</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.filterBtn} ${filter === opt.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.map((offering) => {
          const progress = (offering.raisedAmount / offering.totalAmount) * 100;
          return (
            <a key={offering.id} href={`/dashboard/ofertas/${offering.id}`} className={styles.card}>
              {offering.status === 'FUNDED' && <div className={styles.fundedBanner}>✅ CAPTAÇÃO COMPLETA</div>}
              <div className={styles.cardHeader}>
                <div className={styles.logo}>{offering.companyName.charAt(0)}</div>
                <div className={styles.cardHeaderInfo}>
                  <span className={styles.companyName}>{offering.companyName}</span>
                  <div className={styles.cardMeta}>
                    <AssetBadge type={offering.assetType} compact />
                    <span className={styles.sector}>{offering.sector}</span>
                  </div>
                </div>
              </div>

              <p className={styles.desc}>{offering.companyDescription.slice(0, 120)}...</p>

              <div className={styles.highlights}>
                {offering.highlights.slice(0, 2).map((h, i) => (
                  <span key={i} className={styles.highlight}>• {h}</span>
                ))}
              </div>

              <ProgressBar value={progress} label={`${formatCurrency(offering.raisedAmount)} de ${formatCurrency(offering.totalAmount)}`} size="sm" />

              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Preço/un.</span>
                  <span className={styles.statValue}>{formatCurrency(offering.unitPrice)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Mín.</span>
                  <span className={styles.statValue}>{formatCurrency(offering.minInvestment)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Prazo</span>
                  <span className={styles.statValue}>{offering.daysRemaining > 0 ? `${offering.daysRemaining}d` : 'Encerrado'}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Investidores</span>
                  <span className={styles.statValue}>{offering.investorCount}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cta}>{offering.status === 'ACTIVE' ? 'Ver Oferta →' : 'Ver Detalhes →'}</span>
              </div>
            </a>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
