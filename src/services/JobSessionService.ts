import { getDb } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'

export interface JobSessionData {
  jobId: string
  staffId: string
  staffName: string
  startTime: Timestamp | Date
  endTime?: Timestamp | Date
  status: 'in_progress' | 'completed' | 'paused'
  location?: {
    latitude: number
    longitude: number
    timestamp: Timestamp | Date
  }
  photos?: Array<{
    url: string
    timestamp: Timestamp | Date
    type: 'before' | 'during' | 'after'
  }>
  notes?: string
  completionData?: {
    tasksCompleted: string[]
    issuesFound: string[]
    suppliesUsed: string[]
    timeSpent: number // minutes
  }
  aiAuditTriggered?: boolean
  auditScore?: number
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface StaffAuditReport {
  staffId: string
  staffName: string
  period: {
    start: Date
    end: Date
  }
  metrics: {
    totalJobs: number
    completedJobs: number
    averageCompletionTime: number
    averageAuditScore: number
    onTimeCompletion: number
    issuesReported: number
  }
  recentSessions: JobSessionData[]
  aiInsights: string[]
  recommendations: string[]
  generatedAt: Date
}

export class JobSessionService {
  private static db = getDb()

  /**
   * Fetch job session data for a specific job
   */
  static async getJobSession(jobId: string): Promise<JobSessionData | null> {
    try {
      console.log(`📋 Fetching job session data for job: ${jobId}`)
      
      const sessionRef = doc(this.db, 'job_sessions', jobId)
      const sessionDoc = await getDoc(sessionRef)
      
      if (!sessionDoc.exists()) {
        console.log(`⚠️ No session data found for job: ${jobId}`)
        return null
      }
      
      const sessionData = sessionDoc.data() as JobSessionData
      console.log(`✅ Retrieved session data for job: ${jobId}`)
      
      return {
        ...sessionData,
        jobId: sessionDoc.id
      }
    } catch (error) {
      console.error(`❌ Error fetching job session for ${jobId}:`, error)
      return null
    }
  }

