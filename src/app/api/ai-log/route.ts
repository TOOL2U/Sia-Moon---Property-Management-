import { AILogEntry } from '@/lib/ai/aiLogger'
import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for development (replace with database in production)
let aiLogs: AILogEntry[] = []

// Initialize with mock data for development
if (aiLogs.length === 0) {
  aiLogs = generateMockLogs()
}

/**
 * POST /api/ai-log
 * Central logging endpoint for all AI agent decisions and actions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 AI Log: Receiving log entry...')

    // Parse request body
    const body = await request.json()

    // Validate log entry format
    const validationResult = validateLogEntry(body)

    if (!validationResult.isValid) {
      console.error('❌ AI Log: Invalid log entry format:', validationResult.errors)

      return NextResponse.json({
        success: false,
        error: 'Invalid log entry format',
        details: validationResult.errors
      }, { status: 400 })
    }

    const logEntry: AILogEntry = body

    // Console log for immediate visibility
    console.log(`🤖 AI ${logEntry.agent} Decision:`, {
      timestamp: logEntry.timestamp,
      decision: logEntry.decision,
      confidence: `${logEntry.confidence}%`,
      escalation: logEntry.escalation ? '🚨 ESCALATED' : '✅ Auto-resolved',
      source: logEntry.source,
      notes: logEntry.notes || 'No additional notes'
    })

    // Store the log entry (currently console-based, future: database)
    await storeLogEntry(logEntry)

    return NextResponse.json({
      success: true,
      message: 'Log entry stored successfully',
      logId: generateLogId(logEntry),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI Log Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to store log entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/ai-log
 * Retrieve AI logs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const agent = searchParams.get('agent') // 'COO' | 'CFO'
    const escalation = searchParams.get('escalation') // 'true' | 'false'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log(`📊 AI Log: Retrieving logs (agent: ${agent || 'all'}, escalation: ${escalation || 'all'})`)

    // Future: Query database with filters
    // For now, return mock data structure
    const logs = await retrieveLogs({ agent, escalation, limit, offset })

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        limit,
        offset,
        total: logs.length,
        hasMore: false // Future: implement proper pagination
      },
      filters: {
        agent: agent || 'all',
        escalation: escalation || 'all'
      }
    })

  } catch (error) {
    console.error('❌ AI Log Retrieval Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Validate incoming log entry against AILogEntry interface
 */
