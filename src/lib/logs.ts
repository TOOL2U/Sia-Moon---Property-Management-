// lib/logs.ts - Centralized logging for AI system

export interface AILogEntry {
  timestamp: string
  agent: 'COO' | 'CFO'
  decision: string
  confidence: number
  source: 'auto' | 'manual'
  escalation?: boolean
  notes?: string
}

export interface AITrainingLogEntry {
  id?: string
  logId: string
  originalDecision: string
  overrideReason: string
  outcome: 'success' | 'failure' | 'neutral'
  agent: 'COO' | 'CFO'
  confidence: number
  category?: string
  adminId?: string
  timestamp: string
  metadata?: Record<string, any>
  insights?: {
    pattern: string
    recommendation: string
    confidence: number
  }
}

// In-memory storage for development (replace with database in production)
let trainingLogs: AITrainingLogEntry[] = []

/**
 * Save feedback to AI training log for learning purposes
 */
export async function saveToAITrainingLog(
  entry: Omit<AITrainingLogEntry, 'id'>
): Promise<string> {
  try {
    const id = `training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const trainingEntry: AITrainingLogEntry = {
      id,
      ...entry
    }

    // In production, save to database (Firestore, MongoDB, etc.)
    trainingLogs.push(trainingEntry)
    
    console.log(`📝 Training Log: Saved entry ${id} for ${entry.agent} decision`)
    
    return id

  } catch (error) {
    console.error('❌ Training Log: Error saving entry:', error)
    throw error
  }
}

/**
 * Retrieve training log entries with optional filtering
 */
export async function getTrainingLogs(filters?: {
  agent?: 'COO' | 'CFO'
  outcome?: 'success' | 'failure' | 'neutral'
  category?: string
  limit?: number
  offset?: number
}): Promise<AITrainingLogEntry[]> {
  try {
    let filteredLogs = [...trainingLogs]

    // Apply filters
    if (filters?.agent) {
      filteredLogs = filteredLogs.filter(log => log.agent === filters.agent)
    }
    
    if (filters?.outcome) {
      filteredLogs = filteredLogs.filter(log => log.outcome === filters.outcome)
    }
    
    if (filters?.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category)
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const offset = filters?.offset || 0
    const limit = filters?.limit || 50
    
    return filteredLogs.slice(offset, offset + limit)

  } catch (error) {
    console.error('❌ Training Log: Error retrieving entries:', error)
    return []
  }
}

/**
 * Update training log entry with additional insights
 */
export async function updateTrainingLogEntry(
  id: string,
  updates: Partial<AITrainingLogEntry>
): Promise<boolean> {
  try {
    const index = trainingLogs.findIndex(log => log.id === id)
    
    if (index === -1) {
      throw new Error(`Training log entry ${id} not found`)
    }

    trainingLogs[index] = {
      ...trainingLogs[index],
      ...updates
    }

    console.log(`📝 Training Log: Updated entry ${id}`)
    
    return true

  } catch (error) {
    console.error('❌ Training Log: Error updating entry:', error)
    return false
  }
}

/**
 * Get training log statistics
 */
export async function getTrainingLogStats(): Promise<{
  total: number
  byAgent: Record<string, number>
  byOutcome: Record<string, number>
  byCategory: Record<string, number>
  recentActivity: number
}> {
  try {
    const total = trainingLogs.length
    
    const byAgent = trainingLogs.reduce((acc, log) => {
      acc[log.agent] = (acc[log.agent] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byOutcome = trainingLogs.reduce((acc, log) => {
      acc[log.outcome] = (acc[log.outcome] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byCategory = trainingLogs.reduce((acc, log) => {
      if (log.category) {
        acc[log.category] = (acc[log.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    // Count entries from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = trainingLogs.filter(
      log => new Date(log.timestamp) > oneDayAgo
    ).length

    return {
      total,
      byAgent,
      byOutcome,
      byCategory,
      recentActivity
    }

  } catch (error) {
    console.error('❌ Training Log: Error getting stats:', error)
    return {
      total: 0,
      byAgent: {},
      byOutcome: {},
      byCategory: {},
      recentActivity: 0
    }
  }
}

/**
 * Clear old training log entries (for maintenance)
 */
export async function cleanupTrainingLogs(olderThanDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    const initialCount = trainingLogs.length
    
    trainingLogs = trainingLogs.filter(
      log => new Date(log.timestamp) > cutoffDate
    )
    
    const removedCount = initialCount - trainingLogs.length
    
    console.log(`🧹 Training Log: Cleaned up ${removedCount} old entries`)
    
    return removedCount

  } catch (error) {
    console.error('❌ Training Log: Error cleaning up entries:', error)
    return 0
  }
}

// Initialize with some mock training data for development
if (trainingLogs.length === 0) {
  const mockTrainingData: Omit<AITrainingLogEntry, 'id'>[] = [
    {
      logId: 'log-001',
      originalDecision: 'Assign Somchai to Villa Breeze cleaning',
      overrideReason: 'Staff member too far away, would take 45 minutes to reach property',
      outcome: 'success',
      agent: 'COO',
      confidence: 85,
      category: 'geographic_constraints',
      adminId: 'admin-001',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      metadata: { distance: 15.2, estimatedTravelTime: 45 }
    },
    {
      logId: 'log-002',
      originalDecision: 'Approve ฿8,500 maintenance expense for pool equipment',
      overrideReason: 'Amount exceeds monthly maintenance budget, requires additional approval',
      outcome: 'neutral',
      agent: 'CFO',
      confidence: 78,
      category: 'financial_thresholds',
      adminId: 'admin-001',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      metadata: { amount: 8500, budgetRemaining: 3200 }
    },
    {
      logId: 'log-003',
      originalDecision: 'Schedule maintenance for Ocean View Villa next Tuesday',
      overrideReason: 'Villa has guests checking in Tuesday, rescheduled to Wednesday',
      outcome: 'success',
      agent: 'COO',
      confidence: 92,
      category: 'temporal_constraints',
      adminId: 'admin-002',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      metadata: { originalDate: '2025-07-22', newDate: '2025-07-23' }
    }
  ]

  // Add mock data
  mockTrainingData.forEach(async (entry) => {
    await saveToAITrainingLog(entry)
  })
}
