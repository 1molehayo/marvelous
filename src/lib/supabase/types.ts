import type { PageBlock } from '#/lib/page-blocks/types'

export type WeddingStatus =
  | 'planning'
  | 'date_confirmed'
  | 'invitations_sent'
  | 'completed'

export type PublicThemeId = 'celeste' | 'botanica' | 'rosewater' | 'nocturne'

export type AdminRole = 'super_admin' | 'admin'

export type RsvpStatus = 'pending' | 'attending' | 'declined'

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
  /** @deprecated Prefer first_name — kept in sync for legacy reads. */
  display_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  role: AdminRole
  deletion_requested_at: string | null
  deletion_reason: string | null
  created_at: string
  updated_at: string
}

export type Guest = {
  id: string
  wedding_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  party_name: string | null
  plus_ones: number
  notes: string | null
  rsvp_token: string
  rsvp_status: RsvpStatus
  rsvp_responded_at: string | null
  attending_count: number | null
  dietary_notes: string | null
  rsvp_message: string | null
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
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          email?: string | null
          role?: AdminRole
          deletion_requested_at?: string | null
          deletion_reason?: string | null
        }
        Update: Partial<AdminProfile>
      }
      guests: {
        Row: Guest
        Insert: {
          wedding_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          party_name?: string | null
          plus_ones?: number
          notes?: string | null
          rsvp_token?: string
          rsvp_status?: RsvpStatus
          rsvp_responded_at?: string | null
          attending_count?: number | null
          dietary_notes?: string | null
          rsvp_message?: string | null
        }
        Update: Partial<
          Omit<Guest, 'id' | 'wedding_id' | 'created_at' | 'updated_at'>
        >
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
