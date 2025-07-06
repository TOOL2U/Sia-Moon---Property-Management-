'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { logAuthError, logDatabaseError } from '@/lib/errorLogger'
import toast from 'react-hot-toast'

export interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface UseSupabaseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, userData?: Partial<Profile>) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>
  refreshProfile: () => Promise<void>
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if Supabase is configured
  const isSupabaseConfigured = supabase !== null

  // Load user profile from database with retry logic
  const loadProfile = useCallback(async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      console.log(`🔍 Loading profile for user: ${userId}`)

      // Added a local supabaseClient assertion after ensuring supabase is configured
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      const supabaseClient = supabase!

      const { data: profiles, error: queryError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)

      if (queryError) {
        console.error('Error querying profiles:', queryError?.message || queryError)

        if (queryError.code === 'PGRST116' && retries > 0) {
          console.log(`Profile not found, retrying... (${retries} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          return loadProfile(userId, retries - 1)
        }

        return null
      }

      if (!profiles || profiles.length === 0) {
        console.log(`⚠️ No profile found for user: ${userId}`)

        // Try to create a profile for existing users who don't have one
        console.log('🔧 Attempting to create missing profile...')
        try {
          // Get user info from auth
          // Replaced direct usages of `supabase` with `supabaseClient`
          const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

          if (!userError && user && user.id === userId) {
            const profileData = {
              id: userId,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              role: (user.user_metadata?.role as 'client' | 'staff' | 'admin') || 'client'
            }

            console.log('📝 Creating profile with data:', profileData)

            const { data: newProfile, error: createError } = await supabaseClient
              .from('profiles')
              .insert(profileData)
              .select()
              .single()

            if (!createError && newProfile) {
              console.log('✅ Profile created successfully:', newProfile)
              return newProfile as Profile
            } else {
              console.error('❌ Failed to create profile:', createError?.message)
            }
          }
        } catch (createErr) {
          console.error('❌ Error creating profile:', createErr)
        }

        if (retries > 0) {
          console.log(`Retrying profile load... (${retries} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          return loadProfile(userId, retries - 1)
        }

        return null
      }

      if (profiles.length > 1) {
        console.warn(`⚠️ Multiple profiles found for user ${userId}, using the first one`)
        console.warn('Profile IDs:', profiles.map(p => p.id))

        // Clean up duplicate profiles (keep the first one, delete the rest)
        const duplicateIds = profiles.slice(1).map(p => p.id)
        if (duplicateIds.length > 0) {
          console.log('🧹 Cleaning up duplicate profiles...')
          await supabaseClient
            .from('profiles')
            .delete()
            .in('id', duplicateIds)
        }
      }

      const profile = profiles[0] as Profile
      console.log(`✅ Profile loaded successfully:`, {
        id: profile.id,
        email: profile.email,
        role: profile.role
      })

      return profile
    } catch (err) {
      console.error('Error loading profile:', err instanceof Error ? err.message : err)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      // Require Supabase configuration for production
      if (!isSupabaseConfigured) {
        setError('Authentication service not available')
        setLoading(false)
        return
      }

      try {
        // Get initial session
        if (!supabase) {
          throw new Error('Supabase is not configured');
        }
        const supabaseClient = supabase;
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        }

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('🔄 Loading profile for user:', session.user.id)
          const userProfile = await loadProfile(session.user.id)
          if (userProfile) {
            console.log('✅ Profile loaded in auth state change:', userProfile)
            setProfile(userProfile)
          } else {
            console.log('⚠️ No profile found for user:', session.user.id)
            setProfile(null)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) {
          setError('Failed to initialize authentication')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes (only if Supabase is configured)
    let subscription: { unsubscribe: () => void } | null = null
    if (isSupabaseConfigured && supabase) {
      const supabaseClient = supabase;
      const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
        
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        setError(null)

        if (session?.user) {
          const userProfile = await loadProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
      )
      subscription = authSubscription
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [loadProfile, isSupabaseConfigured])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      const supabaseClient = supabase;
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        logAuthError(error, 'signIn', email)
        setError(error.message)
        toast.error(error.message)
        return false
      }

      if (data.user) {
        // Wait for profile to be loaded
        console.log('🔄 User signed in, loading profile...')
        const userProfile = await loadProfile(data.user.id)

        if (userProfile) {
          setProfile(userProfile)
          setUser(data.user)
          setSession(data.session)
          console.log('✅ Profile loaded after sign in:', userProfile)
          toast.success('Signed in successfully!')
          return true
        } else {
          console.log('⚠️ No profile found after sign in')
          toast.error('Profile not found. Please contact support.')
          return false
        }
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadProfile])

  // Sign up function
  const signUp = useCallback(async (
    email: string,
    password: string,
    userData?: Partial<Profile>
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      const supabaseClient = supabase;
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.full_name || '',
            role: userData?.role || 'client'
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        logAuthError(error, 'signUp', email)
        setError(error.message)
        toast.error(error.message)
        return false
      }

      if (data.user) {
        // Manually create profile since trigger might not be working
        try {
          console.log('🔄 Creating profile for new user:', data.user.id)

          const profileData = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: userData?.full_name || '',
            role: (userData?.role as 'client' | 'staff' | 'admin') || 'client'
          }

          // First try to insert the profile
          const { data: insertedProfile, error: insertError } = await supabaseClient
            .from('profiles')
            .insert(profileData)
            .select()
            .single()

          if (insertError) {
            console.warn('Profile insert failed:', insertError.message)
            logDatabaseError(insertError, 'insert', 'profiles')

            // If insert failed, try to load existing profile
            console.log('🔄 Attempting to load existing profile...')
            const userProfile = await loadProfile(data.user.id, 5) // More retries for signup

            if (userProfile) {
              setProfile(userProfile)
              setUser(data.user)
              setSession(data.session)
              console.log('✅ Existing profile loaded after signup:', userProfile)
              toast.success('Account created successfully!')
              return true
            } else {
              // If no existing profile, try upsert as last resort
              console.log('🔄 Trying upsert as fallback...')
              const { data: upsertedProfile, error: upsertError } = await supabaseClient
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select()
                .single()

              if (upsertError || !upsertedProfile) {
                console.error('❌ All profile creation methods failed')
                toast.error('Failed to create user profile. Please contact support.')
                return false
              } else {
                setProfile(upsertedProfile as Profile)
                setUser(data.user)
                setSession(data.session)
                console.log('✅ Profile created via upsert fallback')
                toast.success('Account created successfully!')
                return true
              }
            }
          } else {
            console.log('✅ Profile created successfully:', insertedProfile)

            // Set the auth state immediately with the created profile
            setProfile(insertedProfile as Profile)
            setUser(data.user)
            setSession(data.session)

            console.log('✅ Auth state set after signup')
            toast.success('Account created successfully!')
            return true
          }
        } catch (profileErr) {
          console.error('Profile creation error:', profileErr)
          toast.error('Failed to create user profile. Please contact support.')
          return false
        }
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadProfile])

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      const supabaseClient = supabase;
      const { error } = await supabaseClient.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        toast.error('Error signing out')
      } else {
        toast.success('Signed out successfully')
      }
    } catch (err) {
      console.error('Error signing out:', err)
      toast.error('Error signing out')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset password function
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      const supabaseClient = supabase;
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        setError(error.message)
        return false
      }

      console.log('✅ Password reset email sent successfully')
      return true
    } catch (error) {
      console.error('Password reset error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send reset email')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      const supabaseClient = supabase;
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        toast.error('Failed to update profile')
        return false
      }

      setProfile(data as Profile)
      toast.success('Profile updated successfully!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Refresh profile function
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return

    try {
      const userProfile = await loadProfile(user.id)
      setProfile(userProfile)
    } catch (err) {
      console.error('Error refreshing profile:', err)
    }
  }, [user, loadProfile])

  return {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile
  }
}
