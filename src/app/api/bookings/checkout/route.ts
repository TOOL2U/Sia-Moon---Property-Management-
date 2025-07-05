import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/dbService'

/**
 * API Route: POST /api/bookings/checkout
 * 
 * Handles booking checkout process and automatically creates cleaning tasks.
 * This endpoint should be called when a booking's checkout date is recorded
 * or when the booking status changes to indicate checkout has occurred.
 * 
 * Request Body:
 * {
 *   bookingId: string - The ID of the booking being checked out
 *   actualCheckout?: string - Optional actual checkout timestamp (ISO string)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   booking?: Booking - Updated booking data
 *   cleaningTask?: Task - Created cleaning task data
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, actualCheckout } = body

    // Validate required fields
    if (!bookingId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking ID is required' 
        },
        { status: 400 }
      )
    }

    console.log('🔄 Processing checkout for booking:', bookingId)

    // Get the booking details
    const { data: booking, error: bookingError } = await DatabaseService.getBooking(bookingId)
    
    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking not found' 
        },
        { status: 404 }
      )
    }

    // Update booking with actual checkout time if provided
    let updatedBooking = booking
    if (actualCheckout) {
      const { data: updated, error: updateError } = await DatabaseService.updateBooking(
        bookingId, 
        { 
          // Add actual_checkout field if your schema supports it
          // For now, we'll just ensure the status is updated
          status: 'confirmed' as const,
          updated_at: new Date().toISOString()
        }
      )
      
      if (updateError) {
        console.error('❌ Failed to update booking:', updateError)
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to update booking checkout' 
          },
          { status: 500 }
        )
      }
      
      updatedBooking = updated || booking
    }

    // Create cleaning task for the booking
    console.log('🧹 Creating cleaning task for booking checkout')
    const { data: cleaningTask, error: taskError } = await DatabaseService.createCleaningTaskForBooking(bookingId)

    if (taskError) {
      console.error('❌ Failed to create cleaning task:', taskError)
      
      // If task creation fails, we still want to return success for the checkout
      // but indicate that the cleaning task creation failed
      return NextResponse.json({
        success: true,
        booking: updatedBooking,
        message: 'Checkout processed successfully, but failed to create cleaning task',
        warning: taskError.message
      })
    }

    console.log('✅ Checkout processed and cleaning task created successfully')

    // TODO: Send email notification to assigned staff member
    // This would integrate with the task notification system
    if (cleaningTask) {
      try {
        // Get staff member details for notification
        const { data: staffMember } = await DatabaseService.getUser(cleaningTask.assigned_to)
        
        if (staffMember) {
          // Get property details
          const { data: property } = await DatabaseService.getProperty(booking.property_id)
          
          // Here you could send the notification
          // For now, we'll just log it
          console.log('📧 Would send notification to:', {
            staff: staffMember.email,
            task: cleaningTask.title,
            property: property?.name
          })
          
          // In a real implementation, you might call:
          // await sendTaskNotification({
          //   task: cleaningTask,
          //   assignee: staffMember,
          //   property: property ? {
          //     id: property.id,
          //     name: property.name,
          //     location: property.location
          //   } : undefined
          // })
        }
      } catch (notificationError) {
        console.warn('⚠️ Failed to send task notification:', notificationError)
        // Don't fail the entire request for notification errors
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      cleaningTask,
      message: 'Checkout processed and cleaning task created successfully'
    })

  } catch (error) {
    console.error('❌ Error processing booking checkout:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while processing checkout' 
      },
      { status: 500 }
    )
  }
}

/**
 * API Route: GET /api/bookings/checkout
 * 
 * Get information about checkout processing capabilities
 */
export async function GET() {
  return NextResponse.json({
    message: 'Booking checkout API endpoint',
    methods: ['POST'],
    description: 'Handles booking checkout and automatic cleaning task creation',
    usage: {
      endpoint: '/api/bookings/checkout',
      method: 'POST',
      body: {
        bookingId: 'string (required)',
        actualCheckout: 'string (optional ISO date)'
      }
    }
  })
}
