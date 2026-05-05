/* ========================================
   KASE Mock Data — Visual-First Development
   ======================================== */

/* ── Asset Types ── */
export type AssetType = 'ON' | 'PN' | 'DEBT' | 'CONV' | 'REC';
export type OrderSide = 'BUY' | 'SELL';
export type OfferingStatus = 'ACTIVE' | 'FUNDED' | 'DRAFT' | 'CLOSED' | 'FAILED';
export type KycStatus = 'APPROVED' | 'PENDING' | 'REJECTED';
export type QuoteCurrency = 'BRL' | 'USDC' | 'BRZ';

/* ── Interfaces ── */
export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  type: 'PF' | 'PJ' | 'QUALIFICADO';
  kycStatus: KycStatus;
  stellarAddress: string;
  annualIncome: number;
  investmentLimit: number;
  totalInvested: number;
  avatarInitials: string;
  createdAt: string;
}

export interface PortfolioAsset {
  id: string;
  companyName: string;
  ticker: string;
  assetType: AssetType;
  units: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
}

export interface Offering {
  id: string;
  companyName: string;
  companyDescription: string;
  assetType: AssetType;
  tokenCode: string;
  totalAmount: number;
  raisedAmount: number;
  minGoal: number;
  unitPrice: number;
  totalUnits: number;
  minInvestment: number;
  investorCount: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: OfferingStatus;
  sector: string;
  highlights: string[];
}

export interface SecondaryOrder {
  id: string;
  side: OrderSide;
  ticker: string;
  companyName: string;
  units: number;
  pricePerUnit: number;
  total: number;
  quoteCurrency: QuoteCurrency;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  expiresAt: string;
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  description?: string;
}

export interface AssetParity {
  offeringId: string;
  quoteCurrencies: QuoteCurrency[];
}

export interface FeeInfo {
  gasPaidByPlatform: boolean;
  makerFeePercent: number;
  takerFeePercent: number;
  feeCurrency: QuoteCurrency;
}

export interface Trade {
  id: string;
  ticker: string;
  side: OrderSide;
  units: number;
  pricePerUnit: number;
  total: number;
  quoteCurrency: QuoteCurrency;
  buyerName: string;
  sellerName: string;
  makerFee: number;
  takerFee: number;
  platformGasCost: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'investment' | 'dividend' | 'order_created' | 'order_filled' | 'kyc_approved' | 'deposit' | 'withdrawal';
  title: string;
  description: string;
  amount?: number;
  date: string;
  status: 'success' | 'pending' | 'info';
}

/* ── Mock User ── */
export const mockUser: User = {
  id: 'usr_01',
  name: 'Gabriel Oliveira',
  email: 'gabriel@email.com',
  cpf: '***.***.***-42',
  phone: '(11) 99999-0042',
  type: 'PF',
  kycStatus: 'APPROVED',
  stellarAddress: 'GCKX...Q7YF',
  annualIncome: 180000,
  investmentLimit: 20000,
  totalInvested: 4230,
  avatarInitials: 'GO',
  createdAt: '2026-01-15',
};

/* ── Portfolio ── */
export const mockPortfolio: PortfolioAsset[] = [
  {
    id: 'ast_01',
    companyName: 'NovaTech Soluções',
    ticker: 'NVTC_ON',
    assetType: 'ON',
    units: 500,
    avgPrice: 10.0,
    currentPrice: 11.20,
    totalValue: 5600,
    change: 600,
    changePercent: 12.0,
    sparklineData: [10, 10.2, 10.5, 10.3, 10.8, 11.0, 10.9, 11.2],
  },
  {
    id: 'ast_02',
    companyName: 'EnergyBR Renováveis',
    ticker: 'ENBR_PN',
    assetType: 'PN',
    units: 300,
    avgPrice: 25.0,
    currentPrice: 26.50,
    totalValue: 7950,
    change: 450,
    changePercent: 6.0,
    sparklineData: [25, 25.3, 24.8, 25.5, 26.0, 25.8, 26.2, 26.5],
  },
  {
    id: 'ast_03',
    companyName: 'AgroPrime',
    ticker: 'AGRP_DEBT',
    assetType: 'DEBT',
    units: 200,
    avgPrice: 100.0,
    currentPrice: 102.0,
    totalValue: 20400,
    change: 400,
    changePercent: 2.0,
    sparklineData: [100, 100.5, 101, 100.8, 101.2, 101.5, 101.8, 102],
  },
  {
    id: 'ast_04',
    companyName: 'FinLeap',
    ticker: 'FNLP_CONV',
    assetType: 'CONV',
    units: 150,
    avgPrice: 75.0,
    currentPrice: 73.20,
    totalValue: 10980,
    change: -270,
    changePercent: -2.4,
    sparklineData: [75, 74.5, 74.8, 74.2, 73.8, 74.0, 73.5, 73.2],
  },
];

