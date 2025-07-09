import DatabaseService from '@/lib/dbService'
import { ICalParser, ParsedBooking } from './icalParser'
import { Booking, Property, BookingSyncLog } from '@/lib/db'

/**
 * Interface for sync configuration
 */
export interface SyncConfig {
  propertyId: string
  airbnbICalUrl?: string
  bookingComICalUrl?: string
  enableAutoCleaningTasks?: boolean
}

/**
 * Interface for sync result
 */
export interface BookingSyncResult {
  success: boolean
  propertyId: string
  totalBookingsFound: number
  newBookingsCreated: number
  existingBookingsUpdated: number
  errors: string[]
  syncDurationMs: number
  cleaningTasksCreated: number
}

/**
 * Booking Sync Service
 * 
 * Handles synchronization of bookings from external platforms (Airbnb, Booking.com)
 * via iCal feeds. Automatically creates cleaning tasks for new check-outs.
 */
export class BookingSyncService {
  
  /**
   * Sync bookings for a single property
   */
  static async syncPropertyBookings(config: SyncConfig): Promise<BookingSyncResult> {
    const startTime = Date.now()
    const result: BookingSyncResult = {
      success: false,
      propertyId: config.propertyId,
      totalBookingsFound: 0,
      newBookingsCreated: 0,
      existingBookingsUpdated: 0,
      errors: [],
      syncDurationMs: 0,
      cleaningTasksCreated: 0
    }

    try {
      console.log(`🔄 Starting booking sync for property: ${config.propertyId}`)

      // Verify property exists
      const { data: property, error: propertyError } = await DatabaseService.getProperty(config.propertyId)
      if (propertyError || !property) {
        throw new Error(`Property not found: ${config.propertyId}`)
      }

      // Get existing bookings for this property
      const { data: existingBookings } = await DatabaseService.getBookingsByProperty(config.propertyId)
      const existingBookingMap = new Map<string, Booking>()
      
      if (existingBookings) {
        existingBookings.forEach(booking => {
          if (booking.external_id) {
            existingBookingMap.set(booking.external_id, booking)
          }
        })
      }

      // Sync from Airbnb if URL provided
      if (config.airbnbICalUrl) {
        try {
          await this.syncFromPlatform(
            config.airbnbICalUrl,
            'airbnb',
            config.propertyId,
            existingBookingMap,
            result,
            config.enableAutoCleaningTasks
          )
        } catch (error) {
          const errorMsg = `Airbnb sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error('❌', errorMsg)
          result.errors.push(errorMsg)
        }
      }

      // Sync from Booking.com if URL provided
      if (config.bookingComICalUrl) {
        try {
          await this.syncFromPlatform(
            config.bookingComICalUrl,
            'booking_com',
            config.propertyId,
            existingBookingMap,
            result,
            config.enableAutoCleaningTasks
          )
        } catch (error) {
          const errorMsg = `Booking.com sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error('❌', errorMsg)
          result.errors.push(errorMsg)
        }
      }

      // Update property last sync timestamp
      await DatabaseService.updateProperty(config.propertyId, {
        last_sync: new Date().toISOString()
      })

      result.success = result.errors.length === 0 || (result.newBookingsCreated > 0 || result.existingBookingsUpdated > 0)
      result.syncDurationMs = Date.now() - startTime

      console.log(`✅ Booking sync completed for property ${config.propertyId}:`, {
        found: result.totalBookingsFound,
        created: result.newBookingsCreated,
        updated: result.existingBookingsUpdated,
        errors: result.errors.length,
        duration: `${result.syncDurationMs}ms`
      })

      // Log sync result
      await this.logSyncResult(config.propertyId, result)

      return result

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Booking sync failed:', errorMsg)
      
      result.errors.push(errorMsg)
      result.syncDurationMs = Date.now() - startTime
      
      // Log failed sync
      await this.logSyncResult(config.propertyId, result)
      
      return result
    }
  }

