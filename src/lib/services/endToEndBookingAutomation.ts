import { BookingService, LiveBooking } from './bookingService'
import { ProfileService } from './profileService'

export interface AutomationResult {
  success: boolean
  adminBookingId?: string
  clientMatched: boolean
  clientId?: string
  clientEmail?: string
  propertyName?: string
  clientBookingId?: string
  confidence?: number
  matchMethod?: string
  error?: string
  processingTime: number
}

export class EndToEndBookingAutomation {
  
  /**
   * Complete end-to-end booking automation workflow
   * 1. Find admin booking by ID
   * 2. Extract property name from booking
   * 3. Search profiles collection for matching property
   * 4. Create booking in matched client's profile
   * 5. Update admin booking with client match info
   */
  static async processBookingApproval(adminBookingId: string): Promise<AutomationResult> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 END-TO-END: Starting complete booking automation')
      console.log('🚀 END-TO-END: Admin booking ID:', adminBookingId)
      
      // Step 1: Get the admin booking
      console.log('📋 END-TO-END: Step 1 - Fetching admin booking')
      const allBookings = await BookingService.getAllBookings()
      const adminBooking = allBookings.find(b => b.id === adminBookingId)
      
      if (!adminBooking) {
        console.error('❌ END-TO-END: Admin booking not found')
        return {
          success: false,
          clientMatched: false,
          error: 'Admin booking not found',
          processingTime: Date.now() - startTime
        }
      }
      
      console.log('✅ END-TO-END: Admin booking found')
      console.log('✅ END-TO-END: Property:', adminBooking.villaName)
      console.log('✅ END-TO-END: Guest:', adminBooking.guestName)
      console.log('✅ END-TO-END: Dates:', adminBooking.checkInDate, '→', adminBooking.checkOutDate)
      
      // Step 2: Find client by property name
      console.log('🔍 END-TO-END: Step 2 - Finding client by property name')
      const clientMatch = await ProfileService.findClientByPropertyName(adminBooking.villaName)
      
      if (!clientMatch) {
        console.log('⚠️ END-TO-END: No client match found')
        return {
          success: true,
          adminBookingId,
          clientMatched: false,
          propertyName: adminBooking.villaName,
          error: 'No matching client profile found',
          processingTime: Date.now() - startTime
        }
      }
      
      console.log('✅ END-TO-END: Client match found!')
      console.log('✅ END-TO-END: Client:', clientMatch.profile.email)
      console.log('✅ END-TO-END: Property:', clientMatch.property.name)
      console.log('✅ END-TO-END: Confidence:', (clientMatch.confidence * 100).toFixed(1) + '%')
      console.log('✅ END-TO-END: Method:', clientMatch.matchMethod)
      
      // Step 3: Create booking in client's profile
      console.log('📝 END-TO-END: Step 3 - Creating booking in client profile')
      const clientBookingData = {
        propertyName: clientMatch.property.name,
        propertyId: clientMatch.property.id,
        guestName: adminBooking.guestName,
        guestEmail: adminBooking.guestEmail || '',
        checkInDate: adminBooking.checkInDate,
        checkOutDate: adminBooking.checkOutDate,
        nights: this.calculateNights(adminBooking.checkInDate, adminBooking.checkOutDate),
        guests: adminBooking.guests || 2,
        price: adminBooking.price || adminBooking.revenue || 0,
        status: 'confirmed' as const,
        bookingSource: adminBooking.bookingSource || 'booking_platform',
        bookingReference: adminBooking.bookingReference,
        specialRequests: adminBooking.specialRequests,
        adminBookingId: adminBooking.id,
        syncedAt: new Date()
      }
      
      const clientBookingId = await ProfileService.createClientBooking(
        clientMatch.profile.id,
        clientBookingData
      )
      
