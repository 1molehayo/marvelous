import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { AppRouteError, NotFoundPage } from '#/components/app-error-page'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    notFoundMode: 'root',
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: AppRouteError,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
