// lib/ai/aiLogger.ts - Centralized AI Logging System

export interface AILogEntry {
  id?: string
  timestamp: string
  agent: "COO" | "CFO"
  decision: string
  confidence: number
  rationale?: string
  escalate?: boolean
  notes?: string
  source: "booking" | "finance" | "override" | "maintenance" | "staff" | "general"
  metadata?: Record<string, any>
  status?: "pending" | "completed" | "failed" | "escalated"
}

export interface AILogSummary {
  cooDecisionsToday: number
  cfoUpdatesThisWeek: number
  escalations: number
  overrides: number
  totalDecisions: number
  averageConfidence: number
  lastActivity: string
}

const AILOG_STORAGE_KEY = "ai-log" // For local storage fallback
const AI_LOG_API_ENDPOINT = "/api/ai-log"

/**
 * Log an AI action to the centralized logging system
 */
export async function logAIAction(entry: Omit<AILogEntry, 'id' | 'timestamp'>): Promise<boolean> {
  try {
    const logEntry: AILogEntry = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      ...entry
    }

    console.log("[AI LOG]", logEntry)

    // Send to API endpoint
    const response = await fetch(AI_LOG_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    })

    if (response.ok) {
      console.log("✅ AI Log: Successfully logged action to API")
      return true
    } else {
      console.warn("⚠️ AI Log: API failed, falling back to local storage")
      return await logToLocalStorage(logEntry)
    }

  } catch (error) {
    console.error("❌ AI Log: Error logging action:", error)
    
    // Fallback to local storage
    try {
      const logEntry: AILogEntry = {
        id: generateLogId(),
        timestamp: new Date().toISOString(),
        ...entry
      }
      return await logToLocalStorage(logEntry)
    } catch (fallbackError) {
      console.error("❌ AI Log: Fallback storage also failed:", fallbackError)
      return false
    }
  }
}

/**
 * Retrieve AI logs from the API
 */
export async function getAILogs(filters?: {
  agent?: "COO" | "CFO"
  source?: string
  limit?: number
  offset?: number
}): Promise<AILogEntry[]> {
  try {
    const params = new URLSearchParams()
    
    if (filters?.agent) params.append('agent', filters.agent)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const response = await fetch(`${AI_LOG_API_ENDPOINT}?${params}`)
    
    if (response.ok) {
      const data = await response.json()
      return data.logs || []
    } else {
      console.warn("⚠️ AI Log: API failed, falling back to local storage")
      return getFromLocalStorage()
    }

  } catch (error) {
    console.error("❌ AI Log: Error retrieving logs:", error)
    return getFromLocalStorage()
  }
}

/**
 * Get AI log summary statistics
 */
export async function getAILogSummary(): Promise<AILogSummary> {
  try {
    const response = await fetch(`${AI_LOG_API_ENDPOINT}/summary`)
    
    if (response.ok) {
      const summary = await response.json()
      return summary
    } else {
      console.warn("⚠️ AI Log: Summary API failed, calculating from local storage")
      return calculateSummaryFromLocal()
    }

  } catch (error) {
    console.error("❌ AI Log: Error getting summary:", error)
    return calculateSummaryFromLocal()
  }
}

/**
 * Log AI decision with automatic escalation detection
 */
export async function logAIDecision(params: {
  agent: "COO" | "CFO"
  decision: string
  confidence: number
  rationale?: string
  source: AILogEntry['source']
  metadata?: Record<string, any>
}): Promise<boolean> {
  const shouldEscalate = params.confidence < 0.7 || 
                        params.decision.toLowerCase().includes('high-value') ||
                        params.decision.toLowerCase().includes('emergency')

  return await logAIAction({
    agent: params.agent,
    decision: params.decision,
    confidence: params.confidence,
    rationale: params.rationale,
    escalate: shouldEscalate,
    source: params.source,
    metadata: params.metadata,
    status: shouldEscalate ? 'escalated' : 'completed'
  })
}

/**
 * Log AI override action
 */
