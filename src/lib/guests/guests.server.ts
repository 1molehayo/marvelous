import { requireWeddingSession } from '#/lib/auth/session.server'
import { getAppUrl } from '#/lib/app-url'
import { formatCoupleNames } from '#/lib/constants'
import { sendGuestRsvpInviteEmail } from '#/lib/email/resend.server'
import type { GuestInput } from '#/lib/guests/schema'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'
import type { Guest } from '#/lib/supabase/types'
import { formatWeddingDate } from '#/lib/wedding/public-settings'

const GUEST_SELECT =
  'id, wedding_id, first_name, last_name, email, phone, party_name, plus_ones, notes, rsvp_token, rsvp_status, rsvp_responded_at, attending_count, dietary_notes, rsvp_message, created_at, updated_at'

export async function listGuestsHandler(): Promise<Guest[]> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const result = await admin
    .from('guests')
    .select(GUEST_SELECT)
    .eq('wedding_id', session.wedding.id)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data
}

export async function createGuestHandler(input: GuestInput): Promise<Guest> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const result = await admin
    .from('guests')
    .insert({
      wedding_id: session.wedding.id,
      ...input,
    })
    .select(GUEST_SELECT)
    .single()

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data
}

export async function updateGuestHandler(
  guestId: string,
  input: GuestInput,
): Promise<Guest> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const result = await admin
    .from('guests')
    .update(input)
    .eq('id', guestId)
    .eq('wedding_id', session.wedding.id)
    .select(GUEST_SELECT)
    .single()

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data
}

export async function deleteGuestHandler(guestId: string): Promise<{ ok: true }> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const result = await admin
    .from('guests')
    .delete()
    .eq('id', guestId)
    .eq('wedding_id', session.wedding.id)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { ok: true as const }
}

export type SendGuestInviteResult = {
  ok: true
  guestId: string
  email: string
  includedPhotos: boolean
}

export type SendGuestInvitesBulkResult = {
  sent: number
  skipped: number
  failed: Array<{ guestId: string; email: string; error: string }>
}

async function loadGuestPhotoShareUrl(
  weddingId: string,
  guestId: string,
  rsvpToken: string,
): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const membership = await admin
    .from('photo_share_group_guests')
    .select('group_id')
    .eq('guest_id', guestId)
    .maybeSingle()

  if (membership.error) throw new Error(membership.error.message)
  if (!membership.data) return null

  const group = await admin
    .from('photo_share_groups')
    .select('share_token')
    .eq('id', membership.data.group_id)
    .eq('wedding_id', weddingId)
    .maybeSingle()

  if (group.error) throw new Error(group.error.message)
  if (!group.data?.share_token) return null

  return `${getAppUrl()}/photos/${group.data.share_token}?g=${encodeURIComponent(rsvpToken)}`
}

async function sendInviteForGuest(
  wedding: {
    id: string
    groom_name: string
    bride_name: string
    wedding_date: string | null
    public_slug: string
  },
  guest: Guest,
): Promise<SendGuestInviteResult> {
  const email = guest.email?.trim().toLowerCase()
  if (!email) {
    throw new Error('Add an email address before sending an invite.')
  }

  const coupleLabel = formatCoupleNames(wedding.groom_name, wedding.bride_name)
  const origin = getAppUrl()
  const photosUrl = await loadGuestPhotoShareUrl(
    wedding.id,
    guest.id,
    guest.rsvp_token,
  )

  await sendGuestRsvpInviteEmail({
    to: email,
    guestName: guest.first_name,
    coupleLabel,
    weddingDateLabel: formatWeddingDate(wedding.wedding_date),
    websiteUrl: wedding.public_slug
      ? `${origin}/${wedding.public_slug}`
      : null,
    rsvpUrl: `${origin}/rsvp/${encodeURIComponent(guest.rsvp_token)}`,
    photosUrl,
  })

  return {
    ok: true as const,
    guestId: guest.id,
    email,
    includedPhotos: Boolean(photosUrl),
  }
}

export async function sendGuestInviteHandler(
  guestId: string,
): Promise<SendGuestInviteResult> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const result = await admin
    .from('guests')
    .select(GUEST_SELECT)
    .eq('id', guestId)
    .eq('wedding_id', session.wedding.id)
    .maybeSingle()

  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new Error('Guest not found.')

  return sendInviteForGuest(session.wedding, result.data)
}

export async function sendGuestInvitesBulkHandler(input: {
  onlyPending: boolean
}): Promise<SendGuestInvitesBulkResult> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  let query = admin
    .from('guests')
    .select(GUEST_SELECT)
    .eq('wedding_id', session.wedding.id)

  if (input.onlyPending) {
    query = query.eq('rsvp_status', 'pending')
  }

  const result = await query
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (result.error) throw new Error(result.error.message)

  const guests = result.data ?? []
  let sent = 0
  let skipped = 0
  const failed: SendGuestInvitesBulkResult['failed'] = []

  for (const guest of guests) {
    if (!guest.email?.trim()) {
      skipped += 1
      continue
    }
    try {
      await sendInviteForGuest(session.wedding, guest)
      sent += 1
    } catch (err) {
      failed.push({
        guestId: guest.id,
        email: guest.email ?? '',
        error: err instanceof Error ? err.message : 'Unable to send invite.',
      })
    }
  }

  return { sent, skipped, failed }
}
