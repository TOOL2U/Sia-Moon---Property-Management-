'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

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
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              full_name: userData.fullName || '',
              role: userData.role || 'client'
            })
          } else {
            // Fallback if no profile exists
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              full_name: '',
              role: 'client'
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: '',
            role: 'client'
          })
        }
      } else {
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
