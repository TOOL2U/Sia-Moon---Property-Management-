import { db } from '@/lib/firebase'
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { AIConflictResolver } from './AIConflictResolver'
import CalendarEventService from './CalendarEventService'
import NotificationService from './NotificationService'

interface BookingData {
  propertyName: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  guestCount: number
  price: number
  specialRequests?: string
  status: string
}

interface ApprovalWorkflowInput {
  bookingId: string
  bookingData: BookingData
  triggeredBy: string
}

interface WorkflowResult {
  success: boolean
  availabilityCheck: {
    hasConflicts: boolean
    conflicts: any[]
    checkCompleted: boolean
  }
  calendarIntegration: {
    success: boolean
    eventIds?: string[]
    error?: string
  }
  conflictResolution?: {
    aiAnalysis: any
    recommendations: string[]
    actionsToken: string[]
  }
  notifications: {
    sent: string[]
    failed: string[]
  }
  databaseUpdates: {
    success: boolean
    updatedFields: string[]
  }
  message: string
}

export class BookingApprovalWorkflow {
  private firestore
  private calendarService: typeof CalendarEventService
  private notificationService: typeof NotificationService
  private aiResolver: AIConflictResolver

  constructor() {
    if (!db) {
      throw new Error('Firebase not initialized')
    }
    this.firestore = db
    this.calendarService = CalendarEventService
    this.notificationService = NotificationService
    this.aiResolver = new AIConflictResolver()
  }

