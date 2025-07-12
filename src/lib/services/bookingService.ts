import { collection, getDocs, doc, updateDoc, query, where, addDoc, Timestamp, Firestore, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ProfileBasedClientMatching } from './profileBasedClientMatching'

// Use the centralized Firebase db instance

// Helper function to ensure db is available
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

export interface LiveBooking {
  id: string
  villaName: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  price: number
  specialRequests?: string

  // Client matching
  clientId?: string
  propertyId?: string
  matchConfidence: number

  // Metadata
  bookingSource: string
  bookingType: 'guest_booking' | 'direct_booking' | 'platform_booking'
  status: 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  receivedAt: any // Firestore Timestamp
  processedAt: any // Firestore Timestamp
  approvedAt?: any // Firestore Timestamp

  // Financial data
  revenue: number
  currency: string

  // Additional fields
  guestEmail?: string
  bookingReference?: string
  guests?: number
  paymentStatus?: string

  // Source tracking
  sourceDetails?: {
    platform: string
    method: string
    automation: boolean
    originalSource?: string
  }

  // Parsing metadata
  parsingConfidence?: number
  parsingWarnings?: string[]

  // Admin notes
  adminNotes?: string

  // Original payload for reference
  originalPayload?: any

  // Duplicate prevention
  duplicateCheckHash?: string
  isDuplicate?: boolean
  originalBookingId?: string
}

export interface BookingStats {
  totalBookings: number
  pendingApproval: number
  approved: number
  totalRevenue: number
  averageBookingValue: number
  occupancyRate: number
}

/**
 * Service for managing live bookings from Make.com automation
 */
export class BookingService {