/* ── Portfolio Summary ── */
export const mockPortfolioSummary = {
  totalValue: mockPortfolio.reduce((sum, a) => sum + a.totalValue, 0),
  totalInvested: mockPortfolio.reduce((sum, a) => sum + a.units * a.avgPrice, 0),
  get totalReturn() {
    return this.totalValue - this.totalInvested;
  },
  get totalReturnPercent() {
    return ((this.totalReturn / this.totalInvested) * 100);
  },
  assetCount: mockPortfolio.length,
  cvmLimitUsed: 4230,
  cvmLimitTotal: 20000,
  activeOffers: 3,
  openOrders: 2,
  pendingReturns: 420,
};

/* ── Offerings ── */
export const mockOfferings: Offering[] = [
  {
    id: 'off_01',
    companyName: 'NovaTech Soluções',
    companyDescription: 'Empresa de tecnologia focada em soluções SaaS para PMEs. Crescimento de 180% no último ano com base de 2.500+ clientes ativos.',
    assetType: 'ON',
    tokenCode: 'NVTC_ON',
    totalAmount: 2000000,
    raisedAmount: 1440000,
    minGoal: 1000000,
    unitPrice: 10.0,
    totalUnits: 200000,
    minInvestment: 100,
    investorCount: 234,
    startDate: '2026-03-01',
    endDate: '2026-06-01',
    daysRemaining: 30,
    status: 'ACTIVE',
    sector: 'Tecnologia',
    highlights: ['ARR de R$ 4.2M', 'MRR crescendo 15%/mês', 'Churn < 2%', 'Rodada Seed: R$ 500k (2024)'],
  },
  {
    id: 'off_02',
    companyName: 'EnergyBR Renováveis',
    companyDescription: 'Geração distribuída de energia solar e eólica. Operação em 8 estados com 15 usinas ativas.',
    assetType: 'PN',
    tokenCode: 'ENBR_PN',
    totalAmount: 5000000,
    raisedAmount: 3750000,
    minGoal: 3000000,
    unitPrice: 25.0,
    totalUnits: 200000,
    minInvestment: 250,
    investorCount: 512,
    startDate: '2026-02-15',
    endDate: '2026-05-15',
    daysRemaining: 13,
    status: 'ACTIVE',
    sector: 'Energia',
    highlights: ['15 usinas operacionais', 'EBITDA R$ 8M (2025)', 'Contratos PPA 20 anos', 'Dividend yield projetado: 8%'],
  },
  {
    id: 'off_03',
    companyName: 'AgroPrime',
    companyDescription: 'Securitização de recebíveis do agronegócio. Portfolio de R$ 50M em CRAs com rating AA.',
    assetType: 'DEBT',
    tokenCode: 'AGRP_DEBT',
    totalAmount: 3000000,
    raisedAmount: 900000,
    minGoal: 1500000,
    unitPrice: 100.0,
    totalUnits: 30000,
    minInvestment: 500,
    investorCount: 89,
    startDate: '2026-04-01',
    endDate: '2026-07-01',
    daysRemaining: 60,
    status: 'ACTIVE',
    sector: 'Agronegócio',
    highlights: ['Rating AA', 'Cupom IPCA + 6%', 'Vencimento: 36 meses', 'Garantia real sobre recebíveis'],
  },
  {
    id: 'off_04',
    companyName: 'FinLeap',
    companyDescription: 'Fintech de crédito para micro e pequenas empresas. Modelo de credit scoring com IA.',
    assetType: 'CONV',
    tokenCode: 'FNLP_CONV',
    totalAmount: 1500000,
    raisedAmount: 1500000,
    minGoal: 1000000,
    unitPrice: 75.0,
    totalUnits: 20000,
    minInvestment: 150,
    investorCount: 178,
    startDate: '2026-01-10',
    endDate: '2026-04-10',
    daysRemaining: 0,
    status: 'FUNDED',
    sector: 'Fintech',
    highlights: ['Conversão em 2 anos ou a critério', 'Cap de R$ 30M', 'Desconto de 20%', 'NPL < 3%'],
  },
  {
    id: 'off_05',
    companyName: 'MedFlow Saúde',
    companyDescription: 'Healthtech com plataforma de gestão hospitalar em 40+ unidades de saúde.',
    assetType: 'REC',
    tokenCode: 'MFLW_REC',
    totalAmount: 800000,
    raisedAmount: 320000,
    minGoal: 500000,
    unitPrice: 50.0,
    totalUnits: 16000,
    minInvestment: 200,
    investorCount: 45,
    startDate: '2026-04-15',
    endDate: '2026-07-15',
    daysRemaining: 74,
    status: 'ACTIVE',
    sector: 'Saúde',
    highlights: ['40 unidades contratadas', 'Recebíveis de SUS + Convênios', 'Taxa: CDI + 4%', 'Prazo: 12 meses'],
  },
];

