export type WeddingStatus =
  | 'planning'
  | 'date_confirmed'
  | 'invitations_sent'
  | 'completed'

export type PublicThemeId = 'celeste' | 'botanica' | 'rosewater' | 'nocturne'

export type Wedding = {
  id: string
  partner_one_name: string
  partner_two_name: string
  wedding_date: string | null
  status: WeddingStatus
  venue_name: string | null
  venue_location: string | null
  dress_code: string | null
  active_public_theme: PublicThemeId
  created_at: string
  updated_at: string
}

export type AdminProfile = {
  id: string
  wedding_id: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      weddings: {
        Row: Wedding
        Insert: Partial<Wedding> & {
          partner_one_name: string
          partner_two_name: string
        }
        Update: Partial<Wedding>
      }
      admin_profiles: {
        Row: AdminProfile
        Insert: {
          id: string
          wedding_id: string
          display_name?: string | null
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
