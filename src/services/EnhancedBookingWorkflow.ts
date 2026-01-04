/**
 * Enhanced Booking Approval Workflow
 * Integrates with CalendarAvailabilityService for comprehensive booking management
 * Handles calendar blocking as single source of truth
 */

import { CalendarAvailabilityService } from './CalendarAvailabilityService'
import { BookingApprovalWorkflow as OriginalWorkflow } from './BookingApprovalWorkflow'

export interface EnhancedBookingData {
  bookingId: string
  externalBookingId?: string
  propertyId: string
  propertyName: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  guestCount: number
  price: number
  specialRequests?: string
  status: string
  source: 'pms_webhook' | 'manual_entry' | 'admin_panel'
}

export interface EnhancedWorkflowResult {
  success: boolean
  bookingId: string
  calendarBlocked: boolean
  blockId?: string
  availabilityCheck: {
    isAvailable: boolean
    conflicts: any[]
    alternatives?: any[]
  }
  actions: string[]
  notifications: string[]
  errors: string[]
}

export class EnhancedBookingWorkflow {
  
  /**
   * Process booking with calendar-first approach
   */
  static async processBooking(booking: EnhancedBookingData): Promise<EnhancedWorkflowResult> {
    const result: EnhancedWorkflowResult = {
      success: false,
      bookingId: booking.bookingId,
      calendarBlocked: false,
      availabilityCheck: {
        isAvailable: false,
        conflicts: [],
        alternatives: []
      },
      actions: [],
      notifications: [],
      errors: []
    }

    try {
      console.log(`🚀 Processing enhanced booking workflow: ${booking.bookingId}`)

      // Step 1: Check availability using calendar service
      result.actions.push('Checking property availability...')
      
      const availabilityResults = await CalendarAvailabilityService.checkAvailability({
        propertyId: booking.propertyId,
        startDate: booking.checkInDate,
        endDate: booking.checkOutDate
      })

      if (availabilityResults.length === 0) {
        result.errors.push('Property not found')
        return result
      }

      const availability = availabilityResults[0]
      result.availabilityCheck = {
        isAvailable: availability.isAvailable,
        conflicts: availability.conflicts,
        alternatives: availability.suggestedAlternatives
      }

      // Step 2: Handle conflicts or proceed with blocking
      if (!availability.isAvailable) {
        console.log(`⚠️ Conflicts detected for booking ${booking.bookingId}:`, availability.conflicts)
        
        result.actions.push('Conflicts detected - analyzing options...')
        
        // Check if conflicts are resolvable
        const resolvableConflicts = availability.conflicts.filter(
          conflict => conflict.blockType === 'buffer' || conflict.priority === 'low'
        )
        
        if (resolvableConflicts.length === availability.conflicts.length) {
          result.actions.push('All conflicts are resolvable - proceeding with booking')
          await this.resolveConflicts(availability.conflicts, booking)
        } else {
          result.actions.push('Critical conflicts found - booking requires manual review')
          result.errors.push(`Conflicts: ${availability.conflicts.map(c => c.reason).join(', ')}`)
          
          // Still create as pending but flag for manual review
          booking.status = 'pending_manual_review'
        }
      }

      // Step 3: Block calendar dates
      if (booking.status !== 'pending_manual_review') {
        result.actions.push('Blocking calendar dates...')
        
        const blockResult = await CalendarAvailabilityService.createBookingBlock({
          bookingId: booking.bookingId,
          externalBookingId: booking.externalBookingId,
          propertyId: booking.propertyId,
          propertyName: booking.propertyName,
          guestName: booking.guestName,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          sourceType: booking.source
        })

        if (blockResult.success) {
          result.calendarBlocked = true
          result.blockId = blockResult.blockId
          result.actions.push('Calendar dates blocked successfully')
          
          // Update booking status to approved since calendar is blocked
          booking.status = 'approved'
          
        } else {
          result.errors.push('Failed to block calendar dates')
          result.actions.push('Calendar blocking failed - booking set to pending review')
          booking.status = 'pending_manual_review'
        }
      }

      // Step 4: Update booking record with results
      result.actions.push('Updating booking record...')
      await this.updateBookingRecord(booking, result)

      // Step 5: Send notifications
      result.actions.push('Sending notifications...')
      await this.sendNotifications(booking, result)

      result.success = true
      console.log(`✅ Enhanced booking workflow completed for: ${booking.bookingId}`)

    } catch (error) {
      console.error('❌ Enhanced booking workflow error:', error)
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Cancel booking and unblock calendar
   */
  static async cancelBooking(
    bookingId: string, 
    sourceId: string, 
    sourceType: string,
    reason: string = 'Booking cancelled'
  ): Promise<{ success: boolean; unblockedCount: number }> {
    
    try {
      console.log(`❌ Cancelling booking: ${bookingId}`)

      // Unblock calendar dates
      const unblockResult = await CalendarAvailabilityService.unblockProperty(
        sourceId,
        sourceType,
        reason
      )

      // Update booking status in database
      // TODO: Update booking status in all relevant collections

      console.log(`✅ Booking cancelled - unblocked ${unblockResult.unblockedCount} calendar blocks`)
      
      return unblockResult

    } catch (error) {
      console.error('❌ Error cancelling booking:', error)
      return { success: false, unblockedCount: 0 }
    }
  }

  /**
   * Modify booking dates with calendar reblocking
   */
  static async modifyBooking(
    originalBooking: EnhancedBookingData,
    newCheckIn: string,
    newCheckOut: string,
    reason: string = 'Date modification'
  ): Promise<EnhancedWorkflowResult> {
    
    try {
      console.log(`🔄 Modifying booking dates: ${originalBooking.bookingId}`)

      // Step 1: Check new dates availability
      const availability = await CalendarAvailabilityService.checkAvailability({
        propertyId: originalBooking.propertyId,
        startDate: newCheckIn,
        endDate: newCheckOut
      })

      if (availability.length === 0 || !availability[0].isAvailable) {
        return {
          success: false,
          bookingId: originalBooking.bookingId,
          calendarBlocked: false,
          availabilityCheck: {
            isAvailable: false,
            conflicts: availability[0]?.conflicts || [],
            alternatives: availability[0]?.suggestedAlternatives || []
          },
          actions: ['Date modification failed - new dates not available'],
          notifications: [],
          errors: ['New dates are not available']
        }
      }

      // Step 2: Unblock original dates
      await CalendarAvailabilityService.unblockProperty(
        originalBooking.externalBookingId || originalBooking.bookingId,
        originalBooking.source,
        'Date modification - removing original dates'
      )

      // Step 3: Block new dates
      const updatedBooking = {
        ...originalBooking,
        checkInDate: newCheckIn,
        checkOutDate: newCheckOut
      }

      const result = await this.processBooking(updatedBooking)
      result.actions.unshift('Original dates unblocked')

      return result

    } catch (error) {
      console.error('❌ Error modifying booking:', error)
      return {
        success: false,
        bookingId: originalBooking.bookingId,
        calendarBlocked: false,
        availabilityCheck: { isAvailable: false, conflicts: [], alternatives: [] },
        actions: [],
        notifications: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Resolve minor conflicts (buffers, low priority items)
   */
  private static async resolveConflicts(conflicts: any[], booking: EnhancedBookingData): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.blockType === 'buffer') {
        // Remove buffer blocks - they can be recreated after booking
        await CalendarAvailabilityService.unblockProperty(
          conflict.sourceId,
          conflict.sourceType,
          'Resolved for higher priority booking'
        )
        console.log(`✅ Resolved buffer conflict: ${conflict.id}`)
        
      } else if (conflict.priority === 'low') {
        // TODO: Reschedule low priority items
        console.log(`⚠️ Low priority conflict requires rescheduling: ${conflict.id}`)
      }
    }
  }

  /**
   * Update booking record in database
   */
  private static async updateBookingRecord(booking: EnhancedBookingData, result: EnhancedWorkflowResult): Promise<void> {
    try {
      // TODO: Update booking in all relevant Firebase collections
      // This should update booking status, add workflow results, etc.
      console.log(`📝 Updating booking record: ${booking.bookingId} - Status: ${booking.status}`)
      
    } catch (error) {
      console.error('❌ Error updating booking record:', error)
      result.errors.push('Failed to update booking record')
    }
  }

  /**
   * Send notifications about booking status
   */
  private static async sendNotifications(booking: EnhancedBookingData, result: EnhancedWorkflowResult): Promise<void> {
    try {
      if (result.calendarBlocked) {
        result.notifications.push('Guest notification: Booking confirmed')
        result.notifications.push('Staff notification: New booking assigned')
      } else {
        result.notifications.push('Admin notification: Booking requires manual review')
      }
      
      // TODO: Actually send notifications using existing notification service
      console.log(`📧 Notifications queued for booking: ${booking.bookingId}`)
      
    } catch (error) {
      console.error('❌ Error sending notifications:', error)
      result.errors.push('Failed to send notifications')
    }
  }

  /**
   * Get calendar availability for multiple properties
   */
  static async getAvailabilityCalendar(
    propertyIds: string[],
    startDate: string,
    endDate: string
  ): Promise<any> {
    
    const calendar: any = {}
    
    for (const propertyId of propertyIds) {
      const blocks = await CalendarAvailabilityService.getPropertyBlocks(
        propertyId,
        startDate,
        endDate
      )
      
      calendar[propertyId] = {
        blocks: blocks,
        blockedDates: blocks.map(block => ({
          start: block.startDate,
          end: block.endDate,
          type: block.blockType,
          reason: block.reason,
          guestName: block.guestName
        }))
      }
    }
    
    return calendar
  }
}

export default EnhancedBookingWorkflow
