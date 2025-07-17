/**
 * Financial Reporting Service
 * Automated financial reporting and job completion analytics
 */

import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import AIAutomationService from './AIAutomationService'

// Job completion record interface
export interface JobCompletionRecord {
  id: string
  jobId: string
  jobType: string
  propertyId: string
  propertyName?: string
  staffId: string
  staffName?: string
  completedAt: Timestamp
  scheduledDate: Timestamp
  estimatedDuration: number
  actualDuration: number
  staffHourlyRate: number
  staffCost: number
  jobRevenue: number
  materialCosts?: number
  overheadCosts?: number
  totalCosts: number
  grossProfit: number
  profitMargin: number
  photos?: string[]
  qualityRating?: number
  customerFeedback?: string
  notes?: string
  createdAt: Timestamp
  createdBy: string
}

// Financial report interfaces
export interface DailyReport {
  id: string
  date: string
  totalJobs: number
  totalRevenue: number
  totalCosts: number
  netProfit: number
  profitMargin: number
  staffUtilization: number
  averageJobDuration: number
  topPerformingStaff: string[]
  jobBreakdown: {
    [jobType: string]: {
      count: number
      revenue: number
      costs: number
      profit: number
    }
  }
  createdAt: Timestamp
  lastUpdated: Timestamp
}

export interface MonthlyReport {
  id: string
  month: string
  year: number
  totalJobs: number
  totalRevenue: number
  totalCosts: number
  netProfit: number
  profitMargin: number
  staffPerformance: StaffPerformanceMetrics[]
  propertyBreakdown: PropertyFinancialBreakdown[]
  trendAnalysis: {
    revenueGrowth: number
    profitGrowth: number
    jobVolumeGrowth: number
  }
  createdAt: Timestamp
  lastUpdated: Timestamp
}

export interface StaffPerformanceMetrics {
  staffId: string
  staffName: string
  jobsCompleted: number
  totalHours: number
  revenueGenerated: number
  totalCosts: number
  profitGenerated: number
  efficiency: number
  utilizationRate: number
  averageRating?: number
}

export interface PropertyFinancialBreakdown {
  propertyId: string
  propertyName: string
  jobsCompleted: number
  revenue: number
  costs: number
  profit: number
  profitMargin: number
}

// Real-time financial metrics
export interface RealTimeFinancialMetrics {
  todayRevenue: number
  todayCosts: number
  todayProfit: number
  todayJobs: number
  monthToDateRevenue: number
  monthToDateProfit: number
  profitMargin: number
  topPerformingStaff: string
  mostProfitableJobType: string
  lastUpdated: Date
}

// Job pricing configuration
const JOB_PRICING = {
  pre_cleaning: { baseRate: 150, hourlyRate: 45 },
  check_in_prep: { baseRate: 75, hourlyRate: 35 },
  post_cleaning: { baseRate: 120, hourlyRate: 40 },
  maintenance_check: { baseRate: 100, hourlyRate: 50 },
  maintenance: { baseRate: 125, hourlyRate: 55 },
  inspection: { baseRate: 80, hourlyRate: 40 },
} as const

// Staff hourly rates (default values)
const DEFAULT_STAFF_RATES = {
  cleaning: 25,
  maintenance: 35,
  hospitality: 30,
  management: 45,
} as const

class FinancialReportingService {
  private jobListener: (() => void) | null = null
  private isInitialized = false

  // Performance tracking
  private metrics = {
    reportsGenerated: 0,
    calculationErrors: 0,
    averageProcessingTime: 0,
    lastReportGenerated: null as Date | null,
  }

  /**
   * Initialize the Financial Reporting Service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Financial Reporting Service already initialized')
      return
    }

    try {
      console.log('💰 Initializing Financial Reporting Service...')

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          '⚠️ AI automation disabled - Financial reporting will not monitor automated events'
        )
        return
      }

      // Set up job completion listener
      this.setupJobCompletionListener()

      this.isInitialized = true
      console.log('✅ Financial Reporting Service initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing Financial Reporting Service:', error)
    }
  }

  /**
   * Set up listener for completed jobs
   */
  private setupJobCompletionListener(): void {
    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }

    const jobsRef = collection(db, 'jobs')
    const completedJobsQuery = query(
      jobsRef,
      where('status', '==', 'completed'),
      where('financialRecordCreated', '!=', true) // Only process jobs that haven't been recorded yet
    )

