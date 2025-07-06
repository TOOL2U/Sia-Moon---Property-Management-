import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Error logging API endpoint for production
export async function POST(request: NextRequest) {
  try {
    // Only allow error logging in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_ERROR_LOGGING !== 'true') {
      return NextResponse.json({ message: 'Error logging disabled in development' }, { status: 200 })
    }

    const errorData = await request.json()

    // Validate required fields
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Sanitize and prepare data for storage
    const sanitizedError = {
      message: String(errorData.message).substring(0, 1000), // Limit message length
      stack: errorData.stack ? String(errorData.stack).substring(0, 5000) : null,
      level: errorData.level || 'error',
      context: errorData.context ? JSON.stringify(errorData.context) : null,
      component: errorData.component || null,
      user_agent: errorData.userAgent || null,
      url: errorData.url || null,
      user_id: errorData.userId || null,
      timestamp: errorData.timestamp,
      created_at: new Date().toISOString()
    }

    // Store in database if Supabase is available and error_logs table exists
    if (supabase) {
      try {
        const { error: dbError } = await supabase
          .from('error_logs')
          .insert([sanitizedError])

        if (dbError) {
          console.warn('Failed to store error in database (table may not exist):', dbError.message)
          // Continue execution - don't fail the request if DB storage fails
        }
      } catch (dbError) {
        console.warn('Database error while logging (continuing silently):', dbError)
        // Continue execution - this is expected if error_logs table doesn't exist
      }
    }

    // Log to console for immediate visibility
    console.error('Client Error Logged:', {
      level: sanitizedError.level,
      message: sanitizedError.message,
      component: sanitizedError.component,
      url: sanitizedError.url,
      timestamp: sanitizedError.timestamp
    })

    // Send to external monitoring service if configured
    await sendToMonitoringService(sanitizedError)

    return NextResponse.json({ message: 'Error logged successfully' }, { status: 200 })

  } catch (error) {
    console.error('Error in error logging endpoint:', error)
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}

// Send error to external monitoring service
async function sendToMonitoringService(errorData: any) {
  try {
    // Example: Send to webhook for Slack, Discord, etc.
    if (process.env.ERROR_WEBHOOK_URL) {
      const webhookPayload = {
        text: `🚨 Production Error Alert`,
        attachments: [
          {
            color: errorData.level === 'error' ? 'danger' : 'warning',
            fields: [
              {
                title: 'Message',
                value: errorData.message,
                short: false
              },
              {
                title: 'Component',
                value: errorData.component || 'Unknown',
                short: true
              },
              {
                title: 'Level',
                value: errorData.level.toUpperCase(),
                short: true
              },
              {
                title: 'URL',
                value: errorData.url || 'Unknown',
                short: false
              },
              {
                title: 'Timestamp',
                value: errorData.timestamp,
                short: true
              }
            ]
          }
        ]
      }

      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      })
    }

    // Example: Send to email service
    if (process.env.ERROR_EMAIL_ENDPOINT && errorData.level === 'error') {
      await fetch(process.env.ERROR_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL,
          subject: `Production Error: ${errorData.component || 'Application'}`,
          html: `
            <h2>Production Error Alert</h2>
            <p><strong>Message:</strong> ${errorData.message}</p>
            <p><strong>Component:</strong> ${errorData.component || 'Unknown'}</p>
            <p><strong>URL:</strong> ${errorData.url || 'Unknown'}</p>
            <p><strong>Timestamp:</strong> ${errorData.timestamp}</p>
            ${errorData.stack ? `<p><strong>Stack Trace:</strong><br><pre>${errorData.stack}</pre></p>` : ''}
            ${errorData.context ? `<p><strong>Context:</strong><br><pre>${errorData.context}</pre></p>` : ''}
          `
        })
      })
    }

  } catch (monitoringError) {
    console.error('Failed to send to monitoring service:', monitoringError)
    // Don't throw - this is a best-effort operation
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ message: 'Error logging endpoint - POST only' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ message: 'Error logging endpoint - POST only' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ message: 'Error logging endpoint - POST only' }, { status: 405 })
}
