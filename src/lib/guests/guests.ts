import { createServerFn } from '@tanstack/react-start'
import { parseGuestInput } from '#/lib/guests/schema'
import type { Guest } from '#/lib/supabase/types'

export const listGuests = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Guest[]> => {
    const { listGuestsHandler } = await import('./guests.server')
    return listGuestsHandler()
  },
)

export const createGuest = createServerFn({ method: 'POST' })
  .validator((data: unknown) => parseGuestInput(data))
  .handler(async ({ data }): Promise<Guest> => {
    const { createGuestHandler } = await import('./guests.server')
    return createGuestHandler(data)
  })

export const updateGuest = createServerFn({ method: 'POST' })
  .validator((data: { guestId: string } & Record<string, unknown>) => {
    const guestId = String(data.guestId).trim()
    if (!guestId) throw new Error('Guest id is required.')
    return { guestId, input: parseGuestInput(data) }
  })
  .handler(async ({ data }): Promise<Guest> => {
    const { updateGuestHandler } = await import('./guests.server')
    return updateGuestHandler(data.guestId, data.input)
  })

export const deleteGuest = createServerFn({ method: 'POST' })
  .validator((data: { guestId: string }) => {
    const guestId = data.guestId.trim()
    if (!guestId) throw new Error('Guest id is required.')
    return { guestId }
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { deleteGuestHandler } = await import('./guests.server')
    return deleteGuestHandler(data.guestId)
  })

export const sendGuestInvite = createServerFn({ method: 'POST' })
  .validator((data: { guestId: string }) => {
    const guestId = String(data.guestId).trim()
    if (!guestId) throw new Error('Guest id is required.')
    return { guestId }
  })
  .handler(async ({ data }) => {
    const { sendGuestInviteHandler } = await import('./guests.server')
    return sendGuestInviteHandler(data.guestId)
  })

export const sendGuestInvitesBulk = createServerFn({ method: 'POST' })
  .validator((data: { onlyPending?: boolean }) => ({
    onlyPending: Boolean(data.onlyPending),
  }))
  .handler(async ({ data }) => {
    const { sendGuestInvitesBulkHandler } = await import('./guests.server')
    return sendGuestInvitesBulkHandler(data)
  })