  async processApprovedBooking(input: ApprovalWorkflowInput): Promise<WorkflowResult> {
    console.log('🚀 Starting booking approval workflow for:', input.bookingId)

    const result: WorkflowResult = {
      success: false,
      availabilityCheck: { hasConflicts: false, conflicts: [], checkCompleted: false },
      calendarIntegration: { success: false, eventIds: [] },
      notifications: { sent: [], failed: [] },
      databaseUpdates: { success: false, updatedFields: [] },
      message: ''
    }

    try {
      // Step 1: Automatic Availability Check
      console.log('📅 Step 1: Checking availability...')
      result.availabilityCheck = await this.checkAvailability(input.bookingData, input.bookingId)

      // Step 2: Handle conflicts or proceed with calendar integration
      if (result.availabilityCheck.hasConflicts) {
        console.log('⚠️ Conflicts detected, initiating AI resolution...')
        result.conflictResolution = await this.resolveConflicts(input, result.availabilityCheck.conflicts)

        // If AI couldn't resolve automatically, mark as needing manual intervention
        if (!result.conflictResolution.aiAnalysis.canAutoResolve) {
          result.message = 'Conflicts detected - manual intervention required'
          await this.notifyStaffAboutConflicts(input, result.conflictResolution)
          return result
        }
      }

      // Step 3: Calendar Integration (if no unresolved conflicts)
      console.log('📆 Step 3: Creating calendar events...')
      result.calendarIntegration = await this.calendarService.createEventsFromBooking(input.bookingId)

      // Step 4: Database Updates
      console.log('💾 Step 4: Updating database...')
      result.databaseUpdates = await this.updateBookingRecord(input.bookingId, result)

      // Step 5: Send Notifications
      console.log('📧 Step 5: Sending notifications...')
      result.notifications = await this.sendNotifications(input, result)

      result.success = true
      result.message = 'Booking approval workflow completed successfully'

      console.log('✅ Booking approval workflow completed successfully')
      return result

    } catch (error) {
      console.error('❌ Booking approval workflow failed:', error)
      result.message = `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      return result
    }
  }

  private async checkAvailability(bookingData: BookingData, currentBookingId: string) {
    console.log('🔍 Checking availability for:', bookingData.propertyName)

    const checkInDate = new Date(bookingData.checkInDate)
    const checkOutDate = new Date(bookingData.checkOutDate)

    // Check existing bookings
    const bookingsQuery = query(
      collection(this.firestore, 'pending_bookings'),
      where('propertyName', '==', bookingData.propertyName),
      where('status', 'in', ['approved', 'confirmed'])
    )

    const bookingsSnapshot = await getDocs(bookingsQuery)
    const conflicts: any[] = []

    bookingsSnapshot.forEach((doc) => {
      // Skip the current booking to avoid self-conflict
      if (doc.id === currentBookingId) {
        return
      }

      const booking = doc.data()
      const existingCheckIn = new Date(booking.checkInDate)
      const existingCheckOut = new Date(booking.checkOutDate)

      // Check for date overlap
      if (
        (checkInDate >= existingCheckIn && checkInDate < existingCheckOut) ||
        (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) ||
        (checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut)
      ) {
        conflicts.push({
          type: 'booking_overlap',
          conflictingBookingId: doc.id,
          conflictingGuest: booking.guestName,
          conflictingDates: {
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate
          }
        })
      }
    })

    // Check calendar events
    const calendarConflicts = await this.calendarService.checkForConflicts(
      bookingData.propertyName,
      checkInDate,
      checkOutDate
    )

    conflicts.push(...calendarConflicts)

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      checkCompleted: true
    }
  }

  private async resolveConflicts(input: ApprovalWorkflowInput, conflicts: any[]) {
    console.log('🤖 AI analyzing conflicts...')

    return await this.aiResolver.analyzeAndResolve({
      bookingId: input.bookingId,
      bookingData: input.bookingData,
      conflicts,
      triggeredBy: input.triggeredBy
    })
  }



  private async updateBookingRecord(bookingId: string, result: WorkflowResult) {
    console.log('💾 Updating booking record...')

    try {
      const bookingRef = doc(this.firestore, 'pending_bookings', bookingId)
      const updatedFields: string[] = []

      const updateData: any = {
        updatedAt: serverTimestamp(),
        approvalWorkflow: {
          processedAt: serverTimestamp(),
          availabilityChecked: result.availabilityCheck.checkCompleted,
          hasConflicts: result.availabilityCheck.hasConflicts,
          calendarIntegrated: result.calendarIntegration.success
        }
      }

      if (result.calendarIntegration.eventIds && result.calendarIntegration.eventIds.length > 0) {
        updateData.calendarEventIds = result.calendarIntegration.eventIds
        updatedFields.push('calendarEventIds')
      }

      if (result.conflictResolution) {
        updateData.conflictResolution = result.conflictResolution
        updatedFields.push('conflictResolution')
      }

      updatedFields.push('approvalWorkflow', 'updatedAt')

      await updateDoc(bookingRef, updateData)

      return {
        success: true,
        updatedFields
      }

    } catch (error) {
      console.error('❌ Database update failed:', error)
      return {
        success: false,
        updatedFields: []
      }
    }
  }

  private async sendNotifications(input: ApprovalWorkflowInput, result: WorkflowResult) {
    console.log('📧 Sending notifications...')

    const sent: string[] = []
    const failed: string[] = []

    try {
      // Notify property managers
      const managerNotification = await this.notificationService.notifyPropertyManagers({
        type: 'booking_approved',
        bookingId: input.bookingId,
        propertyName: input.bookingData.propertyName,
        guestName: input.bookingData.guestName,
        calendarUpdated: result.calendarIntegration.success,
        hasConflicts: result.availabilityCheck.hasConflicts
      })

      if (managerNotification.success) {
        sent.push('property_managers')
      } else {
        failed.push('property_managers')
      }

      // Notify guest
      const guestNotification = await this.notificationService.notifyGuest({
        type: 'booking_confirmed',
        guestEmail: input.bookingData.guestEmail,
        guestName: input.bookingData.guestName,
        bookingId: input.bookingId,
        propertyName: input.bookingData.propertyName,
        checkInDate: input.bookingData.checkInDate,
        checkOutDate: input.bookingData.checkOutDate
      })

      if (guestNotification.success) {
        sent.push('guest')
      } else {
        failed.push('guest')
      }

    } catch (error) {
      console.error('❌ Notification sending failed:', error)
      failed.push('all')
    }

    return { sent, failed }
  }

  private async notifyStaffAboutConflicts(input: ApprovalWorkflowInput, conflictResolution: any) {
    console.log('⚠️ Notifying staff about conflicts requiring manual intervention...')

    await this.notificationService.notifyStaff({
      type: 'booking_conflict',
      priority: 'high',
      bookingId: input.bookingId,
      propertyName: input.bookingData.propertyName,
      conflicts: conflictResolution.aiAnalysis.conflicts,
      recommendations: conflictResolution.recommendations
    })
  }
}
