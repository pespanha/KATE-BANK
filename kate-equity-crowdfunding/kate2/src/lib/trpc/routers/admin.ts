import { z } from 'zod'
import { router, adminProcedure } from '../init'

export const adminRouter = router({
  /** Platform KPIs */
  getKpis: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalIssuers,
      totalOffers,
      activeOffers,
      pendingReservations,
      reservationsAgg,
      totalWallets,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.issuer.count(),
      ctx.prisma.offer.count(),
      ctx.prisma.offer.count({ where: { status: 'active' } }),
      ctx.prisma.reservation.count({ where: { status: 'pending' } }),
      ctx.prisma.reservation.aggregate({
        where: { status: { in: ['confirmed', 'settled'] } },
        _sum:  { amount_brz: true },
        _count: { id: true },
      }),
      ctx.prisma.wallet.count(),
    ])

    return {
      totalUsers,
      totalIssuers,
      totalOffers,
      activeOffers,
      pendingReservations,
      totalRaisedBrz:     reservationsAgg._sum.amount_brz ?? 0,
      totalInvestments:   reservationsAgg._count.id,
      totalWallets,
    }
  }),

  /** Token jobs: pending token emissions after confirmed reservations */
  listPendingTokenJobs: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.reservation.findMany({
      where:   { status: 'confirmed', blockchain_tx_hash: null },
      include: {
        investor: { include: { wallet: true } },
        offer:    { include: { token_assets: true, issuer: true } },
      },
      orderBy: { confirmed_at: 'asc' },
    })
  }),

  /** Mark reservation as settled (tokens emitted on Stellar) */
  settleReservation: adminProcedure
    .input(z.object({
      reservation_id:    z.string(),
      blockchain_tx_hash: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.prisma.reservation.update({
        where: { id: input.reservation_id },
        data:  { status: 'settled', blockchain_tx_hash: input.blockchain_tx_hash },
        include: { offer: { include: { token_assets: true } } },
      })

      // Update investor position
      const tokenAsset = reservation.offer.token_assets[0]
      if (tokenAsset) {
        await ctx.prisma.investorPosition.upsert({
          where: {
            // composite not directly supported, use findFirst + create/update
            id: `${reservation.investor_id}-${tokenAsset.id}`,
          },
          create: {
            id:                `${reservation.investor_id}-${tokenAsset.id}`,
            user_id:           reservation.investor_id,
            issuer_id:         reservation.offer.issuer_id,
            offer_id:          reservation.offer_id,
            token_asset_id:    tokenAsset.id,
            quantity:          reservation.token_quantity ?? 0,
            average_price:     reservation.unit_price,
            acquisition_origin: 'primary',
            last_updated_at:   new Date(),
          },
          update: {
            quantity:       { increment: reservation.token_quantity ?? 0 },
            last_updated_at: new Date(),
          },
        })
      }

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          actor_user_id: ctx.userId,
          action:        'settle_reservation',
          entity_type:   'reservation',
          entity_id:     input.reservation_id,
          new_value:     JSON.stringify({ blockchain_tx_hash: input.blockchain_tx_hash }),
        },
      })

      return reservation
    }),

  /** Get audit log */
  getAuditLog: adminProcedure
    .input(z.object({
      limit:       z.number().default(100),
      entity_type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.auditLog.findMany({
        where:   { entity_type: input.entity_type },
        include: { actor: { select: { email: true, full_name: true } } },
        take:    input.limit,
        orderBy: { created_at: 'desc' },
      })
    }),

  /** Get compliance checks */
  listComplianceChecks: adminProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.complianceCheck.findMany({
        where:   { status: input.status },
        include: { reviewer: { select: { email: true, full_name: true } } },
        orderBy: { created_at: 'desc' },
      })
    }),

  /** Get all users (with KYC info) */
  listUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findMany({
        include: { investor_profile: true, wallet: true },
        take:    input.limit,
        skip:    input.offset,
        orderBy: { created_at: 'desc' },
      })
    }),

  /** Update user role */
  updateUserRole: adminProcedure
    .input(z.object({
      user_id: z.string(),
      role:    z.enum(['investor', 'issuer', 'admin']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.user_id },
        data:  { role: input.role },
      })
    }),
})
