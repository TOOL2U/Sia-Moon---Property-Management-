import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BookingDataFlowService } from '@/lib/services/bookingDataFlowService'
import { LiveBooking } from '@/lib/services/bookingService'

// Use the centralized Firebase db instance

/**
 * Match incoming booking data with existing client profiles
 */
async function matchClientProfile(villaName: string, propertyName?: string): Promise<PropertyMatch | null> {
  if (!db) return null

  try {
    console.log('🔍 Matching client profile for villa:', villaName, 'or property:', propertyName)

    // Get all client profiles
    const profilesSnapshot = await getDocs(collection(db, 'profiles'))
    const profiles: ClientProfile[] = []

    profilesSnapshot.forEach(doc => {
      profiles.push({ id: doc.id, ...doc.data() } as ClientProfile)
    })

    console.log(`📋 Found ${profiles.length} client profiles to check`)

    // Try to match by property name
    const searchTerms = [villaName, propertyName].filter(Boolean).map(term =>
      term?.toLowerCase().trim()
    )

    for (const profile of profiles) {
      if (profile.properties && Array.isArray(profile.properties)) {
        for (const property of profile.properties) {
          const propertyNameLower = property.name?.toLowerCase().trim()

          for (const searchTerm of searchTerms) {
            if (searchTerm && propertyNameLower) {
              // Exact match
              if (propertyNameLower === searchTerm) {
                console.log('✅ Exact match found:', property.name, 'for client:', profile.id)
                return {
                  clientId: profile.id,
                  propertyId: property.id || property.name,
                  propertyName: property.name,
                  confidence: 1.0
                }
              }

              // Partial match (contains)
              if (propertyNameLower.includes(searchTerm) || searchTerm.includes(propertyNameLower)) {
                console.log('🔍 Partial match found:', property.name, 'for client:', profile.id)
                return {
                  clientId: profile.id,
                  propertyId: property.id || property.name,
                  propertyName: property.name,
                  confidence: 0.8
                }
              }
            }
          }
        }
      }
    }

    console.log('❌ No matching client profile found for:', villaName)
    return null

  } catch (error) {
    console.error('❌ Error matching client profile:', error)
    return null
  }
}

/**
 * Parse price string to number (handles various formats)
 */
function parsePrice(price: string | number): number {
  if (typeof price === 'number') return price
  if (!price) return 0

  // Remove currency symbols and spaces, convert to number
  const cleanPrice = price.toString()
    .replace(/[^\d.,]/g, '') // Remove non-numeric except . and ,
    .replace(/,/g, '.') // Convert comma to dot for decimal

  return parseFloat(cleanPrice) || 0
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr // Return original if invalid

    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  } catch {
    return dateStr // Return original if parsing fails
  }
}

/**
 * Test Webhook Endpoint for Booking.com Email Data
 * 
 * This endpoint receives parsed booking.com email data from Make.com
 * for testing and debugging the automated booking pipeline.
 * 
 * Purpose:
 * - Safely receive and inspect parsed booking data
 * - Log incoming payloads for debugging
 * - Store test data for development analysis
 * - Validate data structure before production
 */

interface BookingTestPayload {
  // Original fields
  guestName?: string
  guestEmail?: string
  checkIn?: string
  checkOut?: string
  property?: string
  propertyId?: string
  bookingReference?: string
  totalAmount?: number
  currency?: string
  guests?: number
  specialRequests?: string
  bookingSource?: string
  rawEmailData?: Record<string, unknown>
  parsedAt?: string

  // Make.com ChatGPT parsed fields
  villaName?: string
  checkInDate?: string
  checkOutDate?: string
  price?: string | number

  [key: string]: unknown // Allow additional fields from Make.com
}

interface ClientProfile {
  id: string
  email: string
  businessName?: string
  properties?: Array<{ id?: string; name: string }>
}

