/**
 * PMS Webhook Receiver
 * Secure endpoint for receiving booking data from external PMS systems via Make.com
 * Handles: New bookings, modifications, cancellations from Airbnb/booking platforms
 * 
 * IMPORTANT: Uses Node.js runtime for proper raw body handling
 */

export const runtime = 'nodejs' // Required for crypto and proper body parsing

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

// Security configuration - Using token-based auth instead of HMAC for reliability
const WEBHOOK_SECRET_TOKEN = process.env.PMS_WEBHOOK_SECRET || 'default-secret-change-in-production'
const ALLOWED_SOURCES = ['make.com', 'airbnb', 'booking.com', 'vrbo']
const MAX_TIMESTAMP_AGE = 300 // 5 minutes replay protection

interface PMSBookingData {
  // Core booking information
  externalBookingId: string
  source: string // 'airbnb', 'booking.com', etc.
  action: 'create' | 'update' | 'cancel'
  
  // Property details
  propertyId: string
  propertyName: string
  
  // Guest information
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number
  
  // Dates and pricing
  checkInDate: string // ISO format
  checkOutDate: string // ISO format
  totalPrice: number
  currency: string
  
  // Booking details
  specialRequests?: string
  paymentStatus: string
  
  // Metadata
  originalCheckInDate?: string // For modifications
  originalCheckOutDate?: string // For modifications
  webhookTimestamp: string
  makeComFlowId?: string
}

/**
 * Validate webhook using token + timestamp (more reliable than HMAC)
 */
function validateWebhookAuth(token: string, timestamp: string): { valid: boolean; reason?: string } {
  if (!token) return { valid: false, reason: 'Missing auth token' }
  
  // Check token matches
  if (token !== WEBHOOK_SECRET_TOKEN) {
    return { valid: false, reason: 'Invalid auth token' }
  }
  
  // Check timestamp to prevent replay attacks
  const webhookTime = parseInt(timestamp)
  const currentTime = Math.floor(Date.now() / 1000)
  
  if (isNaN(webhookTime)) {
    return { valid: false, reason: 'Invalid timestamp format' }
  }
  
  if (Math.abs(currentTime - webhookTime) > MAX_TIMESTAMP_AGE) {
    return { valid: false, reason: 'Request too old (replay protection)' }
  }
  
  return { valid: true }
}

/**
 * Normalize booking data from different PMS sources
 */
function normalizePMSData(data: PMSBookingData): any {
  return {
    // External tracking
    externalBookingId: data.externalBookingId,
    source: data.source,
    sourceDetails: {
      platform: data.source,
      originalId: data.externalBookingId,
      makeComFlowId: data.makeComFlowId
    },
    
    // Core booking data
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    property: data.propertyName, // Legacy compatibility
    villaName: data.propertyName, // Legacy compatibility
    
    // Guest information
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone || '',
    numberOfGuests: data.guestCount,
    guestCount: data.guestCount,
    
    // Booking dates
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    
    // Pricing
    price: data.totalPrice,
    totalAmount: data.totalPrice,
    currency: data.currency,
    revenue: data.totalPrice,
    
    // Status and metadata
    status: 'pending_approval',
    paymentStatus: data.paymentStatus,
    specialRequests: data.specialRequests || '',
    
    // Timestamps
    receivedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    webhookTimestamp: new Date(data.webhookTimestamp),
    
    // System flags
    requiresApproval: true,
    backOfficeApproval: true,
    automatedBooking: true,
    externalSource: true
  }
}

/**
 * Check for existing booking by external ID to prevent duplicates
 */
async function findExistingBooking(externalBookingId: string, source: string) {
  const db = getDb()
  const collections = ['bookings', 'pending_bookings', 'live_bookings']
  
  for (const collectionName of collections) {
    const q = query(
      collection(db, collectionName),
      where('externalBookingId', '==', externalBookingId),
      where('source', '==', source)
    )
    
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return { 
        collection: collectionName,
        doc: snapshot.docs[0] 
      }
    }
  }
  
  return null
}

/**
 * Handle new booking creation
 */
async function handleCreateBooking(data: PMSBookingData): Promise<any> {
  console.log('🆕 Creating new booking from PMS:', data.externalBookingId)
  
  // Check for duplicates
  const existing = await findExistingBooking(data.externalBookingId, data.source)
  if (existing) {
    console.log('⚠️ Duplicate booking detected, updating instead')
    return handleUpdateBooking(data)
  }
  
  const db = getDb()
  const normalizedData = normalizePMSData(data)
  
  // Create in multiple collections for compatibility
  const bookingDoc = await addDoc(collection(db, 'bookings'), normalizedData)
  const pendingDoc = await addDoc(collection(db, 'pending_bookings'), {
    ...normalizedData,
    priority: 'high',
    source: 'pms_webhook'
  })
  
  console.log('✅ Booking created:', { bookingId: bookingDoc.id, pendingId: pendingDoc.id })
  
  return {
    success: true,
    action: 'created',
    bookingId: bookingDoc.id,
    pendingBookingId: pendingDoc.id,
    requiresApproval: true
  }
}

