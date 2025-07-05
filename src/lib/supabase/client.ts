import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      console.warn('Supabase environment variables not set, but auth bypass is enabled')
      throw new Error('Missing Supabase environment variables')
    } else {
      throw new Error('Missing Supabase environment variables')
    }
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
