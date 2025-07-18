# 🔄 Complete Job Assignment Workflow

## Overview
This document traces the **complete end-to-end workflow** that occurs when assigning a job to `staff@siamoon.com` (Firebase UID: `gTtR5gSKOtUEweLwchSnVreylMy1`) in our villa property management system.

---

## 🚀 **STEP 1: Job Assignment Initiation**

### Trigger Points:
1. **Admin Dashboard**: "Send Test Job to Mobile" button
2. **Job Management**: Manual job assignment to staff
3. **Booking Approval**: Auto-assignment from approved booking

### Entry Point:
```typescript
// Admin clicks "Send Test Job to Mobile" button
await TestJobService.createTestJob()
```

---

## 📝 **STEP 2: Job Document Creation**

### Location: `src/services/TestJobService.ts`

### Process:
1. **Staff Lookup**: Query `staff_accounts` collection for Firebase UID mapping
2. **Job Data Structure**: Create comprehensive job document
3. **Firebase Storage**: Save to `/jobs` collection

### Job Document Structure:
```javascript
{
  // Core Job Information
  id: "auto_generated_job_id",
  title: "⚠️ TEST JOB: Villa Cleaning",
  description: "Complete cleaning of villa including all rooms",
  jobType: "cleaning",
  priority: "medium",
  
  // CRITICAL: Firebase UID Mapping for Mobile App
  assignedStaffId: "gTtR5gSKOtUEweLwchSnVreylMy1", // Firebase UID
  userId: "gTtR5gSKOtUEweLwchSnVreylMy1",           // Firebase UID (legacy)
  assignedStaffDocId: "IDJrsXWiL2dCHVpveH97",       // Staff document ID
  
  // Staff Reference
  assignedStaffRef: {
    id: "IDJrsXWiL2dCHVpveH97",
    firebaseUid: "gTtR5gSKOtUEweLwchSnVreylMy1",
    name: "Staff Member",
    role: "cleaner"
  },
  
  // Scheduling
  scheduledDate: "2025-01-18",
  scheduledStartTime: "14:00",
  scheduledEndTime: "16:00",
  estimatedDuration: 120,
  
  // Status Management
  status: "pending", // Will change to "assigned"
  statusHistory: [...],
  
  // Mobile Optimization
  mobileOptimized: {
    essentialData: {
      title: "⚠️ TEST JOB: Villa Cleaning",
      address: "123 Test Street, Test City",
      scheduledTime: "14:00",
      priority: "medium"
    }
  },
  
  // Notification Flags
  notificationSent: true,
  mobileNotificationPending: true,
  
  // Timestamps
  createdAt: "2025-01-18T...",
  updatedAt: "2025-01-18T..."
}
```

### Collections Updated:
- ✅ **`/jobs`** - Main job document created

---

## 🔔 **STEP 3: Status Update to "Assigned"**

### Process:
```typescript
// Update job status to trigger notifications
await updateDoc(doc(db, 'jobs', jobRef.id), {
  status: 'assigned',
  assignedAt: new Date().toISOString()
})
```

### Result:
- Job status changes from "pending" → "assigned"
- **Triggers Firebase Cloud Function**: `onJobAssigned`

---

## ⚡ **STEP 4: Cloud Function Activation**

### Location: `functions/src/jobNotifications.ts`

### Cloud Function: `onJobAssigned`
```typescript
export const onJobAssigned = functions.firestore
  .document('jobs/{jobId}')
  .onWrite(async (change, context) => {
    // Detects job status change to 'assigned'
    // Automatically creates notification
  })
```

### Process:
1. **Trigger Detection**: Monitors `/jobs` collection for status changes
2. **Staff UID Extraction**: Gets Firebase UID from job document
3. **Notification Creation**: Creates notification document
4. **Push Notification**: Sends FCM push notification
5. **Dashboard Update**: Updates staff dashboard

---

## 📱 **STEP 5: Mobile Notification Creation**

### Location: `functions/src/jobNotifications.ts` + `MobileNotificationService`

