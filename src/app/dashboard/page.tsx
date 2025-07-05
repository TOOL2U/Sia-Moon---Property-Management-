'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'

export default function DashboardRedirect() {
  const router = useRouter()
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (loading) {
      console.log('🔄 Dashboard redirect: Still loading auth state...')
      return
    }

    if (!profile) {
      console.log('🔄 Dashboard redirect: No profile, redirecting to login...')
      router.push('/auth/login')
      return
    }

    // Redirect based on user role
    console.log('🔄 Dashboard redirect: Profile found, redirecting based on role:', profile.role)
    if (profile.role === 'staff' || profile.role === 'admin') {
      router.push('/dashboard/staff')
    } else {
      router.push('/dashboard/client')
    }
  }, [profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  )
}
