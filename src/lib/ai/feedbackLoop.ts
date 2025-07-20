import { saveToAITrainingLog } from "@/lib/logs"
import { analyzeOverride } from "@/lib/ai/insights"

// Interface for feedback submission
export interface FeedbackSubmission {
  logId: string
  originalDecision: string
  overrideReason: string
  outcome: "success" | "failure" | "neutral"
  adminId?: string
  category?: string
  severity?: "low" | "medium" | "high"
  tags?: string[]
}

// Interface for training log entry
export interface TrainingLogEntry {
  id: string
  logId: string
  originalDecision: string
  overrideReason: string
  outcome: "success" | "failure" | "neutral"
  timestamp: string
  adminId?: string
  category?: string
  severity?: "low" | "medium" | "high"
  tags?: string[]
  agent: "COO" | "CFO" | "SYSTEM"
  confidence?: number
  metadata?: Record<string, any>
}

// Interface for feedback analytics
export interface FeedbackAnalytics {
  totalFeedback: number
  successRate: number
  failureRate: number
  neutralRate: number
  commonOverrideReasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
  agentPerformance: Record<string, {
    total: number
    success: number
    failure: number
    neutral: number
    successRate: number
  }>
  trends: {
    daily: Array<{
      date: string
      success: number
      failure: number
      neutral: number
    }>
    weekly: Array<{
      week: string
      success: number
      failure: number
      neutral: number
    }>
  }
}

/**
 * Submit feedback on an AI decision
 * This is the main function specified in Prompt 14
 */
