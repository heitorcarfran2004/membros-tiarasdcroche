import { createClient } from '@supabase/supabase-js'

// Cliente server-only usando a SECRET KEY (sb_secret_...).
// Faz bypass de RLS — NUNCA importar isto em componente client.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY ausentes')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
