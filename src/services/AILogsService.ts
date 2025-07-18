/**
 * AI Logs Service
 * Tracks and manages AI decision logs and admin feedback
 */

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'

// AI Log interface
export interface AILog {
  id: string
  type:
    | 'booking_approved'
    | 'booking_rejected'
    | 'job_assigned'
    | 'job_created'
    | 'calendar_updated'
    | 'financial_calculated'
    | 'notification_sent'
  refId: string
  refType: 'booking' | 'job' | 'property' | 'staff' | 'calendar_event'
  timestamp: Timestamp
  reason: string
  confidence?: number
  metadata: {
    staffId?: string
    staffName?: string
    bookingId?: string
    propertyId?: string
    propertyName?: string
    clientName?: string
    amount?: number
    duration?: number
    [key: string]: any
  }
  system: string
  status: 'success' | 'pending' | 'failed'
  createdAt: Timestamp
}

// AI Feedback interface
export interface AIFeedback {
  id: string
  decisionId: string
  logId: string
  rating: 'positive' | 'negative' | 'neutral'
  comment?: string
  adminId: string
  adminName?: string
  timestamp: Timestamp
  helpful: boolean
  category?: 'accuracy' | 'timing' | 'assignment' | 'other'
}

// AI Performance KPIs
export interface AIPerformanceKPIs {
  avgBookingApprovalTime: number
  jobAssignmentAccuracy: number
  avgJobsPerStaff: number
  calendarUpdatesTriggered: number
  staffResponseRate: number
  totalAIDecisions: number
  positiveRating: number
  negativeRating: number
  overallSatisfaction: number
}

// Filter options for AI logs
export interface AILogFilters {
  type?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  staffId?: string
  propertyId?: string
  status?: string[]
  searchTerm?: string
}

class AILogsService {
  private readonly AI_LOGS_COLLECTION = 'aiLogs'
  private readonly AI_FEEDBACK_COLLECTION = 'aiFeedback'

