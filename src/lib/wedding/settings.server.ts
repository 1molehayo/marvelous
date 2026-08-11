import { requireWeddingSession } from '#/lib/auth/session.server'
import type { Wedding } from '#/lib/supabase/types'
import {
  FALLBACK_PUBLIC_WEDDING,
  toPublicSettings,
} from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'
import type { UpdateWeddingInput } from '#/lib/wedding/validation'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'

export async function getPublicWeddingSettingsHandler(
  weddingSlug?: string,
): Promise<PublicWeddingSettings> {
  try {
    const admin = createAdminSupabaseClient()
    let query = admin
      .from('weddings')
      .select(
        'groom_name, bride_name, wedding_date, venue_name, venue_location, dress_code, active_public_theme, status, public_slug',
      )

    if (weddingSlug) {
      query = query.eq('public_slug', weddingSlug)
    } else {
      query = query.order('created_at', { ascending: true }).limit(1)
    }

    const result = await query.maybeSingle()

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

  const slugTaken = await admin
    .from('weddings')
    .select('id')
    .eq('public_slug', data.public_slug)
    .neq('id', session.wedding.id)
    .maybeSingle()

  if (slugTaken.error) {
    throw new Error(slugTaken.error.message)
  }
  if (slugTaken.data) {
    throw new Error('That public URL is already in use.')
  }

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
      public_slug: data.public_slug,
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