/* ── Platform Fee Model ── */
export const platformFees: FeeInfo = {
  gasPaidByPlatform: true,
  makerFeePercent: 0.5,
  takerFeePercent: 1.0,
  feeCurrency: 'BRL',
};

/* ── Asset Parities ── */
export const assetParities: AssetParity[] = [
  { offeringId: 'off_01', quoteCurrencies: ['BRL', 'USDC'] },
  { offeringId: 'off_02', quoteCurrencies: ['BRL', 'USDC', 'BRZ'] },
  { offeringId: 'off_03', quoteCurrencies: ['BRL'] },
  { offeringId: 'off_04', quoteCurrencies: ['BRL', 'USDC'] },
  { offeringId: 'off_05', quoteCurrencies: ['BRL', 'BRZ'] },
];

/* ── Secondary Market — Marketplace Listings (Classificados) ── */
export const mockSellOrders: SecondaryOrder[] = [
  { id: 'lst_s1', side: 'SELL', ticker: 'NVTC_ON', companyName: 'NovaTech Soluções', units: 150, pricePerUnit: 11.30, total: 1695, quoteCurrency: 'BRL', userId: 'usr_07', userName: 'João P.', userAvatar: 'JP', createdAt: '2026-05-01 15:00', expiresAt: '2026-05-08 15:00', status: 'OPEN', description: 'Vendendo para rebalancear portfólio. Aceito proposta.' },
  { id: 'lst_s2', side: 'SELL', ticker: 'NVTC_ON', companyName: 'NovaTech Soluções', units: 80, pricePerUnit: 11.50, total: 920, quoteCurrency: 'BRL', userId: 'usr_08', userName: 'Fernanda G.', userAvatar: 'FG', createdAt: '2026-05-01 14:00', expiresAt: '2026-05-15 14:00', status: 'OPEN' },
  { id: 'lst_s3', side: 'SELL', ticker: 'ENBR_PN', companyName: 'EnergyBR Renováveis', units: 200, pricePerUnit: 27.00, total: 5400, quoteCurrency: 'BRL', userId: 'usr_09', userName: 'Roberto M.', userAvatar: 'RM', createdAt: '2026-05-01 12:30', expiresAt: '2026-05-10 12:30', status: 'OPEN', description: 'Preciso de liquidez. Negociável.' },
  { id: 'lst_s4', side: 'SELL', ticker: 'AGRP_DEBT', companyName: 'AgroPrime', units: 50, pricePerUnit: 101.00, total: 5050, quoteCurrency: 'USDC', userId: 'usr_10', userName: 'Camila A.', userAvatar: 'CA', createdAt: '2026-04-30 17:00', expiresAt: '2026-05-07 17:00', status: 'OPEN' },
  { id: 'lst_s5', side: 'SELL', ticker: 'FNLP_CONV', companyName: 'FinLeap', units: 30, pricePerUnit: 74.50, total: 2235, quoteCurrency: 'BRL', userId: 'usr_11', userName: 'Diego N.', userAvatar: 'DN', createdAt: '2026-04-30 09:45', expiresAt: '2026-05-14 09:45', status: 'OPEN', description: 'Nota conversível com desconto. Oportunidade!' },
];

