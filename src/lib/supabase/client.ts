import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if environment variables are properly configured
  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl.includes('your_supabase_url_here') ||
      supabaseAnonKey.includes('your_supabase_anon_key_here')) {

    // Allow bypass only in development
    if (process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      console.warn('🚨 Supabase not configured - using auth bypass for development')
      // Return a mock client that won't cause errors
      return null as any
    } else {
      console.error('❌ Supabase environment variables not configured properly')
      throw new Error('Supabase configuration required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
    }
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (urlError) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl)
    throw new Error('Invalid Supabase URL format. Please check your NEXT_PUBLIC_SUPABASE_URL environment variable.')
  }

  // Validate key format (basic check)
  if (supabaseAnonKey.length < 100) {
    console.error('❌ Supabase anonymous key appears to be invalid (too short)')
    throw new Error('Invalid Supabase anonymous key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.')
  }

  try {
    console.log('🔗 Creating Supabase client with URL:', supabaseUrl.substring(0, 30) + '...')
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (clientError) {
    console.error('❌ Failed to create Supabase client:', clientError)
    throw new Error('Failed to initialize Supabase client. Please check your configuration.')
  }
}
