import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useState } from 'react'
import { AdminShell } from '#/components/admin-shell'
import { getAdminSession, logoutAdmin } from '#/lib/auth/session'
import type { AdminSession } from '#/lib/auth/types'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }): Promise<{ session: AdminSession | null }> => {
    if (location.pathname === '/admin/login') {
      return { session: null }
    }

    const session = await getAdminSession()
    if (!session) {
      throw redirect({ to: '/admin/login' })
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

  if (pathname === '/admin/login' || !session) {
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
