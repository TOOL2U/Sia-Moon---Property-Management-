import * as cron from 'node-cron'
import { ReportGenerationService } from './reportGenerationService'

/**
 * Cron service for automated monthly report generation
 */
export class ReportCronService {
  private static monthlyReportJob: cron.ScheduledTask | null = null
  private static isRunning = false
  
  /**
   * Start the automated report generation cron jobs
   */
  static start() {
    if (this.isRunning) {
      console.log('📊 Report cron service is already running')
      return
    }
    
    console.log('🚀 Starting automated report generation service...')
    
    // Schedule monthly report generation for the 1st of each month at 2 AM
    this.monthlyReportJob = cron.schedule('0 2 1 * *', async () => {
      console.log('📊 Running scheduled monthly report generation...')
      await this.generatePreviousMonthReports()
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.monthlyReportJob.start()
    this.isRunning = true
    
    console.log('✅ Report cron service started successfully')
    console.log('📅 Monthly reports will be generated on the 1st of each month at 2:00 AM UTC')
  }
  
  /**
   * Stop the automated report generation
   */
  static stop() {
    if (!this.isRunning) {
      console.log('📊 Report cron service is not running')
      return
    }
    
    console.log('🛑 Stopping automated report generation service...')
    
    if (this.monthlyReportJob) {
      this.monthlyReportJob.stop()
      this.monthlyReportJob = null
    }
    
    this.isRunning = false
    console.log('✅ Report cron service stopped')
  }
  
  /**
   * Get the status of the cron service
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.monthlyReportJob ? 'Next run: 1st of next month at 2:00 AM UTC' : null,
      jobs: {
        monthlyReports: this.monthlyReportJob ? 'Active' : 'Inactive'
      }
    }
  }
  
  /**
   * Generate reports for the previous month
   */
  private static async generatePreviousMonthReports() {
    try {
      const now = new Date()
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const year = previousMonth.getFullYear()
      const month = previousMonth.getMonth() + 1
      
      console.log(`📊 Generating reports for ${year}-${month.toString().padStart(2, '0')}`)
      
      const result = await ReportGenerationService.generateAllPropertyReports(year, month)
      
      if (result.success) {
        console.log(`✅ Monthly report generation completed: ${result.summary.successful}/${result.summary.total} successful`)
        
        // Log any failures
        const failures = result.results.filter(r => !r.success)
        if (failures.length > 0) {
          console.warn('⚠️ Some reports failed to generate:')
          failures.forEach(failure => {
            console.warn(`  - ${failure.error}`)
          })
        }
      } else {
        console.error('❌ Monthly report generation failed')
      }
      
    } catch (error) {
      console.error('❌ Error in scheduled report generation:', error)
    }
  }
  
  /**
   * Manually trigger report generation for a specific month
   */
  static async generateReportsForMonth(year: number, month: number) {
    console.log(`📊 Manually generating reports for ${year}-${month.toString().padStart(2, '0')}`)
    
    try {
      const result = await ReportGenerationService.generateAllPropertyReports(year, month)
      
      if (result.success) {
        console.log(`✅ Manual report generation completed: ${result.summary.successful}/${result.summary.total} successful`)
        return result
      } else {
        console.error('❌ Manual report generation failed')
        return result
      }
      
    } catch (error) {
      console.error('❌ Error in manual report generation:', error)
      return {
        success: false,
        results: [],
        summary: { total: 0, successful: 0, failed: 1 }
      }
    }
  }
  
  /**
   * Generate reports for the current month (for testing)
   */
  static async generateCurrentMonthReports() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    
    return this.generateReportsForMonth(year, month)
  }
}

// Auto-start in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_REPORT_CRON === 'true') {
  ReportCronService.start()
}

export default ReportCronService