### Notification Document Structure:
```javascript
{
  // Notification Identity
  id: "auto_generated_notification_id",
  
  // Staff Targeting (CRITICAL for Mobile App)
  staffId: "gTtR5gSKOtUEweLwchSnVreylMy1", // Firebase UID
  recipientId: "gTtR5gSKOtUEweLwchSnVreylMy1",
  recipientType: "staff",
  
  // Notification Content
  type: "job_assigned",
  title: "New Job Assignment",
  message: "You have been assigned: ⚠️ TEST JOB: Villa Cleaning",
  
  // Job Reference
  jobId: "job_document_id",
  relatedJobId: "job_document_id",
  
  // Job Data for Mobile Consumption
  jobData: {
    id: "job_document_id",
    title: "⚠️ TEST JOB: Villa Cleaning",
    jobType: "cleaning",
    priority: "medium",
    scheduledDate: "2025-01-18",
    scheduledStartTime: "14:00",
    location: {
      address: "123 Test Street, Test City",
      coordinates: { latitude: 7.9519, longitude: 98.3381 }
    },
    estimatedDuration: 120,
    specialInstructions: "This is a test job..."
  },
  
  // Notification Status
  read: false,
  delivered: false,
  status: "sent",
  priority: "medium",
  
  // Push Notification
  channels: {
    push: { sent: true, sentAt: "timestamp" },
    email: { sent: false }
  },
  
  // Timestamps
  createdAt: "2025-01-18T...",
  expiresAt: "2025-01-25T..." // 7 days
}
```

### Collections Updated:
- ✅ **`/notifications`** - Mobile notification created
- ✅ **`/jobs`** - Updated with notification flags

---

## 🔄 **STEP 6: Real-Time Mobile App Synchronization**

### Mobile App Query Pattern:
```javascript
// Mobile app listens for notifications
const notificationsQuery = query(
  collection(db, 'notifications'),
  where('staffId', '==', 'gTtR5gSKOtUEweLwchSnVreylMy1'),
  where('read', '==', false),
  orderBy('createdAt', 'desc')
)

// Mobile app queries jobs
const jobsQuery = query(
  collection(db, 'jobs'),
  where('userId', '==', 'gTtR5gSKOtUEweLwchSnVreylMy1'),
  orderBy('createdAt', 'desc')
)
```

### Mobile API Endpoints Available:
1. **`GET /api/mobile/jobs?staffId=gTtR5gSKOtUEweLwchSnVreylMy1`**
2. **`GET /api/mobile/notifications?staffId=gTtR5gSKOtUEweLwchSnVreylMy1`**

---

## 📲 **STEP 7: Push Notification Delivery**

### FCM Push Notification:
```javascript
{
  notification: {
    title: "New Job Assignment",
    body: "You have been assigned: ⚠️ TEST JOB: Villa Cleaning"
  },
  data: {
    type: "job_assigned",
    jobId: "job_document_id",
    staffId: "gTtR5gSKOtUEweLwchSnVreylMy1"
  },
  token: "staff_fcm_token"
}
```

### Collections Updated:
- ✅ **`/fcm_tokens`** - FCM token usage logged

---

## 📊 **STEP 8: Dashboard Updates**

### Staff Dashboard Update:
- Active job count updated
- Recent assignments refreshed
- Mobile app badge count updated

### Collections Updated:
- ✅ **`/staff_accounts`** - Dashboard metrics updated

---

## 🎯 **FINAL RESULT: Mobile App Receives Job**

### What the Mobile App Gets:

1. **Real-Time Notification**: 
   - Push notification appears on device
   - In-app notification banner shows
   - Notification badge updates

2. **Job Data Available**:
   - Job appears in "Assigned Jobs" list
   - All job details accessible
   - Location and scheduling information
   - Special instructions and requirements

3. **Interactive Actions**:
   - Staff can accept/decline job
   - View job details and location
   - Start job when ready
   - Complete job with photos/notes

---

## 📋 **Complete Collections Summary**

### Collections Updated During Workflow:
1. **`/jobs`** - Main job document with Firebase UID mapping
2. **`/notifications`** - Mobile notification with job data
3. **`/fcm_tokens`** - Push notification delivery tracking
4. **`/staff_accounts`** - Dashboard metrics and activity

### Critical Firebase UID Mapping:
- **Staff Email**: `staff@siamoon.com`
- **Firebase UID**: `gTtR5gSKOtUEweLwchSnVreylMy1`
- **Staff Doc ID**: `IDJrsXWiL2dCHVpveH97`

---

## ✅ **Verification Points**

### To Confirm Workflow Success:
1. **Job Created**: Check `/jobs` collection for new document
2. **Notification Created**: Check `/notifications` collection
3. **Mobile API Response**: Test mobile endpoints
4. **Push Notification**: Verify FCM delivery
5. **Mobile App Display**: Confirm job appears in app

### Test Commands:
```bash
# Verify job creation
curl "http://localhost:3000/api/mobile/jobs?staffId=gTtR5gSKOtUEweLwchSnVreylMy1"

# Verify notification creation  
curl "http://localhost:3000/api/mobile/notifications?staffId=gTtR5gSKOtUEweLwchSnVreylMy1"
```

**🎉 This workflow ensures that when you assign a job to `staff@siamoon.com`, the mobile app immediately receives the assignment with all necessary data for real-time job management!**