  /**
   * Clean booking data by removing undefined values for Firebase compatibility
   */
  private static cleanBookingData(data: any): any {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively clean nested objects
          const cleanedNested = this.cleanBookingData(value)
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested
          }
        } else {
          cleaned[key] = value
        }
      }
    }
    return cleaned
  }

  /**
   * Create a new live booking with idempotency and error handling
   */
  static async createLiveBooking(bookingData: Omit<LiveBooking, 'id'>): Promise<{
    success: boolean
    bookingId?: string
    isDuplicate?: boolean
    error?: string
    retryCount?: number
  }> {
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        console.log(`💾 BOOKING: Creating live booking (attempt ${retryCount + 1}/${maxRetries})`)
        console.log('💾 BOOKING: Guest:', bookingData.guestName)
        console.log('💾 BOOKING: Property:', bookingData.villaName)
        console.log('💾 BOOKING: Dates:', bookingData.checkInDate, '→', bookingData.checkOutDate)

        // Generate duplicate check hash
        const duplicateHash = this.generateDuplicateHash(bookingData)

        // Check for existing booking with same hash
        const existingBooking = await this.findBookingByHash(duplicateHash)
        if (existingBooking) {
          console.log('⚠️ BOOKING: Duplicate booking detected, skipping creation')
          return {
            success: true,
            bookingId: existingBooking.id,
            isDuplicate: true
          }
        }

        // Add duplicate prevention data
        const bookingWithHash: LiveBooking = {
          ...bookingData,
          id: '', // Will be set by Firestore
          duplicateCheckHash: duplicateHash,
          isDuplicate: false
        }

        // Clean data to remove undefined values for Firebase compatibility
        const cleanedBookingData = this.cleanBookingData(bookingWithHash)
        console.log('🧹 BOOKING: Cleaned booking data for Firebase storage')

        // Store in Firebase with retry logic
        const docRef = await addDoc(collection(getDb(), 'live_bookings'), cleanedBookingData)
        const bookingId = docRef.id

        console.log('✅ BOOKING: Live booking created successfully')
        console.log('✅ BOOKING: ID:', bookingId)
        console.log('✅ BOOKING: Hash:', duplicateHash)

        return {
          success: true,
          bookingId,
          isDuplicate: false,
          retryCount
        }

      } catch (error) {
        retryCount++
        console.error(`❌ BOOKING: Creation attempt ${retryCount} failed:`, error)

        if (retryCount >= maxRetries) {
          console.error('❌ BOOKING: All retry attempts exhausted')
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount
          }
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000
        console.log(`⏳ BOOKING: Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    return {
      success: false,
      error: 'Maximum retries exceeded',
      retryCount
    }
  }

  /**
   * Generate a hash for duplicate detection
   */
  private static generateDuplicateHash(booking: Omit<LiveBooking, 'id'>): string {
    const hashData = {
      guestName: booking.guestName?.toLowerCase().trim(),
      villaName: booking.villaName?.toLowerCase().trim(),
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      price: booking.price
    }

    // Simple hash generation (in production, use a proper hash function)
    const hashString = JSON.stringify(hashData)
    let hash = 0
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * Find booking by duplicate hash
   */
  private static async findBookingByHash(hash: string): Promise<LiveBooking | null> {
    try {
      const hashQuery = query(
        collection(getDb(), 'live_bookings'),
        where('duplicateCheckHash', '==', hash)
      )

      const snapshot = await getDocs(hashQuery)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return {
          id: doc.id,
          ...doc.data()
        } as LiveBooking
      }

      return null
    } catch (error) {
      console.error('❌ BOOKING: Error checking for duplicates:', error)
      return null
    }
  }

  /**
   * Get all live bookings for a specific client
   */
  static async getBookingsByClientId(clientId: string): Promise<LiveBooking[]> {
    try {
      console.log('📋 Fetching live bookings for client:', clientId)

      // Use simple query without orderBy to avoid index requirement
      const bookingsQuery = query(
        collection(getDb(), 'live_bookings'),
        where('clientId', '==', clientId)
      )

      const snapshot = await getDocs(bookingsQuery)
      const bookings: LiveBooking[] = []

      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })

      // Sort in memory by receivedAt (most recent first)
      bookings.sort((a, b) => {
        const aTime = a.receivedAt?.toDate?.() || new Date(a.receivedAt)
        const bTime = b.receivedAt?.toDate?.() || new Date(b.receivedAt)
        return bTime.getTime() - aTime.getTime()
      })

      console.log(`✅ Found ${bookings.length} live bookings for client ${clientId}`)
      return bookings

    } catch (error) {
      console.error('❌ Error fetching client bookings:', error)
      return []
    }
  }
  
  /**
   * Get all pending bookings for admin approval
   */
  static async getPendingBookings(): Promise<LiveBooking[]> {
    try {
      console.log('📋 Fetching pending bookings for admin review')

      // Use simple query without orderBy to avoid index requirement
      const pendingQuery = query(
        collection(getDb(), 'live_bookings'),
        where('status', '==', 'pending_approval')
      )

      const snapshot = await getDocs(pendingQuery)
      const bookings: LiveBooking[] = []

      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })

      // Sort in memory by receivedAt (most recent first)
      bookings.sort((a, b) => {
        const aTime = a.receivedAt?.toDate?.() || new Date(a.receivedAt)
        const bTime = b.receivedAt?.toDate?.() || new Date(b.receivedAt)
        return bTime.getTime() - aTime.getTime()
      })

      console.log(`✅ Found ${bookings.length} pending bookings`)
      return bookings

    } catch (error) {
      console.error('❌ Error fetching pending bookings:', error)
      return []
    }
  }
  
  /**
   * Get all live bookings (for admin overview)
   */
  static async getAllBookings(): Promise<LiveBooking[]> {
    try {
      console.log('📋 Fetching all live bookings')

      // Use simple query without orderBy to avoid index requirement
      const allBookingsQuery = collection(getDb(), 'live_bookings')

      const snapshot = await getDocs(allBookingsQuery)
      const bookings: LiveBooking[] = []

      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })

      // Sort in memory by receivedAt (most recent first)
      bookings.sort((a, b) => {
        const aTime = a.receivedAt?.toDate?.() || new Date(a.receivedAt)
        const bTime = b.receivedAt?.toDate?.() || new Date(b.receivedAt)
        return bTime.getTime() - aTime.getTime()
      })

      console.log(`✅ Found ${bookings.length} total live bookings`)
      return bookings

    } catch (error) {
      console.error('❌ Error fetching all bookings:', error)
      return []
    }
  }
  
  /**
   * Update booking client matching information
   */
  static async updateBookingClientMatch(
    bookingId: string,
    clientMatch: {
      clientId: string
      propertyId?: string
      propertyName?: string
      confidence: number
      matchMethod: string
    }
  ): Promise<boolean> {
    try {
      console.log('🎯 BOOKING: Updating client match for booking:', bookingId)

      const bookingRef = doc(getDb(), 'live_bookings', bookingId)
      await updateDoc(bookingRef, {
        clientId: clientMatch.clientId,
        propertyId: clientMatch.propertyId || null,
        matchConfidence: clientMatch.confidence,
        matchMethod: clientMatch.matchMethod,
        matchedAt: Timestamp.now()
      })

      console.log('✅ BOOKING: Client match updated successfully')
      return true

    } catch (error) {
      console.error('❌ BOOKING: Error updating client match:', error)
      return false
    }
  }

  /**
   * Update booking status (approve/reject)
   * When approved, automatically triggers client profile matching
   */
  static async updateBookingStatus(
    bookingId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
  ): Promise<boolean> {
    try {
      console.log(`📝 Updating booking ${bookingId} status to ${status}`)

      // Validate bookingId
      if (!bookingId || typeof bookingId !== 'string' || bookingId.trim() === '') {
        console.error('❌ Invalid booking ID:', bookingId)
        throw new Error('Invalid booking ID provided')
      }

      console.log(`🔍 Creating document reference for booking: ${bookingId}`)
      const bookingRef = doc(getDb(), 'live_bookings', bookingId)
      
      // Update the booking status
      await updateDoc(bookingRef, {
        status,
        adminNotes: adminNotes || null,
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      console.log(`✅ Booking ${bookingId} status updated to ${status}`)

      // 🚀 NEW: Trigger client profile matching when booking is approved
      if (status === 'approved') {
        await this.triggerClientProfileMatching(bookingId)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      return false
    }
  }

  /**
   * 🚀 NEW: Trigger client profile matching for approved bookings
   */
  private static async triggerClientProfileMatching(bookingId: string): Promise<void> {
    try {
      console.log(`🎯 Starting client profile matching for booking: ${bookingId}`)
      
      // Get the booking details
      const bookingRef = doc(getDb(), 'live_bookings', bookingId)
      const bookingSnap = await getDoc(bookingRef)
      
      if (!bookingSnap.exists()) {
        console.error('❌ Booking not found:', bookingId)
        return
      }
      
      const booking = bookingSnap.data() as LiveBooking
      console.log(`🔍 Found booking for property: ${booking.villaName}`)
      
      // Attempt to match the property to a client profile
      const clientMatch = await ProfileBasedClientMatching.matchClientByPropertyName(booking.villaName)
      
      if (clientMatch) {
        console.log(`✅ Client match found! Property "${booking.villaName}" matches client: ${clientMatch.profileEmail}`)
        console.log(`📊 Match confidence: ${clientMatch.confidence}%`)
        console.log(`🔧 Match method: ${clientMatch.matchMethod}`)
        
        // Add the booking to the client's profile
        await this.addBookingToClientProfile(clientMatch.clientId, booking, bookingId)
        
        // Update the booking with client match info
        await updateDoc(bookingRef, {
          clientMatchId: clientMatch.clientId,
          clientMatchEmail: clientMatch.profileEmail,
          clientMatchConfidence: clientMatch.confidence,
          clientMatchMethod: clientMatch.matchMethod,
          clientMatchedAt: Timestamp.now()
        })
        
        console.log(`🎉 Booking successfully linked to client profile: ${clientMatch.profileEmail}`)
      } else {
        console.log(`⚠️ No client match found for property: ${booking.villaName}`)
        
        // Update booking to indicate no match was found
        await updateDoc(bookingRef, {
          clientMatchAttempted: true,
          clientMatchedAt: Timestamp.now(),
          clientMatchResult: 'no_match_found'
        })
      }
      
    } catch (error) {
      console.error('❌ Error in client profile matching:', error)
      
      // Update booking to indicate matching failed
      try {
        const bookingRef = doc(getDb(), 'live_bookings', bookingId)
        await updateDoc(bookingRef, {
          clientMatchAttempted: true,
          clientMatchedAt: Timestamp.now(),
          clientMatchResult: 'matching_failed',
          clientMatchError: error instanceof Error ? error.message : 'Unknown error'
        })
      } catch (updateError) {
        console.error('❌ Failed to update booking with match error:', updateError)
      }
    }
  }

  /**
   * 🚀 NEW: Add a booking to a client's profile
   */
  private static async addBookingToClientProfile(
    clientId: string, 
    booking: LiveBooking, 
    bookingId: string
  ): Promise<void> {
    try {
      console.log(`📝 Adding booking to client profile: ${clientId}`)
      
      // Create a client booking record
      const clientBookingData = {
        bookingId: bookingId,
        originalBookingId: booking.id || bookingId,
        villaName: booking.villaName,
        guestName: booking.guestName,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        price: booking.price,
        status: booking.status,
        source: 'automated_matching',
        propertyId: booking.propertyId,
        addedToProfileAt: Timestamp.now(),
        addedBy: 'automated_approval_system'
      }
      
      // Add to client_bookings collection
      const clientBookingsRef = collection(getDb(), 'client_bookings')
      await addDoc(clientBookingsRef, {
        ...clientBookingData,
        clientId: clientId,
        createdAt: Timestamp.now()
      })
      
      console.log(`✅ Booking successfully added to client profile`)
      
    } catch (error) {
      console.error('❌ Error adding booking to client profile:', error)
      throw error
    }
  }
  
  /**
   * Get booking statistics for dashboard
   */
  static async getBookingStats(clientId?: string): Promise<BookingStats> {
    try {
      console.log('📊 Calculating booking statistics', clientId ? `for client ${clientId}` : 'for all clients')
      
      let bookingsQuery
      if (clientId) {
        bookingsQuery = query(
          collection(getDb(), 'live_bookings'),
          where('clientId', '==', clientId)
        )
      } else {
        bookingsQuery = collection(getDb(), 'live_bookings')
      }
      
      const snapshot = await getDocs(bookingsQuery)
      const bookings: LiveBooking[] = []
      
      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })
      
      // Calculate statistics
      const totalBookings = bookings.length
      const pendingApproval = bookings.filter(b => b.status === 'pending_approval').length
      const approved = bookings.filter(b => b.status === 'approved').length
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.revenue || 0), 0)
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
      
      // Calculate occupancy rate (simplified - based on approved bookings)
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      const currentMonthBookings = bookings.filter(booking => {
        const checkIn = new Date(booking.checkInDate)
        return checkIn.getMonth() === currentMonth && 
               checkIn.getFullYear() === currentYear &&
               booking.status === 'approved'
      })
      
      // Simplified occupancy calculation (assumes 30 days per month)
      const totalBookingDays = currentMonthBookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.checkInDate)
        const checkOut = new Date(booking.checkOutDate)
        const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      
      const occupancyRate = (totalBookingDays / 30) * 100 // Simplified calculation
      
      const stats: BookingStats = {
        totalBookings,
        pendingApproval,
        approved,
        totalRevenue,
        averageBookingValue,
        occupancyRate: Math.min(occupancyRate, 100) // Cap at 100%
      }
      
      console.log('✅ Booking statistics calculated:', stats)
      return stats
      
    } catch (error) {
      console.error('❌ Error calculating booking statistics:', error)
      return {
        totalBookings: 0,
        pendingApproval: 0,
        approved: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
        occupancyRate: 0
      }
    }
  }
  
  /**
   * Get bookings for a specific date range
   */
  static async getBookingsByDateRange(
    startDate: string,
    endDate: string,
    clientId?: string
  ): Promise<LiveBooking[]> {
    try {
      console.log(`📅 Fetching bookings from ${startDate} to ${endDate}`)

      let bookingsQuery
      if (clientId) {
        // Use simple query without orderBy to avoid index requirement
        bookingsQuery = query(
          collection(getDb(), 'live_bookings'),
          where('clientId', '==', clientId)
        )
      } else {
        // Use simple collection query
        bookingsQuery = collection(getDb(), 'live_bookings')
      }

      const snapshot = await getDocs(bookingsQuery)
      const allBookings: LiveBooking[] = []

      snapshot.forEach(doc => {
        allBookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })

      // Filter by date range and sort in memory
      const filteredBookings = allBookings
        .filter(booking => {
          const checkIn = booking.checkInDate
          return checkIn >= startDate && checkIn <= endDate
        })
        .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))

      console.log(`✅ Found ${filteredBookings.length} bookings in date range`)
      return filteredBookings

    } catch (error) {
      console.error('❌ Error fetching bookings by date range:', error)
      return []
    }
  }
}