interface PropertyMatch {
  clientId: string
  propertyId: string
  propertyName: string
  confidence: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📧 GMAIL BOOKING PARSER - Incoming request from Make.com')
    console.log('   Flow: Gmail Watch → Text Parser → HTTP Module')
    console.log('   Timestamp:', new Date().toISOString())
    console.log('   User-Agent:', request.headers.get('user-agent'))
    console.log('   Content-Type:', request.headers.get('content-type'))
    
    // Parse the JSON payload
    let payload: BookingTestPayload
    try {
      payload = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse JSON payload:', parseError)
      return NextResponse.json(
        { 
          status: 'error', 
          error: 'Invalid JSON payload',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { status: 400 }
      )
    }

    // Log the complete payload for debugging
    console.log('📦 Booking Test Payload Received:')
    console.log('   Raw payload:', JSON.stringify(payload, null, 2))
    console.log('   Payload size:', JSON.stringify(payload).length, 'bytes')
    
    // Extract and normalize booking information from Gmail-parsed data
    console.log('📧 Processing Gmail-parsed booking data...')

    // NEW STRUCTURE: Gmail Watch → Text Parser → HTTP
    const villaName = payload.property || payload.villaName || null
    const propertyAddress = payload.address || null
    const guestName = payload.guestName || null
    const guestEmail = payload.guestEmail || null
    const checkInDate = normalizeDate(payload.checkInDate || payload.checkIn || '')
    const checkOutDate = normalizeDate(payload.checkOutDate || payload.checkOut || '')
    const nights = payload.nights ? parseInt(payload.nights.toString()) : null
    const guests = payload.guests ? parseInt(payload.guests.toString()) : 1
    const price = parsePrice(payload.price || payload.totalAmount || 0)

    // Email metadata from Gmail Watch
    const emailSubject = payload.subject || null
    const emailDate = payload.date || null

    // Legacy fields for backward compatibility
    const specialRequests = payload.specialRequests || payload.requests || null

    const bookingInfo = {
      // Core booking fields from Gmail-parsed data
      villaName,
      propertyAddress,
      guestName,
      guestEmail,
      checkInDate,
      checkOutDate,
      nights,
      guests,
      price,
      specialRequests,

      // Email metadata from Gmail Watch
      emailSubject,
      emailDate,

      // Derived/calculated fields
      property: villaName, // Alias for compatibility
      totalAmount: price,
      currency: payload.currency || 'USD',

      // Source tracking for Gmail flow
      bookingSource: 'gmail_watch',
      dataSource: 'gmail_text_parser',
      automationFlow: 'gmail_watch_to_text_parser_to_http',

      // Legacy compatibility fields
      propertyId: payload.propertyId || null,
      bookingReference: payload.bookingReference || null,
      parsedAt: new Date().toISOString()
    }
    
    console.log('📋 Extracted Booking Information:')
    Object.entries(bookingInfo).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        console.log(`   ${key}:`, value)
      }
    })

    // Validate required fields for live bookings
    const missingFields = []

    if (!guestName) missingFields.push('guestName')
    if (!villaName) missingFields.push('villaName')
    if (!checkInDate) missingFields.push('checkInDate')
    if (!checkOutDate) missingFields.push('checkOutDate')

    if (missingFields.length > 0) {
      console.log('⚠️ Missing required fields for live booking:', missingFields)
    }

    // Attempt to match with client profile
    console.log('🔍 Attempting to match client profile...')
    const clientMatch = villaName ? await matchClientProfile(villaName, payload.property) : null

    if (clientMatch) {
      console.log('✅ Client matched:', {
        clientId: clientMatch.clientId,
        propertyName: clientMatch.propertyName,
        confidence: clientMatch.confidence
      })
    } else {
      console.log('❌ No client match found for villa:', villaName)
    }

    // Prepare booking data for comprehensive data flow
    const bookingData: Omit<LiveBooking, 'id'> = {
      // Core booking data from Gmail parsing
      villaName: villaName || 'Unknown Property',
      guestName: guestName || 'Unknown Guest',
      checkInDate: checkInDate || '',
      checkOutDate: checkOutDate || '',
      price: price || 0,

      // Gmail-specific fields
      guestEmail: guestEmail || undefined,
      specialRequests: (typeof specialRequests === 'string' && specialRequests) ? specialRequests : undefined,
      bookingReference: (typeof payload.bookingReference === 'string' && payload.bookingReference) ? payload.bookingReference : undefined,
      guests: guests || 1,
      paymentStatus: (typeof payload.paymentStatus === 'string' && payload.paymentStatus) ? payload.paymentStatus : undefined,

      // Client matching
      clientId: clientMatch?.clientId || undefined,
      propertyId: clientMatch?.propertyId || payload.propertyId || undefined,
      matchConfidence: clientMatch?.confidence || 0,

      // Metadata for Gmail flow
      bookingSource: 'gmail_watch',
      bookingType: 'guest_booking', // Use valid enum value
      status: 'pending_approval',
      receivedAt: Timestamp.now(),
      processedAt: Timestamp.now(),

      // Source tracking
      sourceDetails: {
        platform: 'gmail',
        method: 'gmail_watch_text_parser',
        automation: true,
        originalSource: `${emailSubject} - ${emailDate}`
      },

      // Financial data
      revenue: price || 0,
      currency: payload.currency || 'USD',

      // Original payload for reference
      originalPayload: payload
    }

    // Process comprehensive booking data flow
    console.log('🔄 GMAIL FLOW: Starting comprehensive booking data flow...')
    const dataFlowResult = await BookingDataFlowService.processBookingFlow(
      bookingData,
      clientMatch ? {
        clientId: clientMatch.clientId,
        propertyId: clientMatch.propertyId,
        propertyName: clientMatch.propertyName,
        confidence: clientMatch.confidence,
        matchMethod: 'property_name_matching'
      } : undefined
    )

    // Handle data flow results
    if (dataFlowResult.success) {
      console.log('✅ GMAIL FLOW: Comprehensive booking data flow completed successfully')

      // Store test log for debugging (legacy support)
      let storedDocId: string | null = null
      try {
        if (db) {
          const testPayloadDoc = {
            payload,
            extractedInfo: bookingInfo,
            clientMatch,
            dataFlowResult,
            receivedAt: Timestamp.now(),
            processingTimeMs: Date.now() - startTime,
            payloadSize: JSON.stringify(payload).length,
            source: 'gmail_watch',
            type: 'gmail-booking-parser',
            version: '3.0' // Gmail flow version
          }

          const testDocRef = await addDoc(collection(db, 'booking_logs'), testPayloadDoc)
          storedDocId = testDocRef.id
          console.log('✅ GMAIL FLOW: Test log stored with ID:', storedDocId)
        }
      } catch (logError) {
        console.warn('⚠️ GMAIL FLOW: Failed to store test log (non-critical):', logError)
      }
    } else {
      console.error('❌ GMAIL FLOW: Comprehensive booking data flow failed')
      console.error('❌ GMAIL FLOW: Errors:', dataFlowResult.errors)

      // Try fallback booking creation
      console.log('🆘 GMAIL FLOW: Attempting fallback booking creation...')
      const fallbackResult = await BookingDataFlowService.createFallbackBooking(
        bookingData,
        dataFlowResult.errors.join('; ')
      )

      if (fallbackResult.success) {
        console.log('✅ GMAIL FLOW: Fallback booking created:', fallbackResult.fallbackId)
        dataFlowResult.bookingId = fallbackResult.fallbackId
        dataFlowResult.warnings.push('Booking created via fallback mechanism - requires manual processing')
      } else {
        console.error('❌ GMAIL FLOW: Fallback booking creation also failed')
      }
    }

    // Store legacy test logs for backward compatibility
    let storedDocId: string | null = null
    let liveBookingId: string | null = null

    try {
      console.log('🔍 Firebase db status:', db ? 'Available' : 'Not available')

      if (!db) {
        console.warn('⚠️ Firebase db is not available - database not initialized')
        throw new Error('Firebase database not initialized')
      }

      if (db) {
        // 1. Store test log for debugging
        console.log('💾 Storing test log in Firebase...')
        const testPayloadDoc = {
          payload,
          extractedInfo: bookingInfo,
          clientMatch,
          receivedAt: Timestamp.now(),
          processingTimeMs: Date.now() - startTime,
          payloadSize: JSON.stringify(payload).length,
          missingFields: missingFields.length > 0 ? missingFields : null,
          source: 'make.com',
          type: 'booking-test'
        }

        const testDocRef = await addDoc(collection(db, 'booking_logs'), testPayloadDoc)
        storedDocId = testDocRef.id
        console.log('✅ Test log stored:', storedDocId)

        // 2. Store live booking if we have required data
        if (villaName && guestName && checkInDate && checkOutDate) {
          console.log('💾 Storing live booking in Firebase...')

          const liveBookingDoc = {
            // Core booking data
            villaName,
            guestName,
            checkInDate,
            checkOutDate,
            price,
            specialRequests: specialRequests || null,

            // Client matching
            clientId: clientMatch?.clientId || null,
            propertyId: clientMatch?.propertyId || null,
            matchConfidence: clientMatch?.confidence || 0,

            // Metadata
            bookingSource: 'booking.com',
            status: 'pending_approval',
            receivedAt: Timestamp.now(),
            processedAt: Timestamp.now(),

            // Original payload for reference
            originalPayload: payload,

            // Financial data
            revenue: price,
            currency: payload.currency || 'USD',

            // Additional fields
            guestEmail: payload.guestEmail || null,
            bookingReference: payload.bookingReference || null,
            guests: payload.guests || null
          }

          const liveDocRef = await addDoc(collection(db, 'live_bookings'), liveBookingDoc)
          liveBookingId = liveDocRef.id
          console.log('✅ Live booking stored:', liveBookingId)

          if (clientMatch) {
            console.log('🎯 Booking linked to client:', clientMatch.clientId)
          } else {
            console.log('⚠️ Booking stored without client match - requires manual assignment')
          }
        } else {
          console.log('⚠️ Insufficient data for live booking - storing test log only')
        }
      } else {
        console.warn('⚠️ Firebase db is still not available after reinitialization attempt')
      }
    } catch (storageError) {
      console.error('❌ Failed to store booking data in Firebase:', storageError)
      console.error('   Error details:', storageError instanceof Error ? storageError.message : 'Unknown error')
      console.error('   Error stack:', storageError instanceof Error ? storageError.stack : 'No stack trace')
      // Don't fail the request if storage fails
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime
    console.log(`✅ Gmail booking parser processed in ${processingTime}ms`)

    // Prepare comprehensive response for Gmail flow
    const response = {
      status: dataFlowResult?.success ? 'success' : 'partial_success',
      message: dataFlowResult?.success
        ? 'Gmail booking processed successfully through comprehensive data flow'
        : 'Gmail booking processed with warnings - manual review may be required',
      flow: 'Gmail Watch → Text Parser → HTTP Module',
      received: payload,

      // Gmail flow data flow results
      dataFlow: dataFlowResult ? {
        success: dataFlowResult.success,
        bookingId: dataFlowResult.bookingId,
        isDuplicate: dataFlowResult.isDuplicate,
        clientMatched: dataFlowResult.clientMatched,
        notificationsSent: dataFlowResult.notificationsSent,
        dashboardUpdated: dataFlowResult.dashboardUpdated,
        reportsUpdated: dataFlowResult.reportsUpdated,
        errors: dataFlowResult.errors,
        warnings: dataFlowResult.warnings,
        processingMetadata: dataFlowResult.metadata
      } : null,

      // Gmail-specific metadata
      gmailFlow: {
        emailSubject: emailSubject,
        emailDate: emailDate,
        propertyAddress: propertyAddress,
        nights: nights,
        automationSource: 'gmail_watch_text_parser'
      },

      // Legacy metadata for backward compatibility
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        payloadSize: JSON.stringify(payload).length,
        extractedInfo: bookingInfo,

        // Client matching information
        clientMatch: clientMatch ? {
          clientId: clientMatch.clientId,
          propertyName: clientMatch.propertyName,
          confidence: clientMatch.confidence
        } : null,

        // Enhanced booking status for Gmail flow
        bookingStatus: dataFlowResult?.bookingId ? 'pending_approval' : 'processing_failed',
        liveBookingCreated: dataFlowResult?.success && !dataFlowResult?.isDuplicate,
        liveBookingId: dataFlowResult?.bookingId,
        duplicateDetected: dataFlowResult?.isDuplicate,
        fallbackUsed: dataFlowResult?.warnings?.some(w => w.includes('fallback')) || false
      }
    }

    console.log('📤 GMAIL FLOW: Sending response:', {
      status: response.status,
      flow: response.flow,
      bookingId: dataFlowResult?.bookingId,
      clientMatched: dataFlowResult?.clientMatched,
      processingTime: response.metadata.processingTimeMs
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    const processingTime = Date.now() - startTime

    console.error('❌ GMAIL BOOKING PARSER ERROR:')
    console.error('   Flow: Gmail Watch → Text Parser → HTTP Module')
    console.error('   Error:', error)
    console.error('   Processing time:', processingTime, 'ms')
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        status: 'error',
        flow: 'Gmail Watch → Text Parser → HTTP Module',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Gmail booking parsing failed - manual intervention required',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: processingTime,
          automationSource: 'gmail_watch_text_parser'
        }
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for endpoint documentation
export async function GET() {
  const documentation = {
    endpoint: '/api/booking-test',
    purpose: 'Test webhook for receiving parsed booking.com email data from Make.com',
    method: 'POST',
    contentType: 'application/json',
    description: 'This endpoint safely receives, logs, and validates booking data for testing purposes',
    
    expectedPayload: {
      guestName: 'string (required)',
      guestEmail: 'string (optional)',
      checkIn: 'string (required) - YYYY-MM-DD format',
      checkOut: 'string (required) - YYYY-MM-DD format',
      property: 'string (optional)',
      propertyId: 'string (optional)',
      bookingReference: 'string (optional)',
      totalAmount: 'number (optional)',
      currency: 'string (optional)',
      guests: 'number (optional)',
      specialRequests: 'string (optional)',
      bookingSource: 'string (optional)',
      rawEmailData: 'object (optional)',
      parsedAt: 'string (optional)'
    },
    
    exampleCurl: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/api/booking-test \\
-H "Content-Type: application/json" \\
-d '{
  "guestName": "John Doe",
  "guestEmail": "john.doe@example.com",
  "checkIn": "2025-08-01",
  "checkOut": "2025-08-07",
  "property": "Villa Sunset",
  "bookingReference": "BDC-123456789",
  "totalAmount": 1500,
  "currency": "USD",
  "guests": 2,
  "bookingSource": "booking.com"
}'`,
    
    responses: {
      success: {
        status: 'success',
        message: 'Booking test payload received and logged',
        received: '{ ...payload }',
        metadata: {
          timestamp: 'ISO string',
          processingTimeMs: 'number',
          payloadSize: 'number',
          extractedInfo: '{ ...booking info }'
        }
      },
      error: {
        status: 'error',
        error: 'Error message',
        metadata: {
          timestamp: 'ISO string',
          processingTimeMs: 'number'
        }
      }
    }
  }

  return NextResponse.json(documentation, { status: 200 })
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
