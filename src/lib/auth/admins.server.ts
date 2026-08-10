import {
  isReservedSuperAdminEmail,
  isSuperAdminProfile,
} from '#/lib/auth/roles'
import { requireSuperAdminSession } from '#/lib/auth/session.server'
import {
  deriveAdminStatus,
} from '#/lib/auth/types'
import type { AdminListItem } from '#/lib/auth/types'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'

const ADMIN_LIST_SELECT =
  'id, email, first_name, last_name, display_name, role, deletion_requested_at, deletion_reason, created_at'

type AdminProfileRow = Omit<AdminListItem, 'last_sign_in_at' | 'status'>

async function withAuthSignInTimes(
  rows: AdminProfileRow[],
): Promise<AdminListItem[]> {
  if (rows.length === 0) return []

  const admin = createAdminSupabaseClient()
  const signInById = new Map<string, string | null>()

  await Promise.all(
    rows.map(async (row) => {
      const result = await admin.auth.admin.getUserById(row.id)
      signInById.set(
        row.id,
        result.data.user?.last_sign_in_at ?? null,
      )
    }),
  )

  return rows.map((row) => {
    const last_sign_in_at = signInById.get(row.id) ?? null
    return {
      ...row,
      last_sign_in_at,
      status: deriveAdminStatus({
        deletion_requested_at: row.deletion_requested_at,
        last_sign_in_at,
      }),
    }
  })
}

export async function listAdminsHandler(): Promise<AdminListItem[]> {
  await requireSuperAdminSession()
  const admin = createAdminSupabaseClient()
  const result = await admin
    .from('admin_profiles')
    .select(ADMIN_LIST_SELECT)
    .order('created_at', { ascending: true })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return withAuthSignInTimes(result.data)
}

export async function inviteAdminHandler(input: {
  email: string
  firstName: string
  lastName: string
}): Promise<AdminListItem> {
  const session = await requireSuperAdminSession()
  const admin = createAdminSupabaseClient()

  const created = await admin.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    password: `${crypto.randomUUID()}A1!`,
  })

  if (created.error) {
    throw new Error(created.error.message)
  }

  const userId = created.data.user.id

  const inserted = await admin
    .from('admin_profiles')
    .insert({
      id: userId,
      wedding_id: session.wedding?.id ?? null,
      first_name: input.firstName,
      last_name: input.lastName,
      display_name: input.firstName,
      email: input.email,
      role: 'admin',
    })
    .select(ADMIN_LIST_SELECT)
    .single()

  if (inserted.error) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error(inserted.error.message)
  }

  return (await withAuthSignInTimes([inserted.data]))[0]
}

export async function removeAdminHandler(adminId: string) {
  const session = await requireSuperAdminSession()

  if (adminId === session.user.id) {
    throw new Error('You cannot remove your own admin account.')
  }

  const admin = createAdminSupabaseClient()
  const existing = await admin
    .from('admin_profiles')
    .select('*')
    .eq('id', adminId)
    .maybeSingle()

  if (existing.error) {
    throw new Error(existing.error.message)
  }

  if (!existing.data) {
    throw new Error('Admin not found.')
  }

  const profile = existing.data

  if (
    isSuperAdminProfile(profile) ||
    isReservedSuperAdminEmail(profile.email)
  ) {
    throw new Error('The super admin cannot be removed.')
  }

  const deletedProfile = await admin
    .from('admin_profiles')
    .delete()
    .eq('id', adminId)

  if (deletedProfile.error) {
    throw new Error(deletedProfile.error.message)
  }

  const deletedUser = await admin.auth.admin.deleteUser(adminId)
  if (deletedUser.error) {
    throw new Error(deletedUser.error.message)
  }

  return { ok: true as const }
}
