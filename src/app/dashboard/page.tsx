'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait for auth to finish loading
      if (loading) {
        console.log('🔄 Dashboard redirect: Still loading...', { loading })
        return
      }

      console.log('🔍 Dashboard auth check:', {
        user: user ? 'exists' : 'none',
        loading
      })

      // If no user, redirect to login
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/auth/login')
        return
      }

      // If user exists, redirect to appropriate dashboard
      console.log('✅ User found, redirecting to client dashboard')
      router.push('/dashboard/client')
    }

    checkAuthAndRedirect()
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
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
