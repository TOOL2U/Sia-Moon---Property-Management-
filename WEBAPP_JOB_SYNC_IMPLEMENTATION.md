# Webapp Job Status Sync Implementation

## 📋 Overview

Based on the mobile app team's job lifecycle documentation, this guide ensures that when the mobile app updates job statuses in the `operational_jobs` collection, those changes are immediately reflected in:

1. **Tasks/Jobs Page** (`/jobs`)
2. **Calendar View** (`/calendar`)

## 🔄 Job Lifecycle (Mobile App → Webapp)

```
Mobile App Updates:
pending → accepted → in_progress → completed

Webapp Must Reflect:
✅ Jobs page shows updated status in real-time
✅ Calendar events update status/color in real-time
✅ No page refresh needed
```

## 🎯 Changes Required

### 1. Update RealtimeJobSyncService

**File**: `src/services/RealtimeJobSyncService.ts`

**Current**: Only listens to `jobs` collection
**Required**: Listen to BOTH `jobs` and `operational_jobs` collections

### 2. Update RealTimeCalendarService

**File**: `src/services/RealTimeCalendarService.ts`

**Current**: Only listens to `calendarEvents` collection
**Required**: Also listen to `operational_jobs` and create/update calendar events automatically

### 3. Update Jobs Page

**File**: `src/app/jobs/page.tsx`

**Current**: Fetches jobs once using `JobEngineService.getAllJobs()`
**Required**: Use `useAllJobs()` hook for real-time updates

## 📝 Implementation Details

### Phase 1: Dual Collection Support in RealtimeJobSyncService

```typescript
// Listen to both collections in parallel
subscribeToAllJobs(onUpdate, onError) {
  // Listener 1: jobs collection (mobile app native)
  const unsubscribe1 = onSnapshot(
    query(collection(db, 'jobs'), orderBy('scheduledDate', 'desc')),
    handleSnapshot
  );
  
  // Listener 2: operational_jobs collection (webapp created)
  const unsubscribe2 = onSnapshot(
    query(collection(db, 'operational_jobs'), orderBy('createdAt', 'desc')),
    handleSnapshot
  );
  
  // Return combined unsubscribe function
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
}
```

### Phase 2: Calendar Sync for operational_jobs

```typescript
// Add listener to operational_jobs in RealTimeCalendarService
subscribeToJobUpdates() {
  onSnapshot(
    collection(db, 'operational_jobs'),
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const job = change.doc.data();
        
        if (change.type === 'added') {
          // Create calendar event
          await this.createCalendarEventFromJob(job);
        } else if (change.type === 'modified') {
          // Update calendar event status
          await this.updateCalendarEventFromJob(job);
        } else if (change.type === 'removed') {
          // Remove calendar event (optional)
          await this.removeCalendarEvent(job.id);
        }
      });
    }
  );
}

private async createCalendarEventFromJob(job) {
  const calendarEvent = {
    id: `job-${job.id}`,
    title: job.title || `${job.jobType} - ${job.propertyName}`,
    type: 'job',
    subType: job.jobType,
    startDate: job.scheduledStart?.toDate().toISOString(),
    endDate: new Date(
      job.scheduledStart.toDate().getTime() + job.estimatedDuration * 60000
    ).toISOString(),
    propertyName: job.propertyName,
    propertyId: job.propertyId,
    assignedStaff: job.assignedStaffName,
    staffId: job.assignedStaffId,
    status: job.status,
    color: this.getJobStatusColor(job.status),
    jobId: job.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(doc(db, 'calendarEvents', `job-${job.id}`), calendarEvent);
}

private getJobStatusColor(status) {
  const colors = {
    pending: '#FFA500',    // Orange
    accepted: '#4169E1',   // Royal Blue
    in_progress: '#9370DB', // Purple
    completed: '#228B22'   // Forest Green
  };
  return colors[status] || '#808080';
}
```

### Phase 3: Jobs Page Real-Time Hook

```typescript
'use client'

import { useAllJobs } from '@/hooks/useRealtimeJobs'

export default function JobsPage() {
  // Replace static fetch with real-time hook
  const { jobs, loading, error } = useAllJobs({
    showNotifications: true,
    onJobStatusChange: (job, previousStatus) => {
      console.log(`Job ${job.id} status changed: ${previousStatus} → ${job.status}`);
    }
  });
  
  // jobs array now updates automatically!
  // No need for fetchJobsAndOffers() or manual refresh
}
```

