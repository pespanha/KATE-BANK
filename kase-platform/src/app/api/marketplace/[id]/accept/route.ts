/* ========================================
   KASE API — Marketplace Accept Listing
   POST /api/marketplace/[id]/accept — accept a listing
   ======================================== */

import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await marketplaceService.acceptListing(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept listing';
    console.error(`[API] POST /api/marketplace/${(await params).id}/accept error:`, error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
