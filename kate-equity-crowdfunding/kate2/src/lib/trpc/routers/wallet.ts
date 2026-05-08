import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../init'
import { createWalletForUser, getUserPublicKey, hasWallet } from '@/lib/stellar/wallet'
import { createStellarClient } from '@/lib/stellar/client'

const stellarEnv = {
  STELLAR_KATE_SECRET_KEY: process.env.STELLAR_KATE_SECRET_KEY,
  STELLAR_USE_TESTNET:     process.env.STELLAR_USE_TESTNET ?? 'true',
  STELLAR_SIMULATION_MODE: process.env.STELLAR_SIMULATION_MODE ?? 'true',
}

export const walletRouter = router({
  /** Get current user's wallet info */
  getMyWallet: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await ctx.prisma.wallet.findUnique({
      where: { user_id: ctx.userId },
    })
    if (!wallet) return null

    const client = createStellarClient(stellarEnv)
    const balances = await client.getAllBalances(wallet.stellar_public_key)
    return { ...wallet, balances }
  }),

  /** Check if current user has a wallet */
  hasWallet: protectedProcedure.query(async ({ ctx }) => {
    return hasWallet(ctx.userId)
  }),

  /** Create/activate wallet for current user */
  createWallet: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.prisma.wallet.findUnique({
      where: { user_id: ctx.userId },
    })
    if (existing) return { publicKey: existing.stellar_public_key, alreadyExisted: true }

    const { publicKey } = await createWalletForUser(ctx.userId, stellarEnv)

    // On testnet/simulation: fund with Friendbot
    if (stellarEnv.STELLAR_USE_TESTNET !== 'false') {
      const client = createStellarClient(stellarEnv)
      await client.fundTestnetAccount(publicKey).catch(() => null)
    }

    return { publicKey, alreadyExisted: false }
  }),

  /** Get balances for a public key (admin or self) */
  getBalances: protectedProcedure
    .input(z.object({ publicKey: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const pubKey = input.publicKey ?? (await getUserPublicKey(ctx.userId))
      if (!pubKey) return []
      const client = createStellarClient(stellarEnv)
      return client.getAllBalances(pubKey)
    }),

  /** [ADMIN] List all wallets */
  listAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.wallet.findMany({
      include: { user: { select: { email: true, full_name: true } } },
      orderBy: { created_at: 'desc' },
    })
  }),
})
