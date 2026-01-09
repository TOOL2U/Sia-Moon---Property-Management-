# Real-Time Job Status Sync - Testing Checklist ✅

## 🎯 Pre-Test Setup

- [ ] Webapp dev server running (`npm run dev`)
- [ ] Mobile app running on device/simulator
- [ ] Cleaner account ready (cleaner@siamoon.com)
- [ ] Browser DevTools console open
- [ ] Firebase console open (to monitor database changes)

---

## 📋 Test 1: Job Creation & Display

### Webapp (Admin Dashboard)

- [ ] Navigate to `/admin` dashboard
- [ ] Click "Send Test Job to Mobile" button
- [ ] See success toast with job ID
- [ ] **Check Console**: Should see `✅ Test job created: [jobId]`

### Webapp (Jobs Page)

- [ ] Navigate to `/jobs` page
- [ ] **Check Console**: Should see `🔥 Starting real-time subscription to all jobs (both collections)...`
- [ ] **Check Console**: Should see `✅ [operational_jobs] Jobs update: 1 total jobs, 1 changes`
- [ ] **Verify**: Job appears in jobs list
- [ ] **Verify**: Status badge shows "🟡 PENDING"
- [ ] **Verify**: Property name: "Mountain Retreat Cabin"
- [ ] **Verify**: Location: "Ban Tai, Koh Phangan"

### Mobile App

- [ ] Log in as cleaner@siamoon.com
- [ ] Open "Jobs" tab
- [ ] **Verify**: Job appears in "Available Jobs" section
- [ ] **Verify**: Job title: "Post-Checkout Cleaning - Mountain Retreat Cabin"
- [ ] **Verify**: Status: "pending"
- [ ] **Verify**: Can see job details (tap to open)

**✅ Test 1 PASSED** if job appears on all platforms

---

## 📋 Test 2: Job Acceptance (pending → accepted)

### Mobile App

- [ ] Tap on test job in "Available Jobs"
- [ ] Tap "Accept Job" button
- [ ] See success message
- [ ] **Verify**: Job moves to "My Jobs" section
- [ ] **Verify**: Status changes to "accepted"
- [ ] **Verify**: "Start Job" button appears

### Webapp (Jobs Page) - Watch Without Refreshing

- [ ] **DO NOT REFRESH** the page
- [ ] **Wait 1-2 seconds**
- [ ] **Check Console**: Should see:
  ```
  🔔 [operational_jobs] Job [id] status changed: pending → accepted
  ✅ [operational_jobs] Jobs update: 1 total jobs, 1 changes
  🔄 Job [id] status changed: pending → accepted
  ```
- [ ] **Verify**: Status badge changes to "🔵 ACCEPTED"
- [ ] **Verify**: Toast notification appears (if enabled): "✅ [Cleaner] accepted [Job Title]"
- [ ] **Verify**: "Accepted" filter count increases to 1
- [ ] **Verify**: "Pending" filter count decreases to 0

### Firebase Console

