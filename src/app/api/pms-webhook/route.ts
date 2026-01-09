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
import { CalendarAvailabilityService } from '@/services/CalendarAvailabilityService'
import { operationsAutomationService } from '@/services/OperationsAutomationService'

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
      ...(data.makeComFlowId && { makeComFlowId: data.makeComFlowId })
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
 * Generate idempotency key for webhook processing
 * Format: source + externalBookingId + action + timestamp_hour
 */
function generateIdempotencyKey(data: PMSBookingData): string {
  // Round timestamp to hour to handle minor timing differences
  const hourTimestamp = new Date(data.webhookTimestamp)
  hourTimestamp.setMinutes(0, 0, 0)
  
  return `${data.source}-${data.externalBookingId}-${data.action}-${hourTimestamp.getTime()}`
}

/**
 * Check if webhook has been processed before using idempotency key
 */
async function checkWebhookIdempotency(idempotencyKey: string) {
  try {
    const db = getDb()
    const q = query(
      collection(db, 'webhook_events'),
      where('idempotencyKey', '==', idempotencyKey)
    )
    
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const existingEvent = snapshot.docs[0].data()
      console.log('🔄 Duplicate webhook detected, returning existing result')
      return {
        isDuplicate: true,
        existingResult: existingEvent.result
      }
    }
    
    return { isDuplicate: false }
  } catch (error) {
    console.error('❌ Error checking webhook idempotency:', error)
    return { isDuplicate: false } // Fail open to allow processing
  }
}

/**
 * Store webhook event for idempotency tracking
 */
