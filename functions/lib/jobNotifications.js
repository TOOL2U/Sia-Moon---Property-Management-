"use strict";
/**
 * Firebase Cloud Functions for Job Assignment Notifications
 * Automatically triggers when jobs are assigned to staff members
 * Sends real-time notifications and FCM push notifications
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredNotifications = exports.onNotificationAcknowledged = exports.onJobAssigned = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * Cloud Function: Trigger on job assignment
 * Listens for new jobs or status changes to 'assigned'
 */
exports.onJobAssigned = (0, firestore_2.onDocumentWritten)('jobs/{jobId}', async (event) => {
    var _a, _b, _c, _d, _e, _f;
    const jobId = event.params.jobId;
    const beforeData = ((_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.exists) ? event.data.before.data() : null;
    const afterData = ((_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.exists) ? event.data.after.data() : null;
    try {
        // Check if this is a job assignment (new job or status changed to assigned)
        const isNewAssignment = (!beforeData &&
            (afterData === null || afterData === void 0 ? void 0 : afterData.status) === 'assigned' &&
            (afterData === null || afterData === void 0 ? void 0 : afterData.assignedStaffId)) || // New job assigned
            ((beforeData === null || beforeData === void 0 ? void 0 : beforeData.status) !== 'assigned' &&
                (afterData === null || afterData === void 0 ? void 0 : afterData.status) === 'assigned' &&
                (afterData === null || afterData === void 0 ? void 0 : afterData.assignedStaffId)) || // Status changed to assigned
            ((beforeData === null || beforeData === void 0 ? void 0 : beforeData.assignedStaffId) !== (afterData === null || afterData === void 0 ? void 0 : afterData.assignedStaffId) &&
                (afterData === null || afterData === void 0 ? void 0 : afterData.assignedStaffId)); // Staff reassigned
        if (!isNewAssignment || !(afterData === null || afterData === void 0 ? void 0 : afterData.assignedStaffId)) {
            console.log(`⏭️ Skipping notification for job ${jobId} - not a new assignment`);
            return null;
        }
        console.log(`🔔 Processing job assignment notification for job ${jobId}`);
        // Get staff information
        const staffDoc = await db
            .collection('staff_accounts')
            .doc(afterData.assignedStaffId)
            .get();
        if (!staffDoc.exists) {
            console.error(`❌ Staff member ${afterData.assignedStaffId} not found`);
            return null;
        }
        const staffData = staffDoc.data();
        // Prepare notification data
        const notificationData = {
            jobId,
            staffId: afterData.assignedStaffId,
            staffName: staffData.name || 'Unknown Staff',
            staffEmail: staffData.email || '',
            jobTitle: afterData.title || 'New Job Assignment',
            jobType: afterData.jobType || 'general',
            priority: afterData.priority || 'medium',
            propertyName: ((_e = afterData.propertyRef) === null || _e === void 0 ? void 0 : _e.name) || 'Unknown Property',
            propertyAddress: ((_f = afterData.location) === null || _f === void 0 ? void 0 : _f.address) || 'Address not provided',
            scheduledDate: afterData.scheduledDate || new Date().toISOString().split('T')[0],
            scheduledStartTime: afterData.scheduledStartTime,
            estimatedDuration: afterData.estimatedDuration || 120,
            specialInstructions: afterData.specialInstructions,
            createdAt: admin.firestore.Timestamp.now(),
            notificationSent: false,
            pushNotificationSent: false,
        };
        // Create notification document in staff_notifications collection
        const notificationRef = await db.collection('staff_notifications').add(Object.assign(Object.assign({}, notificationData), { type: 'job_assigned', status: 'pending', readAt: null, actionRequired: true, expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            ) }));
        console.log(`✅ Created notification document: ${notificationRef.id}`);
        // Update job document with notification flag for mobile app
        await db.collection('jobs').doc(jobId).update({
            notificationSent: true,
            notificationId: notificationRef.id,
            mobileNotificationPending: true,
            lastNotificationAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        // Send FCM push notification
        await sendPushNotification(notificationData);
        // Update staff dashboard for real-time UI updates
        await updateStaffDashboard(afterData.assignedStaffId, notificationData);
        // Log successful notification
        await logNotificationEvent(jobId, afterData.assignedStaffId, 'job_assigned', true);
        console.log(`🎉 Job assignment notification completed for job ${jobId}`);
        return null;
    }
    catch (error) {
        console.error('❌ Error in job assignment notification:', error);
        // Log error for monitoring
        await logNotificationEvent(event.params.jobId, (afterData === null || afterData === void 0 ? void 0 : afterData.assignedStaffId) || 'unknown', 'job_assigned', false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
});
/**
 * Send FCM push notification to staff member's devices
 */
async function sendPushNotification(notificationData) {
    try {
        console.log(`📱 Sending push notification to staff ${notificationData.staffId}`);
        // Get staff device tokens
        const deviceTokensQuery = await db
            .collection('staff_device_tokens')
            .where('staffId', '==', notificationData.staffId)
            .where('notificationsEnabled', '==', true)
            .get();
        if (deviceTokensQuery.empty) {
            console.log(`⚠️ No device tokens found for staff ${notificationData.staffId}`);
            return;
        }
        const deviceTokens = [];
        const tokenDocs = [];
        deviceTokensQuery.forEach((doc) => {
            const tokenData = doc.data();
            deviceTokens.push(tokenData.deviceToken);
            tokenDocs.push(tokenData);
        });
        // Prepare FCM message
        const message = {
            notification: {
                title: '🎯 New Job Assignment',
                body: `${notificationData.jobTitle} at ${notificationData.propertyName}`,
            },
            data: {
                type: 'job_assigned',
                jobId: notificationData.jobId,
                jobType: notificationData.jobType,
                priority: notificationData.priority,
                propertyName: notificationData.propertyName,
                scheduledDate: notificationData.scheduledDate,
                scheduledStartTime: notificationData.scheduledStartTime || '',
                estimatedDuration: notificationData.estimatedDuration.toString(),
                specialInstructions: notificationData.specialInstructions || '',
                timestamp: new Date().toISOString(),
            },
            android: {
                notification: {
                    icon: 'ic_notification',
                    color: '#6366f1', // Indigo color matching app theme
                    channelId: 'job_assignments',
                    priority: (notificationData.priority === 'urgent' || notificationData.priority === 'high') ? 'high' : 'default',
                    sound: 'default',
                },
                data: {
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    route: `/jobs/${notificationData.jobId}`,
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: '🎯 New Job Assignment',
                            body: `${notificationData.jobTitle} at ${notificationData.propertyName}`,
                        },
                        badge: 1,
                        sound: 'default',
                        category: 'JOB_ASSIGNMENT',
                    },
                },
                fcmOptions: {
                    imageUrl: 'https://siamoon.com/assets/notification-icon.png',
                },
            },
            tokens: deviceTokens,
        };
        // Send multicast message using sendEachForMulticast (updated API)
        const response = await messaging.sendEachForMulticast(message);
        console.log(`📤 Push notification sent: ${response.successCount}/${deviceTokens.length} successful`);
        // Handle failed tokens (remove invalid ones)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                var _a, _b;
                if (!resp.success) {
                    console.error(`❌ Failed to send to token ${idx}:`, resp.error);
                    // Remove invalid tokens
                    if (((_a = resp.error) === null || _a === void 0 ? void 0 : _a.code) === 'messaging/invalid-registration-token' ||
                        ((_b = resp.error) === null || _b === void 0 ? void 0 : _b.code) === 'messaging/registration-token-not-registered') {
                        failedTokens.push(deviceTokens[idx]);
                    }
                }
            });
            // Clean up invalid tokens
            for (const failedToken of failedTokens) {
                await db
                    .collection('staff_device_tokens')
                    .where('deviceToken', '==', failedToken)
                    .get()
                    .then((snapshot) => {
                    snapshot.forEach((doc) => doc.ref.delete());
                });
            }
        }
        // Update notification status
        await db
            .collection('staff_notifications')
            .where('jobId', '==', notificationData.jobId)
            .where('staffId', '==', notificationData.staffId)
            .get()
            .then((snapshot) => {
            snapshot.forEach((doc) => {
                doc.ref.update({
                    pushNotificationSent: true,
                    pushNotificationSentAt: admin.firestore.Timestamp.now(),
                    pushNotificationResponse: {
                        successCount: response.successCount,
                        failureCount: response.failureCount,
                    },
                });
            });
        });
    }
    catch (error) {
        console.error('❌ Error sending push notification:', error);
        throw error;
    }
}
/**
 * Update staff dashboard with new job notification
 */
