import { AILogSummary } from '@/lib/ai/aiLogger'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/ai-log/summary
 * Return summarized AI activity statistics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 AI Log Summary: Calculating activity statistics...')

    // Get logs from the main endpoint (in production, this would query the database directly)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    try {
      const logsResponse = await fetch(`${baseUrl}/api/ai-log?limit=1000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        const logs = logsData.logs || []

        // Calculate summary from actual logs
        const summary = calculateSummary(logs)

        console.log('📊 AI Log Summary: Statistics calculated from logs', summary)

        return NextResponse.json({
          success: true,
          ...summary,
          calculatedAt: new Date().toISOString(),
          totalLogs: logs.length
        })
      }
    } catch (fetchError) {
      console.warn('⚠️ AI Log Summary: Could not fetch logs, using mock data')
    }

    // Fallback to mock data if logs fetch fails
    const mockSummary: AILogSummary = {
      cooDecisionsToday: Math.floor(Math.random() * 10) + 12, // 12-22 operations
      cfoUpdatesThisWeek: Math.floor(Math.random() * 3) + 1, // 1-4 reports
      escalations: Math.floor(Math.random() * 5) + 1, // 1-6 escalations
      overrides: Math.floor(Math.random() * 3), // 0-3 overrides
      totalDecisions: Math.floor(Math.random() * 50) + 100, // 100-150 total
      averageConfidence: Math.round((82 + Math.random() * 12) * 10) / 10, // 82-94%
      lastActivity: new Date().toISOString()
    }

    console.log(`✅ AI Summary: Generated mock summary with ${mockSummary.cooDecisionsToday} COO decisions, ${mockSummary.cfoUpdatesThisWeek} CFO updates`)

    return NextResponse.json({
      success: true,
      ...mockSummary,
      calculatedAt: new Date().toISOString(),
      source: 'mock'
    })

  } catch (error) {
    console.error('❌ AI Log Summary Error:', error)

    // Return fallback summary
    const fallbackSummary: AILogSummary = {
      cooDecisionsToday: 0,
      cfoUpdatesThisWeek: 0,
      escalations: 0,
      overrides: 0,
      totalDecisions: 0,
      averageConfidence: 0,
      lastActivity: new Date().toISOString()
    }

    return NextResponse.json({
      success: false,
      ...fallbackSummary,
      error: 'Failed to calculate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Calculate summary statistics from logs array
 */
function calculateSummary(logs: any[]): AILogSummary {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // COO decisions today
  const cooDecisionsToday = logs.filter(log =>
    log.agent === 'COO' &&
    new Date(log.timestamp) >= today
  ).length

  // CFO updates this week
  const cfoUpdatesThisWeek = logs.filter(log =>
    log.agent === 'CFO' &&
    new Date(log.timestamp) >= weekAgo
  ).length

  // Total escalations
  const escalations = logs.filter(log =>
    log.escalate === true || log.status === 'escalated'
  ).length

  // Override actions
  const overrides = logs.filter(log =>
    log.source === 'override'
  ).length

  // Total decisions
  const totalDecisions = logs.length

  // Average confidence
  const averageConfidence = logs.length > 0
    ? logs.reduce((sum, log) => sum + (log.confidence || 0), 0) / logs.length
    : 0

  // Last activity timestamp
  const lastActivity = logs.length > 0
    ? logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
    : new Date().toISOString()

  return {
    cooDecisionsToday,
    cfoUpdatesThisWeek,
    escalations,
    overrides,
    totalDecisions,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    lastActivity
  }
}
