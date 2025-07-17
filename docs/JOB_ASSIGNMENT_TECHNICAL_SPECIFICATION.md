# Technical Specification: Job Assignment Integration with Mobile App

## 1. Overview and Context

This document provides a comprehensive technical specification for integrating job assignments between the Sia Moon Property Management web application and the mobile application. It details the data flow, API endpoints, Firebase collections, data structures, and implementation guidelines for developers working on both platforms.

### 1.1 System Purpose

The job assignment system enables property managers to assign tasks to staff members via the web application, with real-time notifications and updates delivered to the staff's mobile devices. Staff can accept, decline, start, and complete jobs directly from their mobile app with all changes syncing back to the central system.

### 1.2 Target Audience

- Mobile Application Development Team
- Backend Integration Engineers
- Quality Assurance Testers
- System Administrators

## 2. Job Assignment Flow

### 2.1 Job Creation in Web Application

1. **Create Job Assignment**: Administrator creates a job in the web application using `JobAssignmentService`
2. **Job Data Storage**: Job document is stored in the `jobs` Firebase collection
3. **Staff Assignment**: Job is assigned to a staff member via `staffId` reference
4. **Status Update**: Job status is set to `assigned`

### 2.2 Notification Dispatch

1. **Cloud Function Trigger**: `onJobAssigned` function triggered by job document creation/update
2. **Notification Generation**: System creates notification document in `staff_notifications` collection
3. **Push Notification**: FCM push notification sent to staff member's mobile device
4. **Mobile App Alert**: Staff receives notification banner in mobile app

### 2.3 Staff Response Flow

1. **Mobile App Response**: Staff member accepts or declines job via mobile app
2. **Data Synchronization**: Response is updated in the job document (`status` → `accepted` or `declined`)
3. **Notification Update**: Staff notification marked as acknowledged
4. **Real-time Updates**: Web application updates job status in real time

### 2.4 Job Execution Flow

1. **Start Job**: Staff member starts the job (`status` → `in_progress`)
2. **Execution Updates**: Optional progress updates during job execution
3. **Complete Job**: Staff completes the job with required information:
   - Completion notes
   - Verification photos
   - Quality rating
   - Issue reporting
4. **Status Update**: Job status updated to `completed`
5. **Synchronization**: All data synced back to web application

## 3. Firebase Collections and Data Structure

### 3.1 Primary Collections

| Collection            | Purpose                         | Key Fields                                     |
| --------------------- | ------------------------------- | ---------------------------------------------- |
| `jobs`                | Stores all job assignments      | `id`, `assignedStaffId`, `userId`, `status`    |
| `staff_notifications` | Stores notifications for staff  | `jobId`, `staffId`, `userId`, `type`, `status` |
| `staff_accounts`      | Staff member information        | `id`, `name`, `email`, `userId`, `role`        |
| `staff_device_tokens` | Mobile device FCM tokens        | `staffId`, `deviceToken`, `platform`           |
| `notification_logs`   | Tracking of notification events | `jobId`, `staffId`, `eventType`, `success`     |

### 3.2 Key Data Models

#### Job Data Structure (`jobs` collection)

```typescript
export interface JobData {
  // Core Identifiers
  id: string

  // Booking Integration
  bookingId: string
  bookingRef: {
    id: string
    guestName: string
    propertyName: string
    checkInDate: string
    checkOutDate: string
    guestCount: number
  }

  // Property Data
  propertyId: string
  propertyRef: {
    id: string
    name: string
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }

  // Job Details
  jobType:
    | 'cleaning'
    | 'maintenance'
    | 'checkin_prep'
    | 'checkout_process'
    | 'inspection'
    | 'setup'
    | 'concierge'
    | 'security'
    | 'custom'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'

  // Scheduling
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime: string
  estimatedDuration: number // minutes
  deadline: string

  // Staff Assignment - CRITICAL FIELDS
  assignedStaffId: string
  userId: string // Required by database policy for proper notification routing
  assignedStaffRef: {
    id: string
    name: string
    role: string
    skills: string[]
  }

  // Assignment Details
  assignedAt: string
  assignedBy: {
    id: string
    name: string
  }

  // Job Status
  status:
    | 'pending'
    | 'assigned'
    | 'accepted'
    | 'declined'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
  statusHistory: Array<{
    status: string
    timestamp: string
    updatedBy: string
    notes: string
  }>

  // Requirements
  requiredSkills: string[]
  specialInstructions?: string

  // Location & Access
  location: {
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
    accessInstructions?: string
    parkingInstructions?: string
  }

  // Timestamps
  createdAt: string | Timestamp
  updatedAt: string | Timestamp

  // Mobile Sync Fields
  syncVersion: number
  mobileOptimized: {
    essentialData: {
      title: string
      address: string
      scheduledTime: string
      priority: string
    }
  }

  // Notification System
  notificationSent?: boolean
  notificationId?: string
  mobileNotificationPending?: boolean
  lastNotificationAt?: string | Timestamp
}
```

