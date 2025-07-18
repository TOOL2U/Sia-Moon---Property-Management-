# 🚀 Quick Reference: Mobile Firebase Integration

## 📋 Essential Info for Mobile Dev Team

### 🔑 Firebase Project

- **Project ID:** `operty-b54dc`
- **Database:** Cloud Firestore

### 📊 Key Collections & Fields

#### 1. Staff Accounts: `staff_accounts`

```javascript
{
  email: "staff@siamoon.com",
  firebaseUid: "xyz789abc123",  // ← USE THIS for notifications
  userId: "backup_id",          // ← Fallback UID
  isActive: true,
  name: "Staff Name"
}
```

#### 2. Notifications: `staff_notifications`

```javascript
{
  jobId: "job_123",
  userId: "xyz789abc123",       // ← Filter notifications by this
  staffId: "staff_doc_id",
  jobTitle: "Villa Cleaning",
  type: "job_assigned",
  status: "pending",            // pending/read/expired
  priority: "medium",           // low/medium/high
  createdAt: Firebase.Timestamp,
  expiresAt: Firebase.Timestamp
}
```

#### 3. Jobs: `jobs`

```javascript
{
  title: "Job Title",
  status: "assigned",           // pending/assigned/in_progress/completed
  assignedStaffId: "staff_123",
  userId: "firebase_uid",
  propertyRef: { name: "Villa Name", address: "123 Street" },
  scheduledDate: "2025-07-18",
  scheduledStartTime: "14:00"
}
```

### 🎯 Mobile App Queries

#### Get User's Firebase UID:

```javascript
const staffQuery = query(
  collection(db, 'staff_accounts'),
  where('email', '==', userEmail),
  where('isActive', '==', true)
)
```

#### Listen for Notifications:

```javascript
const notificationsQuery = query(
  collection(db, 'staff_notifications'),
  where('userId', '==', firebaseUid),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc')
)
```

#### Get Job Details:

```javascript
const jobRef = doc(db, 'jobs', jobId)
const jobSnap = await getDoc(jobRef)
```

### 🧪 Test Account

- **Email:** `staff@siamoon.com`
- **Purpose:** Receives all test jobs first
- **Location:** Find in `staff_accounts` collection

### 📱 Integration Steps

1. Setup Firebase SDK with project ID
2. Implement Firebase Auth
3. Query `staff_accounts` for user's `firebaseUid`
4. Listen to `staff_notifications` filtered by `userId`
5. Fetch job details from `jobs` collection using `jobId`

### 🚨 Important Notes

- Always use `firebaseUid` from staff_accounts as the `userId` for notifications
- Notifications expire after 24 hours (check `expiresAt`)
- Test jobs are marked with 🧪 or ⚠️ in titles
- Staff must have `isActive: true` to receive notifications
