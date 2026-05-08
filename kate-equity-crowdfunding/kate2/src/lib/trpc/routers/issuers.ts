import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../init'

export const issuersRouter = router({
  /** List issuers (public — basic info) */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.issuer.findMany({
      select: {
        id: true, legal_name: true, trade_name: true,
        sector: true, status: true, website: true,
      },
      orderBy: { created_at: 'desc' },
    })
  }),

  /** Get issuer by ID */
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.issuer.findUnique({
        where:   { id: input.id },
        include: { controllers: true, offers: true },
      })
    }),

  /** [ADMIN] Create issuer */
  create: adminProcedure
    .input(z.object({
      legal_name:                 z.string(),
      trade_name:                 z.string().optional(),
      cnpj:                       z.string(),
      legal_type:                 z.string().optional(),
      annual_revenue:             z.number().optional(),
      consolidated_annual_revenue: z.number().optional(),
      headquarters_address:       z.string().optional(),
      sector:                     z.string().optional(),
      website:                    z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.issuer.create({
        data: { ...input, status: 'pending', created_by: ctx.userId },
      })
    }),

  /** [ADMIN] Update issuer */
  update: adminProcedure
    .input(z.object({
      id:     z.string(),
      status: z.string().optional(),
      sector: z.string().optional(),
      website: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.issuer.update({ where: { id }, data })
    }),

  /** [ADMIN] Add controller to issuer */
  addController: adminProcedure
    .input(z.object({
      issuer_id:            z.string(),
      name:                 z.string(),
      cpf_cnpj:             z.string(),
      ownership_percentage: z.number(),
      voting_percentage:    z.number(),
      is_control_group:     z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.issuerController.create({ data: input })
    }),

  /** [ADMIN] List all issuers with full detail */
  listAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.issuer.findMany({
      include: {
        controllers: true,
        offers: { select: { id: true, title: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    })
  }),
})
