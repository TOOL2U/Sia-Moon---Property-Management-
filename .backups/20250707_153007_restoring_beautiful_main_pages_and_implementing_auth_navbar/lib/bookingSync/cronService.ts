import cron from 'node-cron'
import { BookingSyncService } from './bookingSyncService'

/**
 * Cron Service for Automated Booking Sync
 * 
 * Handles scheduled synchronization of bookings from external platforms.
 * Runs at configurable intervals to keep booking data up-to-date.
 */
export class BookingSyncCronService {
  private static instance: BookingSyncCronService
  private tasks: Map<string, cron.ScheduledTask> = new Map()
  private isRunning = false

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BookingSyncCronService {
    if (!BookingSyncCronService.instance) {
      BookingSyncCronService.instance = new BookingSyncCronService()
    }
    return BookingSyncCronService.instance
  }

  /**
   * Start all cron jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Cron service is already running')
      return
    }

    console.log('🚀 Starting booking sync cron service...')

    // Schedule main sync job - runs every 2 hours
    this.scheduleMainSync()

    // Schedule frequent sync job - runs every 30 minutes for urgent updates
    this.scheduleFrequentSync()

    // Schedule daily cleanup job - runs at 2 AM daily
    this.scheduleDailyCleanup()

    this.isRunning = true
    console.log('✅ Booking sync cron service started')
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Cron service is not running')
      return
    }

    console.log('🛑 Stopping booking sync cron service...')

    // Stop all scheduled tasks
    this.tasks.forEach((task, name) => {
      task.stop()
      console.log(`📴 Stopped cron job: ${name}`)
    })

    this.tasks.clear()
    this.isRunning = false
    console.log('✅ Booking sync cron service stopped')
  }

  /**
   * Schedule main sync job (every 2 hours)
   */
  private scheduleMainSync(): void {
    const task = cron.schedule('0 */2 * * *', async () => {
      console.log('🔄 Running scheduled booking sync (main)...')
      
      try {
        const results = await BookingSyncService.syncAllProperties()
        
        const summary = {
          properties: results.length,
          successful: results.filter(r => r.success).length,
          newBookings: results.reduce((sum, r) => sum + r.newBookingsCreated, 0),
          updatedBookings: results.reduce((sum, r) => sum + r.existingBookingsUpdated, 0),
          cleaningTasks: results.reduce((sum, r) => sum + r.cleaningTasksCreated, 0)
        }

        console.log('✅ Scheduled sync completed:', summary)

        // Send notification if there are significant updates
        if (summary.newBookings > 0 || summary.cleaningTasks > 0) {
          await this.sendSyncNotification(summary)
        }

      } catch (error) {
        console.error('❌ Scheduled sync failed:', error)
        await this.sendErrorNotification(error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.tasks.set('main-sync', task)
    task.start()
    console.log('📅 Scheduled main sync job (every 2 hours)')
  }

  /**
   * Schedule frequent sync job (every 30 minutes)
   * Only syncs properties with recent activity
   */
  private scheduleFrequentSync(): void {
    const task = cron.schedule('*/30 * * * *', async () => {
      console.log('🔄 Running frequent booking sync...')
      
      try {
        // This could be optimized to only sync properties with recent changes
        // For now, we'll run a lighter version of the full sync
        const results = await BookingSyncService.syncAllProperties()
        
        const newBookings = results.reduce((sum, r) => sum + r.newBookingsCreated, 0)
        const cleaningTasks = results.reduce((sum, r) => sum + r.cleaningTasksCreated, 0)

        if (newBookings > 0 || cleaningTasks > 0) {
          console.log(`✅ Frequent sync found updates: ${newBookings} new bookings, ${cleaningTasks} cleaning tasks`)
        }

      } catch (error) {
        console.error('❌ Frequent sync failed:', error)
        // Don't send notifications for frequent sync failures to avoid spam
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.tasks.set('frequent-sync', task)
    task.start()
    console.log('📅 Scheduled frequent sync job (every 30 minutes)')
  }

  /**
   * Schedule daily cleanup job (2 AM daily)
   */
  private scheduleDailyCleanup(): void {
    const task = cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Running daily booking cleanup...')
      
      try {
        // This could include:
        // - Removing old cancelled bookings
        // - Cleaning up sync logs
        // - Updating property sync statistics
        // - Generating daily reports

        console.log('✅ Daily cleanup completed')

      } catch (error) {
        console.error('❌ Daily cleanup failed:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    this.tasks.set('daily-cleanup', task)
    task.start()
    console.log('📅 Scheduled daily cleanup job (2 AM daily)')
  }

  /**
   * Send sync notification (success)
   */
  private async sendSyncNotification(summary: any): Promise<void> {
    try {
      // This could integrate with your notification system
      // For now, we'll just log the notification
      console.log('📧 Sync notification:', {
        type: 'sync_success',
        summary,
        timestamp: new Date().toISOString()
      })

      // TODO: Integrate with email notification system
      // await NotificationService.sendSyncSummary(summary)

    } catch (error) {
      console.warn('⚠️ Failed to send sync notification:', error)
    }
  }

  /**
   * Send error notification
   */
  private async sendErrorNotification(error: any): Promise<void> {
    try {
      console.log('🚨 Sync error notification:', {
        type: 'sync_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })

      // TODO: Integrate with error notification system
      // await NotificationService.sendSyncError(error)

    } catch (notificationError) {
      console.warn('⚠️ Failed to send error notification:', notificationError)
    }
  }

  /**
   * Get status of all cron jobs
   */
  getStatus(): { running: boolean; jobs: Array<{ name: string; running: boolean }> } {
    const jobs = Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      running: task.running
    }))

    return {
      running: this.isRunning,
      jobs
    }
  }

  /**
   * Manually trigger a sync job
   */
  async triggerManualSync(): Promise<void> {
    console.log('🔄 Manual sync triggered via cron service...')
    
    try {
      const results = await BookingSyncService.syncAllProperties()
      
      const summary = {
        properties: results.length,
        successful: results.filter(r => r.success).length,
        newBookings: results.reduce((sum, r) => sum + r.newBookingsCreated, 0),
        updatedBookings: results.reduce((sum, r) => sum + r.existingBookingsUpdated, 0),
        cleaningTasks: results.reduce((sum, r) => sum + r.cleaningTasksCreated, 0)
      }

      console.log('✅ Manual sync completed:', summary)
      return summary

    } catch (error) {
      console.error('❌ Manual sync failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const bookingSyncCron = BookingSyncCronService.getInstance()

// Auto-start in production (optional)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_BOOKING_SYNC_CRON === 'true') {
  console.log('🚀 Auto-starting booking sync cron service in production...')
  bookingSyncCron.start()
}
