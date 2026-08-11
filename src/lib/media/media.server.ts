import { requireWeddingSession } from '#/lib/auth/session.server'
import {
  createPhotoSignedUrl,
  isAllowedPhotoStoragePath,
} from '#/lib/page-blocks/storage.server'
import { createAdminSupabaseClient } from '#/lib/supabase/admin.server'
import type { MediaAsset } from '#/lib/supabase/types'

export type MediaAssetListItem = MediaAsset & {
  signedUrl: string | null
}

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

export async function listMediaAssetsHandler(): Promise<MediaAssetListItem[]> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const result = await admin
    .from('media_assets')
    .select('*')
    .eq('wedding_id', session.wedding.id)
    .order('created_at', { ascending: false })

  if (result.error) throw new Error(result.error.message)

  return Promise.all(
    result.data.map(async (row) => ({
      ...row,
      signedUrl: await createPhotoSignedUrl(row.storage_path),
    })),
  )
}

export async function uploadMediaAssetHandler(input: {
  name: string
  type: string
  dataBase64: string
}): Promise<MediaAssetListItem> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const binary = Buffer.from(input.dataBase64, 'base64')
  if (binary.byteLength === 0) throw new Error('Image data is empty.')
  if (binary.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be 12MB or smaller.')
  }

  const safeName = input.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `media/${session.wedding.id}/${crypto.randomUUID()}-${safeName}`
  const contentType = input.type || 'application/octet-stream'

  const uploaded = await admin.storage.from('photos').upload(path, binary, {
    contentType,
    upsert: false,
  })
  if (uploaded.error) throw new Error(uploaded.error.message)

  const created = await admin
    .from('media_assets')
    .insert({
      wedding_id: session.wedding.id,
      storage_path: path,
      filename: input.name.trim() || safeName,
      content_type: contentType,
      byte_size: binary.byteLength,
      created_by: session.user.id,
    })
    .select('*')
    .single()

  if (created.error) {
    await admin.storage.from('photos').remove([path])
    throw new Error(created.error.message)
  }

  return {
    ...created.data,
    signedUrl: await createPhotoSignedUrl(path),
  }
}

export async function deleteMediaAssetHandler(
  assetId: string,
): Promise<{ ok: true }> {
  const session = await requireWeddingSession()
  const admin = createAdminSupabaseClient()

  const existing = await admin
    .from('media_assets')
    .select('*')
    .eq('id', assetId)
    .eq('wedding_id', session.wedding.id)
    .maybeSingle()

  if (existing.error) throw new Error(existing.error.message)
  if (!existing.data) throw new Error('Media asset not found.')

  const removed = await admin
    .from('media_assets')
    .delete()
    .eq('id', assetId)
    .eq('wedding_id', session.wedding.id)

  if (removed.error) throw new Error(removed.error.message)

  if (isAllowedPhotoStoragePath(existing.data.storage_path)) {
    await admin.storage.from('photos').remove([existing.data.storage_path])
  }

  return { ok: true }
}
