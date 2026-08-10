import { requireWeddingSession } from '#/lib/auth/session.server'
import type { Wedding } from '#/lib/supabase/types'
import {
  FALLBACK_PUBLIC_WEDDING,
  toPublicSettings,
} from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'
import type { UpdateWeddingInput } from '#/lib/wedding/validation'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'

export async function getPublicWeddingSettingsHandler(): Promise<PublicWeddingSettings> {
  try {
    const admin = createAdminSupabaseClient()
    const result = await admin
      .from('weddings')
      .select(
        'groom_name, bride_name, wedding_date, venue_name, venue_location, dress_code, active_public_theme, status',
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
  const session = await requireWeddingSession()

  const admin = createAdminSupabaseClient()
  const updated = await admin
    .from('weddings')
    .update({
      groom_name: data.groom_name,
      bride_name: data.bride_name,
      wedding_date: data.wedding_date,
      status: data.status,
      venue_name: data.venue_name,
      venue_location: data.venue_location,
      dress_code: data.dress_code,
      active_public_theme: data.active_public_theme,
    })
    .eq('id', session.wedding.id)
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
