'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface UserProfile {
  uid: string
  email: string
  fullName: string
  createdAt: string
  updatedAt: string
}

interface FirebaseAuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      console.log('🔍 Fetching user profile from Firestore:', uid)
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile
        console.log('✅ Profile fetched successfully:', profileData)
        setProfile(profileData)
      } else {
        console.log('⚠️ No profile found for user:', uid)
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      setProfile(null)
    }
  }

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      console.log('🔄 Signing out...')
      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      await firebaseSignOut(auth)
      setUser(null)
      setProfile(null)
      console.log('✅ Sign out successful')
      router.push('/auth/login')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      throw error
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      setLoading(false)
      return
    }
    
    console.log('🔍 Setting up Firebase auth state listener...')
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out')
      
      if (firebaseUser) {
        setUser(firebaseUser)
        await fetchUserProfile(firebaseUser.uid)
      } else {
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      console.log('🧹 Cleaning up Firebase auth listener')
      unsubscribe()
    }
  }, [])

  const value: FirebaseAuthContextType = {
    user,
    profile,
    loading,
    signOut
  }

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext)
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}
