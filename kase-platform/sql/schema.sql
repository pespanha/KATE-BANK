-- ========================================
-- KASE — Kate Assets Stellar Exchange
-- Supabase Database Schema (PostgreSQL)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    cpf_cnpj TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    type TEXT NOT NULL DEFAULT 'PF' CHECK (type IN ('PF', 'PJ', 'QUALIFICADO')),
    kyc_data JSONB,
    kyc_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    stellar_address TEXT,
    passkey_credential_id TEXT,
    annual_income DECIMAL(15,2) DEFAULT 0,
    investment_limit DECIMAL(15,2) DEFAULT 20000,
    total_invested DECIMAL(15,2) DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Companies (Issuers) ──
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    legal_docs JSONB,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED')),
    admin_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Offerings (Primary Market) ──
CREATE TABLE offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('ON', 'PN', 'DEBT', 'CONVERTIBLE', 'RECEIVABLE')),
    token_code TEXT NOT NULL,
    stellar_issuer_address TEXT,
    total_amount DECIMAL(15,2) NOT NULL,
    raised_amount DECIMAL(15,2) DEFAULT 0,
    min_goal DECIMAL(15,2) NOT NULL,
    additional_lot DECIMAL(15,2),
    unit_price DECIMAL(15,4) NOT NULL,
    total_units INTEGER NOT NULL,
    min_investment DECIMAL(15,2) DEFAULT 100,
    investor_count INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'FUNDED', 'FAILED', 'CLOSED')),
    sector TEXT,
    highlights TEXT[],
    terms JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Offering Documents (Data Room) ──
CREATE TABLE offering_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'OTHER' CHECK (category IN ('LEGAL', 'FINANCIAL', 'PITCH', 'OTHER')),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ── Investments (Primary Market) ──
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    offering_id UUID NOT NULL REFERENCES offerings(id),
    amount DECIMAL(15,2) NOT NULL,
    units INTEGER NOT NULL,
    stellar_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REFUNDED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Asset Parities (Marketplace — which currencies each asset can be traded in) ──
CREATE TABLE asset_parities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    quote_asset_code TEXT NOT NULL CHECK (quote_asset_code IN ('BRL', 'USDC', 'BRZ')),
    stellar_asset_code TEXT,
    stellar_issuer TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(offering_id, quote_asset_code)
);

-- ── Secondary Orders (Marketplace — Classificados) ──
CREATE TABLE secondary_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    offering_id UUID NOT NULL REFERENCES offerings(id),
    side TEXT NOT NULL CHECK (side IN ('SELL', 'BUY')),
    units INTEGER NOT NULL CHECK (units > 0),
    price_per_unit DECIMAL(15,4) NOT NULL CHECK (price_per_unit > 0),
    quote_currency TEXT NOT NULL DEFAULT 'BRL' CHECK (quote_currency IN ('BRL', 'USDC', 'BRZ')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FILLED', 'CANCELLED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- ── Secondary Trades ──
CREATE TABLE secondary_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buy_order_id UUID NOT NULL REFERENCES secondary_orders(id),
    sell_order_id UUID NOT NULL REFERENCES secondary_orders(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    offering_id UUID NOT NULL REFERENCES offerings(id),
    units INTEGER NOT NULL,
    price_per_unit DECIMAL(15,4) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    quote_currency TEXT NOT NULL DEFAULT 'BRL' CHECK (quote_currency IN ('BRL', 'USDC', 'BRZ')),
    maker_fee DECIMAL(15,4) DEFAULT 0,
    taker_fee DECIMAL(15,4) DEFAULT 0,
    platform_gas_cost DECIMAL(15,8) DEFAULT 0,
    stellar_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Transaction Fees ──
CREATE TABLE transaction_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES secondary_trades(id),
    fee_type TEXT NOT NULL CHECK (fee_type IN ('MAKER', 'TAKER', 'PLATFORM')),
    amount DECIMAL(15,4) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('BRL', 'USDC', 'BRZ')),
    stellar_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Fee Account Balance (Platform gas wallet) ──
CREATE TABLE fee_account_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    xlm_balance DECIMAL(20,7) NOT NULL DEFAULT 0,
    last_refill_at TIMESTAMPTZ,
    alert_threshold DECIMAL(20,7) DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Activity Log ──
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15,2),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Notifications ──
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf_cnpj);
CREATE INDEX idx_users_stellar ON users(stellar_address);

