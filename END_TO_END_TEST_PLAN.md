# 🎯 End-to-End Booking → Job → Mobile Test Plan

## ✅ Phase 1: CLEANUP (COMPLETED)

**Status:** ✅ **DONE** - All jobs cleared
- Deleted: 8 active jobs
- Deleted: 9 completed jobs
- Total: 17 jobs removed

**Verification:**
- ✅ Webapp Job Assignments should show 0 jobs
- ✅ Mobile app should show 0 jobs for cleaner@siamoon.com

---

## 🧪 Phase 2: CREATE TEST BOOKINGS

### Test Scenario 1: Single Booking with Automatic Job Creation

**Booking Details:**
```
Property: Test Villa Paradise (or any test property)
Guest: John Test Guest
Check-in: January 7, 2026 (tomorrow)
Check-out: January 10, 2026 (3 days)
Status: Confirmed
```

**Expected Automatic Jobs:**
1. **Pre-arrival Cleaning** (scheduled for Jan 6, 2026 - today)
2. **Post-checkout Cleaning** (scheduled for Jan 10, 2026 - checkout day)

**Assigned To:**
- Staff: cleaner@siamoon.com (ID: dEnHUdPyZU0Uutwt6Aj5)

---

### Test Scenario 2: Multiple Overlapping Bookings

**Booking A:**
```
Property: Test Villa Paradise
Check-in: January 8, 2026
Check-out: January 11, 2026
```

**Booking B:**
```
Property: Villa Calendar Test Property
Check-in: January 12, 2026
Check-out: January 15, 2026
```

**Expected Jobs:**
1. Pre-arrival Cleaning (Jan 8) - Villa Paradise
2. Post-checkout Cleaning (Jan 11) - Villa Paradise
3. Pre-arrival Cleaning (Jan 12) - Villa Calendar Test
4. Post-checkout Cleaning (Jan 15) - Villa Calendar Test

---

## 📋 Phase 3: VERIFICATION CHECKLIST

### A. Webapp Verification

**Location:** `/admin/backoffice` → Job Assignments tab

**Check:**
- [ ] Total job count matches expected (e.g., 2 jobs for single booking)
- [ ] Each job shows:
  - [ ] ✅ Correct title (Pre-arrival/Post-checkout Cleaning)
  - [ ] ✅ Correct property name
  - [ ] ✅ Correct status (should be "Assigned" initially)
  - [ ] ✅ Assigned to cleaner@siamoon.com
  - [ ] ✅ Correct scheduled date
  - [ ] ✅ Check-in date matches booking
  - [ ] ✅ Check-out date matches booking

**Filter Test:**
- [ ] Apply staff filter → Select cleaner → Shows correct jobs
- [ ] Apply status filter → "Assigned" → Shows new jobs
- [ ] Apply date filter → "Today" → Shows jobs scheduled for today

---

### B. Mobile App Verification

**Logged in as:** cleaner@siamoon.com

**Check:**
- [ ] Total job count matches webapp (filtered by cleaner)
- [ ] Each job displays:
  - [ ] ✅ Job title
  - [ ] ✅ Property name
  - [ ] ✅ Status badge (Assigned)
  - [ ] ✅ Check-in date showing as "YYYY-MM-DD" (not "Invalid Date")
  - [ ] ✅ Check-out date showing as "YYYY-MM-DD" (not "Invalid Date")
  - [ ] ✅ Job type (Pre-arrival/Post-checkout)
  - [ ] ✅ Can tap to view details

**Action Test:**
- [ ] Tap "Accept Job" → Status changes to "Accepted"
- [ ] Webapp updates in real-time (< 5 seconds)
- [ ] Tap "Start Job" → Status changes to "In Progress"
- [ ] Webapp updates in real-time
- [ ] Upload photos → No errors (storage rules working)
- [ ] Complete job → Status changes to "Completed"
- [ ] Webapp calendar updates (job removed from calendar)
- [ ] Job moves to completed_jobs collection

---

### C. Real-Time Sync Verification

**Test:**
1. Keep both webapp and mobile app open side-by-side
2. On mobile: Accept a job
3. Watch webapp: Should update within 5 seconds
4. On mobile: Start the job
5. Watch webapp: Status badge should change to "In Progress"
6. On mobile: Complete the job
7. Watch webapp: Job should disappear from calendar (or move to completed)

**Expected:**
- ✅ Updates appear in < 5 seconds
- ✅ No page refresh needed
- ✅ Toast notifications appear on status changes

---

## 🔧 Phase 4: CREATE TEST BOOKINGS (MANUAL STEPS)

### Option A: Use Webapp Booking Form

**Steps:**
1. Navigate to `/bookings` or `/admin/bookings`
2. Click "Create New Booking" or "Add Booking"
3. Fill in booking details:
   - Guest name: John Test Guest
   - Email: john@test.com
   - Property: Select test property
   - Check-in: January 7, 2026
   - Check-out: January 10, 2026
   - Status: Confirmed