function validateLogEntry(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields validation
  if (!body.timestamp || typeof body.timestamp !== 'string') {
    errors.push('timestamp is required and must be a string')
  } else {
    // Validate ISO timestamp format
    const date = new Date(body.timestamp)
    if (isNaN(date.getTime())) {
      errors.push('timestamp must be a valid ISO date string')
    }
  }

  if (!body.agent || typeof body.agent !== 'string') {
    errors.push('agent is required and must be a string')
  } else {
    // Validate agent type
    if (!['COO', 'CFO'].includes(body.agent)) {
      errors.push('agent must be either "COO" or "CFO"')
    }
  }

  if (!body.decision || typeof body.decision !== 'string') {
    errors.push('decision is required and must be a string')
  }

  if (typeof body.confidence !== 'number') {
    errors.push('confidence is required and must be a number')
  } else {
    // Validate confidence range
    if (body.confidence < 0 || body.confidence > 100) {
      errors.push('confidence must be between 0 and 100')
    }
  }

  if (!body.source || typeof body.source !== 'string') {
    errors.push('source is required and must be a string')
  }

  // Optional fields validation
  if (body.escalate !== undefined && typeof body.escalate !== 'boolean') {
    errors.push('escalate must be a boolean if provided')
  }

  if (body.notes !== undefined && typeof body.notes !== 'string') {
    errors.push('notes must be a string if provided')
  }

  if (body.rationale !== undefined && typeof body.rationale !== 'string') {
    errors.push('rationale must be a string if provided')
  }

  if (body.status !== undefined && typeof body.status !== 'string') {
    errors.push('status must be a string if provided')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Store log entry to in-memory storage (future: database integration)
 */
async function storeLogEntry(logEntry: AILogEntry): Promise<void> {
  try {
    // Add to in-memory storage
    const logWithId = {
      ...logEntry,
      id: logEntry.id || generateLogId(logEntry)
    }

    aiLogs.unshift(logWithId) // Add to beginning for newest first

    // Keep only last 1000 entries to prevent memory issues
    if (aiLogs.length > 1000) {
      aiLogs = aiLogs.slice(0, 1000)
    }

    // Enhanced console logging
    const logLevel = logEntry.escalate ? 'WARN' : 'INFO'

    console.log(`[${logLevel}] AI-${logEntry.agent}-${logWithId.id}:`, {
      timestamp: logEntry.timestamp,
      decision: logEntry.decision,
      confidence: logEntry.confidence,
      source: logEntry.source,
      escalate: logEntry.escalate,
      status: logEntry.status,
      notes: logEntry.notes
    })

    console.log(`✅ AI Log: Entry ${logWithId.id} stored successfully (${aiLogs.length} total logs)`)

  } catch (error) {
    console.error('❌ AI Log Storage Error:', error)
    throw new Error('Failed to store log entry')
  }
}

/**
 * Retrieve logs with filtering from in-memory storage
 */
async function retrieveLogs(filters: {
  agent?: string | null
  escalation?: string | null
  limit: number
  offset: number
}): Promise<AILogEntry[]> {

  console.log('📊 AI Log: Retrieving logs with filters:', filters)

  let filteredLogs = [...aiLogs]

  // Apply agent filter
  if (filters.agent && filters.agent !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.agent === filters.agent)
  }

  // Apply escalation filter
  if (filters.escalation && filters.escalation !== 'all') {
    const isEscalated = filters.escalation === 'true'
    filteredLogs = filteredLogs.filter(log => log.escalate === isEscalated)
  }

  // Apply pagination
  const startIndex = filters.offset
  const endIndex = startIndex + filters.limit
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  console.log(`📊 AI Log: Returning ${paginatedLogs.length} logs (${filteredLogs.length} total after filtering)`)

  return paginatedLogs
}

/**
 * Generate unique log ID for tracking
 */
function generateLogId(logEntry: AILogEntry): string {
  const timestamp = new Date(logEntry.timestamp).getTime()
  const agentPrefix = logEntry.agent.toLowerCase()
  const random = Math.random().toString(36).substring(2, 8)

  return `${agentPrefix}_${timestamp}_${random}`
}

/**
 * Generate mock logs for development
 */
function generateMockLogs(): AILogEntry[] {
  const decisions = [
    'Booking approved for Villa Lotus',
    'Staff assigned to cleaning task',
    'High-value expense flagged for review',
    'Financial analysis completed',
    'Emergency repair request escalated',
    'Monthly budget analysis finished',
    'Booking rejected - insufficient data',
    'Duplicate expense detected',
    'Maintenance scheduled for Ocean View Villa',
    'Budget variance analysis completed',
    'Guest complaint escalated to management',
    'Automatic invoice processing completed',
    'Property inspection scheduled',
    'Revenue optimization analysis',
    'Staff performance review completed'
  ]

  const agents: ('COO' | 'CFO')[] = ['COO', 'CFO']
  const sources: AILogEntry['source'][] = ['booking', 'finance', 'maintenance', 'staff', 'general', 'override']

  return Array.from({ length: 30 }, (_, i) => {
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const confidence = Math.floor(Math.random() * 40) + 60 // 60-100
    const escalate = confidence < 70 || Math.random() < 0.15 // Low confidence or 15% random escalation
    const source = sources[Math.floor(Math.random() * sources.length)]

    return {
      id: `log_${Date.now() - i * 1000}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
      agent,
      decision: decisions[Math.floor(Math.random() * decisions.length)],
      confidence,
      rationale: `AI ${agent} analysis based on current data and historical patterns`,
      escalate,
      source,
      status: escalate ? 'escalated' : 'completed',
      notes: Math.random() < 0.3 ? `Generated at ${new Date().toLocaleTimeString()}` : undefined,
      metadata: {
        processingTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
        dataPoints: Math.floor(Math.random() * 50) + 10,
        version: '1.0.0'
      }
    }
  })
}

/**
 * DELETE /api/ai-log
 * Clear logs (admin only - future implementation)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Future: Add admin authentication check
    console.log('🗑️ AI Log: Clear logs requested (not implemented)')

    return NextResponse.json({
      success: false,
      error: 'Log clearing not implemented yet',
      message: 'This feature will be available in future versions'
    }, { status: 501 })

  } catch (error) {
    console.error('❌ AI Log Clear Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to clear logs'
    }, { status: 500 })
  }
}
