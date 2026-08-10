import { createServerFn } from '@tanstack/react-start'
import {
  isReservedSuperAdminEmail,
  normalizeAdminEmail,
} from '#/lib/auth/roles'
import type { AdminListItem } from '#/lib/auth/types'

export type { AdminListItem }

function parseInviteInput(data: { email: string; display_name?: string }) {
  const email = normalizeAdminEmail(data.email)
  if (!email || !email.includes('@')) {
    throw new Error('A valid email is required.')
  }
  if (isReservedSuperAdminEmail(email)) {
    throw new Error('The super admin account is managed separately.')
  }
  const displayName =
    data.display_name?.trim() || email.split('@')[0] || 'Admin'
  return { email, displayName }
}

export const listAdmins = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminListItem[]> => {
    const { listAdminsHandler } = await import('./admins.server')
    return listAdminsHandler()
  },
)

export const inviteAdmin = createServerFn({ method: 'POST' })
  .validator((data: { email: string; display_name?: string }) =>
    parseInviteInput(data),
  )
  .handler(async ({ data }): Promise<AdminListItem> => {
    const { inviteAdminHandler } = await import('./admins.server')
    return inviteAdminHandler(data)
  })

export const removeAdmin = createServerFn({ method: 'POST' })
  .validator((data: { adminId: string }) => {
    const adminId = data.adminId.trim()
    if (!adminId) {
      throw new Error('Admin id is required.')
    }
    return { adminId }
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { removeAdminHandler } = await import('./admins.server')
    return removeAdminHandler(data.adminId)
  })
