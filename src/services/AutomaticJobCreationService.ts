/**
 * Automatic Job Creation Service
 * Creates standard property management jobs when bookings are confirmed
 */

import { getDb } from '@/lib/firebase'
import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore'

// Standard job templates for property management
export const STANDARD_JOB_TEMPLATES = {
  PRE_ARRIVAL_CLEANING: {
    id: 'pre_arrival_cleaning',
    title: 'Pre-arrival Cleaning',
    jobType: 'cleaning',
    description: 'Deep cleaning and preparation before guest arrival',
    estimatedDuration: 180, // 3 hours
    priority: 'high',
    requiredSkills: ['cleaning', 'housekeeping', 'deep_cleaning'],
    requiredSupplies: ['cleaning_supplies', 'linens', 'towels'],
    scheduleBefore: 24, // 24 hours before check-in
    instructions: 'Complete deep cleaning, fresh linens, stock amenities, final inspection'
  },
  PROPERTY_INSPECTION: {
    id: 'property_inspection',
    title: 'Property Inspection',
    jobType: 'inspection',
    description: 'Pre-arrival property inspection and setup verification',
    estimatedDuration: 60, // 1 hour
    priority: 'high',
    requiredSkills: ['inspection', 'maintenance', 'quality_control'],
    requiredSupplies: ['inspection_checklist', 'camera'],
    scheduleBefore: 2, // 2 hours before check-in
    instructions: 'Inspect all systems, verify cleanliness, check amenities, document any issues'
  },
  GUEST_CHECKIN_SETUP: {
    id: 'guest_checkin_setup',
    title: 'Guest Check-in Setup',
    jobType: 'checkin_prep',
    description: 'Final preparation and setup for guest arrival',
    estimatedDuration: 30, // 30 minutes
    priority: 'urgent',
    requiredSkills: ['hospitality', 'guest_services'],
    requiredSupplies: ['welcome_package', 'keys', 'instructions'],
    scheduleBefore: 0.5, // 30 minutes before check-in
    instructions: 'Final walkthrough, set temperature, prepare welcome items, ensure access'
  },
  MID_STAY_MAINTENANCE: {
    id: 'mid_stay_maintenance',
    title: 'Mid-stay Maintenance Check',
    jobType: 'maintenance',
    description: 'Maintenance check during extended stays',
    estimatedDuration: 45, // 45 minutes
    priority: 'medium',
    requiredSkills: ['maintenance', 'inspection'],
    requiredSupplies: ['maintenance_tools', 'supplies'],
    scheduleAtMidpoint: true, // Only for stays > 3 days
    minStayDays: 3,
    instructions: 'Check systems, address any issues, restock supplies if needed'
  },
  PRE_DEPARTURE_INSPECTION: {
    id: 'pre_departure_inspection',
    title: 'Pre-departure Inspection',
    jobType: 'inspection',
    description: 'Inspection before guest checkout',
    estimatedDuration: 30, // 30 minutes
    priority: 'medium',
    requiredSkills: ['inspection', 'guest_services'],
    requiredSupplies: ['inspection_checklist'],
    scheduleBeforeCheckout: 2, // 2 hours before checkout
    instructions: 'Assess property condition, note any damages, prepare for checkout'
  },
  POST_CHECKOUT_CLEANING: {
    id: 'post_checkout_cleaning',
    title: 'Post-checkout Cleaning',
    jobType: 'cleaning',
    description: 'Complete cleaning after guest departure',
    estimatedDuration: 150, // 2.5 hours
    priority: 'high',
    requiredSkills: ['cleaning', 'housekeeping', 'laundry'],
    requiredSupplies: ['cleaning_supplies', 'laundry_supplies'],
    scheduleAfterCheckout: 0, // Immediately after checkout
    instructions: 'Full cleaning, laundry, sanitization, damage assessment'
  },
  PROPERTY_RESET: {
    id: 'property_reset',
    title: 'Property Reset and Inventory Check',
    jobType: 'maintenance',
    description: 'Reset property and complete inventory check',
    estimatedDuration: 60, // 1 hour
    priority: 'medium',
    requiredSkills: ['maintenance', 'inventory', 'setup'],
    requiredSupplies: ['inventory_checklist', 'replacement_items'],
    scheduleAfterCheckout: 1, // 1 hour after checkout
    instructions: 'Reset all systems, complete inventory, restock items, prepare for next guest'
  }
} as const

interface BookingData {
  id: string
  status: string
  guestName: string
  propertyId: string
  propertyName: string
  propertyAddress?: string
  checkIn: string
  checkOut: string
  numberOfGuests?: number
  totalAmount?: number
  jobsCreated?: boolean
  [key: string]: any
}

interface JobCreationResult {
  success: boolean
  jobIds?: string[]
  error?: string
  jobsCreated?: number
}

