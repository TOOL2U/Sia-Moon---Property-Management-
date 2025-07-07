'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // TODO: Replace with new auth system when implemented
    // For now, redirect to client dashboard
    console.log('🔄 Dashboard redirect: Redirecting to client dashboard...')
    router.push('/dashboard/client')
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  )
}
