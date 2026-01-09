# 🚨 URGENT: Mobile App Job Query Fix Required

**Date:** January 6, 2026  
**Priority:** HIGH  
**From:** WebApp Team  
**To:** Mobile App Team

---

## 🔴 PROBLEM

The mobile app is **NOT showing any jobs** to cleaners after we implemented the new broadcast workflow on the webapp side.

### Symptoms
- Mobile app logs show: `✅ Found 0 jobs using 'assignedStaffId'`
- Mobile app logs show: `⚠️ No jobs found with assignedStaffId, trying assignedTo...`
- Firebase has **2 pending jobs** that should appear
- Jobs have: `status: 'pending'`, `assignedStaffId: null`, `requiredRole: 'cleaner'`
- Staff profile has: `role: 'cleaner'`

---

## 🎯 NEW WORKFLOW (WebApp Side - COMPLETED)

We've implemented a new job broadcast system:

### Job Creation (WebApp)
```javascript
// Jobs are now created as "pending" and broadcast to ALL cleaners
{
  status: 'pending',
  assignedStaffId: null,  // ⚠️ This is now NULL initially!
  requiredRole: 'cleaner',
  requiredStaffType: 'cleaner',
  broadcastToAll: true,
  declinedBy: {}  // Track who declined
}
```

### Status Flow
```
pending → assigned → in_progress → completed
   ↓
First cleaner to accept gets it assigned
```

---

## ⚠️ ROOT CAUSE

The mobile app is querying ONLY for jobs where:
- `assignedStaffId == staffId` (current query)
- OR `assignedTo == staffId` (fallback query)

**This won't work anymore** because pending jobs have `assignedStaffId: null`!

---

## ✅ REQUIRED FIX

### File to Modify
Find the file that contains these log statements:
```
🔍 Trying query with assignedStaffId...
⚠️ No jobs found with assignedStaffId, trying assignedTo...
```

This is likely in:
- `StaffJobService` or similar service
- `SecureFirestore` service
- Wherever job queries are executed

### Current Query (BROKEN)
```typescript
// ❌ BROKEN: Only gets assigned jobs
const jobsQuery = query(
  collection(db, 'jobs'),
  where('assignedStaffId', '==', currentStaffId)
);
```

### New Query (FIXED)
```typescript
// ✅ FIXED: Get all active jobs, filter client-side
const jobsQuery = query(
  collection(db, 'jobs'),
  orderBy('createdAt', 'desc')
);

// Then filter in the snapshot listener:
onSnapshot(jobsQuery, (snapshot) => {
  const jobList = [];
  const staffRole = staffProfile?.role || 'cleaner';
  
  snapshot.forEach((doc) => {
    const job = doc.data();
    
    // Skip completed/cancelled jobs
    const validStatuses = ['pending', 'assigned', 'accepted', 'in_progress'];
    if (!validStatuses.includes(job.status)) {
      return;
    }
    
    // Show jobs that are either:
    // 1. Assigned to this staff member
    // 2. Pending AND match staff role AND not declined by this staff
    const isAssignedToMe = job.assignedStaffId === currentStaffId;
    const isPending = job.status === 'pending';
    const hasDeclined = job.declinedBy?.[currentStaffId] === true;
    const jobRole = job.requiredRole || 'cleaner';
    const roleMatches = jobRole.toLowerCase() === staffRole.toLowerCase();
    
    if (isAssignedToMe || (isPending && !hasDeclined && roleMatches)) {
      jobList.push(job);
    }
  });
  
  // Update state with filtered jobs
});
```

---

## 📋 TESTING CHECKLIST

After making the fix:

### 1. **Check Job Visibility**
- [ ] Login as `cleaner@siamoon.com`
- [ ] Should see **2 pending jobs** on home screen
- [ ] Jobs should show property name, dates, task type

### 2. **Test Accept Flow**
- [ ] Tap "Accept" on a job
- [ ] Job should change to "assigned" status
- [ ] Job should remain visible (now as assigned)
- [ ] Other cleaners should NOT see this job anymore

### 3. **Test Decline Flow**
- [ ] Tap "Decline" on a job
- [ ] Job should disappear from YOUR view
- [ ] Job should remain "pending" for OTHER cleaners

### 4. **Test Role Filtering**
- [ ] Jobs with `requiredRole: 'cleaner'` should show for cleaners
- [ ] Jobs with `requiredRole: 'manager'` should NOT show for cleaners

---

## 🔍 CURRENT FIREBASE DATA

### Test Jobs Created
```javascript
Job ID: gL607lrRClaPrAb15gpj
- Property: Sunset Villa
- Type: Pre-arrival Cleaning
- Status: pending
- RequiredRole: cleaner
- AssignedStaffId: null

Job ID: g0sBeYwr0eiZ75WYoUgi
- Property: Sunset Villa
- Type: Post-checkout Cleaning
- Status: pending
- RequiredRole: cleaner
- AssignedStaffId: null
```

### Staff Profile
```javascript
Staff ID: dEnHUdPyZU0Uutwt6Aj5
Email: cleaner@siamoon.com
Role: cleaner
StaffType: cleaner
```

---

## 🛠️ ADDITIONAL NOTES

### Why This Change?
- **Old System**: Jobs auto-assigned to one cleaner (rigid, no choice)
- **New System**: Jobs broadcast to all cleaners (flexible, first-come-first-served)

### Benefits
- Cleaners can choose jobs that fit their schedule
- Better workload distribution
- Faster job acceptance
- Cleaner preference tracking (declined jobs)

### Important Fields
```typescript
interface Job {
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedStaffId: string | null;  // NULL for pending jobs!
  requiredRole: 'cleaner' | 'manager' | 'maintenance';
  requiredStaffType: string;
  broadcastToAll: boolean;
  declinedBy: { [staffId: string]: boolean };
}
```

---

## ⏱️ URGENCY

**HIGH PRIORITY** - This is blocking cleaner operations. Cleaners cannot see or accept jobs.

### Expected Timeline
Please implement and test within **1-2 hours** if possible.

---

## 📞 CONTACT

If you need clarification or help:
- Check Firebase Console: Collections `jobs`, `staff_members`, `users`
- Test with: `cleaner@siamoon.com` (Staff ID: `dEnHUdPyZU0Uutwt6Aj5`)
- Expected result: Should see 2 pending jobs immediately after fix

---

## ✅ CONFIRMATION NEEDED

After implementing the fix, please confirm:
1. [ ] Mobile app shows 2 pending jobs for cleaner@siamoon.com
2. [ ] Accept button works and assigns job
3. [ ] Decline button works and hides job
4. [ ] Role filtering is working correctly

---

**End of Report**
