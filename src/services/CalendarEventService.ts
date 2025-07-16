/**
 * Calendar Event Service
 * Automatically creates calendar events when bookings are approved
 */

import { db } from '@/lib/firebase'
import { collection, doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore'

interface BookingData {
  id: string
  propertyName?: string
  propertyId?: string
  checkIn?: string
  checkOut?: string
  guestName?: string
  guestEmail?: string
  assignedStaffId?: string
  assignedStaffName?: string
  bookingType?: string
  status?: string
  createdAt?: any
  approvedAt?: any
  [key: string]: any
}

interface CalendarEventData {
  id: string
  title: string
  propertyId: string | null
  staffId: string | null
  status: 'pending' | 'accepted' | 'completed'
  type: string
  startDate: string
  endDate: string
  color: string
  bookingId: string
  propertyName?: string
  assignedStaff?: string
  description?: string
  createdAt: any
}

class CalendarEventService {
  private readonly CALENDAR_EVENTS_COLLECTION = 'calendarEvents'
  private readonly BOOKINGS_COLLECTION = 'bookings'

  /**
   * Create calendar event from approved booking
   */
  async createEventFromBooking(bookingId: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      console.log(`📅 Creating calendar event for approved booking: ${bookingId}`)

      // Get booking data
      const bookingData = await this.getBookingData(bookingId)
      if (!bookingData) {
        return {
          success: false,
          error: 'Booking not found'
        }
      }

      // Generate calendar event data
      const eventData = this.generateEventFromBooking(bookingData)
      
      // Create calendar event in Firebase
      const eventId = `booking_${bookingId}_${Date.now()}`
      const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)
      
      await setDoc(eventRef, {
        ...eventData,
        id: eventId,
        createdAt: serverTimestamp()
      })

      console.log(`✅ Calendar event created successfully: ${eventId}`)
      console.log(`📋 Event details:`, eventData)

      return {
        success: true,
        eventId
      }

    } catch (error) {
      console.error('❌ Error creating calendar event from booking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get booking data from Firebase
   */
  private async getBookingData(bookingId: string): Promise<BookingData | null> {
    try {
      const bookingRef = doc(db, this.BOOKINGS_COLLECTION, bookingId)
      const bookingDoc = await getDoc(bookingRef)
      
      if (!bookingDoc.exists()) {
        console.warn(`⚠️ Booking not found: ${bookingId}`)
        return null
      }

      const data = bookingDoc.data()
      return {
        id: bookingId,
        ...data
      } as BookingData

    } catch (error) {
      console.error('❌ Error fetching booking data:', error)
      return null
    }
  }

  /**
   * Generate calendar event data from booking
   */
  private generateEventFromBooking(booking: BookingData): Omit<CalendarEventData, 'id' | 'createdAt'> {
    // Determine event type and color
    const eventType = this.determineEventType(booking)
    const eventColor = this.getEventColor(eventType)
    
    // Generate title
    const title = this.generateEventTitle(booking, eventType)
    
    // Calculate start and end dates
    const { startDate, endDate } = this.calculateEventDates(booking, eventType)
    
    // Generate description
    const description = this.generateEventDescription(booking, eventType)

    return {
      title,
      propertyId: booking.propertyId || null,
      staffId: booking.assignedStaffId || null,
      status: 'pending',
      type: eventType,
      startDate,
      endDate,
      color: eventColor,
      bookingId: booking.id,
      propertyName: booking.propertyName || 'Unknown Property',
      assignedStaff: booking.assignedStaffName || null,
      description
    }
  }

  /**
   * Determine event type from booking data
   */
  private determineEventType(booking: BookingData): string {
    // Check if booking has specific type
    if (booking.bookingType) {
      return booking.bookingType
    }

    // Check for cleaning keywords
    if (booking.guestName?.toLowerCase().includes('clean') || 
        booking.propertyName?.toLowerCase().includes('clean')) {
      return 'Cleaning'
    }

    // Check for maintenance keywords
    if (booking.guestName?.toLowerCase().includes('maintenance') || 
        booking.propertyName?.toLowerCase().includes('maintenance')) {
      return 'Maintenance'
    }

    // Default based on check-in/out dates
    if (booking.checkIn && booking.checkOut) {
      return 'Check-in/Check-out'
    }

    // Default type
    return 'Villa Service'
  }

  /**
   * Get color for event type
   */
  private getEventColor(eventType: string): string {
    const colorMap: Record<string, string> = {
      'Cleaning': '#4CAF50',        // Green
      'Check-in': '#2196F3',        // Blue
      'Check-out': '#FF9800',       // Orange
      'Check-in/Check-out': '#2196F3', // Blue
      'Maintenance': '#F44336',     // Red
      'Villa Service': '#9C27B0',   // Purple
      'Inspection': '#607D8B',      // Blue Grey
      'Setup': '#795548',           // Brown
      'default': '#3F51B5'          // Indigo
    }

    return colorMap[eventType] || colorMap['default']
  }

  /**
   * Generate event title
   */
  private generateEventTitle(booking: BookingData, eventType: string): string {
    const propertyName = booking.propertyName || 'Property'
    
    // Clean property name (remove common suffixes)
    const cleanPropertyName = propertyName
      .replace(/\s+(Villa|House|Apartment|Condo)$/i, '')
      .trim()

    return `${eventType} - ${cleanPropertyName}`
  }

  /**
   * Calculate event start and end dates
   */
  private calculateEventDates(booking: BookingData, eventType: string): { startDate: string; endDate: string } {
    const now = new Date()
    
    // If booking has check-in/out dates, use them
    if (booking.checkIn) {
      const checkInDate = new Date(booking.checkIn)
      
      // For cleaning, schedule 2 hours before check-in
      if (eventType === 'Cleaning') {
        const startDate = new Date(checkInDate.getTime() - (2 * 60 * 60 * 1000)) // 2 hours before
        const endDate = new Date(startDate.getTime() + (3 * 60 * 60 * 1000)) // 3 hours duration
        
        return {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
      
      // For check-in, use the check-in time
      if (eventType === 'Check-in' || eventType === 'Check-in/Check-out') {
        const endDate = new Date(checkInDate.getTime() + (1 * 60 * 60 * 1000)) // 1 hour duration
        
        return {
          startDate: checkInDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    }

    if (booking.checkOut) {
      const checkOutDate = new Date(booking.checkOut)
      
      // For check-out, use the check-out time
      if (eventType === 'Check-out') {
        const endDate = new Date(checkOutDate.getTime() + (1 * 60 * 60 * 1000)) // 1 hour duration
        
        return {
          startDate: checkOutDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    }

    // Default: schedule for tomorrow morning
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // 9 AM

    const startDate = tomorrow
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // 2 hours duration

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  /**
   * Generate event description
   */
  private generateEventDescription(booking: BookingData, eventType: string): string {
    const parts: string[] = []
    
    parts.push(`${eventType} service for ${booking.propertyName || 'property'}`)
    
    if (booking.guestName) {
      parts.push(`Guest: ${booking.guestName}`)
    }
    
    if (booking.checkIn) {
      parts.push(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`)
    }
    
    if (booking.checkOut) {
      parts.push(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`)
    }
    
    if (booking.assignedStaffName) {
      parts.push(`Assigned to: ${booking.assignedStaffName}`)
    } else {
      parts.push('Staff assignment pending')
    }
    
    parts.push(`Booking ID: ${booking.id}`)
    
    return parts.join(' • ')
  }

  /**
   * Update calendar event when booking is updated
   */
  async updateEventFromBooking(bookingId: string, updates: Partial<BookingData>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📅 Updating calendar event for booking: ${bookingId}`)

      // Find existing calendar event for this booking
      // Note: In a real implementation, you would query for events with bookingId
      // For now, this is a placeholder for the update logic

      console.log('⚠️ Calendar event update not fully implemented - would need to query existing events')

      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Error updating calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update calendar event times (for drag-and-drop rescheduling)
   */
  async updateEventTimes(
    eventId: string,
    newStartDate: string,
    newEndDate: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📅 Updating event times for ${eventId}: ${newStartDate} to ${newEndDate}`)

      const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)

      await updateDoc(eventRef, {
        startDate: newStartDate,
        endDate: newEndDate,
        updatedAt: serverTimestamp()
      })

      console.log(`✅ Event times updated successfully`)

      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Error updating event times:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update calendar event staff assignment
   */
  async updateEventStaff(
    eventId: string,
    staffId: string | null,
    staffName: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`👤 Updating event staff for ${eventId}: ${staffName} (${staffId})`)

      const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)

      await updateDoc(eventRef, {
        staffId,
        assignedStaff: staffName,
        status: staffId ? 'pending' : 'unassigned',
        updatedAt: serverTimestamp()
      })

      console.log(`✅ Event staff updated successfully`)

      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Error updating event staff:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete calendar event when booking is cancelled/rejected
   */
  async deleteEventForBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Deleting calendar event for booking: ${bookingId}`)

      // Find and delete existing calendar event for this booking
      // Note: In a real implementation, you would query for events with bookingId
      // For now, this is a placeholder for the delete logic
      
      console.log('⚠️ Calendar event deletion not fully implemented - would need to query and delete existing events')
      
      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Error deleting calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get calendar event schema for reference
   */
  getEventSchema(): CalendarEventData {
    return {
      id: 'string - Unique event identifier',
      title: 'string - Event title (e.g., "Cleaning - Sunset Paradise")',
      propertyId: 'string | null - Property identifier',
      staffId: 'string | null - Assigned staff ID',
      status: 'pending | accepted | completed - Event status',
      type: 'string - Event type (Cleaning, Check-in, etc.)',
      startDate: 'string - ISO 8601 start datetime',
      endDate: 'string - ISO 8601 end datetime',
      color: 'string - Hex color code for display',
      bookingId: 'string - Related booking identifier',
      propertyName: 'string - Property name for display',
      assignedStaff: 'string | null - Staff name for display',
      description: 'string - Event description with details',
      createdAt: 'Timestamp - Firebase server timestamp'
    } as any
  }
}

// Export singleton instance
export default new CalendarEventService()
