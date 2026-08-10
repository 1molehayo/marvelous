/**
 * Env resolution for Vite / TanStack Start.
 *
 * Prefer `import.meta.env` first so `.env.local` correctly overrides `.env`
 * (local Mailpit vs cloud Supabase). Falling back to `process.env` second
 * avoids picking a stale cloud URL from the process environment.
 */
function readEnv(name: string): string | undefined {
  const metaEnv = import.meta.env as Record<string, string | undefined>
  if (metaEnv[name]) {
    return metaEnv[name]
  }

  if (typeof process !== 'undefined' && process.env[name]) {
    return process.env[name]
  }

  return undefined
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
  // Prefer the secret key; fall back to legacy service_role JWT (still returned by `pnpm status`).
  const value =
    readEnv('SUPABASE_SECRET_KEY') ?? readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!value) {
    throw new Error('Missing SUPABASE_SECRET_KEY')
  }
  return value
}

export function isLocalSupabase(): boolean {
  const url = readEnv('VITE_SUPABASE_URL')
  if (!url) return false
  return (
    url.includes('127.0.0.1') ||
    url.includes('localhost') ||
    url.includes('0.0.0.0')
  )
}
