import { NextRequest, NextResponse } from 'next/server'
import { BookingSyncService } from '@/lib/bookingSync/bookingSyncService'
import DatabaseService from '@/lib/dbService'

/**
 * API Route: POST /api/booking-sync/property/[propertyId]
 * 
 * Manually trigger booking sync for a specific property
 * 
 * Request Body:
 * {
 *   airbnbICalUrl?: string
 *   bookingComICalUrl?: string
 *   enableAutoCleaningTasks?: boolean
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await context.params
    const body = await request.json()
    
    console.log(`🔄 Manual sync triggered for property: ${propertyId}`)

    // Validate property exists
    const { data: property, error: propertyError } = await DatabaseService.getProperty(propertyId)
    if (propertyError || !property) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found' 
        },
        { status: 404 }
      )
    }

    // Use provided URLs or fall back to property configuration
    const syncConfig = {
      propertyId,
      airbnbICalUrl: body.airbnbICalUrl || property.airbnb_ical_url,
      bookingComICalUrl: body.bookingComICalUrl || property.booking_com_ical_url,
      enableAutoCleaningTasks: body.enableAutoCleaningTasks !== false // Default to true
    }

    // Validate that at least one iCal URL is provided
    if (!syncConfig.airbnbICalUrl && !syncConfig.bookingComICalUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one iCal URL must be provided' 
        },
        { status: 400 }
      )
    }

    // Perform sync
    const result = await BookingSyncService.syncPropertyBookings(syncConfig)

    return NextResponse.json({
      success: result.success,
      result,
      message: result.success 
        ? `Sync completed: ${result.newBookingsCreated} new, ${result.existingBookingsUpdated} updated`
        : `Sync failed with ${result.errors.length} errors`
    })

  } catch (error) {
    console.error('❌ Error in property sync API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * API Route: GET /api/booking-sync/property/[propertyId]
 * 
 * Get sync status and configuration for a property
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await context.params

    // Get property details
    const { data: property, error: propertyError } = await DatabaseService.getProperty(propertyId)
    if (propertyError || !property) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found' 
        },
        { status: 404 }
      )
    }

    // Get recent bookings for this property
    const { data: bookings } = await DatabaseService.getBookingsByProperty(propertyId)
    
    // Calculate sync statistics
    const syncedBookings = bookings?.filter(b => b.external_id) || []
    const airbnbBookings = syncedBookings.filter(b => b.platform === 'airbnb')
    const bookingComBookings = syncedBookings.filter(b => b.platform === 'booking_com')

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        sync_enabled: property.sync_enabled,
        airbnb_ical_url: property.airbnb_ical_url,
        booking_com_ical_url: property.booking_com_ical_url,
        last_sync: property.last_sync
      },
      statistics: {
        total_bookings: bookings?.length || 0,
        synced_bookings: syncedBookings.length,
        airbnb_bookings: airbnbBookings.length,
        booking_com_bookings: bookingComBookings.length,
        manual_bookings: (bookings?.length || 0) - syncedBookings.length
      }
    })

  } catch (error) {
    console.error('❌ Error getting property sync status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * API Route: PUT /api/booking-sync/property/[propertyId]
 * 
 * Update sync configuration for a property
 * 
 * Request Body:
 * {
 *   airbnbICalUrl?: string
 *   bookingComICalUrl?: string
 *   syncEnabled?: boolean
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params
    const body = await request.json()

    console.log(`🔄 Updating sync config for property: ${propertyId}`)

    // Validate property exists
    const { data: property, error: propertyError } = await DatabaseService.getProperty(propertyId)
    if (propertyError || !property) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found' 
        },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.airbnbICalUrl !== undefined) {
      updateData.airbnb_ical_url = body.airbnbICalUrl
    }
    
    if (body.bookingComICalUrl !== undefined) {
      updateData.booking_com_ical_url = body.bookingComICalUrl
    }
    
    if (body.syncEnabled !== undefined) {
      updateData.sync_enabled = body.syncEnabled
    }

    // Update property
    const { data: updatedProperty, error: updateError } = await DatabaseService.updateProperty(
      propertyId, 
      updateData
    )

    if (updateError || !updatedProperty) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update property configuration' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: 'Sync configuration updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating property sync config:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
