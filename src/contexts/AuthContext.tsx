'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const savedUser = localStorage.getItem('auth_user')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          console.log('✅ Session restored:', userData.email)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('auth_user')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      console.log('🔄 Signing in:', email)

      // TODO: Replace with real authentication
      // For now, simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        full_name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'client'
      }

      setUser(mockUser)
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      
      console.log('✅ Sign in successful:', mockUser.email)
      return true
    } catch (error) {
      console.error('❌ Sign in error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      setLoading(true)
      console.log('🔄 Signing up:', email)

      // TODO: Replace with real authentication
      // For now, simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock user data
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        full_name: name,
        role: role as 'client' | 'staff' | 'admin'
      }

      setUser(mockUser)
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      
      console.log('✅ Sign up successful:', mockUser.email)
      return { success: true, needsVerification: false }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return { success: false, needsVerification: false }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔄 Signing out...')
      
      // TODO: Replace with real sign out
      setUser(null)
      localStorage.removeItem('auth_user')
      
      console.log('✅ Sign out successful')
      router.push('/auth/login')
    } catch (error) {
      console.error('❌ Sign out error:', error)
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
