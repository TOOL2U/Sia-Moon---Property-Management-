import { NextRequest, NextResponse } from 'next/server'
import { OnboardingService } from '@/lib/services/onboardingService'

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
      ownerFullName: data.name || '',
      ownerEmail: data.email || '',
      ownerContactNumber: data.phone || '',
      ownerNationality: data.nationality || '',
      preferredContactMethod: data.preferred_contact_method || '',
      bankDetails: data.bank_details || '',

      // Property Details
      propertyName: data.property_name || '',
      propertyAddress: data.property_address || '',
      googleMapsUrl: data.google_maps_url || '',
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      landSizeSqm: data.land_size_sqm || 0,
      villaSizeSqm: data.villa_size_sqm || 0,
      yearBuilt: data.year_built || 0,

      // Amenities
      hasPool: data.has_pool || false,
      hasGarden: data.has_garden || false,
      hasAirConditioning: data.has_air_conditioning || false,
      internetProvider: data.internet_provider || '',
      hasParking: data.has_parking || false,
      hasLaundry: data.has_laundry || false,
      hasBackupPower: data.has_backup_power || false,

      // Access & Staff
      accessDetails: data.access_details || '',
      hasSmartLock: data.has_smart_lock || false,
      gateRemoteDetails: data.gate_remote_details || '',
      onsiteStaff: data.onsite_staff || '',

      // Utilities
      electricityProvider: data.electricity_provider || '',
      waterSource: data.water_source || '',
      internetPackage: data.internet_package || '',

      // Smart Electric System
      hasSmartElectricSystem: data.has_smart_electric_system || false,
      smartSystemBrand: data.smart_system_brand || '',
      smartDevicesControlled: data.smart_devices_controlled || [],
      smartDevicesOther: data.smart_devices_other || '',
      canControlManuallyWifiDown: data.can_control_manually_wifi_down || false,
      smartSystemAppPlatform: data.smart_system_app_platform || '',
      hasHubGateway: data.has_hub_gateway || false,
      hubGatewayLocation: data.hub_gateway_location || '',
      linkedToPropertyWifi: data.linked_to_property_wifi || false,
      controlAccountOwner: data.control_account_owner || '',
      controlAccountOwnerOther: data.control_account_owner_other || '',
      loginCredentialsProvided: data.login_credentials_provided || false,
      loginCredentialsDetails: data.login_credentials_details || '',
      hasActiveSchedulesAutomations: data.has_active_schedules_automations || false,
      schedulesAutomationsDetails: data.schedules_automations_details || '',
      smartSystemSpecialInstructions: data.smart_system_special_instructions || '',

      // Rental & Marketing
      rentalRates: data.rental_rates || '',
      platformsListed: data.platforms_listed || [],
      averageOccupancyRate: data.average_occupancy_rate || '',
      minimumStayRequirements: data.minimum_stay_requirements || '',
      targetGuests: data.target_guests || '',
      ownerBlackoutDates: data.owner_blackout_dates || '',

      // Preferences & Rules
      petsAllowed: data.pets_allowed || false,
      partiesAllowed: data.parties_allowed || false,
      smokingAllowed: data.smoking_allowed || false,
      maintenanceAutoApprovalLimit: data.maintenance_auto_approval_limit || '',

      // Current Condition
      repairsNeeded: data.repairs_needed || '',

      // Photos & Media
      professionalPhotosStatus: data.professional_photos_status || '',
      floorPlanImagesAvailable: data.floor_plan_images_available || false,
      videoWalkthroughAvailable: data.video_walkthrough_available || false,
      uploadedPhotos: data.uploaded_photos || [],

      // Emergency Contact
      emergencyContactName: data.emergency_contact_name || '',
      emergencyContactPhone: data.emergency_contact_phone || '',

      // Additional Notes
      notes: data.notes || '',

      // Status
      status: 'pending' as const
    }

    // Store in Firebase
    const submissionId = await OnboardingService.createSubmission(submissionData)
    
    console.log('✅ Onboarding submission stored in Firebase:', submissionId)

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
