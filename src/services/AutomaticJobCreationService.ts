/**
 * Automatic Job Creation Service
 * Creates standard property management jobs when bookings are confirmed
 */

import { getDb } from '@/lib/firebase'
import {
    addDoc,
    collection,
    doc,
    getDoc,
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
  checkIn?: string  // Legacy field name
  checkOut?: string  // Legacy field name
  checkInDate?: any  // New field name (can be Timestamp or string)
  checkOutDate?: any  // New field name (can be Timestamp or string)
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

    // Listen for bookings with status 'approved' OR 'confirmed' (primary triggers)
    // Using IN operator to watch both statuses simultaneously
    const bookingsQuery = query(
      collection(db, this.BOOKINGS_COLLECTION),
      where('status', 'in', ['approved', 'confirmed'])
    )

    this.bookingListener = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const rawData = change.doc.data()
            const bookingData = { 
              id: change.doc.id, 
              ...rawData,
              // Ensure date fields are properly included (Firestore may use different field names)
              checkInDate: rawData.checkInDate || rawData.checkIn,
              checkOutDate: rawData.checkOutDate || rawData.checkOut,
              checkIn: rawData.checkIn || rawData.checkInDate,
              checkOut: rawData.checkOut || rawData.checkOutDate,
            } as BookingData

            // CIRCUIT BREAKER: Skip if marked to skip job creation or already failed too many times
            if (bookingData.skipJobCreation || 
                (bookingData.jobCreationError && bookingData.jobCreationAttempts >= AutomaticJobCreationService.maxRetries)) {
              console.warn(`⚠️ SKIPPING booking ${bookingData.id}: marked to skip or too many failed attempts`)
              return
            }

            // Only process if jobs haven't been created yet
            if (!bookingData.jobsCreated) {
              console.log(`📋 ${bookingData.status} booking detected: ${bookingData.id} - Creating jobs automatically...`)
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

  // Circuit breaker to prevent infinite loops
  private static failedBookings = new Set<string>()
  private static maxRetries = 3
  private static retryCount = new Map<string, number>()

  /**
   * Create all standard jobs for a confirmed booking
   */
  async createJobsForBooking(booking: BookingData): Promise<JobCreationResult> {
    try {
      console.log(`🏗️ Creating standard jobs for booking ${booking.id}`)

      // Circuit breaker: Skip if already failed multiple times
      const currentRetries = AutomaticJobCreationService.retryCount.get(booking.id) || 0
      if (currentRetries >= AutomaticJobCreationService.maxRetries) {
        console.warn(`⚠️ CIRCUIT BREAKER: Skipping booking ${booking.id} after ${currentRetries} failed attempts`)
        return {
          success: false,
          error: `Circuit breaker activated - too many failed attempts (${currentRetries})`,
          jobIds: []
        }
      }

      // Validate booking data - support both checkIn/checkOut and checkInDate/checkOutDate
      const checkInField = booking.checkIn || booking.checkInDate;
      const checkOutField = booking.checkOut || booking.checkOutDate;
      
      // Debug: Log what we received
      console.log(`📅 Date fields check for booking ${booking.id}:`, {
        hasCheckIn: !!booking.checkIn,
        hasCheckOut: !!booking.checkOut,
        hasCheckInDate: !!booking.checkInDate,
        hasCheckOutDate: !!booking.checkOutDate,
        checkInType: booking.checkIn?.constructor?.name || booking.checkInDate?.constructor?.name,
        checkOutType: booking.checkOut?.constructor?.name || booking.checkOutDate?.constructor?.name,
      });
      
      if (!checkInField || !checkOutField) {
        // Increment retry counter
        AutomaticJobCreationService.retryCount.set(booking.id, currentRetries + 1)
        console.error(`❌ CRITICAL: Booking ${booking.id} missing dates - attempt ${currentRetries + 1}/${AutomaticJobCreationService.maxRetries}`)
        console.error(`   Available fields:`, Object.keys(booking))
        console.error(`   checkIn: ${booking.checkIn}, checkInDate: ${booking.checkInDate}`)
        console.error(`   checkOut: ${booking.checkOut}, checkOutDate: ${booking.checkOutDate}`)
        
        // Mark booking as having job creation issues to prevent infinite retries
        if (currentRetries + 1 >= AutomaticJobCreationService.maxRetries) {
          console.error(`🚨 CIRCUIT BREAKER: Marking booking ${booking.id} as problematic to stop infinite loop`)
          // Update booking to prevent further processing
          try {
            await updateDoc(doc(getDb(), this.BOOKINGS_COLLECTION, booking.id), {
              jobCreationError: 'Missing check-in or check-out dates',
              jobCreationAttempts: currentRetries + 1,
              lastJobCreationAttempt: new Date().toISOString(),
              skipJobCreation: true
            })
          } catch (updateError) {
            console.error('❌ Failed to update problematic booking:', updateError)
          }
        }
        
        throw new Error('Missing check-in or check-out dates')
      }

      // Validate booking status (primarily 'approved', but allow 'confirmed' for manual triggers)
      if (!['approved', 'confirmed'].includes(booking.status)) {
        throw new Error(`Booking status must be 'approved' or 'confirmed', current status: ${booking.status}`)
      }

      // ✅ NO STAFF ASSIGNMENT: Jobs broadcast to all cleaners, first to accept gets it
      // Removed: getAvailableStaff() call - not needed anymore

      // 🔴 NEW: Fetch complete property data with all required fields
      console.log(`🏠 Fetching complete property data for: ${booking.propertyId}`);
      const propertyData = await this.fetchCompletePropertyData(booking.propertyId);
      
      if (!propertyData) {
        throw new Error(`Property ${booking.propertyId} not found - cannot create jobs without property details`);
      }
      
      // 🔴 NEW: Generate Google Maps link
      const googleMapsLink = this.generateGoogleMapsLink(propertyData);
      
      // 🔴 NEW: Extract GPS coordinates
      const coordinates = this.extractCoordinates(propertyData);
      
      // 🔴 NEW: Prepare complete property details for job payload
      const propertyDetails = {
        photos: propertyData.images || [],
        accessInstructions: propertyData.accessInstructions || '',
        specialNotes: propertyData.specialNotes || propertyData.description || '',
        googleMapsLink: googleMapsLink,
        coordinates: coordinates
      };
      
      // 🔴 NEW: Validate we have minimum required property data before proceeding
      if (propertyDetails.photos.length === 0) {
        console.warn(`⚠️ WARNING: Property ${propertyData.name} has no photos - mobile app functionality will be limited`);
      }
      
      if (!propertyDetails.accessInstructions) {
        console.warn(`⚠️ WARNING: Property ${propertyData.name} has no access instructions - staff may need to contact office`);
      }
      
      if (!googleMapsLink) {
        console.error(`❌ BLOCKING: Could not generate Google Maps link for property ${propertyData.name}`);
        throw new Error('Google Maps link is required for mobile navigation - cannot dispatch jobs without it');
      }

      // Handle both field name formats and Firestore Timestamps
      const getDateValue = (field: any): Date => {
        if (!field) throw new Error('Date field is missing');
        if (field.toDate) return field.toDate(); // Firestore Timestamp
        if (typeof field === 'string') return new Date(field); // ISO string
        if (field instanceof Date) return field; // Already a Date
        return new Date(field); // Try to convert
      };

      const checkInDate = getDateValue(booking.checkIn || booking.checkInDate);
      const checkOutDate = getDateValue(booking.checkOut || booking.checkOutDate);
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

        // ✅ NEW WORKFLOW: Jobs are NOT auto-assigned!
        // Jobs broadcast to all cleaners, first to accept gets it
        // No staff assignment needed at creation time

        // Format dates to ISO strings for mobile app (YYYY-MM-DD format)
        const formatDateForMobile = (date: Date): string => {
          return date.toISOString().split('T')[0];
        };

        const jobData = {
          // Booking reference
          bookingId: booking.id,
          bookingRef: {
            id: booking.id,
            guestName: booking.guestName,
            checkInDate: formatDateForMobile(checkInDate),
            checkOutDate: formatDateForMobile(checkOutDate),
            totalAmount: booking.totalAmount || 0
          },

          // Property reference (basic)
          propertyRef: {
            id: booking.propertyId,
            name: propertyData.name || booking.propertyName || 'Unknown Property',
            address: propertyData.address?.fullAddress || booking.propertyAddress || ''
          },
          
          // Add propertyName at top level for mobile app compatibility
          propertyName: propertyData.name || booking.propertyName || 'Unknown Property',

          // 🔴 NEW: Complete property details for mobile app (MANDATORY)
          propertyPhotos: propertyDetails.photos,
          accessInstructions: propertyDetails.accessInstructions,
          specialNotes: propertyDetails.specialNotes,

          // 🔴 NEW: Location with maps and GPS coordinates (MANDATORY for navigation)
          location: {
            address: (propertyData as any).address?.fullAddress || booking.propertyAddress || '',
            googleMapsLink: propertyDetails.googleMapsLink,
            latitude: propertyDetails.coordinates.latitude,
            longitude: propertyDetails.coordinates.longitude
          },

          // 🔴 NEW: Guest details (MANDATORY)
          guestCount: booking.numberOfGuests || 1,
          guestName: booking.guestName,
          checkInDate: booking.checkIn,
          checkOutDate: booking.checkOut,

          // Job details
          jobType: template.jobType,
          title: template.title,
          description: `${template.description} for ${booking.guestName}`,
          priority: template.priority,

          // Scheduling
          scheduledDate: Timestamp.fromDate(scheduledDate),
          estimatedDuration: template.estimatedDuration,
          deadline: Timestamp.fromDate(new Date(scheduledDate.getTime() + (template.estimatedDuration * 60 * 1000))),

          // ✅ Staff assignment: NONE initially!
          // Job will be broadcast to all cleaners
          // First cleaner to accept gets assigned
          assignedStaffId: null,
          assignedTo: null,
          assignedStaff: null,
          assignedStaffRef: null,

          // Job requirements
          requiredSkills: template.requiredSkills,
          requiredSupplies: template.requiredSupplies,
          specialInstructions: template.instructions,
          
          // ✅ ROLE REQUIREMENT: Jobs visible only to staff with "cleaner" role
          requiredRole: 'cleaner',
          requiredStaffType: 'cleaner',

          // ✅ Status: pending (waiting for cleaner to accept)
          status: 'pending',

          // Metadata
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'AUTOMATIC_JOB_CREATION',
          autoAssigned: false, // Jobs are NOT auto-assigned anymore
          broadcastToAll: true // Flag indicating this job is visible to all cleaners
        }

        // Validate job payload before dispatch (with warnings, not blocking)
        const validation = this.validateJobPayload(jobData);
        if (!validation.valid) {
          console.warn(`⚠️ Job payload has missing optional fields for ${template.title}:`, validation.missing);
          console.warn('   Job will be created but staff may need to contact office for details');
          // Don't throw - allow job creation to continue
        }

        // Create the job
        const jobRef = await addDoc(collection(getDb(), this.JOBS_COLLECTION), jobData)
        createdJobIds.push(jobRef.id)

        console.log(`✅ Created ${template.title} job: ${jobRef.id}`)
        
        // Create calendar event for this job (AUTOMATIC BACKOFFICE VISIBILITY)
        try {
          const jobCalendarEvent = {
            title: jobData.title,
            description: jobData.description || `${jobData.jobType} - ${propertyData.name}`,
            start: jobData.scheduledDate,
            end: jobData.deadline || Timestamp.fromDate(
              new Date(jobData.scheduledDate.toDate().getTime() + (jobData.estimatedDuration * 60 * 1000))
            ),
            type: 'job',
            jobType: jobData.jobType,
            jobId: jobRef.id,
            bookingId: booking.id,
            propertyId: booking.propertyId,
            propertyName: propertyData.name,
            assignedStaff: null, // Not assigned yet
            assignedStaffId: null, // Not assigned yet
            status: jobData.status, // 'pending'
            color: jobData.status === 'completed' ? '#10b981' : 
                   jobData.status === 'accepted' ? '#3b82f6' : 
                   jobData.status === 'in_progress' ? '#8b5cf6' : 
                   jobData.status === 'pending' ? '#fbbf24' : '#6b7280',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await addDoc(collection(getDb(), 'calendar_events'), jobCalendarEvent);
          console.log(`📅 Created calendar event for job: ${jobRef.id}`);
        } catch (calendarError) {
          console.error('⚠️ Warning: Failed to create calendar event for job:', calendarError);
          // Don't block job creation if calendar event fails
        }
      }

      // 🔴 NEW: Create calendar events for check-in and check-out (AUTOMATIC BACKOFFICE VISIBILITY)
      try {
        // Check-in event
        const checkInEvent = {
          title: `Check-in: ${booking.guestName}`,
          description: `Guest arrival at ${propertyData.name}`,
          start: Timestamp.fromDate(checkInDate),
          end: Timestamp.fromDate(new Date(checkInDate.getTime() + 2 * 60 * 60 * 1000)), // +2 hours
          type: 'check-in',
          bookingId: booking.id,
          propertyId: booking.propertyId,
          propertyName: propertyData.name,
          guestName: booking.guestName,
          status: 'confirmed',
          color: '#10b981', // green
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(getDb(), 'calendar_events'), checkInEvent);
        console.log(`📅 Created check-in calendar event for booking: ${booking.id}`);
        
        // Check-out event
        const checkOutEvent = {
          title: `Check-out: ${booking.guestName}`,
          description: `Guest departure from ${propertyData.name}`,
          start: Timestamp.fromDate(checkOutDate),
          end: Timestamp.fromDate(new Date(checkOutDate.getTime() + 2 * 60 * 60 * 1000)), // +2 hours
          type: 'check-out',
          bookingId: booking.id,
          propertyId: booking.propertyId,
          propertyName: propertyData.name,
          guestName: booking.guestName,
          status: 'confirmed',
          color: '#ef4444', // red
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(getDb(), 'calendar_events'), checkOutEvent);
        console.log(`📅 Created check-out calendar event for booking: ${booking.id}`);
      } catch (calendarError) {
        console.error('⚠️ Warning: Failed to create check-in/check-out calendar events:', calendarError);
        // Don't block job creation if calendar events fail
      }

      // Mark booking as having jobs created
      await updateDoc(doc(getDb(), this.BOOKINGS_COLLECTION, booking.id), {
        jobsCreated: true,
        jobsCreatedAt: serverTimestamp(),
        jobsCreatedBy: 'AUTOMATIC_JOB_CREATION',
        createdJobIds: createdJobIds,
        broadcastToAllCleaners: true, // Jobs visible to all cleaners
        pendingAcceptance: true // Waiting for cleaners to accept
      })

      console.log(`🎉 Successfully created ${createdJobIds.length} jobs for booking ${booking.id}`)

      return {
        success: true,
        jobIds: createdJobIds,
        jobsCreated: createdJobIds.length
      }

    } catch (error) {
      console.error(`❌ Error creating jobs for booking ${booking.id}:`, error)

      // Increment retry counter
      const currentRetries = AutomaticJobCreationService.retryCount.get(booking.id) || 0
      AutomaticJobCreationService.retryCount.set(booking.id, currentRetries + 1)

      // Mark booking with error and increment attempt counter
      try {
        await updateDoc(doc(getDb(), this.BOOKINGS_COLLECTION, booking.id), {
          jobCreationError: error instanceof Error ? error.message : 'Unknown error',
          jobCreationAttemptedAt: serverTimestamp(),
          jobCreationAttempts: (booking.jobCreationAttempts || 0) + 1,
          // If max retries reached, mark to skip future attempts
          skipJobCreation: currentRetries + 1 >= AutomaticJobCreationService.maxRetries
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
   * 🔴 NEW: Fetch complete property data including all required fields for mobile
   * CRITICAL: This ensures job payload contains ALL property details
   */
  private async fetchCompletePropertyData(propertyId: string): Promise<any> {
    try {
      const db = getDb();
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      
      if (!propertyDoc.exists()) {
        console.error(`❌ Property ${propertyId} not found`);
        return null;
      }
      
      const property: any = { id: propertyDoc.id, ...propertyDoc.data() };
      
      console.log('🏠 Fetched property data:', {
        id: property.id,
        name: property.name,
        hasImages: (property.images?.length || 0) > 0,
        imageCount: property.images?.length || 0,
        hasAccessInstructions: !!property.accessInstructions,
        hasGoogleMaps: !!property.address?.googleMapsLink,
        hasCoordinates: !!(property.address?.coordinates?.latitude)
      });
      
      return property;
    } catch (error) {
      console.error('❌ Error fetching property data:', error);
      return null;
    }
  }

  /**
   * 🔴 NEW: Generate or validate Google Maps link
   * PRIORITY: 
   * 1. Use existing googleMapsLink if valid
   * 2. Generate from coordinates if available
   * 3. Generate from address string as fallback
   */
  private generateGoogleMapsLink(property: any): string {
    // Option 1: Use existing link if present
    if (property.address?.googleMapsLink) {
      console.log('✅ Using existing Google Maps link');
      return property.address.googleMapsLink;
    }
    
    // Option 2: Generate from coordinates (most reliable)
    if (property.address?.coordinates?.latitude && property.address?.coordinates?.longitude) {
      const lat = property.address.coordinates.latitude;
      const lng = property.address.coordinates.longitude;
      const link = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      console.log('✅ Generated Google Maps link from coordinates:', link);
      return link;
    }
    
    // Option 3: Generate from address string (fallback)
    if (property.address?.fullAddress || property.address) {
      const address = property.address?.fullAddress || property.address;
      const encoded = encodeURIComponent(address);
      const link = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      console.log('⚠️ Generated Google Maps link from address string (fallback):', link);
      return link;
    }
    
    console.warn('⚠️ Could not generate Google Maps link - no location data available');
    return '';
  }

  /**
   * 🔴 NEW: Extract GPS coordinates from property data
   */
  private extractCoordinates(property: any): { latitude: number | null; longitude: number | null } {
    // Check various possible locations for coordinates
    const coords = 
      property.address?.coordinates ||
      property.coordinates ||
      property.location?.coordinates ||
      null;
    
    if (coords && coords.latitude && coords.longitude) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude
      };
    }
    
    console.warn('⚠️ No GPS coordinates available for property');
    return { latitude: null, longitude: null };
  }

  /**
   * 🔴 NEW: Validate job payload has ALL required fields before dispatch
   * FAIL FAST if any required field is missing - prevents incomplete jobs from being created
   */
  private validateJobPayload(jobData: any): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    // Check property photos
    if (!Array.isArray(jobData.propertyPhotos) || jobData.propertyPhotos.length === 0) {
      missing.push('propertyPhotos (need at least 1 image)');
    }
    
    // Check access instructions
    if (!jobData.accessInstructions || jobData.accessInstructions.trim() === '') {
      missing.push('accessInstructions (gate codes, keys, etc.)');
    }
    
    // Check Google Maps link
    if (!jobData.location?.googleMapsLink || jobData.location.googleMapsLink === '') {
      missing.push('location.googleMapsLink (required for navigation)');
    }
    
    // Check GPS coordinates (both required)
    if (!jobData.location?.latitude || !jobData.location?.longitude) {
      missing.push('location.coordinates (latitude/longitude required)');
    }
    
    // Check guest count
    if (!jobData.guestCount || jobData.guestCount < 1) {
      missing.push('guestCount (must be at least 1)');
    }
    
    // Check property address
    if (!jobData.location?.address || jobData.location.address.trim() === '') {
      missing.push('location.address (full address required)');
    }
    
    const valid = missing.length === 0;
    
    if (!valid) {
      console.error('❌ JOB PAYLOAD VALIDATION FAILED:', missing);
    } else {
      console.log('✅ Job payload validation passed - all required fields present');
    }
    
    return { valid, missing };
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