4. Save booking
5. Check console for automatic job creation logs
6. Verify jobs appear in Job Assignments tab

---

### Option B: Use Test Script (Automated)

**Run:**
```bash
node create-test-booking.js
```

**This will:**
- Create 1 test booking
- Automatically create 2 jobs (pre-arrival + post-checkout)
- Assign jobs to cleaner@siamoon.com
- Return job IDs for verification

---

## 📊 Phase 5: EXPECTED RESULTS

### Successful Test Indicators:

**Webapp:**
- ✅ Job Assignments shows 2-4 jobs (depending on # of bookings)
- ✅ All jobs assigned to cleaner@siamoon.com
- ✅ Dates display correctly
- ✅ Status shows "Assigned"
- ✅ Real-time updates working (no refresh needed)

**Mobile App:**
- ✅ Shows same job count as webapp (filtered by cleaner)
- ✅ Dates show as "2026-01-07" format (NOT "Invalid Date")
- ✅ Can accept, start, and complete jobs
- ✅ Photo uploads work (no storage errors)
- ✅ Status changes sync to webapp instantly

**Firebase Console:**
- ✅ jobs collection: 2-4 documents
- ✅ Each job has:
  - assignedTo: "dEnHUdPyZU0Uutwt6Aj5"
  - status: "assigned"
  - checkInDate: "2026-01-07" (ISO format)
  - checkOutDate: "2026-01-10" (ISO format)
  - bookingRef: { id, dates, property }

---

## 🚨 Troubleshooting

### Issue: Jobs not created automatically

**Check:**
1. BookingService.ts - createBooking method
2. AutomaticJobCreationService.ts - createJobsForBooking
3. Console logs for errors
4. Firebase Rules - jobs collection write permissions

**Fix:** Verify booking status is "confirmed" (jobs only create for confirmed bookings)

---

### Issue: Jobs created but not showing on mobile

**Check:**
1. assignedTo field matches cleaner ID: "dEnHUdPyZU0Uutwt6Aj5"
2. Mobile app query: `where('assignedTo', '==', userId)`
3. Firebase auth - mobile user logged in correctly
4. Network connectivity

**Fix:** Check Firebase console - verify assignedTo field on jobs

---

### Issue: Dates showing "Invalid Date" on mobile

**Check:**
1. JobAssignmentService.ts - formatDateForMobile helper
2. checkInDate and checkOutDate fields
3. Console logs on mobile for date format

**Fix:** Should already be fixed with ISO format conversion (YYYY-MM-DD)

---

### Issue: Real-time sync not working

**Check:**
1. useAllJobs hook - subscription active
2. Console for "👂 Setting up real-time listener" message
3. No infinite loop (should only log once)
4. Firebase connection status

**Fix:** Infinite loop fixed with useRef pattern in useAllJobs

---

### Issue: Photo uploads fail

**Check:**
1. storage.rules deployed: `firebase deploy --only storage`
2. Mobile app has storage permissions
3. File size < 10MB
4. File type is image

**Fix:** Redeploy storage rules if needed

---

## 📝 Test Documentation

### Record Results:

**Date:** January 6, 2026

**Test Executed By:** [Your Name]

**Results:**
```
1. Booking Created: [ ] Yes [ ] No
   - Booking ID: ______________
   
2. Jobs Auto-Created: [ ] Yes [ ] No
   - Job 1 ID: ______________
   - Job 2 ID: ______________
   
3. Jobs on Webapp: [ ] Yes [ ] No
   - Count: ___
   
4. Jobs on Mobile: [ ] Yes [ ] No
   - Count: ___
   
5. Dates Display Correctly: [ ] Yes [ ] No
   - Format: ______________
   
6. Real-time Sync Working: [ ] Yes [ ] No
   - Sync time: ___ seconds
   
7. Photo Upload Working: [ ] Yes [ ] No
   
8. Job Completion Working: [ ] Yes [ ] No
```

---

## ✅ Success Criteria

**Test passes if:**
1. ✅ Booking creates 2 jobs automatically
2. ✅ Jobs appear in webapp within 5 seconds
3. ✅ Jobs appear on mobile within 5 seconds
4. ✅ Dates show as "2026-01-07" (not "Invalid Date")
5. ✅ Accept → Start → Complete workflow works
6. ✅ Real-time sync updates both apps instantly
7. ✅ Photo uploads succeed (no storage errors)
8. ✅ Completed jobs move to completed_jobs collection

---

## 🎯 Next Steps After Testing

**If test passes:**
1. ✅ Mark MOBILE_SYNC_IMPLEMENTATION_COMPLETE.md as verified
2. ✅ Update documentation with test results
3. ✅ Deploy to production (if applicable)
4. ✅ Train staff on new workflow

**If test fails:**
1. ❌ Document specific failure
2. ❌ Check troubleshooting section
3. ❌ Review relevant code sections
4. ❌ Fix issue and re-test

---

**Ready to start testing! First, verify the webapp and mobile app both show 0 jobs, then create a test booking.**
