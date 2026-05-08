import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../init'

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
})