async function storeWebhookEvent(idempotencyKey: string, data: PMSBookingData, result: any) {
  try {
    const db = getDb()
    await addDoc(collection(db, 'webhook_events'), {
      idempotencyKey,
      source: data.source,
      externalBookingId: data.externalBookingId,
      action: data.action,
      webhookTimestamp: new Date(data.webhookTimestamp),
      processedAt: serverTimestamp(),
      result: {
        success: result.success,
        bookingId: result.bookingId,
        action: result.action
      }
    })
    console.log('📝 Webhook event stored for idempotency tracking')
  } catch (error) {
    console.error('⚠️ Warning: Could not store webhook event for idempotency:', error)
    // Don't fail the webhook processing if we can't store the event
  }
}
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
  
  // CRITICAL: Check calendar availability first - Calendar is the single source of truth
  const availabilityCheck = await CalendarAvailabilityService.checkAvailability({
    propertyId: data.propertyId,
    startDate: data.checkInDate,
    endDate: data.checkOutDate
  })
  
  const propertyResult = availabilityCheck.find(r => r.propertyId === data.propertyId)
  if (!propertyResult?.isAvailable) {
    console.log('❌ Booking rejected - calendar unavailable:', propertyResult?.conflicts)
    throw new Error(`Calendar unavailable: ${propertyResult?.conflicts?.map((c: any) => c.reason).join(', ')}`)
  }
  
  // Block the dates in calendar BEFORE creating booking records
  const blockResult = await CalendarAvailabilityService.blockProperty({
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    startDate: data.checkInDate,
    endDate: data.checkOutDate,
    blockType: 'booking',
    reason: 'Guest Booking',
    status: 'active',
    sourceType: 'pms_webhook',
    sourceId: data.externalBookingId,
    createdBy: 'pms_webhook',
    guestName: data.guestName,
    externalBookingId: data.externalBookingId,
    priority: 'high'
  })
  
  if (!blockResult.success) {
    console.log('❌ Calendar blocking failed:', blockResult.conflicts)
    throw new Error(`Calendar blocking failed: ${blockResult.conflicts?.map((c: any) => c.reason).join(', ')}`)
  }
  
  console.log('✅ Calendar dates blocked:', blockResult.blockId)
  
  // Create in multiple collections for compatibility
  const bookingDoc = await addDoc(collection(db, 'bookings'), {
    ...normalizedData,
    calendarBlockId: blockResult.blockId // Link to calendar block
  })
  const pendingDoc = await addDoc(collection(db, 'pending_bookings'), {
    ...normalizedData,
    priority: 'high',
    source: 'pms_webhook',
    calendarBlockId: blockResult.blockId // Link to calendar block
  })

  // 🎯 PHASE 3: Create operational timeline for automated property management
  try {
    console.log('🎯 Creating operational timeline for booking:', bookingDoc.id)
    await operationsAutomationService.createOperationalTimeline(bookingDoc.id, normalizedData)
    console.log('✅ Operational timeline created successfully')
  } catch (timelineError) {
    console.error('⚠️ Failed to create operational timeline:', timelineError)
    // Don't fail the entire booking - timeline can be created manually
  }
  
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
  const existingData = existing.doc.data()
  const normalizedData = normalizePMSData(data)
  
  // Check if dates are changing
  const dateChanged = (
    existingData.checkInDate !== data.checkInDate ||
    existingData.checkOutDate !== data.checkOutDate
  )
  
  if (dateChanged) {
    console.log('📅 Dates changed, updating calendar blocks')
    
    // Check availability for new dates first
    const availabilityCheck = await CalendarAvailabilityService.checkAvailability({
      propertyId: data.propertyId,
      startDate: data.checkInDate,
      endDate: data.checkOutDate,
      excludeBlockIds: existingData.calendarBlockId ? [existingData.calendarBlockId] : []
    })
    
    const propertyResult = availabilityCheck.find(r => r.propertyId === data.propertyId)
    if (!propertyResult?.isAvailable) {
      console.log('❌ Date change rejected - calendar unavailable:', propertyResult?.conflicts)
      throw new Error(`Calendar unavailable for new dates: ${propertyResult?.conflicts?.map((c: any) => c.reason).join(', ')}`)
    }
    
    // Remove old calendar block if it exists
    if (existingData.calendarBlockId) {
      console.log('🗑️ Removing old calendar block for booking:', data.externalBookingId)
      await CalendarAvailabilityService.unblockProperty(
        data.externalBookingId, 
        'pms_webhook',
        'Date modification'
      )
    }
    
    // Create new calendar block
    const blockResult = await CalendarAvailabilityService.blockProperty({
      propertyId: data.propertyId,
      propertyName: data.propertyName,
      startDate: data.checkInDate,
      endDate: data.checkOutDate,
      blockType: 'booking',
      reason: 'Guest Booking (Modified)',
      status: 'active',
      sourceType: 'pms_webhook',
      sourceId: data.externalBookingId,
      createdBy: 'pms_webhook',
      guestName: data.guestName,
      externalBookingId: data.externalBookingId,
      priority: 'high'
    })
    
    if (!blockResult.success) {
      console.log('❌ Calendar reblocking failed:', blockResult.conflicts)
      throw new Error(`Calendar reblocking failed: ${blockResult.conflicts?.map((c: any) => c.reason).join(', ')}`)
    }
    
    console.log('✅ Calendar dates reblocked:', blockResult.blockId)
    normalizedData.calendarBlockId = blockResult.blockId
  }
  
  // Track the modification
  const updateData = {
    ...normalizedData,
    modifiedAt: serverTimestamp(),
    ...(data.originalCheckInDate && { originalCheckInDate: data.originalCheckInDate }),
    ...(data.originalCheckOutDate && { originalCheckOutDate: data.originalCheckOutDate }),
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
    requiresReapproval: true,
    dateChanged,
    ...(dateChanged && { newCalendarBlockId: normalizedData.calendarBlockId })
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
  
  // CRITICAL: Release calendar dates first
  console.log('🔓 Releasing calendar dates for cancelled booking')
  const unblockResult = await CalendarAvailabilityService.unblockProperty(
    data.externalBookingId,
    'pms_webhook', 
    'Booking cancelled'
  )
  
  console.log(`✅ Released ${unblockResult.unblockedCount} calendar blocks`)
  
  // Update status instead of deleting to maintain audit trail
  await updateDoc(doc(db, existing.collection, existing.doc.id), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    cancellationSource: 'pms_webhook',
    cancellationReason: 'External PMS cancellation',
    calendarReleased: true,
    releasedBlocks: unblockResult.unblockedCount
  })
  
  console.log('✅ Booking cancelled:', existing.doc.id)
  
  return {
    success: true,
    action: 'cancelled',
    bookingId: existing.doc.id,
    collection: existing.collection,
    releasedBlocks: unblockResult.unblockedCount
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
    
    // 🔴 CRITICAL SECURITY: Check webhook idempotency to prevent duplicate processing
    const idempotencyKey = generateIdempotencyKey(data)
    const idempotencyCheck = await checkWebhookIdempotency(idempotencyKey)
    
    if (idempotencyCheck.isDuplicate) {
      console.log('✅ Returning existing result for duplicate webhook')
      return NextResponse.json(idempotencyCheck.existingResult)
    }
    
    console.log(`📋 Processing ${data.action} for booking ${data.externalBookingId} from ${data.source}`)
    console.log(`🔑 Idempotency key: ${idempotencyKey}`)
    
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
      success: result.success,
      idempotencyKey
    })
    
    // 🔴 CRITICAL: Store webhook event for idempotency tracking
    await storeWebhookEvent(idempotencyKey, data, result)
    
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
