#!/usr/bin/env node

/**
 * Check Mobile Notifications Script
 *
 * This script checks if notifications are being created for mobile app
 * and verifies the URGENT alert settings are working
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkNotifications() {
  try {
    log('\n🔍 CHECKING MOBILE NOTIFICATIONS', 'bright')
    log('='.repeat(50), 'blue')

    const testStaffUid = 'gTtR5gSKOtUEweLwchSnVreylMy1'

    // Check all notifications
    log('\n📱 Checking all notifications...', 'cyan')
    const allNotificationsSnapshot = await db.collection('notifications').get()
    log(
      `📊 Total notifications in database: ${allNotificationsSnapshot.size}`,
      'blue'
    )

    if (allNotificationsSnapshot.size === 0) {
      log('⚠️ No notifications found in database!', 'yellow')
      log('💡 Try sending a test job first', 'blue')
      return
    }

    // Show sample notification structure
    log('\n🔍 Sample notification structure:', 'cyan')
    const sampleDoc = allNotificationsSnapshot.docs[0]
    const sampleData = sampleDoc.data()
    log(`   Sample ID: ${sampleDoc.id}`, 'blue')
    log(`   Fields: ${Object.keys(sampleData).join(', ')}`, 'blue')

    // Check for staff-related fields
    const staffFields = Object.keys(sampleData).filter(
      (key) =>
        key.toLowerCase().includes('staff') ||
        key.toLowerCase().includes('user') ||
        key.toLowerCase().includes('recipient')
    )
    log(
      `   Staff-related fields: ${staffFields.join(', ') || 'None found'}`,
      'blue'
    )

    // Check notifications for test staff
    log(`\n👤 Checking notifications for staff UID: ${testStaffUid}`, 'cyan')

    const staffNotificationsSnapshot = await db
      .collection('notifications')
      .where('staffId', '==', testStaffUid)
      .get()

    log(
      `📊 Notifications for test staff: ${staffNotificationsSnapshot.size}`,
      'blue'
    )

    if (staffNotificationsSnapshot.size === 0) {
      log('⚠️ No notifications found for test staff!', 'yellow')
      log('💡 The notifications might be using a different field name', 'blue')

      // Check for alternative field names
      log('\n🔍 Checking for alternative field names...', 'cyan')

      const recipientNotifications = await db
        .collection('notifications')
        .where('recipientId', '==', testStaffUid)
        .get()

      if (recipientNotifications.size > 0) {
        log(
          `✅ Found ${recipientNotifications.size} notifications using 'recipientId' field`,
          'green'
        )
      }

      return
    }

    // Display notification details
    log('\n🚨 NOTIFICATION DETAILS:', 'bright')
    log('-'.repeat(50), 'blue')

    staffNotificationsSnapshot.forEach((doc, index) => {
      const notification = doc.data()

      log(`\n📋 Notification ${index + 1}:`, 'cyan')
      log(`   ID: ${doc.id}`, 'blue')
      log(
        `   Title: ${notification.title}`,
        notification.urgent ? 'red' : 'blue'
      )
      log(`   Type: ${notification.type}`, 'blue')
      log(
        `   🚨 Urgent: ${notification.urgent ? 'YES' : 'NO'}`,
        notification.urgent ? 'red' : 'yellow'
      )
      log(
        `   📢 Priority: ${notification.priority || 'not set'}`,
        notification.priority === 'high' ? 'red' : 'blue'
      )
      log(
        `   🔔 Sound Alert: ${notification.soundAlert ? 'YES' : 'NO'}`,
        notification.soundAlert ? 'green' : 'yellow'
      )
      log(
        `   📳 Vibration: ${notification.vibrationPattern || 'not set'}`,
        'blue'
      )
      log(
        `   📱 Persistent: ${notification.persistentNotification ? 'YES' : 'NO'}`,
        notification.persistentNotification ? 'green' : 'yellow'
      )
      log(
        `   📖 Read: ${notification.read ? 'YES' : 'NO'}`,
        notification.read ? 'green' : 'red'
      )
      log(
        `   📅 Created: ${notification.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}`,
        'blue'
      )

      if (notification.jobData) {
        log(`   💼 Job: ${notification.jobData.title}`, 'blue')
        log(
          `   📍 Location: ${notification.jobData.location?.address || 'Not specified'}`,
          'blue'
        )
        log(
          `   ⏰ Scheduled: ${notification.jobData.scheduledDate} at ${notification.jobData.scheduledStartTime}`,
          'blue'
        )
      }

      // Check FCM payload
      if (notification.fcmPayload) {
        log(`   📲 FCM Configured: YES`, 'green')
        if (notification.fcmPayload.android) {
          log(
            `   🤖 Android Priority: ${notification.fcmPayload.android.priority}`,
            'blue'
          )
          log(
            `   🤖 Android Channel: ${notification.fcmPayload.android.notification?.channelId}`,
            'blue'
          )
        }
        if (notification.fcmPayload.apns) {
          log(
            `   🍎 iOS Priority: ${notification.fcmPayload.apns.payload?.aps?.priority}`,
            'blue'
          )
        }
      } else {
        log(`   📲 FCM Configured: NO`, 'red')
      }
    })

    // Check recent notifications (last 24 hours)
    log('\n⏰ RECENT NOTIFICATIONS (Last 24 hours):', 'bright')
    log('-'.repeat(50), 'blue')

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentNotificationsSnapshot = await db
      .collection('notifications')
      .where('staffId', '==', testStaffUid)
      .where('createdAt', '>=', yesterday)
      .get()

    log(`📊 Recent notifications: ${recentNotificationsSnapshot.size}`, 'blue')

    if (recentNotificationsSnapshot.size > 0) {
      recentNotificationsSnapshot.forEach((doc, index) => {
        const notification = doc.data()
        const urgentFlag = notification.urgent ? '🚨' : '📱'
        const priorityFlag = notification.priority === 'high' ? '🔥' : '📋'

        log(
          `   ${urgentFlag}${priorityFlag} ${notification.title}`,
          notification.urgent ? 'red' : 'blue'
        )
      })
    }

    // Summary
    log('\n📊 NOTIFICATION SUMMARY:', 'bright')
    log('='.repeat(50), 'green')

    const urgentCount = staffNotificationsSnapshot.docs.filter(
      (doc) => doc.data().urgent
    ).length
    const highPriorityCount = staffNotificationsSnapshot.docs.filter(
      (doc) => doc.data().priority === 'high'
    ).length
    const unreadCount = staffNotificationsSnapshot.docs.filter(
      (doc) => !doc.data().read
    ).length

    log(`   Total Notifications: ${staffNotificationsSnapshot.size}`, 'blue')
    log(
      `   🚨 Urgent Notifications: ${urgentCount}`,
      urgentCount > 0 ? 'red' : 'yellow'
    )
    log(
      `   🔥 High Priority: ${highPriorityCount}`,
      highPriorityCount > 0 ? 'red' : 'yellow'
    )
    log(`   📬 Unread: ${unreadCount}`, unreadCount > 0 ? 'green' : 'blue')

    if (urgentCount > 0) {
      log('\n✅ URGENT ALERTS ARE WORKING!', 'green')
      log(
        '🚨 Staff will receive LOUD notifications for new job assignments',
        'green'
      )
    } else {
      log('\n⚠️ No urgent notifications found', 'yellow')
      log(
        '💡 Try sending a new test job to trigger urgent notifications',
        'blue'
      )
    }
  } catch (error) {
    log(`❌ Error checking notifications: ${error.message}`, 'red')
    console.error(error)
  }
}

// Main execution
async function main() {
  try {
    log('🏢 SIA MOON PROPERTY MANAGEMENT', 'bright')
    log('📱 Mobile Notification Checker', 'cyan')

    await checkNotifications()

    log('\n🎯 NEXT STEPS:', 'bright')
    log('1. If no urgent notifications found, send a test job', 'blue')
    log('2. Check mobile app for notification delivery', 'blue')
    log('3. Verify sound and vibration alerts work', 'blue')
    log('4. Test notification acceptance workflow', 'blue')
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { checkNotifications }
