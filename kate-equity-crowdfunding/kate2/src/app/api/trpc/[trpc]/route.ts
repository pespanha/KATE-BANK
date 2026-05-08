import { fetchRequestHandler }    from '@trpc/server/adapters/fetch'
import { appRouter }               from '@/lib/trpc/routers/_app'
import { createContext }           from '@/lib/trpc/context'
import { type NextRequest }        from 'next/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint:      '/api/trpc',
    req,
    router:        appRouter,
    createContext: (opts: FetchCreateContextFnOptions) => createContext(opts),
  })

export { handler as GET, handler as POST }
