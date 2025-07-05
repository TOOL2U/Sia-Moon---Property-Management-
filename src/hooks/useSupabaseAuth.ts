'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'client' | 'staff' | 'admin'
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

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
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>
  refreshProfile: () => Promise<void>
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user profile from database with retry logic
  const loadProfile = useCallback(async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      console.log(`🔍 Loading profile for user: ${userId}`)

      // First, get all profiles for this user ID to check for duplicates
      const { data: profiles, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)

      if (queryError) {
        console.error('Error querying profiles:', queryError?.message || queryError)

        // If profile not found and we have retries left, wait and try again
        if (queryError.code === 'PGRST116' && retries > 0) {
          console.log(`Profile not found, retrying... (${retries} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          return loadProfile(userId, retries - 1)
        }

        return null
      }

      if (!profiles || profiles.length === 0) {
        console.log(`⚠️ No profile found for user: ${userId}`)

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
          await supabase
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
      console.error('Error loading profile:', err?.message || err)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        }

        if (mounted) {
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
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) {
          setError('Failed to initialize authentication')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (mounted) {
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
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
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

      const { data, error } = await supabase.auth.signUp({
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
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single()

          if (insertError) {
            console.warn('Profile insert failed:', insertError.message)

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
              const { data: upsertedProfile, error: upsertError } = await supabase
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
      const { error } = await supabase.auth.signOut()
      
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

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
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
    updateProfile,
    refreshProfile
  }
}
