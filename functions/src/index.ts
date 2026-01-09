/**
 * Firebase Cloud Functions Entry Point
 * Sia Moon Property Management - Job Assignment Notifications & Timeout Monitoring
 */

import * as functions from 'firebase-functions'

// Import job notification functions
import {
  onJobAssigned,
  onNotificationAcknowledged,
  cleanupExpiredNotifications
} from './jobNotifications'

// Import job timeout monitoring functions
import {
  jobTimeoutMonitor,
  triggerTimeoutCheck
} from './jobTimeoutMonitor'

// Export job notification functions
export {
  onJobAssigned,
  onNotificationAcknowledged,
  cleanupExpiredNotifications
}

// Export job timeout monitoring functions  
export {
  jobTimeoutMonitor,
  triggerTimeoutCheck
}

// Health check function
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    functions: [
      'onJobAssigned',
      'onNotificationAcknowledged', 
      'cleanupExpiredNotifications',
      'jobTimeoutMonitor',
      'triggerTimeoutCheck'
    ]
  })
})

// Configure function settings
functions.logger.info('🚀 Sia Moon Job Notification & Timeout Monitoring Functions initialized')
