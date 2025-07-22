/**
 * AI Activity Logger Service
 * Centralized logging for all AI decisions and activities in the Command Center
 */

import { getDb } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore'

export type AIActivityType = 
  | 'staff_reassignment'
  | 'route_optimization' 
  | 'delay_prediction'
  | 'anomaly_detection'
  | 'learning_event'
  | 'booking_decision'
  | 'financial_analysis'
  | 'emergency_escalation'
  | 'system_optimization'
  | 'guest_prediction'

export type AIActivityImpact = 'low' | 'medium' | 'high' | 'critical'

export interface AIActivity {
  id?: string
  type: AIActivityType
  description: string
  reasoning: string
  impact: AIActivityImpact
  confidence: number
  timestamp: Timestamp
  automated: boolean
  relatedEntities: {
    jobIds?: string[]
    staffIds?: string[]
    propertyIds?: string[]
    bookingIds?: string[]
  }
  metadata?: {
    timeSaved?: number // in minutes
    costSaved?: number // in currency
    riskReduced?: number // percentage
    efficiencyGain?: number // percentage
    [key: string]: any
  }
  source: 'ai_coo' | 'ai_cfo' | 'ai_chat' | 'system' | 'manual'
  status: 'active' | 'completed' | 'failed' | 'cancelled'
}

export interface AISystemConfidence {
  overall: number
  factors: {
    decisionAccuracy: number
    predictionSuccess: number
    systemUptime: number
    userSatisfaction: number
  }
  lastCalculated: Timestamp
  trend: 'improving' | 'stable' | 'declining'
}

class AIActivityLogger {
  private readonly ACTIVITY_COLLECTION = 'ai_activity_log'
  private readonly CONFIDENCE_COLLECTION = 'ai_system_confidence'

  /**
   * Log an AI activity/decision
   */
  async logActivity(activity: Omit<AIActivity, 'id' | 'timestamp'>): Promise<string> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const activityDoc: Omit<AIActivity, 'id'> = {
        ...activity,
        timestamp: serverTimestamp() as Timestamp
      }

      const docRef = await addDoc(collection(db, this.ACTIVITY_COLLECTION), activityDoc)
      
      console.log(`🤖 AI Activity logged: ${activity.type} - ${activity.description}`)
      
      // Update system confidence based on this activity
      await this.updateSystemConfidence(activity)
      
