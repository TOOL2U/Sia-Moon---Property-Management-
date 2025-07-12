import { NextResponse } from 'next/server'
import { ProfileService } from '@/lib/services/profileService'

export async function POST() {
  try {
    console.log('🔧 DEBUG: Creating property from vika onboarding data')

    // vika's data from the onboarding submission
    const vikaUserId = 'BAVZJE8LpNXuKzYJiGY55ukF8Ew2'
    const propertyData = {
      name: 'Parents House',
      address: '50/2 Moo 6',
      description: 'Property managed by Sia Moon Property Management.',
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      amenities: [],
      images: [],
      coverPhoto: undefined,
      pricePerNight: 0,
      currency: 'THB',
      status: 'pending_approval' as const
    }

    console.log('🏠 Creating property for user:', vikaUserId)
    console.log('🏠 Property data:', propertyData)

    // Add property to vika's profile
    const propertyId = await ProfileService.addPropertyToProfile(vikaUserId, propertyData)

    if (propertyId) {
      console.log('✅ Property created successfully:', propertyId)
      return NextResponse.json({
        success: true,
        message: 'Property created successfully from onboarding data!',
        propertyId,
        userId: vikaUserId,
        propertyName: propertyData.name
      })
    } else {
      console.error('❌ Failed to create property')
      return NextResponse.json({
        success: false,
        message: 'Failed to create property'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ DEBUG: Error creating property:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
