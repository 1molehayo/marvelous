/**
 * PUT a file to a Supabase signed upload URL with real XHR progress.
 * Mirrors storage-js `uploadToSignedUrl` FormData shape for Blob/File bodies.
 */
export function uploadFileToSignedUrl(
  signedUrl: string,
  file: File,
  options?: {
    onProgress?: (percent: number) => void
    signal?: AbortSignal
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const body = new FormData()
    body.append('cacheControl', '3600')
    body.append('', file)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return
      const percent = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      )
      options?.onProgress?.(percent)
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options?.onProgress?.(100)
        resolve()
        return
      }
      let message = `Upload failed (${xhr.status}).`
      try {
        const parsed = JSON.parse(xhr.responseText) as {
          message?: string
          error?: string
        }
        message = parsed.message || parsed.error || message
      } catch {
        if (xhr.responseText.trim()) message = xhr.responseText.trim()
      }
      reject(new Error(message))
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.onabort = () => reject(new Error('Upload cancelled.'))

    if (options?.signal) {
      if (options.signal.aborted) {
        reject(new Error('Upload cancelled.'))
        return
      }
      options.signal.addEventListener(
        'abort',
        () => {
          xhr.abort()
        },
        { once: true },
      )
    }

    xhr.open('PUT', signedUrl)
    xhr.send(body)
  })
}
