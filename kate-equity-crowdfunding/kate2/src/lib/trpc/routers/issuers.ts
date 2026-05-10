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

  /** [ISSUER] Create a draft offer linked to an issuer */
  createOffer: protectedProcedure
    .input(z.object({
      issuer_id:      z.string(),
      title:          z.string(),
      security_type:  z.enum(['equity', 'convertible_debt', 'non_convertible_debt']).default('equity'),
      min_target:     z.number().positive(),
      max_target:     z.number().positive(),
      unit_price:     z.number().positive(),
      min_investment: z.number().positive(),
      end_date:       z.string(), // ISO date string
      equity_offered: z.string().optional(),
      use_of_funds:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { issuer_id, end_date, ...rest } = input
      return ctx.prisma.offer.create({
        data: {
          ...rest,
          issuer_id,
          status:   'draft',
          end_date: new Date(end_date),
        },
      })
    }),

  /** [ISSUER] Save/update essential info for an offer (Steps 2 & 3 of wizard) */
  updateEssentialInfo: protectedProcedure
    .input(z.object({
      offer_id:      z.string(),
      company_info:  z.record(z.string(), z.unknown()).optional(),
      business_plan: z.record(z.string(), z.unknown()).optional(),
      security_info: z.record(z.string(), z.unknown()).optional(),
      risk_alerts:   z.record(z.string(), z.unknown()).optional(),
      warning_text:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { offer_id, company_info, business_plan, security_info, risk_alerts, warning_text } = input
      const data = {
        company_info:  company_info  ? JSON.stringify(company_info)  : undefined,
        business_plan: business_plan ? JSON.stringify(business_plan) : undefined,
        security_info: security_info ? JSON.stringify(security_info) : undefined,
        risk_alerts:   risk_alerts   ? JSON.stringify(risk_alerts)   : undefined,
        warning_text,
      }
      const existing = await ctx.prisma.essentialOfferInfo.findFirst({ where: { offer_id } })
      if (existing) {
        return ctx.prisma.essentialOfferInfo.update({ where: { id: existing.id }, data })
      }
      return ctx.prisma.essentialOfferInfo.create({
        data: { offer_id, version: 1, ...data },
      })
    }),

  /** [ISSUER] Add a document URL to an offer */
  addDocument: protectedProcedure
    .input(z.object({
      offer_id:      z.string(),
      document_type: z.string(),
      file_url:      z.string().url(),
      is_public:     z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.offerDocument.create({
        data: { ...input, uploaded_by: ctx.userId },
      })
    }),

  /** [ISSUER] Submit issuer + offer for admin review */
  submitForReview: protectedProcedure
    .input(z.object({
      issuer_id: z.string(),
      offer_id:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.issuer.update({
        where: { id: input.issuer_id },
        data:  { status: 'pending_review' },
      })
      if (input.offer_id) {
        await ctx.prisma.offer.update({
          where: { id: input.offer_id },
          data:  { status: 'pending_approval' },
        })
      }
      await ctx.prisma.auditLog.create({
        data: {
          actor_user_id: ctx.userId,
          action:        'issuer_submit_for_review',
          entity_type:   'issuer',
          entity_id:     input.issuer_id,
          new_value:     JSON.stringify({ offer_id: input.offer_id }),
        },
      })
      return { submitted: true }
    }),
})
