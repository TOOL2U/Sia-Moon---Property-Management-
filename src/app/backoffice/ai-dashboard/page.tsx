'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DashboardStats {
  totalDecisions: number
  escalatedCount: number
  avgConfidence: number
  cooDecisions: number
  cfoDecisions: number
}

export default function AIDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new organized AI dashboard
    router.replace('/dashboard/ai')
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting to AI Dashboard...</p>
      </div>
    </div>
  )
}
