/**
 * Quick Notification Test Script
 * Run this to verify notification fixes are working
 */

console.log('🧪 Starting notification verification test...')

async function quickNotificationTest() {
  try {
    // Test 1: Create a single test job
    console.log('📝 Creating test job assignment...')

    const response = await fetch('/api/jobs/create-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🧪 NOTIFICATION FIX TEST',
        staffEmail: 'staff@siamoon.com',
        priority: 'medium',
        testMode: true
      })
    })

    const testJob = await response.json()
    console.log(`✅ Test job created: ${testJob.id}`)

    // Test 2: Monitor notifications
    console.log('👀 Monitoring notifications for 10 seconds...')

    let notificationCount = 0

    // Listen for notifications
    const notificationsRef = collection(db, 'staff_notifications')
    const q = query(
      notificationsRef,
      where('jobId', '==', testJob.id),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          notificationCount++
          console.log(`📱 Notification ${notificationCount} received at ${new Date().toISOString()}`)
        }
      })
    })

    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000))
    unsubscribe()

    // Test 3: Results
    console.log('\n📊 TEST RESULTS:')
    console.log(`===============`)
    console.log(`Notifications received: ${notificationCount}`)

    if (notificationCount === 1) {
      console.log('✅ SUCCESS! Exactly 1 notification received (fixed!)')
    } else if (notificationCount === 0) {
      console.log('⚠️ WARNING: No notifications received (check if system is working)')
    } else {
      console.log(`❌ FAILURE: ${notificationCount} notifications received (still duplicating!)`)
    }

    return notificationCount

  } catch (error) {
    console.error('❌ Test failed:', error)
    return -1
  }
}

// Export for use in other files
export { quickNotificationTest }

// Run immediately if called directly
if (typeof window !== 'undefined') {
  quickNotificationTest()
}
