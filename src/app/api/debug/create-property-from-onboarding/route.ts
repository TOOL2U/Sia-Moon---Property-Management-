import { NextResponse } from 'next/server'
import { ProfileService } from '@/lib/services/profileService'

export async function POST() {
  try {
    console.log('🔧 DEBUG: FORCING property creation from vika onboarding data')

    // vika's data from the onboarding submission
    const vikaUserId = 'BAVZJE8LpNXuKzYJiGY55ukF8Ew2'

    console.log('🔍 Step 1: Check if user exists')
    console.log('User ID:', vikaUserId)

    // First, let's test if ProfileService is working at all
    console.log('🔍 Step 2: Test ProfileService import')
    console.log('ProfileService:', typeof ProfileService)
    console.log('addPropertyToProfile method:', typeof ProfileService.addPropertyToProfile)

    const propertyData = {
      name: 'Parents House - FORCED CREATION',
      address: '50/2 Moo 6',
      description: 'Property managed by Sia Moon Property Management. FORCED CREATION TEST.',
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      amenities: [],
      images: [],
      pricePerNight: 0,
      currency: 'THB',
      status: 'pending_approval' as const
    }

    console.log('🔍 Step 3: Property data prepared')
    console.log('Property data:', JSON.stringify(propertyData, null, 2))

    console.log('🔍 Step 4: Calling ProfileService.addPropertyToProfile')

    // Add property to vika's profile
    const propertyId = await ProfileService.addPropertyToProfile(vikaUserId, propertyData)

    console.log('🔍 Step 5: ProfileService call completed')
    console.log('Returned property ID:', propertyId)

    if (propertyId) {
      console.log('✅ SUCCESS: Property created successfully:', propertyId)
      return NextResponse.json({
        success: true,
        message: 'FORCED property creation successful!',
        propertyId,
        userId: vikaUserId,
        propertyName: propertyData.name,
        debug: {
          step: 'Property created successfully',
          propertyId,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      console.error('❌ FAILED: ProfileService returned null')
      return NextResponse.json({
        success: false,
        message: 'ProfileService.addPropertyToProfile returned null',
        debug: {
          step: 'ProfileService returned null',
          userId: vikaUserId,
          propertyData
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ CRITICAL ERROR in property creation:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      debug: {
        step: 'Exception thrown',
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 })
  }
}
