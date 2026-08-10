export type AddressSuggestion = {
  id: string
  label: string
  secondary?: string
}

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

/** Simple LRU + TTL cache for address search results. */
export function createTtlCache<T>(ttlMs: number, maxEntries = 200) {
  const map = new Map<string, CacheEntry<T>>()

  return {
    get(key: string): T | undefined {
      const entry = map.get(key)
      if (!entry) return undefined
      if (Date.now() > entry.expiresAt) {
        map.delete(key)
        return undefined
      }
      map.delete(key)
      map.set(key, entry)
      return entry.value
    },
    set(key: string, value: T) {
      if (map.has(key)) map.delete(key)
      else if (map.size >= maxEntries) {
        const oldest = map.keys().next().value
        if (oldest !== undefined) map.delete(oldest)
      }
      map.set(key, { value, expiresAt: Date.now() + ttlMs })
    },
  }
}

export function normalizeAddressQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}
