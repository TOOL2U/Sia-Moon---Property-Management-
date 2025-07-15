'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserDocument, isConnectivityError } from '@/lib/firestoreUtils'

// Cookie management utilities
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }
}

const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }
}

interface User {
  id: string
  email: string
  full_name: string
  role: 'client' | 'staff' | 'admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ success: boolean; needsVerification: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Firebase auth state listener
  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      setLoading(false)
      return
    }
    
    console.log('🔍 Setting up Firebase auth state listener in AuthContext...')

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 AuthContext auth state changed:', firebaseUser ? 'User signed in' : 'User signed out')

      if (firebaseUser) {
        // Set authentication cookie for middleware
        if (typeof window !== 'undefined') {
          setCookie('firebase-auth-token', firebaseUser.uid, 7)

          // Also get and set the Firebase ID token for API authentication
          firebaseUser.getIdToken().then(idToken => {
            setCookie('firebase-id-token', idToken, 1) // Shorter expiry for security
          }).catch(error => {
            console.error('Failed to get Firebase ID token:', error)
          })
        }

        // Set basic user info immediately to avoid blocking UI
        // Check if user is admin based on email
        const isAdmin = firebaseUser.email === 'shaun@siamoon.com'
        const basicUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name: '',
          role: isAdmin ? 'admin' as const : 'client' as const
        }
        setUser(basicUser)

        // Fetch additional user profile from Firestore with improved error handling
        const fetchUserProfile = async () => {
          try {
            console.log('🔄 Fetching user profile with improved connectivity handling...')
            const userDoc = await getUserDocument(firebaseUser.uid)

            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log('✅ User profile fetched successfully')
              // Override role for admin user
              const isAdmin = firebaseUser.email === 'shaun@siamoon.com'
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                full_name: userData.fullName || '',
                role: isAdmin ? 'admin' : (userData.role || 'client')
              })
            } else {
              console.log('⚠️ User profile document does not exist, using basic info')
              // Keep the basic user info we already set
            }
          } catch (error: unknown) {
            console.error('❌ Error fetching user profile:', error)

            if (isConnectivityError(error)) {
              console.log('🌐 Connectivity issue detected, will retry when connection is restored')
            } else {
              console.log('⚠️ Non-connectivity error, using basic user info')
            }
            // Keep the basic user info we already set regardless of error type
          }
        }

        // Start fetching profile with a small delay to ensure Firestore is ready
        setTimeout(() => fetchUserProfile(), 500)
      } else {
        // Remove authentication cookie when user signs out
        if (typeof window !== 'undefined') {
          deleteCookie('firebase-auth-token')
          deleteCookie('firebase-id-token')
          deleteCookie('auth-token')
        }
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      console.log('🧹 Cleaning up AuthContext Firebase auth listener')
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthContext: Attempting to sign in user:', email)

      if (!auth) {
        throw new Error('Firebase Auth is not initialized')
      }

      // Import Firebase auth functions
      const { signInWithEmailAndPassword } = await import('firebase/auth')

      // Attempt to sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      console.log('✅ AuthContext: Firebase sign in successful:', user.uid)

      // The auth state listener will handle setting the user state
      return { success: true }

    } catch (error: any) {
      console.error('❌ AuthContext: Sign in error:', error)

      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.'

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signUp = async (_email: string, _password: string, _name: string, _role: string) => {
    // Note: This function is not used anymore since we use Firebase forms directly
    // Keeping for interface compatibility
    console.log('⚠️ signUp called but Firebase forms handle authentication directly')
    return { success: false, needsVerification: false }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔄 Signing out...')

      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      await firebaseSignOut(auth)

      // Clear authentication cookies
      if (typeof window !== 'undefined') {
        deleteCookie('firebase-auth-token')
        deleteCookie('firebase-id-token')
        deleteCookie('auth-token')
      }

      setUser(null)

      console.log('✅ Firebase sign out successful')
      router.push('/auth/login')
    } catch (error) {
      console.error('❌ Firebase sign out error:', error)
    }
  }

  const value: AuthContextType = {
    user,
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
