import { createServerFn } from '@tanstack/react-start'
import type { MediaAssetListItem } from '#/lib/media/media.server'

export type { MediaAssetListItem }

export const listMediaAssets = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MediaAssetListItem[]> => {
    const { listMediaAssetsHandler } = await import('./media.server')
    return listMediaAssetsHandler()
  },
)

export const uploadMediaAsset = createServerFn({ method: 'POST' })
  .validator((data: { name: string; type: string; dataBase64: string }) => {
    if (!data.name.trim() || !data.dataBase64) {
      throw new Error('Image upload payload is incomplete.')
    }
    return {
      name: data.name,
      type: data.type || 'application/octet-stream',
      dataBase64: data.dataBase64,
    }
  })
  .handler(async ({ data }): Promise<MediaAssetListItem> => {
    const { uploadMediaAssetHandler } = await import('./media.server')
    return uploadMediaAssetHandler(data)
  })

export const deleteMediaAsset = createServerFn({ method: 'POST' })
  .validator((data: { assetId: string }) => {
    const assetId = data.assetId.trim()
    if (!assetId) throw new Error('Asset id is required.')
    return { assetId }
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { deleteMediaAssetHandler } = await import('./media.server')
    return deleteMediaAssetHandler(data.assetId)
  })
