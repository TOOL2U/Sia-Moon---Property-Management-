'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface Session {
  user: User
  access_token: string
  expires_at: number
}

interface User {
  id: string
  email: string
  created_at: string
}

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
}

interface UserContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile:', userId)

      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }
      const profileDoc = await getDoc(doc(db, 'users', userId))
      if (profileDoc.exists()) {
        const data = profileDoc.data()
        return {
          id: data.uid,
          email: data.email,
          full_name: data.fullName,
          created_at: data.createdAt
        }
      }
      return null
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (session?.user?.id) {
      const profileData = await fetchProfile(session.user.id)
      setProfile(profileData)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...')
      setLoading(true)

      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      await firebaseSignOut(auth)

      console.log('✅ Signed out successfully')
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...')

        if (!auth) {
          console.log('📋 Firebase auth not initialized')
          setSession(null)
          setProfile(null)
          return
        }

        // Use onAuthStateChanged instead of currentUser to avoid SSR issues
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const session = {
              user: { id: user.uid, email: user.email || '', created_at: user.metadata.creationTime || '' },
              access_token: await user.getIdToken(),
              expires_at: Date.now() + 3600000
            }
            setSession(session)
            const profileData = await fetchProfile(user.uid)
            setProfile(profileData)
          } else {
            console.log('📋 Initial session: None')
            setSession(null)
            setProfile(null)
          }
          setLoading(false)
        })

        // Clean up the listener
        return () => unsubscribe()
      } catch (error) {
        console.error('❌ Unexpected error getting initial session:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Firebase Auth state listener
    if (!auth) {
      console.error('Firebase auth not initialized')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return
      console.log('🔄 Auth state change:', user ? 'User exists' : 'No user')
      if (user) {
        const session = {
          user: { id: user.uid, email: user.email || '', created_at: user.metadata.creationTime || '' },
          access_token: await user.getIdToken(),
          expires_at: Date.now() + 3600000
        }
        setSession(session)
        const profileData = await fetchProfile(user.uid)
        setProfile(profileData)
      } else {
        setSession(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const value: UserContextType = {
    session,
    user: session?.user || null,
    profile,
    loading,
    signOut,
    refreshProfile
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default UserContext
