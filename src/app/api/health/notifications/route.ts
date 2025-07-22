import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check notification service configuration
    const oneSignalAppId = process.env.ONESIGNAL_APP_ID
    const oneSignalApiKey = process.env.ONESIGNAL_API_KEY
    
    const services: Record<string, string> = {}
    const errors: string[] = []

    // Check OneSignal configuration
    if (oneSignalAppId && oneSignalApiKey) {
      try {
        // Test OneSignal API connectivity
        const oneSignalResponse = await fetch(`https://onesignal.com/api/v1/apps/${oneSignalAppId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${oneSignalApiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        if (oneSignalResponse.ok) {
          services.onesignal = 'healthy'
        } else {
          services.onesignal = 'error'
          errors.push(`OneSignal API returned ${oneSignalResponse.status}`)
        }
      } catch (error) {
        services.onesignal = 'error'
        errors.push(`OneSignal API error: ${error instanceof Error ? error.message : 'Connection failed'}`)
      }
    } else {
      services.onesignal = 'not_configured'
      if (!oneSignalAppId) errors.push('OneSignal App ID not configured')
      if (!oneSignalApiKey) errors.push('OneSignal API Key not configured')
    }

    // Check email service (if configured)
    const emailService = process.env.EMAIL_SERVICE_PROVIDER
    if (emailService) {
      services.email = 'configured'
    } else {
      services.email = 'not_configured'
    }

    // Check SMS service (if configured)
    const smsService = process.env.SMS_SERVICE_PROVIDER
    if (smsService) {
      services.sms = 'configured'
    } else {
      services.sms = 'not_configured'
    }

    const responseTime = Date.now() - startTime
    const hasHealthyService = Object.values(services).some(status => 
      status === 'healthy' || status === 'configured'
    )

    // Notifications are non-critical, so we're more lenient
    const overallStatus = services.onesignal === 'healthy' ? 'healthy' : 
                         hasHealthyService ? 'warning' : 'error'

    const response = {
      status: overallStatus,
      message: overallStatus === 'healthy' ? 'Notification services operational' :
               overallStatus === 'warning' ? 'Some notification services available' :
               'No notification services available',
      responseTime,
      services,
      errors: errors.length > 0 ? errors : undefined,
      capabilities: {
        pushNotifications: services.onesignal === 'healthy',
        emailNotifications: services.email === 'configured',
        smsNotifications: services.sms === 'configured'
      },
      timestamp: new Date().toISOString()
    }

    console.log(`📱 Notification service health check: ${overallStatus} (${responseTime}ms)`)

    return NextResponse.json(response, { 
      status: overallStatus === 'error' ? 503 : 200 
    })

  } catch (error) {
    console.error('❌ Notification service health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Notification health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
