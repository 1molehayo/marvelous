import { isSuperAdminProfile } from '#/lib/auth/roles'
import type { AdminSession } from '#/lib/auth/types'
import { forbidden, unauthorized } from '#/lib/errors/route-error'

/**
 * Page-access gate for super-admin-only routes.
 * Throws RouteError (403) — do not use inside form/server-action handlers.
 */
export function requireSuperAdmin(session: AdminSession | null): AdminSession {
  if (!session) {
    throw unauthorized({
      message: 'Unauthenticated access attempt to a super-admin route',
    })
  }

  if (!isSuperAdminProfile(session.profile)) {
    throw forbidden({
      code: 'ADMIN_FORBIDDEN',
      message: `User ${session.user.id} (${session.profile.role}) blocked from super-admin route`,
    })
  }

  return session
}