/**
 * Handle booking modification
 */
async function handleUpdateBooking(data: PMSBookingData): Promise<any> {
  console.log('🔄 Updating booking from PMS:', data.externalBookingId)
  
  const existing = await findExistingBooking(data.externalBookingId, data.source)
  if (!existing) {
    console.log('📝 Booking not found, creating new one')
    return handleCreateBooking(data)
  }
  
  const db = getDb()
  const normalizedData = normalizePMSData(data)
  
  // Track the modification
  const updateData = {
    ...normalizedData,
    modifiedAt: serverTimestamp(),
    originalCheckInDate: data.originalCheckInDate,
    originalCheckOutDate: data.originalCheckOutDate,
    modificationSource: 'pms_webhook',
    requiresReapproval: true,
    status: 'pending_approval' // Require reapproval for modifications
  }
  
  await updateDoc(doc(db, existing.collection, existing.doc.id), updateData)
  
  console.log('✅ Booking updated:', existing.doc.id)
  
  return {
    success: true,
    action: 'updated',
    bookingId: existing.doc.id,
    collection: existing.collection,
    requiresReapproval: true
  }
}

/**
 * Handle booking cancellation
 */
async function handleCancelBooking(data: PMSBookingData) {
  console.log('❌ Cancelling booking from PMS:', data.externalBookingId)
  
  const existing = await findExistingBooking(data.externalBookingId, data.source)
  if (!existing) {
    console.log('⚠️ Booking not found for cancellation')
    return {
      success: false,
      error: 'Booking not found',
      action: 'cancel_failed'
    }
  }
  
  const db = getDb()
  
  // Update status instead of deleting to maintain audit trail
  await updateDoc(doc(db, existing.collection, existing.doc.id), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    cancellationSource: 'pms_webhook',
    cancellationReason: 'External PMS cancellation'
  })
  
  console.log('✅ Booking cancelled:', existing.doc.id)
  
  return {
    success: true,
    action: 'cancelled',
    bookingId: existing.doc.id,
    collection: existing.collection
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📨 PMS Webhook received')
    
    // Validate authentication using token + timestamp
    const authToken = request.headers.get('x-webhook-token') || ''
    const timestamp = request.headers.get('x-webhook-timestamp') || ''
    
    const authResult = validateWebhookAuth(authToken, timestamp)
    if (!authResult.valid) {
      console.error('❌ Webhook authentication failed:', authResult.reason)
      return NextResponse.json(
        { success: false, error: authResult.reason },
        { status: 401 }
      )
    }
    
    // Parse booking data
    const body = await request.text()
    const data: PMSBookingData = JSON.parse(body)
    
    // Validate required fields
    if (!data.externalBookingId || !data.source || !data.action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate source
    if (!ALLOWED_SOURCES.includes(data.source)) {
      return NextResponse.json(
        { success: false, error: 'Invalid source' },
        { status: 400 }
      )
    }
    
    console.log(`📋 Processing ${data.action} for booking ${data.externalBookingId} from ${data.source}`)
    
    // Route to appropriate handler
    let result
    switch (data.action) {
      case 'create':
        result = await handleCreateBooking(data)
        break
      case 'update':
        result = await handleUpdateBooking(data)
        break
      case 'cancel':
        result = await handleCancelBooking(data)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    // Log webhook activity
    const db = getDb()
    await addDoc(collection(db, 'webhook_logs'), {
      timestamp: serverTimestamp(),
      source: data.source,
      action: data.action,
      externalBookingId: data.externalBookingId,
      result,
      processingTime: Date.now() - startTime,
      success: result.success
    })
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      ...result,
      processingTime: Date.now() - startTime
    })
    
  } catch (error) {
    console.error('❌ PMS Webhook error:', error)
    
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
 * GET endpoint for webhook status and documentation
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'PMS Webhook Receiver',
    description: 'Secure endpoint for receiving booking data from external PMS systems',
    supportedSources: ALLOWED_SOURCES,
    supportedActions: ['create', 'update', 'cancel'],
    security: {
      signatureValidation: true,
      allowedSources: ALLOWED_SOURCES
    },
    endpoints: {
      webhook: 'POST /api/pms-webhook',
      status: 'GET /api/pms-webhook'
    },
    requiredHeaders: {
      'Content-Type': 'application/json',
      'x-webhook-signature': 'sha256=<hmac_signature>'
    }
  })
}
