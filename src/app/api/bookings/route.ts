import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// Booking interface
interface BookingData {
  property: string
  address: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: string | number
  guests: string | number
  price: string | number
  subject: string
  date: string
}

interface ProcessedBooking {
  property: string
  address: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  price: number
  subject: string
  emailDate: string
  status: 'pending_approval'
  source: 'make_com_automation'
  createdAt: Timestamp
  updatedAt: Timestamp
  duplicateCheckHash: string
}

/**
 * Validate required booking fields
 */
function validateBookingData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const requiredFields = [
    'property', 'address', 'guestName', 'guestEmail', 
    'checkInDate', 'checkOutDate', 'nights', 'guests', 'price'
  ]
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  // Validate email format
  if (data.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) {
    errors.push('Invalid email format')
  }
  
  // Validate dates
  if (data.checkInDate && isNaN(Date.parse(data.checkInDate))) {
    errors.push('Invalid check-in date format')
  }
  
  if (data.checkOutDate && isNaN(Date.parse(data.checkOutDate))) {
    errors.push('Invalid check-out date format')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Normalize and parse booking data
 */
function normalizeBookingData(data: BookingData): ProcessedBooking {
  // Parse price - remove currency symbols and convert to number
  let price = 0
  if (typeof data.price === 'string') {
    price = parseFloat(data.price.replace(/[$,€£¥]/g, '')) || 0
  } else {
    price = Number(data.price) || 0
  }
  
  // Parse guests - convert to integer
  const guests = parseInt(String(data.guests)) || 1
  
  // Parse nights - convert to integer
  const nights = parseInt(String(data.nights)) || 1
  
  // Normalize dates to ISO format
  const checkInDate = new Date(data.checkInDate).toISOString().split('T')[0]
  const checkOutDate = new Date(data.checkOutDate).toISOString().split('T')[0]
  
  // Create duplicate check hash
  const duplicateCheckHash = `${data.property.toLowerCase().trim()}-${data.guestName.toLowerCase().trim()}-${checkInDate}-${checkOutDate}`
  
  const now = Timestamp.now()
  
  return {
    property: data.property.trim(),
    address: data.address.trim(),
    guestName: data.guestName.trim(),
    guestEmail: data.guestEmail.toLowerCase().trim(),
    checkInDate,
    checkOutDate,
    nights,
    guests,
    price,
    subject: data.subject || 'Booking Confirmation',
    emailDate: data.date || new Date().toISOString(),
    status: 'pending_approval',
    source: 'make_com_automation',
    createdAt: now,
    updatedAt: now,
    duplicateCheckHash
  }
}

/**
 * Check for duplicate bookings
 */
async function checkForDuplicate(bookingData: ProcessedBooking): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('duplicateCheckHash', '==', bookingData.duplicateCheckHash)
    )
    
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return false
  }
}

/**
 * Authenticate request from Make.com
 */
function authenticateRequest(request: NextRequest): boolean {
  // Check for API key in headers
  const apiKey = request.headers.get('x-api-key')
  const vercelBypass = request.headers.get('x-vercel-protection-bypass')
  
  // Allow requests with valid API key or Vercel bypass header
  if (apiKey === process.env.BOOKING_API_KEY) {
    return true
  }
  
  if (vercelBypass === process.env.VERCEL_PROTECTION_BYPASS) {
    return true
  }
  
  // For development, allow requests from localhost
  const origin = request.headers.get('origin')
  if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
    return true
  }
  
  return false
}

/**
 * POST /api/bookings
 * Create a new booking from Make.com automation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📋 BOOKINGS API: Received booking creation request')
    
    // Authenticate request
    if (!authenticateRequest(request)) {
      console.log('❌ BOOKINGS API: Unauthorized request')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const rawData = await request.json()
    console.log('📋 BOOKINGS API: Raw data received:', rawData)
    
    // Validate required fields
    const validation = validateBookingData(rawData)
    if (!validation.isValid) {
      console.log('❌ BOOKINGS API: Validation failed:', validation.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }
    
    // Normalize and process data
    const processedBooking = normalizeBookingData(rawData)
    console.log('✅ BOOKINGS API: Data normalized:', processedBooking)
    
    // Check for duplicates
    const isDuplicate = await checkForDuplicate(processedBooking)
    if (isDuplicate) {
      console.log('⚠️ BOOKINGS API: Duplicate booking detected, skipping creation')
      return NextResponse.json({
        success: true,
        message: 'Duplicate booking detected, skipping creation.',
        duplicate: true,
        processingTime: Date.now() - startTime
      })
    }
    
    // Create booking in Firebase
    const docRef = await addDoc(collection(db, 'bookings'), processedBooking)
    const bookingId = docRef.id
    
    console.log('✅ BOOKINGS API: Booking created successfully')
    console.log('✅ BOOKINGS API: Booking ID:', bookingId)
    
    // TODO: Future notification hooks can be added here
    // await sendAdminNotification(bookingId, processedBooking)
    // await sendStaffNotification(bookingId, processedBooking)
    
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully.',
      bookingId,
      processingTime: Date.now() - startTime,
      bookingDetails: {
        property: processedBooking.property,
        guest: processedBooking.guestName,
        checkIn: processedBooking.checkInDate,
        checkOut: processedBooking.checkOutDate,
        price: processedBooking.price,
        status: processedBooking.status
      }
    })
    
  } catch (error) {
    console.error('❌ BOOKINGS API: Error creating booking:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings
 * Get recent bookings (for testing and monitoring)
 */
export async function GET() {
  try {
    // This endpoint can be used for health checks and monitoring
    return NextResponse.json({
      success: true,
      message: 'Bookings API is operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        POST: 'Create new booking',
        GET: 'Health check'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
