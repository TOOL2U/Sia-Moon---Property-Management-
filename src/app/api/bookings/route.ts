import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { SyncBooking, BookingStatus, SyncEvent } from '@/types/booking-sync'
import { withMobileAuth, createMobileSuccessResponse, createMobileErrorResponse } from '@/lib/middleware/mobileAuth'

// Use the centralized Firebase db instance with lazy initialization

// Mobile API interfaces
interface ApprovedBookingData {
  id: string
  propertyId: string
  propertyName: string
  propertyAddress: string
  guestName: string
  guestEmail: string
  guestPhone: string
  checkIn: string // ISO date
  checkOut: string // ISO date
  status: 'approved' | 'confirmed' | 'in-progress' | 'completed'
  totalAmount: number
  paymentStatus: string
  specialRequests?: string
  assignedStaff?: string[]
  tasks?: BookingTask[]
  createdAt: string
  approvedAt: string
}

interface BookingTask {
  id: string
  type: 'cleaning' | 'maintenance' | 'inspection' | 'setup' | 'checkout'
  title: string
  description: string
  assignedTo?: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
}

// Booking interface for incoming data
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

interface ProcessedBooking extends Omit<SyncBooking, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> {
  property: string
  villaName: string // Add villaName for compatibility with LiveBooking interface
  address: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guestCount: number
  price: number
  totalAmount: number
  currency: string
  subject: string
  emailDate: string
  status: BookingStatus
  source: string
  createdAt: unknown // Use serverTimestamp() for Firestore
  updatedAt: unknown // Use serverTimestamp() for Firestore
  duplicateCheckHash: string
  syncVersion: number
  lastSyncedAt?: unknown // Use serverTimestamp() for Firestore
}

/**
 * Validate required booking fields
 */
