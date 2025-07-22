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
  setDoc,
  Timestamp 
} from 'firebase/firestore'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface JobSessionData {
  jobId: string
  staffId: string
  sessionId: string
  
  // Performance timing
  startTime: string
  endTime: string
  totalDuration: number // minutes
  
  // Location verification
  startLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
  }
  endLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
  }
  
  // Task execution metrics
  checklistData: Array<{
    id: string
    title: string
    required: boolean
    completed: boolean
    completedAt?: string
    notes?: string
  }>
  
  // Documentation quality
  photos: Record<string, {
    id: string
    filename: string
    timestamp: string
    description: string
  }>
  notes: string[]
  
  // Calculated performance metrics
  checklistCompletionRate: number
  requiredTasksCompleted: boolean
  photoCount: number
  noteCount: number
  
  // Context for analysis
  jobDetails: {
    title: string
    description: string
    category: string
    priority: string
    estimatedDuration: number
    specialInstructions?: string
  }
  
  staffDetails: {
    staffId: string
    name: string
    role: string
    department: string
  }
}

export interface StaffMetrics {
  // Time efficiency
  averageJobDuration: number
  onTimePerformance: number
  
  // Quality indicators
  averageCompletionRate: number
  documentationScore: number
  
  // Consistency metrics
  locationAccuracy: number
  noteQuality: number
  
  // Additional metrics
  sessionCount: number
  totalJobsCompleted: number
}

export interface AIAnalysis {
  performanceScore: number
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  trends: string[]
  summary: string
}

export interface AuditReport {
  staffId: string
  staffName: string
  reportPeriod: {
    start: string
    end: string
  }
  generatedAt: string
  performanceScore: number
  analysis: AIAnalysis
  rawMetrics: StaffMetrics
  sessionCount: number
  recommendations: string[]
  trends: string[]
  anomalies: string[]
}

export class AIAuditService {
  private static db = getDb()

  /**
   * Get job sessions for a staff member within a date range
   */
  static async getJobSessionsForStaff(
    staffId: string, 
    dateRange: { start: Date; end: Date }
  ): Promise<JobSessionData[]> {
    try {
      console.log(`📊 Fetching job sessions for staff: ${staffId}`)
      
      const sessionsQuery = query(
        collection(this.db, 'job_sessions'),
        where('staffId', '==', staffId),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.end)),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(sessionsQuery)
      const sessions: JobSessionData[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        sessions.push({
          ...data as JobSessionData,
          jobId: doc.id
        })
      })
      
