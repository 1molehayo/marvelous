import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'
import { createServerSupabaseClient } from '#/lib/supabase/server.server'
import type { Wedding } from '#/lib/supabase/types'
import {
  FALLBACK_PUBLIC_WEDDING,
  toPublicSettings,
} from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'
import type { UpdateWeddingInput } from '#/lib/wedding/validation'

export async function getPublicWeddingSettingsHandler(): Promise<PublicWeddingSettings> {
  try {
    const admin = createAdminSupabaseClient()
    const result = await admin
      .from('weddings')
      .select(
        'partner_one_name, partner_two_name, wedding_date, venue_name, venue_location, dress_code, active_public_theme, status',
      )
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (result.error) {
      throw new Error(result.error.message)
    }

    if (!result.data) {
      return FALLBACK_PUBLIC_WEDDING
    }

    return toPublicSettings(result.data)
  } catch {
    return FALLBACK_PUBLIC_WEDDING
  }
}

export async function updateWeddingHandler(
  data: UpdateWeddingInput,
): Promise<Wedding> {
  const supabase = createServerSupabaseClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    throw new Error('You must be signed in to update wedding settings.')
  }

  const profileResult = await supabase
    .from('admin_profiles')
    .select('wedding_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  if (!profileResult.data?.wedding_id) {
    throw new Error('Admin profile is not linked to a wedding.')
  }

  const updated = await supabase
    .from('weddings')
    .update({
      partner_one_name: data.partner_one_name,
      partner_two_name: data.partner_two_name,
      wedding_date: data.wedding_date,
      status: data.status,
      venue_name: data.venue_name,
      venue_location: data.venue_location,
      dress_code: data.dress_code,
      active_public_theme: data.active_public_theme,
    })
    .eq('id', profileResult.data.wedding_id)
    .select('*')
    .single()

  if (updated.error) {
    throw new Error(updated.error.message)
  }

  if (!updated.data) {
    throw new Error('Wedding settings could not be updated.')
  }

  return updated.data
}
