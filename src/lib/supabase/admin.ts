import { createClient } from '@supabase/supabase-js'
import {
  getSupabaseSecretKey,
  getSupabaseUrl,
} from '#/lib/supabase/env'

/** Server-only privileged client. Never import from browser code. */
export function createAdminSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
