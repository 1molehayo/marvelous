import { createServerFn } from '@tanstack/react-start'
import { normalizeAdminEmail } from '#/lib/auth/roles'
import { toE164Phone } from '#/lib/auth/phone'
import type { CountryCode } from '#/lib/auth/phone'
import type { AdminProfile } from '#/lib/supabase/types'
import { SUPPORT_CATEGORIES } from '#/lib/support/categories'

function parseNames(data: { first_name: string; last_name: string }) {
  const firstName = data.first_name.trim()
  const lastName = data.last_name.trim()
  if (!firstName) throw new Error('First name is required.')
  if (!lastName) throw new Error('Last name is required.')
  return { firstName, lastName }
}

export const updateProfile = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      first_name: string
      last_name: string
      phone_country?: string
      phone_national?: string
      email?: string
    }) => {
      const { firstName, lastName } = parseNames(data)
      let phone: string | null = null
      if (data.phone_national?.trim()) {
        phone = toE164Phone(
          (data.phone_country || 'NG') as CountryCode,
          data.phone_national,
        )
      }
      let email: string | undefined
      if (data.email !== undefined) {
        email = normalizeAdminEmail(data.email)
      }
      return { firstName, lastName, phone, email }
    },
  )
  .handler(async ({ data }): Promise<AdminProfile> => {
    const { updateProfileHandler } = await import('./profile.server')
    return updateProfileHandler(data)
  })

export const requestAccountDeletion = createServerFn({ method: 'POST' })
  .validator((data: { reason: string }) => {
    const reason = data.reason.trim()
    if (reason.length < 10) {
      throw new Error('Please share a bit more detail (at least 10 characters).')
    }
    return { reason }
  })
  .handler(async ({ data }): Promise<AdminProfile> => {
    const { requestAccountDeletionHandler } = await import('./profile.server')
    return requestAccountDeletionHandler(data)
  })

export const submitSupport = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      category: string
      message: string
      image?: { name: string; type: string; dataBase64: string } | null
    }) => {
      const category = data.category.trim()
      if (!SUPPORT_CATEGORIES.some((item) => item.id === category)) {
        throw new Error('Choose a valid subject.')
      }
      const message = data.message.trim()
      if (message.length < 10) {
        throw new Error('Please enter a message (at least 10 characters).')
      }
      return {
        category,
        message,
        image: data.image ?? null,
      }
    },
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { submitSupportHandler } = await import('./profile.server')
    return submitSupportHandler(data)
  })