## 🔍 Status Change Detection

### Mobile App Updates Operational Jobs

```javascript
// Mobile app (when cleaner accepts job)
await updateDoc(doc(db, 'operational_jobs', jobId), {
  status: 'accepted',
  assignedStaffId: firebaseUid,
  acceptedAt: serverTimestamp()
});
```

### Webapp Receives Update (within 1-2 seconds)

```javascript
// RealtimeJobSyncService listener fires
onSnapshot callback receives:
- change.type: 'modified'
- change.doc.data().status: 'accepted'
- previousStatus: 'pending'

// Triggers:
1. Jobs page re-renders with new status
2. Calendar event updates color/status
3. Toast notification (optional)
```

## 🎨 Status Badge Colors

| Status | Color | Badge |
|--------|-------|-------|
| pending | Yellow | ⏳ Pending |
| accepted | Blue | ✅ Accepted |
| in_progress | Purple | 🚀 In Progress |
| completed | Green | 🎉 Completed |
| cancelled | Red | ❌ Cancelled |

## 📊 Calendar Status Colors

| Status | Color Code | Visual |
|--------|-----------|--------|
| pending | #FFA500 | 🟠 Orange |
| accepted | #4169E1 | 🔵 Royal Blue |
| in_progress | #9370DB | 🟣 Purple |
| completed | #228B22 | 🟢 Forest Green |

## ✅ Testing Checklist

### Test 1: Job Status Change (Mobile → Webapp)

1. **Mobile app**: Cleaner accepts job
   - Job status: `pending` → `accepted`
   - Firebase: `operational_jobs/{jobId}.status = 'accepted'`

2. **Webapp jobs page**: Should show updated status
   - Badge changes: Yellow "Pending" → Blue "Accepted"
   - No page refresh needed
   - Update happens within 1-2 seconds

3. **Webapp calendar**: Should show updated event
   - Event color changes: Orange → Royal Blue
   - Event status badge updates
   - No page refresh needed

### Test 2: Job Progress (Mobile → Webapp)

1. **Mobile app**: Cleaner starts job
   - Job status: `accepted` → `in_progress`
   - Firebase: `operational_jobs/{jobId}.status = 'in_progress'`

2. **Webapp jobs page**: Should show updated status
   - Badge changes: Blue "Accepted" → Purple "In Progress"
   - Shows spinner/animated icon

3. **Webapp calendar**: Should show updated event
   - Event color changes: Royal Blue → Purple
   - May show animated indicator

### Test 3: Job Completion (Mobile → Webapp)

1. **Mobile app**: Cleaner completes job
   - Job status: `in_progress` → `completed`
   - Firebase: `operational_jobs/{jobId}.status = 'completed'`

2. **Webapp jobs page**: Should show updated status
   - Badge changes: Purple "In Progress" → Green "Completed"
   - Shows checkmark icon

3. **Webapp calendar**: Should show updated event
   - Event color changes: Purple → Forest Green
   - May move to completed section

### Test 4: New Job Creation (Webapp → Mobile → Webapp)

1. **Webapp**: Admin creates job
   - Job created in `operational_jobs` collection
   - Status: `pending`

2. **Mobile app**: Cleaner sees new job
   - Appears in "Available Jobs" section

3. **Webapp jobs page**: Should show new job immediately
   - Real-time listener picks up new job
   - No refresh needed

4. **Webapp calendar**: Should show new event
   - Calendar event auto-created from job
   - Orange color (pending status)

## 🚀 Expected Behavior

### Real-Time Updates

✅ **No page refresh needed**
✅ **Updates appear within 1-2 seconds**
✅ **Multiple users stay synchronized**
✅ **Offline changes sync when reconnected**

### Jobs Page

- Shows all jobs from both `jobs` and `operational_jobs` collections
- Status badges update in real-time
- Toast notifications for status changes (optional)
- Filter by status works correctly

### Calendar View

- Shows jobs as calendar events
- Event colors match job status
- Events update when job status changes
- Supports filtering by property/date

