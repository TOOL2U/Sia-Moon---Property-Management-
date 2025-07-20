import { NextRequest, NextResponse } from "next/server"

/**
 * Test Notification API Endpoint
 * 
 * This endpoint allows testing individual notification triggers
 * without going through the full AI decision process
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`🔔 Testing notification type: ${type}`)

    // Import notification service
    const { 
      sendBookingConfirmation, 
      sendJobAssignment, 
      sendEscalationAlert, 
      sendFinancialUploadAlert 
    } = await import('@/lib/notifications/notificationService')

    let result = false
    let details = ''

    switch (type) {
      case 'booking_confirmation':
        result = await sendBookingConfirmation(data)
        details = `Booking confirmation sent to ${data.customerEmail} and ${data.customerPhone}`
        break

      case 'job_assignment':
        result = await sendJobAssignment(data)
        details = `Job assignment sent to ${data.staffEmail} and ${data.staffPhone}, calendar event created`
        break

      case 'escalation_alert':
        result = await sendEscalationAlert(data)
        details = `Escalation alert sent to management for ${data.severity} severity ${data.type}`
        break

      case 'financial_upload_alert':
        result = await sendFinancialUploadAlert(data)
        details = `Financial upload alert sent for ${data.status} file: ${data.fileName}`
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown notification type: ${type}`
        }, { status: 400 })
    }

    console.log(`${result ? '✅' : '❌'} Notification test ${type}: ${result ? 'SUCCESS' : 'FAILED'}`)

    return NextResponse.json({
      success: result,
      type: type,
      details: details,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Test notification error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
