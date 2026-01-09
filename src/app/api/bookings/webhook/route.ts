/**
 * Booking Webhook Integration API - Phase 4
 * Integrates job creation with existing PMS webhook system
 */

import { NextRequest, NextResponse } from 'next/server'
import BookingJobHookService, { BookingEvent } from '@/services/BookingJobHookService'

/**
 * POST /api/bookings/webhook
 * Handle booking lifecycle events and trigger job operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook payload
    if (!body.bookingId || !body.eventType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bookingId, eventType'
      }, { status: 400 })
    }

    const { eventType, booking } = body

    console.log(`📨 Booking webhook received: ${eventType} for ${body.bookingId}`)

    let result

    switch (eventType) {
      case 'booking.confirmed':
        // Validate booking data
        const validation = BookingJobHookService.validateBookingForJobs(booking)
        if (!validation.valid) {
          return NextResponse.json({
            success: false,
            error: `Invalid booking data: ${validation.errors.join(', ')}`
          }, { status: 400 })
        }

        // Create jobs for confirmed booking
        result = await BookingJobHookService.handleBookingConfirmed(booking)
        
        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Created ${result.jobsCreated.length} jobs for booking ${body.bookingId}`,
          jobsCreated: result.jobsCreated
        })

      case 'booking.modified':
        // Handle booking modification
        result = await BookingJobHookService.handleBookingModified({
          bookingId: body.bookingId,
          changes: body.changes || {}
        })

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Modified ${result.modifiedJobs.length} jobs for booking ${body.bookingId}`,
          modifiedJobs: result.modifiedJobs,
          unassignedJobs: result.unassignedJobs
        })

      case 'booking.cancelled':
        // Handle booking cancellation
        result = await BookingJobHookService.handleBookingCancelled(body.bookingId)

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Cancelled ${result.cancelledJobs.length} jobs for booking ${body.bookingId}`,
          cancelledJobs: result.cancelledJobs,
          releasedStaff: result.releasedStaff
        })

      default:
        console.log(`⚠️ Unhandled booking event type: ${eventType}`)
        return NextResponse.json({
          success: true,
          message: 'Event type not handled by job engine'
        })
    }

  } catch (error) {
    console.error('❌ Error in booking webhook:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET /api/bookings/{bookingId}/jobs
 * Get job summary for a specific booking
 */
export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split('/')
    const bookingId = pathParts[pathParts.indexOf('bookings') + 1]

    if (!bookingId || bookingId === 'webhook') {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 })
    }

    const result = await BookingJobHookService.getBookingJobsSummary(bookingId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        summary: {}
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      bookingId,
      summary: result.summary
    })

  } catch (error) {
    console.error('❌ Error getting booking jobs summary:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      summary: {}
    }, { status: 500 })
  }
}
