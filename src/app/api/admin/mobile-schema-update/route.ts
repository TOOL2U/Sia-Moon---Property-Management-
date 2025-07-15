import { NextRequest, NextResponse } from 'next/server'
import { runMobileSchemaUpdates } from '@/lib/database/mobileSchemaUpdates'

/**
 * POST /api/admin/mobile-schema-update
 * Run database schema updates for mobile support
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 ADMIN: Running mobile schema updates...')
    
    // Basic authentication check (you can enhance this)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Admin access required'
      }, { status: 401 })
    }
    
    // Run schema updates
    const results = await runMobileSchemaUpdates()
    
    if (results.success) {
      console.log('✅ ADMIN: Mobile schema updates completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Mobile schema updates completed successfully',
        results: results.results,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('⚠️ ADMIN: Mobile schema updates completed with errors')
      return NextResponse.json({
        success: false,
        message: 'Mobile schema updates completed with errors',
        results: results.results,
        errors: results.errors,
        timestamp: new Date().toISOString()
      }, { status: 207 }) // 207 Multi-Status
    }
    
  } catch (error) {
    console.error('❌ ADMIN: Error running mobile schema updates:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to run mobile schema updates',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/mobile-schema-update
 * Check mobile schema status
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Mobile schema update endpoint is available',
      endpoints: {
        POST: 'Run mobile schema updates',
        GET: 'Check endpoint status'
      },
      updates: {
        bookings: 'Add mobile sync fields to existing bookings',
        staff: 'Add mobile sync fields to existing staff records',
        assignments: 'Create sample staff assignments for testing',
        tasks: 'Create sample booking tasks for testing'
      },
      authentication: 'Requires admin authorization header',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Service unavailable'
    }, { status: 503 })
  }
}