async function updateStaffDashboard(staffId, notificationData) {
    try {
        const dashboardRef = db.collection('staff_dashboard').doc(staffId);
        await dashboardRef.set({
            staffId,
            pendingJobs: firestore_1.FieldValue.increment(1),
            unreadNotifications: firestore_1.FieldValue.increment(1),
            lastJobAssigned: {
                jobId: notificationData.jobId,
                jobTitle: notificationData.jobTitle,
                propertyName: notificationData.propertyName,
                assignedAt: admin.firestore.Timestamp.now(),
            },
            lastUpdated: admin.firestore.Timestamp.now(),
            notificationBadge: firestore_1.FieldValue.increment(1),
        }, { merge: true });
        console.log(`📊 Updated dashboard for staff ${staffId}`);
    }
    catch (error) {
        console.error('❌ Error updating staff dashboard:', error);
        throw error;
    }
}
/**
 * Log notification events for monitoring and analytics
 */
async function logNotificationEvent(jobId, staffId, eventType, success, error) {
    try {
        await db.collection('notification_logs').add({
            jobId,
            staffId,
            eventType,
            success,
            error: error || null,
            timestamp: admin.firestore.Timestamp.now(),
            metadata: {
                functionName: 'onJobAssigned',
                version: '1.0.0',
            },
        });
    }
    catch (logError) {
        console.error('❌ Error logging notification event:', logError);
        // Don't throw here to avoid breaking the main flow
    }
}
/**
 * Cloud Function: Handle notification acknowledgment from mobile app
 */