CREATE INDEX idx_offerings_company ON offerings(company_id);
CREATE INDEX idx_offerings_status ON offerings(status);
CREATE INDEX idx_offerings_asset_type ON offerings(asset_type);

CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_offering ON investments(offering_id);

CREATE INDEX idx_secondary_orders_user ON secondary_orders(user_id);
CREATE INDEX idx_secondary_orders_offering ON secondary_orders(offering_id);
CREATE INDEX idx_secondary_orders_status ON secondary_orders(status);
CREATE INDEX idx_secondary_orders_side ON secondary_orders(side);

CREATE INDEX idx_secondary_trades_buyer ON secondary_trades(buyer_id);
CREATE INDEX idx_secondary_trades_seller ON secondary_trades(seller_id);
CREATE INDEX idx_secondary_trades_offering ON secondary_trades(offering_id);

CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offering_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_parities ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, public profiles for marketplace
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Offerings: public read, admin write
CREATE POLICY "Anyone can read active offerings" ON offerings FOR SELECT USING (status IN ('ACTIVE', 'FUNDED', 'CLOSED'));
CREATE POLICY "Offering documents are public for active offerings" ON offering_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM offerings WHERE offerings.id = offering_documents.offering_id AND offerings.status IN ('ACTIVE', 'FUNDED', 'CLOSED'))
);

-- Investments: users can read own investments
CREATE POLICY "Users can read own investments" ON investments FOR SELECT USING (auth.uid() = user_id);

-- Asset Parities: public read
CREATE POLICY "Anyone can read asset parities" ON asset_parities FOR SELECT USING (is_active = true);

-- Secondary Orders: public read for open orders, own orders always visible
CREATE POLICY "Anyone can read open orders" ON secondary_orders FOR SELECT USING (status = 'OPEN');
CREATE POLICY "Users can read own orders" ON secondary_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON secondary_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own orders" ON secondary_orders FOR UPDATE USING (auth.uid() = user_id);

-- Trades: users can read own trades
CREATE POLICY "Users can read own trades as buyer" ON secondary_trades FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can read own trades as seller" ON secondary_trades FOR SELECT USING (auth.uid() = seller_id);

-- Activities: users can read own activities
CREATE POLICY "Users can read own activities" ON activities FOR SELECT USING (auth.uid() = user_id);

-- Notifications: users can read/update own notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER offerings_updated_at BEFORE UPDATE ON offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-expire orders past their expiration date
CREATE OR REPLACE FUNCTION expire_old_orders()
RETURNS void AS $$
BEGIN
    UPDATE secondary_orders
    SET status = 'EXPIRED'
    WHERE status = 'OPEN' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Update offering raised_amount and investor_count on new investment
CREATE OR REPLACE FUNCTION update_offering_on_investment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CONFIRMED' THEN
        UPDATE offerings
        SET
            raised_amount = raised_amount + NEW.amount,
            investor_count = investor_count + 1
        WHERE id = NEW.offering_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investment_confirmed
    AFTER INSERT OR UPDATE ON investments
    FOR EACH ROW
    WHEN (NEW.status = 'CONFIRMED')
    EXECUTE FUNCTION update_offering_on_investment();

-- Update user total_invested on confirmed investment
CREATE OR REPLACE FUNCTION update_user_total_invested()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CONFIRMED' THEN
        UPDATE users
        SET total_invested = total_invested + NEW.amount
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_investment_confirmed
    AFTER INSERT OR UPDATE ON investments
    FOR EACH ROW
    WHEN (NEW.status = 'CONFIRMED')
    EXECUTE FUNCTION update_user_total_invested();
