import { NextRequest, NextResponse } from 'next/server'
import { ProfileService } from '@/lib/services/profileService'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing property subcollection structure')
    
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    console.log('🧪 Testing with User ID:', userId)

    // Test data for property creation
    const testPropertyData = {
      // Basic Info
      propertyName: 'Villa Sunset Test',
      propertyAddress: '123 Test Street, Koh Phangan',
      googleMapsUrl: 'https://maps.google.com/test',
      
      // Property Details
      bedrooms: 3,
      bathrooms: 2,
      landSizeSqm: 500,
      villaSizeSqm: 200,
      yearBuilt: 2020,
      
      // Amenities
      hasPool: true,
      hasGarden: true,
      hasAirConditioning: true,
      hasParking: true,
      hasLaundry: true,
      hasBackupPower: false,
      hasSmartLock: false,
      
      // Utilities
      internetProvider: 'Test ISP',
      internetPackage: '100 Mbps',
      electricityProvider: 'Test Electric',
      waterSource: 'Municipal',
      
      // Access & Staff
      accessDetails: 'Key box at entrance',
      gateRemoteDetails: 'Remote in kitchen drawer',
      onsiteStaff: 'Cleaning lady comes twice a week',
      
      // Smart Electric System
      hasSmartElectricSystem: false,
      smartSystemBrand: '',
      smartDevicesControlled: [],
      smartSystemAppPlatform: '',
      hasHubGateway: false,
      hubGatewayLocation: '',
      linkedToPropertyWifi: false,
      controlAccountOwner: '',
      loginCredentialsProvided: false,
      loginCredentialsDetails: '',
      hasActiveSchedulesAutomations: false,
      schedulesAutomationsDetails: '',
      smartSystemSpecialInstructions: '',
      
      // Rental & Marketing
      rentalRates: '5000 THB/night',
      platformsListed: ['Airbnb', 'Booking.com'],
      averageOccupancyRate: '75%',
      minimumStayRequirements: '3 nights',
      targetGuests: 'Families and couples',
      ownerBlackoutDates: 'December 20-31',
      
      // Preferences & Rules
      petsAllowed: false,
      partiesAllowed: false,
      smokingAllowed: false,
      maintenanceAutoApprovalLimit: '5000 THB',
      
      // Current Condition
      repairsNeeded: 'None',
      
      // Photos & Media
      professionalPhotosStatus: 'Available',
      floorPlanImagesAvailable: true,
      videoWalkthroughAvailable: false,
      uploadedPhotos: [],
      
      // Emergency Contact
      emergencyContactName: 'Test Emergency Contact',
      emergencyContactPhone: '+66123456789',
      
      // Additional Notes
      notes: 'Test property created via subcollection structure'
    }

    console.log('🧪 Step 1: Creating property in user subcollection')
    
    // Create property in user subcollection
    const propertyId = await ProfileService.createPropertyInUserSubcollection(userId, testPropertyData)
    
    if (!propertyId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create property in subcollection'
      }, { status: 500 })
    }

    console.log('🧪 Step 2: Retrieving created property')
    
    // Retrieve the created property
    const createdProperty = await ProfileService.getUserProperty(userId, propertyId)
    
    console.log('🧪 Step 3: Getting all user properties')
    
    // Get all user properties
    const allUserProperties = await ProfileService.getUserProperties(userId)

    return NextResponse.json({
      success: true,
      message: 'Property subcollection structure test completed successfully!',
      data: {
        userId,
        propertyId,
        createdProperty,
        allUserProperties,
        propertyCount: allUserProperties.length,
        structure: {
          path: `/users/${userId}/properties/${propertyId}`,
          slugGeneration: 'slugify(property name + address) + timestamp',
          ownershipLinkage: 'property.ownerUserId → userId'
        }
      }
    })

  } catch (error) {
    console.error('❌ Property subcollection test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