function validateBookingData(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
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
  if (data.guestEmail && typeof data.guestEmail === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) {
    errors.push('Invalid email format')
  }

  // Validate dates
  if (data.checkInDate && typeof data.checkInDate === 'string' && isNaN(Date.parse(data.checkInDate))) {
    errors.push('Invalid check-in date format')
  }

  if (data.checkOutDate && typeof data.checkOutDate === 'string' && isNaN(Date.parse(data.checkOutDate))) {
    errors.push('Invalid check-out date format')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Normalize and parse booking data with enhanced sync support
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
  const guestCount = parseInt(String(data.guests)) || 1

  // Parse nights - convert to integer
  const nights = parseInt(String(data.nights)) || 1

  // Normalize dates to ISO format
  const checkInDate = new Date(data.checkInDate).toISOString().split('T')[0]
  const checkOutDate = new Date(data.checkOutDate).toISOString().split('T')[0]

  // Create duplicate check hash
  const duplicateCheckHash = `${data.property.toLowerCase().trim()}-${data.guestName.toLowerCase().trim()}-${checkInDate}-${checkOutDate}`

  return {
    property: data.property.trim(),
    propertyName: data.property.trim(),
    villaName: data.property.trim(), // Add villaName field for compatibility
    address: data.address?.trim() || '',
    guestName: data.guestName.trim(),
    guestEmail: data.guestEmail.toLowerCase().trim(),
    checkInDate,
    checkOutDate,
    nights,
    guestCount,
    price,
    totalAmount: price, // Same as price for now
    currency: 'USD', // Default currency, can be enhanced later
    subject: data.subject || 'Booking Confirmation',
    emailDate: data.date || new Date().toISOString(),
    status: 'pending_approval' as BookingStatus,
    source: 'make_com_automation',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSyncedAt: serverTimestamp(),
    duplicateCheckHash,
    syncVersion: 1
  }
}

/**
 * Check for duplicate bookings in both collections
 */
async function checkForDuplicate(bookingData: ProcessedBooking): Promise<boolean> {
  try {
    const database = getDb()

    // Check in bookings collection (unified collection for sync)
    const bookingsQuery = query(
      collection(database, 'bookings'),
      where('duplicateCheckHash', '==', bookingData.duplicateCheckHash)
    )

    // Check in legacy collections for backward compatibility
    const pendingQuery = query(
      collection(database, 'pending_bookings'),
      where('duplicateCheckHash', '==', bookingData.duplicateCheckHash)
    )

    const liveQuery = query(
      collection(database, 'live_bookings'),
      where('duplicateCheckHash', '==', bookingData.duplicateCheckHash)
    )

    const [bookingsSnapshot, pendingSnapshot, liveSnapshot] = await Promise.all([
      getDocs(bookingsQuery),
      getDocs(pendingQuery),
      getDocs(liveQuery)
    ])

    return !bookingsSnapshot.empty || !pendingSnapshot.empty || !liveSnapshot.empty
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return false
  }
}

/**
 * Create a sync event for cross-platform tracking
 */
async function createSyncEvent(
  type: SyncEvent['type'],
  entityId: string,
  entityType: SyncEvent['entityType'],
  triggeredBy: string = 'system',
  changes: Record<string, any> = {}
): Promise<void> {
  try {
    const database = getDb()

    const syncEvent: Omit<SyncEvent, 'id'> = {
      type,
      entityId,
      entityType,
      triggeredBy,
      triggeredByName: triggeredBy === 'system' ? 'System' : 'Unknown',
      timestamp: serverTimestamp() as any,
      changes,
      platform: 'web',
      synced: false
    }

    await addDoc(collection(database, 'sync_events'), syncEvent)
    console.log(`✅ Sync event created: ${type} for ${entityType} ${entityId}`)
  } catch (error) {
    console.error('❌ Error creating sync event:', error)
    // Don't throw error to avoid breaking the main flow
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
    
    // Create booking in Firebase with enhanced sync support
    const database = getDb()

    // Save to unified bookings collection (primary for mobile sync)
    const bookingDocRef = await addDoc(collection(database, 'bookings'), processedBooking)
    const bookingId = bookingDocRef.id

    // Save to pending_bookings collection for Back Office approval
    const pendingBookingData = {
      ...processedBooking,
      status: 'pending_approval',
      requiresApproval: true,
      backOfficeApproval: true, // Flag for Back Office processing
      priority: 'high', // High priority for new bookings
      source: 'email_automation', // Track source
      flowsToBackOffice: true // Explicit flag for Back Office workflow
    }
    const pendingDocRef = await addDoc(collection(database, 'pending_bookings'), pendingBookingData)
    const pendingBookingId = pendingDocRef.id

    const liveDocRef = await addDoc(collection(database, 'live_bookings'), processedBooking)
    const liveBookingId = liveDocRef.id

    console.log('✅ BOOKINGS API: Booking created successfully in all collections')
    console.log('✅ BOOKINGS API: Primary Booking ID:', bookingId)
    console.log('✅ BOOKINGS API: Pending Booking ID:', pendingBookingId)
    console.log('✅ BOOKINGS API: Live Booking ID:', liveBookingId)

    // Create sync event for mobile app notification
    await createSyncEvent(
      'booking_updated',
      bookingId,
      'booking',
      'make_com_automation',
      {
        action: 'created',
        status: processedBooking.status,
        property: processedBooking.property,
        guest: processedBooking.guestName
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully with cross-platform sync support.',
      bookingId,
      pendingBookingId,
      liveBookingId,
      processingTime: Date.now() - startTime,
      bookingDetails: {
        property: processedBooking.property,
        guest: processedBooking.guestName,
        checkIn: processedBooking.checkInDate,
        checkOut: processedBooking.checkOutDate,
        price: processedBooking.price,
        status: processedBooking.status
      },
      collections: {
        bookings: bookingId, // Primary collection for mobile sync
        pending_bookings: pendingBookingId,
        live_bookings: liveBookingId
      },
      syncEnabled: true
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
 * Convert Firestore booking to mobile API format
 */
function convertToMobileFormat(booking: any): ApprovedBookingData {
  return {
    id: booking.id,
    propertyId: booking.id, // Use booking ID as property ID for now
    propertyName: booking.property || booking.propertyName || 'Unknown Property',
    propertyAddress: booking.address || 'Address not available',
    guestName: booking.guestName || 'Unknown Guest',
    guestEmail: booking.guestEmail || '',
    guestPhone: booking.guestPhone || booking.phone || '',
    checkIn: booking.checkInDate || booking.checkIn || '',
    checkOut: booking.checkOutDate || booking.checkOut || '',
    status: booking.status || 'approved',
    totalAmount: booking.totalAmount || booking.price || 0,
    paymentStatus: booking.paymentStatus || 'pending',
    specialRequests: booking.specialRequests || booking.notes || '',
    assignedStaff: booking.assignedStaff || [],
    tasks: booking.tasks || [],
    createdAt: booking.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    approvedAt: booking.approvedAt?.toDate?.()?.toISOString() || booking.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
  }
}

/**
 * GET /api/bookings
 * Enhanced endpoint supporting both web dashboard and mobile app
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const mobile = searchParams.get('mobile')
    const limitParam = searchParams.get('limit')

    // Check if this is a mobile API request
    if (mobile === 'true') {
      return withMobileAuth(async (req, auth) => {
        console.log('📱 Mobile API: Fetching bookings with status:', status)

        const database = getDb()
        const maxResults = limitParam ? parseInt(limitParam) : 50

        // Build query for approved bookings
        let bookingsQuery = query(
          collection(database, 'bookings'),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        )

        // Add status filter if specified
        if (status) {
          bookingsQuery = query(
            collection(database, 'bookings'),
            where('status', '==', status),
            orderBy('createdAt', 'desc'),
            limit(maxResults)
          )
        }

        const snapshot = await getDocs(bookingsQuery)
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data()
          return convertToMobileFormat({ id: doc.id, ...data })
        })

        console.log(`✅ Mobile API: Returning ${bookings.length} bookings`)

        return createMobileSuccessResponse({
          bookings,
          count: bookings.length,
          status: status || 'all',
          lastSync: Date.now()
        })
      })(request)
    }

    // Original health check and API documentation for web
    return NextResponse.json({
      success: true,
      message: 'Bookings API is operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        POST: 'Create new booking from Make.com',
        GET: 'Health check and API documentation',
        'GET?mobile=true&status=approved': 'Mobile API: Fetch approved bookings'
      },
      features: {
        validation: 'Input validation and sanitization',
        duplicateCheck: 'Prevents duplicate bookings',
        dualStorage: 'Saves to both pending_bookings and live_bookings collections',
        authentication: 'API key or development mode authentication',
        compatibility: 'Maintains compatibility with existing admin dashboards'
      },
      expectedFormat: {
        property: 'Villa Mango Beach',
        address: '55/45 Moo 8 Koh Phangan',
        guestName: 'John Smith',
        guestEmail: 'john@example.com',
        checkInDate: '2025-07-20',
        checkOutDate: '2025-07-25',
        nights: '5',
        guests: '2',
        price: '25000',
        subject: 'New Booking',
        date: '2025-07-01'
      }
    })
  } catch (error) {
    console.error('Service health check failed:', error)
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
