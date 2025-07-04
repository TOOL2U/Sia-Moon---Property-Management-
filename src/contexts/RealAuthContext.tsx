'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  role: 'client' | 'staff'
  name?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, role: 'client' | 'staff', name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  // Debug Supabase client
  console.log('🔧 Supabase client initialized:', !!supabase)

  useEffect(() => {
    console.log('🔄 AuthContext initializing...')

    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email)

      if (session?.user) {
        console.log('✅ User found in session, fetching profile...')
        await fetchUserProfile(session.user)
      } else {
        console.log('❌ No user in session, setting user to null')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log('🔄 AuthContext cleanup')
      subscription.unsubscribe()
    }
  }, [])

  const getInitialSession = async () => {
    try {
      console.log('🔍 Getting initial session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('📝 Initial session result:', {
        session: !!session,
        user: !!session?.user,
        email: session?.user?.email,
        error
      })

      if (session?.user) {
        console.log('✅ Initial session has user, fetching profile...')
        await fetchUserProfile(session.user)
      } else {
        console.log('❌ No user in initial session')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Error getting initial session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('🔍 Fetching user profile for:', authUser.id, authUser.email)

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )

      // First try to find by ID
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      let { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      console.log('📝 Profile by ID result:', {
        profile,
        error: error?.message || error,
        hasProfile: !!profile,
        searchedId: authUser.id
      })

      // If not found by ID, try by email
      if (error && authUser.email) {
        console.log('🔍 Trying to find profile by email:', authUser.email)
        const { data: profileByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single()

        console.log('📝 Profile by email result:', {
          profileByEmail,
          emailError: emailError?.message || emailError,
          hasProfile: !!profileByEmail,
          searchedEmail: authUser.email
        })

        if (!emailError && profileByEmail) {
          profile = profileByEmail
          error = null
        }
      }

      if (error || !profile) {
        console.error('❌ No user profile found:', error)
        // If profile doesn't exist, user might need to complete signup
        setUser(null)
        return
      }

      console.log('✅ User profile found:', profile)
      const userData = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }

      setUser(userData)
      console.log('✅ User state updated:', userData)
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error)
      setUser(null)
    }
  }

  const signUp = async (email: string, password: string, role: 'client' | 'staff', name?: string) => {
    try {
      console.log('🔄 Starting signup process...', { email, role, name })
      setLoading(true)

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('📝 Signup response:', { authData, authError })

      if (authError) {
        console.error('❌ Signup error:', authError)
        throw authError
      }

      if (authData.user) {
        console.log('✅ User created in auth, creating profile...')

        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: email,
              role: role,
              name: name || email.split('@')[0]
            }
          ])

        console.log('📝 Profile creation result:', { profileError })

        if (profileError) {
          console.error('❌ Error creating user profile:', profileError)
          throw new Error('Failed to create user profile')
        }

        console.log('✅ Profile created successfully')
        toast.success('Account created successfully!')

        // Redirect based on role
        const redirectPath = role === 'staff' ? '/dashboard/staff' : '/dashboard/client'
        console.log('🔄 Redirecting to:', redirectPath)

        // Use setTimeout to ensure state updates complete before redirect
        setTimeout(() => {
          router.push(redirectPath)
        }, 100)
      }
    } catch (error: any) {
      console.error('❌ Error in signUp:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      console.log('🏁 Signup process finished')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Starting sign in process...', { email })
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📝 Sign in response:', { data, error })

      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }

      if (data.user) {
        console.log('✅ User authenticated, fetching profile...')

        // Fetch user profile to get role
        try {
          await fetchUserProfile(data.user)
          console.log('✅ User profile fetched')
        } catch (profileError) {
          console.error('⚠️ Profile fetch error:', profileError)
        }

        // Get the user's role for redirect
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        console.log('📝 Profile query by ID result:', { profile, profileError })

        // If not found by ID, try by email
        if (profileError && data.user.email) {
          console.log('🔍 Trying to find profile by email for redirect:', data.user.email)
          const { data: profileByEmail, error: emailError } = await supabase
            .from('users')
            .select('role')
            .eq('email', data.user.email)
            .single()

          console.log('📝 Profile query by email result:', { profileByEmail, emailError })

          if (!emailError && profileByEmail) {
            profile = profileByEmail
            profileError = null
          }
        }

        if (profile && profile.role) {
          // Redirect based on role
          const redirectPath = profile.role === 'staff' ? '/dashboard/staff' : '/dashboard/client'
          console.log('🔄 Redirecting to:', redirectPath)

          toast.success('Signed in successfully!')

          // Force redirect immediately
          setTimeout(() => {
            window.location.href = redirectPath
          }, 100)
        } else {
          console.error('❌ No profile found for user, using default redirect')
          // Default redirect to client dashboard if no profile found
          toast.success('Signed in successfully!')
          setTimeout(() => {
            window.location.href = '/dashboard/client'
          }, 100)
        }
      }
    } catch (error: any) {
      console.error('❌ Error in signIn:', error)
      toast.error(error.message || 'Failed to sign in')
    } finally {
      console.log('🏁 Sign in process finished')
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      console.log('✅ Sign out successful')
      setUser(null)

      // Force a hard refresh to clear any cached state
      window.location.href = '/'
    } catch (error: any) {
      console.error('❌ Error in signOut:', error)
      toast.error(error.message || 'Failed to sign out')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
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