  /**
   * Log an AI decision
   */
  async logAIDecision(
    logData: Omit<AILog, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const logRef = doc(collection(db, this.AI_LOGS_COLLECTION))

      const aiLog: Omit<AILog, 'id'> = {
        ...logData,
        createdAt: serverTimestamp(),
      }

      await setDoc(logRef, aiLog)

      console.log(`📊 AI decision logged: ${logData.type} for ${logData.refId}`)
      return logRef.id
    } catch (error) {
      console.error('❌ Error logging AI decision:', error)
      throw error
    }
  }

  /**
   * Get AI logs with pagination and filtering
   */
  async getAILogs(
    filters: AILogFilters = {},
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    logs: AILog[]
    hasMore: boolean
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  }> {
    try {
      let logsQuery = query(
        collection(db, this.AI_LOGS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      )

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        logsQuery = query(logsQuery, where('type', 'in', filters.type))
      }

      if (filters.status && filters.status.length > 0) {
        logsQuery = query(logsQuery, where('status', 'in', filters.status))
      }

      if (filters.staffId) {
        logsQuery = query(
          logsQuery,
          where('metadata.staffId', '==', filters.staffId)
        )
      }

      if (filters.propertyId) {
        logsQuery = query(
          logsQuery,
          where('metadata.propertyId', '==', filters.propertyId)
        )
      }

      if (filters.dateRange) {
        logsQuery = query(
          logsQuery,
          where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end))
        )
      }

      // Add pagination
      if (lastDoc) {
        logsQuery = query(logsQuery, startAfter(lastDoc))
      }

      const snapshot = await getDocs(logsQuery)
      const logs: AILog[] = []

      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        } as AILog)
      })

      // Filter by search term if provided (client-side filtering)
      let filteredLogs = logs
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        filteredLogs = logs.filter(
          (log) =>
            log.refId.toLowerCase().includes(searchTerm) ||
            log.reason.toLowerCase().includes(searchTerm) ||
            log.metadata.staffName?.toLowerCase().includes(searchTerm) ||
            log.metadata.propertyName?.toLowerCase().includes(searchTerm) ||
            log.metadata.clientName?.toLowerCase().includes(searchTerm)
        )
      }

      return {
        logs: filteredLogs,
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
      }
    } catch (error) {
      console.error('❌ Error getting AI logs:', error)
      return { logs: [], hasMore: false }
    }
  }

  /**
   * Submit admin feedback for an AI decision
   */
  async submitFeedback(
    feedbackData: Omit<AIFeedback, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const feedbackRef = doc(collection(db, this.AI_FEEDBACK_COLLECTION))

      const feedback: Omit<AIFeedback, 'id'> = {
        ...feedbackData,
        timestamp: serverTimestamp(),
      }

      await setDoc(feedbackRef, feedback)

      console.log(
        `👍 Admin feedback submitted for decision ${feedbackData.decisionId}`
      )
    } catch (error) {
      console.error('❌ Error submitting feedback:', error)
      throw error
    }
  }

  /**
   * Get feedback for a specific AI log
   */
  async getFeedbackForLog(logId: string): Promise<AIFeedback[]> {
    try {
      const feedbackQuery = query(
        collection(db, this.AI_FEEDBACK_COLLECTION),
        where('logId', '==', logId),
        orderBy('timestamp', 'desc')
      )

      const snapshot = await getDocs(feedbackQuery)
      const feedback: AIFeedback[] = []

      snapshot.forEach((doc) => {
        feedback.push({
          id: doc.id,
          ...doc.data(),
        } as AIFeedback)
      })

      return feedback
    } catch (error) {
      console.error('❌ Error getting feedback for log:', error)
      return []
    }
  }

  /**
   * Calculate AI performance KPIs
   */
  async calculateKPIs(dateRange?: {
    start: Date
    end: Date
  }): Promise<AIPerformanceKPIs> {
    try {
      let logsQuery = query(collection(db, this.AI_LOGS_COLLECTION))

      if (dateRange) {
        logsQuery = query(
          logsQuery,
          where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
        )
      }

      const [logsSnapshot, feedbackSnapshot] = await Promise.all([
        getDocs(logsQuery),
        getDocs(collection(db, this.AI_FEEDBACK_COLLECTION)),
      ])

      const logs: AILog[] = []
      logsSnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as AILog)
      })

      const feedback: AIFeedback[] = []
      feedbackSnapshot.forEach((doc) => {
        feedback.push({ id: doc.id, ...doc.data() } as AIFeedback)
      })

      // Calculate KPIs
      const bookingApprovals = logs.filter(
        (log) => log.type === 'booking_approved'
      )
      const jobAssignments = logs.filter((log) => log.type === 'job_assigned')
      const calendarUpdates = logs.filter(
        (log) => log.type === 'calendar_updated'
      )

      // Average booking approval time (placeholder calculation)
      const avgBookingApprovalTime =
        bookingApprovals.length > 0
          ? bookingApprovals.reduce(
              (sum, log) => sum + (log.metadata.processingTime || 5000),
              0
            ) / bookingApprovals.length
          : 0

      // Job assignment accuracy (based on successful completions)
      const successfulJobs = jobAssignments.filter(
        (log) => log.status === 'success'
      )
      const jobAssignmentAccuracy =
        jobAssignments.length > 0
          ? (successfulJobs.length / jobAssignments.length) * 100
          : 0

      // Average jobs per staff
      const staffJobCounts = new Map<string, number>()
      jobAssignments.forEach((log) => {
        if (log.metadata.staffId) {
          const current = staffJobCounts.get(log.metadata.staffId) || 0
          staffJobCounts.set(log.metadata.staffId, current + 1)
        }
      })
      const avgJobsPerStaff =
        staffJobCounts.size > 0
          ? Array.from(staffJobCounts.values()).reduce(
              (sum, count) => sum + count,
              0
            ) / staffJobCounts.size
          : 0

      // Feedback analysis
      const positiveFeedback = feedback.filter((f) => f.rating === 'positive')
      const negativeFeedback = feedback.filter((f) => f.rating === 'negative')
      const totalFeedback = feedback.length

      const positiveRating =
        totalFeedback > 0 ? (positiveFeedback.length / totalFeedback) * 100 : 0
      const negativeRating =
        totalFeedback > 0 ? (negativeFeedback.length / totalFeedback) * 100 : 0
      const overallSatisfaction = positiveRating

      return {
        avgBookingApprovalTime: Math.round(avgBookingApprovalTime),
        jobAssignmentAccuracy: Math.round(jobAssignmentAccuracy * 100) / 100,
        avgJobsPerStaff: Math.round(avgJobsPerStaff * 100) / 100,
        calendarUpdatesTriggered: calendarUpdates.length,
        staffResponseRate: 85, // Placeholder - would calculate from actual response data
        totalAIDecisions: logs.length,
        positiveRating: Math.round(positiveRating * 100) / 100,
        negativeRating: Math.round(negativeRating * 100) / 100,
        overallSatisfaction: Math.round(overallSatisfaction * 100) / 100,
      }
    } catch (error) {
      console.error('❌ Error calculating KPIs:', error)
      return {
        avgBookingApprovalTime: 0,
        jobAssignmentAccuracy: 0,
        avgJobsPerStaff: 0,
        calendarUpdatesTriggered: 0,
        staffResponseRate: 0,
        totalAIDecisions: 0,
        positiveRating: 0,
        negativeRating: 0,
        overallSatisfaction: 0,
      }
    }
  }

  /**
   * Get AI decision types for filtering
   */
  getDecisionTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'booking_approved', label: 'Booking Approved' },
      { value: 'booking_rejected', label: 'Booking Rejected' },
      { value: 'job_assigned', label: 'Job Assigned' },
      { value: 'job_created', label: 'Job Created' },
      { value: 'calendar_updated', label: 'Calendar Updated' },
      { value: 'financial_calculated', label: 'Financial Calculated' },
      { value: 'notification_sent', label: 'Notification Sent' },
    ]
  }

  /**
   * Get status types for filtering
   */
  getStatusTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'success', label: 'Success' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
    ]
  }
}

// Export singleton instance
const aiLogsService = new AILogsService()
export default aiLogsService
