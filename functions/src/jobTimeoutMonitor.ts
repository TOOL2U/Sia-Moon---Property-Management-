/**
 * 🔴 CRITICAL BLOCKER #4: Automated Job Timeout Monitoring Cloud Function
 * 
 * Scheduled function that runs every 5 minutes to check for:
 * 1. Expired job offers (triggers escalation)
 * 2. Stuck accepted jobs (not started)
 * 3. Stuck started jobs (not completed)
 * 
 * BUSINESS CRITICAL: Ensures no job remains unattended without escalation
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface TimeoutConfig {
  offerTimeoutMinutes: number
  jobAcceptedTimeoutHours: number
  jobStartedTimeoutHours: number
}

const TIMEOUT_CONFIG: TimeoutConfig = {
  offerTimeoutMinutes: 15,        // Offers expire after 15 minutes
  jobAcceptedTimeoutHours: 2,     // Jobs must start within 2 hours of acceptance
  jobStartedTimeoutHours: 8       // Jobs must complete within 8 hours of starting
}

/**
 * Scheduled function: Check for job timeouts every 5 minutes
 * Runs escalation logic for expired offers and alerts for stuck jobs
 */
export const jobTimeoutMonitor = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('UTC')
  .onRun(async (context: any) => {
    const startTime = Date.now()
    functions.logger.info('🕐 Starting scheduled job timeout monitoring')

    try {
      const results = {
        expiredOffers: 0,
        stuckAcceptedJobs: 0,
        stuckStartedJobs: 0,
        adminNotifications: 0,
        errors: [] as string[]
      }

      // Check for expired offers
      results.expiredOffers = await checkExpiredOffers()
      
      // Check for stuck accepted jobs
      results.stuckAcceptedJobs = await checkStuckAcceptedJobs()
      
      // Check for stuck started jobs  
      results.stuckStartedJobs = await checkStuckStartedJobs()

      const totalProcessed = results.expiredOffers + results.stuckAcceptedJobs + results.stuckStartedJobs
      const duration = Date.now() - startTime

      if (totalProcessed > 0) {
        functions.logger.info(`✅ Job timeout check complete in ${duration}ms:`, {
          expiredOffers: results.expiredOffers,
          stuckAcceptedJobs: results.stuckAcceptedJobs,
          stuckStartedJobs: results.stuckStartedJobs,
          totalProcessed,
          duration
        })
      } else {
        functions.logger.info(`✅ No timeouts detected in ${duration}ms`)
      }

      return { success: true, results, duration }

    } catch (error) {
      functions.logger.error('❌ Error in job timeout monitor:', error)
      
      // Create critical alert for admin
      await createAdminAlert({
        type: 'timeout_monitor_failure',
        message: `Job timeout monitoring failed: ${error}`,
        priority: 'critical',
        timestamp: admin.firestore.Timestamp.now()
      })

      throw error
    }
  })

/**
 * Check for expired job offers and trigger escalation
 */
async function checkExpiredOffers(): Promise<number> {
  const now = new Date()
  const cutoffTime = new Date(now.getTime() - TIMEOUT_CONFIG.offerTimeoutMinutes * 60 * 1000)
  
  try {
    const expiredOffersRef = db.collection('job_offers')
      .where('status', '==', 'sent')
      .where('sentAt', '<', admin.firestore.Timestamp.fromDate(cutoffTime))

    const snapshot = await expiredOffersRef.get()
    
    if (snapshot.empty) {
      return 0
    }

    functions.logger.info(`⏰ Found ${snapshot.size} expired offers to process`)

    const batch = db.batch()
    let processedCount = 0

    for (const doc of snapshot.docs) {
      const offerData = doc.data()
      
      try {
        // Mark offer as expired
        batch.update(doc.ref, {
          status: 'expired',
          expiredAt: admin.firestore.Timestamp.now(),
          timeoutReason: 'offer_timeout'
        })

        // Update the related job to require escalation
        const jobRef = db.collection('jobs').doc(offerData.jobId)
        batch.update(jobRef, {
          status: 'offer_expired',
          escalationRequired: true,
          lastExpiredOffer: {
            offerId: doc.id,
            expiredAt: admin.firestore.Timestamp.now(),
            attemptNumber: offerData.attemptNumber || 1
          }
        })

        processedCount++
      } catch (error) {
        functions.logger.error(`❌ Error processing expired offer ${doc.id}:`, error)
      }
    }

    // Commit the batch
    await batch.commit()
    
    functions.logger.info(`✅ Marked ${processedCount} offers as expired`)
    return processedCount

  } catch (error) {
    functions.logger.error('❌ Error checking expired offers:', error)
    return 0
  }
}

/**
 * Check for jobs that were accepted but not started
 */
