/* ========================================
   KASE Services — Data Access Layer
   Uses mock data when Supabase is not configured,
   switches to real DB when credentials are provided
   ======================================== */

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  mockUser, mockPortfolio, mockPortfolioSummary,
  mockOfferings, mockBuyOrders, mockSellOrders,
  mockTrades, mockActivities, availableTokens,
  platformFees, formatCurrency,
  type PortfolioAsset, type Offering, type SecondaryOrder,
  type Trade, type Activity,
} from '@/lib/mock-data';
import type { DbUser, DbOffering, DbSecondaryOrder } from '@/types/database';

/* ── Auth Service ── */
export const authService = {
  async getCurrentUser() {
    if (!isSupabaseConfigured()) {
      return mockUser;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured()) {
      window.location.href = '/';
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/';
  },
};

/* ── Portfolio Service ── */
export const portfolioService = {
  async getPortfolio(userId?: string) {
    if (!isSupabaseConfigured()) {
      return {
        assets: mockPortfolio,
        summary: mockPortfolioSummary,
      };
    }

    // Real implementation: query investments + current prices
    const { data: investments } = await supabase
      .from('investments')
      .select('*, offerings(*)')
      .eq('user_id', userId!)
      .eq('status', 'CONFIRMED');

    return {
      assets: investments || [],
      summary: mockPortfolioSummary, // TODO: calculate from real data
    };
  },
};

/* ── Offerings Service ── */
export const offeringsService = {
  async getActiveOfferings(): Promise<Offering[]> {
    if (!isSupabaseConfigured()) {
      return mockOfferings.filter(o => o.status === 'ACTIVE');
    }

    const { data } = await supabase
      .from('offerings')
      .select('*, companies(*)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    return (data || []) as unknown as Offering[];
  },

  async getAllOfferings(): Promise<Offering[]> {
    if (!isSupabaseConfigured()) {
      return mockOfferings;
    }

    const { data } = await supabase
      .from('offerings')
      .select('*, companies(*)')
      .in('status', ['ACTIVE', 'FUNDED', 'CLOSED'])
      .order('created_at', { ascending: false });

    return (data || []) as unknown as Offering[];
  },

  async getOfferingById(id: string): Promise<Offering | null> {
    if (!isSupabaseConfigured()) {
      return mockOfferings.find(o => o.id === id) || null;
    }

    const { data } = await supabase
      .from('offerings')
      .select('*, companies(*), offering_documents(*)')
      .eq('id', id)
      .single();

    return data as unknown as Offering;
  },

  async getOfferingParities(offeringId: string) {
    if (!isSupabaseConfigured()) {
      const token = availableTokens.find(t => t.ticker === offeringId);
      return token?.quoteCurrencies || ['BRL'];
    }

    const { data } = await supabase
      .from('asset_parities')
      .select('*')
      .eq('offering_id', offeringId)
      .eq('is_active', true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((p: any) => p.quote_asset_code);
  },
};

/* ── Marketplace Service (Secondary Market — Classificados) ── */
export const marketplaceService = {
  async getListings(filters?: {
    side?: 'SELL' | 'BUY';
    ticker?: string;
    status?: string;
  }): Promise<SecondaryOrder[]> {
    if (!isSupabaseConfigured()) {
      let listings = [...mockSellOrders, ...mockBuyOrders].filter(o => o.status === 'OPEN');
      if (filters?.side) listings = listings.filter(o => o.side === filters.side);
      if (filters?.ticker) listings = listings.filter(o => o.ticker === filters.ticker);
      return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    let query = supabase
      .from('secondary_orders')
      .select('*, users(name, avatar_url), offerings(token_code, companies(name))')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });

    if (filters?.side) query = query.eq('side', filters.side);

    const { data } = await query;
    return (data || []) as unknown as SecondaryOrder[];
  },

  async getUserOrders(userId: string): Promise<SecondaryOrder[]> {
    if (!isSupabaseConfigured()) {
      return [...mockSellOrders, ...mockBuyOrders].filter(
        o => o.userId === 'usr_01' // mock current user
      );
    }

    const { data } = await supabase
      .from('secondary_orders')
      .select('*, offerings(token_code, companies(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data || []) as unknown as SecondaryOrder[];
  },

  async createListing(order: {
    offeringId: string;
    side: 'SELL' | 'BUY';
    units: number;
    pricePerUnit: number;
    quoteCurrency: string;
    description?: string;
    expiresInDays?: number;
  }) {
    if (!isSupabaseConfigured()) {
      console.log('[MOCK] Creating listing:', order);
      return { success: true, id: 'mock_order_' + Date.now() };
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (order.expiresInDays || 7));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('secondary_orders')
      .insert({
        user_id: user.user.id,
        offering_id: order.offeringId,
        side: order.side,
        units: order.units,
        price_per_unit: order.pricePerUnit,
        quote_currency: order.quoteCurrency,
        description: order.description || null,
        status: 'OPEN',
        expires_at: expiresAt.toISOString(),
      } as any)
      .select()
      .single());

    if (error) throw error;
    return { success: true, id: (data as any)?.id };
  },

  async acceptListing(orderId: string) {
    if (!isSupabaseConfigured()) {
      console.log('[MOCK] Accepting listing:', orderId);
      return { success: true, tradeId: 'mock_trade_' + Date.now() };
    }

    // In real implementation:
    // 1. Verify both parties KYC status
    // 2. Verify CVM 88 limits
    // 3. Create the trade record
    // 4. Build Stellar transaction (swap tokens)
    // 5. Wrap in fee-bump (platform pays gas)
    // 6. Submit to network
    // 7. Update order status + create activity log

    throw new Error('Real implementation requires Stellar integration — coming in Phase 3');
  },

  async cancelListing(orderId: string) {
    if (!isSupabaseConfigured()) {
      console.log('[MOCK] Cancelling listing:', orderId);
      return { success: true };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('secondary_orders')
      .update({ status: 'CANCELLED' })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  },

  getFeeInfo() {
    return platformFees;
  },
};

/* ── Trades Service ── */
export const tradesService = {
  async getUserTrades(userId?: string): Promise<Trade[]> {
    if (!isSupabaseConfigured()) {
      return mockTrades;
    }

    const { data } = await supabase
      .from('secondary_trades')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    return (data || []) as unknown as Trade[];
  },
};

/* ── Activity Service ── */
export const activityService = {
  async getUserActivities(userId?: string, limit = 10): Promise<Activity[]> {
    if (!isSupabaseConfigured()) {
      return mockActivities.slice(0, limit);
    }

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []) as unknown as Activity[];
  },
};

/* ── Notifications Service ── */
export const notificationsService = {
  async getUnread(userId?: string) {
    if (!isSupabaseConfigured()) {
      return {
        count: 3,
        notifications: [
          { id: 'n1', title: 'Nova oferta disponível', body: 'NovaTech Soluções abriu captação', type: 'INFO' as const, read: false, created_at: '2026-05-01' },
          { id: 'n2', title: 'Ordem aceita', body: 'Sua venda de ENBR_PN foi aceita', type: 'SUCCESS' as const, read: false, created_at: '2026-04-30' },
          { id: 'n3', title: 'KYC em análise', body: 'Documentação recebida, aguarde aprovação', type: 'WARNING' as const, read: false, created_at: '2026-04-28' },
        ],
      };
    }

    const { data, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId!)
      .eq('read', false)
      .order('created_at', { ascending: false });

    return { count: count || 0, notifications: data || [] };
  },

  async markAsRead(notificationId: string) {
    if (!isSupabaseConfigured()) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  },
};
