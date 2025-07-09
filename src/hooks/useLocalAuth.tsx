'use client'

/**
 * Local Authentication Hook
 *
 * This hook provides local authentication functionality that mimics Supabase auth.
 * It uses localStorage to persist authentication state and can be easily swapped
 * back to Supabase authentication for production.
 *
 * Features:
 * - localStorage-based session persistence
 * - Same API as Supabase auth (signIn, signOut, user state)
 * - Easy migration path back to Supabase
 * - Mock user sessions with proper typing
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import db from '@/lib/db'

// Auth types matching Supabase
export interface AuthUser {
  id: string
  email: string
  role: 'client' | 'staff'
  name: string
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  expires_at: number
}

export interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: AuthSession | null; error: Error | null }>
  signUp: (email: string, password: string, role: 'client' | 'staff', name?: string) => Promise<{ data: AuthUser | null; error: Error | null }>
  signOut: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Local storage keys
const SESSION_KEY = 'local_auth_session'
const USER_KEY = 'local_auth_user'

// Mock credentials for development
const MOCK_CREDENTIALS = {
  'test@example.com': 'password123',
  'sarah.johnson@siamoon.com': 'password123'
}

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing local auth...')
      
      // Check for existing session in localStorage
      const storedSession = localStorage.getItem(SESSION_KEY)
      const storedUser = localStorage.getItem(USER_KEY)

      if (storedSession && storedUser) {
        const parsedSession: AuthSession = JSON.parse(storedSession)
        const parsedUser: AuthUser = JSON.parse(storedUser)

        // Check if session is still valid
        if (parsedSession.expires_at > Date.now()) {
          console.log('✅ Valid session found:', parsedUser.email)
          setSession(parsedSession)
          setUser(parsedUser)
        } else {
          console.log('❌ Session expired, clearing...')
          localStorage.removeItem(SESSION_KEY)
          localStorage.removeItem(USER_KEY)
        }
      } else {
        console.log('❌ No existing session found')
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<{ data: AuthSession | null; error: Error | null }> => {
    try {
      console.log('🔄 Attempting sign in for:', email)

      // First try the new password verification system
      const { data: initialUserData, error: dbError } = await db.verifyUserPassword(email, password)
      let userData = initialUserData

      if (dbError || !userData) {
        // Fallback to mock credentials for existing test users
        if (MOCK_CREDENTIALS[email as keyof typeof MOCK_CREDENTIALS] === password) {
          const { data: fallbackUser } = await db.getUserByEmail(email)
          if (fallbackUser) {
            userData = fallbackUser
          } else {
            return {
              data: null,
              error: new Error('Invalid email or password')
            }
          }
        } else {
          return {
            data: null,
            error: new Error('Invalid email or password')
          }
        }
      }

      // Create session
      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }

      const session: AuthSession = {
        user: authUser,
        access_token: `local_token_${userData.id}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }

      // Store in localStorage
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))

      // Update state
      setSession(session)
      setUser(authUser)

      console.log('✅ Sign in successful:', authUser.email)
      return { data: session, error: null }

    } catch (error) {
      console.error('❌ Sign in error:', error)
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Sign in failed')
      }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    role: 'client' | 'staff',
    name?: string
  ): Promise<{ data: AuthUser | null; error: Error | null }> => {
    try {
      console.log('🔄 Attempting sign up for:', email)

      // Validate password strength
      if (password.length < 6) {
        return {
          data: null,
          error: new Error('Password must be at least 6 characters long')
        }
      }

      // Create user with password hashing
      const { data: userData, error: dbError } = await db.createUserWithPassword(
        email,
        password,
        name || 'New User',
        role
      )

      if (dbError || !userData) {
        return {
          data: null,
          error: new Error(dbError?.message || 'Failed to create user')
        }
      }

      // Automatically sign in the user after successful sign up
      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }

      const session: AuthSession = {
        user: authUser,
        access_token: `local_token_${userData.id}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }

      // Save to localStorage
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))

      // Update state
      setUser(authUser)
      setSession(session)

      console.log('✅ Sign up and auto sign-in successful:', userData.email)
      return { data: authUser, error: null }

    } catch (error) {
      console.error('❌ Sign up error:', error)
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Sign up failed')
      }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔄 Signing out...')

      // Clear localStorage
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(USER_KEY)

      // Clear state
      setSession(null)
      setUser(null)

      console.log('✅ Sign out successful')

      // Use Next.js router for navigation instead of window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useLocalAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useLocalAuth must be used within a LocalAuthProvider')
  }
  return context
}

// TODO: Replace with Supabase auth for production
// Example migration:
// import { useSupabaseClient, useUser, useSession } from '@supabase/auth-helpers-react'
// 
// export function useAuth() {
//   const supabase = useSupabaseClient()
//   const user = useUser()
//   const session = useSession()
//   
//   const signIn = async (email: string, password: string) => {
//     return await supabase.auth.signInWithPassword({ email, password })
//   }
//   
//   const signOut = async () => {
//     return await supabase.auth.signOut()
//   }
//   
//   return { user, session, signIn, signOut }
// }
