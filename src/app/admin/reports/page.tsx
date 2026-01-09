'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to the main reports page
export default function AdminReportsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/reports')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading Reports...</p>
      </div>
    </div>
  )
}
