/**
 * Admin Manual Push Notification API
 * Allows administrators to send manual push notifications to staff members
 */

import { NextRequest, NextResponse } from 'next/server'
import ExpoPushService from '@/services/ExpoPushService'
import { getDb } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

/**
 * Simple admin authentication check
 * In production, this should be replaced with proper JWT/session validation
 */
async function authenticateAdmin(request: NextRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' }
    }

    // For now, we'll use a simple API key check
    // In production, validate JWT token or session
    const token = authHeader.replace('Bearer ', '')
    const adminApiKey = process.env.ADMIN_API_KEY || 'admin-sia-moon-2025-secure'
    
    if (token !== adminApiKey) {
      return { success: false, error: 'Invalid admin credentials' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Validate staff member exists and is active
 */
async function validateStaffMember(staffId: string): Promise<{ success: boolean; staff?: any; error?: string }> {
  try {
    const db = getDb()
    
    // Check if staff member exists in staff_accounts collection
    const staffRef = doc(db, 'staff_accounts', staffId)
    const staffDoc = await getDoc(staffRef)
    
    if (!staffDoc.exists()) {
      return { success: false, error: `Staff member with ID ${staffId} not found` }
    }
    
    const staffData = staffDoc.data()
    
    if (!staffData.isActive) {
      return { success: false, error: `Staff member ${staffId} is not active` }
    }
    
    return { success: true, staff: { id: staffDoc.id, ...staffData } }
  } catch (error) {
    return { success: false, error: 'Failed to validate staff member' }
  }
}

/**
 * POST /api/admin/send-push-notification
 * Send manual push notification to staff member(s)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { staffId, staffIds, title, message, jobId, priority = 'medium', data } = body

    console.log('📱 Admin manual push notification request:', { 
      staffId, 
      staffIds, 
      title, 
      priority 
    })

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, message' },
        { status: 400 }
      )
    }

    // Determine target staff IDs
    let targetStaffIds: string[] = []
    
    if (staffId) {
      targetStaffIds = [staffId]
    } else if (staffIds && Array.isArray(staffIds)) {
      targetStaffIds = staffIds
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide either staffId or staffIds array' },
        { status: 400 }
      )
    }

    // Validate all staff members
    const validationResults = await Promise.all(
      targetStaffIds.map(id => validateStaffMember(id))
    )

    const invalidStaff = validationResults.filter(result => !result.success)
    if (invalidStaff.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid staff members found',
          details: invalidStaff.map(result => result.error)
        },
        { status: 400 }
      )
    }

    // Prepare notification data
    const notificationData = {
      jobId,
      priority,
      screen: jobId ? 'JobDetails' : 'Notifications',
      timestamp: new Date().toISOString(),
      isManualNotification: true,
      sentBy: 'admin',
      ...data
    }

    // Send push notifications
    const result = await ExpoPushService.sendToStaff(
      targetStaffIds,
      title,
      message,
      notificationData
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Manual push notifications sent to ${targetStaffIds.length} staff members`)

    return NextResponse.json({
      success: true,
      data: {
        targetStaffIds,
        title,
        message,
        priority,
        results: result.results,
        sentAt: new Date().toISOString()
      },
      message: `Push notifications sent to ${targetStaffIds.length} staff member(s)`
    })

  } catch (error) {
    console.error('❌ Admin manual push notification API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send push notification'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/send-push-notification
 * Get list of active staff members for notification targeting
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const db = getDb()
    
    // Get all active staff members
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('isActive', '==', true)
    )
    
    const staffSnapshot = await getDocs(staffQuery)
    
    const staffMembers = staffSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        hasExpoPushToken: !!data.expoPushToken && data.expoPushTokenIsValid !== false
      }
    })

    // Sort by name
    staffMembers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    return NextResponse.json({
      success: true,
      data: {
        staffMembers,
        totalCount: staffMembers.length,
        withExpoPushTokens: staffMembers.filter(s => s.hasExpoPushToken).length
      },
      message: `Found ${staffMembers.length} active staff members`
    })

  } catch (error) {
    console.error('❌ Admin get staff members API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get staff members'
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
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
