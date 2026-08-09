import { createServerFn } from '@tanstack/react-start'
import { createAdminSupabaseClient } from '#/lib/supabase/admin'
import { createServerSupabaseClient } from '#/lib/supabase/server'
import type { AdminProfile, Wedding } from '#/lib/supabase/types'

export type AdminSession = {
  user: {
    id: string
    email: string | undefined
  }
  profile: AdminProfile
  wedding: Wedding
}

async function ensureAdminProfile(userId: string, email?: string) {
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
    return existing.data as AdminProfile
  }

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

  const displayName = email?.split('@')[0] ?? 'Admin'

  const inserted = await admin
    .from('admin_profiles')
    .insert({
      id: userId,
      wedding_id: weddingResult.data.id as string,
      display_name: displayName,
    })
    .select('*')
    .single()

  if (inserted.error) {
    throw new Error(inserted.error.message)
  }

  return inserted.data as AdminProfile
}

async function loadAdminSession(
  userId: string,
  email: string | undefined,
): Promise<AdminSession> {
  const profile = await ensureAdminProfile(userId, email)
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
    wedding: weddingResult.data as Wedding,
  }
}

export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminSession | null> => {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      return null
    }

    return loadAdminSession(user.id, user.email)
  },
)

export const loginAdmin = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string }) => {
    const email = data.email.trim()
    if (!email || !data.password) {
      throw new Error('Email and password are required.')
    }
    return {
      email: email.toLowerCase(),
      password: data.password,
    }
  })
  .handler(async ({ data }): Promise<AdminSession> => {
    const supabase = createServerSupabaseClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    const user = authData.user
    return loadAdminSession(user.id, user.email)
  })

export const logoutAdmin = createServerFn({ method: 'POST' }).handler(
  async () => {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    return { ok: true as const }
  },
)
