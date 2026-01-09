# 🚀 Mobile Team Quick Start - Calendar Sync

**⏱️ 2-Minute Read | Essential Info Only**

---

## 🎯 What Changed

The webapp calendar now **automatically syncs** with job status changes. When staff update jobs in your mobile app, the calendar updates in real-time with color-coded status indicators.

---

## 🎨 Status Colors (Copy These!)

```typescript
// In your mobile app constants file
export const JOB_STATUSES = {
  PENDING: 'pending',       // 🟠 Orange (#FFA500)
  ACCEPTED: 'accepted',     // 🔵 Blue (#4169E1)
  IN_PROGRESS: 'in_progress', // 🟣 Purple (#9370DB)
  COMPLETED: 'completed',   // 🟢 Green (#228B22)
  CANCELLED: 'cancelled',   // ⚫ Gray (#808080)
  FAILED: 'failed'          // 🔴 Red (#DC143C)
}
```

---

## ✅ What You Need to Do

### 1. Use Exact Status Strings

```typescript
// ✅ CORRECT - Use these exact strings
await updateDoc(doc(db, 'operational_jobs', jobId), {
  status: 'in_progress',  // lowercase, underscore
  updatedAt: serverTimestamp()
})

// ❌ WRONG - Don't use these
status: 'In Progress'   // Wrong: capital letters
status: 'in-progress'   // Wrong: hyphen instead of underscore
status: 'inprogress'    // Wrong: no separator
status: 'ACCEPTED'      // Wrong: all caps
```

### 2. Always Use Server Timestamps

```typescript
// ✅ CORRECT
import { serverTimestamp } from 'firebase/firestore'

await updateDoc(jobRef, {
  status: 'completed',
  completedAt: serverTimestamp(),  // ← Use this
  updatedAt: serverTimestamp()
})

// ❌ WRONG
completedAt: new Date()  // Client time can cause sync issues
updatedAt: Date.now()
```

### 3. Include Required Fields in New Jobs

```typescript
// Minimum required for calendar to work
{
  status: 'pending',
  scheduledStart: Timestamp.now(),
  
  // Highly recommended (for better display)
  title: 'Deep Cleaning - Villa A',
  propertyName: 'Mountain Retreat',
  assignedStaffName: 'Sarah Johnson',
  assignedStaffId: 'sarah_123',
  jobType: 'cleaning',
  duration: 120  // minutes
}
```

---

## 🧪 Quick Test

**5-Minute Integration Test:**

1. Open webapp calendar page in browser
2. Mobile app: Accept a pending job
   ```typescript
   updateDoc(jobRef, { status: 'accepted' })
   ```
3. Watch calendar: Event turns blue (1-2 seconds)
4. Mobile app: Start the job
   ```typescript
   updateDoc(jobRef, { status: 'in_progress' })
   ```
5. Watch calendar: Event turns purple (1-2 seconds)
6. Mobile app: Complete the job
   ```typescript
   updateDoc(jobRef, { status: 'completed' })
   ```
7. Watch calendar: Event turns green (1-2 seconds)

**✅ If colors change automatically, integration is working!**

---

## ❌ What You DON'T Need to Do

- ❌ Call any calendar API
- ❌ Create calendar events manually
- ❌ Sync calendar yourself
- ❌ Change your existing code structure

**Just update `operational_jobs` collection as normal. Webapp handles everything else!**

---

## 🐛 Quick Troubleshooting

### Calendar event not appearing?

**Check:**
```typescript
// 1. Does job have scheduledStart?
scheduledStart: Timestamp.now()  // ✅ Required

// 2. Is status a valid string?
status: 'pending'  // ✅ Must be one of 6 values

// 3. Can you write to Firestore?
// Check Firebase console → Firestore → operational_jobs
```

### Color not changing?

**Check:**
```typescript
// 1. Are you using exact status strings?
'in_progress' ✅  vs  'In Progress' ❌

// 2. Check browser console logs:
// Should see: "🔄 Calendar event updated for job xyz: in_progress → #9370DB"
```

### Offline sync not working?

**Check:**
```typescript
// 1. Is Firebase persistence enabled?
import { enableIndexedDbPersistence } from 'firebase/firestore'
await enableIndexedDbPersistence(db)

// 2. Are you using serverTimestamp()?
// Offline writes need server timestamps to sync correctly
```

---

## 📊 Status Flow Example

```typescript
// 1. Job Created
await addDoc(collection(db, 'operational_jobs'), {
  status: 'pending',
  // ... other fields
})
// → Calendar: 🟠 Orange event appears

// 2. Staff Accepts
await updateDoc(jobRef, { status: 'accepted' })
// → Calendar: 🔵 Turns blue (1-2 sec)

// 3. Staff Starts
await updateDoc(jobRef, { status: 'in_progress' })
// → Calendar: 🟣 Turns purple (1-2 sec)

// 4. Staff Completes
await updateDoc(jobRef, { status: 'completed' })
// → Calendar: 🟢 Turns green (1-2 sec)
```

---

## 📞 Need Help?

**For detailed info, see:** `CALENDAR_SYNC_IMPLEMENTATION_REPORT.md`

**Quick checks:**
1. Browser console: Look for "✅ Job sync to calendar activated"
2. Firebase console: Check `operational_jobs` and `calendarEvents` collections
3. Network tab: Verify WebSocket connection to Firebase

---

## ✅ Checklist Before Going Live

Mobile App:
- [ ] Using exact status strings (`'pending'`, `'accepted'`, `'in_progress'`, `'completed'`)
- [ ] Using `serverTimestamp()` for all timestamps
- [ ] Including `scheduledStart` field in new jobs
- [ ] Tested acceptance flow (pending → accepted)
- [ ] Tested start flow (accepted → in_progress)
- [ ] Tested completion flow (in_progress → completed)
- [ ] Tested offline → online sync

Webapp:
- [x] Calendar displays color-coded events ✅
- [x] Real-time updates working (no refresh) ✅
- [x] Sync logs in browser console ✅

---

**That's it! Just use the correct status strings and webapp does the rest. 🎉**

---

**Version:** 1.0  
**Date:** January 9, 2026  
**Status:** Production Ready ✅
