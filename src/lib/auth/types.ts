import type { AdminProfile, Wedding } from '#/lib/supabase/types'

export type AdminSession = {
  user: {
    id: string
    email: string | undefined
  }
  profile: AdminProfile
  /** Null until onboarding creates the wedding row. */
  wedding: Wedding | null
}

export type AdminListItem = {
  id: string
  email: string | null
  display_name: string | null
  role: AdminProfile['role']
  created_at: string
}
