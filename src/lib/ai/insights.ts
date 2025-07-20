// lib/ai/insights.ts - AI-powered analysis of override patterns and insights

export interface OverrideInsight {
  pattern: string
  recommendation: string
  confidence: number
  category: string
  impact: 'high' | 'medium' | 'low'
}

export interface AnalysisContext {
  agent: 'COO' | 'CFO'
  outcome: 'success' | 'failure' | 'neutral'
  confidence: number
  category?: string
}

/**
 * Analyze an override to extract patterns and generate insights
 */
export async function analyzeOverride(
  originalDecision: string,
  overrideReason: string,
  context?: AnalysisContext
): Promise<OverrideInsight | null> {
  try {
    console.log(`🔍 AI Insights: Analyzing override for ${context?.agent || 'unknown'} agent`)

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Extract key information from the override
    const decisionType = extractDecisionType(originalDecision)
    const overrideCategory = categorizeOverride(overrideReason)
    const severity = assessSeverity(overrideReason, context?.confidence || 0)

    // Generate insight based on patterns
    const insight = generateInsight(decisionType, overrideCategory, severity, context)

    if (!insight) {
      console.log('🔍 AI Insights: No actionable insight generated')
      return null
    }

    console.log(`✅ AI Insights: Generated insight with ${insight.confidence}% confidence`)

    return insight

  } catch (error) {
    console.error('❌ AI Insights: Error analyzing override:', error)
    return null
  }
}

/**
 * Extract the type of decision from the original decision text
 */
function extractDecisionType(decision: string): string {
  const lowerDecision = decision.toLowerCase()
  
  if (lowerDecision.includes('assign') || lowerDecision.includes('staff')) {
    return 'staff_assignment'
  }
  if (lowerDecision.includes('approve') || lowerDecision.includes('expense')) {
    return 'expense_approval'
  }
  if (lowerDecision.includes('booking') || lowerDecision.includes('reservation')) {
    return 'booking_management'
  }
  if (lowerDecision.includes('schedule') || lowerDecision.includes('maintenance')) {
    return 'maintenance_scheduling'
  }
  if (lowerDecision.includes('budget') || lowerDecision.includes('financial')) {
    return 'financial_analysis'
  }
  
  return 'general'
}

/**
 * Categorize the override reason
 */
function categorizeOverride(reason: string): string {
  const lowerReason = reason.toLowerCase()
  
  if (lowerReason.includes('distance') || lowerReason.includes('location') || lowerReason.includes('far')) {
    return 'geographic_constraints'
  }
  if (lowerReason.includes('cost') || lowerReason.includes('budget') || lowerReason.includes('expensive')) {
    return 'financial_constraints'
  }
  if (lowerReason.includes('time') || lowerReason.includes('schedule') || lowerReason.includes('availability')) {
    return 'temporal_constraints'
  }
  if (lowerReason.includes('guest') || lowerReason.includes('occupied') || lowerReason.includes('booking')) {
    return 'guest_impact'
  }
  if (lowerReason.includes('staff') || lowerReason.includes('resource') || lowerReason.includes('capacity')) {
    return 'resource_constraints'
  }
  if (lowerReason.includes('risk') || lowerReason.includes('safety') || lowerReason.includes('emergency')) {
    return 'risk_management'
  }
  
  return 'other'
}

/**
 * Assess the severity of the override
 */
function assessSeverity(reason: string, confidence: number): 'high' | 'medium' | 'low' {
  const lowerReason = reason.toLowerCase()
  
  // High severity indicators
  if (lowerReason.includes('emergency') || lowerReason.includes('urgent') || 
      lowerReason.includes('critical') || lowerReason.includes('safety')) {
    return 'high'
  }
  
  // Low confidence decisions that get overridden are high severity
  if (confidence < 70) {
    return 'high'
  }
  
  // Medium severity indicators
  if (lowerReason.includes('guest') || lowerReason.includes('budget') || 
      lowerReason.includes('schedule') || confidence < 85) {
    return 'medium'
  }
  
  return 'low'
}

/**
 * Generate actionable insights based on override analysis
 */
