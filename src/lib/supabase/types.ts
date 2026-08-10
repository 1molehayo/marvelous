import type { PageBlock } from '#/lib/page-blocks/types'

export type WeddingStatus =
  'planning' | 'date_confirmed' | 'invitations_sent' | 'completed'

export type PublicThemeId = 'celeste' | 'botanica' | 'rosewater' | 'nocturne'

export type AdminRole = 'super_admin' | 'admin'

export type Wedding = {
  id: string
  groom_name: string
  bride_name: string
  wedding_date: string | null
  status: WeddingStatus
  venue_name: string | null
  venue_location: string | null
  dress_code: string | null
  active_public_theme: PublicThemeId
  page_blocks: PageBlock[]
  created_at: string
  updated_at: string
}

export type AdminProfile = {
  id: string
  wedding_id: string | null
  display_name: string | null
  email: string | null
  role: AdminRole
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      weddings: {
        Row: Wedding
        Insert: Partial<Wedding> & {
          groom_name: string
          bride_name: string
        }
        Update: Partial<Wedding>
      }
      admin_profiles: {
        Row: AdminProfile
        Insert: {
          id: string
          wedding_id?: string | null
          display_name?: string | null
          email?: string | null
          role?: AdminRole
        }
        Update: Partial<AdminProfile>
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}
