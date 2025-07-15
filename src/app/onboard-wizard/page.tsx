'use client'

import { useRouter } from 'next/navigation'
import VillaOnboardingWizard from '@/components/onboarding/VillaOnboardingWizard'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function OnboardWizardPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/onboard-wizard')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Please log in to access the onboarding wizard...</div>
      </div>
    )
  }

  return (
    <VillaOnboardingWizard
      onComplete={(data) => {
        console.log('Onboarding completed:', data)
        router.push('/dashboard?onboarding=completed')
      }}
      onCancel={() => {
        router.push('/dashboard')
      }}
    />
  )
}