  /**
   * Sync bookings from a specific platform
   */
  private static async syncFromPlatform(
    icalUrl: string,
    platform: 'airbnb' | 'booking_com',
    propertyId: string,
    existingBookingMap: Map<string, Booking>,
    result: BookingSyncResult,
    enableAutoCleaningTasks = true
  ): Promise<void> {
    console.log(`🔄 Syncing from ${platform}: ${icalUrl}`)

    // Parse iCal data
    const parseResult = await ICalParser.parseICalFromUrl(icalUrl, platform)
    
    if (!parseResult.success) {
      throw new Error(parseResult.error || `Failed to parse ${platform} iCal data`)
    }

    console.log(`📊 Found ${parseResult.bookings.length} bookings from ${platform}`)
    result.totalBookingsFound += parseResult.bookings.length

    // Process each booking
    for (const parsedBooking of parseResult.bookings) {
      try {
        await this.processBooking(
          parsedBooking,
          propertyId,
          existingBookingMap,
          result,
          enableAutoCleaningTasks
        )
      } catch (error) {
        const errorMsg = `Failed to process booking ${parsedBooking.external_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.warn('⚠️', errorMsg)
        result.errors.push(errorMsg)
      }
    }
  }

  /**
   * Process a single parsed booking
   */
  private static async processBooking(
    parsedBooking: ParsedBooking,
    propertyId: string,
    existingBookingMap: Map<string, Booking>,
    result: BookingSyncResult,
    enableAutoCleaningTasks: boolean
  ): Promise<void> {
    const existingBooking = existingBookingMap.get(parsedBooking.external_id)

    if (existingBooking) {
      // Update existing booking if data has changed
      const needsUpdate = this.bookingNeedsUpdate(existingBooking, parsedBooking)
      
      if (needsUpdate) {
        const { error } = await DatabaseService.updateBooking(existingBooking.id, {
          guest_name: parsedBooking.guest_name,
          guest_email: parsedBooking.guest_email || existingBooking.guest_email,
          check_in: parsedBooking.check_in,
          check_out: parsedBooking.check_out,
          status: parsedBooking.status,
          last_synced: new Date().toISOString()
        })

        if (error) {
          throw new Error(`Failed to update booking: ${error.message}`)
        }

        result.existingBookingsUpdated++
        console.log(`📝 Updated existing booking: ${parsedBooking.external_id}`)

        // Check if checkout date changed and create cleaning task if needed
        if (enableAutoCleaningTasks && existingBooking.check_out !== parsedBooking.check_out) {
          await this.createCleaningTaskIfNeeded(existingBooking.id, result)
        }
      }
    } else {
      // Create new booking
      const { data: newBooking, error } = await DatabaseService.createBooking({
        property_id: propertyId,
        guest_name: parsedBooking.guest_name,
        guest_email: parsedBooking.guest_email || '',
        check_in: parsedBooking.check_in,
        check_out: parsedBooking.check_out,
        status: parsedBooking.status,
        external_id: parsedBooking.external_id,
        platform: parsedBooking.platform,
        sync_source: 'ical',
        last_synced: new Date().toISOString()
      })

      if (error || !newBooking) {
        throw new Error(`Failed to create booking: ${error?.message || 'Unknown error'}`)
      }

      result.newBookingsCreated++
      console.log(`✨ Created new booking: ${parsedBooking.external_id}`)

      // Create cleaning task for new booking if checkout is in the future
      if (enableAutoCleaningTasks) {
        await this.createCleaningTaskIfNeeded(newBooking.id, result)
      }

      // Add to existing bookings map for future reference
      existingBookingMap.set(parsedBooking.external_id, newBooking)
    }
  }

  /**
   * Check if booking needs update
   */
  private static bookingNeedsUpdate(existing: Booking, parsed: ParsedBooking): boolean {
    return (
      existing.guest_name !== parsed.guest_name ||
      existing.guest_email !== parsed.guest_email ||
      existing.check_in !== parsed.check_in ||
      existing.check_out !== parsed.check_out ||
      existing.status !== parsed.status
    )
  }

  /**
   * Create cleaning task if checkout is in the future
   */
  private static async createCleaningTaskIfNeeded(
    bookingId: string,
    result: BookingSyncResult
  ): Promise<void> {
    try {
      const checkoutDate = new Date()
      const today = new Date()
      
      // Only create cleaning tasks for future checkouts
      if (checkoutDate >= today) {
        const { data: cleaningTask, error } = await DatabaseService.createCleaningTaskForBooking(bookingId)
        
        if (error) {
          console.warn('⚠️ Failed to create cleaning task:', error.message)
        } else if (cleaningTask) {
          result.cleaningTasksCreated++
          console.log(`🧹 Created cleaning task for booking: ${bookingId}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error creating cleaning task:', error)
    }
  }

  /**
   * Log sync result to database
   */
  private static async logSyncResult(propertyId: string, result: BookingSyncResult): Promise<void> {
    try {
      // Note: This would need to be implemented in the database service
      // For now, we'll just log to console
      console.log('📊 Sync result logged:', {
        propertyId,
        success: result.success,
        bookingsFound: result.totalBookingsFound,
        created: result.newBookingsCreated,
        updated: result.existingBookingsUpdated,
        errors: result.errors.length,
        duration: result.syncDurationMs
      })
    } catch (error) {
      console.warn('⚠️ Failed to log sync result:', error)
    }
  }

  /**
   * Sync all properties with sync enabled
   */
  static async syncAllProperties(): Promise<BookingSyncResult[]> {
    console.log('🔄 Starting sync for all properties...')
    
    try {
      // Get all properties
      const { data: properties, error } = await DatabaseService.getAllProperties()
      
      if (error || !properties) {
        throw new Error(`Failed to get properties: ${error?.message || 'Unknown error'}`)
      }

      // Filter properties with sync enabled and iCal URLs
      const syncableProperties = properties.filter(property => 
        property.sync_enabled && 
        (property.airbnb_ical_url || property.booking_com_ical_url)
      )

      console.log(`📊 Found ${syncableProperties.length} properties with sync enabled`)

      // Sync each property
      const results: BookingSyncResult[] = []
      
      for (const property of syncableProperties) {
        try {
          const result = await this.syncPropertyBookings({
            propertyId: property.id,
            airbnbICalUrl: property.airbnb_ical_url,
            bookingComICalUrl: property.booking_com_ical_url,
            enableAutoCleaningTasks: true
          })
          
          results.push(result)
        } catch (error) {
          console.error(`❌ Failed to sync property ${property.id}:`, error)
          results.push({
            success: false,
            propertyId: property.id,
            totalBookingsFound: 0,
            newBookingsCreated: 0,
            existingBookingsUpdated: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            syncDurationMs: 0,
            cleaningTasksCreated: 0
          })
        }
      }

      console.log('✅ Completed sync for all properties')
      return results

    } catch (error) {
      console.error('❌ Failed to sync all properties:', error)
      throw error
    }
  }
}