- [ ] Open Firestore console
- [ ] Navigate to `operational_jobs` collection
- [ ] Find test job document
- [ ] **Verify**: `status` field = "accepted"
- [ ] **Verify**: `assignedStaffId` field = [cleaner's Firebase UID]
- [ ] **Verify**: `acceptedAt` timestamp exists

**✅ Test 2 PASSED** if webapp updates without refresh

---

## 📋 Test 3: Job Start (accepted → in_progress)

### Mobile App

- [ ] In "My Jobs", tap on accepted job
- [ ] Tap "Start Job" button
- [ ] **Verify**: Job completion wizard opens
- [ ] **Verify**: Checklist appears
- [ ] **Verify**: Photo upload option available
- [ ] **Verify**: Timer starts

### Webapp (Jobs Page) - Watch Without Refreshing

- [ ] **DO NOT REFRESH** the page
- [ ] **Wait 1-2 seconds**
- [ ] **Check Console**: Should see:
  ```
  🔔 [operational_jobs] Job [id] status changed: accepted → in_progress
  ✅ [operational_jobs] Jobs update: 1 total jobs, 1 changes
  🔄 Job [id] status changed: accepted → in_progress
  ```
- [ ] **Verify**: Status badge changes to "🟣 IN PROGRESS"
- [ ] **Verify**: Toast notification (if enabled): "🚀 [Cleaner] started [Job Title]"
- [ ] **Verify**: Icon shows spinning/animated indicator
- [ ] **Verify**: "In Progress" filter count = 1
- [ ] **Verify**: "Accepted" filter count = 0

### Firebase Console

- [ ] Refresh Firestore console
- [ ] **Verify**: `status` field = "in_progress"
- [ ] **Verify**: `startedAt` timestamp exists

**✅ Test 3 PASSED** if webapp updates without refresh

---

## 📋 Test 4: Job Completion (in_progress → completed)

### Mobile App

- [ ] Complete checklist items
- [ ] Upload before/after photos (optional)
- [ ] Add completion notes
- [ ] Tap "Complete Job" button
- [ ] See success message
- [ ] **Verify**: Job moves to "Completed Jobs" tab
- [ ] **Verify**: Job shows completion timestamp
- [ ] **Verify**: Photos uploaded (if added)

### Webapp (Jobs Page) - Watch Without Refreshing

- [ ] **DO NOT REFRESH** the page
- [ ] **Wait 1-2 seconds**
- [ ] **Check Console**: Should see:
  ```
  🔔 [operational_jobs] Job [id] status changed: in_progress → completed
  ✅ [operational_jobs] Jobs update: 1 total jobs, 1 changes
  🔄 Job [id] status changed: in_progress → completed
  ```
- [ ] **Verify**: Status badge changes to "🟢 COMPLETED"
- [ ] **Verify**: Toast notification (if enabled): "🎉 [Job Title] has been completed!"
- [ ] **Verify**: Checkmark icon appears
- [ ] **Verify**: "Completed" filter count = 1
- [ ] **Verify**: "In Progress" filter count = 0

### Firebase Console

- [ ] Refresh Firestore console
- [ ] **Verify**: `status` field = "completed"
- [ ] **Verify**: `completedAt` timestamp exists
- [ ] **Verify**: `completionNotes` exists (if added)
- [ ] **Verify**: `completionPhotos` array exists (if added)

**✅ Test 4 PASSED** if webapp updates without refresh

---

## 📋 Test 5: Multi-User Sync

### Setup

- [ ] Open webapp in Browser Window #1
- [ ] Open webapp in Browser Window #2 (or different browser)
- [ ] Both windows on `/jobs` page
- [ ] Both windows show the same test job

### Mobile App

- [ ] Create a NEW test job (use dashboard button again)
- [ ] Accept the new job on mobile

### Both Webapp Windows - Watch Simultaneously

- [ ] **Verify**: Both windows show new job appear (pending)
- [ ] **Verify**: Both windows update to "accepted" at same time
- [ ] **Verify**: Both windows show same job count
- [ ] **Verify**: Both windows show same status badges

**✅ Test 5 PASSED** if both windows sync simultaneously

---

## 📋 Test 6: Connection Resilience

### Disconnect Network

- [ ] Disable WiFi/network on mobile device
- [ ] Mobile app: Accept a job (will queue locally)
- [ ] **Verify**: Mobile app shows "Offline" or queue indicator

### Reconnect Network

- [ ] Re-enable WiFi/network
- [ ] **Verify**: Mobile app syncs queued changes
- [ ] **Verify**: Firebase updates with queued job status change

### Webapp

- [ ] **Verify**: Webapp receives delayed update within 1-2 seconds of reconnection
- [ ] **Verify**: Console shows status change logs
- [ ] **Verify**: UI updates correctly

**✅ Test 6 PASSED** if offline changes sync on reconnect

---

## 📋 Test 7: Filter & Search Functionality

### Webapp Jobs Page

- [ ] Click "Pending" filter
- [ ] **Verify**: Only pending jobs show
- [ ] **Verify**: Job count matches badge

- [ ] Click "Accepted" filter
- [ ] **Verify**: Only accepted jobs show

- [ ] Click "In Progress" filter
- [ ] **Verify**: Only in-progress jobs show

- [ ] Click "Completed" filter
- [ ] **Verify**: Only completed jobs show

- [ ] Click "All" filter
- [ ] **Verify**: All jobs show regardless of status

### Real-Time Filter Updates

- [ ] Keep "Pending" filter active
- [ ] Mobile app: Accept a pending job
- [ ] **Verify**: Job disappears from filtered view (no longer pending)
- [ ] **Verify**: "Pending" count decreases
- [ ] Click "Accepted" filter
- [ ] **Verify**: Newly accepted job now appears

**✅ Test 7 PASSED** if filters update in real-time

---

## 📋 Test 8: Console Logging

### Check All Expected Logs

- [ ] **Initial Load**: `🔥 Starting real-time subscription to all jobs (both collections)...`
- [ ] **Jobs Collection**: `✅ [jobs] Jobs update: X total jobs, Y changes`
- [ ] **Operational Jobs**: `✅ [operational_jobs] Jobs update: X total jobs, Y changes`
- [ ] **New Job**: `➕ New job detected: [id] - [title] (pending)`
- [ ] **Status Change**: `🔔 [operational_jobs] Job [id] status changed: [old] → [new]`
- [ ] **Modified Job**: `✏️ Job modified: [id] - [title] ([old] → [new])`
- [ ] **Callback**: `🔄 Job [id] status changed: [old] → [new]`

**✅ Test 8 PASSED** if all logs appear correctly

---

## 📋 Test 9: Performance Check

### Monitor Browser DevTools

- [ ] Open Performance tab
- [ ] Record while accepting job on mobile
- [ ] **Verify**: No excessive re-renders
- [ ] **Verify**: Update completes within 1-2 seconds
- [ ] **Verify**: No memory leaks

### Monitor Network Tab

- [ ] **Verify**: No XHR/fetch requests on status change
- [ ] **Verify**: Uses WebSocket (Firebase) for real-time updates
- [ ] **Verify**: No polling requests

**✅ Test 9 PASSED** if performance is acceptable

---

## 📋 Test 10: Error Handling

### Invalid Job Status

- [ ] Firebase console: Manually change job status to invalid value (e.g., "unknown")
- [ ] **Verify**: Webapp doesn't crash
- [ ] **Verify**: Console shows error log (if any)
- [ ] **Verify**: UI shows job with original or default status

### Missing Fields

- [ ] Firebase console: Remove `propertyName` field from job
- [ ] **Verify**: Webapp still renders job
- [ ] **Verify**: Shows fallback value or "Unknown Property"

### Listener Errors

- [ ] Firebase console: Change security rules to deny read (temporarily)
- [ ] **Verify**: Webapp shows error in console
- [ ] **Verify**: Error callback fires
- [ ] **Verify**: UI shows error state
- [ ] Restore security rules

**✅ Test 10 PASSED** if errors handled gracefully

---

## 🎉 Final Verification

### All Tests Passed?

- [ ] ✅ Test 1: Job Creation & Display
- [ ] ✅ Test 2: Job Acceptance (pending → accepted)
- [ ] ✅ Test 3: Job Start (accepted → in_progress)
- [ ] ✅ Test 4: Job Completion (in_progress → completed)
- [ ] ✅ Test 5: Multi-User Sync
- [ ] ✅ Test 6: Connection Resilience
- [ ] ✅ Test 7: Filter & Search Functionality
- [ ] ✅ Test 8: Console Logging
- [ ] ✅ Test 9: Performance Check
- [ ] ✅ Test 10: Error Handling

### Success Criteria

- [ ] All status changes reflected in real-time (<2 seconds)
- [ ] No page refreshes required
- [ ] Multiple users stay synchronized
- [ ] Console logs show detailed status changes
- [ ] Performance is acceptable (no lag or excessive renders)
- [ ] Error handling is graceful

---

## 📊 Test Results Summary

**Date Tested**: __________

**Tester**: __________

**Results**:
- [ ] All tests passed ✅
- [ ] Some tests failed (list below) ⚠️

**Failed Tests**:
1. _______________________________
2. _______________________________
3. _______________________________

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🔧 Troubleshooting Failed Tests

### Job not appearing in webapp

**Check**:
1. Firebase console: Does job exist in `operational_jobs`?
2. Browser console: Are listeners active?
3. Network tab: Is WebSocket connected?

**Fix**: Refresh page, check Firebase connection

### Status not updating in real-time

**Check**:
1. Console: Are status change logs appearing?
2. Mobile app: Did status update complete successfully?
3. Firebase console: Is status field updated?

**Fix**: Check Firebase security rules, verify listeners

### Multiple duplicate jobs

**Check**:
1. Firebase console: Does job exist in BOTH collections?

**Fix**: Jobs should only be in ONE collection (either `jobs` or `operational_jobs`)

---

## 📞 Support

If tests fail:
1. Check `JOB_STATUS_SYNC_COMPLETE.md` troubleshooting section
2. Review console logs for error messages
3. Verify Firebase security rules allow read/write
4. Ensure Firebase indexes are deployed
5. Check mobile app is updating Firebase correctly

---

**Ready to begin testing!** 🚀

Start with Test 1 and work through sequentially.
