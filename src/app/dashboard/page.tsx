'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUser } from '@/contexts/UserContext'

export default function DashboardRedirect() {
  const router = useRouter()
  const { loading } = useAuth()
  const { session, profile, loading: userLoading } = useUser()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for both auth contexts to finish loading
      if (loading || userLoading) {
        console.log('🔄 Dashboard redirect: Still loading...', { loading, userLoading })
        return
      }

      console.log('🔍 Dashboard auth check:', {
        session: session ? 'exists' : 'none',
        profile: profile ? 'exists' : 'none',
        loading,
        userLoading
      })

      // If no session, redirect to login
      if (!session) {
        console.log('❌ No session found, redirecting to login')
        router.push('/login')
        return
      }

      // If session exists, redirect to appropriate dashboard
      console.log('✅ Session found, redirecting to client dashboard')
      router.push('/dashboard/client')
    }

    checkAuthAndRedirect()
  }, [session, profile, loading, userLoading, router])

  // Show loading while checking authentication
  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  )
}
