import { NextRequest, NextResponse } from 'next/server'
import { OnboardingService } from '@/lib/services/onboardingService'

// Helper function to safely convert values for Firebase (no undefined values allowed)
function safeValue(value: any, defaultValue: any) {
  if (value === undefined || value === null) {
    return defaultValue
  }
  return value
}

/**
 * Webhook endpoint to receive onboarding data from Make.com and store in Firebase
 * This endpoint should be called by Make.com after processing the onboarding form data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Onboarding webhook received')
    
    // Log request headers for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const contentType = request.headers.get('content-type') || 'unknown'
    
    console.log('📋 Request headers:', {
      userAgent,
      contentType,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    })

    // Parse the request body
    const data = await request.json()
    
    console.log('📦 Received onboarding data:', {
      name: data.name,
      email: data.email,
      property_name: data.property_name,
      timestamp: new Date().toISOString()
    })

    // Convert the webhook data to match our OnboardingSubmission interface
    const submissionData = {
      // Owner Details
      ownerFullName: safeValue(data.name, ''),
      ownerEmail: safeValue(data.email, ''),
      ownerContactNumber: safeValue(data.phone, ''),
      ownerNationality: safeValue(data.nationality, ''),
      preferredContactMethod: safeValue(data.preferred_contact_method, ''),
      bankDetails: safeValue(data.bank_details, ''),

      // Property Details
      propertyName: safeValue(data.property_name, ''),
      propertyAddress: safeValue(data.property_address, ''),
      googleMapsUrl: safeValue(data.google_maps_url, ''),
      bedrooms: safeValue(data.bedrooms, 0),
      bathrooms: safeValue(data.bathrooms, 0),
      landSizeSqm: safeValue(data.land_size_sqm, 0),
      villaSizeSqm: safeValue(data.villa_size_sqm, 0),
      yearBuilt: safeValue(data.year_built, 0),

      // Amenities
      hasPool: safeValue(data.has_pool, false),
      hasGarden: safeValue(data.has_garden, false),
      hasAirConditioning: safeValue(data.has_air_conditioning, false),
      internetProvider: safeValue(data.internet_provider, ''),
      hasParking: safeValue(data.has_parking, false),
      hasLaundry: safeValue(data.has_laundry, false),
      hasBackupPower: safeValue(data.has_backup_power, false),

      // Access & Staff
      accessDetails: safeValue(data.access_details, ''),
      hasSmartLock: safeValue(data.has_smart_lock, false),
      gateRemoteDetails: safeValue(data.gate_remote_details, ''),
      onsiteStaff: safeValue(data.onsite_staff, ''),

      // Utilities
      electricityProvider: safeValue(data.electricity_provider, ''),
      waterSource: safeValue(data.water_source, ''),
      internetPackage: safeValue(data.internet_package, ''),

      // Smart Electric System
      hasSmartElectricSystem: safeValue(data.has_smart_electric_system, false),
      smartSystemBrand: safeValue(data.smart_system_brand, ''),
      smartDevicesControlled: safeValue(data.smart_devices_controlled, []),
      smartDevicesOther: safeValue(data.smart_devices_other, ''),
      canControlManuallyWifiDown: safeValue(data.can_control_manually_wifi_down, false),
      smartSystemAppPlatform: safeValue(data.smart_system_app_platform, ''),
      hasHubGateway: safeValue(data.has_hub_gateway, false),
      hubGatewayLocation: safeValue(data.hub_gateway_location, ''),
      linkedToPropertyWifi: safeValue(data.linked_to_property_wifi, false),
      controlAccountOwner: safeValue(data.control_account_owner, ''),
      controlAccountOwnerOther: safeValue(data.control_account_owner_other, ''),
      loginCredentialsProvided: safeValue(data.login_credentials_provided, false),
      loginCredentialsDetails: safeValue(data.login_credentials_details, ''),
      hasActiveSchedulesAutomations: safeValue(data.has_active_schedules_automations, false),
      schedulesAutomationsDetails: safeValue(data.schedules_automations_details, ''),
      smartSystemSpecialInstructions: safeValue(data.smart_system_special_instructions, ''),

      // Rental & Marketing
      rentalRates: safeValue(data.rental_rates, ''),
      platformsListed: safeValue(data.platforms_listed, []),
      averageOccupancyRate: safeValue(data.average_occupancy_rate, ''),
      minimumStayRequirements: safeValue(data.minimum_stay_requirements, ''),
      targetGuests: safeValue(data.target_guests, ''),
      ownerBlackoutDates: safeValue(data.owner_blackout_dates, ''),

      // Preferences & Rules
      petsAllowed: safeValue(data.pets_allowed, false),
      partiesAllowed: safeValue(data.parties_allowed, false),
      smokingAllowed: safeValue(data.smoking_allowed, false),
      maintenanceAutoApprovalLimit: safeValue(data.maintenance_auto_approval_limit, ''),

      // Current Condition
      repairsNeeded: safeValue(data.repairs_needed, ''),

      // Photos & Media
      professionalPhotosStatus: safeValue(data.professional_photos_status, ''),
      floorPlanImagesAvailable: safeValue(data.floor_plan_images_available, false),
      videoWalkthroughAvailable: safeValue(data.video_walkthrough_available, false),
      uploadedPhotos: safeValue(data.uploaded_photos, []),

      // Emergency Contact
      emergencyContactName: safeValue(data.emergency_contact_name, ''),
      emergencyContactPhone: safeValue(data.emergency_contact_phone, ''),

      // Additional Notes
      notes: safeValue(data.notes, ''),

      // Status
      status: 'pending' as const
    }

    // Store in Firebase
    const submissionId = await OnboardingService.createSubmission(submissionData)
    console.log('✅ Onboarding submission stored in Firebase:', submissionId)

    // Also add property to user's profile for client matching
    try {
      console.log('🏠 Adding property to user profile for client matching...')

      // Import ProfileService
      const { ProfileService } = await import('@/lib/services/profileService')

      // Create property data for profile
      const propertyData = {
        name: safeValue(data.property_name, ''),
        address: safeValue(data.property_address, ''),
        description: `Property managed by Sia Moon Property Management. ${safeValue(data.notes, '')}`.trim(),
        bedrooms: safeValue(data.bedrooms, 0),
        bathrooms: safeValue(data.bathrooms, 0),
        maxGuests: safeValue(data.bedrooms, 0) ? safeValue(data.bedrooms, 0) * 2 : 4,
        amenities: [],
        images: safeValue(data.uploaded_photos, []),
        coverPhoto: Array.isArray(data.uploaded_photos) && data.uploaded_photos.length > 0 ? data.uploaded_photos[0] : undefined,
        pricePerNight: 0,
        currency: 'THB',
        status: 'pending_approval' as const
      }

      // Add property to user's profile
      const propertyId = await ProfileService.addPropertyToProfile(data.user_id, propertyData)

      if (propertyId) {
        console.log('✅ Property added to user profile successfully:', propertyId)
      } else {
        console.error('❌ Failed to add property to user profile')
      }

    } catch (profileError) {
      console.error('❌ Error adding property to profile:', profileError)
      // Don't fail the whole request if profile update fails
    }

    return NextResponse.json({
      status: 'success',
      message: 'Onboarding data received and stored successfully',
      submissionId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error processing onboarding webhook:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to process onboarding data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET endpoint for webhook documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/onboarding-webhook',
    method: 'POST',
    description: 'Webhook endpoint to receive onboarding data from Make.com and store in Firebase',
    expectedFields: [
      'name', 'email', 'phone', 'property_name', 'property_address',
      'bedrooms', 'bathrooms', 'has_pool', 'has_garden', 'has_air_conditioning',
      'has_smart_electric_system', 'smart_system_brand', 'smart_devices_controlled',
      // ... add more fields as needed
    ],
    usage: 'Configure Make.com to POST onboarding data to this endpoint after processing',
    timestamp: new Date().toISOString()
  })
}