async function checkStuckAcceptedJobs(): Promise<number> {
  const now = new Date()
  const cutoffTime = new Date(now.getTime() - TIMEOUT_CONFIG.jobAcceptedTimeoutHours * 60 * 60 * 1000)

  try {
    const stuckJobsRef = db.collection('jobs')
      .where('status', '==', 'accepted')
      .where('acceptedAt', '<', admin.firestore.Timestamp.fromDate(cutoffTime))

    const snapshot = await stuckJobsRef.get()
    
    if (snapshot.empty) {
      return 0
    }

    functions.logger.warn(`🚨 Found ${snapshot.size} stuck accepted jobs`)

    const batch = db.batch()
    let processedCount = 0

    for (const doc of snapshot.docs) {
      const jobData = doc.data()
      
      try {
        // Mark job as stuck
        batch.update(doc.ref, {
          status: 'stuck_accepted',
          stuckAt: admin.firestore.Timestamp.now(),
          timeoutReason: 'accepted_not_started',
          escalationRequired: true
        })

        // Create admin notification
        await createAdminAlert({
          type: 'stuck_job_alert',
          jobId: doc.id,
          propertyName: jobData.propertyName || 'Unknown Property',
          reason: 'accepted_not_started',
          stuckSince: jobData.acceptedAt,
          assignedStaff: jobData.assignedStaffId,
          priority: 'high'
        })

        processedCount++
      } catch (error) {
        functions.logger.error(`❌ Error processing stuck accepted job ${doc.id}:`, error)
      }
    }

    await batch.commit()
    
    functions.logger.warn(`🚨 Marked ${processedCount} accepted jobs as stuck`)
    return processedCount

  } catch (error) {
    functions.logger.error('❌ Error checking stuck accepted jobs:', error)
    return 0
  }
}

/**
 * Check for jobs that were started but not completed
 */
async function checkStuckStartedJobs(): Promise<number> {
  const now = new Date()
  const cutoffTime = new Date(now.getTime() - TIMEOUT_CONFIG.jobStartedTimeoutHours * 60 * 60 * 1000)

  try {
    const stuckJobsRef = db.collection('jobs')
      .where('status', '==', 'started')
      .where('startedAt', '<', admin.firestore.Timestamp.fromDate(cutoffTime))

    const snapshot = await stuckJobsRef.get()
    
    if (snapshot.empty) {
      return 0
    }

    functions.logger.warn(`🚨 Found ${snapshot.size} stuck started jobs`)

    const batch = db.batch()
    let processedCount = 0

    for (const doc of snapshot.docs) {
      const jobData = doc.data()
      
      try {
        // Mark job as stuck
        batch.update(doc.ref, {
          status: 'stuck_started',
          stuckAt: admin.firestore.Timestamp.now(),
          timeoutReason: 'started_not_completed',
          escalationRequired: true
        })

        // Create CRITICAL admin notification
        await createAdminAlert({
          type: 'stuck_job_alert',
          jobId: doc.id,
          propertyName: jobData.propertyName || 'Unknown Property',
          reason: 'started_not_completed',
          stuckSince: jobData.startedAt,
          assignedStaff: jobData.assignedStaffId,
          priority: 'critical',
          requiresImmediateAction: true
        })

        processedCount++
      } catch (error) {
        functions.logger.error(`❌ Error processing stuck started job ${doc.id}:`, error)
      }
    }

    await batch.commit()
    
    functions.logger.error(`🚨 Marked ${processedCount} started jobs as stuck - REQUIRES IMMEDIATE ATTENTION`)
    return processedCount

  } catch (error) {
    functions.logger.error('❌ Error checking stuck started jobs:', error)
    return 0
  }
}

/**
 * Create admin alert notification
 */
async function createAdminAlert(alertData: any): Promise<void> {
  try {
    const notification = {
      ...alertData,
      createdAt: admin.firestore.Timestamp.now(),
      resolved: false,
      source: 'job_timeout_monitor'
    }

    await db.collection('admin_notifications').add(notification)
    
    functions.logger.info(`🚨 Admin notification created: ${alertData.type}`)
  } catch (error) {
    functions.logger.error('❌ Error creating admin notification:', error)
  }
}

/**
 * Manual trigger function for timeout checking (for testing/admin use)
 */
export const triggerTimeoutCheck = functions.https.onCall(async (data: any, context: any) => {
  functions.logger.info('🔧 Manual timeout check triggered')
  
  // Verify admin authorization
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can trigger manual timeout checks'
    )
  }

  try {
    const results = {
      expiredOffers: await checkExpiredOffers(),
      stuckAcceptedJobs: await checkStuckAcceptedJobs(),
      stuckStartedJobs: await checkStuckStartedJobs()
    }

    functions.logger.info('🔧 Manual timeout check completed:', results)
    return { success: true, results }
  } catch (error) {
    functions.logger.error('❌ Manual timeout check failed:', error)
    throw new functions.https.HttpsError('internal', 'Timeout check failed')
  }
})
