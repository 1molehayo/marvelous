import {
  getLocalBootstrapRole,
  isLocalAllowedEmail,
  isSuperAdminEmail,
  isSuperAdminProfile,
  normalizeAdminEmail,
} from '#/lib/auth/roles'
import type { AdminSession } from '#/lib/auth/types'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'
import { isLocalSupabase } from '#/lib/supabase/env'
import { createServerSupabaseClient } from '#/lib/supabase/server.server'
import type { AdminProfile, AdminRole } from '#/lib/supabase/types'

export type { AdminSession }

async function promoteSuperAdminIfNeeded(
  profile: AdminProfile,
  email: string | undefined,
): Promise<AdminProfile> {
  const local = isLocalSupabase()
  if (!isSuperAdminEmail(email, local) || isSuperAdminProfile(profile)) {
    if (email && !profile.email) {
      const admin = createAdminSupabaseClient()
      const updated = await admin
        .from('admin_profiles')
        .update({ email: normalizeAdminEmail(email) })
        .eq('id', profile.id)
        .select('*')
        .single()
      if (!updated.error && updated.data) {
        return updated.data
      }
    }
    return profile
  }

  const admin = createAdminSupabaseClient()
  const updated = await admin
    .from('admin_profiles')
    .update({
      role: 'super_admin',
      email: normalizeAdminEmail(email!),
    })
    .eq('id', profile.id)
    .select('*')
    .single()

  if (updated.error) {
    throw new Error(updated.error.message)
  }

  return updated.data
}

async function createBootstrapProfile(
  userId: string,
  email: string,
  role: AdminRole,
): Promise<AdminProfile> {
  const admin = createAdminSupabaseClient()
  const weddingResult = await admin
    .from('weddings')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (weddingResult.error) {
    throw new Error(weddingResult.error.message)
  }

  if (!weddingResult.data) {
    throw new Error(
      'No wedding record found. Run migrations/seed before first admin login.',
    )
  }

  const normalizedEmail = normalizeAdminEmail(email)
  const displayName = normalizedEmail.split('@')[0] ?? 'Admin'

  const inserted = await admin
    .from('admin_profiles')
    .insert({
      id: userId,
      wedding_id: weddingResult.data.id,
      display_name: displayName,
      email: normalizedEmail,
      role,
    })
    .select('*')
    .single()

  if (inserted.error) {
    throw new Error(inserted.error.message)
  }

  return inserted.data
}

async function ensureAdminProfile(
  userId: string,
  email?: string,
): Promise<AdminProfile | null> {
  const admin = createAdminSupabaseClient()

  const existing = await admin
    .from('admin_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (existing.error) {
    throw new Error(existing.error.message)
  }

  if (existing.data) {
    return promoteSuperAdminIfNeeded(existing.data, email)
  }

  if (!email) {
    return null
  }

  const local = isLocalSupabase()
  if (local) {
    const role = getLocalBootstrapRole(email)
    if (!role) {
      return null
    }
    return createBootstrapProfile(userId, email, role)
  }

  if (!isSuperAdminEmail(email, false)) {
    return null
  }

  return createBootstrapProfile(userId, email, 'super_admin')
}

async function loadAdminSession(
  userId: string,
  email: string | undefined,
): Promise<AdminSession | null> {
  const profile = await ensureAdminProfile(userId, email)
  if (!profile) {
    return null
  }

  const admin = createAdminSupabaseClient()
  const weddingResult = await admin
    .from('weddings')
    .select('*')
    .eq('id', profile.wedding_id)
    .single()

  if (weddingResult.error) {
    throw new Error(weddingResult.error.message)
  }

  if (!weddingResult.data) {
    throw new Error('Wedding record missing for admin.')
  }

  return {
    user: { id: userId, email },
    profile,
    wedding: weddingResult.data,
  }
}

async function isAuthorizedAdminEmail(email: string): Promise<boolean> {
  if (isLocalSupabase()) {
    return isLocalAllowedEmail(email)
  }

  if (isSuperAdminEmail(email, false)) {
    return true
  }

  const admin = createAdminSupabaseClient()
  const result = await admin
    .from('admin_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (result.error) {
    throw new Error(result.error.message)
  }

  return Boolean(result.data)
}

async function ensureAuthUserExists(email: string) {
  const admin = createAdminSupabaseClient()
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: `${crypto.randomUUID()}A1!`,
  })

  if (created.error) {
    const message = created.error.message.toLowerCase()
    const alreadyExists =
      message.includes('already') ||
      message.includes('registered') ||
      message.includes('exists')
    if (!alreadyExists) {
      throw new Error(created.error.message)
    }
  }
}

export async function getAdminSessionHandler(): Promise<AdminSession | null> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    return null
  }

  return loadAdminSession(user.id, user.email)
}

export async function requestAdminOtpHandler(email: string) {
  const allowed = await isAuthorizedAdminEmail(email)
  if (!allowed) {
    throw new Error(
      isLocalSupabase()
        ? 'Local auth only allows superadmin@supabase.com or admin@supabase.com.'
        : 'This email is not authorized for admin access. Ask the super admin to invite you.',
    )
  }

  await ensureAuthUserExists(email)

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { ok: true as const, email }
}

export async function verifyAdminOtpHandler(input: {
  email: string
  token: string
}): Promise<AdminSession> {
  const supabase = createServerSupabaseClient()
  const { data: authData, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: 'email',
  })

  if (error) {
    throw new Error(error.message)
  }

  const user = authData.user
  if (!user) {
    throw new Error('Unable to verify code.')
  }

  const session = await loadAdminSession(user.id, user.email)

  if (!session) {
    await supabase.auth.signOut()
    throw new Error(
      'This account is not an admin. Ask the super admin to invite you.',
    )
  }

  return session
}

export async function logoutAdminHandler() {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
  return { ok: true as const }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSessionHandler()
  if (!session) {
    throw new Error('You must be signed in.')
  }
  return session
}

export async function requireSuperAdminSession(): Promise<AdminSession> {
  const session = await requireAdminSession()
  if (!isSuperAdminProfile(session.profile)) {
    throw new Error('Only the super admin can manage admins.')
  }
  return session
}
