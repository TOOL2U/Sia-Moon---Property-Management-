# Mobile App Firebase Integration Guide

## 📱 For Mobile App Development Team

This document provides essential information for integrating the mobile app with our Firebase backend, specifically for user authentication and notifications.

---

## 🔑 Firebase User IDs (UIDs) Location

### Primary Collection: `staff_accounts`

**Path in Firebase Console:** `Firestore Database > staff_accounts`

#### Staff Account Document Structure:

```javascript
{
  // Document ID: Firestore auto-generated ID (e.g., "abc123xyz")
  name: "Staff Member Name",
  email: "staff@siamoon.com",
  isActive: true,

  // 🎯 CRITICAL FIELDS FOR MOBILE APP:
  firebaseUid: "xyz789abc123",  // ← This is the Firebase Auth UID you need!
  userId: "backup_user_id",     // ← Fallback if firebaseUid not available

  // Additional fields
  role: "Maintenance",
  skills: ["cleaning", "repair"],
  phone: "+66123456789",
  createdAt: "2025-07-18T10:30:00Z",
  updatedAt: "2025-07-18T10:30:00Z"
}
```

### 🔍 How to Find UIDs:

1. **Firebase Console Navigation:**

   ```
   Firebase Project → Firestore Database → staff_accounts collection
   ```

2. **Key Fields to Look For:**
   - `firebaseUid` - Primary Firebase Authentication UID
   - `userId` - Secondary/backup user identifier
   - `email` - Use this to match with Firebase Auth users

3. **Test Account to Use:**
   - **Email:** `staff@siamoon.com`
   - **Status:** This account is prioritized in our test job system

---

## 🔔 Notifications Collection: `staff_notifications`

### Notification Document Structure:

```javascript
{
  // Document ID: Firestore auto-generated ID

  // 🎯 CRITICAL FIELDS FOR MOBILE APP:
  jobId: "job_abc123",           // ← Link to jobs collection
  staffId: "staff_doc_id",       // ← staff_accounts document ID
  userId: "firebase_uid_here",   // ← Firebase Auth UID for targeting

  // Job Information
  jobTitle: "🧪 TEST JOB: Villa Cleaning",
  jobType: "cleaning",
  priority: "medium",           // low, medium, high

  // Property Information
  propertyName: "Test Villa",
  propertyAddress: "123 Test Street, Test City",

  // Scheduling
  scheduledDate: "2025-07-18",
  scheduledStartTime: "14:00",
  estimatedDuration: 120,       // minutes

  // Notification Metadata
  type: "job_assigned",         // Type of notification
  status: "pending",            // pending, read, expired
  readAt: null,                 // Timestamp when read
  actionRequired: true,         // Boolean flag

  // Timestamps
  createdAt: Firebase.Timestamp,
  expiresAt: Firebase.Timestamp, // 24 hours from creation

  // Staff Information (for display)
  staffName: "Staff Member Name",
  staffEmail: "staff@siamoon.com",
  specialInstructions: "Additional job details here"
}
```

---

## 🎯 Mobile App Integration Points

### 1. **Authentication Query**

To get the Firebase UID for a staff member:

```javascript
// Query staff_accounts by email
const staffQuery = query(
  collection(db, 'staff_accounts'),
  where('email', '==', userEmail),
  where('isActive', '==', true)
)

const staffDocs = await getDocs(staffQuery)
if (!staffDocs.empty) {
  const staffData = staffDocs.docs[0].data()
  const firebaseUid = staffData.firebaseUid || staffData.userId
  // Use this UID for Firebase Auth and notifications
}
```

### 2. **Notification Listening**

Listen for notifications for a specific user:

```javascript
// Listen for notifications by userId (Firebase UID)
const notificationsQuery = query(
  collection(db, 'staff_notifications'),
  where('userId', '==', currentUserFirebaseUid),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc')
)

// Real-time listener
const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const notification = change.doc.data()
      // Handle new notification
      showPushNotification(notification)
    }
  })
})
```

### 3. **Job Data Fetching**

Get job details from a notification:

```javascript
// Get full job details using jobId from notification
const jobRef = doc(db, 'jobs', notification.jobId)
const jobSnap = await getDoc(jobRef)

if (jobSnap.exists()) {
  const jobData = jobSnap.data()
  // Display job details in mobile app
}
```

---

## 🧪 Testing Setup

### Test Account Configuration:

- **Email:** `staff@siamoon.com`
- **Priority:** This account receives test jobs first
- **Collection:** Look in `staff_accounts` for this email

### Creating Test Jobs:

The backend automatically creates test jobs for `staff@siamoon.com`. These will appear in:

1. `jobs` collection (main job data)
2. `staff_notifications` collection (notification for mobile app)

### Test Job Identifiers:

- Job titles start with: `🧪 TEST JOB:` or `⚠️ CLI TEST JOB:`
- Property names: Usually "Test Villa" or similar
- All test data includes diagnostic information

---

## 🔧 Firebase Project Configuration

### Project Details:

- **Project ID:** `operty-b54dc`
- **Database:** Cloud Firestore
- **Authentication:** Firebase Auth enabled

### Required Collections:

1. `staff_accounts` - Staff user data with Firebase UIDs
2. `staff_notifications` - Push notifications for mobile app
3. `jobs` - Main job data referenced by notifications

### Security Rules:

- Staff can read their own notifications (`userId` field matching)
- Staff can update job status and notification read status
- Authentication required for all operations

---

## 📞 Development Support

### Key Code References:

- **Test Job Creation:** `src/services/TestJobService.ts`
- **Job Assignment:** `src/services/JobAssignmentService.ts`
- **Firebase Config:** `src/lib/firebase.ts`

### Common Queries:

1. **Find User:** Search `staff_accounts` by email
2. **Get Notifications:** Query `staff_notifications` by userId
3. **Get Job Details:** Fetch from `jobs` using jobId from notification

### Troubleshooting:

- Ensure Firebase Auth UID matches `userId` field in notifications
- Check that staff account has `isActive: true`
- Verify notification hasn't expired (check `expiresAt` field)

---

## 🚀 Next Steps for Mobile Team

1. **Setup Firebase SDK** in your mobile app with project ID: `operty-b54dc`
2. **Implement Authentication** using Firebase Auth
3. **Query staff_accounts** to get user's Firebase UID
4. **Listen to staff_notifications** filtered by userId
5. **Test with staff@siamoon.com** account for development

For additional support or questions, refer to the test job creation system which automatically generates properly formatted data for testing.
