import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'

const PHOTOS_BUCKET = 'photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6

export async function createPhotoSignedUrl(
  imagePath: string,
): Promise<string | null> {
  const path = imagePath.trim()
  if (!path) return null

  const admin = createAdminSupabaseClient()
  const result = await admin.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (result.error) {
    return null
  }

  return result.data.signedUrl
}

export async function uploadPageBlockImage(file: {
  name: string
  type: string
  data: ArrayBuffer
}): Promise<string> {
  const admin = createAdminSupabaseClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `page-blocks/${crypto.randomUUID()}-${safeName}`

  const result = await admin.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file.data, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return path
}
