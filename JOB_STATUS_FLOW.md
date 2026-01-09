# 📊 Job Status Flow - Complete Guide

## ✅ Status Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    JOB STATUS FLOW                          │
└─────────────────────────────────────────────────────────────┘

1️⃣ PENDING
   📋 Job created from booking
   👥 Visible to ALL cleaners
   🎯 Waiting for cleaner to accept
   ↓
   Cleaner taps "Accept Job"
   ↓
2️⃣ ASSIGNED
   ✅ Job assigned to cleaner who accepted
   🔒 Locked to that cleaner (other cleaners can't see it)
   🎯 Waiting for cleaner to start work
   ↓
   Cleaner taps "Start Job"
   ↓
3️⃣ IN_PROGRESS
   🚀 Cleaner actively working on job
   📸 Uploading photos, completing tasks
   🎯 Waiting for cleaner to finish
   ↓
   Cleaner taps "Complete Job"
   ↓
4️⃣ COMPLETED
   ✔️ Job finished
   📦 Moved to completed_jobs collection
   🎯 Ready for verification/archive
```

---

## 📱 Mobile App Status Display

### Pending Jobs (Status: `pending`)
```
┌────────────────────────────────────┐
│ 🧹 Pre-arrival Cleaning            │
│ 🏠 Test Villa Paradise             │
│ 📅 Jan 7, 2026                     │
│ ⏳ Status: Pending                 │
│ 👥 Available to all cleaners       │
│                                     │
│        [  Accept Job  ]            │
└────────────────────────────────────┘
```

### Assigned Jobs (Status: `assigned`)
```
┌────────────────────────────────────┐
│ 🧹 Pre-arrival Cleaning            │
│ 🏠 Test Villa Paradise             │
│ 📅 Jan 7, 2026                     │
│ ✅ Status: Assigned to you         │
│ 🎯 Ready to start                  │
│                                     │
│        [  Start Job  ]             │
└────────────────────────────────────┘
```

### In Progress Jobs (Status: `in_progress`)
```
┌────────────────────────────────────┐
│ 🧹 Pre-arrival Cleaning            │
│ 🏠 Test Villa Paradise             │
│ 📅 Jan 7, 2026                     │
│ 🚀 Status: In Progress             │
│ 📸 Photos: 2 uploaded              │
│                                     │
│      [ Complete Job ]              │
└────────────────────────────────────┘
```

---

## 💻 Webapp Status Display

### Job Assignments Dashboard

**Pending Jobs (Yellow Badge):**
```
⏳ Pending | 🏠 Test Villa Paradise | 🧹 Pre-arrival Cleaning
   Scheduled: Jan 7, 2026 | Assigned: Unassigned
   [Broadcast to all cleaners]
```

**Assigned Jobs (Blue Badge):**
```
✅ Assigned | 🏠 Test Villa Paradise | 🧹 Pre-arrival Cleaning
   Scheduled: Jan 7, 2026 | Assigned: cleaner@siamoon.com
   [Waiting for cleaner to start]
```

**In Progress Jobs (Purple Badge):**
```
🚀 In Progress | 🏠 Test Villa Paradise | 🧹 Pre-arrival Cleaning
   Scheduled: Jan 7, 2026 | Assigned: cleaner@siamoon.com
   Started: 10:30 AM | Duration: 1h 20m
```

**Completed Jobs (Green Badge):**
```
✔️ Completed | 🏠 Test Villa Paradise | 🧹 Pre-arrival Cleaning
   Scheduled: Jan 7, 2026 | Completed by: cleaner@siamoon.com
   Finished: 12:00 PM | Photos: 5
```

---

## 🔄 State Transitions

### Transition 1: Creation → Pending
**Trigger:** Booking confirmed  
**Actor:** System (AutomaticJobCreationService)  
**Changes:**
```javascript
{
  status: 'pending',
  assignedStaffId: null,
  assignedTo: null,
  broadcastToAll: true,
  createdAt: timestamp
}
```

### Transition 2: Pending → Assigned
**Trigger:** Cleaner accepts job  
**Actor:** Cleaner (mobile app)  
**Changes:**
```javascript
{
  status: 'pending' → 'assigned',
  assignedStaffId: null → 'cleaner-uid',
  assignedTo: null → 'cleaner-uid',
  assignedStaffRef: { id, name, email },
  broadcastToAll: true → false,
  acceptedAt: timestamp,
  acceptedBy: 'cleaner-uid'
}
```
**Effect:**
- ✅ Job assigns to accepting cleaner
- ❌ Job disappears from other cleaners' lists
- 📊 Webapp shows job as "Assigned"

### Transition 3: Assigned → In Progress
**Trigger:** Cleaner starts job  
**Actor:** Cleaner (mobile app)  
**Changes:**
```javascript
{
  status: 'assigned' → 'in_progress',
  startedAt: timestamp,
  updatedAt: timestamp
}
```
**Effect:**
- 🚀 Job moves to "In Progress" state
- 📊 Webapp updates status badge to purple
- ⏱️ Timer starts tracking duration

### Transition 4: In Progress → Completed
**Trigger:** Cleaner completes job  
**Actor:** Cleaner (mobile app)  
**Changes:**
```javascript
{
  status: 'in_progress' → 'completed',
  completedAt: timestamp,
  completionPhotos: [...],
  completionNotes: '...',
  duration: calculated_duration
}
```
**Effect:**
- ✔️ Job marked complete
- 📦 Moved to completed_jobs collection
- 📅 Removed from calendar (or marked as done)

---

## 🚫 Edge Cases

### Case 1: Two Cleaners Accept Simultaneously
**Scenario:** Cleaner A and Cleaner B both tap "Accept" at the same time

**Result:**
- First Firebase write wins (timestamp-based)
- Second write fails (job already has assignedStaffId)
- Second cleaner sees error: "Job already taken"

**Prevention:**
```javascript
// Firebase transaction to prevent double-assignment
const jobRef = doc(db, 'jobs', jobId);
const jobSnap = await getDoc(jobRef);

if (jobSnap.data().assignedStaffId !== null) {
  throw new Error('Job already accepted by another cleaner');
}

await updateDoc(jobRef, { assignedStaffId: user.uid });
```

### Case 2: Cleaner Declines Job
**Scenario:** Cleaner doesn't want the job

**Result:**
```javascript
{
  declinedBy: {
    'cleaner-uid': {
      declinedAt: timestamp,
      reason: 'Not available'
    }
  },
  status: 'pending' // Stays pending for others!
}
```
**Effect:**
- ❌ Job disappears from that cleaner's list
- ✅ Job stays available for other cleaners
- 📊 Webapp still shows as "Pending"

### Case 3: No Cleaner Accepts Job
**Scenario:** Job stays pending for too long

**Solution:** Admin can manually assign:
- Admin selects cleaner in webapp
- Job status: `pending` → `assigned`
- Selected cleaner receives notification

---

## 🎨 Status Colors & Icons

| Status | Color | Badge | Icon |
|--------|-------|-------|------|
| Pending | Yellow (#FFC107) | ⏳ Pending | 🕐 |
| Assigned | Blue (#2196F3) | ✅ Assigned | ✓ |
| In Progress | Purple (#9C27B0) | 🚀 In Progress | → |
| Completed | Green (#4CAF50) | ✔️ Completed | ✓✓ |
| Declined | Gray (#9E9E9E) | ❌ Declined | ✗ |
| Cancelled | Red (#F44336) | 🚫 Cancelled | ⊘ |

---

## 📊 Firebase Document Structure

### Pending Job Example:
```javascript
{
  id: "YtnxvQzNdTPfcY5BanYm",
  title: "Pre-arrival Cleaning - Test Villa Paradise",
  status: "pending",
  
  // No assignment
  assignedStaffId: null,
  assignedTo: null,
  assignedStaffRef: null,
  
  // Broadcast flag
  broadcastToAll: true,
  
  // Property & booking details
  propertyId: "ZBlZH1VLYfAhaiEw3I5C",
  propertyName: "Test Villa Paradise",
  bookingId: "B5LpTNnabWx19INFg5NN",
  
  // Dates (ISO format for mobile)
  checkInDate: "2026-01-07",
  checkOutDate: "2026-01-10",
  scheduledDate: Timestamp,
  
  // Job details
  jobType: "pre_arrival_cleaning",
  priority: "high",
  estimatedDuration: 180,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Assigned Job Example:
```javascript
{
  id: "YtnxvQzNdTPfcY5BanYm",
  title: "Pre-arrival Cleaning - Test Villa Paradise",
  status: "assigned", // Changed!
  
  // Now has assignment
  assignedStaffId: "dEnHUdPyZU0Uutwt6Aj5",
  assignedTo: "dEnHUdPyZU0Uutwt6Aj5",
  assignedStaffRef: {
    id: "dEnHUdPyZU0Uutwt6Aj5",
    name: "Cleaner",
    email: "cleaner@siamoon.com",
    phone: "+1234567890"
  },
  
  // Broadcast disabled
  broadcastToAll: false,
  
  // Acceptance details
  acceptedAt: Timestamp,
  acceptedBy: "dEnHUdPyZU0Uutwt6Aj5",
  
  // Rest stays the same...
  propertyId: "ZBlZH1VLYfAhaiEw3I5C",
  checkInDate: "2026-01-07",
  // ...
}
```

---

## ✅ Summary

**Status Flow:**
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
```

**Visibility Rules:**
- `pending`: All cleaners see it
- `assigned`: Only assigned cleaner sees it
- `in_progress`: Only assigned cleaner sees it
- `completed`: Archived (admin can see in reports)

**Key Points:**
- ✅ Jobs start as "pending"
- ✅ First to accept gets "assigned"
- ✅ Status changes are real-time synced
- ✅ Other cleaners lose access immediately

---

**This is the correct workflow you described!** 🎯
