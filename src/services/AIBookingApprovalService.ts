/**
 * AI Booking Approval Service
 * Intelligent system for automated booking validation and approval
 */

import { db } from '@/lib/firebase'
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import AIAutomationService from './AIAutomationService'

// Maximum days in advance a booking can be made
const MAX_ADVANCE_BOOKING_DAYS = 365

// Processing state to prevent duplicate processing
interface ProcessingState {
  [bookingId: string]: boolean
}

// Validation result interface
interface ValidationResult {
  valid: boolean
  reason?: string
  details?: any
}

// Booking interface
interface Booking {
  id: string
  propertyId: string
  propertyName?: string
  guestName: string
  guestEmail: string
  checkInDate: Timestamp | Date
  checkOutDate: Timestamp | Date
  numberOfGuests: number
  totalAmount: number
  status: string
  createdAt: Timestamp | Date
  [key: string]: any
}

// Property interface
interface Property {
  id: string
  name: string
  maxOccupancy: number
  minStay: number
  unavailableDates?: { start: Timestamp; end: Timestamp }[]
  [key: string]: any
}

class AIBookingApprovalService {
  private bookingListener: (() => void) | null = null
  private processingBookings: ProcessingState = {}
  private isInitialized = false
  private processingQueue: string[] = []
  private isProcessingQueue = false
  private maxConcurrentProcessing = 3

  /**
   * Initialize the AI Booking Approval Service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ AI Booking Approval Service already initialized')
      return
    }

    try {
      console.log('🤖 Initializing AI Booking Approval Service...')

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          '⚠️ AI automation disabled - AI Booking Approval Service will not monitor bookings'
        )
        return
      }

      // Set up listener for pending bookings
      this.setupPendingBookingsListener()

      this.isInitialized = true
      console.log('✅ AI Booking Approval Service initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing AI Booking Approval Service:', error)
    }
  }

  /**
   * Set up listener for pending bookings
   */
  private setupPendingBookingsListener(): void {
    // Clear any existing listener
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }

    if (!db) {
      console.error("Firebase not initialized, cannot setup booking listener")
      return
    }

    // Create query for pending bookings
    const bookingsRef = collection(db, 'bookings')
    const pendingBookingsQuery = query(
      bookingsRef,
      where('status', '==', 'pending')
    )