export async function submitFeedback({
  logId,
  originalDecision,
  overrideReason,
  outcome,
  adminId,
  category,
  severity = "medium",
  tags = []
}: FeedbackSubmission) {
  try {
    console.log('🧠 Feedback Loop: Submitting feedback for decision:', logId)
    
    // Create training log entry
    const trainingEntry: Omit<TrainingLogEntry, 'id'> = {
      logId,
      originalDecision,
      overrideReason,
      outcome,
      timestamp: new Date().toISOString(),
      adminId,
      category,
      severity,
      tags,
      agent: inferAgentFromDecision(originalDecision),
      metadata: {
        submittedAt: new Date().toISOString(),
        source: 'admin_feedback'
      }
    }

    // Save to AI training log
    await saveToAITrainingLog(trainingEntry)
    
    console.log(`✅ Feedback Loop: Feedback saved for decision ${logId} with outcome: ${outcome}`)

    // Optional: Run reflection module for pattern analysis
    try {
      await analyzeOverride(originalDecision, overrideReason)
      console.log('🔍 Feedback Loop: Override analysis completed')
    } catch (analysisError) {
      console.warn('⚠️ Feedback Loop: Override analysis failed:', analysisError)
      // Don't fail the feedback submission if analysis fails
    }

    return {
      success: true,
      message: 'Feedback submitted successfully',
      trainingEntry
    }

  } catch (error) {
    console.error('❌ Feedback Loop: Error submitting feedback:', error)
    throw new Error(`Failed to submit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get feedback analytics and insights
 */
export async function getFeedbackAnalytics(
  timeRange: 'day' | 'week' | 'month' | 'all' = 'week'
): Promise<FeedbackAnalytics> {
  try {
    console.log(`📊 Feedback Loop: Generating analytics for ${timeRange}`)
    
    // In production, this would query the actual training log database
    // For now, we'll return mock analytics based on the time range
    
    const mockAnalytics: FeedbackAnalytics = {
      totalFeedback: 45,
      successRate: 78.5,
      failureRate: 15.2,
      neutralRate: 6.3,
      commonOverrideReasons: [
        { reason: "Staff too far from location", count: 12, percentage: 26.7 },
        { reason: "Expense lacks proper documentation", count: 8, percentage: 17.8 },
        { reason: "Customer priority changed", count: 6, percentage: 13.3 },
        { reason: "Budget constraints", count: 5, percentage: 11.1 },
        { reason: "Staff availability conflict", count: 4, percentage: 8.9 }
      ],
      agentPerformance: {
        COO: {
          total: 28,
          success: 22,
          failure: 4,
          neutral: 2,
          successRate: 78.6
        },
        CFO: {
          total: 17,
          success: 13,
          failure: 3,
          neutral: 1,
          successRate: 76.5
        }
      },
      trends: {
        daily: generateDailyTrends(7),
        weekly: generateWeeklyTrends(4)
      }
    }

    return mockAnalytics

  } catch (error) {
    console.error('❌ Feedback Loop: Error getting analytics:', error)
    throw new Error(`Failed to get feedback analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get recent training log entries
 */
export async function getTrainingLogEntries(
  limit: number = 50,
  agent?: "COO" | "CFO" | "SYSTEM"
): Promise<TrainingLogEntry[]> {
  try {
    console.log(`📋 Feedback Loop: Getting ${limit} training log entries${agent ? ` for ${agent}` : ''}`)
    
    // In production, this would query the actual training log database
    // For now, we'll return mock entries
    
    const mockEntries: TrainingLogEntry[] = [
      {
        id: "training-001",
        logId: "ai-coo-20250720-001",
        originalDecision: "Assign cleaning job to Maria Santos",
        overrideReason: "Staff member was already assigned to another job",
        outcome: "failure",
        timestamp: "2025-07-20T10:30:00Z",
        adminId: "admin-001",
        category: "staff_assignment",
        severity: "medium",
        tags: ["scheduling_conflict", "double_booking"],
        agent: "COO",
        confidence: 0.85
      },
      {
        id: "training-002",
        logId: "ai-cfo-20250720-002",
        originalDecision: "Approve ฿8,500 maintenance expense",
        overrideReason: "Expense was duplicate of previous payment",
        outcome: "failure",
        timestamp: "2025-07-20T09:15:00Z",
        adminId: "admin-002",
        category: "expense_approval",
        severity: "high",
        tags: ["duplicate_expense", "financial_error"],
        agent: "CFO",
        confidence: 0.92
      },
      {
        id: "training-003",
        logId: "ai-coo-20250719-003",
        originalDecision: "Escalate ฿12,000 booking for review",
        overrideReason: "Correct escalation - customer was VIP",
        outcome: "success",
        timestamp: "2025-07-19T16:45:00Z",
        adminId: "admin-001",
        category: "booking_management",
        severity: "low",
        tags: ["vip_customer", "correct_escalation"],
        agent: "COO",
        confidence: 0.75
      },
      {
        id: "training-004",
        logId: "ai-cfo-20250719-004",
        originalDecision: "Flag unusual repair cost pattern",
        overrideReason: "Good catch - vendor was overcharging",
        outcome: "success",
        timestamp: "2025-07-19T14:20:00Z",
        adminId: "admin-002",
        category: "financial_analysis",
        severity: "medium",
        tags: ["vendor_issue", "cost_anomaly"],
        agent: "CFO",
        confidence: 0.88
      },
      {
        id: "training-005",
        logId: "ai-coo-20250718-005",
        originalDecision: "Auto-approve standard cleaning booking",
        overrideReason: "Booking was during maintenance window",
        outcome: "neutral",
        timestamp: "2025-07-18T11:30:00Z",
        adminId: "admin-003",
        category: "booking_management",
        severity: "low",
        tags: ["scheduling_conflict", "maintenance_window"],
        agent: "COO",
        confidence: 0.90
      }
    ]

    // Filter by agent if specified
    const filteredEntries = agent 
      ? mockEntries.filter(entry => entry.agent === agent)
      : mockEntries

    // Return limited results
    return filteredEntries.slice(0, limit)

  } catch (error) {
    console.error('❌ Feedback Loop: Error getting training log entries:', error)
    throw new Error(`Failed to get training log entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Infer which AI agent made the decision based on decision text
 */
function inferAgentFromDecision(decision: string): "COO" | "CFO" | "SYSTEM" {
  const decisionLower = decision.toLowerCase()
  
  if (decisionLower.includes('assign') || 
      decisionLower.includes('booking') || 
      decisionLower.includes('staff') ||
      decisionLower.includes('schedule')) {
    return "COO"
  }
  
  if (decisionLower.includes('expense') || 
      decisionLower.includes('approve') || 
      decisionLower.includes('budget') ||
      decisionLower.includes('financial') ||
      decisionLower.includes('cost')) {
    return "CFO"
  }
  
  return "SYSTEM"
}

/**
 * Generate mock daily trends for analytics
 */
function generateDailyTrends(days: number) {
  const trends = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    trends.push({
      date: date.toISOString().split('T')[0],
      success: Math.floor(Math.random() * 8) + 2,
      failure: Math.floor(Math.random() * 3) + 1,
      neutral: Math.floor(Math.random() * 2)
    })
  }
  
  return trends
}

/**
 * Generate mock weekly trends for analytics
 */
function generateWeeklyTrends(weeks: number) {
  const trends = []
  const today = new Date()
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - (i * 7))
    
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    
    trends.push({
      week: `Week of ${weekStart.toISOString().split('T')[0]}`,
      success: Math.floor(Math.random() * 25) + 10,
      failure: Math.floor(Math.random() * 8) + 2,
      neutral: Math.floor(Math.random() * 5) + 1
    })
  }
  
  return trends
}
