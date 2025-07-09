import ical from 'ical'
import axios from 'axios'
import { Booking } from '@/lib/db'

/**
 * Interface for parsed iCal booking data
 */
export interface ParsedBooking {
  external_id: string
  guest_name: string
  guest_email?: string
  check_in: string
  check_out: string
  status: 'confirmed' | 'pending' | 'cancelled'
  platform: 'airbnb' | 'booking_com' | 'other'
  summary: string
  description?: string
}

/**
 * Interface for iCal sync result
 */
export interface ICalSyncResult {
  success: boolean
  bookings: ParsedBooking[]
  error?: string
  totalEvents: number
  validBookings: number
}

/**
 * iCal Parser Service
 * 
 * Handles parsing iCal feeds from Airbnb, Booking.com, and other platforms
 * to extract booking information and convert it to our booking format.
 */
export class ICalParser {
  private static readonly TIMEOUT_MS = 30000 // 30 seconds
  private static readonly MAX_RETRIES = 3

  /**
   * Fetch and parse iCal data from a URL
   */
  static async parseICalFromUrl(
    icalUrl: string, 
    platform: 'airbnb' | 'booking_com' | 'other' = 'other'
  ): Promise<ICalSyncResult> {
    try {
      console.log(`🔄 Fetching iCal data from: ${icalUrl}`)
      
      // Fetch iCal data with timeout and retries
      const icalData = await this.fetchWithRetry(icalUrl)
      
      // Parse the iCal data
      return this.parseICalData(icalData, platform)
      
    } catch (error) {
      console.error('❌ Error parsing iCal from URL:', error)
      return {
        success: false,
        bookings: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        totalEvents: 0,
        validBookings: 0
      }
    }
  }

  /**
   * Parse raw iCal data string
   */
  static parseICalData(icalData: string, platform: 'airbnb' | 'booking_com' | 'other'): ICalSyncResult {
    try {
      console.log('📅 Parsing iCal data...')
      
      // Parse the iCal data
      const parsedData = ical.parseICS(icalData)
      const events = Object.values(parsedData)
      
      console.log(`📊 Found ${events.length} events in iCal data`)
      
      const bookings: ParsedBooking[] = []
      let validBookings = 0

      for (const event of events) {
        if (event.type === 'VEVENT' && event.start && event.end) {
          try {
            const booking = this.parseEvent(event, platform)
            if (booking) {
              bookings.push(booking)
              validBookings++
            }
          } catch (eventError) {
            console.warn('⚠️ Error parsing event:', eventError)
            // Continue processing other events
          }
        }
      }

      console.log(`✅ Successfully parsed ${validBookings} valid bookings`)

      return {
        success: true,
        bookings,
        totalEvents: events.length,
        validBookings
      }

    } catch (error) {
      console.error('❌ Error parsing iCal data:', error)
      return {
        success: false,
        bookings: [],
        error: error instanceof Error ? error.message : 'Failed to parse iCal data',
        totalEvents: 0,
        validBookings: 0
      }
    }
  }

  /**
   * Parse individual iCal event to booking
   */
  private static parseEvent(event: any, platform: 'airbnb' | 'booking_com' | 'other'): ParsedBooking | null {
    try {
      // Extract basic event data
      const summary = event.summary || 'Booking'
      const description = event.description || ''
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('⚠️ Invalid dates in event:', { start: event.start, end: event.end })
        return null
      }

      // Skip past events (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      if (endDate < thirtyDaysAgo) {
        return null
      }

      // Extract guest information based on platform
      const guestInfo = this.extractGuestInfo(summary, description, platform)
      
      // Generate external ID from event UID or create one
      const external_id = event.uid || `${platform}_${startDate.getTime()}_${endDate.getTime()}`

      // Determine booking status
      const status = this.determineBookingStatus(event, summary, description)

