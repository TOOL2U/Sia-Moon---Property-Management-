'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { getUserDocument, isConnectivityError } from '@/lib/firestoreUtils'

// Cookie management utilities
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
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
  signIn: (email: string, password: string) => Promise<boolean>
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
    console.log('🔍 Setting up Firebase auth state listener in AuthContext...')

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 AuthContext auth state changed:', firebaseUser ? 'User signed in' : 'User signed out')

      if (firebaseUser) {
        // Set authentication cookie for middleware
        if (typeof window !== 'undefined') {
          setCookie('firebase-auth-token', firebaseUser.uid, 7)
        }

        // Set basic user info immediately to avoid blocking UI
        const basicUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name: '',
          role: 'client' as const
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
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                full_name: userData.fullName || '',
                role: userData.role || 'client'
              })
            } else {
              console.log('⚠️ User profile document does not exist, using basic info')
              // Keep the basic user info we already set
            }
          } catch (error: any) {
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

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Note: This function is not used anymore since we use Firebase forms directly
    // Keeping for interface compatibility
    console.log('⚠️ signIn called but Firebase forms handle authentication directly')
    return false
  }

  const signUp = async (email: string, password: string, name: string, role: string) => {
    // Note: This function is not used anymore since we use Firebase forms directly
    // Keeping for interface compatibility
    console.log('⚠️ signUp called but Firebase forms handle authentication directly')
    return { success: false, needsVerification: false }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔄 Signing out...')

      await firebaseSignOut(auth)

      // Clear authentication cookies
      if (typeof window !== 'undefined') {
        deleteCookie('firebase-auth-token')
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
