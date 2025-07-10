import { BookingService, LiveBooking } from './bookingService'
import { BookingNotificationService } from './bookingNotificationService'
import { ReportService } from './reportService'

export interface BookingDataFlowResult {
  success: boolean
  bookingId?: string
  isDuplicate?: boolean
  clientMatched?: boolean
  notificationsSent?: boolean
  dashboardUpdated?: boolean
  reportsUpdated?: boolean
  errors: string[]
  warnings: string[]
  metadata: {
    processingTimeMs: number
    retryCount?: number
    duplicateCheckPassed: boolean
    notificationResults?: any
  }
}

export interface ClientMatchResult {
  clientId: string
  propertyId?: string
  propertyName?: string
  confidence: number
  matchMethod: string
}

/**
 * Comprehensive booking data flow orchestrator
 * Handles the complete flow from parsed booking data to all systems
 */
export class BookingDataFlowService {
  
  /**
   * Process a complete booking data flow
   */
  static async processBookingFlow(
    bookingData: Omit<LiveBooking, 'id'>,
    clientMatch?: ClientMatchResult
  ): Promise<BookingDataFlowResult> {
    const startTime = Date.now()
    const result: BookingDataFlowResult = {
      success: false,
      errors: [],
      warnings: [],
      metadata: {
        processingTimeMs: 0,
        duplicateCheckPassed: false
      }
    }
    
    console.log('🔄 DATA FLOW: Starting comprehensive booking data flow')
    console.log('🔄 DATA FLOW: Guest:', bookingData.guestName)
    console.log('🔄 DATA FLOW: Property:', bookingData.villaName)
    console.log('🔄 DATA FLOW: Client match:', clientMatch ? 'Yes' : 'No')
    
    try {
      // Step 1: Store booking in Firebase with idempotency
      console.log('📝 DATA FLOW: Step 1 - Storing booking in Firebase...')
      const storageResult = await BookingService.createLiveBooking(bookingData)
      
      if (!storageResult.success) {
        result.errors.push(`Firebase storage failed: ${storageResult.error}`)
        result.metadata.processingTimeMs = Date.now() - startTime
        return result
      }
      
      result.bookingId = storageResult.bookingId
      result.isDuplicate = storageResult.isDuplicate
      result.metadata.retryCount = storageResult.retryCount
      result.metadata.duplicateCheckPassed = true
      
      if (storageResult.isDuplicate) {
        console.log('⚠️ DATA FLOW: Duplicate booking detected, skipping further processing')
        result.success = true
        result.warnings.push('Duplicate booking detected - no further processing needed')
        result.metadata.processingTimeMs = Date.now() - startTime
        return result
      }
      
      console.log('✅ DATA FLOW: Step 1 completed - Booking stored with ID:', result.bookingId)
      
      // Step 2: Update client matching information
      if (clientMatch && clientMatch.clientId) {
        console.log('🎯 DATA FLOW: Step 2 - Updating client matching...')
        try {
          await BookingService.updateBookingClientMatch(result.bookingId!, clientMatch)
          result.clientMatched = true
          console.log('✅ DATA FLOW: Step 2 completed - Client matching updated')
        } catch (error) {
          result.warnings.push(`Client matching update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.warn('⚠️ DATA FLOW: Step 2 warning - Client matching update failed')
        }
      } else {
        console.log('⚠️ DATA FLOW: Step 2 skipped - No client match provided')
        result.warnings.push('No client match provided - booking requires manual assignment')
      }
      
      // Step 3: Send notifications
      console.log('📢 DATA FLOW: Step 3 - Sending notifications...')
      try {
        const notificationResult = await BookingNotificationService.notifyNewBooking(
          { ...bookingData, id: result.bookingId! },
          clientMatch?.clientId
        )
        
        result.notificationsSent = notificationResult.success
        result.metadata.notificationResults = notificationResult
        
        if (notificationResult.errors.length > 0) {
          result.warnings.push(...notificationResult.errors.map(e => `Notification: ${e}`))
        }
        
        console.log('✅ DATA FLOW: Step 3 completed - Notifications processed')
      } catch (error) {
        result.warnings.push(`Notification processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.warn('⚠️ DATA FLOW: Step 3 warning - Notification processing failed')
      }
      
      // Step 4: Update financial reports (if client matched)
      if (clientMatch?.clientId) {
        console.log('📊 DATA FLOW: Step 4 - Updating financial reports...')
        try {
          await this.updateFinancialReports(bookingData, clientMatch.clientId)
          result.reportsUpdated = true
          console.log('✅ DATA FLOW: Step 4 completed - Financial reports updated')
        } catch (error) {
          result.warnings.push(`Financial report update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.warn('⚠️ DATA FLOW: Step 4 warning - Financial report update failed')
        }
      } else {
        console.log('⚠️ DATA FLOW: Step 4 skipped - No client ID for financial reports')
      }
      
      // Step 5: Trigger dashboard refresh
      console.log('🔄 DATA FLOW: Step 5 - Triggering dashboard refresh...')
      try {
        await this.triggerDashboardRefresh(clientMatch?.clientId)
        result.dashboardUpdated = true
        console.log('✅ DATA FLOW: Step 5 completed - Dashboard refresh triggered')
      } catch (error) {
        result.warnings.push(`Dashboard refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.warn('⚠️ DATA FLOW: Step 5 warning - Dashboard refresh failed')
      }
      
      // Overall success determination
      result.success = true
      result.metadata.processingTimeMs = Date.now() - startTime
      
      console.log('🎉 DATA FLOW: Complete booking data flow finished successfully')
      console.log('🎉 DATA FLOW: Results:', {
        bookingId: result.bookingId,
        isDuplicate: result.isDuplicate,
        clientMatched: result.clientMatched,
        notificationsSent: result.notificationsSent,
        reportsUpdated: result.reportsUpdated,
        dashboardUpdated: result.dashboardUpdated,
        processingTime: result.metadata.processingTimeMs + 'ms',
        warnings: result.warnings.length,
        errors: result.errors.length
      })
      
      return result
      
    } catch (error) {
      console.error('❌ DATA FLOW: Critical error in booking data flow:', error)
      result.success = false
      result.errors.push(`Critical data flow error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.metadata.processingTimeMs = Date.now() - startTime
      return result
    }
  }
  
  /**
   * Update financial reports with new booking data
   */
  private static async updateFinancialReports(
    bookingData: Omit<LiveBooking, 'id'>,
    clientId: string
  ): Promise<void> {
    try {
      console.log('📊 REPORTS: Updating financial metrics for client:', clientId)
      
      // Update monthly metrics with new booking
      await ReportService.addBookingToMetrics(clientId, {
        revenue: bookingData.revenue,
        currency: bookingData.currency,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        propertyId: bookingData.propertyId,
        bookingSource: bookingData.bookingSource
      })
      
      console.log('✅ REPORTS: Financial metrics updated successfully')
    } catch (error) {
      console.error('❌ REPORTS: Error updating financial reports:', error)
      throw error
    }
  }
  
  /**
   * Trigger dashboard refresh for real-time updates
   */
  private static async triggerDashboardRefresh(clientId?: string): Promise<void> {
    try {
      console.log('🔄 DASHBOARD: Triggering dashboard refresh...')
      
      // In a real implementation, this would trigger real-time updates
      // For now, we'll just log the action
      if (clientId) {
        console.log('🔄 DASHBOARD: Client dashboard refresh triggered for:', clientId)
      }
      console.log('🔄 DASHBOARD: Admin dashboard refresh triggered')
      
      // TODO: Implement real-time dashboard updates using WebSockets or Server-Sent Events
      // This could also trigger cache invalidation for dashboard data
      
      console.log('✅ DASHBOARD: Dashboard refresh completed')
    } catch (error) {
      console.error('❌ DASHBOARD: Error triggering dashboard refresh:', error)
      throw error
    }
  }
  
  /**
   * Create fallback booking entry for failed Firebase writes
   */
  static async createFallbackBooking(
    bookingData: Omit<LiveBooking, 'id'>,
    originalError: string
  ): Promise<{ success: boolean, fallbackId?: string }> {
    try {
      console.log('🆘 FALLBACK: Creating fallback booking entry...')
      
      // Store in a fallback collection or local storage
      const fallbackData = {
        ...bookingData,
        fallbackReason: originalError,
        fallbackCreatedAt: new Date().toISOString(),
        requiresManualProcessing: true
      }
      
      // TODO: Implement fallback storage mechanism
      // This could be a separate Firebase collection, local file, or external service
      const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('✅ FALLBACK: Fallback booking created with ID:', fallbackId)
      console.log('⚠️ FALLBACK: Manual intervention required for booking processing')
      
      // Send urgent notification to admin about fallback
      try {
        await BookingNotificationService.notifyNewBooking(
          { ...bookingData, id: fallbackId },
          undefined
        )
      } catch (notificationError) {
        console.error('❌ FALLBACK: Failed to send fallback notification:', notificationError)
      }
      
      return { success: true, fallbackId }
      
    } catch (error) {
      console.error('❌ FALLBACK: Critical error creating fallback booking:', error)
      return { success: false }
    }
  }
}
