import { NextRequest, NextResponse } from 'next/server'
import { AILogEntry } from '@/types/ai'
import { logAIDecision } from '@/middleware/aiLogger'

// Override data interface
interface OverrideRequest {
  logId: string
  originalLogEntry: AILogEntry
  override: {
    action: 'approve' | 'reject' | 'modify' | 'escalate'
    reason: string
    newDecision?: string
    adminNotes: string
    priority: 'low' | 'medium' | 'high' | 'critical'
  }
  timestamp: string
  adminUser: string
}

interface OverrideLogEntry {
  id: string
  originalLogId: string
  originalDecision: AILogEntry
  overrideAction: string
  overrideReason: string
  newDecision?: string
  adminNotes: string
  priority: string
  adminUser: string
  timestamp: string
  createdAt: string
  status: 'pending' | 'applied' | 'rejected'
}

// In-memory storage for overrides (in production, use database)
let overrideHistory: OverrideLogEntry[] = []

/**
 * POST /api/ai-log/override
 * Submit manual override for AI decision
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🛡️ AI Override: Processing manual override request...')
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = validateOverrideRequest(body)
    
    if (!validationResult.isValid) {
      console.log('❌ AI Override: Validation failed:', validationResult.errors)
      
      return NextResponse.json({
        success: false,
        error: 'Invalid override request',
        details: validationResult.errors
      }, { status: 400 })
    }

    const overrideRequest: OverrideRequest = body

    console.log(`🛡️ AI Override: ${overrideRequest.override.action.toUpperCase()} by ${overrideRequest.adminUser}`)

    // Generate unique override ID
    const overrideId = generateOverrideId()

    // Create override log entry
    const overrideLogEntry: OverrideLogEntry = {
      id: overrideId,
      originalLogId: overrideRequest.logId,
      originalDecision: overrideRequest.originalLogEntry,
      overrideAction: overrideRequest.override.action,
      overrideReason: overrideRequest.override.reason,
      newDecision: overrideRequest.override.newDecision,
      adminNotes: overrideRequest.override.adminNotes,
      priority: overrideRequest.override.priority,
      adminUser: overrideRequest.adminUser,
      timestamp: overrideRequest.timestamp,
      createdAt: new Date().toISOString(),
      status: 'applied'
    }

    // Store override in memory (in production, save to database)
    overrideHistory.push(overrideLogEntry)

    // Save override to persistent storage
    await saveOverrideToDatabase(overrideLogEntry)

    // Create new AI log entry for the override
    const overrideAILog: AILogEntry = {
      timestamp: new Date().toISOString(),
      agent: overrideRequest.originalLogEntry.agent,
      decision: `ADMIN OVERRIDE: ${overrideRequest.override.action.toUpperCase()} - ${overrideRequest.override.newDecision || overrideRequest.originalLogEntry.decision}`,
      confidence: 100, // Admin overrides have 100% confidence
      source: 'manual',
      escalation: false, // Override resolves the escalation
      notes: `Override by ${overrideRequest.adminUser}. Reason: ${overrideRequest.override.reason}. Original confidence: ${overrideRequest.originalLogEntry.confidence}%. Override ID: ${overrideId}`
    }

    // Log the override decision
    logAIDecision(overrideAILog)

    // Send notification about the override
    await notifyOverrideSubmitted(overrideLogEntry)

    console.log(`✅ AI Override: ${overrideId} processed successfully`)

    return NextResponse.json({
      success: true,
      message: 'Override submitted successfully',
      overrideId,
      overrideLogEntry,
      newAILogEntry: overrideAILog,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI Override Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * GET /api/ai-log/override
 * Retrieve override history with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminUser = searchParams.get('adminUser')
    const action = searchParams.get('action')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log(`📋 AI Override: Retrieving override history (limit: ${limit}, offset: ${offset})`)

    // Filter overrides based on query parameters
    let filteredOverrides = overrideHistory

    if (adminUser) {
      filteredOverrides = filteredOverrides.filter(override => override.adminUser === adminUser)
    }

    if (action) {
      filteredOverrides = filteredOverrides.filter(override => override.overrideAction === action)
    }

    if (priority) {
      filteredOverrides = filteredOverrides.filter(override => override.priority === priority)
    }

    // Sort by most recent first
    filteredOverrides.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedOverrides = filteredOverrides.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      overrides: paginatedOverrides,
      pagination: {
        limit,
        offset,
        total: filteredOverrides.length,
        hasMore: offset + limit < filteredOverrides.length
      },
      filters: {
        adminUser,
        action,
        priority
      }
    })

  } catch (error) {
    console.error('❌ AI Override Retrieval Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve override history'
    }, { status: 500 })
  }
}

/**
 * Validate override request
 */