    this.jobListener = onSnapshot(
      completedJobsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const jobId = change.doc.id
            const jobData = change.doc.data()

            // Process completed job for financial recording
            this.processCompletedJob({
              id: jobId,
              ...jobData,
            })
          }
        })
      },
      (error) => {
        console.error('❌ Error in job completion listener:', error)
        this.metrics.calculationErrors++
      }
    )

    console.log('💰 Monitoring completed jobs for financial reporting')
  }

  /**
   * Process a completed job for financial recording
   */
  private async processCompletedJob(job: any): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(
        `💰 Processing completed job ${job.id} for financial recording`
      )

      // Check if AI automation is still enabled
      const aiEnabled = await AIAutomationService.isEnabled()
      if (!aiEnabled) {
        console.log(
          `⚠️ AI automation disabled - skipping financial recording for job ${job.id}`
        )
        return
      }

      // Create job completion record
      const completionRecord = await this.createJobCompletionRecord(job)

      if (completionRecord) {
        // Update daily report
        await this.updateDailyReport(completionRecord)

        // Update monthly report
        await this.updateMonthlyReport(completionRecord)

        // Mark job as financially recorded
        await updateDoc(doc(db, 'jobs', job.id), {
          financialRecordCreated: true,
          financialRecordCreatedAt: serverTimestamp(),
          financialRecordId: completionRecord.id,
        })

        this.metrics.reportsGenerated++
        this.metrics.averageProcessingTime =
          (this.metrics.averageProcessingTime *
            (this.metrics.reportsGenerated - 1) +
            (Date.now() - startTime)) /
          this.metrics.reportsGenerated
        this.metrics.lastReportGenerated = new Date()

        console.log(`✅ Financial record created for job ${job.id}`)
        toast.success(`💰 Financial record updated for ${job.title}`)
      }
    } catch (error) {
      console.error(`❌ Error processing completed job ${job.id}:`, error)
      this.metrics.calculationErrors++

      // Log error to audit trail
      await this.logToAuditTrail({
        action: 'financial_recording_error',
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      })
    }
  }

  /**
   * Create job completion record with financial calculations
   */
  private async createJobCompletionRecord(
    job: any
  ): Promise<JobCompletionRecord | null> {
    try {
      // Calculate actual duration (if not provided, use estimated)
      const actualDuration = job.actualDuration || job.estimatedDuration || 60

      // Get staff hourly rate
      const staffHourlyRate = await this.getStaffHourlyRate(
        job.assignedStaff,
        job.requiredSkills
      )

      // Calculate costs
      const staffCost = (actualDuration / 60) * staffHourlyRate
      const materialCosts = job.materialCosts || 0
      const overheadCosts = staffCost * 0.15 // 15% overhead
      const totalCosts = staffCost + materialCosts + overheadCosts

      // Calculate revenue
      const jobRevenue = this.calculateJobRevenue(job.type, actualDuration)

      // Calculate profit metrics
      const grossProfit = jobRevenue - totalCosts
      const profitMargin = jobRevenue > 0 ? (grossProfit / jobRevenue) * 100 : 0

      const completionRecord: Partial<JobCompletionRecord> = {
        jobId: job.id,
        jobType: job.type,
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        staffId: job.assignedStaff,
        staffName: job.assignedStaffName,
        completedAt: job.completedAt || serverTimestamp(),
        scheduledDate: job.scheduledDate,
        estimatedDuration: job.estimatedDuration || 60,
        actualDuration,
        staffHourlyRate,
        staffCost,
        jobRevenue,
        materialCosts,
        overheadCosts,
        totalCosts,
        grossProfit,
        profitMargin,
        photos: job.completionPhotos || [],
        qualityRating: job.qualityRating,
        customerFeedback: job.customerFeedback,
        notes: job.completionNotes,
        createdAt: serverTimestamp(),
        createdBy: 'FINANCIAL_AUTO_REPORTING',
      }

      const recordRef = doc(collection(db, 'jobCompletions'))
      await setDoc(recordRef, completionRecord)

      return { id: recordRef.id, ...completionRecord } as JobCompletionRecord
    } catch (error) {
      console.error('❌ Error creating job completion record:', error)
      return null
    }
  }

  /**
   * Get staff hourly rate
   */
  private async getStaffHourlyRate(
    staffId: string,
    requiredSkills: string[] = []
  ): Promise<number> {
    try {
      // Try to get staff-specific rate from database
      const staffDoc = await getDocs(
        query(collection(db, 'staff'), where('id', '==', staffId), limit(1))
      )

      if (!staffDoc.empty) {
        const staffData = staffDoc.docs[0].data()
        if (staffData.hourlyRate) {
          return staffData.hourlyRate
        }
      }

      // Fall back to skill-based default rates
      if (requiredSkills.length > 0) {
        const skill = requiredSkills[0]
        if (skill in DEFAULT_STAFF_RATES) {
          return DEFAULT_STAFF_RATES[skill as keyof typeof DEFAULT_STAFF_RATES]
        }
      }

      // Default rate
      return 30
    } catch (error) {
      console.error('❌ Error getting staff hourly rate:', error)
      return 30 // Default fallback
    }
  }

  /**
   * Calculate job revenue based on type and duration
   */
  private calculateJobRevenue(jobType: string, actualDuration: number): number {
    const pricing = JOB_PRICING[jobType as keyof typeof JOB_PRICING]

    if (!pricing) {
      // Default pricing for unknown job types
      return actualDuration * 0.75 // $45/hour default
    }

    const hours = actualDuration / 60
    return pricing.baseRate + hours * pricing.hourlyRate
  }

  /**
   * Log to audit trail
   */
  private async logToAuditTrail(logData: any): Promise<void> {
    try {
      const auditLogRef = doc(collection(db, 'auditLogs'))
      await setDoc(auditLogRef, {
        ...logData,
        timestamp: serverTimestamp(),
        system: 'FINANCIAL_REPORTING_SERVICE',
      })
    } catch (error) {
      console.error('❌ Failed to write to audit log:', error)
    }
  }

  /**
   * Update daily report with new completion record
   */
  private async updateDailyReport(
    completionRecord: JobCompletionRecord
  ): Promise<void> {
    try {
      const date = completionRecord.completedAt
        .toDate()
        .toISOString()
        .split('T')[0]
      const reportId = `daily_${date}`

      await runTransaction(db, async (transaction) => {
        const reportRef = doc(db, 'reports/daily', reportId)
        const reportDoc = await transaction.get(reportRef)

        if (reportDoc.exists()) {
          // Update existing report
          const existingData = reportDoc.data() as DailyReport

          const updatedReport: Partial<DailyReport> = {
            totalJobs: existingData.totalJobs + 1,
            totalRevenue:
              existingData.totalRevenue + completionRecord.jobRevenue,
            totalCosts: existingData.totalCosts + completionRecord.totalCosts,
            netProfit: existingData.netProfit + completionRecord.grossProfit,
            profitMargin:
              ((existingData.netProfit + completionRecord.grossProfit) /
                (existingData.totalRevenue + completionRecord.jobRevenue)) *
              100,
            lastUpdated: serverTimestamp(),
            jobBreakdown: {
              ...existingData.jobBreakdown,
              [completionRecord.jobType]: {
                count:
                  (existingData.jobBreakdown[completionRecord.jobType]?.count ||
                    0) + 1,
                revenue:
                  (existingData.jobBreakdown[completionRecord.jobType]
                    ?.revenue || 0) + completionRecord.jobRevenue,
                costs:
                  (existingData.jobBreakdown[completionRecord.jobType]?.costs ||
                    0) + completionRecord.totalCosts,
                profit:
                  (existingData.jobBreakdown[completionRecord.jobType]
                    ?.profit || 0) + completionRecord.grossProfit,
              },
            },
          }

          transaction.update(reportRef, updatedReport)
        } else {
          // Create new daily report
          const newReport: Partial<DailyReport> = {
            date,
            totalJobs: 1,
            totalRevenue: completionRecord.jobRevenue,
            totalCosts: completionRecord.totalCosts,
            netProfit: completionRecord.grossProfit,
            profitMargin: completionRecord.profitMargin,
            staffUtilization: 0, // Will be calculated separately
            averageJobDuration: completionRecord.actualDuration,
            topPerformingStaff: [completionRecord.staffId],
            jobBreakdown: {
              [completionRecord.jobType]: {
                count: 1,
                revenue: completionRecord.jobRevenue,
                costs: completionRecord.totalCosts,
                profit: completionRecord.grossProfit,
              },
            },
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }

          transaction.set(reportRef, newReport)
        }
      })

      console.log(`📊 Updated daily report for ${date}`)
    } catch (error) {
      console.error('❌ Error updating daily report:', error)
      throw error
    }
  }

  /**
   * Update monthly report with new completion record
   */
  private async updateMonthlyReport(
    completionRecord: JobCompletionRecord
  ): Promise<void> {
    try {
      const date = completionRecord.completedAt.toDate()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const reportId = `monthly_${year}_${month}`

      await runTransaction(db, async (transaction) => {
        const reportRef = doc(db, 'reports/monthly', reportId)
        const reportDoc = await transaction.get(reportRef)

        if (reportDoc.exists()) {
          // Update existing report
          const existingData = reportDoc.data() as MonthlyReport

          const updatedReport: Partial<MonthlyReport> = {
            totalJobs: existingData.totalJobs + 1,
            totalRevenue:
              existingData.totalRevenue + completionRecord.jobRevenue,
            totalCosts: existingData.totalCosts + completionRecord.totalCosts,
            netProfit: existingData.netProfit + completionRecord.grossProfit,
            profitMargin:
              ((existingData.netProfit + completionRecord.grossProfit) /
                (existingData.totalRevenue + completionRecord.jobRevenue)) *
              100,
            lastUpdated: serverTimestamp(),
          }

          transaction.update(reportRef, updatedReport)
        } else {
          // Create new monthly report
          const newReport: Partial<MonthlyReport> = {
            month,
            year,
            totalJobs: 1,
            totalRevenue: completionRecord.jobRevenue,
            totalCosts: completionRecord.totalCosts,
            netProfit: completionRecord.grossProfit,
            profitMargin: completionRecord.profitMargin,
            staffPerformance: [],
            propertyBreakdown: [],
            trendAnalysis: {
              revenueGrowth: 0,
              profitGrowth: 0,
              jobVolumeGrowth: 0,
            },
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }

          transaction.set(reportRef, newReport)
        }
      })

      console.log(`📊 Updated monthly report for ${year}-${month}`)
    } catch (error) {
      console.error('❌ Error updating monthly report:', error)
      throw error
    }
  }

  /**
   * Get real-time financial metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeFinancialMetrics> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = new Date().toISOString().slice(0, 7)

      // Get today's report
      const todayReportQuery = query(
        collection(db, 'reports/daily'),
        where('date', '==', today),
        limit(1)
      )

      const todayReports = await getDocs(todayReportQuery)
      const todayData = todayReports.empty
        ? null
        : (todayReports.docs[0].data() as DailyReport)

      // Get month-to-date data
      const monthReports = await getDocs(
        query(
          collection(db, 'reports/daily'),
          where('date', '>=', currentMonth + '-01'),
          where('date', '<=', today)
        )
      )

      let monthToDateRevenue = 0
      let monthToDateProfit = 0

      monthReports.forEach((doc) => {
        const data = doc.data() as DailyReport
        monthToDateRevenue += data.totalRevenue
        monthToDateProfit += data.netProfit
      })

      return {
        todayRevenue: todayData?.totalRevenue || 0,
        todayCosts: todayData?.totalCosts || 0,
        todayProfit: todayData?.netProfit || 0,
        todayJobs: todayData?.totalJobs || 0,
        monthToDateRevenue,
        monthToDateProfit,
        profitMargin: todayData?.profitMargin || 0,
        topPerformingStaff: todayData?.topPerformingStaff?.[0] || 'N/A',
        mostProfitableJobType: this.getMostProfitableJobType(
          todayData?.jobBreakdown
        ),
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error('❌ Error getting real-time metrics:', error)
      return {
        todayRevenue: 0,
        todayCosts: 0,
        todayProfit: 0,
        todayJobs: 0,
        monthToDateRevenue: 0,
        monthToDateProfit: 0,
        profitMargin: 0,
        topPerformingStaff: 'N/A',
        mostProfitableJobType: 'N/A',
        lastUpdated: new Date(),
      }
    }
  }

  /**
   * Get most profitable job type from breakdown
   */
  private getMostProfitableJobType(
    jobBreakdown?: DailyReport['jobBreakdown']
  ): string {
    if (!jobBreakdown) return 'N/A'

    let maxProfit = 0
    let mostProfitable = 'N/A'

    Object.entries(jobBreakdown).forEach(([jobType, data]) => {
      if (data.profit > maxProfit) {
        maxProfit = data.profit
        mostProfitable = jobType
      }
    })

    return mostProfitable
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return { ...this.metrics }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }
    this.isInitialized = false
    console.log('🧹 Financial Reporting Service cleaned up')
  }
}

// Export singleton instance
const financialReportingService = new FinancialReportingService()
export default financialReportingService
