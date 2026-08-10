import type { PublicThemeId } from '#/lib/site-settings'
import { FALLBACK_PUBLIC_THEME } from '#/lib/site-settings'
import type { Wedding, WeddingStatus } from '#/lib/supabase/types'

export type PublicWeddingSettings = {
  partner_one_name: string
  partner_two_name: string
  wedding_date: string | null
  venue_name: string | null
  venue_location: string | null
  dress_code: string | null
  active_public_theme: PublicThemeId
  status: WeddingStatus
}

export const FALLBACK_PUBLIC_WEDDING: PublicWeddingSettings = {
  partner_one_name: 'Marvelous',
  partner_two_name: 'Lillian',
  wedding_date: null,
  venue_name: null,
  venue_location: null,
  dress_code: null,
  active_public_theme: FALLBACK_PUBLIC_THEME,
  status: 'planning',
}

export function toPublicSettings(
  wedding: Pick<
    Wedding,
    | 'partner_one_name'
    | 'partner_two_name'
    | 'wedding_date'
    | 'venue_name'
    | 'venue_location'
    | 'dress_code'
    | 'active_public_theme'
    | 'status'
  >,
): PublicWeddingSettings {
  return {
    partner_one_name: wedding.partner_one_name,
    partner_two_name: wedding.partner_two_name,
    wedding_date: wedding.wedding_date,
    venue_name: wedding.venue_name,
    venue_location: wedding.venue_location,
    dress_code: wedding.dress_code,
    active_public_theme: wedding.active_public_theme,
    status: wedding.status,
  }
}
