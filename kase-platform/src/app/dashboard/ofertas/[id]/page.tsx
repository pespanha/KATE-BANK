'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AssetBadge from '@/components/AssetBadge';
import ProgressBar from '@/components/ProgressBar';
import { mockOfferings, formatCurrency } from '@/lib/mock-data';
import styles from './page.module.css';

const tabs = ['Sobre', 'Destaques', 'Documentos', 'Atualizações'];

const mockDocuments = [
  { name: 'Plano de Negócios 2026', category: 'FINANCIAL', size: '2.4 MB' },
  { name: 'Contrato Social', category: 'LEGAL', size: '1.1 MB' },
  { name: 'Pitch Deck', category: 'PITCH', size: '5.7 MB' },
  { name: 'Demonstrações Financeiras 2025', category: 'FINANCIAL', size: '3.2 MB' },
  { name: 'Parecer Jurídico CVM 88', category: 'LEGAL', size: '890 KB' },
];

export default function OfertaDetalhePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('Sobre');
  const [investAmount, setInvestAmount] = useState('');

  const offering = mockOfferings.find((o) => o.id === params.id) || mockOfferings[0];
  const progress = (offering.raisedAmount / offering.totalAmount) * 100;
  const units = investAmount ? Math.floor(Number(investAmount.replace(/\D/g, '')) / offering.unitPrice) : 0;

  return (
    <DashboardLayout
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Ofertas', href: '/dashboard/ofertas' },
        { label: offering.companyName },
      ]}
    >
      <div className={styles.layout}>
        {/* Main content */}
        <div className={styles.mainCol}>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroLogo}>{offering.companyName.charAt(0)}</div>
            <div>
              <div className={styles.heroMeta}>
                <AssetBadge type={offering.assetType} />
                <span className={styles.heroSector}>{offering.sector}</span>
                <span className={`${styles.statusBadge} ${offering.status === 'ACTIVE' ? styles.statusActive : styles.statusFunded}`}>
                  {offering.status === 'ACTIVE' ? '🟢 Aberta' : '✅ Captação Completa'}
                </span>
              </div>
              <h1 className={styles.heroTitle}>{offering.companyName}</h1>
              <p className={styles.heroDesc}>{offering.companyDescription}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'Sobre' && (
              <div className={styles.aboutSection}>
                <h3>Sobre a empresa</h3>
                <p>{offering.companyDescription}</p>
                <p>A {offering.companyName} está oferecendo tokens {offering.tokenCode} para captação de {formatCurrency(offering.totalAmount)}. Cada unidade custa {formatCurrency(offering.unitPrice)}, com investimento mínimo de {formatCurrency(offering.minInvestment)}.</p>
                <div className={styles.keyMetrics}>
                  <div className={styles.metric}><span className={styles.metricLabel}>Token</span><span className={styles.metricValue}>{offering.tokenCode}</span></div>
                  <div className={styles.metric}><span className={styles.metricLabel}>Total de Unidades</span><span className={styles.metricValue}>{offering.totalUnits.toLocaleString('pt-BR')}</span></div>
                  <div className={styles.metric}><span className={styles.metricLabel}>Início</span><span className={styles.metricValue}>{offering.startDate}</span></div>
                  <div className={styles.metric}><span className={styles.metricLabel}>Encerramento</span><span className={styles.metricValue}>{offering.endDate}</span></div>
                </div>
              </div>
            )}
            {activeTab === 'Destaques' && (
              <div className={styles.highlightsSection}>
                <h3>Destaques do Investimento</h3>
                <div className={styles.highlightsList}>
                  {offering.highlights.map((h, i) => (
                    <div key={i} className={styles.highlightItem}>
                      <span className={styles.highlightIcon}>✦</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'Documentos' && (
              <div className={styles.docsSection}>
                <h3>Data Room</h3>
                <p className={styles.docsSubtitle}>Documentos disponíveis para análise antes de investir.</p>
                <div className={styles.docsList}>
                  {mockDocuments.map((doc, i) => (
                    <div key={i} className={styles.docItem}>
                      <span className={styles.docIcon}>📄</span>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{doc.name}</span>
                        <span className={styles.docMeta}>{doc.category} · {doc.size}</span>
                      </div>
                      <button className={styles.docDownload}>↓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'Atualizações' && (
              <div className={styles.updatesSection}>
                <h3>Atualizações da Oferta</h3>
                <div className={styles.updateItem}>
                  <span className={styles.updateDate}>28 Abr 2026</span>
                  <h4>Meta mínima atingida! 🎉</h4>
                  <p>A oferta atingiu a meta mínima de {formatCurrency(offering.minGoal)}. A captação continua aberta até o prazo final.</p>
                </div>
                <div className={styles.updateItem}>
                  <span className={styles.updateDate}>15 Mar 2026</span>
                  <h4>Novo relatório financeiro</h4>
                  <p>Adicionamos as demonstrações financeiras de 2025 ao Data Room.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.investCard}>
            <h3 className={styles.investTitle}>Investir</h3>
            <ProgressBar value={progress} label={`${formatCurrency(offering.raisedAmount)} captados`} size="md" />
            <div className={styles.investMeta}>
              <div><span className={styles.imLabel}>Meta</span><span className={styles.imValue}>{formatCurrency(offering.totalAmount)}</span></div>
              <div><span className={styles.imLabel}>Investidores</span><span className={styles.imValue}>{offering.investorCount}</span></div>
              <div><span className={styles.imLabel}>Prazo</span><span className={styles.imValue}>{offering.daysRemaining > 0 ? `${offering.daysRemaining} dias` : 'Encerrado'}</span></div>
            </div>

            {offering.status === 'ACTIVE' && (
              <>
                <div className={styles.investInput}>
                  <label className={styles.investLabel}>Valor do investimento</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputPrefix}>R$</span>
                    <input type="text" className={styles.input} placeholder="0,00" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} />
                  </div>
                  {units > 0 && <span className={styles.unitsHint}>≈ {units} tokens de {offering.tokenCode}</span>}
                </div>
                <button className={styles.investBtn}>Investir Agora →</button>
                <p className={styles.minNote}>Investimento mínimo: {formatCurrency(offering.minInvestment)}</p>
              </>
            )}
          </div>

          <div className={styles.securityCard}>
            <h4>🛡️ Segurança</h4>
            <ul>
              <li>Tokens custodiados na Stellar</li>
              <li>Compliance CVM 88</li>
              <li>Smart contract auditado</li>
            </ul>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
