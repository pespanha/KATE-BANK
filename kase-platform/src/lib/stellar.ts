/* ========================================
   KASE Stellar SDK Integration Layer
   ======================================== */

import * as StellarSdk from '@stellar/stellar-sdk';

/* ── Network Configuration ── */
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

export const stellarConfig = {
  network: NETWORK as 'testnet' | 'mainnet',
  horizonUrl: NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: NETWORK === 'mainnet'
    ? 'https://soroban-rpc.mainnet.stellar.gateway.fm'
    : 'https://soroban-testnet.stellar.org',
  networkPassphrase: NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET,
  platformAccountId: process.env.STELLAR_PLATFORM_ACCOUNT_ID || '',
};

/* ── Horizon Server ── */
export const horizon = new StellarSdk.Horizon.Server(stellarConfig.horizonUrl);

/* ── Soroban RPC ── */
export const sorobanRpc = new StellarSdk.rpc.Server(stellarConfig.sorobanRpcUrl);

/* ── Asset Helpers ── */

export function createAsset(code: string, issuer: string): StellarSdk.Asset {
  return new StellarSdk.Asset(code, issuer);
}

export function getSacContractId(asset: StellarSdk.Asset): string {
  return asset.contractId(stellarConfig.networkPassphrase);
}

/* ── Account Helpers ── */

export async function loadAccount(publicKey: string) {
  return horizon.loadAccount(publicKey);
}

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await horizon.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}

export async function getXlmBalance(publicKey: string): Promise<string> {
  try {
    const account = await horizon.loadAccount(publicKey);
    const nativeBalance = account.balances.find(
      (b: { asset_type: string }) => b.asset_type === 'native'
    );
    return nativeBalance ? nativeBalance.balance : '0';
  } catch {
    return '0';
  }
}

export async function getTokenBalance(
  publicKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<string> {
  try {
    const account = await horizon.loadAccount(publicKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenBalance = account.balances.find((b: any) =>
      b.asset_type !== 'native' &&
      b.asset_code === assetCode &&
      b.asset_issuer === assetIssuer
    );
    return tokenBalance ? tokenBalance.balance : '0';
  } catch {
    return '0';
  }
}

/* ── Issuer Account Operations ── */

/**
 * Configure compliance flags on an issuer account
 * AUTH_REQUIRED + AUTH_REVOCABLE + AUTH_CLAWBACK_ENABLED
 */
export function buildSetOptionsOp() {
  return StellarSdk.Operation.setOptions({
    setFlags:
      (StellarSdk.AuthRequiredFlag |
      StellarSdk.AuthRevocableFlag |
      StellarSdk.AuthClawbackEnabledFlag) as StellarSdk.AuthFlag,
  });
}

/**
 * Authorize a trustline for a specific account (KYC-approved investor)
 */
export function buildAuthorizeTrustlineOp(
  trustor: string,
  asset: StellarSdk.Asset
) {
  return StellarSdk.Operation.setTrustLineFlags({
    trustor,
    asset,
    flags: {
      authorized: true,
      authorizedToMaintainLiabilities: false,
    },
  });
}

/**
 * Clawback tokens from an account (regulatory action)
 */
export function buildClawbackOp(
  from: string,
  asset: StellarSdk.Asset,
  amount: string
) {
  return StellarSdk.Operation.clawback({
    from,
    asset,
    amount,
  });
}

/**
 * Build a payment operation to send tokens
 */
export function buildPaymentOp(
  destination: string,
  asset: StellarSdk.Asset,
  amount: string
) {
  return StellarSdk.Operation.payment({
    destination,
    asset,
    amount,
  });
}

/* ── Fee Sponsoring (Fee-Bump Transactions) ── */

/**
 * Wrap a signed inner transaction in a fee-bump transaction
 * The platform account pays the gas on behalf of the user
 */
export function buildFeeBumpTransaction(
  innerTx: StellarSdk.Transaction,
  platformKeypair: StellarSdk.Keypair,
  maxFee: string = '1000000'
): StellarSdk.FeeBumpTransaction {
  const feeBump = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
    platformKeypair,
    maxFee,
    innerTx,
    stellarConfig.networkPassphrase
  );
  feeBump.sign(platformKeypair);
  return feeBump;
}

/**
 * Submit a transaction to the network
 */
export async function submitTransaction(
  tx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction
) {
  return horizon.submitTransaction(tx);
}

/* ── Token Issuance Flow ── */

/**
 * Build the full token issuance operations for a new offering
 */
export async function buildIssueTokenOps(
  issuerPublicKey: string,
  distributionPublicKey: string,
  assetCode: string,
  totalUnits: number
) {
  const asset = createAsset(assetCode, issuerPublicKey);

  return [
    buildSetOptionsOp(),
    StellarSdk.Operation.changeTrust({
      asset,
      source: distributionPublicKey,
    }),
    buildAuthorizeTrustlineOp(distributionPublicKey, asset),
    buildPaymentOp(distributionPublicKey, asset, totalUnits.toString()),
  ];
}

/* ── CVM 88 Limit Helpers ── */

/**
 * Calculate remaining investment limit for a user under CVM 88
 *
 * Rules:
 * - Default limit: R$ 20,000/year
 * - Up to 10% of annual income (previous year)
 * - Unlimited if qualified investor (investidor qualificado)
 */
export function calculateCvm88Limit(
  userType: 'PF' | 'PJ' | 'QUALIFICADO',
  annualIncome: number,
  totalInvestedThisYear: number
): { limit: number; remaining: number; unlimited: boolean } {
  if (userType === 'QUALIFICADO') {
    return { limit: Infinity, remaining: Infinity, unlimited: true };
  }

  const defaultLimit = 20000;
  const incomeLimit = annualIncome * 0.10;
  const effectiveLimit = Math.max(defaultLimit, incomeLimit);

  return {
    limit: effectiveLimit,
    remaining: Math.max(0, effectiveLimit - totalInvestedThisYear),
    unlimited: false,
  };
}

/* ── Configuration Check ── */

export function isStellarConfigured(): boolean {
  return !!(
    process.env.STELLAR_PLATFORM_ACCOUNT_ID &&
    process.env.STELLAR_PLATFORM_SECRET_KEY
  );
}
