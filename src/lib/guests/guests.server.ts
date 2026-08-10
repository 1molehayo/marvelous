import { requireWeddingSession } from '#/lib/auth/session.server'
import type { GuestInput } from '#/lib/guests/schema'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'
import type { Guest } from '#/lib/supabase/types'

const GUEST_SELECT =
  'id, wedding_id, first_name, last_name, email, phone, party_name, plus_ones, notes, created_at, updated_at'

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
