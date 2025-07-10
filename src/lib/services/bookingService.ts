import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

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
  status: 'pending_approval' | 'approved' | 'rejected' | 'completed'
  receivedAt: any // Firestore Timestamp
  processedAt: any // Firestore Timestamp
  
  // Financial data
  revenue: number
  currency: string
  
  // Additional fields
  guestEmail?: string
  bookingReference?: string
  guests?: number
  
  // Original payload for reference
  originalPayload?: any
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
   * Get all live bookings for a specific client
   */
  static async getBookingsByClientId(clientId: string): Promise<LiveBooking[]> {
    try {
      console.log('📋 Fetching live bookings for client:', clientId)
      
      const bookingsQuery = query(
        collection(db, 'live_bookings'),
        where('clientId', '==', clientId),
        orderBy('receivedAt', 'desc')
      )
      
      const snapshot = await getDocs(bookingsQuery)
      const bookings: LiveBooking[] = []
      
      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
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
      
      const pendingQuery = query(
        collection(db, 'live_bookings'),
        where('status', '==', 'pending_approval'),
        orderBy('receivedAt', 'desc')
      )
      
      const snapshot = await getDocs(pendingQuery)
      const bookings: LiveBooking[] = []
      
      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
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
      
      const allBookingsQuery = query(
        collection(db, 'live_bookings'),
        orderBy('receivedAt', 'desc')
      )
      
      const snapshot = await getDocs(allBookingsQuery)
      const bookings: LiveBooking[] = []
      
      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })
      
      console.log(`✅ Found ${bookings.length} total live bookings`)
      return bookings
      
    } catch (error) {
      console.error('❌ Error fetching all bookings:', error)
      return []
    }
  }
  
  /**
   * Update booking status (approve/reject)
   */
  static async updateBookingStatus(
    bookingId: string, 
    status: 'approved' | 'rejected',
    adminNotes?: string
  ): Promise<boolean> {
    try {
      console.log(`📝 Updating booking ${bookingId} status to ${status}`)
      
      const bookingRef = doc(db, 'live_bookings', bookingId)
      await updateDoc(bookingRef, {
        status,
        adminNotes: adminNotes || null,
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      console.log(`✅ Booking ${bookingId} status updated to ${status}`)
      return true
      
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      return false
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
          collection(db, 'live_bookings'),
          where('clientId', '==', clientId)
        )
      } else {
        bookingsQuery = collection(db, 'live_bookings')
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
        bookingsQuery = query(
          collection(db, 'live_bookings'),
          where('clientId', '==', clientId),
          orderBy('checkInDate', 'asc')
        )
      } else {
        bookingsQuery = query(
          collection(db, 'live_bookings'),
          orderBy('checkInDate', 'asc')
        )
      }
      
      const snapshot = await getDocs(bookingsQuery)
      const allBookings: LiveBooking[] = []
      
      snapshot.forEach(doc => {
        allBookings.push({
          id: doc.id,
          ...doc.data()
        } as LiveBooking)
      })
      
      // Filter by date range
      const filteredBookings = allBookings.filter(booking => {
        const checkIn = booking.checkInDate
        return checkIn >= startDate && checkIn <= endDate
      })
      
      console.log(`✅ Found ${filteredBookings.length} bookings in date range`)
      return filteredBookings
      
    } catch (error) {
      console.error('❌ Error fetching bookings by date range:', error)
      return []
    }
  }
}
