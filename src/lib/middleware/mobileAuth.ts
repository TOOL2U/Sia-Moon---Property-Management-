import { NextRequest, NextResponse } from 'next/server'

// Mobile API authentication configuration
const MOBILE_API_CONFIG = {
  API_KEY: 'sia-moon-mobile-app-2025-secure-key',
  MOBILE_SECRET: 'mobile-app-sync-2025-secure',
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  }
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface MobileAuthResult {
  success: boolean
  error?: string
  staffId?: string
  deviceId?: string
}

/**
 * Validates mobile API authentication headers
 */
export function validateMobileAuth(request: NextRequest): MobileAuthResult {
  const apiKey = request.headers.get('X-API-Key')
  const mobileSecret = request.headers.get('X-Mobile-Secret')
  const staffId = request.headers.get('X-Staff-ID')
  const deviceId = request.headers.get('X-Device-ID')

  // Validate required headers
  if (!apiKey || !mobileSecret) {
    return {
      success: false,
      error: 'Missing required authentication headers (X-API-Key, X-Mobile-Secret)'
    }
  }

  // Validate API key
  if (apiKey !== MOBILE_API_CONFIG.API_KEY) {
    return {
      success: false,
      error: 'Invalid API key'
    }
  }

  // Validate mobile secret
  if (mobileSecret !== MOBILE_API_CONFIG.MOBILE_SECRET) {
    return {
      success: false,
      error: 'Invalid mobile secret'
    }
  }

  return {
    success: true,
    staffId: staffId || undefined,
    deviceId: deviceId || undefined
  }
}

/**
 * Rate limiting for mobile API endpoints
 */
export function checkRateLimit(apiKey: string): { allowed: boolean; error?: string } {
  const now = Date.now()
  const key = `mobile_api_${apiKey}`
  
  // Get current rate limit data
  const current = rateLimitStore.get(key)
  
  // Reset if window has expired
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + MOBILE_API_CONFIG.RATE_LIMIT.WINDOW_MS
    })
    return { allowed: true }
  }
  
  // Check if limit exceeded
  if (current.count >= MOBILE_API_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${MOBILE_API_CONFIG.RATE_LIMIT.MAX_REQUESTS} requests per hour.`
    }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return { allowed: true }
}

/**
 * Mobile API middleware wrapper
 */
export function withMobileAuth(handler: (request: NextRequest, auth: MobileAuthResult) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Log mobile API request
      console.log(`📱 Mobile API Request: ${request.method} ${request.url}`)
      
      // Validate authentication
      const auth = validateMobileAuth(request)
      if (!auth.success) {
        console.log(`❌ Mobile API Auth Failed: ${auth.error}`)
        return NextResponse.json({
          success: false,
          error: auth.error,
          timestamp: Date.now()
        }, { status: 401 })
      }

      // Check rate limiting
      const rateLimit = checkRateLimit(request.headers.get('X-API-Key')!)
      if (!rateLimit.allowed) {
        console.log(`❌ Mobile API Rate Limited: ${rateLimit.error}`)
        return NextResponse.json({
          success: false,
          error: rateLimit.error,
          timestamp: Date.now()
        }, { status: 429 })
      }

      // Add CORS headers for mobile app
      const response = await handler(request, auth)
      
      // Add mobile-specific headers
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Mobile-Secret, X-Staff-ID, X-Device-ID')
      response.headers.set('X-Mobile-API-Version', '1.0')
      response.headers.set('X-Sync-Timestamp', Date.now().toString())

      console.log(`✅ Mobile API Response: ${response.status}`)
      return response

    } catch (error) {
      console.error('❌ Mobile API Error:', error)
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        timestamp: Date.now()
      }, { status: 500 })
    }
  }
}

/**
 * Standard mobile API error response
 */
export function createMobileErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({
    success: false,
    error,
    timestamp: Date.now()
  }, { status })
}

/**
 * Standard mobile API success response
 */
export function createMobileSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: Date.now()
  })
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000)
