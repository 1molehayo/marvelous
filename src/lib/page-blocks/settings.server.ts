import { requireWeddingSession } from '#/lib/auth/session.server'
import { createDefaultPageBlocks } from '#/lib/page-blocks/types'
import type { PageBlock } from '#/lib/page-blocks/types'
import { parsePageBlocks } from '#/lib/page-blocks/validation'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'
import type { Wedding } from '#/lib/supabase/types'
import {
  FALLBACK_PUBLIC_WEDDING,
  toPublicSettings,
} from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'
import { createPhotoSignedUrl, uploadPageBlockImage } from './storage.server'

export type PublicHomeData = PublicWeddingSettings & {
  page_blocks: PageBlock[]
  imageUrls: Record<string, string>
}

function coercePageBlocks(value: unknown): PageBlock[] {
  try {
    const blocks = parsePageBlocks(value ?? [])
    return blocks.length > 0 ? blocks : createDefaultPageBlocks()
  } catch {
    return createDefaultPageBlocks()
  }
}

export async function getPageBlocksHandler(): Promise<PageBlock[]> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const weddingResult = await admin
    .from('weddings')
    .select('page_blocks')
    .eq('id', session.wedding.id)
    .single()

  if (weddingResult.error) {
    throw new Error(weddingResult.error.message)
  }

  return coercePageBlocks(weddingResult.data.page_blocks)
}

export async function updatePageBlocksHandler(
  pageBlocks: PageBlock[],
): Promise<Wedding> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const updated = await admin
    .from('weddings')
    .update({ page_blocks: pageBlocks })
    .eq('id', session.wedding.id)
    .select('*')
    .single()

  if (updated.error) {
    throw new Error(updated.error.message)
  }

  if (!updated.data) {
    throw new Error('Page content could not be updated.')
  }

  return {
    ...updated.data,
    page_blocks: coercePageBlocks(updated.data.page_blocks),
  }
}

export async function getPublicHomeDataHandler(): Promise<PublicHomeData> {
  try {
    const admin = createAdminSupabaseClient()
    const result = await admin
      .from('weddings')
      .select(
        'groom_name, bride_name, wedding_date, venue_name, venue_location, dress_code, active_public_theme, status, page_blocks',
      )
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (result.error) {
      throw new Error(result.error.message)
    }

    if (!result.data) {
      return {
        ...FALLBACK_PUBLIC_WEDDING,
        page_blocks: createDefaultPageBlocks(),
        imageUrls: {},
      }
    }

    const page_blocks = coercePageBlocks(result.data.page_blocks)
    const imageUrls: Record<string, string> = {}

    await Promise.all(
      page_blocks
        .filter((block) => block.type === 'image' && block.fields.imagePath)
        .map(async (block) => {
          if (block.type !== 'image') return
          const url = await createPhotoSignedUrl(block.fields.imagePath)
          if (url) {
            imageUrls[block.id] = url
          }
        }),
    )

    return {
      ...toPublicSettings(result.data),
      page_blocks,
      imageUrls,
    }
  } catch {
    return {
      ...FALLBACK_PUBLIC_WEDDING,
      page_blocks: createDefaultPageBlocks(),
      imageUrls: {},
    }
  }
}

export async function getSignedPhotoUrlHandler(
  imagePath: string,
): Promise<string | null> {
  await requireWeddingSession()
  return createPhotoSignedUrl(imagePath)
}

export async function uploadPageBlockImageHandler(file: {
  name: string
  type: string
  dataBase64: string
}): Promise<{ path: string; signedUrl: string | null }> {
  await requireWeddingSession()

  const binary = Uint8Array.from(atob(file.dataBase64), (c) => c.charCodeAt(0))
  const path = await uploadPageBlockImage({
    name: file.name,
    type: file.type,
    data: binary.buffer,
  })
  const signedUrl = await createPhotoSignedUrl(path)
  return { path, signedUrl }
}
