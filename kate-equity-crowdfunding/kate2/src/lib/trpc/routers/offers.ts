import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../init'
import { executeDirectBrzInvest, executeDefiSwapAndInvest } from '@/lib/stellar/client'

export const offersRouter = router({
  /** List all active offers (public) */
  list: publicProcedure
    .input(z.object({
      status:        z.string().optional(),
      security_type: z.string().optional(),
      limit:         z.number().min(1).max(100).default(20),
      offset:        z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.offer.findMany({
        where: {
          status:        input?.status        ?? 'active',
          security_type: input?.security_type ?? undefined,
        },
        include: {
          issuer: true,
          token_assets: true,
          essential_offer_infos: { take: 1 },
        },
        take:    input?.limit  ?? 20,
        skip:    input?.offset ?? 0,
        orderBy: { created_at: 'desc' },
      })
    }),

  /** Get offer by ID (public) */
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.offer.findUnique({
        where: { id: input.id },
        include: {
          issuer: {
            include: { controllers: true },
          },
          offer_documents:      true,
          essential_offer_infos: true,
          token_assets:         true,
          reservations: {
            where: { status: { in: ['confirmed', 'settled'] } },
            select: { amount_brz: true, token_quantity: true },
          },
        },
      })
    }),

  /** List all offers (admin) */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.offer.findMany({
      include: {
        issuer:       true,
        token_assets: true,
        reservations: { select: { amount_brz: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    })
  }),

  /** Create a new offer (admin) */
  create: protectedProcedure
    .input(z.object({
      issuer_id:             z.string(),
      title:                 z.string(),
      security_type:         z.enum(['equity', 'convertible_debt', 'non_convertible_debt']),
      min_target:            z.number(),
      max_target:            z.number(),
      unit_price:            z.number(),
      min_investment:        z.number(),
      start_date:            z.string(),
      end_date:              z.string(),
      additional_lot_allowed: z.boolean().default(false),
      additional_lot_limit:  z.number().optional(),
      secondary_authorized:  z.boolean().default(false),
      withdrawal_period_days: z.number().default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.offer.create({
        data: {
          ...input,
          status:     'draft',
          start_date: new Date(input.start_date),
          end_date:   new Date(input.end_date),
        },
      })
    }),

  /** Update offer status */
  updateStatus: protectedProcedure
    .input(z.object({
      id:     z.string(),
      status: z.enum(['draft', 'active', 'funded', 'failed', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.offer.update({
        where: { id: input.id },
        data:  { status: input.status },
      })
    }),

  /** Get offer statistics */
  getStats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const offer = await ctx.prisma.offer.findUnique({
        where: { id: input.id },
        select: { min_target: true, max_target: true, unit_price: true },
      })
      const reservations = await ctx.prisma.reservation.aggregate({
        where: { offer_id: input.id, status: { in: ['confirmed', 'settled'] } },
        _sum:   { amount_brz: true, token_quantity: true },
        _count: { id: true },
      })
      const totalRaised = reservations._sum.amount_brz ?? 0
      const totalTokens = reservations._sum.token_quantity ?? 0
      const investorCount = reservations._count.id
      const progress = offer?.max_target ? (totalRaised / offer.max_target) * 100 : 0

      return { totalRaised, totalTokens, investorCount, progress: Math.min(progress, 100) }
    }),

  /** Get which premium documents the logged-in user has unlocked for an offer */
  getDocumentAccesses: protectedProcedure
    .input(z.object({ offerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const accesses = await ctx.prisma.documentAccess.findMany({
        where: {
          user_id: ctx.userId,
          document: { offer_id: input.offerId },
        },
        select: { document_id: true, tx_hash: true },
      })
      // Return as a Set-friendly record: { [documentId]: txHash }
      const map: Record<string, string> = {}
      for (const a of accesses) {
        map[a.document_id] = a.tx_hash ?? ''
      }
      return map
    }),

  /** Unlock a premium document via XLM micropayment on Stellar */
  unlockPremiumDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Load the document
      const doc = await ctx.prisma.offerDocument.findUnique({
        where: { id: input.documentId },
      })
      if (!doc) throw new Error('Documento não encontrado.')
      if (!doc.isPremium) throw new Error('Este documento não requer pagamento.')

      const priceXLM = doc.priceXLM ?? 1 // default 1 XLM

      // 2. Check if already unlocked
      const existing = await ctx.prisma.documentAccess.findUnique({
        where: { user_id_document_id: { user_id: ctx.userId, document_id: input.documentId } },
      })
      if (existing) {
        return { alreadyUnlocked: true, fileUrl: doc.file_url, txHash: existing.tx_hash }
      }

      // 3. Get user's custodial wallet
      const wallet = await ctx.prisma.wallet.findUnique({
        where: { user_id: ctx.userId },
        select: { stellar_public_key: true, encrypted_secret: true },
      })
      if (!wallet?.encrypted_secret) {
        throw new Error('Wallet não encontrada. Complete o onboarding primeiro.')
      }

      // 4. Execute XLM payment on Stellar
      const StellarSdk = await import('@stellar/stellar-sdk')
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
      const networkPassphrase = StellarSdk.Networks.TESTNET

      // Platform receives the micropayment (use KATE public key or a dedicated treasury)
      const PLATFORM_PUBLIC = process.env.STELLAR_KATE_PUBLIC_KEY
        || 'GBXM2IXKBNAOSOA64GCKBNHFSFCJUXE4SQFGFPJOXVGWGGURJ7KVFLIT' // fallback to BRZ bank

      const userKeypair = StellarSdk.Keypair.fromSecret(wallet.encrypted_secret)
      const userAccount = await server.loadAccount(wallet.stellar_public_key)

      const tx = new StellarSdk.TransactionBuilder(userAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: PLATFORM_PUBLIC,
            asset: StellarSdk.Asset.native(), // XLM
            amount: priceXLM.toString(),
          })
        )
        .addMemo(StellarSdk.Memo.text(`x402:${input.documentId.substring(0, 20)}`))
        .setTimeout(30)
        .build()

      tx.sign(userKeypair)
      const result = await server.submitTransaction(tx)

      // 5. Record access in DB
      await ctx.prisma.documentAccess.create({
        data: {
          user_id:     ctx.userId,
          document_id: input.documentId,
          tx_hash:     result.hash,
          amount_xlm:  priceXLM,
        },
      })

      console.log(`[x402] Document ${input.documentId} unlocked by ${ctx.userId} | ${priceXLM} XLM | tx: ${result.hash}`)

      return {
        alreadyUnlocked: false,
        fileUrl: doc.file_url ?? `/documents/${input.documentId}.pdf`,
        txHash: result.hash,
      }
    }),

  /** Process an investment — BRZ direct or USDC via SDEX swap → Escrow */
  processInvestment: protectedProcedure
    .input(z.object({
      offerId:  z.string(),
      amount:   z.number().positive(),
      currency: z.enum(['BRZ', 'USDC']),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Load and validate the offer
      const offer = await ctx.prisma.offer.findUnique({
        where: { id: input.offerId },
        select: {
          id: true,
          status: true,
          unit_price: true,
          min_investment: true,
          max_target: true,
          end_date: true,
        },
      })
      if (!offer) throw new Error('Oferta não encontrada.')
      if (offer.status !== 'active') throw new Error('Esta oferta não está aberta para investimentos.')

      if (offer.end_date && new Date(offer.end_date) < new Date()) {
        throw new Error('O prazo desta oferta expirou.')
      }

      if (offer.min_investment && input.amount < offer.min_investment) {
        throw new Error(`Investimento mínimo: R$ ${offer.min_investment.toLocaleString('pt-BR')}`)
      }

      // 2. Get user's custodial wallet
      const wallet = await ctx.prisma.wallet.findUnique({
        where: { user_id: ctx.userId },
        select: { stellar_public_key: true, encrypted_secret: true },
      })
      if (!wallet?.encrypted_secret) {
        throw new Error('Wallet não encontrada. Complete o onboarding primeiro.')
      }

      // 3. Execute the on-chain payment
      let txResult: { success: boolean; txHash: string; route: string }

      if (input.currency === 'USDC') {
        // DeFi route: USDC → SDEX pathPaymentStrictReceive → BRZ → Escrow
        // Add 5% slippage buffer for the SDEX swap
        const maxUSDC = (input.amount * 1.05).toFixed(2)
        const expectedBRZ = input.amount.toFixed(2)

        txResult = await executeDefiSwapAndInvest(
          wallet.encrypted_secret,
          maxUSDC,
          expectedBRZ
        )
      } else {
        // Direct BRZ payment → Escrow
        txResult = await executeDirectBrzInvest(
          wallet.encrypted_secret,
          input.amount.toFixed(2)
        )
      }

      // 4. Calculate token quantity
      const unitPrice = offer.unit_price ?? 1
      const tokenQuantity = input.amount / unitPrice

      // 5. Create reservation record
      const reservation = await ctx.prisma.reservation.create({
        data: {
          offer_id:            input.offerId,
          investor_id:         ctx.userId,
          amount_brz:          input.amount,
          token_quantity:      tokenQuantity,
          unit_price:          unitPrice,
          status:              'pending_escrow',
          blockchain_tx_hash:  txResult.txHash,
          withdrawal_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days CVM 88
        },
      })

      console.log(
        `[Invest] ${ctx.userId} invested R$ ${input.amount} (${input.currency}) in offer ${input.offerId} ` +
        `| ${tokenQuantity} tokens | route: ${txResult.route} | tx: ${txResult.txHash}`
      )

      return {
        reservationId: reservation.id,
        txHash: txResult.txHash,
        route: txResult.route,
        tokenQuantity,
        withdrawalDeadline: reservation.withdrawal_deadline,
      }
    }),
})
