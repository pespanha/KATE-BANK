'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AssetBadge from '@/components/AssetBadge';
import {
  mockBuyOrders, mockSellOrders, mockTrades,
  availableTokens, formatCurrency, platformFees,
  currencySymbols, formatCurrencyValue,
  type QuoteCurrency, type SecondaryOrder,
} from '@/lib/mock-data';
import styles from './page.module.css';

type TabView = 'listings' | 'my-orders' | 'history';
type FilterSide = 'ALL' | 'SELL' | 'BUY';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabView>('listings');
  const [filterSide, setFilterSide] = useState<FilterSide>('ALL');
  const [filterToken, setFilterToken] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ── Order form state ── */
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('SELL');
  const [orderToken, setOrderToken] = useState(availableTokens[0].ticker);
  const [orderPrice, setOrderPrice] = useState('');
  const [orderQty, setOrderQty] = useState('');
  const [orderCurrency, setOrderCurrency] = useState<QuoteCurrency>('BRL');
  const [orderDesc, setOrderDesc] = useState('');

  const selectedTokenInfo = availableTokens.find(t => t.ticker === orderToken);
  const orderTotal = orderPrice && orderQty ? (Number(orderPrice) * Number(orderQty)) : 0;
  const takerFee = orderTotal * (platformFees.takerFeePercent / 100);

  /* ── Merge and filter all listings ── */
  const allListings: SecondaryOrder[] = useMemo(() => {
    const merged = [...mockSellOrders, ...mockBuyOrders].filter(o => o.status === 'OPEN');
    let filtered = merged;
    if (filterSide !== 'ALL') filtered = filtered.filter(o => o.side === filterSide);
    if (filterToken !== 'ALL') filtered = filtered.filter(o => o.ticker === filterToken);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filterSide, filterToken]);

  /* ── Unique tickers from listings ── */
  const uniqueTickers = [...new Set([...mockSellOrders, ...mockBuyOrders].map(o => o.ticker))];

  return (
    <DashboardLayout
      title="Marketplace"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Marketplace' },
      ]}
    >
      {/* ── Fee transparency banner ── */}
      <div className={styles.feeBanner}>
        <div className={styles.feeItem}>
          <span className={styles.feeIcon}>⛽</span>
          <div>
            <span className={styles.feeLabel}>Gas (XLM)</span>
            <span className={styles.feeValue}>Pago pela KASE</span>
          </div>
        </div>
        <div className={styles.feeDivider} />
        <div className={styles.feeItem}>
          <span className={styles.feeIcon}>📊</span>
          <div>
            <span className={styles.feeLabel}>Fee Maker</span>
            <span className={styles.feeValue}>{platformFees.makerFeePercent}%</span>
          </div>
        </div>
        <div className={styles.feeDivider} />
        <div className={styles.feeItem}>
          <span className={styles.feeIcon}>🤝</span>
          <div>
            <span className={styles.feeLabel}>Fee Taker</span>
            <span className={styles.feeValue}>{platformFees.takerFeePercent}%</span>
          </div>
        </div>
        <div className={styles.feeDivider} />
        <div className={styles.feeItem}>
          <span className={styles.feeIcon}>💱</span>
          <div>
            <span className={styles.feeLabel}>Cobrado em</span>
            <span className={styles.feeValue}>Stablecoin (BRL/USDC)</span>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'listings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            🏪 Anúncios Ativos
            <span className={styles.tabCount}>{allListings.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'my-orders' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('my-orders')}
          >
            📋 Meus Anúncios
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Histórico
          </button>
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreateModal(!showCreateModal)}>
          + Criar Anúncio
        </button>
      </div>

      {/* ── Create Order Modal / Panel ── */}
      {showCreateModal && (
        <div className={styles.createPanel}>
          <h3 className={styles.createTitle}>Novo Anúncio</h3>
          <p className={styles.createSubtitle}>
            CVM 88: seu anúncio ficará visível no marketplace. A contraparte precisará aceitar manualmente.
          </p>

          <div className={styles.createForm}>
            <div className={styles.sideTabs}>
              <button
                className={`${styles.sideTab} ${orderSide === 'SELL' ? styles.sellActive : ''}`}
                onClick={() => setOrderSide('SELL')}
              >
                📤 Quero Vender
              </button>
              <button
                className={`${styles.sideTab} ${orderSide === 'BUY' ? styles.buyActive : ''}`}
                onClick={() => setOrderSide('BUY')}
              >
                📥 Quero Comprar
              </button>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Token</label>
                <select value={orderToken} onChange={(e) => setOrderToken(e.target.value)}>
                  {availableTokens.map(t => (
                    <option key={t.ticker} value={t.ticker}>{t.ticker} — {t.companyName}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Moeda de liquidação</label>
                <div className={styles.currencySelector}>
                  {(selectedTokenInfo?.quoteCurrencies ?? ['BRL']).map(c => (
                    <button
                      key={c}
                      className={`${styles.currencyBtn} ${orderCurrency === c ? styles.currencyActive : ''}`}
                      onClick={() => setOrderCurrency(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Preço por unidade</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPfx}>{currencySymbols[orderCurrency]}</span>
                  <input type="number" placeholder="0,00" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} />
                </div>
                {selectedTokenInfo && (
                  <span className={styles.inputHint}>
                    Último: {formatCurrency(selectedTokenInfo.lastPrice)}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Quantidade</label>
                <div className={styles.inputWrap}>
                  <input type="number" placeholder="0" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} />
                  <span className={styles.inputSfx}>un.</span>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Observação (opcional)</label>
              <textarea
                placeholder="Ex: Aceito proposta, negociável..."
                value={orderDesc}
                onChange={(e) => setOrderDesc(e.target.value)}
                rows={2}
              />
            </div>

            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}>
                <span>Total</span>
                <span className={styles.summaryValue}>{formatCurrencyValue(orderTotal, orderCurrency)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Fee estimado ({orderSide === 'SELL' ? 'maker' : 'taker'})</span>
                <span className={styles.summaryFee}>
                  {formatCurrencyValue(orderSide === 'SELL' ? orderTotal * (platformFees.makerFeePercent / 100) : takerFee, orderCurrency)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Gas (XLM)</span>
                <span className={styles.summaryGas}>Pago pela KASE ✅</span>
              </div>
            </div>

            <button className={`${styles.submitBtn} ${orderSide === 'SELL' ? styles.submitSell : styles.submitBuy}`}>
              {orderSide === 'SELL' ? '📤 Publicar Venda' : '📥 Publicar Compra'}
            </button>
          </div>
        </div>
      )}

      {/* ── Listings Tab ── */}
      {activeTab === 'listings' && (
        <>
          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${filterSide === 'ALL' ? styles.filterActive : ''}`}
                onClick={() => setFilterSide('ALL')}
              >Todos</button>
              <button
                className={`${styles.filterBtn} ${filterSide === 'SELL' ? styles.filterActive : ''} ${styles.filterSell}`}
                onClick={() => setFilterSide('SELL')}
              >🔴 Vendas</button>
              <button
                className={`${styles.filterBtn} ${filterSide === 'BUY' ? styles.filterActive : ''} ${styles.filterBuy}`}
                onClick={() => setFilterSide('BUY')}
              >🟢 Compras</button>
            </div>
            <select
              className={styles.tokenFilter}
              value={filterToken}
              onChange={(e) => setFilterToken(e.target.value)}
            >
              <option value="ALL">Todos os tokens</option>
              {uniqueTickers.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Listing cards */}
          <div className={styles.listingsGrid}>
            {allListings.map((order) => (
              <div key={order.id} className={`${styles.listingCard} ${order.side === 'SELL' ? styles.sellCard : styles.buyCard}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardUser}>
                    <div className={styles.userAvatar}>{order.userAvatar}</div>
                    <div>
                      <span className={styles.userName}>{order.userName}</span>
                      <span className={styles.userDate}>{order.createdAt}</span>
                    </div>
                  </div>
                  <span className={`${styles.sideBadge} ${order.side === 'SELL' ? styles.sideSell : styles.sideBuy}`}>
                    {order.side === 'SELL' ? '📤 Venda' : '📥 Compra'}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardToken}>
                    <span className={styles.tokenTicker}>{order.ticker}</span>
                    <AssetBadge type={availableTokens.find(t => t.ticker === order.ticker)?.assetType ?? 'ON'} compact />
                  </div>
                  <span className={styles.cardCompany}>{order.companyName}</span>

                  {order.description && (
                    <p className={styles.cardDesc}>{order.description}</p>
                  )}

                  <div className={styles.cardDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Preço/un.</span>
                      <span className={styles.detailValue}>{formatCurrencyValue(order.pricePerUnit, order.quoteCurrency)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Quantidade</span>
                      <span className={styles.detailValue}>{order.units} un.</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Total</span>
                      <span className={`${styles.detailValue} ${styles.detailTotal}`}>
                        {formatCurrencyValue(order.total, order.quoteCurrency)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardMeta}>
                      <span className={styles.currencyTag}>{order.quoteCurrency}</span>
                      <span className={styles.expiresTag}>Expira: {order.expiresAt.split(' ')[0]}</span>
                    </div>
                    <button className={`${styles.acceptBtn} ${order.side === 'SELL' ? styles.acceptBuy : styles.acceptSell}`}>
                      {order.side === 'SELL' ? '🤝 Aceitar Compra' : '🤝 Aceitar Venda'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allListings.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🏪</span>
              <h3>Nenhum anúncio encontrado</h3>
              <p>Não há anúncios com os filtros selecionados. Tente mudar os filtros ou crie um novo anúncio.</p>
            </div>
          )}
        </>
      )}

      {/* ── My Orders Tab ── */}
      {activeTab === 'my-orders' && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📋</span>
          <h3>Seus Anúncios</h3>
          <p>Você ainda não criou nenhum anúncio no marketplace. Clique em &quot;Criar Anúncio&quot; para começar.</p>
          <button className={styles.emptyBtn} onClick={() => setShowCreateModal(true)}>
            + Criar Anúncio
          </button>
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className={styles.tradesSection}>
          <div className={styles.tradesTable}>
            <div className={styles.tradeHeader}>
              <span>Token</span><span>Lado</span><span>Preço</span><span>Qtd</span><span>Total</span><span>Moeda</span><span>Data</span>
            </div>
            {mockTrades.map((trade) => (
              <div key={trade.id} className={styles.tradeRow}>
                <span className={styles.tradeTicker}>{trade.ticker}</span>
                <span className={trade.side === 'BUY' ? styles.tradeBuy : styles.tradeSell}>
                  {trade.side === 'BUY' ? 'Compra' : 'Venda'}
                </span>
                <span>{formatCurrencyValue(trade.pricePerUnit, trade.quoteCurrency)}</span>
                <span>{trade.units}</span>
                <span className={styles.tradeTotal}>{formatCurrencyValue(trade.total, trade.quoteCurrency)}</span>
                <span className={styles.tradeCurrency}>{trade.quoteCurrency}</span>
                <span className={styles.tradeDate}>{trade.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CVM 88 Notice ── */}
      <div className={styles.cvmNotice}>
        <span className={styles.cvmIcon}>⚖️</span>
        <p>
          <strong>CVM 88 — Mercado Secundário:</strong> Este marketplace opera no modelo de classificados com aceite manual.
          Não há matching automático de ordens. O investidor que aceita uma oferta concorda com os termos publicados.
          Taxa de gas (XLM) é absorvida pela KASE. Fees de transação são cobrados em stablecoin.
        </p>
      </div>
    </DashboardLayout>
  );
}
