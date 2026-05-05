/* ========================================
   KASE API — Offerings Endpoint
   GET /api/offerings — list all offerings
   GET /api/offerings?status=ACTIVE — filter by status
   ======================================== */

import { NextRequest, NextResponse } from 'next/server';
import { offeringsService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let offerings;

    if (status === 'ACTIVE') {
      offerings = await offeringsService.getActiveOfferings();
    } else {
      offerings = await offeringsService.getAllOfferings();
    }

    return NextResponse.json({
      success: true,
      data: offerings,
      count: offerings.length,
    });
  } catch (error) {
    console.error('[API] GET /api/offerings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch offerings' },
      { status: 500 }
    );
  }
}
