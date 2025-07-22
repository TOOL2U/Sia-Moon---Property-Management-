import { getDb } from '@/lib/firebase'
import { collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Mobile Notifications API
 * Provides endpoints for mobile apps to query and manage notifications
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId') // Firebase UID
    const limitParam = searchParams.get('limit')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId parameter is required' },
        { status: 400 }
      )
    }

    console.log(`📱 Mobile API: Fetching notifications for staff UID: ${staffId}`)

    const db = getDb()

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      )
    }

    // Query notifications for this staff member
    let notificationQuery = query(
      collection(db, 'notifications'),
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc')
    )

    // Add unread filter if requested
    if (unreadOnly) {
      notificationQuery = query(
        collection(db, 'notifications'),
        where('staffId', '==', staffId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      )
    }

    // Add limit if specified
    if (limitParam) {
      const limitNum = parseInt(limitParam, 10)
      if (limitNum > 0 && limitNum <= 100) {
        notificationQuery = query(notificationQuery, limit(limitNum))
      }
    }

    const notificationDocs = await getDocs(notificationQuery)

    const notifications = notificationDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings for mobile app
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || doc.data().expiresAt,
    }))

    console.log(`✅ Found ${notifications.length} notifications for staff UID: ${staffId}`)

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      staffId
    })

  } catch (error) {
    console.error('❌ Error fetching mobile notifications:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationId, staffId } = body

    if (!action || !staffId) {
      return NextResponse.json(
        { error: 'action and staffId are required' },
        { status: 400 }
      )
    }

    console.log(`📱 Mobile API: Processing action '${action}' for staff UID: ${staffId}`)

    const db = getDb()

    switch (action) {
      case 'mark_read':
        if (!notificationId) {
          return NextResponse.json(
            { error: 'notificationId is required for mark_read action' },
            { status: 400 }
          )
        }

        await updateDoc(doc(db, 'notifications', notificationId), {
          read: true,
          readAt: new Date(),
          delivered: true
        })

        console.log(`✅ Marked notification ${notificationId} as read`)

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read',
          notificationId
        })

      case 'mark_all_read':
        // Query all unread notifications for this staff member
        const unreadQuery = query(
          collection(db, 'notifications'),
          where('staffId', '==', staffId),
          where('read', '==', false)
        )

        const unreadDocs = await getDocs(unreadQuery)

        // Update all unread notifications
        const updatePromises = unreadDocs.docs.map(doc =>
          updateDoc(doc.ref, {
            read: true,
            readAt: new Date(),
            delivered: true
          })
        )

        await Promise.all(updatePromises)

        console.log(`✅ Marked ${unreadDocs.docs.length} notifications as read for staff UID: ${staffId}`)

        return NextResponse.json({
          success: true,
          message: `Marked ${unreadDocs.docs.length} notifications as read`,
          count: unreadDocs.docs.length
        })

      case 'register_fcm_token':
        const { fcmToken, platform } = body

        if (!fcmToken) {
          return NextResponse.json(
            { error: 'fcmToken is required for register_fcm_token action' },
            { status: 400 }
          )
        }

        // Import MobileNotificationService dynamically
        const { MobileNotificationService } = await import('@/services/MobileNotificationService')

        const result = await MobileNotificationService.registerFCMToken(
          staffId,
          fcmToken,
          platform || 'android'
        )

        return NextResponse.json(result)

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error processing mobile notification action:', error)
    return NextResponse.json(
      {
        error: 'Failed to process action',
        details: error instanceof Error ? error.message : 'Unknown error'
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
