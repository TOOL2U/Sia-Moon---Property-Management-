import { NextRequest, NextResponse } from 'next/server'
import { OnboardingService } from '@/lib/services/onboardingService'

// Helper function to safely convert values for Firebase (no undefined values allowed)
function safeValue(value: unknown, defaultValue: unknown): unknown {
  if (value === undefined || value === null) {
    return defaultValue
  }
  return value
}

// Utility function to remove all undefined fields from data object
function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  )
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
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      property_name: data.property_name,
      timestamp: new Date().toISOString()
    })

    console.log('🔍 Full webhook data keys:', Object.keys(data))

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

    // Store in Firebase - remove undefined values before submission
    const cleanedData = removeUndefined(submissionData)
    const submissionId = await OnboardingService.createSubmission(cleanedData as Parameters<typeof OnboardingService.createSubmission>[0])
    console.log('✅ Onboarding submission stored in Firebase:', submissionId)

    // Also add property to user's profile for client matching
    try {
      console.log('🏠 Adding property to user profile for client matching...')

      // Import ProfileService
      const { ProfileService } = await import('@/lib/services/profileService')

      // Find user by email if user_id is not provided
      let userId = data.user_id
      const emailToSearch = data.email || data.ownerEmail

      console.log('🔍 User lookup details:', {
        provided_user_id: data.user_id,
        email_field: data.email,
        ownerEmail_field: data.ownerEmail,
        email_to_search: emailToSearch
      })

      if (!userId && emailToSearch) {
        console.log('🔍 User ID not provided, finding user by email:', emailToSearch)
        userId = await ProfileService.findUserByEmail(emailToSearch)

        // If not found with primary email, try alternative email patterns
        if (!userId) {
          console.log('🔍 Primary email not found, trying alternative email patterns...')

          // Try different email variations
          const emailVariations = [
            data.email,
            data.ownerEmail,
            // Try switching domains
            emailToSearch.includes('@siamoon.com') ? emailToSearch.replace('@siamoon.com', '@gmail.com') : null,
            emailToSearch.includes('@gmail.com') ? emailToSearch.replace('@gmail.com', '@siamoon.com') : null
          ].filter(Boolean)

          for (const emailVariation of emailVariations) {
            if (emailVariation && emailVariation !== emailToSearch) {
              console.log('🔍 Trying email variation:', emailVariation)
              userId = await ProfileService.findUserByEmail(emailVariation)
              if (userId) {
                console.log('✅ Found user with email variation:', emailVariation)
                break
              }
            }
          }
        }

        if (!userId) {
          console.log('⚠️ No user found with any email variation')
          console.log('💡 User may need to sign up first before onboarding')
          return NextResponse.json({
            success: true,
            message: 'Onboarding submitted successfully. Please sign up to link this property to your account.',
            submissionId
          })
        }
        console.log('✅ Found user by email:', userId)
      }

      if (!userId) {
        console.log('⚠️ No user ID available, skipping property creation')
        return NextResponse.json({
          success: true,
          message: 'Onboarding submitted successfully. Property will be linked when you sign up.',
          submissionId
        })
      }

      // Create property data for profile
      const propertyName = data.property_name || data.propertyName || 'Unnamed Property'
      const propertyAddress = data.property_address || data.propertyAddress || 'Address not provided'
      const bedrooms = parseInt(String(data.bedrooms || 0)) || 0
      const bathrooms = parseInt(String(data.bathrooms || 0)) || 0

      console.log('🔍 Property data mapping:', {
        property_name: data.property_name,
        propertyName: data.propertyName,
        final_name: propertyName,
        property_address: data.property_address,
        propertyAddress: data.propertyAddress,
        final_address: propertyAddress,
        bedrooms,
        bathrooms
      })

      const propertyData = {
        name: propertyName,
        address: propertyAddress,
        description: `Property managed by Sia Moon Property Management. ${String(data.notes || '')}`.trim(),
        bedrooms,
        bathrooms,
        maxGuests: bedrooms ? bedrooms * 2 : 4,
        amenities: [],
        images: Array.isArray(data.uploaded_photos) ? data.uploaded_photos : [],
        pricePerNight: 0,
        currency: 'THB',
        status: 'pending_approval' as const
      }

      // Create property in user's properties subcollection using new method
      console.log('🏠 Creating property in user subcollection with full onboarding data')
      const propertyId = await ProfileService.createPropertyInUserSubcollection(userId, data)

      // Also add to legacy profile array for backward compatibility
      if (propertyId) {
        console.log('🏠 Adding to legacy profile array for backward compatibility')
        await ProfileService.addPropertyToProfile(userId, propertyData)
      }

      if (propertyId) {
        console.log('✅ Property added to user profile successfully:', propertyId)
        return NextResponse.json({
          success: true,
          message: 'Onboarding submitted successfully and property created!',
          submissionId,
          propertyId
        })
      } else {
        console.error('❌ Failed to add property to user profile')
        return NextResponse.json({
          success: true,
          message: 'Onboarding submitted successfully, but property creation failed.',
          submissionId
        })
      }

    } catch (profileError) {
      console.error('❌ Error adding property to profile:', profileError)
      // Don't fail the whole request if profile update fails
      return NextResponse.json({
        success: true,
        message: 'Onboarding submitted successfully, but property creation failed.',
        submissionId
      })
    }

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