      return docRef.id
    } catch (error) {
      console.error('❌ Error logging AI activity:', error)
      throw error
    }
  }

  /**
   * Log staff reassignment decision
   */
  async logStaffReassignment(params: {
    fromStaffId: string
    toStaffId: string
    jobId: string
    reasoning: string
    confidence: number
    timeSaved?: number
  }): Promise<string> {
    return this.logActivity({
      type: 'staff_reassignment',
      description: `Reassigned job to optimize workload and reduce travel time`,
      reasoning: params.reasoning,
      impact: params.timeSaved && params.timeSaved > 30 ? 'high' : 'medium',
      confidence: params.confidence,
      automated: true,
      relatedEntities: {
        staffIds: [params.fromStaffId, params.toStaffId],
        jobIds: [params.jobId]
      },
      metadata: {
        timeSaved: params.timeSaved,
        efficiencyGain: params.timeSaved ? Math.min(100, (params.timeSaved / 60) * 20) : 0
      },
      source: 'ai_coo',
      status: 'completed'
    })
  }

  /**
   * Log route optimization
   */
  async logRouteOptimization(params: {
    staffId: string
    jobIds: string[]
    timeSaved: number
    confidence: number
    reasoning: string
  }): Promise<string> {
    return this.logActivity({
      type: 'route_optimization',
      description: `Optimized route for ${params.jobIds.length} jobs, saving ${params.timeSaved} minutes`,
      reasoning: params.reasoning,
      impact: params.timeSaved > 45 ? 'high' : params.timeSaved > 20 ? 'medium' : 'low',
      confidence: params.confidence,
      automated: true,
      relatedEntities: {
        staffIds: [params.staffId],
        jobIds: params.jobIds
      },
      metadata: {
        timeSaved: params.timeSaved,
        efficiencyGain: Math.min(100, (params.timeSaved / 120) * 100)
      },
      source: 'system',
      status: 'completed'
    })
  }

  /**
   * Log delay prediction
   */
  async logDelayPrediction(params: {
    jobId: string
    propertyId: string
    delayRisk: number
    estimatedDelay: number
    reasoning: string
    confidence: number
  }): Promise<string> {
    return this.logActivity({
      type: 'delay_prediction',
      description: `Predicted ${params.delayRisk}% delay risk for upcoming job`,
      reasoning: params.reasoning,
      impact: params.delayRisk > 70 ? 'high' : params.delayRisk > 40 ? 'medium' : 'low',
      confidence: params.confidence,
      automated: true,
      relatedEntities: {
        jobIds: [params.jobId],
        propertyIds: [params.propertyId]
      },
      metadata: {
        delayRisk: params.delayRisk,
        estimatedDelay: params.estimatedDelay,
        riskReduced: Math.min(100, params.confidence * 0.8)
      },
      source: 'system',
      status: 'active'
    })
  }

  /**
   * Log booking decision
   */
  async logBookingDecision(params: {
    bookingId: string
    decision: 'approved' | 'rejected' | 'escalated'
    reasoning: string
    confidence: number
    assignedStaffId?: string
    revenueImpact?: number
  }): Promise<string> {
    return this.logActivity({
      type: 'booking_decision',
      description: `Booking ${params.decision} with ${params.confidence}% confidence`,
      reasoning: params.reasoning,
      impact: params.revenueImpact && params.revenueImpact > 5000 ? 'high' : 'medium',
      confidence: params.confidence,
      automated: params.decision !== 'escalated',
      relatedEntities: {
        bookingIds: [params.bookingId],
        ...(params.assignedStaffId && { staffIds: [params.assignedStaffId] })
      },
      metadata: {
        decision: params.decision,
        revenueImpact: params.revenueImpact
      },
      source: 'ai_coo',
      status: params.decision === 'escalated' ? 'active' : 'completed'
    })
  }

  /**
   * Log financial analysis
   */
  async logFinancialAnalysis(params: {
    analysisType: string
    findings: string[]
    confidence: number
    anomaliesDetected: number
    costSaved?: number
  }): Promise<string> {
    return this.logActivity({
      type: 'financial_analysis',
      description: `Analyzed ${params.analysisType}, found ${params.anomaliesDetected} anomalies`,
      reasoning: params.findings.join('; '),
      impact: params.anomaliesDetected > 2 ? 'high' : params.anomaliesDetected > 0 ? 'medium' : 'low',
      confidence: params.confidence,
      automated: true,
      relatedEntities: {},
      metadata: {
        analysisType: params.analysisType,
        anomaliesDetected: params.anomaliesDetected,
        costSaved: params.costSaved,
        findings: params.findings
      },
      source: 'ai_cfo',
      status: 'completed'
    })
  }

  /**
   * Log anomaly detection
   */
  async logAnomalyDetection(params: {
    anomalyType: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence: number
    affectedEntities: AIActivity['relatedEntities']
  }): Promise<string> {
    return this.logActivity({
      type: 'anomaly_detection',
      description: `Detected ${params.anomalyType}: ${params.description}`,
      reasoning: `Anomaly detected with ${params.confidence}% confidence`,
      impact: params.severity,
      confidence: params.confidence,
      automated: true,
      relatedEntities: params.affectedEntities,
      metadata: {
        anomalyType: params.anomalyType,
        severity: params.severity
      },
      source: 'system',
      status: 'active'
    })
  }

  /**
   * Set up real-time listener for AI activities
   */
  setupActivityListener(
    callback: (activities: AIActivity[]) => void,
    limitCount: number = 20
  ): () => void {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const activitiesQuery = query(
        collection(db, this.ACTIVITY_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const unsubscribe = onSnapshot(
        activitiesQuery,
        (snapshot) => {
          const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AIActivity))

          console.log(`🤖 AI Activities updated: ${activities.length} activities`)
          callback(activities)
        },
        (error) => {
          console.error('❌ Error listening to AI activities:', error)
        }
      )

      return unsubscribe
    } catch (error) {
      console.error('❌ Error setting up activity listener:', error)
      return () => {}
    }
  }

  /**
   * Update system confidence based on recent activities
   */
  private async updateSystemConfidence(activity: Omit<AIActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      // This would normally calculate confidence based on:
      // - Recent decision accuracy
      // - Prediction success rates
      // - System uptime
      // - User feedback
      
      // For now, we'll use a simplified calculation
      const baseConfidence = 85
      const confidenceAdjustment = (activity.confidence - 75) * 0.1
      const impactAdjustment = activity.impact === 'high' ? 2 : activity.impact === 'medium' ? 1 : 0
      
      const newConfidence = Math.min(100, Math.max(0, 
        baseConfidence + confidenceAdjustment + impactAdjustment
      ))

      console.log(`📊 System confidence updated: ${newConfidence}%`)
    } catch (error) {
      console.error('❌ Error updating system confidence:', error)
    }
  }

  /**
   * Get current system confidence
   */
  async getSystemConfidence(): Promise<AISystemConfidence> {
    // Mock implementation - in production this would query recent activities
    // and calculate real confidence metrics
    return {
      overall: 87,
      factors: {
        decisionAccuracy: 92,
        predictionSuccess: 85,
        systemUptime: 99,
        userSatisfaction: 88
      },
      lastCalculated: serverTimestamp() as Timestamp,
      trend: 'stable'
    }
  }
}

// Export singleton instance
export const aiActivityLogger = new AIActivityLogger()
export default aiActivityLogger