function generateInsight(
  decisionType: string,
  overrideCategory: string,
  severity: 'high' | 'medium' | 'low',
  context?: AnalysisContext
): OverrideInsight | null {
  
  // Define insight templates based on patterns
  const insightTemplates: Record<string, Record<string, OverrideInsight>> = {
    staff_assignment: {
      geographic_constraints: {
        pattern: 'Staff assignments frequently overridden due to distance constraints',
        recommendation: 'Add maximum travel distance parameter (15km) to staff assignment algorithm',
        confidence: 85,
        category: 'algorithm_improvement',
        impact: 'medium'
      },
      temporal_constraints: {
        pattern: 'Staff scheduling conflicts with guest occupancy',
        recommendation: 'Integrate guest booking calendar into staff assignment decisions',
        confidence: 90,
        category: 'data_integration',
        impact: 'high'
      }
    },
    expense_approval: {
      financial_constraints: {
        pattern: 'Expense approvals exceed budget thresholds',
        recommendation: 'Lower auto-approval threshold to ฿5,000 or require budget balance check',
        confidence: 88,
        category: 'threshold_adjustment',
        impact: 'high'
      }
    },
    maintenance_scheduling: {
      guest_impact: {
        pattern: 'Maintenance scheduling conflicts with guest stays',
        recommendation: 'Check guest occupancy calendar before scheduling maintenance',
        confidence: 92,
        category: 'data_integration',
        impact: 'high'
      },
      temporal_constraints: {
        pattern: 'Maintenance timing requires manual adjustment',
        recommendation: 'Add buffer time and guest checkout/checkin awareness to scheduling',
        confidence: 87,
        category: 'algorithm_improvement',
        impact: 'medium'
      }
    },
    booking_management: {
      risk_management: {
        pattern: 'High-value bookings require additional verification',
        recommendation: 'Implement enhanced verification for bookings over ฿10,000',
        confidence: 89,
        category: 'risk_assessment',
        impact: 'high'
      }
    },
    financial_analysis: {
      financial_constraints: {
        pattern: 'Financial analysis accuracy varies with seasonal patterns',
        recommendation: 'Improve seasonal adjustment factors and historical trend analysis',
        confidence: 83,
        category: 'model_improvement',
        impact: 'medium'
      }
    }
  }

  // Get insight template
  const decisionInsights = insightTemplates[decisionType]
  if (!decisionInsights) {
    return null
  }

  const insight = decisionInsights[overrideCategory]
  if (!insight) {
    return null
  }

  // Adjust confidence based on context
  let adjustedConfidence = insight.confidence
  
  if (context?.outcome === 'success') {
    adjustedConfidence = Math.min(100, adjustedConfidence + 5)
  } else if (context?.outcome === 'failure') {
    adjustedConfidence = Math.max(50, adjustedConfidence - 10)
  }

  // Adjust impact based on severity
  let adjustedImpact = insight.impact
  if (severity === 'high' && insight.impact === 'medium') {
    adjustedImpact = 'high'
  } else if (severity === 'low' && insight.impact === 'medium') {
    adjustedImpact = 'low'
  }

  return {
    ...insight,
    confidence: adjustedConfidence,
    impact: adjustedImpact
  }
}

/**
 * Analyze multiple overrides to identify system-wide patterns
 */
export async function analyzeOverridePatterns(
  overrides: Array<{
    originalDecision: string
    overrideReason: string
    context?: AnalysisContext
  }>
): Promise<{
  patterns: OverrideInsight[]
  summary: {
    totalAnalyzed: number
    patternsFound: number
    topCategories: string[]
    recommendedActions: string[]
  }
}> {
  try {
    console.log(`🔍 AI Insights: Analyzing ${overrides.length} override patterns`)

    const insights: OverrideInsight[] = []
    const categoryCount: Record<string, number> = {}

    // Analyze each override
    for (const override of overrides) {
      const insight = await analyzeOverride(
        override.originalDecision,
        override.overrideReason,
        override.context
      )

      if (insight) {
        insights.push(insight)
        categoryCount[insight.category] = (categoryCount[insight.category] || 0) + 1
      }
    }

    // Identify top categories and recommended actions
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    const recommendedActions = insights
      .filter(insight => insight.impact === 'high')
      .map(insight => insight.recommendation)
      .slice(0, 5)

    const summary = {
      totalAnalyzed: overrides.length,
      patternsFound: insights.length,
      topCategories,
      recommendedActions
    }

    console.log(`✅ AI Insights: Found ${insights.length} patterns from ${overrides.length} overrides`)

    return {
      patterns: insights,
      summary
    }

  } catch (error) {
    console.error('❌ AI Insights: Error analyzing override patterns:', error)
    
    return {
      patterns: [],
      summary: {
        totalAnalyzed: 0,
        patternsFound: 0,
        topCategories: [],
        recommendedActions: []
      }
    }
  }
}

/**
 * Get insights dashboard data
 */
export async function getInsightsDashboard(): Promise<{
  recentInsights: OverrideInsight[]
  topRecommendations: string[]
  improvementAreas: {
    area: string
    priority: 'high' | 'medium' | 'low'
    description: string
  }[]
  learningProgress: {
    totalPatterns: number
    implementedFixes: number
    pendingRecommendations: number
  }
}> {
  try {
    // In production, this would query actual insights data
    // For now, return mock dashboard data
    const mockDashboard = {
      recentInsights: [
        {
          pattern: 'Staff assignments frequently overridden due to distance constraints',
          recommendation: 'Add maximum travel distance parameter (15km) to staff assignment algorithm',
          confidence: 85,
          category: 'algorithm_improvement',
          impact: 'medium' as const
        },
        {
          pattern: 'Maintenance scheduling conflicts with guest stays',
          recommendation: 'Check guest occupancy calendar before scheduling maintenance',
          confidence: 92,
          category: 'data_integration',
          impact: 'high' as const
        }
      ],
      topRecommendations: [
        'Add maximum travel distance parameter to staff assignments',
        'Integrate guest booking calendar into maintenance scheduling',
        'Lower auto-approval threshold for expenses to ฿5,000',
        'Implement enhanced verification for high-value bookings',
        'Improve seasonal adjustment factors in financial analysis'
      ],
      improvementAreas: [
        {
          area: 'Geographic Optimization',
          priority: 'high' as const,
          description: 'Optimize staff assignments based on location and travel time'
        },
        {
          area: 'Calendar Integration',
          priority: 'high' as const,
          description: 'Better integration between booking and operational calendars'
        },
        {
          area: 'Financial Thresholds',
          priority: 'medium' as const,
          description: 'Adjust approval thresholds based on budget constraints'
        }
      ],
      learningProgress: {
        totalPatterns: 15,
        implementedFixes: 3,
        pendingRecommendations: 8
      }
    }

    return mockDashboard

  } catch (error) {
    console.error('❌ AI Insights: Error getting dashboard data:', error)
    
    return {
      recentInsights: [],
      topRecommendations: [],
      improvementAreas: [],
      learningProgress: {
        totalPatterns: 0,
        implementedFixes: 0,
        pendingRecommendations: 0
      }
    }
  }
}