#### Staff Notification Data Structure (`staff_notifications` collection)

```typescript
interface JobNotificationData {
  jobId: string
  staffId: string
  userId: string // Required by database policy
  staffName: string
  staffEmail: string
  jobTitle: string
  jobType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  propertyName: string
  propertyAddress: string
  scheduledDate: string
  scheduledStartTime?: string
  estimatedDuration: number
  specialInstructions?: string
  type: 'job_assigned' | 'job_updated' | 'job_cancelled'
  status: 'pending' | 'sent' | 'delivered' | 'read'
  readAt: null | Timestamp
  actionRequired: boolean
  createdAt: Timestamp
  expiresAt: Timestamp
}
```

## 4. API Endpoints and Integration

### 4.1 Mobile App Integration Endpoints

| Endpoint                                 | Method | Purpose                                          |
| ---------------------------------------- | ------ | ------------------------------------------------ |
| `/api/mobile/assignments`                | GET    | Fetch staff assignments                          |
| `/api/mobile/assignments/[assignmentId]` | PATCH  | Update assignment status                         |
| `/api/mobile/sync`                       | POST   | Bidirectional sync between mobile app and webapp |

### 4.2 Mobile API Authentication

```http
X-API-Key: sia-moon-mobile-app-2025-secure-key
X-Mobile-Secret: mobile-app-sync-2025-secure
X-Staff-ID: [staffId]
X-Device-ID: [deviceId]
```

### 4.3 Job Assignment Fetch Example

**Request:**

```http
GET /api/mobile/assignments?staffId=staff_001&status=pending
X-API-Key: sia-moon-mobile-app-2025-secure-key
X-Mobile-Secret: mobile-app-sync-2025-secure
X-Staff-ID: staff_001
```

**Response:**

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "assignment_001",
        "staffId": "staff_001",
        "staffName": "Maria Santos",
        "bookingId": "booking_001",
        "propertyId": "property_001",
        "propertyName": "Villa Mango Beach",
        "taskType": "cleaning",
        "title": "Pre-arrival Cleaning",
        "description": "Deep clean villa before guest arrival",
        "scheduledDate": "2025-07-20",
        "scheduledTime": "09:00",
        "status": "pending",
        "priority": "high",
        "notes": "Focus on bathrooms and kitchen"
      }
    ],
    "count": 1,
    "filters": {
      "staffId": "staff_001",
      "date": "all",
      "status": "pending"
    },
    "lastSync": 1234567890
  },
  "timestamp": 1234567890
}
```

### 4.4 Job Status Update Example

**Request:**

```http
PATCH /api/mobile/assignments/assignment_001
X-API-Key: sia-moon-mobile-app-2025-secure-key
X-Mobile-Secret: mobile-app-sync-2025-secure
X-Staff-ID: staff_001

