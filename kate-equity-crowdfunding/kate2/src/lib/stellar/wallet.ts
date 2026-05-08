import * as StellarSdk from '@stellar/stellar-sdk'
import prisma from '@/lib/prisma'
import { createStellarClient } from './client'
import type { StellarEnv } from './client'

/**
 * Generate a Stellar keypair and persist the public key to the Wallet table
 */
export async function createWalletForUser(
  userId: string,
  env: StellarEnv
): Promise<{ publicKey: string; secretKey: string }> {
  const stellarClient = createStellarClient(env)
  const keypair = stellarClient instanceof Object && 'generateKeypair' in Object.getPrototypeOf(stellarClient)
    ? (stellarClient as any).constructor.generateKeypair()
    : StellarSdk.Keypair.random().publicKey()

  // For simulated, use SimulatedStellarClient.generateKeypair via factory
  const { StellarClient, SimulatedStellarClient } = await import('./client')
  const kp = env.STELLAR_KATE_SECRET_KEY && env.STELLAR_SIMULATION_MODE !== 'true'
    ? StellarClient.generateKeypair()
    : SimulatedStellarClient.generateKeypair()

  await prisma.wallet.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      stellar_public_key: kp.publicKey,
      custody_type: 'custodial',
      key_provider: env.STELLAR_SIMULATION_MODE === 'true' ? 'simulated' : 'kate_custody',
      status: 'active',
    },
    update: {
      stellar_public_key: kp.publicKey,
      status: 'active',
    },
  })

  // NOTE: secretKey should be encrypted and stored in a secure vault in production
  // For now, we return it once so the client can store it (or we custody it server-side)
  return kp
}

/**
 * Get a user's Stellar public key from the database
 */
export async function getUserPublicKey(userId: string): Promise<string | null> {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId },
    select: { stellar_public_key: true },
  })
  return wallet?.stellar_public_key ?? null
}

/**
 * Check if user has a wallet
 */
export async function hasWallet(userId: string): Promise<boolean> {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId },
    select: { id: true },
  })
  return !!wallet
}
