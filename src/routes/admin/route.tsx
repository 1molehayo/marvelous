import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useState } from 'react'
import { AdminShell } from '#/components/admin-shell'
import { isSuperAdminProfile } from '#/lib/auth/roles'
import { getAdminSession, logoutAdmin } from '#/lib/auth/session'
import { hasCompleteAdminName } from '#/lib/auth/types'
import type { AdminSession } from '#/lib/auth/types'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({
    location,
  }): Promise<{ session: AdminSession | null }> => {
    if (location.pathname === '/admin/login') {
      return { session: null }
    }

    if (location.pathname.startsWith('/admin/invite/')) {
      return { session: null }
    }

    const session = await getAdminSession()
    if (!session) {
      throw redirect({ to: '/admin/login' })
    }

    const isSuper = isSuperAdminProfile(session.profile)
    const isProfile = location.pathname === '/admin/profile'
    const isSupport = location.pathname === '/admin/support'
    const isFeedback = location.pathname === '/admin/feedback'
    const isOnboarding = location.pathname === '/admin/onboarding'
    const hasName = hasCompleteAdminName(session.profile)
    const hasWedding = Boolean(session.wedding)

    // Name completion beats wedding onboarding for regular admins.
    if (!isSuper && !hasName && !isProfile) {
      throw redirect({ to: '/admin/profile' })
    }

    if (isSuper && isSupport) {
      throw redirect({ to: '/admin' })
    }

    if (!isSuper && isFeedback) {
      throw redirect({ to: '/admin' })
    }

    if (!hasWedding && !isSuper && !isOnboarding && hasName && !isProfile) {
      throw redirect({ to: '/admin/onboarding' })
    }

    if (hasWedding && isOnboarding) {
      throw redirect({ to: '/admin' })
    }

    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/invite/') ||
    !session
  ) {
    return <Outlet />
  }

  const onLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutAdmin()
      await navigate({ to: '/admin/login' })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AdminShell
      session={session}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
    >
      <Outlet />
    </AdminShell>
  )
}