class AutomaticJobCreationService {
  private readonly JOBS_COLLECTION = 'jobs'
  private readonly BOOKINGS_COLLECTION = 'bookings'
  private readonly STAFF_COLLECTION = 'staff_accounts'
  private readonly DEFAULT_STAFF_EMAIL = 'staff@siamoon.com'

  private bookingListener: (() => void) | null = null

  /**
   * Start monitoring bookings for status changes to 'confirmed'
   */
  startMonitoring(): void {
    const db = getDb()
    if (!db) {
      console.error('❌ Firebase not initialized')
      return
    }

    console.log('🔍 Starting automatic job creation monitoring...')

    // Listen for bookings with status 'approved' (primary trigger)
    // Note: Using single status to avoid composite index requirement
    const bookingsQuery = query(
      collection(db, this.BOOKINGS_COLLECTION),
      where('status', '==', 'approved')
    )

    this.bookingListener = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const bookingData = { id: change.doc.id, ...change.doc.data() } as BookingData

            // Only process if jobs haven't been created yet
            if (!bookingData.jobsCreated) {
              console.log(`📋 Confirmed booking detected: ${bookingData.id} - Creating jobs...`)
              this.createJobsForBooking(bookingData)
            }
          }
        })
      },
      (error) => {
        console.error('❌ Error monitoring bookings:', error)
      }
    )

    console.log('✅ Automatic job creation monitoring started')
  }

  /**
   * Stop monitoring bookings
   */
  stopMonitoring(): void {
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
      console.log('🔄 Stopped automatic job creation monitoring')
    }
  }

  /**
   * Create all standard jobs for a confirmed booking
   */
  async createJobsForBooking(booking: BookingData): Promise<JobCreationResult> {
    try {
      console.log(`🏗️ Creating standard jobs for booking ${booking.id}`)

      // Validate booking data
      if (!booking.checkIn || !booking.checkOut) {
        throw new Error('Missing check-in or check-out dates')
      }

      // Validate booking status (primarily 'approved', but allow 'confirmed' for manual triggers)
      if (!['approved', 'confirmed'].includes(booking.status)) {
        throw new Error(`Booking status must be 'approved' or 'confirmed', current status: ${booking.status}`)
      }

      // Get available staff for job assignment
      const availableStaff = await this.getAvailableStaff()
      if (availableStaff.length === 0) {
        throw new Error('No available staff found for job assignment')
      }

      const checkInDate = new Date(booking.checkIn)
      const checkOutDate = new Date(booking.checkOut)
      const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

      const createdJobIds: string[] = []

      // Create each standard job
      for (const [templateKey, template] of Object.entries(STANDARD_JOB_TEMPLATES)) {
        // Skip mid-stay maintenance for short stays
        if (template.id === 'mid_stay_maintenance' && stayDuration <= (template.minStayDays || 3)) {
          console.log(`⏭️ Skipping mid-stay maintenance for ${stayDuration}-day stay`)
          continue
        }

        const scheduledDate = this.calculateScheduledDate(template, checkInDate, checkOutDate, stayDuration)

        // Assign staff based on job type and availability
        const assignedStaff = this.assignStaffToJob(template, availableStaff, scheduledDate)

        const jobData = {
          // Booking reference
          bookingId: booking.id,
          bookingRef: {
            id: booking.id,
            guestName: booking.guestName,
            checkInDate: booking.checkIn,
            checkOutDate: booking.checkOut,
            totalAmount: booking.totalAmount || 0
          },

          // Property reference
          propertyRef: {
            id: booking.propertyId,
            name: booking.propertyName,
            address: booking.propertyAddress || ''
          },

          // Job details
          jobType: template.jobType,
          title: template.title,
          description: `${template.description} for ${booking.guestName}`,
          priority: template.priority,

          // Scheduling
          scheduledDate: Timestamp.fromDate(scheduledDate),
          estimatedDuration: template.estimatedDuration,
          deadline: Timestamp.fromDate(new Date(scheduledDate.getTime() + (template.estimatedDuration * 60 * 1000))),

          // Staff assignment
          assignedStaffId: assignedStaff.id,
          assignedStaff: {
            id: assignedStaff.id,
            name: assignedStaff.name,
            email: assignedStaff.email,
            phone: assignedStaff.phone || '',
            role: assignedStaff.role || 'staff'
          },

          // Job requirements
          requiredSkills: template.requiredSkills,
          requiredSupplies: template.requiredSupplies,
          specialInstructions: template.instructions,

          // Status
          status: 'assigned',

          // Metadata
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'AUTOMATIC_JOB_CREATION',
          autoAssigned: true
        }

        // Create the job
        const jobRef = await addDoc(collection(getDb(), this.JOBS_COLLECTION), jobData)
        createdJobIds.push(jobRef.id)

        console.log(`✅ Created ${template.title} job: ${jobRef.id}`)
      }

      // Mark booking as having jobs created
      await updateDoc(doc(getDb(), this.BOOKINGS_COLLECTION, booking.id), {
        jobsCreated: true,
        jobsCreatedAt: serverTimestamp(),
        jobsCreatedBy: 'AUTOMATIC_JOB_CREATION',
        createdJobIds: createdJobIds,
        assignedStaffCount: availableStaff.length,
        assignedStaffEmails: availableStaff.map(staff => staff.email)
      })

      console.log(`🎉 Successfully created ${createdJobIds.length} jobs for booking ${booking.id}`)

      return {
        success: true,
        jobIds: createdJobIds,
        jobsCreated: createdJobIds.length
      }

    } catch (error) {
      console.error(`❌ Error creating jobs for booking ${booking.id}:`, error)

      // Mark booking with error
      try {
        await updateDoc(doc(getDb(), this.BOOKINGS_COLLECTION, booking.id), {
          jobCreationError: error instanceof Error ? error.message : 'Unknown error',
          jobCreationAttemptedAt: serverTimestamp()
        })
      } catch (updateError) {
        console.error('❌ Error updating booking with job creation error:', updateError)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Calculate scheduled date for a job based on template rules
   */
  private calculateScheduledDate(
    template: typeof STANDARD_JOB_TEMPLATES[keyof typeof STANDARD_JOB_TEMPLATES],
    checkInDate: Date,
    checkOutDate: Date,
    stayDuration: number
  ): Date {
    if ('scheduleBefore' in template) {
      // Schedule before check-in
      return new Date(checkInDate.getTime() - (template.scheduleBefore * 60 * 60 * 1000))
    } else if ('scheduleBeforeCheckout' in template) {
      // Schedule before checkout
      return new Date(checkOutDate.getTime() - (template.scheduleBeforeCheckout * 60 * 60 * 1000))
    } else if ('scheduleAfterCheckout' in template) {
      // Schedule after checkout
      return new Date(checkOutDate.getTime() + (template.scheduleAfterCheckout * 60 * 60 * 1000))
    } else if ('scheduleAtMidpoint' in template) {
      // Schedule at midpoint of stay
      const midpoint = new Date(checkInDate.getTime() + ((checkOutDate.getTime() - checkInDate.getTime()) / 2))
      return midpoint
    }

    // Default to check-in time
    return checkInDate
  }

  /**
   * Get all available staff members for job assignment
   */
  private async getAvailableStaff(): Promise<any[]> {
    try {
      const db = getDb()
      const staffQuery = query(
        collection(db, this.STAFF_COLLECTION),
        where('status', '==', 'active')
      )

      const snapshot = await getDocs(staffQuery)
      const availableStaff: any[] = []

      snapshot.forEach((doc) => {
        availableStaff.push({ id: doc.id, ...doc.data() })
      })

      // If no active staff found, try to get the default staff
      if (availableStaff.length === 0) {
        console.warn('⚠️ No active staff found, trying default staff...')
        const defaultStaff = await this.getStaffInfo(this.DEFAULT_STAFF_EMAIL)
        if (defaultStaff) {
          availableStaff.push(defaultStaff)
        }
      }

      console.log(`👥 Found ${availableStaff.length} available staff members`)
      return availableStaff
    } catch (error) {
      console.error('❌ Error getting available staff:', error)
      return []
    }
  }

  /**
   * Assign staff to a job based on job type and staff skills
   */
  private assignStaffToJob(
    template: typeof STANDARD_JOB_TEMPLATES[keyof typeof STANDARD_JOB_TEMPLATES],
    availableStaff: any[],
    scheduledDate: Date
  ): any {
    // Simple round-robin assignment for now
    // TODO: Implement more sophisticated assignment based on:
    // - Staff skills matching job requirements
    // - Staff availability at scheduled time
    // - Staff workload balancing
    // - Staff location/property assignments

    const staffIndex = Math.floor(Math.random() * availableStaff.length)
    const assignedStaff = availableStaff[staffIndex]

    console.log(`👤 Assigned ${template.title} to ${assignedStaff.name} (${assignedStaff.email})`)

    return assignedStaff
  }

  /**
   * Get staff information by email (fallback method)
   */
  private async getStaffInfo(email: string): Promise<any> {
    try {
      const db = getDb()
      const staffQuery = query(
        collection(db, this.STAFF_COLLECTION),
        where('email', '==', email)
      )

      const snapshot = await getDocs(staffQuery)
      if (snapshot.empty) {
        console.warn(`⚠️ Staff not found: ${email}`)
        return null
      }

      const staffDoc = snapshot.docs[0]
      return { id: staffDoc.id, ...staffDoc.data() }
    } catch (error) {
      console.error(`❌ Error getting staff info for ${email}:`, error)
      return null
    }
  }
}

// Export singleton instance
export const automaticJobCreationService = new AutomaticJobCreationService()
export default automaticJobCreationService
