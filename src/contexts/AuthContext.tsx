'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { User, AuthContextType } from '@/types'
import { useRouter } from 'next/navigation'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Development mode - bypass authentication
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let supabase: ReturnType<typeof createClient> | null = null

  try {
    if (isSupabaseConfigured) {
      supabase = createClient()
    }
  } catch (error) {
    console.warn('Supabase not configured properly:', error)
  }

  useEffect(() => {
    // In development mode, set a mock user to bypass authentication
    if (bypassAuth) {
      const mockUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'john.smith@example.com',
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUser(mockUser)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch user profile with role
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profile) {
            setUser({
              id: user.id,
              email: user.email!,
              role: profile.role,
              created_at: user.created_at,
              updated_at: user.updated_at || user.created_at,
            })
          } else {
            console.warn('Profile not found, using default role:', error)
            // If profile doesn't exist, create a default user object
            setUser({
              id: user.id,
              email: user.email!,
              role: 'client', // Default role
              created_at: user.created_at,
              updated_at: user.updated_at || user.created_at,
            })
          }
        }
      setLoading(false)
      } catch (error) {
        console.error('Error getting user:', error)
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: profile.role,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
            })
          } else {
            console.warn('Profile not found in auth state change, using default role:', error)
            // If profile doesn't exist, create a default user object
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: 'client', // Default role
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
            })
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