      if (!clientBookingId) {
        console.error('❌ END-TO-END: Failed to create client booking')
        return {
          success: false,
          adminBookingId,
          clientMatched: true,
          clientId: clientMatch.profile.id,
          clientEmail: clientMatch.profile.email,
          propertyName: clientMatch.property.name,
          confidence: clientMatch.confidence,
          matchMethod: clientMatch.matchMethod,
          error: 'Failed to create client booking',
          processingTime: Date.now() - startTime
        }
      }
      
      console.log('✅ END-TO-END: Client booking created successfully')
      console.log('✅ END-TO-END: Client booking ID:', clientBookingId)
      
      // Step 4: Update admin booking with client match info
      console.log('🔗 END-TO-END: Step 4 - Updating admin booking with client match')
      const adminUpdateSuccess = await BookingService.updateBookingClientMatch(adminBookingId, {
        clientId: clientMatch.profile.id,
        propertyId: clientMatch.property.id,
        propertyName: clientMatch.property.name,
        confidence: clientMatch.confidence,
        matchMethod: clientMatch.matchMethod
      })
      
      if (!adminUpdateSuccess) {
        console.error('❌ END-TO-END: Failed to update admin booking')
        // Don't fail the whole process since client booking was created
      }
      
      console.log('🎉 END-TO-END: Complete automation successful!')
      console.log('🎉 END-TO-END: Processing time:', Date.now() - startTime, 'ms')
      
      return {
        success: true,
        adminBookingId,
        clientMatched: true,
        clientId: clientMatch.profile.id,
        clientEmail: clientMatch.profile.email,
        propertyName: clientMatch.property.name,
        clientBookingId,
        confidence: clientMatch.confidence,
        matchMethod: clientMatch.matchMethod,
        processingTime: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('❌ END-TO-END: Error in complete automation:', error)
      return {
        success: false,
        adminBookingId,
        clientMatched: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }
    }
  }
  
  /**
   * Calculate number of nights between dates
   */
  private static calculateNights(checkIn: string, checkOut: string): number {
    try {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime()
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24))
      return Math.max(1, nights)
    } catch (error) {
      console.error('❌ END-TO-END: Error calculating nights:', error)
      return 1
    }
  }
  
  /**
   * Test the complete automation workflow
   */
  static async testAutomation(propertyName: string): Promise<{
    profilesFound: number
    matchResult: any
    testSuccess: boolean
  }> {
    try {
      console.log('🧪 END-TO-END: Testing automation workflow')
      console.log('🧪 END-TO-END: Test property:', propertyName)
      
      // Get all profiles
      const profiles = await ProfileService.getAllProfiles()
      console.log(`📋 END-TO-END: Found ${profiles.length} profiles`)
      
      // Test client matching
      const matchResult = await ProfileService.findClientByPropertyName(propertyName)
      
      return {
        profilesFound: profiles.length,
        matchResult,
        testSuccess: true
      }
      
    } catch (error) {
      console.error('❌ END-TO-END: Error testing automation:', error)
      return {
        profilesFound: 0,
        matchResult: null,
        testSuccess: false
      }
    }
  }
  
  /**
   * Get automation statistics
   */
  static async getAutomationStats(): Promise<{
    totalProfiles: number
    profilesWithProperties: number
    totalProperties: number
    averagePropertiesPerProfile: number
  }> {
    try {
      const profiles = await ProfileService.getAllProfiles()
      const profilesWithProperties = profiles.filter(p => p.properties && p.properties.length > 0)
      const totalProperties = profiles.reduce((sum, p) => sum + (p.properties?.length || 0), 0)
      
      return {
        totalProfiles: profiles.length,
        profilesWithProperties: profilesWithProperties.length,
        totalProperties,
        averagePropertiesPerProfile: profiles.length > 0 ? totalProperties / profiles.length : 0
      }
      
    } catch (error) {
      console.error('❌ END-TO-END: Error getting automation stats:', error)
      return {
        totalProfiles: 0,
        profilesWithProperties: 0,
        totalProperties: 0,
        averagePropertiesPerProfile: 0
      }
    }
  }
}
