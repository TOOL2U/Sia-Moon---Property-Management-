/**
 * Firebase Messaging Service Worker
 * Handles background push notifications for Sia Moon staff app
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js')

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Initialize Firebase Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Background message received:', payload)

  const { notification, data } = payload

  // Customize notification based on job data
  const notificationTitle = notification?.title || '🎯 New Job Assignment'
  const notificationOptions = {
    body: notification?.body || 'You have a new job assignment',
    icon: '/icons/notification-icon-192.png',
    badge: '/icons/badge-icon-72.png',
    tag: data?.jobId || 'job-notification',
    requireInteraction: data?.priority === 'urgent',
    actions: [
      {
        action: 'view',
        title: '👀 View Job',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'accept',
        title: '✅ Accept',
        icon: '/icons/accept-icon.png'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    data: {
      ...data,
      timestamp: Date.now(),
      url: data?.jobId ? `/jobs/${data.jobId}` : '/jobs'
    },
    vibrate: data?.priority === 'urgent' ? [200, 100, 200] : [100],
    silent: false
  }

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event)

  const { action, notification } = event
  const data = notification.data || {}

  event.notification.close()

  // Handle different actions
  switch (action) {
    case 'view':
      // Open job details page
      event.waitUntil(
        clients.openWindow(data.url || '/jobs')
      )
      break

    case 'accept':
      // Accept job directly from notification
      event.waitUntil(
        handleJobAcceptance(data.jobId)
      )
      break

    case 'dismiss':
      // Just close the notification
      break

    default:
      // Default action - open the app
      event.waitUntil(
        clients.openWindow(data.url || '/jobs')
      )
      break
  }

  // Track notification interaction
  trackNotificationInteraction(data.jobId, action || 'click')
})

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Notification closed:', event)

  const data = event.notification.data || {}
  trackNotificationInteraction(data.jobId, 'close')
})

/**
 * Handle job acceptance from notification
 */
async function handleJobAcceptance(jobId) {
  try {
    if (!jobId) return

    // Get the current client (if app is open)
    const clients_list = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // If app is open, send message to accept job
    if (clients_list.length > 0) {
      clients_list[0].postMessage({
        type: 'ACCEPT_JOB_FROM_NOTIFICATION',
        jobId: jobId
      })
    } else {
      // If app is not open, store the action and open the app
      await storeNotificationAction(jobId, 'accept')
      await clients.openWindow(`/jobs/${jobId}?action=accept`)
    }

  } catch (error) {
    console.error('❌ Error handling job acceptance:', error)
  }
}

/**
 * Store notification action for later processing
 */
async function storeNotificationAction(jobId, action) {
  try {
    // Store in IndexedDB for persistence
    const request = indexedDB.open('SiaMoonNotifications', 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')

      store.add({
        jobId,
        action,
        timestamp: Date.now(),
        processed: false
      })
    }

  } catch (error) {
    console.error('❌ Error storing notification action:', error)
  }
}

/**
 * Track notification interactions for analytics
 */
function trackNotificationInteraction(jobId, action) {
  try {
    // Send tracking data to analytics endpoint
    fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        action,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.error('❌ Error tracking notification interaction:', error)
    })

  } catch (error) {
    console.error('❌ Error in tracking function:', error)
  }
}

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed:', event)

  event.waitUntil(
    // Re-subscribe with new endpoint
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'your-vapid-key'
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/push/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })
    })
  )
})

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('🚀 Service worker activated')

  // Clean up old caches if needed
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('sia-moon-old-')) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('📦 Service worker installed')

  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Handle sync events for offline functionality
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)

  if (event.tag === 'job-status-sync') {
    event.waitUntil(syncJobStatuses())
  }
})

/**
 * Sync job statuses when back online
 */
async function syncJobStatuses() {
  try {
    // Get pending job status updates from IndexedDB
    const request = indexedDB.open('SiaMoonJobs', 1)

    request.onsuccess = async (event) => {
      const db = event.target.result
      const transaction = db.transaction(['pending_updates'], 'readonly')
      const store = transaction.objectStore('pending_updates')

      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = async () => {
        const pendingUpdates = getAllRequest.result

        // Sync each pending update
        for (const update of pendingUpdates) {
          try {
            await fetch('/api/mobile/jobs', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'sia-moon-mobile-app-2025-secure-key',
                'X-Mobile-Secret': 'mobile-app-sync-2025-secure'
              },
              body: JSON.stringify(update)
            })

            // Remove from pending updates after successful sync
            const deleteTransaction = db.transaction(['pending_updates'], 'readwrite')
            const deleteStore = deleteTransaction.objectStore('pending_updates')
            deleteStore.delete(update.id)

          } catch (error) {
            console.error('❌ Error syncing job status:', error)
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in background sync:', error)
  }
}

console.log('🔔 Firebase Messaging Service Worker loaded')
