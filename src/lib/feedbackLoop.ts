import { saveToAITrainingLog } from '@/lib/logs'
import { analyzeOverride } from '@/lib/ai/insights'

export interface FeedbackSubmission {
  logId: string
  originalDecision: string
  overrideReason: string
  outcome: 'success' | 'failure' | 'neutral'
  agent: 'COO' | 'CFO'
  confidence: number
  category?: string
  adminId?: string
  metadata?: Record<string, any>
}

export interface TrainingLogEntry {
  id: string
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

/**
 * Submit feedback for AI decision to improve future performance
 * This creates a training signal that can be used to refine AI behavior
 */
export async function submitFeedback({
  logId,
  originalDecision,
  overrideReason,
  outcome,
  agent = 'COO',
  confidence = 0,
  category,
  adminId,
  metadata
}: FeedbackSubmission): Promise<{ success: boolean; trainingLogId?: string; error?: string }> {
  try {
    console.log(`🔄 Feedback Loop: Processing feedback for ${agent} decision ${logId}`)

    // Validate input
    if (!logId || !originalDecision || !overrideReason) {
      throw new Error('Missing required feedback fields')
    }

    // Create training log entry
    const trainingEntry: Omit<TrainingLogEntry, 'id'> = {
      logId,
      originalDecision,
      overrideReason,
      outcome,
      agent,
      confidence,
      category,
      adminId,
      timestamp: new Date().toISOString(),
      metadata
    }

    // Store override as training signal
    const trainingLogId = await saveToAITrainingLog(trainingEntry)

    // Analyze override for patterns and insights
    const insights = await analyzeOverride(originalDecision, overrideReason, {
      agent,
      outcome,
      confidence,
      category
    })

    // Update training entry with insights if available
    if (insights && trainingLogId) {
      await updateTrainingLogWithInsights(trainingLogId, insights)
    }

    // Trigger learning process for future decisions
    await triggerLearningProcess({
      agent,
      outcome,
      category,
      confidence,
      overrideReason
    })

    console.log(`✅ Feedback Loop: Successfully processed feedback for ${agent} decision`)

    return {
      success: true,
      trainingLogId
    }

  } catch (error) {
    console.error('❌ Feedback Loop: Error processing feedback:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process feedback'
    }
  }
}

/**
 * Analyze patterns in feedback to identify improvement opportunities
 */
export async function analyzeFeedbackPatterns(
  agent?: 'COO' | 'CFO',
  timeframe?: { start: Date; end: Date }
): Promise<{
  patterns: Array<{
    pattern: string
    frequency: number
    impact: 'high' | 'medium' | 'low'
    recommendation: string
  }>
  summary: {
    totalFeedback: number
    successRate: number
    commonIssues: string[]
    improvementAreas: string[]
  }
}> {
  try {
    console.log(`📊 Feedback Loop: Analyzing patterns for ${agent || 'all agents'}`)

    // In production, this would query the training log database
    // For now, return mock analysis
    const mockPatterns = [
      {
        pattern: 'High-value bookings frequently overridden due to insufficient verification',
        frequency: 12,
        impact: 'high' as const,
        recommendation: 'Increase verification requirements for bookings over ฿10,000'
      },
      {
        pattern: 'Staff assignments rejected when distance exceeds 15km',
        frequency: 8,
        impact: 'medium' as const,
        recommendation: 'Add distance constraints to staff assignment algorithm'
      },
      {
        pattern: 'Financial analysis confidence drops during seasonal transitions',
        frequency: 5,
        impact: 'medium' as const,
        recommendation: 'Improve seasonal adjustment factors in CFO model'
      }
    ]

    const mockSummary = {
      totalFeedback: 45,
      successRate: 78.5,
      commonIssues: [
        'Distance constraints in staff assignments',
        'Seasonal financial analysis accuracy',
        'High-value booking verification'
      ],
      improvementAreas: [
        'Geographic optimization',
        'Seasonal modeling',
        'Risk assessment thresholds'
      ]
    }

    console.log(`✅ Feedback Loop: Found ${mockPatterns.length} patterns`)

    return {
      patterns: mockPatterns,
      summary: mockSummary
    }

  } catch (error) {
    console.error('❌ Feedback Loop: Error analyzing patterns:', error)
    
    return {
      patterns: [],
      summary: {
        totalFeedback: 0,
        successRate: 0,
        commonIssues: [],
        improvementAreas: []
      }
    }
  }
}

/**
 * Get feedback statistics for dashboard display
 */
export async function getFeedbackStats(agent?: 'COO' | 'CFO'): Promise<{
  totalFeedback: number
  successRate: number
  recentTrends: {
    period: string
    successRate: number
    feedbackCount: number
  }[]
  topIssues: {
    issue: string
    count: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }[]
}> {
  try {
    // In production, query actual training log data
    // For now, return realistic mock data
    const mockStats = {
      totalFeedback: agent === 'COO' ? 28 : agent === 'CFO' ? 17 : 45,
      successRate: agent === 'COO' ? 82.1 : agent === 'CFO' ? 74.3 : 78.5,
      recentTrends: [
        { period: 'Last 7 days', successRate: 85.2, feedbackCount: 12 },
        { period: 'Last 30 days', successRate: 78.5, feedbackCount: 45 },
        { period: 'Last 90 days', successRate: 76.8, feedbackCount: 128 }
      ],
      topIssues: [
        { issue: 'Distance constraints', count: 8, trend: 'decreasing' as const },
        { issue: 'Seasonal accuracy', count: 5, trend: 'stable' as const },
        { issue: 'Risk thresholds', count: 4, trend: 'increasing' as const }
      ]
    }

    return mockStats

  } catch (error) {
    console.error('❌ Feedback Loop: Error getting stats:', error)
    
    return {
      totalFeedback: 0,
      successRate: 0,
      recentTrends: [],
      topIssues: []
    }
  }
}

/**
 * Update training log entry with AI-generated insights
 */
async function updateTrainingLogWithInsights(
  trainingLogId: string, 
  insights: { pattern: string; recommendation: string; confidence: number }
): Promise<void> {
  try {
    // In production, update the database record
    console.log(`🔍 Feedback Loop: Adding insights to training log ${trainingLogId}`)
    
    // Mock implementation - would update database
    console.log('Insights:', insights)
    
  } catch (error) {
    console.error('❌ Feedback Loop: Error updating training log with insights:', error)
  }
}

/**
 * Trigger learning process to update AI behavior based on feedback
 */
async function triggerLearningProcess(params: {
  agent: 'COO' | 'CFO'
  outcome: 'success' | 'failure' | 'neutral'
  category?: string
  confidence: number
  overrideReason: string
}): Promise<void> {
  try {
    console.log(`🎓 Feedback Loop: Triggering learning process for ${params.agent}`)

    // In production, this would:
    // 1. Update AI model weights based on feedback
    // 2. Adjust confidence thresholds
    // 3. Update decision rules
    // 4. Retrain specific model components
    
    // For now, just log the learning trigger
    console.log('Learning parameters:', {
      agent: params.agent,
      outcome: params.outcome,
      category: params.category,
      confidenceImpact: params.confidence < 80 ? 'low_confidence_pattern' : 'high_confidence_override',
      reasonCategory: categorizeOverrideReason(params.overrideReason)
    })

    // Simulate learning delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log(`✅ Feedback Loop: Learning process completed for ${params.agent}`)
    
  } catch (error) {
    console.error('❌ Feedback Loop: Error in learning process:', error)
  }
}

/**
 * Categorize override reason for pattern analysis
 */
function categorizeOverrideReason(reason: string): string {
  const lowerReason = reason.toLowerCase()
  
  if (lowerReason.includes('distance') || lowerReason.includes('location')) {
    return 'geographic_constraints'
  }
  if (lowerReason.includes('cost') || lowerReason.includes('price') || lowerReason.includes('budget')) {
    return 'financial_thresholds'
  }
  if (lowerReason.includes('staff') || lowerReason.includes('availability')) {
    return 'resource_allocation'
  }
  if (lowerReason.includes('time') || lowerReason.includes('schedule')) {
    return 'temporal_constraints'
  }
  if (lowerReason.includes('risk') || lowerReason.includes('safety')) {
    return 'risk_assessment'
  }
  
  return 'other'
}

/**
 * Export feedback data for external analysis or model training
 */
export async function exportFeedbackData(
  format: 'json' | 'csv' = 'json',
  filters?: {
    agent?: 'COO' | 'CFO'
    outcome?: 'success' | 'failure' | 'neutral'
    dateRange?: { start: Date; end: Date }
  }
): Promise<{ data: any; filename: string }> {
  try {
    console.log('📤 Feedback Loop: Exporting feedback data')

    // In production, query and format actual data
    const mockData = [
      {
        id: 'feedback-001',
        timestamp: '2025-07-20T06:00:00Z',
        agent: 'COO',
        originalDecision: 'Assign staff to Villa Breeze cleaning',
        overrideReason: 'Staff member too far away, would take 45 minutes',
        outcome: 'success',
        confidence: 85,
        category: 'geographic_constraints'
      }
    ]

    const filename = `ai_feedback_export_${new Date().toISOString().split('T')[0]}.${format}`

    return {
      data: format === 'json' ? mockData : convertToCSV(mockData),
      filename
    }

  } catch (error) {
    console.error('❌ Feedback Loop: Error exporting data:', error)
    throw error
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ]
  
  return csvRows.join('\n')
}