## 🔧 Implementation Files

1. **`src/services/RealtimeJobSyncService.ts`**
   - Add `operational_jobs` listener
   - Merge results from both collections
   - Detect status changes

2. **`src/services/RealTimeCalendarService.ts`**
   - Add `operational_jobs` listener
   - Auto-create calendar events from jobs
   - Auto-update calendar events when job status changes

3. **`src/app/jobs/page.tsx`**
   - Replace `useState` + `fetchJobsAndOffers()` with `useAllJobs()` hook
   - Remove manual refresh logic
   - Remove `useEffect` fetch calls

4. **`src/components/calendar/RealTimeCalendar.tsx`**
   - Already using real-time hooks
   - May need job-specific styling

## 📝 Code Changes Summary

### 1. RealtimeJobSyncService.ts

```typescript
// Add OPERATIONAL_JOBS_COLLECTION constant
private static readonly OPERATIONAL_JOBS_COLLECTION = 'operational_jobs';

// Update subscribeToAllJobs to listen to both collections
// Update subscribeToPropertyJobs to listen to both collections
// Update subscribeToStaffJobs to listen to both collections
```

### 2. RealTimeCalendarService.ts

```typescript
// Add subscribeToJobUpdates method
// Add createCalendarEventFromJob method
// Add updateCalendarEventFromJob method
// Add getJobStatusColor method
```

### 3. jobs/page.tsx

```typescript
// Remove: const [jobs, setJobs] = useState<Job[]>([])
// Remove: const [loading, setLoading] = useState(true)
// Remove: fetchJobsAndOffers function
// Remove: useEffect(() => { fetchJobsAndOffers() }, [])

// Add: const { jobs, loading } = useAllJobs({ showNotifications: true })
```

## 🎯 Success Metrics

- ✅ Jobs page updates within 1-2 seconds of mobile app status change
- ✅ Calendar events update within 1-2 seconds of mobile app status change
- ✅ No manual refresh needed
- ✅ Multiple admin users see same updates simultaneously
- ✅ Console logs show real-time listener activity
- ✅ Toast notifications appear for status changes (if enabled)

## 🚨 Troubleshooting

### Issue: Jobs page not updating

**Check:**
1. Is `useAllJobs()` hook being used?
2. Are console logs showing listener activity?
3. Is Firebase connection active?

**Debug:**
```typescript
const { jobs, loading, error } = useAllJobs({ showNotifications: true });
console.log('Jobs:', jobs.length, 'Loading:', loading, 'Error:', error);
```

### Issue: Calendar not showing jobs

**Check:**
1. Are calendar events being created from jobs?
2. Is `operational_jobs` listener active in RealTimeCalendarService?
3. Are job → calendar event conversions working?

**Debug:**
```typescript
// Check calendarEvents collection in Firebase console
// Should see documents with id: `job-{jobId}`
```

### Issue: Status changes delayed

**Check:**
1. Network connection
2. Firebase connection status
3. Firestore indexes deployed

**Monitor:**
```typescript
// Check console for real-time listener logs
// Should see: "🔥 Job status changed: pending → accepted"
```

## 📚 Related Documentation

- Mobile App: `JOB_LIFECYCLE_GUIDE.md`
- Mobile App: `JOB_STATUS_UPDATES_COMPLETE.md`
- Mobile App: `OPERATIONAL_JOBS_INTEGRATION_COMPLETE.md`
- Webapp: `REALTIME_SYNC_IMPLEMENTATION_GUIDE.md`

## ✅ Implementation Checklist

- [ ] Update `RealtimeJobSyncService.ts` to listen to `operational_jobs`
- [ ] Update `RealTimeCalendarService.ts` to sync job status to calendar
- [ ] Update `jobs/page.tsx` to use `useAllJobs()` hook
- [ ] Test job acceptance (pending → accepted)
- [ ] Test job start (accepted → in_progress)
- [ ] Test job completion (in_progress → completed)
- [ ] Verify calendar events update
- [ ] Verify no page refresh needed
- [ ] Deploy Firebase indexes if needed

---

**Ready to implement?** Start with Phase 1 (RealtimeJobSyncService) and test before moving to Phase 2 (Calendar sync).
