import { NextRequest, NextResponse } from 'next/server'
import { PropertyService } from '@/lib/services/propertyService'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing onboarding property save to user subcollection')
    
    // Test user ID (using existing test user)
    const testUserId = 'BAVZJE8LpNXuKzYJiGY55ukF8Ew2' // vika@gmail.com
    
    // Mock onboarding data
    const mockOnboardingData = {
      propertyName: 'Test Villa from Onboarding',
      propertyAddress: '456 Test Beach Road, Koh Samui, Thailand',
      bedrooms: 3,
      bathrooms: 2,
      landSizeSqm: 800,
      villaSizeSqm: 200,
      hasPool: true,
      hasGarden: true,
      hasAirConditioning: true,
      hasParking: true,
      hasLaundry: false,
      hasBackupPower: true,
      electricityProvider: 'PEA',
      waterSource: 'Municipal',
      internetProvider: 'AIS',
      internetPackage: 'Fiber 100Mbps',
      uploadedPhotos: [
        'https://res.cloudinary.com/test/image/upload/v1/test1.jpg',
        'https://res.cloudinary.com/test/image/upload/v1/test2.jpg'
      ]
    }
    
    console.log('📋 Mock onboarding data:', mockOnboardingData)
    console.log('👤 Test user ID:', testUserId)
    
    // Test the new createPropertyInUserProfile method
    const propertyId = await PropertyService.createPropertyInUserProfile(
      mockOnboardingData,
      testUserId
    )
    
    console.log('✅ Property created with ID:', propertyId)
    
    // Verify the property was saved by retrieving it
    const userProperties = await PropertyService.getPropertiesFromUserProfile(testUserId)
    console.log('📋 User properties after creation:', userProperties.length)
    
    // Find the created property
    const createdProperty = userProperties.find(p => p.id === propertyId)
    
    if (createdProperty) {
      console.log('✅ Property found in user subcollection:', createdProperty.name)
      
      return NextResponse.json({
        success: true,
        message: 'Property saved to user subcollection successfully',
        propertyId,
        propertyName: createdProperty.name,
        firestorePath: `/users/${testUserId}/properties/${propertyId}`,
        totalUserProperties: userProperties.length,
        createdProperty: {
          id: createdProperty.id,
          name: createdProperty.name,
          address: createdProperty.address,
          bedrooms: createdProperty.bedrooms,
          bathrooms: createdProperty.bathrooms,
          hasPool: createdProperty.hasPool,
          coverPhoto: createdProperty.coverPhoto,
          status: createdProperty.status
        }
      })
    } else {
      console.error('❌ Property not found in user subcollection')
      return NextResponse.json({
        success: false,
        error: 'Property was created but not found in user subcollection',
        propertyId,
        totalUserProperties: userProperties.length
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error testing onboarding property save:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