      console.log(`✅ Retrieved ${sessions.length} job sessions for analysis`)
      return sessions
    } catch (error) {
      console.error(`❌ Error fetching job sessions for ${staffId}:`, error)
      return []
    }
  }

  /**
   * Calculate performance metrics from job sessions
   */
  static calculateStaffMetrics(sessions: JobSessionData[]): StaffMetrics {
    if (sessions.length === 0) {
      return {
        averageJobDuration: 0,
        onTimePerformance: 0,
        averageCompletionRate: 0,
        documentationScore: 0,
        locationAccuracy: 0,
        noteQuality: 0,
        sessionCount: 0,
        totalJobsCompleted: 0
      }
    }

    const completedSessions = sessions.filter(s => s.checklistCompletionRate > 0)
    
    return {
      // Time efficiency
      averageJobDuration: sessions.reduce((sum, s) => sum + s.totalDuration, 0) / sessions.length,
      onTimePerformance: sessions.filter(s => 
        s.totalDuration <= s.jobDetails.estimatedDuration
      ).length / sessions.length,
      
      // Quality indicators
      averageCompletionRate: sessions.reduce((sum, s) => sum + s.checklistCompletionRate, 0) / sessions.length,
      documentationScore: sessions.reduce((sum, s) => sum + s.photoCount, 0) / sessions.length,
      
      // Consistency metrics
      locationAccuracy: sessions.filter(s => s.startLocation && s.endLocation).length / sessions.length,
      noteQuality: sessions.reduce((sum, s) => sum + s.noteCount, 0) / sessions.length,
      
      // Additional metrics
      sessionCount: sessions.length,
      totalJobsCompleted: completedSessions.length
    }
  }

  /**
   * Generate AI-powered performance analysis using OpenAI
   */
  static async generatePerformanceAnalysis(
    staffMetrics: StaffMetrics, 
    sessionDetails: JobSessionData[],
    staffName: string
  ): Promise<AIAnalysis> {
    try {
      console.log(`🤖 Generating AI analysis for ${staffName}`)
      
      const prompt = `
Analyze this staff member's job performance data and provide actionable management insights:

STAFF: ${staffName}
ANALYSIS PERIOD: ${sessionDetails.length} job sessions

PERFORMANCE METRICS:
- Average job duration: ${staffMetrics.averageJobDuration.toFixed(1)} minutes
- On-time completion rate: ${(staffMetrics.onTimePerformance * 100).toFixed(1)}%
- Task completion rate: ${staffMetrics.averageCompletionRate.toFixed(1)}%
- Documentation score: ${staffMetrics.documentationScore.toFixed(1)} photos per job
- Location accuracy: ${(staffMetrics.locationAccuracy * 100).toFixed(1)}%
- Note quality: ${staffMetrics.noteQuality.toFixed(1)} notes per job

RECENT SESSION SAMPLE:
${JSON.stringify(sessionDetails.slice(0, 3), null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "performanceScore": <number 1-100>,
  "strengths": [<array of key strengths>],
  "improvements": [<array of areas needing improvement>],
  "recommendations": [<array of specific actionable recommendations>],
  "trends": [<array of performance trends observed>],
  "summary": "<brief executive summary for management>"
}

Focus on actionable insights that management can use to improve performance and efficiency.
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      })

      const analysisText = completion.choices[0].message.content
      if (!analysisText) {
        throw new Error('No analysis generated by OpenAI')
      }

      const analysis = JSON.parse(analysisText) as AIAnalysis
      console.log(`✅ AI analysis generated with score: ${analysis.performanceScore}`)
      
      return analysis
    } catch (error) {
      console.error('❌ Error generating AI analysis:', error)
      
      // Fallback analysis if OpenAI fails
      return {
        performanceScore: this.calculateFallbackScore(staffMetrics),
        strengths: ['Consistent job completion'],
        improvements: ['Performance analysis unavailable'],
        recommendations: ['Review performance manually'],
        trends: ['Unable to analyze trends'],
        summary: 'AI analysis temporarily unavailable - manual review recommended'
      }
    }
  }

  /**
   * Calculate performance score using weighted algorithm
   */
  static calculatePerformanceScore(metrics: StaffMetrics): number {
    const weights = {
      timeEfficiency: 0.25,    // On-time completion
      taskCompletion: 0.30,    // Checklist completion rate
      documentation: 0.20,     // Photo/note quality
      consistency: 0.15,       // Regular performance
      improvement: 0.10        // Trend analysis
    }
    
    // Calculate weighted score (0-100)
    const score = 
      (metrics.onTimePerformance * weights.timeEfficiency * 100) +
      (metrics.averageCompletionRate * weights.taskCompletion) +
      (Math.min(metrics.documentationScore / 3, 1) * weights.documentation * 100) +
      (metrics.locationAccuracy * weights.consistency * 100) +
      (50 * weights.improvement) // Placeholder for improvement trend
      
    return Math.round(Math.max(0, Math.min(100, score)))
  }

  /**
   * Fallback score calculation when AI analysis fails
   */
  private static calculateFallbackScore(metrics: StaffMetrics): number {
    return this.calculatePerformanceScore(metrics)
  }

  /**
   * Generate weekly audit report for a staff member
   */
  static async generateWeeklyAuditReport(staffId: string, staffName: string): Promise<AuditReport> {
    try {
      console.log(`📋 Generating weekly audit report for ${staffName}`)
      
      // 1. Define date range (last 7 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      // 2. Collect job session data
      const sessions = await this.getJobSessionsForStaff(staffId, { start: startDate, end: endDate })
      
      if (sessions.length === 0) {
        console.log(`⚠️ No job sessions found for ${staffName} in the last week`)
      }
      
      // 3. Calculate performance metrics
      const metrics = this.calculateStaffMetrics(sessions)
      
      // 4. Generate AI analysis
      const analysis = await this.generatePerformanceAnalysis(metrics, sessions, staffName)
      
      // 5. Create report document
      const report: AuditReport = {
        staffId,
        staffName,
        reportPeriod: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        generatedAt: new Date().toISOString(),
        performanceScore: analysis.performanceScore,
        analysis,
        rawMetrics: metrics,
        sessionCount: sessions.length,
        recommendations: analysis.recommendations,
        trends: analysis.trends,
        anomalies: this.detectAnomalies(sessions, metrics)
      }
      
      // 6. Store report in Firestore
      const reportId = `week_${this.getWeekIdentifier()}`
      await setDoc(
        doc(this.db, 'ai_audits', staffId, 'reports', reportId),
        report
      )
      
      console.log(`✅ Weekly audit report generated for ${staffName}`)
      return report
    } catch (error) {
      console.error(`❌ Error generating audit report for ${staffId}:`, error)
      throw error
    }
  }

  /**
   * Detect performance anomalies in job sessions
   */
  private static detectAnomalies(sessions: JobSessionData[], metrics: StaffMetrics): string[] {
    const anomalies: string[] = []
    
    // Duration anomalies
    const longJobs = sessions.filter(s => s.totalDuration > s.jobDetails.estimatedDuration * 1.5)
    if (longJobs.length > 0) {
      anomalies.push(`${longJobs.length} jobs took significantly longer than estimated`)
    }
    
    // Quality anomalies
    const lowCompletion = sessions.filter(s => s.checklistCompletionRate < 80)
    if (lowCompletion.length > 0) {
      anomalies.push(`${lowCompletion.length} jobs had low task completion rates`)
    }
    
    // Location anomalies
    const missingLocation = sessions.filter(s => !s.startLocation || !s.endLocation)
    if (missingLocation.length > 0) {
      anomalies.push(`${missingLocation.length} jobs missing GPS location data`)
    }
    
    // Documentation anomalies
    if (metrics.documentationScore < 1) {
      anomalies.push('Low photo documentation across jobs')
    }
    
    return anomalies
  }

  /**
   * Get week identifier for report naming
   */
  private static getWeekIdentifier(): string {
    const now = new Date()
    const year = now.getFullYear()
    const week = Math.ceil(((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7)
    return `${year}_W${week.toString().padStart(2, '0')}`
  }
}
