import { NextRequest, NextResponse } from 'next/server'
import { sendVillaSubmissionConfirmation, sendAdminNotification, sendStatusUpdate } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    let result

    switch (type) {
      case 'villa_submission_confirmation':
        result = await sendVillaSubmissionConfirmation(
          data.ownerEmail,
          data.ownerName,
          data.propertyName,
          data.submissionId
        )
        break

      case 'admin_notification':
        result = await sendAdminNotification(data)
        break

      case 'status_update':
        result = await sendStatusUpdate(
          data.ownerEmail,
          data.ownerName,
          data.propertyName,
          data.status,
          data.comments
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
