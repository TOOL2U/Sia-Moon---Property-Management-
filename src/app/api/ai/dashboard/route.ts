/**
 * AI Dashboard API Route
 * Provides AI logs and KPIs for the AI Performance Dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import AILogsService from '@/services/AILogsService'

/**
 * GET /api/ai/dashboard
 * Get AI logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const timeRange = searchParams.get('timeRange') || '24h'
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    console.log('📊 AI Dashboard API: Getting logs with filters:', {
      timeRange,
      type,
      status,
      search,
      page,
      pageSize
    })

    // Build filters
    const filters: any = {}
    
    // Time range filter
    const now = new Date()
    switch (timeRange) {
      case '24h':
        filters.startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        filters.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        filters.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        filters.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
    }

    // Type filter
    if (type !== 'all') {
      filters.type = type
    }

    // Status filter
    if (status !== 'all') {
      filters.status = status
    }

    // Search filter
    if (search) {
      filters.search = search
    }

    // Get logs from service
    const result = await AILogsService.getAILogs(filters, pageSize)
    
    // Get KPIs
    const kpis = await AILogsService.getPerformanceKPIs(filters)

    console.log(`✅ AI Dashboard API: Retrieved ${result.logs.length} logs and KPIs`)

    return NextResponse.json({
      success: true,
      logs: result.logs,
      kpis,
      hasMore: result.hasMore,
      totalCount: result.logs.length
    })

  } catch (error) {
    console.error('❌ AI Dashboard API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch AI dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/dashboard
 * Log a new AI decision
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📝 AI Dashboard API: Logging new AI decision:', body.type)

    // Validate required fields
    if (!body.type || !body.refId || !body.refType || !body.reason || !body.system) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, refId, refType, reason, system'
      }, { status: 400 })
    }

    // Log the AI decision
    const logId = await AILogsService.logAIDecision(body)

    console.log('✅ AI Dashboard API: Decision logged with ID:', logId)

    return NextResponse.json({
      success: true,
      logId,
      message: 'AI decision logged successfully'
    })

  } catch (error) {
    console.error('❌ AI Dashboard API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log AI decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
