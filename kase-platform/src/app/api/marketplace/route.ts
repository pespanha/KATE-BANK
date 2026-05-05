/* ========================================
   KASE API — Marketplace (Classificados) Endpoint
   GET  /api/marketplace — list open listings
   POST /api/marketplace — create new listing
   ======================================== */

import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side') as 'SELL' | 'BUY' | null;
    const ticker = searchParams.get('ticker');

    const listings = await marketplaceService.getListings({
      side: side || undefined,
      ticker: ticker || undefined,
    });

    return NextResponse.json({
      success: true,
      data: listings,
      count: listings.length,
      fees: marketplaceService.getFeeInfo(),
    });
  } catch (error) {
    console.error('[API] GET /api/marketplace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { offeringId, side, units, pricePerUnit, quoteCurrency, description, expiresInDays } = body;

    // Validation
    if (!offeringId || !side || !units || !pricePerUnit) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: offeringId, side, units, pricePerUnit' },
        { status: 400 }
      );
    }

    if (!['SELL', 'BUY'].includes(side)) {
      return NextResponse.json(
        { success: false, error: 'Invalid side. Must be SELL or BUY' },
        { status: 400 }
      );
    }

    if (units <= 0 || pricePerUnit <= 0) {
      return NextResponse.json(
        { success: false, error: 'Units and price must be positive' },
        { status: 400 }
      );
    }

    const result = await marketplaceService.createListing({
      offeringId,
      side,
      units: Number(units),
      pricePerUnit: Number(pricePerUnit),
      quoteCurrency: quoteCurrency || 'BRL',
      description,
      expiresInDays: expiresInDays || 7,
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/marketplace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