export const mockBuyOrders: SecondaryOrder[] = [
  { id: 'lst_b1', side: 'BUY', ticker: 'NVTC_ON', companyName: 'NovaTech Soluções', units: 100, pricePerUnit: 11.00, total: 1100, quoteCurrency: 'BRL', userId: 'usr_02', userName: 'Ana M.', userAvatar: 'AM', createdAt: '2026-05-01 14:30', expiresAt: '2026-05-08 14:30', status: 'OPEN', description: 'Procuro lote de até 100 unidades.' },
  { id: 'lst_b2', side: 'BUY', ticker: 'NVTC_ON', companyName: 'NovaTech Soluções', units: 250, pricePerUnit: 10.80, total: 2700, quoteCurrency: 'BRL', userId: 'usr_03', userName: 'Carlos R.', userAvatar: 'CR', createdAt: '2026-05-01 13:15', expiresAt: '2026-05-10 13:15', status: 'OPEN' },
  { id: 'lst_b3', side: 'BUY', ticker: 'ENBR_PN', companyName: 'EnergyBR Renováveis', units: 100, pricePerUnit: 25.50, total: 2550, quoteCurrency: 'USDC', userId: 'usr_04', userName: 'Lucia F.', userAvatar: 'LF', createdAt: '2026-05-01 11:00', expiresAt: '2026-05-08 11:00', status: 'OPEN', description: 'Aceito parcelamento em USDC.' },
  { id: 'lst_b4', side: 'BUY', ticker: 'AGRP_DEBT', companyName: 'AgroPrime', units: 20, pricePerUnit: 100.00, total: 2000, quoteCurrency: 'BRL', userId: 'usr_05', userName: 'Pedro S.', userAvatar: 'PS', createdAt: '2026-04-30 16:45', expiresAt: '2026-05-07 16:45', status: 'OPEN' },
];

export const mockTrades: Trade[] = [
  { id: 'trd_01', ticker: 'NVTC_ON', side: 'BUY', units: 100, pricePerUnit: 11.10, total: 1110, quoteCurrency: 'BRL', buyerName: 'Gabriel O.', sellerName: 'João P.', makerFee: 5.55, takerFee: 11.10, platformGasCost: 0.12, createdAt: '2026-05-01 10:30' },
  { id: 'trd_02', ticker: 'ENBR_PN', side: 'SELL', units: 50, pricePerUnit: 26.00, total: 1300, quoteCurrency: 'BRL', buyerName: 'Ana M.', sellerName: 'Gabriel O.', makerFee: 6.50, takerFee: 13.00, platformGasCost: 0.15, createdAt: '2026-04-30 15:45' },
  { id: 'trd_03', ticker: 'NVTC_ON', side: 'BUY', units: 200, pricePerUnit: 10.80, total: 2160, quoteCurrency: 'USDC', buyerName: 'Pedro S.', sellerName: 'Fernanda G.', makerFee: 10.80, takerFee: 21.60, platformGasCost: 0.11, createdAt: '2026-04-29 11:20' },
  { id: 'trd_04', ticker: 'AGRP_DEBT', side: 'SELL', units: 30, pricePerUnit: 101.50, total: 3045, quoteCurrency: 'BRL', buyerName: 'Lucia F.', sellerName: 'Roberto M.', makerFee: 15.23, takerFee: 30.45, platformGasCost: 0.14, createdAt: '2026-04-28 09:00' },
  { id: 'trd_05', ticker: 'FNLP_CONV', side: 'BUY', units: 25, pricePerUnit: 74.00, total: 1850, quoteCurrency: 'BRL', buyerName: 'Carlos R.', sellerName: 'Diego N.', makerFee: 9.25, takerFee: 18.50, platformGasCost: 0.13, createdAt: '2026-04-27 14:10' },
];

