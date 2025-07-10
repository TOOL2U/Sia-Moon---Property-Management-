import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, collection, addDoc, Timestamp, Firestore } from 'firebase/firestore'

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

// Initialize Firebase for this API route
let app: any = null
let db: any = null

try {
  console.log('🔥 Initializing Firebase in API route...')
  console.log('📋 Firebase config check:', {
    apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
    projectId: firebaseConfig.projectId ? 'Present' : 'Missing',
    authDomain: firebaseConfig.authDomain ? 'Present' : 'Missing'
  })

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  db = getFirestore(app)
  console.log('✅ Firebase initialized successfully in API route')
} catch (error) {
  console.error('❌ Firebase initialization failed in API route:', error)
  db = null
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
  rawEmailData?: any
  parsedAt?: string
  [key: string]: any // Allow additional fields from Make.com
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔄 Booking Test Webhook - Incoming request')
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
    
    // Extract and log key booking information
    const bookingInfo = {
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      property: payload.property,
      propertyId: payload.propertyId,
      bookingReference: payload.bookingReference,
      totalAmount: payload.totalAmount,
      currency: payload.currency,
      guests: payload.guests,
      bookingSource: payload.bookingSource || 'booking.com',
      parsedAt: payload.parsedAt
    }
    
    console.log('📋 Extracted Booking Information:')
    Object.entries(bookingInfo).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        console.log(`   ${key}:`, value)
      }
    })

    // Validate required fields (basic validation for testing)
    const requiredFields = ['guestName', 'checkIn', 'checkOut']
    const missingFields = requiredFields.filter(field => !payload[field])
    
    if (missingFields.length > 0) {
      console.log('⚠️ Missing required fields:', missingFields)
    }

    // Optional: Store test payload in Firebase for inspection
    let storedDocId: string | null = null
    try {
      console.log('🔍 Firebase db status:', db ? 'Available' : 'Not available')

      if (!db) {
        console.warn('⚠️ Firebase db is not available - attempting to reinitialize...')
        try {
          // Try to reinitialize Firebase
          const { initializeApp, getApps } = require('firebase/app')
          const { getFirestore } = require('firebase/firestore')

          const config = {
            apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
            authDomain: "operty-b54dc.firebaseapp.com",
            projectId: "operty-b54dc",
            storageBucket: "operty-b54dc.firebasestorage.app",
            messagingSenderId: "914547669275",
            appId: "1:914547669275:web:0897d32d59b17134a53bbe"
          }

          const tempApp = getApps().length === 0 ? initializeApp(config) : getApps()[0]
          db = getFirestore(tempApp)
          console.log('✅ Firebase reinitialized successfully')
        } catch (reinitError) {
          console.error('❌ Firebase reinitialization failed:', reinitError)
        }
      }

      if (db) {
        console.log('💾 Attempting to store test payload in Firebase...')

        const testPayloadDoc = {
          payload,
          extractedInfo: bookingInfo,
          receivedAt: Timestamp.now(),
          processingTimeMs: Date.now() - startTime,
          payloadSize: JSON.stringify(payload).length,
          missingFields: missingFields.length > 0 ? missingFields : null,
          source: 'make.com',
          type: 'booking-test'
        }

        console.log('📄 Document to store:', JSON.stringify(testPayloadDoc, null, 2))

        const docRef = await addDoc(collection(db, 'booking_test_logs'), testPayloadDoc)
        storedDocId = docRef.id
        console.log('✅ Test payload stored in Firebase successfully:', storedDocId)
      } else {
        console.warn('⚠️ Firebase db is still not available after reinitialization attempt')
      }
    } catch (storageError) {
      console.error('❌ Failed to store test payload in Firebase:', storageError)
      console.error('   Error details:', storageError instanceof Error ? storageError.message : 'Unknown error')
      console.error('   Error stack:', storageError instanceof Error ? storageError.stack : 'No stack trace')
      // Don't fail the request if storage fails
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime
    console.log(`✅ Booking test webhook processed in ${processingTime}ms`)

    // Prepare response
    const response = {
      status: 'success',
      message: 'Booking test payload received and logged',
      received: payload,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        payloadSize: JSON.stringify(payload).length,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        extractedInfo: bookingInfo,
        storedInFirebase: storedDocId ? true : false,
        firebaseDocId: storedDocId
      }
    }

    console.log('📤 Sending response:', {
      status: response.status,
      message: response.message,
      payloadSize: response.metadata.payloadSize,
      processingTime: response.metadata.processingTimeMs
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('❌ Booking Test Webhook Error:')
    console.error('   Error:', error)
    console.error('   Processing time:', processingTime, 'ms')
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTimeMs: processingTime
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