export async function logAIOverride(params: {
  originalDecision: string
  overrideReason: string
  adminId?: string
  agent: "COO" | "CFO"
  confidence: number
}): Promise<boolean> {
  return await logAIAction({
    agent: params.agent,
    decision: `Override: ${params.originalDecision}`,
    confidence: params.confidence,
    rationale: params.overrideReason,
    escalate: false,
    source: 'override',
    metadata: {
      originalDecision: params.originalDecision,
      adminId: params.adminId,
      overrideTimestamp: new Date().toISOString()
    },
    status: 'completed',
    notes: `Manual override by admin: ${params.overrideReason}`
  })
}

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Fallback: Store to local storage
 */
async function logToLocalStorage(entry: AILogEntry): Promise<boolean> {
  try {
    const existingLogs = getFromLocalStorage()
    const updatedLogs = [entry, ...existingLogs].slice(0, 1000) // Keep last 1000 entries
    
    localStorage.setItem(AILOG_STORAGE_KEY, JSON.stringify(updatedLogs))
    console.log("✅ AI Log: Stored to local storage")
    return true

  } catch (error) {
    console.error("❌ AI Log: Local storage failed:", error)
    return false
  }
}

/**
 * Fallback: Get from local storage
 */
function getFromLocalStorage(): AILogEntry[] {
  try {
    const stored = localStorage.getItem(AILOG_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("❌ AI Log: Error reading from local storage:", error)
    return []
  }
}

/**
 * Calculate summary from local storage
 */
function calculateSummaryFromLocal(): AILogSummary {
  try {
    const logs = getFromLocalStorage()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const cooDecisionsToday = logs.filter(log => 
      log.agent === 'COO' && new Date(log.timestamp) >= today
    ).length

    const cfoUpdatesThisWeek = logs.filter(log => 
      log.agent === 'CFO' && new Date(log.timestamp) >= weekAgo
    ).length

    const escalations = logs.filter(log => log.escalate).length
    const overrides = logs.filter(log => log.source === 'override').length
    const totalDecisions = logs.length

    const averageConfidence = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.confidence, 0) / logs.length 
      : 0

    const lastActivity = logs.length > 0 ? logs[0].timestamp : new Date().toISOString()

    return {
      cooDecisionsToday,
      cfoUpdatesThisWeek,
      escalations,
      overrides,
      totalDecisions,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      lastActivity
    }

  } catch (error) {
    console.error("❌ AI Log: Error calculating summary:", error)
    return {
      cooDecisionsToday: 0,
      cfoUpdatesThisWeek: 0,
      escalations: 0,
      overrides: 0,
      totalDecisions: 0,
      averageConfidence: 0,
      lastActivity: new Date().toISOString()
    }
  }
}

/**
 * Clear old logs (maintenance function)
 */
export async function clearOldLogs(olderThanDays: number = 30): Promise<number> {
  try {
    const logs = getFromLocalStorage()
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    const filteredLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate)
    const removedCount = logs.length - filteredLogs.length
    
    localStorage.setItem(AILOG_STORAGE_KEY, JSON.stringify(filteredLogs))
    
    console.log(`🧹 AI Log: Cleared ${removedCount} old log entries`)
    return removedCount

  } catch (error) {
    console.error("❌ AI Log: Error clearing old logs:", error)
    return 0
  }
}

/**
 * Export logs for analysis
 */
export async function exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
  try {
    const logs = await getAILogs()
    
    if (format === 'csv') {
      const headers = ['timestamp', 'agent', 'decision', 'confidence', 'rationale', 'escalate', 'source', 'status']
      const csvRows = [
        headers.join(','),
        ...logs.map(log => headers.map(header => `"${log[header as keyof AILogEntry] || ''}"`).join(','))
      ]
      return csvRows.join('\n')
    }
    
    return JSON.stringify(logs, null, 2)

  } catch (error) {
    console.error("❌ AI Log: Error exporting logs:", error)
    return format === 'json' ? '[]' : 'timestamp,agent,decision,confidence,rationale,escalate,source,status\n'
  }
}
