'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CommandCenterLayout from '@/components/command-center/CommandCenterLayout'
import { clientToast as toast } from '@/utils/clientToast'

export default function CommandCenterPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  // Route protection - admin only (following backoffice patterns)
  useEffect(() => {
    if (!authLoading) {
      // Check if auth bypass is enabled (development mode)
      const authBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true'
      
      if (!authBypass) {
        if (!user) {
          console.log('❌ No user found, redirecting to login')
          router.push('/auth/login')
          return
        }
        if (user.role !== 'admin') {
          console.log('❌ User is not admin, access denied')
          router.push('/dashboard')
          return
        }
      } else {
        console.log('🚨 AUTH BYPASS ENABLED - DEVELOPMENT ONLY')
      }
      
      console.log('✅ Admin user verified, loading command center')
      setIsInitialized(true)
    }
  }, [user, authLoading, router])

  // Show loading state while authenticating
  if (authLoading || !isInitialized) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing Command Center...</p>
          <p className="text-gray-400 text-sm mt-2">Verifying access permissions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      <CommandCenterLayout />
    </div>
  )
}