    // Set up real-time listener
    this.bookingListener = onSnapshot(
      pendingBookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          // Only process new pending bookings
          if (change.type === 'added') {
            const bookingId = change.doc.id
            const bookingData = change.doc.data() as Booking
            bookingData.id = bookingId

            // Add to processing queue
            this.addToProcessingQueue(bookingId, bookingData)
          }
        })
      },
      (error) => {
        console.error('❌ Error in pending bookings listener:', error)
      }
    )

    console.log('🔍 Monitoring pending bookings for automated approval')
  }

  /**
   * Add booking to processing queue
   */
  private addToProcessingQueue(bookingId: string, bookingData: Booking): void {
    // Skip if already processing this booking
    if (this.processingBookings[bookingId]) {
      console.log(`⏭️ Already processing booking ${bookingId}, skipping`)
      return
    }

    console.log(`➕ Adding booking ${bookingId} to processing queue`)
    this.processingQueue.push(bookingId)
    this.processingBookings[bookingId] = true

    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
  }

  /**
   * Process the booking queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.processingQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log(
      `🔄 Processing booking queue (${this.processingQueue.length} items)`
    )

    try {
      // Process up to maxConcurrentProcessing bookings at once
      const batchSize = Math.min(
        this.maxConcurrentProcessing,
        this.processingQueue.length
      )
      const batch = this.processingQueue.splice(0, batchSize)

      // Process each booking in parallel
      await Promise.all(
        batch.map(async (bookingId) => {
          try {
            // Check if AI is still enabled before processing
            const aiEnabled = await AIAutomationService.isEnabled()
            if (!aiEnabled) {
              console.log(
                `⚠️ AI automation disabled - skipping automated approval for booking ${bookingId}`
              )
              this.processingBookings[bookingId] = false
              return
            }

            // Get the booking data
            const bookingDoc = await getDoc(doc(db, 'bookings', bookingId))
            if (!bookingDoc.exists()) {
              console.log(`⚠️ Booking ${bookingId} no longer exists, skipping`)
              this.processingBookings[bookingId] = false
              return
            }

            const bookingData = bookingDoc.data() as Booking
            bookingData.id = bookingId

            // Skip if status is no longer pending
            if (bookingData.status !== 'pending') {
              console.log(
                `⏭️ Booking ${bookingId} is no longer pending (${bookingData.status}), skipping`
              )
              this.processingBookings[bookingId] = false
              return
            }

            // Process the booking
            await this.processBooking(bookingData)
          } catch (error) {
            console.error(`❌ Error processing booking ${bookingId}:`, error)
            // Mark booking as having an error
            await this.markBookingError(bookingId, error)
          } finally {
            // Mark as no longer processing
            this.processingBookings[bookingId] = false
          }
        })
      )

      // Continue processing queue if items remain
      if (this.processingQueue.length > 0) {
        this.processQueue()
      } else {
        this.isProcessingQueue = false
        console.log('✅ Booking queue processing complete')
      }
    } catch (error) {
      console.error('❌ Error processing booking queue:', error)
      this.isProcessingQueue = false
    }
  }

  /**
   * Process an individual booking
   */
  private async processBooking(booking: Booking): Promise<void> {
    console.log(
      `🔍 AI processing booking ${booking.id} for ${booking.guestName}`
    )

    try {
      // Validate the booking
      const validationResult = await this.validateBooking(booking)

      if (validationResult.valid) {
        // Approve the booking
        await this.approveBooking(booking)
      } else {
        // Reject the booking
        await this.rejectBooking(
          booking,
          validationResult.reason || 'Unknown validation failure',
          validationResult.details
        )
      }
    } catch (error) {
      console.error(`❌ Error processing booking ${booking.id}:`, error)
      await this.markBookingError(booking.id, error)
    }
  }

  /**
   * Mark a booking as having an error
   */
  private async markBookingError(bookingId: string, error: any): Promise<void> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId)

      await updateDoc(bookingRef, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorTimestamp: serverTimestamp(),
        processingSystem: 'AI_BOOKING_APPROVAL',
      })

      // Log to audit trail
      await this.logToAuditTrail({
        action: 'booking_error',
        bookingId,
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        aiEnabled: true,
      })

      console.log(`⚠️ Marked booking ${bookingId} with error status`)
    } catch (logError) {
      console.error(`❌ Failed to mark booking ${bookingId} error:`, logError)
    }
  }

  /**
   * Validate a booking against all business rules
   */
  private async validateBooking(booking: Booking): Promise<ValidationResult> {
    console.log(`🔍 Validating booking ${booking.id}`)

    try {
      // Required field validation
      const requiredFieldsResult = this.validateRequiredFields(booking)
      if (!requiredFieldsResult.valid) {
        return requiredFieldsResult
      }

      // Date validation
      const dateValidationResult = this.validateDates(booking)
      if (!dateValidationResult.valid) {
        return dateValidationResult
      }

      // Property validation
      const propertyValidationResult = await this.validateProperty(booking)
      if (!propertyValidationResult.valid) {
        return propertyValidationResult
      }

      // Double-booking validation
      const doubleBookingResult = await this.validateNoDoubleBooking(booking)
      if (!doubleBookingResult.valid) {
        return doubleBookingResult
      }

      // Advance booking validation
      const advanceBookingResult = this.validateAdvanceBooking(booking)
      if (!advanceBookingResult.valid) {
        return advanceBookingResult
      }

      console.log(`✅ Booking ${booking.id} passed all validations`)
      return { valid: true }
    } catch (error) {
      console.error(`❌ Error validating booking ${booking.id}:`, error)
      return {
        valid: false,
        reason: 'Validation system error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(booking: Booking): ValidationResult {
    const requiredFields = [
      'guestName',
      'guestEmail',
      'propertyId',
      'checkInDate',
      'checkOutDate',
      'numberOfGuests',
      'totalAmount',
    ]

    for (const field of requiredFields) {
      if (!booking[field]) {
        return {
          valid: false,
          reason: `Missing required field: ${field}`,
          details: { field, value: booking[field] },
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(booking.guestEmail)) {
      return {
        valid: false,
        reason: 'Invalid email format',
        details: { email: booking.guestEmail },
      }
    }

    // Validate positive numbers
    if (booking.numberOfGuests <= 0) {
      return {
        valid: false,
        reason: 'Number of guests must be positive',
        details: { numberOfGuests: booking.numberOfGuests },
      }
    }

    if (booking.totalAmount <= 0) {
      return {
        valid: false,
        reason: 'Total amount must be positive',
        details: { totalAmount: booking.totalAmount },
      }
    }

    return { valid: true }
  }

  /**
   * Validate dates
   */
  private validateDates(booking: Booking): ValidationResult {
    const checkIn =
      booking.checkInDate instanceof Timestamp
        ? booking.checkInDate.toDate()
        : new Date(booking.checkInDate)
    const checkOut =
      booking.checkOutDate instanceof Timestamp
        ? booking.checkOutDate.toDate()
        : new Date(booking.checkOutDate)
    const now = new Date()

    // Check if dates are valid
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return {
        valid: false,
        reason: 'Invalid date format',
        details: {
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        },
      }
    }

    // Check if check-out is after check-in
    if (checkOut <= checkIn) {
      return {
        valid: false,
        reason: 'Check-out date must be after check-in date',
        details: { checkInDate: checkIn, checkOutDate: checkOut },
      }
    }

    // Check if check-in is not in the past
    if (checkIn < now) {
      return {
        valid: false,
        reason: 'Check-in date cannot be in the past',
        details: { checkInDate: checkIn, currentDate: now },
      }
    }

    return { valid: true }
  }

  /**
   * Validate property exists and guest capacity
   */
  private async validateProperty(booking: Booking): Promise<ValidationResult> {
    try {
      const propertyDoc = await getDoc(
        doc(db, 'properties', booking.propertyId)
      )

      if (!propertyDoc.exists()) {
        return {
          valid: false,
          reason: 'Property does not exist',
          details: { propertyId: booking.propertyId },
        }
      }

      const property = propertyDoc.data() as Property

      // Check guest capacity
      if (booking.numberOfGuests > property.maxOccupancy) {
        return {
          valid: false,
          reason: 'Number of guests exceeds property capacity',
          details: {
            numberOfGuests: booking.numberOfGuests,
            maxOccupancy: property.maxOccupancy,
          },
        }
      }

      // Check minimum stay requirement
      const checkIn =
        booking.checkInDate instanceof Timestamp
          ? booking.checkInDate.toDate()
          : new Date(booking.checkInDate)
      const checkOut =
        booking.checkOutDate instanceof Timestamp
          ? booking.checkOutDate.toDate()
          : new Date(booking.checkOutDate)
      const stayDuration = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (property.minStay && stayDuration < property.minStay) {
        return {
          valid: false,
          reason: 'Stay duration is less than minimum required',
          details: {
            stayDuration,
            minStay: property.minStay,
          },
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        reason: 'Error validating property',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate no double-booking exists
   */
  private async validateNoDoubleBooking(
    booking: Booking
  ): Promise<ValidationResult> {
    try {
      const checkIn =
        booking.checkInDate instanceof Timestamp
          ? booking.checkInDate.toDate()
          : new Date(booking.checkInDate)
      const checkOut =
        booking.checkOutDate instanceof Timestamp
          ? booking.checkOutDate.toDate()
          : new Date(booking.checkOutDate)

      // Query for confirmed bookings for the same property
      const bookingsRef = collection(db, 'bookings')
      const confirmedBookingsQuery = query(
        bookingsRef,
        where('propertyId', '==', booking.propertyId),
        where('status', '==', 'confirmed')
      )

      const confirmedBookings = await getDocs(confirmedBookingsQuery)

      // Check for date overlaps
      for (const bookingDoc of confirmedBookings.docs) {
        const existingBooking = bookingDoc.data()
        const existingCheckIn =
          existingBooking.checkInDate instanceof Timestamp
            ? existingBooking.checkInDate.toDate()
            : new Date(existingBooking.checkInDate)
        const existingCheckOut =
          existingBooking.checkOutDate instanceof Timestamp
            ? existingBooking.checkOutDate.toDate()
            : new Date(existingBooking.checkOutDate)

        // Check for overlap: new booking starts before existing ends AND new booking ends after existing starts
        if (checkIn < existingCheckOut && checkOut > existingCheckIn) {
          return {
            valid: false,
            reason: 'Booking conflicts with existing confirmed booking',
            details: {
              conflictingBookingId: bookingDoc.id,
              requestedDates: { checkIn, checkOut },
              conflictingDates: {
                checkIn: existingCheckIn,
                checkOut: existingCheckOut,
              },
            },
          }
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        reason: 'Error checking for double-booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate advance booking limit
   */
  private validateAdvanceBooking(booking: Booking): ValidationResult {
    const checkIn =
      booking.checkInDate instanceof Timestamp
        ? booking.checkInDate.toDate()
        : new Date(booking.checkInDate)
    const now = new Date()
    const daysDifference = Math.ceil(
      (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDifference > MAX_ADVANCE_BOOKING_DAYS) {
      return {
        valid: false,
        reason: 'Booking is too far in advance',
        details: {
          daysDifference,
          maxAdvanceDays: MAX_ADVANCE_BOOKING_DAYS,
        },
      }
    }

    return { valid: true }
  }

  /**
   * Approve a booking
   */
  private async approveBooking(booking: Booking): Promise<void> {
    console.log(
      `✅ AI approving booking ${booking.id} for ${booking.guestName}`
    )

    try {
      // Use transaction to ensure atomic update
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, 'bookings', booking.id)

        // Update booking status
        transaction.update(bookingRef, {
          status: 'confirmed',
          approvedAt: serverTimestamp(),
          approvedBy: 'AI_SYSTEM',
          aiProcessed: true,
        })
      })

      // Log to audit trail
      await this.logToAuditTrail({
        action: 'booking_approved',
        bookingId: booking.id,
        guestName: booking.guestName,
        propertyId: booking.propertyId,
        reason: 'automated_validation_passed',
        aiEnabled: true,
      })

      // Log AI decision for dashboard tracking
      try {
        const AILogsService = (await import('./AILogsService')).default
        await AILogsService.logAIDecision({
          type: 'booking_approved',
          refId: booking.id,
          refType: 'booking',
          timestamp: serverTimestamp(),
          reason: 'Booking passed all validation checks',
          confidence: 0.95,
          metadata: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            propertyName: booking.propertyName,
            clientName: booking.guestName,
            amount: booking.totalPrice,
            duration: booking.nights,
          },
          system: 'AI_BOOKING_APPROVAL',
          status: 'success',
        })
      } catch (logError) {
        console.warn('Failed to log AI decision:', logError)
      }

      // Trigger calendar event creation via CalendarIntegrationService
      // The CalendarIntegrationService will handle this automatically via its listener

      console.log(`✅ Booking ${booking.id} approved successfully by AI`)
      toast.success(`🤖 AI approved booking for ${booking.guestName}`)
    } catch (error) {
      console.error(`❌ Error approving booking ${booking.id}:`, error)
      throw error
    }
  }

  /**
   * Reject a booking
   */
  private async rejectBooking(
    booking: Booking,
    reason: string,
    details?: any
  ): Promise<void> {
    console.log(
      `❌ AI rejecting booking ${booking.id} for ${booking.guestName}: ${reason}`
    )

    try {
      // Use transaction to ensure atomic update
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, 'bookings', booking.id)

        // Update booking status
        transaction.update(bookingRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: 'AI_SYSTEM',
          rejectionReason: reason,
          rejectionDetails: details,
          aiProcessed: true,
        })
      })

      // Log to audit trail
      await this.logToAuditTrail({
        action: 'booking_rejected',
        bookingId: booking.id,
        guestName: booking.guestName,
        propertyId: booking.propertyId,
        reason: reason,
        details: details,
        aiEnabled: true,
      })

      // Log AI decision for dashboard tracking
      try {
        const AILogsService = (await import('./AILogsService')).default
        await AILogsService.logAIDecision({
          type: 'booking_rejected',
          refId: booking.id,
          refType: 'booking',
          timestamp: serverTimestamp(),
          reason: reason,
          confidence: 0.9,
          metadata: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            propertyName: booking.propertyName,
            clientName: booking.guestName,
            amount: booking.totalPrice,
            duration: booking.nights,
            rejectionDetails: details,
          },
          system: 'AI_BOOKING_APPROVAL',
          status: 'success',
        })
      } catch (logError) {
        console.warn('Failed to log AI decision:', logError)
      }

      console.log(`❌ Booking ${booking.id} rejected by AI: ${reason}`)
      toast.warning(
        `🤖 AI rejected booking for ${booking.guestName}: ${reason}`
      )
    } catch (error) {
      console.error(`❌ Error rejecting booking ${booking.id}:`, error)
      throw error
    }
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
        system: 'AI_BOOKING_APPROVAL',
      })
    } catch (error) {
      console.error('❌ Failed to write to audit log:', error)
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }
    this.isInitialized = false
    console.log('🧹 AI Booking Approval Service cleaned up')
  }
}

// Export singleton instance
const aiBookingApprovalService = new AIBookingApprovalService()
export default aiBookingApprovalService
