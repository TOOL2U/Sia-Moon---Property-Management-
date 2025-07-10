import { NotificationService } from '@/lib/notifications/notificationService'
import { LiveBooking } from './bookingService'

export interface BookingNotificationResult {
  success: boolean
  adminNotified: boolean
  clientNotified: boolean
  staffNotified: boolean
  errors: string[]
}

/**
 * Comprehensive booking notification service
 * Handles all notification flows for new bookings
 */
export class BookingNotificationService {
  
  /**
   * Send all notifications for a new booking
   */
  static async notifyNewBooking(
    booking: LiveBooking,
    clientId?: string
  ): Promise<BookingNotificationResult> {
    const result: BookingNotificationResult = {
      success: true,
      adminNotified: false,
      clientNotified: false,
      staffNotified: false,
      errors: []
    }
    
    console.log('📢 NOTIFICATIONS: Starting booking notification flow')
    console.log('📢 NOTIFICATIONS: Booking ID:', booking.id)
    console.log('📢 NOTIFICATIONS: Guest:', booking.guestName)
    console.log('📢 NOTIFICATIONS: Property:', booking.villaName)
    
    try {
      // 1. Notify admin about new booking
      const adminResult = await this.notifyAdmin(booking)
      result.adminNotified = adminResult.success
      if (!adminResult.success) {
        result.errors.push(`Admin notification failed: ${adminResult.error}`)
      }
      
      // 2. Notify property owner (if client matched)
      if (clientId) {
        const clientResult = await this.notifyClient(booking, clientId)
        result.clientNotified = clientResult.success
        if (!clientResult.success) {
          result.errors.push(`Client notification failed: ${clientResult.error}`)
        }
      } else {
        console.log('⚠️ NOTIFICATIONS: No client ID provided, skipping client notification')
      }
      
      // 3. Notify staff (if booking is urgent)
      const isUrgent = this.isUrgentBooking(booking)
      if (isUrgent) {
        const staffResult = await this.notifyStaff(booking)
        result.staffNotified = staffResult.success
        if (!staffResult.success) {
          result.errors.push(`Staff notification failed: ${staffResult.error}`)
        }
      }
      
      // Overall success if at least admin was notified
      result.success = result.adminNotified
      
      console.log('✅ NOTIFICATIONS: Booking notification flow completed')
      console.log('✅ NOTIFICATIONS: Results:', {
        adminNotified: result.adminNotified,
        clientNotified: result.clientNotified,
        staffNotified: result.staffNotified,
        errors: result.errors.length
      })
      
      return result
      
    } catch (error) {
      console.error('❌ NOTIFICATIONS: Critical error in notification flow:', error)
      result.success = false
      result.errors.push(`Critical notification error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }
  
  /**
   * Notify admin about new booking requiring approval
   */
  private static async notifyAdmin(booking: LiveBooking): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('📧 NOTIFICATIONS: Sending admin notification...')
      
      // Get admin user ID (hardcoded for now, should be from config)
      const adminUserId = 'admin-user-id' // TODO: Get from environment or config
      
      const urgencyText = this.isUrgentBooking(booking) ? ' 🚨 URGENT' : ''
      const clientMatchText = booking.clientId ? ` (Matched to client: ${booking.clientId})` : ' (No client match - requires assignment)'
      
      const notificationResult = await NotificationService.sendNotification({
        userId: adminUserId,
        category: 'booking_confirmed',
        title: `New Guest Booking${urgencyText}`,
        message: `${booking.guestName} has booked ${booking.villaName} from ${booking.checkInDate} to ${booking.checkOutDate}${clientMatchText}`,
        data: {
          bookingId: booking.id,
          guestName: booking.guestName,
          villaName: booking.villaName,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          price: booking.price,
          currency: booking.currency,
          clientId: booking.clientId,
          isUrgent: this.isUrgentBooking(booking),
          bookingSource: booking.bookingSource
        },
        priority: this.isUrgentBooking(booking) ? 'urgent' : 'high',
        channels: ['email', 'push', 'in_app'],
        emailSubject: `New Guest Booking - ${booking.guestName}${urgencyText}`,
        emailTemplate: 'booking_admin_notification',
        pushTitle: `New Booking${urgencyText}`,
        pushBody: `${booking.guestName} - ${booking.villaName}`,
        pushUrl: `/admin/bookings?highlight=${booking.id}`
      })
      
      if (notificationResult.success) {
        console.log('✅ NOTIFICATIONS: Admin notified successfully')
        return { success: true }
      } else {
        console.error('❌ NOTIFICATIONS: Admin notification failed:', notificationResult.error)
        return { success: false, error: notificationResult.error }
      }
      
    } catch (error) {
      console.error('❌ NOTIFICATIONS: Error sending admin notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  /**
   * Notify property owner about new booking
   */
  private static async notifyClient(booking: LiveBooking, clientId: string): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('📧 NOTIFICATIONS: Sending client notification...')
      
      const notificationResult = await NotificationService.sendNotification({
        userId: clientId,
        category: 'booking_confirmed',
        title: 'New Booking for Your Property',
        message: `${booking.guestName} has booked ${booking.villaName} from ${booking.checkInDate} to ${booking.checkOutDate}. Booking is pending admin approval.`,
        data: {
          bookingId: booking.id,
          guestName: booking.guestName,
          villaName: booking.villaName,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          price: booking.price,
          currency: booking.currency,
          status: booking.status
        },
        priority: 'normal',
        channels: ['email', 'push', 'in_app'],
        emailSubject: `New Booking - ${booking.villaName}`,
        emailTemplate: 'booking_client_notification',
        pushTitle: 'New Booking',
        pushBody: `${booking.guestName} - ${booking.villaName}`,
        pushUrl: `/dashboard/client?tab=bookings&highlight=${booking.id}`
      })
      
      if (notificationResult.success) {
        console.log('✅ NOTIFICATIONS: Client notified successfully')
        return { success: true }
      } else {
        console.error('❌ NOTIFICATIONS: Client notification failed:', notificationResult.error)
        return { success: false, error: notificationResult.error }
      }
      
    } catch (error) {
      console.error('❌ NOTIFICATIONS: Error sending client notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  /**
   * Notify staff about urgent booking
   */
  private static async notifyStaff(booking: LiveBooking): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('📧 NOTIFICATIONS: Sending staff notification for urgent booking...')
      
      // TODO: Get staff user IDs from database
      const staffUserIds = ['staff-user-1', 'staff-user-2'] // Placeholder
      
      let successCount = 0
      const errors: string[] = []
      
      for (const staffId of staffUserIds) {
        try {
          const notificationResult = await NotificationService.sendNotification({
            userId: staffId,
            category: 'task_assigned',
            title: '🚨 Urgent Booking - Preparation Needed',
            message: `${booking.guestName} is checking into ${booking.villaName} on ${booking.checkInDate}. Prepare for guest arrival.`,
            data: {
              bookingId: booking.id,
              guestName: booking.guestName,
              villaName: booking.villaName,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              isUrgent: true
            },
            priority: 'urgent',
            channels: ['push', 'in_app'],
            pushTitle: '🚨 Urgent Booking',
            pushBody: `${booking.guestName} - ${booking.villaName} (${booking.checkInDate})`,
            pushUrl: `/staff/tasks?booking=${booking.id}`
          })
          
          if (notificationResult.success) {
            successCount++
          } else {
            errors.push(`Staff ${staffId}: ${notificationResult.error}`)
          }
        } catch (error) {
          errors.push(`Staff ${staffId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      if (successCount > 0) {
        console.log(`✅ NOTIFICATIONS: ${successCount}/${staffUserIds.length} staff members notified`)
        return { success: true }
      } else {
        console.error('❌ NOTIFICATIONS: No staff members could be notified')
        return { success: false, error: errors.join('; ') }
      }
      
    } catch (error) {
      console.error('❌ NOTIFICATIONS: Error sending staff notifications:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  /**
   * Check if booking is urgent (check-in within 48 hours)
   */
  private static isUrgentBooking(booking: LiveBooking): boolean {
    try {
      const checkInDate = new Date(booking.checkInDate)
      const now = new Date()
      const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      return hoursUntilCheckIn <= 48 && hoursUntilCheckIn >= 0
    } catch (error) {
      console.error('❌ NOTIFICATIONS: Error checking booking urgency:', error)
      return false
    }
  }
  
  /**
   * Send booking approval notification
   */
  static async notifyBookingApproved(booking: LiveBooking): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('📧 NOTIFICATIONS: Sending booking approval notification...')
      
      if (!booking.clientId) {
        console.log('⚠️ NOTIFICATIONS: No client ID, skipping approval notification')
        return { success: true }
      }
      
      const notificationResult = await NotificationService.sendNotification({
        userId: booking.clientId,
        category: 'booking_confirmed',
        title: 'Booking Approved',
        message: `The booking for ${booking.guestName} at ${booking.villaName} has been approved and confirmed.`,
        data: {
          bookingId: booking.id,
          guestName: booking.guestName,
          villaName: booking.villaName,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: 'approved'
        },
        priority: 'normal',
        channels: ['email', 'push', 'in_app'],
        emailSubject: `Booking Approved - ${booking.villaName}`,
        emailTemplate: 'booking_approved',
        pushTitle: 'Booking Approved',
        pushBody: `${booking.guestName} - ${booking.villaName}`,
        pushUrl: `/dashboard/client?tab=bookings&highlight=${booking.id}`
      })
      
      return { success: notificationResult.success, error: notificationResult.error }
      
    } catch (error) {
      console.error('❌ NOTIFICATIONS: Error sending approval notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
