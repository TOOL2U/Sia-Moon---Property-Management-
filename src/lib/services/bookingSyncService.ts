import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BookingService, LiveBooking } from './bookingService'
import { enhancedClientMatching } from '@/lib/clientMatching'

// Helper function to ensure db is available
function getDb() {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

export interface ClientBooking {
  id?: string
  propertyName: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  price: number
  status: 'confirmed' | 'completed' | 'cancelled'
  bookingSource: string
  bookingReference?: string
  specialRequests?: string
  createdAt: any
  updatedAt: any
  
  // Link back to admin booking
  adminBookingId: string
  syncedAt: any
}

export class BookingSyncService {
  
  /**
   * Complete workflow: Match client and sync booking when approved
   */
  static async processApprovedBooking(bookingId: string): Promise<{
    success: boolean
    clientMatched: boolean
    bookingSynced: boolean
    clientId?: string
    clientBookingId?: string
    error?: string
  }> {
    try {
      console.log('🚀 BOOKING SYNC: Starting complete workflow for booking:', bookingId)
      
      // Step 1: Get the approved booking
      const allBookings = await BookingService.getAllBookings()
      const booking = allBookings.find(b => b.id === bookingId)
      
      if (!booking) {
        console.error('❌ BOOKING SYNC: Booking not found:', bookingId)
        return { success: false, clientMatched: false, bookingSynced: false, error: 'Booking not found' }
      }
      
      console.log('📋 BOOKING SYNC: Found booking for:', booking.guestName, 'at', booking.villaName)
      
      // Step 2: Attempt client matching
      console.log('🔍 BOOKING SYNC: Attempting client matching...')
      const clientMatch = await enhancedClientMatching(
        booking.villaName,
        booking.guestEmail,
        booking.propertyId
      )
      
      if (!clientMatch) {
        console.log('⚠️ BOOKING SYNC: No client match found - booking approved but not synced')
        return { 
          success: true, 
          clientMatched: false, 
          bookingSynced: false,
          error: 'No matching client profile found'
        }
      }
      
      console.log('✅ BOOKING SYNC: Client match found!')
      console.log('✅ BOOKING SYNC: Client ID:', clientMatch.clientId)
      console.log('✅ BOOKING SYNC: Property:', clientMatch.propertyName)
      console.log('✅ BOOKING SYNC: Confidence:', (clientMatch.confidence * 100).toFixed(1) + '%')
      
      // Step 3: Update the admin booking with client match info
      const matchUpdateSuccess = await BookingService.updateBookingClientMatch(bookingId, {
        clientId: clientMatch.clientId,
        propertyId: clientMatch.propertyId,
        propertyName: clientMatch.propertyName,
        confidence: clientMatch.confidence,
        matchMethod: clientMatch.matchMethod
      })
      
      if (!matchUpdateSuccess) {
        console.error('❌ BOOKING SYNC: Failed to update admin booking with client match')
        return { 
          success: false, 
          clientMatched: true, 
          bookingSynced: false,
          clientId: clientMatch.clientId,
          error: 'Failed to update admin booking'
        }
      }
      
      // Step 4: Create booking in client's profile
      console.log('📝 BOOKING SYNC: Creating booking in client profile...')
      const clientBookingId = await this.createClientBooking(booking, clientMatch.clientId)
      
      if (!clientBookingId) {
        console.error('❌ BOOKING SYNC: Failed to create client booking')
        return { 
          success: false, 
          clientMatched: true, 
          bookingSynced: false,
          clientId: clientMatch.clientId,
          error: 'Failed to create client booking'
        }
      }
      
      console.log('🎉 BOOKING SYNC: Complete workflow successful!')
      console.log('🎉 BOOKING SYNC: Admin booking ID:', bookingId)
      console.log('🎉 BOOKING SYNC: Client ID:', clientMatch.clientId)
      console.log('🎉 BOOKING SYNC: Client booking ID:', clientBookingId)
      
      return {
        success: true,
        clientMatched: true,
        bookingSynced: true,
        clientId: clientMatch.clientId,
        clientBookingId
      }
      
    } catch (error) {
      console.error('❌ BOOKING SYNC: Error in complete workflow:', error)
      return { 
        success: false, 
        clientMatched: false, 
        bookingSynced: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Create a booking entry in the client's profile
   */
  static async createClientBooking(
    adminBooking: LiveBooking, 
    clientId: string
  ): Promise<string | null> {
    try {
      console.log('📝 BOOKING SYNC: Creating client booking for client:', clientId)
      
      // Create client booking object
      const clientBooking: ClientBooking = {
        propertyName: adminBooking.villaName,
        guestName: adminBooking.guestName,
        guestEmail: adminBooking.guestEmail || '',
        checkInDate: adminBooking.checkInDate,
        checkOutDate: adminBooking.checkOutDate,
        nights: this.calculateNights(adminBooking.checkInDate, adminBooking.checkOutDate),
        guests: adminBooking.guests || 2,
        price: adminBooking.price || adminBooking.revenue || 0,
        status: 'confirmed',
        bookingSource: adminBooking.bookingSource || 'booking_platform',
        bookingReference: adminBooking.bookingReference,
        specialRequests: adminBooking.specialRequests,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        adminBookingId: adminBooking.id,
        syncedAt: Timestamp.now()
      }
      
      console.log('📝 BOOKING SYNC: Client booking data prepared')
      console.log('📝 BOOKING SYNC: Property:', clientBooking.propertyName)
      console.log('📝 BOOKING SYNC: Guest:', clientBooking.guestName)
      console.log('📝 BOOKING SYNC: Dates:', clientBooking.checkInDate, '→', clientBooking.checkOutDate)
      
      // Store in client's bookings subcollection
      const clientBookingsRef = collection(getDb(), 'profiles', clientId, 'bookings')
      const docRef = await addDoc(clientBookingsRef, clientBooking)
      
      console.log('✅ BOOKING SYNC: Client booking created successfully')
      console.log('✅ BOOKING SYNC: Client booking ID:', docRef.id)
      
      return docRef.id
      
    } catch (error) {
      console.error('❌ BOOKING SYNC: Error creating client booking:', error)
      return null
    }
  }
  
  /**
   * Calculate number of nights between dates
   */
  static calculateNights(checkIn: string, checkOut: string): number {
    try {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime()
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24))
      return Math.max(1, nights) // Ensure at least 1 night
    } catch (error) {
      console.error('❌ BOOKING SYNC: Error calculating nights:', error)
      return 1
    }
  }
  
  /**
   * Verify client profile exists
   */
  static async verifyClientProfile(clientId: string): Promise<boolean> {
    try {
      const profileRef = doc(getDb(), 'profiles', clientId)
      const profileDoc = await getDoc(profileRef)
      return profileDoc.exists()
    } catch (error) {
      console.error('❌ BOOKING SYNC: Error verifying client profile:', error)
      return false
    }
  }
  
  /**
   * Get client bookings for verification
   */
  static async getClientBookings(clientId: string): Promise<ClientBooking[]> {
    try {
      const { getDocs } = await import('firebase/firestore')
      const clientBookingsRef = collection(getDb(), 'profiles', clientId, 'bookings')
      const snapshot = await getDocs(clientBookingsRef)
      
      const bookings: ClientBooking[] = []
      snapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        } as ClientBooking)
      })
      
      return bookings
    } catch (error) {
      console.error('❌ BOOKING SYNC: Error getting client bookings:', error)
      return []
    }
  }
}
