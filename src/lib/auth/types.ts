import type { AdminProfile, Wedding } from '#/lib/supabase/types'

export type AdminSession = {
  user: {
    id: string
    email: string | undefined
  }
  profile: AdminProfile
  wedding: Wedding
}

export type AdminListItem = {
  id: string
  email: string | null
  display_name: string | null
  role: AdminProfile['role']
  created_at: string
}
