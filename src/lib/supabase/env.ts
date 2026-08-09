function readEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env[name]) {
    return process.env[name]
  }

  const metaEnv = import.meta.env as Record<string, string | undefined>
  return metaEnv[name]
}

export function getSupabaseUrl(): string {
  const value = readEnv('VITE_SUPABASE_URL')
  if (!value) {
    throw new Error('Missing VITE_SUPABASE_URL')
  }
  return value
}

export function getSupabasePublishableKey(): string {
  const value = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
  if (!value) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  return value
}

export function getSupabaseSecretKey(): string {
  const value = readEnv('SUPABASE_SECRET_KEY')
  if (!value) {
    throw new Error('Missing SUPABASE_SECRET_KEY')
  }
  return value
}
