'use client';

import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import AssetBadge from '@/components/AssetBadge';
import ProgressBar from '@/components/ProgressBar';
import MiniChart from '@/components/MiniChart';
import ActivityTimeline from '@/components/ActivityTimeline';
import {
  mockPortfolio,
  mockPortfolioSummary,
  mockOfferings,
  mockActivities,
  formatCurrency,
  formatPercent,
} from '@/lib/mock-data';
import styles from './page.module.css';

export default function DashboardPage() {
  const summary = mockPortfolioSummary;
  const featuredOfferings = mockOfferings.filter((o) => o.status === 'ACTIVE').slice(0, 3);

  return (
    <DashboardLayout title="Dashboard">
      {/* ═══ Portfolio Summary Card ═══ */}
      <section className={styles.summaryCard}>
        <div className={styles.summaryGlow} />
        <div className={styles.summaryContent}>
          <div className={styles.summaryMain}>
            <span className={styles.summaryLabel}>Valor Total do Portfólio</span>
            <h2 className={styles.summaryValue}>{formatCurrency(summary.totalValue)}</h2>
            <div className={styles.summaryReturn}>
              <span className={`${styles.returnValue} ${summary.totalReturn >= 0 ? styles.positive : styles.negative}`}>
                {summary.totalReturn >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(summary.totalReturn))}
              </span>
              <span className={`${styles.returnPercent} ${summary.totalReturn >= 0 ? styles.positive : styles.negative}`}>
                ({formatPercent(summary.totalReturnPercent)})
              </span>
            </div>
          </div>
          <div className={styles.summaryMeta}>
            <div className={styles.summaryMetaItem}>
              <span className={styles.metaLabel}>Investido</span>
              <span className={styles.metaValue}>{formatCurrency(summary.totalInvested)}</span>
            </div>
            <div className={styles.summaryMetaItem}>
              <span className={styles.metaLabel}>Empresas</span>
              <span className={styles.metaValue}>{summary.assetCount}</span>
            </div>
            <div className={styles.summaryMetaItem}>
              <span className={styles.metaLabel}>Desde</span>
              <span className={styles.metaValue}>Jan 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats Grid ═══ */}
      <section className={styles.statsGrid}>
        <StatCard
          icon="💰"
          label="Limite CVM Restante"
          value={formatCurrency(summary.cvmLimitTotal - summary.cvmLimitUsed)}
          subtitle={`de ${formatCurrency(summary.cvmLimitTotal)}`}
        />
        <StatCard
          icon="🚀"
          label="Ofertas Ativas"
          value={summary.activeOffers.toString()}
          subtitle="captações abertas"
        />
        <StatCard
          icon="🔄"
          label="Ordens Abertas"
          value={summary.openOrders.toString()}
          subtitle="no mercado secundário"
        />
        <StatCard
          icon="⏳"
          label="Rendimentos Pendentes"
          value={formatCurrency(summary.pendingReturns)}
          trend="up"
          trendValue="previstos"
        />
      </section>

      {/* ═══ Two-Column: Assets + Activity ═══ */}
      <div className={styles.twoColumns}>
        {/* ── My Assets ── */}
        <section className={styles.assetsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Meus Ativos</h3>
            <a href="/dashboard/portfolio" className={styles.seeAll}>Ver todos →</a>
          </div>

          <div className={styles.assetsTable}>
            <div className={styles.tableHeader}>
              <span>Ativo</span>
              <span>Tipo</span>
              <span>Qtd</span>
              <span>Preço Atual</span>
              <span>Tendência</span>
              <span>Variação</span>
              <span></span>
            </div>

            {mockPortfolio.map((asset) => (
              <div key={asset.id} className={styles.tableRow}>
                <div className={styles.assetNameCell}>
                  <span className={styles.assetTicker}>{asset.ticker}</span>
                  <span className={styles.assetCompany}>{asset.companyName}</span>
                </div>
                <div><AssetBadge type={asset.assetType} compact /></div>
                <div className={styles.cellValue}>{asset.units}</div>
                <div className={styles.cellValue}>{formatCurrency(asset.currentPrice)}</div>
                <div>
                  <MiniChart
                    data={asset.sparklineData}
                    width={80}
                    height={28}
                    positive={asset.changePercent >= 0}
                  />
                </div>
                <div className={`${styles.cellChange} ${asset.changePercent >= 0 ? styles.positive : styles.negative}`}>
                  {formatPercent(asset.changePercent)}
                </div>
                <div>
                  <a href="/dashboard/mercado" className={styles.sellBtn}>Vender</a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Activity ── */}
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Atividade Recente</h3>
          </div>
          <ActivityTimeline activities={mockActivities} maxItems={6} />
        </section>
      </div>

      {/* ═══ Featured Offerings ═══ */}
      <section className={styles.offeringsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Ofertas em Destaque</h3>
          <a href="/dashboard/ofertas" className={styles.seeAll}>Ver todas →</a>
        </div>

        <div className={styles.offeringsGrid}>
          {featuredOfferings.map((offering) => {
            const progressPercent = (offering.raisedAmount / offering.totalAmount) * 100;
            return (
              <a key={offering.id} href={`/dashboard/ofertas/${offering.id}`} className={styles.offeringCard}>
                <div className={styles.offeringHeader}>
                  <div className={styles.offeringLogo}>
                    {offering.companyName.charAt(0)}
                  </div>
                  <div>
                    <span className={styles.offeringName}>{offering.companyName}</span>
                    <div className={styles.offeringMeta}>
                      <AssetBadge type={offering.assetType} compact />
                      <span className={styles.offeringSector}>{offering.sector}</span>
                    </div>
                  </div>
                </div>

                <p className={styles.offeringDesc}>
                  {offering.companyDescription.slice(0, 100)}...
                </p>

                <ProgressBar
                  value={progressPercent}
                  label={`${formatCurrency(offering.raisedAmount)} captados`}
                  size="sm"
                />

                <div className={styles.offeringStats}>
                  <div>
                    <span className={styles.offeringStatLabel}>Meta</span>
                    <span className={styles.offeringStatValue}>{formatCurrency(offering.totalAmount)}</span>
                  </div>
                  <div>
                    <span className={styles.offeringStatLabel}>Mín.</span>
                    <span className={styles.offeringStatValue}>{formatCurrency(offering.minInvestment)}</span>
                  </div>
                  <div>
                    <span className={styles.offeringStatLabel}>Prazo</span>
                    <span className={styles.offeringStatValue}>{offering.daysRemaining}d</span>
                  </div>
                  <div>
                    <span className={styles.offeringStatLabel}>Investidores</span>
                    <span className={styles.offeringStatValue}>{offering.investorCount}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </DashboardLayout>
  );
}
