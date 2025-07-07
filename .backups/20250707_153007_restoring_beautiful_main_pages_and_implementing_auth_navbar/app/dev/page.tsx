'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Quick redirect to developers page
 * Accessible via /dev for faster typing
 */
export default function DevRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/developers')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-neutral-400">Redirecting to Developer Console...</p>
      </div>
    </div>
  )
}
