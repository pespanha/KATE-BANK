'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AssetBadge from '@/components/AssetBadge';
import {
  mockBuyOrders, mockSellOrders, mockTrades,
  availableTokens, formatCurrency,
} from '@/lib/mock-data';
import styles from './page.module.css';

export default function MercadoPage() {
  const [selectedToken, setSelectedToken] = useState(availableTokens[0]);
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const total = price && quantity ? (Number(price) * Number(quantity)) : 0;
  const spread = mockSellOrders[0].pricePerUnit - mockBuyOrders[0].pricePerUnit;

  return (
    <DashboardLayout
      title="Mercado Secundário"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Mercado Secundário' },
      ]}
    >
      {/* Token Selector */}
      <div className={styles.tokenBar}>
        <div className={styles.tokenSelector}>
          {availableTokens.map((token) => (
            <button
              key={token.ticker}
              className={`${styles.tokenBtn} ${selectedToken.ticker === token.ticker ? styles.tokenActive : ''}`}
              onClick={() => setSelectedToken(token)}
            >
              <span className={styles.tokenTicker}>{token.ticker}</span>
              <AssetBadge type={token.assetType} compact />
            </button>
          ))}
        </div>
        <div className={styles.tokenInfo}>
          <span className={styles.tokenName}>{selectedToken.companyName}</span>
          <span className={styles.tokenPrice}>Último: {formatCurrency(selectedToken.lastPrice)}</span>
        </div>
      </div>

      <div className={styles.marketLayout}>
        {/* Order Book */}
        <div className={styles.bookSection}>
          <h3 className={styles.sectionTitle}>Order Book</h3>
          <div className={styles.book}>
            {/* Headers */}
            <div className={styles.bookHeader}>
              <span>Preço</span><span>Qtd</span><span>Total</span>
            </div>

            {/* Sell orders (asks) - reversed */}
            <div className={styles.asks}>
              {[...mockSellOrders].reverse().map((order) => (
                <div key={order.id} className={styles.bookRow}>
                  <span className={styles.askPrice}>{formatCurrency(order.pricePerUnit)}</span>
                  <span className={styles.bookQty}>{order.units}</span>
                  <span className={styles.bookTotal}>{formatCurrency(order.total)}</span>
                  <div className={styles.depthBar} style={{ width: `${(order.units / 500) * 100}%` }} data-side="ask" />
                </div>
              ))}
            </div>

            {/* Spread */}
            <div className={styles.spreadRow}>
              <span className={styles.spreadValue}>Spread: {formatCurrency(spread)}</span>
              <span className={styles.spreadPercent}>({((spread / mockBuyOrders[0].pricePerUnit) * 100).toFixed(2)}%)</span>
            </div>

            {/* Buy orders (bids) */}
            <div className={styles.bids}>
              {mockBuyOrders.map((order) => (
                <div key={order.id} className={styles.bookRow}>
                  <span className={styles.bidPrice}>{formatCurrency(order.pricePerUnit)}</span>
                  <span className={styles.bookQty}>{order.units}</span>
                  <span className={styles.bookTotal}>{formatCurrency(order.total)}</span>
                  <div className={styles.depthBar} style={{ width: `${(order.units / 500) * 100}%` }} data-side="bid" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className={styles.orderSection}>
          <h3 className={styles.sectionTitle}>Nova Ordem</h3>
          <div className={styles.orderCard}>
            <div className={styles.sideTabs}>
              <button className={`${styles.sideTab} ${orderSide === 'BUY' ? styles.buyActive : ''}`} onClick={() => setOrderSide('BUY')}>Comprar</button>
              <button className={`${styles.sideTab} ${orderSide === 'SELL' ? styles.sellActive : ''}`} onClick={() => setOrderSide('SELL')}>Vender</button>
            </div>

            <div className={styles.formGroup}>
              <label>Preço por unidade</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputPfx}>R$</span>
                <input type="number" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Quantidade</label>
              <div className={styles.inputWrap}>
                <input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <span className={styles.inputSfx}>un.</span>
              </div>
            </div>

            <div className={styles.orderTotal}>
              <span>Total</span>
              <span className={styles.totalValue}>{formatCurrency(total)}</span>
            </div>

            <button className={`${styles.submitBtn} ${orderSide === 'BUY' ? styles.submitBuy : styles.submitSell}`}>
              {orderSide === 'BUY' ? 'Criar Ordem de Compra' : 'Criar Ordem de Venda'}
            </button>

            <p className={styles.orderNote}>⚠️ CVM 88: ordens são exibidas no book e requerem aceite manual da contraparte.</p>
          </div>
        </div>

        {/* Trade History */}
        <div className={styles.tradesSection}>
          <h3 className={styles.sectionTitle}>Histórico de Trades</h3>
          <div className={styles.tradesTable}>
            <div className={styles.tradeHeader}>
              <span>Token</span><span>Lado</span><span>Preço</span><span>Qtd</span><span>Total</span><span>Data</span>
            </div>
            {mockTrades.map((trade) => (
              <div key={trade.id} className={styles.tradeRow}>
                <span className={styles.tradeTicker}>{trade.ticker}</span>
                <span className={trade.side === 'BUY' ? styles.tradeBuy : styles.tradeSell}>{trade.side === 'BUY' ? 'Compra' : 'Venda'}</span>
                <span>{formatCurrency(trade.pricePerUnit)}</span>
                <span>{trade.units}</span>
                <span className={styles.tradeTotal}>{formatCurrency(trade.total)}</span>
                <span className={styles.tradeDate}>{trade.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
