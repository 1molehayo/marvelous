import { createServerFn } from '@tanstack/react-start'
import type { Wedding } from '#/lib/supabase/types'
import { FALLBACK_PUBLIC_WEDDING } from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'
import { parseUpdateWeddingInput } from '#/lib/wedding/validation'
import type { UpdateWeddingInput } from '#/lib/wedding/validation'

export type { PublicWeddingSettings }
export { FALLBACK_PUBLIC_WEDDING }

export const getPublicWeddingSettings = createServerFn({
  method: 'GET',
})
  .validator((data?: { slug?: string }) => {
    const slug = data?.slug?.trim().toLowerCase()
    return { slug: slug || undefined }
  })
  .handler(async ({ data }): Promise<PublicWeddingSettings> => {
    const { getPublicWeddingSettingsHandler } = await import('./settings.server')
    return getPublicWeddingSettingsHandler(data.slug)
  })

export const updateWedding = createServerFn({ method: 'POST' })
  .validator((data: UpdateWeddingInput) => parseUpdateWeddingInput(data))
  .handler(async ({ data }): Promise<Wedding> => {
    const { updateWeddingHandler } = await import('./settings.server')
    return updateWeddingHandler(data)
  })