      return {
        external_id,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        check_in: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        check_out: endDate.toISOString().split('T')[0],
        status,
        platform,
        summary,
        description
      }

    } catch (error) {
      console.warn('⚠️ Error parsing individual event:', error)
      return null
    }
  }

  /**
   * Extract guest information from event data
   */
  private static extractGuestInfo(
    summary: string, 
    description: string, 
    platform: 'airbnb' | 'booking_com' | 'other'
  ): { name: string; email?: string } {
    const text = `${summary} ${description}`.toLowerCase()

    // Platform-specific parsing
    switch (platform) {
      case 'airbnb':
        return this.parseAirbnbGuestInfo(summary, description)
      case 'booking_com':
        return this.parseBookingComGuestInfo(summary, description)
      default:
        return this.parseGenericGuestInfo(summary, description)
    }
  }

  /**
   * Parse Airbnb-specific guest information
   */
  private static parseAirbnbGuestInfo(summary: string, description: string): { name: string; email?: string } {
    // Airbnb typically formats as "Guest Name (Airbnb)" or "Reserved - Guest Name"
    let guestName = 'Airbnb Guest'
    
    // Try to extract name from summary
    const airbnbPatterns = [
      /^(.+?)\s*\(airbnb\)/i,
      /reserved\s*-\s*(.+)/i,
      /^(.+?)\s*airbnb/i
    ]

    for (const pattern of airbnbPatterns) {
      const match = summary.match(pattern)
      if (match && match[1]) {
        guestName = match[1].trim()
        break
      }
    }

    // Try to extract email from description
    const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    const email = emailMatch ? emailMatch[1] : undefined

    return { name: guestName, email }
  }

  /**
   * Parse Booking.com-specific guest information
   */
  private static parseBookingComGuestInfo(summary: string, description: string): { name: string; email?: string } {
    // Booking.com typically formats as "Guest Name - Booking.com" or "BDC: Guest Name"
    let guestName = 'Booking.com Guest'
    
    const bookingComPatterns = [
      /^(.+?)\s*-\s*booking\.com/i,
      /bdc:\s*(.+)/i,
      /^(.+?)\s*booking\.com/i
    ]

    for (const pattern of bookingComPatterns) {
      const match = summary.match(pattern)
      if (match && match[1]) {
        guestName = match[1].trim()
        break
      }
    }

    // Try to extract email from description
    const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    const email = emailMatch ? emailMatch[1] : undefined

    return { name: guestName, email }
  }

  /**
   * Parse generic guest information
   */
  private static parseGenericGuestInfo(summary: string, description: string): { name: string; email?: string } {
    // For generic platforms, use the summary as guest name
    let guestName = summary.trim() || 'Guest'
    
    // Remove common booking-related words
    guestName = guestName.replace(/\b(booking|reservation|reserved|confirmed|pending)\b/gi, '').trim()
    
    if (!guestName) {
      guestName = 'Guest'
    }

    // Try to extract email from description
    const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    const email = emailMatch ? emailMatch[1] : undefined

    return { name: guestName, email }
  }

  /**
   * Determine booking status from event data
   */
  private static determineBookingStatus(
    event: any, 
    summary: string, 
    description: string
  ): 'confirmed' | 'pending' | 'cancelled' {
    const text = `${summary} ${description}`.toLowerCase()

    // Check for cancelled status
    if (text.includes('cancelled') || text.includes('canceled') || event.status === 'CANCELLED') {
      return 'cancelled'
    }

    // Check for pending status
    if (text.includes('pending') || text.includes('tentative') || event.status === 'TENTATIVE') {
      return 'pending'
    }

    // Default to confirmed
    return 'confirmed'
  }

  /**
   * Fetch iCal data with retry logic
   */
  private static async fetchWithRetry(url: string, retries = this.MAX_RETRIES): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Fetching iCal data (attempt ${attempt}/${retries})`)
        
        const response = await axios.get(url, {
          timeout: this.TIMEOUT_MS,
          headers: {
            'User-Agent': 'Sia Moon Property Management/1.0',
            'Accept': 'text/calendar, text/plain, */*'
          }
        })

        if (response.status === 200 && response.data) {
          console.log(`✅ Successfully fetched iCal data (${response.data.length} characters)`)
          return response.data
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error)
        
        if (attempt === retries) {
          throw new Error(`Failed to fetch iCal after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Failed to fetch iCal data')
  }

  /**
   * Validate iCal URL format
   */
  static validateICalUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url)
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use HTTP or HTTPS protocol' }
      }

      // Check for common iCal patterns
      const path = urlObj.pathname.toLowerCase()
      if (!path.includes('ical') && !path.includes('calendar') && !path.endsWith('.ics')) {
        console.warn('⚠️ URL does not appear to be an iCal feed, but will attempt to parse anyway')
      }

      return { valid: true }

    } catch (error) {
      return { valid: false, error: 'Invalid URL format' }
    }
  }
}
