import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { AppRouteError, NotFoundPage } from '#/components/app-error-page'
import { RoutePending } from '#/components/route-pending'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // Match FCP: no intent preload. Intent + `/$weddingSlug` notFound() races
    // were flashing the root 404 UI during authenticated navigations.
    defaultPreload: false,
    notFoundMode: 'root',
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: AppRouteError,
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