{
  "status": "accepted",
  "notes": "I will arrive on time",
  "estimatedArrival": "09:00",
  "updatedBy": "staff_001",
  "timestamp": "2025-07-19T15:30:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "assignmentId": "assignment_001",
    "oldStatus": "pending",
    "newStatus": "accepted",
    "updatedAt": "2025-07-19T15:30:00Z",
    "syncTimestamp": 1234567890
  },
  "message": "Assignment updated successfully",
  "timestamp": 1234567890
}
```

## 5. Mobile App Implementation

### 5.1 Core Data Flow Components

The mobile app implements this data flow through three core components:

#### 5.1.1 `JobContext.tsx`

Manages real-time connection to Firebase job data:

```typescript
// Real-time job data listener
useEffect(() => {
  if (!user || !staffProfile) return

  const jobsQuery = query(
    collection(db, 'jobs'),
    where('assignedStaffId', '==', user.uid),
    orderBy('createdAt', 'desc')
  )

  const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
    const jobList: JobAssignment[] = []
    snapshot.forEach((doc) => {
      jobList.push({
        id: doc.id,
        ...doc.data(),
      } as JobAssignment)
    })
    setJobs(jobList)
    setLoading(false)
  })

  return () => unsubscribe()
}, [user, staffProfile])
```

#### 5.1.2 `NotificationContext.tsx`

Handles push notifications using Expo Notifications:

```typescript
// Register for push notifications
const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync()).data
  setExpoPushToken(token)

  // Store token in Firebase for FCM
}
```

#### 5.1.3 `JobDetailsScreen.tsx`

Displays job information and handles staff actions:

```typescript
// Accept job action
const handleAcceptJob = async () => {
  try {
    await respondToJob({
      jobId: job.id,
      accepted: true,
      responseAt: new Date().toISOString(),
      notes: notes,
    })
    // Navigate to active jobs
  } catch (error) {
    // Handle error
  }
}
```

### 5.2 Mobile App Structure

```
src/
├── components/          # Reusable UI components
│   └── JobNotificationBanner.tsx
├── contexts/           # React contexts for state management
│   ├── AuthContext.tsx
│   ├── JobContext.tsx
│   └── NotificationContext.tsx
├── screens/            # App screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ActiveJobsScreen.tsx
│   ├── JobDetailsScreen.tsx
│   ├── JobCompletionScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # Business logic services
│   ├── photoUploadService.ts
│   └── navigationService.ts
├── types/              # TypeScript type definitions
│   └── job.ts
└── config/             # App configuration
    └── firebase.ts
```

### 5.3 Firebase Integration

The mobile app connects to the same Firebase project as the web application:

```typescript
// In src/config/firebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: '...',
  authDomain: 'operty-b54dc.firebaseapp.com',
  projectId: 'operty-b54dc',
  storageBucket: 'operty-b54dc.appspot.com',
  messagingSenderId: '...',
  appId: '...',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
```

## 6. Cloud Functions

### 6.1 `onJobAssigned` Function

This Cloud Function triggers when a job is assigned to a staff member:

```typescript
export const onJobAssigned = functions.firestore
  .document('jobs/{jobId}')
  .onWrite(async (change, context) => {
    const jobId = context.params.jobId
    const beforeData = change.before.exists ? change.before.data() : null
    const afterData = change.after.exists ? change.after.data() : null

    // Check if this is a job assignment (new job or status changed to assigned)
    const isNewAssignment =
      (!beforeData &&
        afterData?.status === 'assigned' &&
        afterData?.assignedStaffId) ||
      (beforeData?.status !== 'assigned' &&
        afterData?.status === 'assigned' &&
        afterData?.assignedStaffId) ||
      (beforeData?.assignedStaffId !== afterData?.assignedStaffId &&
        afterData?.assignedStaffId)

    if (!isNewAssignment || !afterData?.assignedStaffId) {
      return null
    }

    // Create notification document
    const notificationRef = await db.collection('staff_notifications').add({
      jobId,
      staffId: afterData.assignedStaffId,
      // Additional notification data...
      type: 'job_assigned',
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
    })

    // Send FCM push notification
    // Update job document flags
    // ...
  })
```

### 6.2 `onNotificationAcknowledged` Function

This function handles when staff acknowledges a notification:

```typescript
export const onNotificationAcknowledged = functions.firestore
  .document('staff_notifications/{notificationId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data()
    const afterData = change.after.data()

    // Check if notification was read/acknowledged
    if (!beforeData.readAt && afterData.readAt) {
      // Update job document
      await db.collection('jobs').doc(afterData.jobId).update({
        mobileNotificationPending: false,
        notificationAcknowledgedAt: admin.firestore.Timestamp.now(),
      })

      // Update staff dashboard metrics
      // ...
    }
  })