/* ── Activity Timeline ── */
export const mockActivities: Activity[] = [
  {
    id: 'act_01',
    type: 'investment',
    title: 'Investimento confirmado',
    description: 'NovaTech Soluções ON — 500 tokens',
    amount: 5000,
    date: '2026-05-01 10:30',
    status: 'success',
  },
  {
    id: 'act_02',
    type: 'dividend',
    title: 'Dividendo recebido',
    description: 'EnergyBR Renováveis PN — Distribuição trimestral',
    amount: 180,
    date: '2026-04-28 08:00',
    status: 'success',
  },
  {
    id: 'act_03',
    type: 'order_created',
    title: 'Ordem de venda criada',
    description: '50 units ENBR_PN @ R$ 26,50',
    date: '2026-04-27 16:20',
    status: 'pending',
  },
  {
    id: 'act_04',
    type: 'order_filled',
    title: 'Ordem executada',
    description: 'Compra de 100 NVTC_ON @ R$ 11,10 — Trade #trd_01',
    amount: 1110,
    date: '2026-04-25 11:45',
    status: 'success',
  },
  {
    id: 'act_05',
    type: 'kyc_approved',
    title: 'KYC Aprovado',
    description: 'Documentação verificada — conta ativa',
    date: '2026-01-16 09:00',
    status: 'info',
  },
  {
    id: 'act_06',
    type: 'deposit',
    title: 'Depósito via Pix',
    description: 'Crédito na conta KASE',
    amount: 10000,
    date: '2026-01-15 14:30',
    status: 'success',
  },
];

/* ── Available Tokens for Market ── */
export const availableTokens = [
  { ticker: 'NVTC_ON', companyName: 'NovaTech Soluções', assetType: 'ON' as AssetType, lastPrice: 11.20, quoteCurrencies: ['BRL', 'USDC'] as QuoteCurrency[] },
  { ticker: 'ENBR_PN', companyName: 'EnergyBR Renováveis', assetType: 'PN' as AssetType, lastPrice: 26.50, quoteCurrencies: ['BRL', 'USDC', 'BRZ'] as QuoteCurrency[] },
  { ticker: 'AGRP_DEBT', companyName: 'AgroPrime', assetType: 'DEBT' as AssetType, lastPrice: 102.00, quoteCurrencies: ['BRL'] as QuoteCurrency[] },
  { ticker: 'FNLP_CONV', companyName: 'FinLeap', assetType: 'CONV' as AssetType, lastPrice: 73.20, quoteCurrencies: ['BRL', 'USDC'] as QuoteCurrency[] },
  { ticker: 'MFLW_REC', companyName: 'MedFlow Saúde', assetType: 'REC' as AssetType, lastPrice: 50.00, quoteCurrencies: ['BRL', 'BRZ'] as QuoteCurrency[] },
];

/* ── Currency symbols ── */
export const currencySymbols: Record<QuoteCurrency, string> = {
  BRL: 'R$',
  USDC: '$',
  BRZ: 'R$',
};

export function formatCurrencyValue(value: number, currency: QuoteCurrency): string {
  if (currency === 'USDC') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/* ── Helper: Format currency ── */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/* ── Helper: Format percent ── */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/* ── Helper: Format number ── */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