  /**
   * Fetch all job sessions for a specific staff member
   */
  static async getStaffJobSessions(
    staffId: string, 
    limitCount: number = 50
  ): Promise<JobSessionData[]> {
    try {
      console.log(`👤 Fetching job sessions for staff: ${staffId}`)
      
      const sessionsQuery = query(
        collection(this.db, 'job_sessions'),
        where('staffId', '==', staffId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(sessionsQuery)
      const sessions: JobSessionData[] = []
      
      snapshot.forEach((doc) => {
        sessions.push({
          ...doc.data() as JobSessionData,
          jobId: doc.id
        })
      })
      
      console.log(`✅ Retrieved ${sessions.length} sessions for staff: ${staffId}`)
      return sessions
    } catch (error) {
      console.error(`❌ Error fetching staff sessions for ${staffId}:`, error)
      return []
    }
  }

  /**
   * Generate AI audit report for a staff member
   */
  static async generateStaffAuditReport(
    staffId: string,
    staffName: string,
    periodDays: number = 30
  ): Promise<StaffAuditReport> {
    try {
      console.log(`🤖 Generating AI audit report for ${staffName} (${periodDays} days)`)
      
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays)
      
      // Fetch recent sessions
      const sessions = await this.getStaffJobSessions(staffId, 100)
      const periodSessions = sessions.filter(session => {
        const sessionDate = session.createdAt instanceof Timestamp 
          ? session.createdAt.toDate() 
          : new Date(session.createdAt)
        return sessionDate >= startDate && sessionDate <= endDate
      })
      
      // Calculate metrics
      const completedSessions = periodSessions.filter(s => s.status === 'completed')
      const totalCompletionTime = completedSessions.reduce((sum, session) => {
        if (session.completionData?.timeSpent) {
          return sum + session.completionData.timeSpent
        }
        return sum
      }, 0)
      
      const auditScores = completedSessions
        .filter(s => s.auditScore !== undefined)
        .map(s => s.auditScore!)
      
      const averageAuditScore = auditScores.length > 0 
        ? auditScores.reduce((sum, score) => sum + score, 0) / auditScores.length 
        : 0
      
      const issuesReported = completedSessions.reduce((sum, session) => {
        return sum + (session.completionData?.issuesFound?.length || 0)
      }, 0)
      
      // Generate AI insights
      const aiInsights = this.generateAIInsights(periodSessions, {
        averageAuditScore,
        completionRate: completedSessions.length / Math.max(periodSessions.length, 1),
        averageTime: totalCompletionTime / Math.max(completedSessions.length, 1)
      })
      
      const recommendations = this.generateRecommendations(periodSessions, {
        averageAuditScore,
        issuesReported,
        completionRate: completedSessions.length / Math.max(periodSessions.length, 1)
      })
      
      const report: StaffAuditReport = {
        staffId,
        staffName,
        period: { start: startDate, end: endDate },
        metrics: {
          totalJobs: periodSessions.length,
          completedJobs: completedSessions.length,
          averageCompletionTime: totalCompletionTime / Math.max(completedSessions.length, 1),
          averageAuditScore,
          onTimeCompletion: completedSessions.length, // TODO: Calculate based on scheduled vs actual time
          issuesReported
        },
        recentSessions: periodSessions.slice(0, 10), // Last 10 sessions
        aiInsights,
        recommendations,
        generatedAt: new Date()
      }
      
      console.log(`✅ Generated audit report for ${staffName}:`, {
        totalJobs: report.metrics.totalJobs,
        completedJobs: report.metrics.completedJobs,
        averageScore: report.metrics.averageAuditScore.toFixed(1)
      })
      
      return report
    } catch (error) {
      console.error(`❌ Error generating audit report for ${staffId}:`, error)
      throw error
    }
  }

  /**
   * Generate AI insights based on session data
   */
  private static generateAIInsights(
    sessions: JobSessionData[], 
    metrics: { averageAuditScore: number; completionRate: number; averageTime: number }
  ): string[] {
    const insights: string[] = []
    
    if (metrics.averageAuditScore >= 8.5) {
      insights.push("🌟 Exceptional performance with consistently high-quality work")
    } else if (metrics.averageAuditScore >= 7.0) {
      insights.push("✅ Good performance with room for minor improvements")
    } else if (metrics.averageAuditScore >= 5.0) {
      insights.push("⚠️ Average performance - consider additional training")
    } else {
      insights.push("🔴 Below average performance - immediate attention required")
    }
    
    if (metrics.completionRate >= 0.9) {
      insights.push("📈 Excellent job completion rate")
    } else if (metrics.completionRate < 0.7) {
      insights.push("📉 Low completion rate - investigate potential blockers")
    }
    
    if (metrics.averageTime > 0) {
      if (metrics.averageTime < 60) {
        insights.push("⚡ Efficient time management")
      } else if (metrics.averageTime > 120) {
        insights.push("🐌 Jobs taking longer than expected - review processes")
      }
    }
    
    return insights
  }

  /**
   * Generate recommendations based on performance data
   */
  private static generateRecommendations(
    sessions: JobSessionData[],
    metrics: { averageAuditScore: number; issuesReported: number; completionRate: number }
  ): string[] {
    const recommendations: string[] = []
    
    if (metrics.averageAuditScore < 7.0) {
      recommendations.push("📚 Schedule additional training sessions")
      recommendations.push("👥 Pair with high-performing team member for mentoring")
    }
    
    if (metrics.issuesReported > 5) {
      recommendations.push("🔧 Review equipment and supply allocation")
      recommendations.push("📋 Implement preventive maintenance checklist")
    }
    
    if (metrics.completionRate < 0.8) {
      recommendations.push("⏰ Review job scheduling and time allocation")
      recommendations.push("🎯 Focus on task prioritization training")
    }
    
    if (recommendations.length === 0) {
      recommendations.push("🎉 Continue excellent work - consider leadership opportunities")
    }
    
    return recommendations
  }

  /**
   * Listen to real-time job session updates
   */
  static subscribeToJobSession(
    jobId: string, 
    callback: (sessionData: JobSessionData | null) => void
  ): () => void {
    const sessionRef = doc(this.db, 'job_sessions', jobId)
    
    return onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = {
          ...doc.data() as JobSessionData,
          jobId: doc.id
        }
        callback(sessionData)
      } else {
        callback(null)
      }
    }, (error) => {
      console.error(`❌ Error listening to job session ${jobId}:`, error)
      callback(null)
    })
  }
}
