/**
 * Firebase Cloud Functions Entry Point
 * Sia Moon Property Management - Job Assignment Notifications
 */

import * as functions from 'firebase-functions'

// Import job notification functions
import {
  onJobAssigned,
  onNotificationAcknowledged,
  cleanupExpiredNotifications
} from './jobNotifications'

// Export job notification functions
export {
  onJobAssigned,
  onNotificationAcknowledged,
  cleanupExpiredNotifications
}

// Health check function
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    functions: [
      'onJobAssigned',
      'onNotificationAcknowledged', 
      'cleanupExpiredNotifications'
    ]
  })
})

// Configure function settings
functions.logger.info('🚀 Sia Moon Job Notification Functions initialized')
