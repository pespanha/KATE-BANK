import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

/** Requires authenticated session */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user:   ctx.session.user,
      userId: ctx.userId,
    },
  })
})

/** Requires admin role */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (ctx.userRole !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  return next({
    ctx: {
      ...ctx,
      user:   ctx.session.user,
      userId: ctx.userId,
    },
  })
})