```

## 7. Test Job Integration

For testing the job assignment integration, a `TestJobService` class has been implemented:

### 7.1 Test Job Service Implementation

```typescript
class TestJobService {
  /**
   * Create a test job to send to mobile app
   */
  static async createTestJob() {
    try {
      const db = getDb()

      // Get active staff member with userId
      const staffCollection = collection(db, 'staff_accounts')
      const staffDocs = await getDocs(
        query(staffCollection, where('isActive', '==', true))
      )

      let staffId = ''
      let staffName = ''
      let userId = ''

      // Find staff with userId (required by database policy)
      if (!staffDocs.empty) {
        for (const staffDoc of staffDocs.docs) {
          const staffData = staffDoc.data()
          if (staffData.userId) {
            staffId = staffDoc.id
            staffName = staffData.name || 'Staff Member'
            userId = staffData.userId
            break
          }
        }
      }

      // Create test job
      const testJob = {
        // Job details
        title: '⚠️ TEST JOB: Villa Cleaning',
        jobType: 'cleaning',
        priority: 'medium',

        // Staff Assignment - CRITICAL FIELDS
        assignedStaffId: staffId,
        userId: userId, // Required by database policy

        // Initial status
        status: 'pending',

        // Required fields for notifications
        notificationSent: true,
        mobileNotificationPending: true,
      }

      // Save to Firebase
      const jobRef = await addDoc(collection(db, 'jobs'), testJob)

      // Update to assigned status to trigger notifications
      await updateDoc(doc(db, 'jobs', jobRef.id), {
        status: 'assigned',
      })

      // Create notification document
      const notificationData = {
        jobId: jobRef.id,
        staffId: staffId,
        userId: userId, // Required by database policy
        type: 'job_assigned',
        // Other notification fields...
      }

      const notificationRef = await addDoc(
        collection(db, 'staff_notifications'),
        notificationData
      )

      return {
        success: true,
        jobId: jobRef.id,
        notificationId: notificationRef.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
```

### 7.2 Test Sequence

1. **Create Test Job**: Admin uses the "Test Job" button in the web application
2. **Job Creation**: Test job is created in the `jobs` collection with an active staff member assigned
3. **Cloud Function**: `onJobAssigned` cloud function triggers
4. **Notification**: Staff notification is created and FCM push notification is sent
5. **Mobile App**: Staff receives push notification and app notification banner
6. **Response**: Staff can accept/decline the test job from the mobile app
7. **Completion**: Staff can complete the test job with photos and notes

## 8. Error Handling and Edge Cases

### 8.1 Error States

| Error Scenario                   | Handling Strategy                                           |
| -------------------------------- | ----------------------------------------------------------- |
| Notification delivery failure    | Retry mechanism with exponential backoff                    |
| Missing staff device token       | Fall back to in-app notification only                       |
| Offline staff mobile device      | Queue notifications for delivery when back online           |
| Database permission errors       | Ensure `userId` field is included in all relevant documents |
| Job assignment to inactive staff | Validation check in web app before assignment               |
| Duplicate notifications          | Check for existing notifications before creating new ones   |

### 8.2 Edge Case Handling

1. **Device Token Expiration**
   - Mobile app re-registers token on each app startup
   - Invalid tokens removed when push notification fails

2. **Staff Account Changes**
   - Jobs associated with staff ID, not user account
   - Staff account changes require manual reassignment of jobs

3. **Notification Expiration**
   - Scheduled cloud function `cleanupExpiredNotifications` runs daily
   - Removes notifications older than 24 hours with `expiresAt` timestamp

4. **Data Synchronization Conflicts**
   - `syncVersion` field incremented on each update
   - Mobile app checks version before updating to prevent conflicts

## 9. Monitoring and Debugging

### 9.1 Notification Logs

The system logs all notification events in the `notification_logs` collection:

```typescript
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
})
```

### 9.2 Common Issues and Solutions

1. **Notifications Not Arriving**
   - Check `staff_device_tokens` collection for valid tokens
   - Verify FCM configuration in `firebase.json`
   - Check `notification_logs` for specific errors

2. **Job Status Not Updating**
   - Verify Firebase security rules allow staff write access
   - Check mobile app has proper authentication
   - Ensure all required fields are included in updates

3. **Database Permission Denied**
   - Ensure `userId` field is included in job and notification documents
   - Verify staff account has proper role permissions

4. **Stale Mobile Data**
   - Implement manual refresh in mobile app
   - Check real-time listener configurations

## 10. Future Enhancements

1. **Offline Support**
   - Local storage for job data when offline
   - Synchronization queue for offline actions

2. **Staff Location Tracking**
   - Real-time staff location updates
   - Geofencing for job site arrival detection

3. **Advanced Job Filtering**
   - Custom filter criteria for job assignments
   - Calendar view integration

4. **Staff Chat System**
   - Direct messaging with property managers
   - Group chats for team coordination

5. **Analytics Dashboard**
   - Job completion metrics
   - Staff performance analytics

## 11. References

- Firebase Documentation: https://firebase.google.com/docs
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Mobile API Documentation: `/docs/mobile-api-documentation.md`
- Mobile App README: `/mobile-app/README.md`