exports.onNotificationAcknowledged = (0, firestore_2.onDocumentUpdated)('staff_notifications/{notificationId}', async (event) => {
    var _a, _b, _c, _d;
    try {
        const beforeData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
        const afterData = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
        // Check if notification was read/acknowledged
        if (!(beforeData === null || beforeData === void 0 ? void 0 : beforeData.readAt) && (afterData === null || afterData === void 0 ? void 0 : afterData.readAt)) {
            const notificationId = event.params.notificationId;
            console.log(`✅ Notification ${notificationId} acknowledged by staff ${afterData.staffId}`);
            // Update job document to clear mobile notification flag
            if (afterData.jobId) {
                await db.collection('jobs').doc(afterData.jobId).update({
                    mobileNotificationPending: false,
                    notificationAcknowledgedAt: admin.firestore.Timestamp.now(),
                });
            }
            // Update staff dashboard
            await db
                .collection('staff_dashboard')
                .doc(afterData.staffId)
                .update({
                unreadNotifications: firestore_1.FieldValue.increment(-1),
                notificationBadge: firestore_1.FieldValue.increment(-1),
                lastNotificationRead: admin.firestore.Timestamp.now(),
            });
            // Log acknowledgment
            await logNotificationEvent(afterData.jobId, afterData.staffId, 'notification_acknowledged', true);
        }
        return null;
    }
    catch (error) {
        console.error('❌ Error handling notification acknowledgment:', error);
        throw error;
    }
});
/**
 * Scheduled function: Clean up expired notifications
 */
exports.cleanupExpiredNotifications = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours' }, async (event) => {
    try {
        console.log('🧹 Starting cleanup of expired notifications');
        const expiredQuery = await db
            .collection('staff_notifications')
            .where('expiresAt', '<', admin.firestore.Timestamp.now())
            .get();
        const batch = db.batch();
        let deleteCount = 0;
        expiredQuery.forEach((doc) => {
            batch.delete(doc.ref);
            deleteCount++;
        });
        if (deleteCount > 0) {
            await batch.commit();
            console.log(`🗑️ Deleted ${deleteCount} expired notifications`);
        }
        else {
            console.log('✨ No expired notifications to clean up');
        }
        return;
    }
    catch (error) {
        console.error('❌ Error cleaning up expired notifications:', error);
        throw error;
    }
});
//# sourceMappingURL=jobNotifications.js.map