/* ========================================
   KASE API — Stellar Relay Service
   POST /api/stellar/relay — Fee-bump transaction relay
   
   This endpoint receives a signed inner transaction from
   a user's smart wallet, wraps it in a fee-bump transaction
   (platform pays gas), and submits to the Stellar network.
   ======================================== */

import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  stellarConfig,
  buildFeeBumpTransaction,
  submitTransaction,
  isStellarConfigured,
} from '@/lib/stellar';

export async function POST(request: NextRequest) {
  try {
    // Check Stellar configuration
    if (!isStellarConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stellar not configured. Set STELLAR_PLATFORM_ACCOUNT_ID and STELLAR_PLATFORM_SECRET_KEY.',
          mock: true,
          message: 'In mock mode, transaction relay is simulated.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { signedTxXdr } = body;

    if (!signedTxXdr) {
      return NextResponse.json(
        { success: false, error: 'Missing signedTxXdr in request body' },
        { status: 400 }
      );
    }

    // 1. Decode the inner transaction
    const innerTx = StellarSdk.TransactionBuilder.fromXDR(
      signedTxXdr,
      stellarConfig.networkPassphrase
    );

    if (!(innerTx instanceof StellarSdk.Transaction)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction: must be a regular Transaction, not FeeBumpTransaction' },
        { status: 400 }
      );
    }

    // 2. Load platform keypair for fee-bump signing
    const platformSecret = process.env.STELLAR_PLATFORM_SECRET_KEY!;
    const platformKeypair = StellarSdk.Keypair.fromSecret(platformSecret);

    // 3. Verify platform account has sufficient XLM balance
    // (In production: check balance, alert if low, rate limit)

    // 4. Build fee-bump transaction (platform pays gas)
    const maxGas = process.env.STELLAR_MAX_GAS_STROOPS || '1000000';
    const feeBumpTx = buildFeeBumpTransaction(innerTx, platformKeypair, maxGas);

    // 5. Submit to Stellar network
    const response = await submitTransaction(feeBumpTx);

    // 6. Log the gas cost for accounting
    const gasCost = Number(feeBumpTx.fee) / 10000000; // Convert stroops to XLM
    console.log(`[Relay] TX submitted: hash=${response.hash}, gas=${gasCost} XLM`);

    return NextResponse.json({
      success: true,
      data: {
        hash: response.hash,
        ledger: response.ledger,
        gasCostXlm: gasCost,
        paidBy: 'KASE Platform',
      },
    });
  } catch (error) {
    console.error('[API] POST /api/stellar/relay error:', error);

    const message = error instanceof Error ? error.message : 'Transaction relay failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
