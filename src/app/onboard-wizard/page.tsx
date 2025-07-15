'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import VillaOnboardingWizard from '@/components/onboarding/VillaOnboardingWizard'

function VillaOnboardingWizardContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/onboard-wizard')
    }
  }, [user, loading, router])

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading authentication...</div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl mb-4">Authentication Required</h2>
          <p className="text-neutral-400">Please sign in to access the onboarding wizard.</p>
        </div>
      </div>
    )
  }

  return <VillaOnboardingWizard />
}

export default function VillaOnboardingWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading onboarding wizard...</div>
      </div>
    }>
      <VillaOnboardingWizardContent />
    </Suspense>
  )
}
