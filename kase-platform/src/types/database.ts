/* ========================================
   KASE Database Types — Supabase Schema
   ======================================== */

/* ── Enums ── */
export type UserType = 'PF' | 'PJ' | 'QUALIFICADO';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AssetType = 'ON' | 'PN' | 'DEBT' | 'CONVERTIBLE' | 'RECEIVABLE';
export type OfferingStatus = 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'FAILED' | 'CLOSED';
export type InvestmentStatus = 'PENDING' | 'CONFIRMED' | 'REFUNDED';
export type OrderSide = 'SELL' | 'BUY';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
export type TradeStatus = 'PENDING' | 'SETTLED' | 'FAILED';
export type DocumentCategory = 'LEGAL' | 'FINANCIAL' | 'PITCH' | 'OTHER';
export type QuoteCurrency = 'BRL' | 'USDC' | 'BRZ';
export type FeeType = 'MAKER' | 'TAKER' | 'PLATFORM';

/* ── Users ── */
export interface DbUser {
  id: string;
  email: string;
  cpf_cnpj: string;
  name: string;
  phone: string;
  type: UserType;
  kyc_data: Record<string, unknown> | null;
  kyc_status: KycStatus;
  stellar_address: string | null;
  passkey_credential_id: string | null;
  annual_income: number;
  investment_limit: number;
  total_invested: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Companies (Issuers) ── */
export interface DbCompany {
  id: string;
  cnpj: string;
  name: string;
  description: string;
  logo_url: string | null;
  legal_docs: Record<string, unknown> | null;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Offerings (Primary Market) ── */
export interface DbOffering {
  id: string;
  company_id: string;
  asset_type: AssetType;
  token_code: string;
  stellar_issuer_address: string | null;
  total_amount: number;
  raised_amount: number;
  min_goal: number;
  additional_lot: number | null;
  unit_price: number;
  total_units: number;
  min_investment: number;
  investor_count: number;
  start_date: string;
  end_date: string;
  status: OfferingStatus;
  sector: string;
  highlights: string[];
  terms: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/* ── Offering Documents (Data Room) ── */
export interface DbOfferingDocument {
  id: string;
  offering_id: string;
  name: string;
  file_url: string;
  file_size: number;
  category: DocumentCategory;
  uploaded_at: string;
}

/* ── Investments (Primary Market) ── */
export interface DbInvestment {
  id: string;
  user_id: string;
  offering_id: string;
  amount: number;
  units: number;
  stellar_tx_hash: string | null;
  status: InvestmentStatus;
  created_at: string;
}

/* ── Asset Parities (Marketplace) ── */
export interface DbAssetParity {
  id: string;
  offering_id: string;
  quote_asset_code: QuoteCurrency;
  stellar_asset_code: string | null;
  stellar_issuer: string | null;
  is_active: boolean;
  created_at: string;
}

/* ── Secondary Orders (Marketplace — Classificados) ── */
export interface DbSecondaryOrder {
  id: string;
  user_id: string;
  offering_id: string;
  side: OrderSide;
  units: number;
  price_per_unit: number;
  quote_currency: QuoteCurrency;
  description: string | null;
  status: OrderStatus;
  created_at: string;
  expires_at: string;
}

/* ── Secondary Trades ── */
export interface DbSecondaryTrade {
  id: string;
  buy_order_id: string;
  sell_order_id: string;
  buyer_id: string;
  seller_id: string;
  offering_id: string;
  units: number;
  price_per_unit: number;
  total_amount: number;
  quote_currency: QuoteCurrency;
  maker_fee: number;
  taker_fee: number;
  platform_gas_cost: number;
  stellar_tx_hash: string | null;
  status: TradeStatus;
  created_at: string;
}

/* ── Transaction Fees ── */
export interface DbTransactionFee {
  id: string;
  trade_id: string;
  fee_type: FeeType;
  amount: number;
  currency: QuoteCurrency;
  stellar_tx_hash: string | null;
  created_at: string;
}

/* ── Fee Account Balance ── */
export interface DbFeeAccountBalance {
  id: string;
  xlm_balance: number;
  last_refill_at: string | null;
  alert_threshold: number;
  updated_at: string;
}

/* ── Activity Log ── */
export interface DbActivity {
  id: string;
  user_id: string;
  type: 'INVESTMENT' | 'DIVIDEND' | 'ORDER_CREATED' | 'ORDER_FILLED' | 'ORDER_CANCELLED' |
        'KYC_APPROVED' | 'KYC_REJECTED' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_SETTLED';
  title: string;
  description: string;
  amount: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/* ── Notifications ── */
export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  action_url: string | null;
  created_at: string;
}

/* ── Supabase Database Schema (for client typing) ── */
export interface Database {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Omit<DbUser, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DbUser, 'id'>> };
      companies: { Row: DbCompany; Insert: Omit<DbCompany, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DbCompany, 'id'>> };
      offerings: { Row: DbOffering; Insert: Omit<DbOffering, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<DbOffering, 'id'>> };
      offering_documents: { Row: DbOfferingDocument; Insert: Omit<DbOfferingDocument, 'id' | 'uploaded_at'>; Update: Partial<Omit<DbOfferingDocument, 'id'>> };
      investments: { Row: DbInvestment; Insert: Omit<DbInvestment, 'id' | 'created_at'>; Update: Partial<Omit<DbInvestment, 'id'>> };
      asset_parities: { Row: DbAssetParity; Insert: Omit<DbAssetParity, 'id' | 'created_at'>; Update: Partial<Omit<DbAssetParity, 'id'>> };
      secondary_orders: { Row: DbSecondaryOrder; Insert: Omit<DbSecondaryOrder, 'id' | 'created_at'>; Update: Partial<Omit<DbSecondaryOrder, 'id'>> };
      secondary_trades: { Row: DbSecondaryTrade; Insert: Omit<DbSecondaryTrade, 'id' | 'created_at'>; Update: Partial<Omit<DbSecondaryTrade, 'id'>> };
      transaction_fees: { Row: DbTransactionFee; Insert: Omit<DbTransactionFee, 'id' | 'created_at'>; Update: Partial<Omit<DbTransactionFee, 'id'>> };
      fee_account_balance: { Row: DbFeeAccountBalance; Insert: Omit<DbFeeAccountBalance, 'id' | 'updated_at'>; Update: Partial<Omit<DbFeeAccountBalance, 'id'>> };
      activities: { Row: DbActivity; Insert: Omit<DbActivity, 'id' | 'created_at'>; Update: Partial<Omit<DbActivity, 'id'>> };
      notifications: { Row: DbNotification; Insert: Omit<DbNotification, 'id' | 'created_at'>; Update: Partial<Omit<DbNotification, 'id'>> };
    };
  };
}
