import { NextRequest, NextResponse } from 'next/server'
import { BookingSyncService } from '@/lib/bookingSync/bookingSyncService'

/**
 * API Route: POST /api/booking-sync/all
 * 
 * Trigger booking sync for all properties with sync enabled
 * This endpoint is typically called by cron jobs or manual triggers
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting sync for all properties via API')

    // Optional: Add authentication/authorization here
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      // For now, we'll proceed without auth but this should be implemented
      console.log('⚠️  No authorization header provided')
    }
    // if (!authHeader || authHeader !== `Bearer ${process.env.SYNC_API_KEY}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const startTime = Date.now()
    
    // Sync all properties
    const results = await BookingSyncService.syncAllProperties()
    
    const totalDuration = Date.now() - startTime

    // Calculate summary statistics
    const summary = {
      total_properties: results.length,
      successful_syncs: results.filter(r => r.success).length,
      failed_syncs: results.filter(r => !r.success).length,
      total_bookings_found: results.reduce((sum, r) => sum + r.totalBookingsFound, 0),
      total_new_bookings: results.reduce((sum, r) => sum + r.newBookingsCreated, 0),
      total_updated_bookings: results.reduce((sum, r) => sum + r.existingBookingsUpdated, 0),
      total_cleaning_tasks: results.reduce((sum, r) => sum + r.cleaningTasksCreated, 0),
      total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      sync_duration_ms: totalDuration
    }

    console.log('✅ Completed sync for all properties:', summary)

    return NextResponse.json({
      success: summary.failed_syncs === 0,
      summary,
      results,
      message: `Synced ${summary.successful_syncs}/${summary.total_properties} properties successfully`
    })

  } catch (error) {
    console.error('❌ Error in sync all API:', error)
    
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
 * API Route: GET /api/booking-sync/all
 * 
 * Get sync status for all properties
 */
export async function GET() {
  try {
    // This would typically return sync statistics and status
    // For now, return basic information
    
    return NextResponse.json({
      success: true,
      message: 'Booking sync API is operational',
      endpoints: {
        sync_all: 'POST /api/booking-sync/all',
        sync_property: 'POST /api/booking-sync/property/[propertyId]',
        get_property_status: 'GET /api/booking-sync/property/[propertyId]',
        update_property_config: 'PUT /api/booking-sync/property/[propertyId]'
      },
      documentation: {
        description: 'Booking sync API for integrating with Airbnb and Booking.com via iCal feeds',
        features: [
          'Parse iCal feeds from multiple platforms',
          'Avoid duplicate bookings',
          'Automatically create cleaning tasks',
          'Support for manual and automated sync'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error in sync status API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
