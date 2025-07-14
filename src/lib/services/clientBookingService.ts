import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface ClientBooking {
  id: string
  originalBookingId?: string
  assignedPropertyId?: string
  assignedPropertyName?: string
  property?: string
  villaName?: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  price: number
  status: 'pending' | 'confirmed' | 'assigned' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled'
  matchConfidence?: number
  matchMethod?: string
  matchDetails?: string
  assignedAt?: any
  createdAt?: any
  updatedAt?: any
}

export interface ClientBookingStats {
  total: number
  upcoming: number
  active: number
  completed: number
  revenue: number
  occupancyRate: number
}

/**
 * Service for managing client bookings from user subcollections
 */
export class ClientBookingService {
  
  /**
   * Get all bookings for a specific user from their subcollection
   */
  static async getUserBookings(userId: string): Promise<ClientBooking[]> {
    try {
      console.log('📋 CLIENT: Loading user bookings from subcollection')
      console.log('👤 CLIENT: User ID:', userId)
      
      const bookingsRef = collection(getDb(), 'users', userId, 'bookings')
      const bookingsQuery = query(
        bookingsRef,
        orderBy('checkInDate', 'desc'),
        limit(50)
      )
      
      const snapshot = await getDocs(bookingsQuery)
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClientBooking[]
      
      console.log(`✅ CLIENT: Loaded ${bookings.length} user bookings`)
      return bookings
      
    } catch (error) {
      console.error('❌ CLIENT: Error loading user bookings:', error)
      return []
    }
  }
  
  /**
   * Get upcoming bookings for a user
   */
  static async getUpcomingBookings(userId: string): Promise<ClientBooking[]> {
    try {
      const allBookings = await this.getUserBookings(userId)
      const now = new Date()
      
      const upcoming = allBookings.filter(booking => {
        const checkInDate = new Date(booking.checkInDate)
        return checkInDate > now
      }).sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime())
      
      console.log(`📅 CLIENT: Found ${upcoming.length} upcoming bookings`)
      return upcoming
      
    } catch (error) {
      console.error('❌ CLIENT: Error loading upcoming bookings:', error)
      return []
    }
  }
  
  /**
   * Get active bookings (currently checked in)
   */
  static async getActiveBookings(userId: string): Promise<ClientBooking[]> {
    try {
      const allBookings = await this.getUserBookings(userId)
      const now = new Date()
      
      const active = allBookings.filter(booking => {
        const checkInDate = new Date(booking.checkInDate)
        const checkOutDate = new Date(booking.checkOutDate)
        return checkInDate <= now && checkOutDate > now
      })
      
      console.log(`🏠 CLIENT: Found ${active.length} active bookings`)
      return active
      
    } catch (error) {
      console.error('❌ CLIENT: Error loading active bookings:', error)
      return []
    }
  }
  
  /**
   * Get booking statistics for dashboard
   */
  static async getBookingStats(userId: string): Promise<ClientBookingStats> {
    try {
      console.log('📊 CLIENT: Calculating booking statistics')
      
      const allBookings = await this.getUserBookings(userId)
      const now = new Date()
      
      const upcoming = allBookings.filter(booking => {
        const checkInDate = new Date(booking.checkInDate)
        return checkInDate > now
      })
      
      const active = allBookings.filter(booking => {
        const checkInDate = new Date(booking.checkInDate)
        const checkOutDate = new Date(booking.checkOutDate)
        return checkInDate <= now && checkOutDate > now
      })
      
      const completed = allBookings.filter(booking => {
        const checkOutDate = new Date(booking.checkOutDate)
        return checkOutDate <= now || booking.status === 'completed'
      })
      
      const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.price || 0), 0)
      
      // Calculate occupancy rate (simplified)
      const totalNights = allBookings.reduce((sum, booking) => sum + (booking.nights || 0), 0)
      const daysInYear = 365
      const occupancyRate = totalNights > 0 ? (totalNights / daysInYear) * 100 : 0
      
      const stats: ClientBookingStats = {
        total: allBookings.length,
        upcoming: upcoming.length,
        active: active.length,
        completed: completed.length,
        revenue: totalRevenue,
        occupancyRate: Math.min(occupancyRate, 100) // Cap at 100%
      }
      
      console.log('✅ CLIENT: Booking statistics calculated:', stats)
      return stats
      
    } catch (error) {
      console.error('❌ CLIENT: Error calculating booking statistics:', error)
      return {
        total: 0,
        upcoming: 0,
        active: 0,
        completed: 0,
        revenue: 0,
        occupancyRate: 0
      }
    }
  }
  
  /**
   * Get bookings timeline for calendar view
   */
  static async getBookingsTimeline(userId: string, startDate?: Date, endDate?: Date): Promise<ClientBooking[]> {
    try {
      console.log('📅 CLIENT: Loading bookings timeline')
      
      const allBookings = await this.getUserBookings(userId)
      
      let filteredBookings = allBookings
      
      if (startDate && endDate) {
        filteredBookings = allBookings.filter(booking => {
          const checkInDate = new Date(booking.checkInDate)
          const checkOutDate = new Date(booking.checkOutDate)
          
          // Booking overlaps with the date range
          return (checkInDate <= endDate && checkOutDate >= startDate)
        })
      }
      
      // Sort by check-in date
      filteredBookings.sort((a, b) => 
        new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
      )
      
      console.log(`📅 CLIENT: Timeline contains ${filteredBookings.length} bookings`)
      return filteredBookings
      
    } catch (error) {
      console.error('❌ CLIENT: Error loading bookings timeline:', error)
      return []
    }
  }
  
  /**
   * Search bookings by guest name or property
   */
  static async searchBookings(userId: string, searchTerm: string): Promise<ClientBooking[]> {
    try {
      console.log('🔍 CLIENT: Searching bookings:', searchTerm)
      
      const allBookings = await this.getUserBookings(userId)
      const term = searchTerm.toLowerCase()
      
      const filtered = allBookings.filter(booking =>
        booking.guestName?.toLowerCase().includes(term) ||
        booking.guestEmail?.toLowerCase().includes(term) ||
        booking.assignedPropertyName?.toLowerCase().includes(term) ||
        booking.property?.toLowerCase().includes(term) ||
        booking.villaName?.toLowerCase().includes(term)
      )
      
      console.log(`🔍 CLIENT: Found ${filtered.length} matching bookings`)
      return filtered
      
    } catch (error) {
      console.error('❌ CLIENT: Error searching bookings:', error)
      return []
    }
  }
}