function validateOverrideRequest(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!body.logId || typeof body.logId !== 'string') {
    errors.push('logId is required and must be a string')
  }

  if (!body.originalLogEntry || typeof body.originalLogEntry !== 'object') {
    errors.push('originalLogEntry is required and must be an object')
  }

  if (!body.override || typeof body.override !== 'object') {
    errors.push('override is required and must be an object')
  } else {
    const override = body.override

    if (!override.action || !['approve', 'reject', 'modify', 'escalate'].includes(override.action)) {
      errors.push('override.action must be one of: approve, reject, modify, escalate')
    }

    if (!override.reason || typeof override.reason !== 'string' || override.reason.trim().length < 10) {
      errors.push('override.reason is required and must be at least 10 characters')
    }

    if (!override.adminNotes || typeof override.adminNotes !== 'string' || override.adminNotes.trim().length < 10) {
      errors.push('override.adminNotes is required and must be at least 10 characters')
    }

    if (!override.priority || !['low', 'medium', 'high', 'critical'].includes(override.priority)) {
      errors.push('override.priority must be one of: low, medium, high, critical')
    }

    if (override.action === 'modify' && (!override.newDecision || override.newDecision.trim().length < 5)) {
      errors.push('override.newDecision is required when action is "modify" and must be at least 5 characters')
    }
  }

  if (!body.timestamp || typeof body.timestamp !== 'string') {
    errors.push('timestamp is required and must be a string')
  }

  if (!body.adminUser || typeof body.adminUser !== 'string') {
    errors.push('adminUser is required and must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate unique override ID
 */
function generateOverrideId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `override_${timestamp}_${random}`
}

/**
 * Save override to database (placeholder for future implementation)
 */
async function saveOverrideToDatabase(overrideEntry: OverrideLogEntry): Promise<void> {
  try {
    // Future: Save to Firestore or MongoDB
    /*
    // Firestore example:
    await db.collection('ai_overrides').doc(overrideEntry.id).set(overrideEntry)
    
    // MongoDB example:
    await db.collection('ai_overrides').insertOne(overrideEntry)
    */
    
    console.log(`💾 AI Override: ${overrideEntry.id} saved to database (placeholder)`)
  } catch (error) {
    console.warn('⚠️ AI Override: Database save failed, using in-memory only:', error)
  }
}

/**
 * Send notification about override submission
 */
async function notifyOverrideSubmitted(overrideEntry: OverrideLogEntry): Promise<void> {
  try {
    // Send notification to relevant stakeholders
    const message = `🛡️ Admin Override Submitted

Override ID: ${overrideEntry.id}
Action: ${overrideEntry.overrideAction.toUpperCase()}
Priority: ${overrideEntry.priority.toUpperCase()}
Admin: ${overrideEntry.adminUser}
Reason: ${overrideEntry.overrideReason}

Original Decision: ${overrideEntry.originalDecision.decision}
Original Confidence: ${overrideEntry.originalDecision.confidence}%

Time: ${new Date(overrideEntry.timestamp).toLocaleString()}`

    // Future: Send via notification system
    console.log('📧 Override Notification:', message)
    
  } catch (error) {
    console.warn('⚠️ Override notification failed:', error)
  }
}

/**
 * Get override statistics
 */
export function getOverrideStats(): {
  total: number
  byAction: Record<string, number>
  byPriority: Record<string, number>
  byAdmin: Record<string, number>
  recentCount: number
} {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const stats = {
    total: overrideHistory.length,
    byAction: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byAdmin: {} as Record<string, number>,
    recentCount: 0
  }

  overrideHistory.forEach(override => {
    // Count by action
    stats.byAction[override.overrideAction] = (stats.byAction[override.overrideAction] || 0) + 1
    
    // Count by priority
    stats.byPriority[override.priority] = (stats.byPriority[override.priority] || 0) + 1
    
    // Count by admin
    stats.byAdmin[override.adminUser] = (stats.byAdmin[override.adminUser] || 0) + 1
    
    // Count recent overrides
    if (new Date(override.timestamp) > last24Hours) {
      stats.recentCount++
    }
  })

  return stats
}

/**
 * Get all override history (utility function)
 */
export function getAllOverrides(): OverrideLogEntry[] {
  return overrideHistory
}
