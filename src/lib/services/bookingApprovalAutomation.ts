import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { AIPropertyMatchingService } from './aiPropertyMatchingService'

export interface BookingApprovalResult {
  success: boolean
  bookingId: string
  status: 'approved' | 'rejected'
  automationTriggered: boolean
  financialReportGenerated: boolean
  clientNotified: boolean
  error?: string
  details?: {
    propertyMatch?: any
    financialData?: any
    clientAssignment?: any
  }
}

export interface ApprovedBookingFinancialData {
  bookingId: string
  clientUserId?: string
  propertyName: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  revenue: number
  commission?: number
  netRevenue?: number
  month: string
  year: number
  quarter: string
  createdAt: any
  source: 'booking_approval_automation'
}

export class BookingApprovalAutomation {
  
  /**
   * Main approval automation workflow
   */
  static async processApprovedBooking(bookingId: string, bookingData: any): Promise<BookingApprovalResult> {
    try {
      console.log('🔄 AUTOMATION: Starting approval automation for booking:', bookingId)
      
      const result: BookingApprovalResult = {
        success: false,
        bookingId,
        status: 'approved',
        automationTriggered: true,
        financialReportGenerated: false,
        clientNotified: false,
        details: {}
      }

      // Step 1: Try to match property and assign to client
      const propertyMatch = await this.matchPropertyAndAssignClient(bookingId, bookingData)
      if (result.details) {
        result.details.propertyMatch = propertyMatch
      }

      // Step 2: Generate financial data for client reports
      const financialData = await this.generateFinancialData(bookingId, bookingData, propertyMatch)
      if (result.details) {
        result.details.financialData = financialData
      }
      result.financialReportGenerated = financialData.success
      
      // Step 3: Log automation action
      await this.logAutomationAction(bookingId, 'approved', result)
      
      // Step 4: TODO - Send notifications (placeholder)
      result.clientNotified = await this.sendClientNotification(bookingId, bookingData, propertyMatch)
      
      result.success = true
      console.log('✅ AUTOMATION: Approval automation completed successfully')
      
      return result
      
    } catch (error) {
      console.error('❌ AUTOMATION: Error in approval automation:', error)
      return {
        success: false,
        bookingId,
        status: 'approved',
        automationTriggered: true,
        financialReportGenerated: false,
        clientNotified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Match property and assign booking to client
   */
  private static async matchPropertyAndAssignClient(bookingId: string, bookingData: any) {
    try {
      console.log('🏠 AUTOMATION: Attempting property matching for approved booking')
      
      // Use existing AI property matching service
      const matchResult = await AIPropertyMatchingService.matchAndAssignBooking(bookingId, bookingData)
      
      if (matchResult.success && matchResult.status === 'assigned') {
        console.log('✅ AUTOMATION: Property matched and assigned to client:', matchResult.match?.userEmail)
        return {
          success: true,
          clientUserId: matchResult.match?.userId,
          clientEmail: matchResult.match?.userEmail,
          propertyName: matchResult.match?.propertyName,
          confidence: matchResult.match?.confidence,
          method: 'ai_property_matching'
        }
      } else {
        console.log('⚠️ AUTOMATION: No property match found, booking remains unassigned')
        return {
          success: false,
          reason: 'No matching property found',
          status: 'unassigned'
        }
      }
      
    } catch (error) {
      console.error('❌ AUTOMATION: Error in property matching:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Property matching failed'
      }
    }
  }
  
  /**
   * Generate financial data for client reports using AI service
   */
  private static async generateFinancialData(bookingId: string, bookingData: any, propertyMatch: any) {
    try {
      console.log('💰 AUTOMATION: Generating financial data using AI service')

      // Use the new AI Financial Reporting Service
      const { AIFinancialReportingService } = await import('./aiFinancialReportingService')

      const result = await AIFinancialReportingService.processApprovedBookingFinancials(
        { ...bookingData, id: bookingId },
        propertyMatch.success ? propertyMatch.clientUserId : undefined
      )

      if (result.success) {
        console.log('✅ AUTOMATION: AI financial reporting completed:', result.reportId)
        return {
          success: true,
          reportId: result.reportId,
          clientAssigned: propertyMatch.success,
          aiProcessed: true
        }
      } else {
        console.error('❌ AUTOMATION: AI financial reporting failed:', result.error)
        return {
          success: false,
          error: result.error || 'AI financial reporting failed'
        }
      }

    } catch (error) {
      console.error('❌ AUTOMATION: Error in AI financial data generation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI financial data generation failed'
      }
    }
  }
  
  /**
   * Log automation action for audit trail
   */
  private static async logAutomationAction(bookingId: string, action: string, result: any) {
    try {
      const database = getDb()
      
      const logEntry = {
        bookingId,
        action,
        timestamp: serverTimestamp(),
        result,
        automationType: 'booking_approval',
        success: result.success,
        details: result.details
      }
      
      await addDoc(collection(database, 'automation_logs'), logEntry)
      console.log('📝 AUTOMATION: Action logged successfully')
      
    } catch (error) {
      console.error('❌ AUTOMATION: Error logging action:', error)
    }
  }
  
  /**
   * Send client notification (placeholder for future implementation)
   */
  private static async sendClientNotification(bookingId: string, bookingData: any, propertyMatch: any): Promise<boolean> {
    try {
      // TODO: Implement email/push notification system
      console.log('📧 AUTOMATION: Client notification (placeholder) - would notify:', propertyMatch.clientEmail)
      
      // For now, just return true to indicate notification would be sent
      return true
      
    } catch (error) {
      console.error('❌ AUTOMATION: Error sending client notification:', error)
      return false
    }
  }
  
  /**
   * Process rejected booking
   */
  static async processRejectedBooking(bookingId: string, bookingData: any, reason?: string): Promise<BookingApprovalResult> {
    try {
      console.log('❌ AUTOMATION: Processing rejected booking:', bookingId)
      
      const result: BookingApprovalResult = {
        success: true,
        bookingId,
        status: 'rejected',
        automationTriggered: true,
        financialReportGenerated: false,
        clientNotified: false
      }
      
      // Log rejection
      await this.logAutomationAction(bookingId, 'rejected', { reason, timestamp: new Date() })
      
      console.log('✅ AUTOMATION: Rejection processed successfully')
      return result
      
    } catch (error) {
      console.error('❌ AUTOMATION: Error processing rejection:', error)
      return {
        success: false,
        bookingId,
        status: 'rejected',
        automationTriggered: true,
        financialReportGenerated: false,
        clientNotified: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
