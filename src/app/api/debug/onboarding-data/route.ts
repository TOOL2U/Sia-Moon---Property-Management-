import { NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Fetching onboarding submissions and profiles')

    // Get Firestore instance with lazy initialization
    const db = getDb()

    // Get recent onboarding submissions (without orderBy to avoid index issues)
    const onboardingRef = collection(db, 'onboarding_submissions')
    const onboardingSnapshot = await getDocs(onboardingRef)
    
    const onboardingSubmissions = onboardingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    // Get all profiles
    const profilesRef = collection(db, 'profiles')
    const profilesSnapshot = await getDocs(profilesRef)

    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    // Find vika profile specifically
    const vikaProfile = profiles.find(profile =>
      profile.email && profile.email.toLowerCase().includes('vika')
    )

    // Find recent onboarding submissions with vika email
    const vikaSubmissions = onboardingSubmissions.filter(submission =>
      submission.ownerEmail && submission.ownerEmail.toLowerCase().includes('vika')
    )

    return NextResponse.json({
      success: true,
      data: {
        totalProfiles: profiles.length,
        totalOnboardingSubmissions: onboardingSubmissions.length,
        vikaProfile: vikaProfile || null,
        vikaSubmissions: vikaSubmissions || [],
        recentOnboardingSubmissions: onboardingSubmissions.slice(0, 3),
        allProfiles: profiles.map(p => ({
          id: p.id,
          email: p.email,
          fullName: p.fullName,
          propertiesCount: p.properties ? p.properties.length : 0
        }))
      }
    })

  } catch (error) {
    console.error('❌ DEBUG: Error fetching data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: 'Error occurred while fetching Firebase data'
    }, { status: 500 })
  }
}
