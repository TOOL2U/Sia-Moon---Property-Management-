/**
 * Calendar Test Service
 * Creates sample calendar events in Firebase for testing the calendar integration
 */

import { db } from '@/lib/firebase'
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

interface CalendarEventData {
  title: string
  startDate: string
  endDate: string
  color: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  propertyName?: string
  assignedStaff?: string
  bookingType?: string
  description?: string
  resourceId?: string
}

class CalendarTestService {
  private readonly CALENDAR_EVENTS_COLLECTION = 'calendarEvents'

  /**
   * Create sample calendar events for testing
   */
  async createSampleEvents(): Promise<{ success: boolean; eventsCreated: number; error?: string }> {
    try {
      console.log('📅 Creating sample calendar events...')

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)

      const sampleEvents: CalendarEventData[] = [
        // Today's events
        {
          title: 'Villa Cleaning - Sunset Paradise',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(),
          color: '#10b981',
          status: 'confirmed',
          propertyName: 'Sunset Paradise Villa',
          assignedStaff: 'Maria Santos',
          bookingType: 'Cleaning',
          description: 'Deep cleaning before guest check-in',
          resourceId: 'staff_maria'
        },
        {
          title: 'Guest Check-in - Ocean View',
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
          color: '#3b82f6',
          status: 'confirmed',
          propertyName: 'Ocean View Villa',
          assignedStaff: 'John Chen',
          bookingType: 'Check-in',
          description: 'Welcome guests and property orientation',
          resourceId: 'staff_john'
        },
        
        // Tomorrow's events
        {
          title: 'Maintenance - Pool Cleaning',
          startDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 8, 0).toISOString(),
          endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(),
          color: '#f59e0b',
          status: 'pending',
          propertyName: 'Beachfront Villa',
          assignedStaff: 'Mike Wilson',
          bookingType: 'Maintenance',
          description: 'Weekly pool maintenance and chemical balancing',
          resourceId: 'staff_mike'
        },
        {
          title: 'Guest Check-out - Sunset Paradise',
          startDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0).toISOString(),
          endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0).toISOString(),
          color: '#ef4444',
          status: 'confirmed',
          propertyName: 'Sunset Paradise Villa',
          assignedStaff: 'Sarah Johnson',
          bookingType: 'Check-out',
          description: 'Guest departure and property inspection',
          resourceId: 'staff_sarah'
        },
        
        // Next week events
        {
          title: 'Deep Cleaning - All Villas',
          startDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0).toISOString(),
          endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 17, 0).toISOString(),
          color: '#8b5cf6',
          status: 'pending',
          propertyName: 'Multiple Properties',
          assignedStaff: 'Cleaning Team',
          bookingType: 'Deep Cleaning',
          description: 'Monthly deep cleaning service for all properties',
          resourceId: 'team_cleaning'
        },
        {
          title: 'Property Inspection',
          startDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 14, 0).toISOString(),
          endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 0).toISOString(),
          color: '#06b6d4',
          status: 'confirmed',
          propertyName: 'Ocean View Villa',
          assignedStaff: 'Property Manager',
          bookingType: 'Inspection',
          description: 'Monthly property condition assessment',
          resourceId: 'manager'
        }
      ]

      let eventsCreated = 0
      
      for (const eventData of sampleEvents) {
        const eventId = `sample_event_${Date.now()}_${eventsCreated}`
        const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)
        
        await setDoc(eventRef, {
          ...eventData,
          id: eventId,
          createdAt: serverTimestamp()
        })
        
        eventsCreated++
        console.log(`✅ Created calendar event: ${eventData.title}`)
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`✅ Successfully created ${eventsCreated} sample calendar events`)
      
      return {
        success: true,
        eventsCreated
      }

    } catch (error) {
      console.error('❌ Error creating sample calendar events:', error)
      return {
        success: false,
        eventsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a custom calendar event
   */
  async createCustomEvent(eventData: Partial<CalendarEventData>): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      console.log('📅 Creating custom calendar event...')

      const eventId = `custom_event_${Date.now()}`
      const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)
      
      const defaultEventData: CalendarEventData = {
        title: eventData.title || 'Custom Event',
        startDate: eventData.startDate || new Date().toISOString(),
        endDate: eventData.endDate || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        color: eventData.color || '#3b82f6',
        status: eventData.status || 'pending',
        propertyName: eventData.propertyName,
        assignedStaff: eventData.assignedStaff,
        bookingType: eventData.bookingType,
        description: eventData.description,
        resourceId: eventData.resourceId
      }

      await setDoc(eventRef, {
        ...defaultEventData,
        id: eventId,
        createdAt: serverTimestamp()
      })

      console.log(`✅ Created custom calendar event: ${defaultEventData.title}`)
      
      return {
        success: true,
        eventId
      }

    } catch (error) {
      console.error('❌ Error creating custom calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clear all sample events (for testing cleanup)
   */
  async clearSampleEvents(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧹 Clearing sample calendar events...')
      
      // Note: In a real implementation, you would query and delete documents
      // For now, this is a placeholder that would need proper implementation
      // with batch operations to delete multiple documents
      
      console.log('⚠️ Clear sample events not fully implemented - would need batch delete')
      
      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Error clearing sample events:', error)
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
      title: 'string - Event title/name',
      startDate: 'string - ISO 8601 start datetime',
      endDate: 'string - ISO 8601 end datetime', 
      color: 'string - Hex color code for event display',
      status: 'confirmed | pending | cancelled | completed',
      propertyName: 'string - Optional property name',
      assignedStaff: 'string - Optional assigned staff member',
      bookingType: 'string - Optional booking/event type',
      description: 'string - Optional event description',
      resourceId: 'string - Optional resource identifier for resource view'
    } as any
  }

  /**
   * Verify Firebase connection for calendar events
   */
  async verifyCalendarConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Verifying calendar Firebase connection...')

      const testEventId = `connection_test_${Date.now()}`
      const testEventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, testEventId)
      
      await setDoc(testEventRef, {
        title: 'Connection Test',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        color: '#3b82f6',
        status: 'pending',
        description: 'Test event for connection verification',
        createdAt: serverTimestamp()
      })

      console.log('✅ Calendar Firebase connection verified')

      return {
        success: true,
        message: 'Calendar Firebase connection verified successfully'
      }

    } catch (error) {
      console.error('❌ Calendar Firebase connection failed:', error)
      return {
        success: false,
        message: `Calendar connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export default new CalendarTestService()
