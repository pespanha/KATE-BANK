import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Enrich context with userId and role for middleware use
  let userId: string | null = null
  let userRole: string | null = null

  if (session?.user?.id) {
    userId = session.user.id
    // Fetch role from Prisma (single source of truth)
    const dbUser = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { role: true },
    }).catch(() => null)
    userRole = dbUser?.role ?? 'investor'
  }

  return {
    prisma,
    session,
    userId:   userId as string,
    userRole: userRole as string,
    req:      opts?.req,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
