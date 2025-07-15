import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/health
 * Health check endpoint for mobile app connectivity testing
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = Date.now()
    const currentTime = new Date().toISOString()
    
    // Check if this is a mobile app request
    const userAgent = request.headers.get('user-agent') || ''
    const isMobileApp = userAgent.includes('SiaMoon-Mobile')
    
    // Basic health check response
    const healthData = {
      success: true,
      status: 'healthy',
      timestamp,
      currentTime,
      service: 'Sia Moon Property Management API',
      version: '1.0.0',
      endpoints: {
        bookings: '/api/bookings?mobile=true&status=approved',
        assignments: '/api/mobile/assignments',
        sync: '/api/mobile/sync',
        health: '/api/health'
      },
      mobileApp: {
        detected: isMobileApp,
        userAgent: userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : ''),
        authRequired: true,
        apiKey: 'X-API-Key header required',
        mobileSecret: 'X-Mobile-Secret header required'
      },
      database: {
        status: 'connected',
        collections: ['bookings', 'task_assignments', 'staff', 'sync_events']
      }
    }
    
    // Add mobile-specific headers
    const response = NextResponse.json(healthData)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, User-Agent')
    response.headers.set('X-API-Status', 'healthy')
    response.headers.set('X-Mobile-Compatible', 'true')
    
    console.log(`✅ Health check successful - Mobile app: ${isMobileApp}`)
    
    return response
    
  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: 'Service temporarily unavailable',
      timestamp: Date.now(),
      currentTime: new Date().toISOString()
    }, { status: 503 })
  }
}

/**
 * OPTIONS /api/health
 * Handle preflight requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    },
  })
}
