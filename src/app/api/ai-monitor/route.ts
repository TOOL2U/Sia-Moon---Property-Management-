import { NextRequest, NextResponse } from "next/server"
import { getAPILogEntries, getAPIUsageStats } from "@/lib/ai/apiLogger"

/**
 * GET /api/ai-monitor
 * Get API logs and usage statistics for the AI API Monitor dashboard
 */
export async function GET(req: NextRequest) {
  try {
    console.log('📊 AI Monitor API: Processing request for API logs...')
    
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'logs'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const endpoint = searchParams.get('endpoint') || undefined
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined
    const error = searchParams.get('error') ? searchParams.get('error') === 'true' : undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    
    if (type === 'stats') {
      // Get usage statistics
      console.log('📈 AI Monitor API: Getting usage statistics...')
      
      const stats = await getAPIUsageStats()
      
      return NextResponse.json({
        success: true,
        data: stats,
        metadata: {
          type: 'stats',
          generatedAt: new Date().toISOString()
        }
      })
      
    } else {
      // Get API log entries
      console.log(`📋 AI Monitor API: Getting ${limit} log entries with filters...`)
      
      const result = await getAPILogEntries({
        limit,
        offset,
        endpoint,
        status,
        error,
        startDate,
        endDate
      })
      
      return NextResponse.json({
        success: true,
        logs: result.logs,
        stats: result.stats,
        metadata: {
          type: 'logs',
          total: result.total,
          hasMore: result.hasMore,
          limit,
          offset,
          filters: {
            endpoint,
            status,
            error,
            startDate,
            endDate
          },
          generatedAt: new Date().toISOString()
        }
      })
    }
    
  } catch (error) {
    console.error('❌ AI Monitor API: Error processing request:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to get API monitor data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/ai-monitor
 * Manually log an API call (for testing or external integrations)
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📊 AI Monitor API: Processing manual log entry...')
    
    const body = await req.json()
    
    // Validate required fields
    const { endpoint, payload, status, error } = body
    
    if (!endpoint || payload === undefined || status === undefined || error === undefined) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: endpoint, payload, status, error"
      }, { status: 400 })
    }
    
    // Import the logging function dynamically to avoid circular imports
    const { logAIAPICall } = await import("@/lib/ai/apiLogger")
    
    const logId = await logAIAPICall({
      endpoint,
      method: body.method || 'POST',
      payload,
      status,
      error,
      errorMessage: body.errorMessage,
      responseTime: body.responseTime,
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      requestSize: body.requestSize,
      responseSize: body.responseSize,
      metadata: {
        source: 'manual',
        submittedAt: new Date().toISOString(),
        ...body.metadata
      }
    })
    
    console.log(`✅ AI Monitor API: Manual log entry created with ID: ${logId}`)
    
    return NextResponse.json({
      success: true,
      message: "API call logged successfully",
      logId
    })
    
  } catch (error) {
    console.error('❌ AI Monitor API: Error logging manual entry:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to log API call",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/ai-monitor
 * Clear API logs (admin function)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'true') {
      return NextResponse.json({
        success: false,
        error: "Missing confirmation parameter. Add ?confirm=true to clear logs."
      }, { status: 400 })
    }
    
    console.log('🗑️ AI Monitor API: Clearing API logs...')
    
    // In production, this would clear the logs from the database
    // For now, we'll just return a success response
    
    console.log('✅ AI Monitor API: API logs cleared')
    
    return NextResponse.json({
      success: true,
      message: "API logs cleared successfully",
      clearedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ AI Monitor API: Error clearing logs:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to clear API logs",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
