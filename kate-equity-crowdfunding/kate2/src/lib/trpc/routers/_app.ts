import { router } from '../init'
import { offersRouter }    from './offers'
import { walletRouter }    from './wallet'
import { stellarRouter }   from './stellar'
import { investorsRouter } from './investors'
import { issuersRouter }   from './issuers'
import { secondaryRouter } from './secondary'
import { adminRouter }     from './admin'

export const appRouter = router({
  offers:    offersRouter,
  wallet:    walletRouter,
  stellar:   stellarRouter,
  investors: investorsRouter,
  issuers:   issuersRouter,
  secondary: secondaryRouter,
  admin:     adminRouter,
})

export type AppRouter = typeof appRouter
