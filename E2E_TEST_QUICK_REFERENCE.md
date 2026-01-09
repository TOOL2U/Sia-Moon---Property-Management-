# 🧪 E2E BOOKING TEST - QUICK REFERENCE

**Date:** January 6, 2026  
**Test Duration:** ~2 minutes  
**Status:** ✅ Ready to Execute

---

## 🎯 What We're Testing

Verify the complete automated flow:

```
User Creates Booking (Status: Confirmed)
            ↓
[AutomaticJobCreationService monitors Firestore]
            ↓
Calendar Event Created (Automatic)
            ↓
Cleaning Job Created (Automatic, for checkout date)
            ↓
Job Visible in Mobile App (Role-filtered to cleaners)
```

---

## 📝 Test Steps (1 Minute)

### Browser Tabs Already Open:
- 📄 Tab 1: http://localhost:3000/admin/bookings
- 📅 Tab 2: http://localhost:3000/admin/calendar  
- 🔧 Tab 3: http://localhost:3000/admin/tasks

### Step 1: Create Booking (30 sec)

**In Bookings Tab:**
1. Click "**Add Booking**" button
2. Fill minimum required fields:
   - Name: `Test User`
   - Email: `test@test.com`
   - Check-in: `January 15, 2026`
   - Check-out: `January 20, 2026`
   - Property: `Any property from dropdown`
   - **Status: `Confirmed`** ⚠️ CRITICAL - This triggers automation!
3. Click **Save**
4. ✅ Wait for success message

### Step 2: Verify Calendar (15 sec)

**In Calendar Tab:**
1. Navigate to **January 2026**
2. Look for event spanning **Jan 15-20**
3. Should display:
   - Guest name
   - Property name
   - 5-night duration

**Expected:** ✅ Event appears automatically

### Step 3: Verify Job Creation (15 sec)

**In Tasks Tab:**
1. Look for **newest job** in the list
2. Verify details:
   - **Title:** "Post-Checkout Cleaning - [Property]"
   - **Type:** Cleaning
   - **Role:** `cleaner` ← Critical for mobile filtering
   - **Date:** January 20, 2026 (checkout date)
   - **Status:** Pending
   - **Broadcast:** Yes (visible to all cleaners)

**Expected:** ✅ Job created automatically within seconds

---

## ✅ Success Criteria

All must be TRUE:

- [ ] Booking created with status "**Confirmed**"
- [ ] Calendar event visible for Jan 15-20, 2026
- [ ] Cleaning job created for **Jan 20, 2026** (checkout date)
- [ ] Job has `requiredRole: "cleaner"`
- [ ] Job status is "**pending**"
- [ ] Job is broadcast to all cleaners

---

## 🔧 Technical Details

### What Happens Behind the Scenes:

1. **Booking Saved** → Firestore `bookings` collection
   ```javascript
   {
     status: "confirmed",
     checkInDate: "2026-01-15",
     checkOutDate: "2026-01-20",
     ...
   }
   ```

2. **AutomaticJobCreationService** (runs in app layout)
   - Monitors `bookings` collection in real-time
   - Detects new confirmed bookings
   - Triggers job creation

3. **Calendar Event Created** → Firestore `calendar_events` collection
   ```javascript
   {
     bookingId: "<booking-id>",
     start: "2026-01-15",
     end: "2026-01-20",
     type: "booking"
   }
   ```

4. **Job Created** → Firestore `jobs` collection
   ```javascript
   {
     bookingId: "<booking-id>",
     title: "Post-Checkout Cleaning",
     jobType: "cleaning",
     requiredRole: "cleaner",      // ← Mobile filtering
     status: "pending",
     scheduledDate: "2026-01-20",  // ← Checkout date
     broadcastToAll: true          // ← All cleaners see it
   }
   ```

5. **Mobile App Sync**
   - `JobContext.tsx` listens to jobs collection
   - Filters: `job.requiredRole === staffProfile.role`
   - Shows job only to cleaners
   - Cleaner can accept/decline

---

## 🎯 Role-Based Filtering Verification

The job created will have `requiredRole: "cleaner"`, which means:

### Mobile App Behavior:

| Staff Role    | Can See Job? | Why?                                    |
|---------------|--------------|------------------------------------------|
| `cleaner`     | ✅ YES       | Role matches `requiredRole: "cleaner"`  |
| `maintenance` | ❌ NO        | Role doesn't match                      |
| `manager`     | ❌ NO        | Role doesn't match                      |
| `other`       | ❌ NO        | Role doesn't match                      |

### Filtering Code (Mobile App):
```typescript
// In JobContext.tsx
const jobRole = data.requiredRole || 'cleaner'
const roleMatches = jobRole.toLowerCase() === staffRole.toLowerCase()

if (isAssignedToMe || (isPending && !hasDeclined && roleMatches)) {
  jobList.push(job) // Staff can see this job
}
```

---

## 💡 Troubleshooting

### Problem: No job created

**Check:**
- Booking status is "**Confirmed**" (not "pending" or "inquiry")
- Wait 10-15 seconds (background service may have delay)
- Browser console for errors (F12)
- AutomaticJobCreationService initialized (check browser console logs)

**Solution:**
- Refresh tasks page
- Check Firestore console: Look in `jobs` collection
- Verify booking has `jobsCreated: false` initially

---

### Problem: Calendar event missing

**Check:**
- Correct date range displayed (January 2026)
- Booking was saved successfully
- Calendar view is set to month view

**Solution:**
- Refresh calendar page (F5)
- Check different calendar views
- Verify booking appears in bookings list

---

### Problem: Job created but wrong role

**Check:**
- Job document in Firestore
- Should have `requiredRole: "cleaner"`

**Solution:**
- Check `AutomaticJobCreationService.ts` → `STANDARD_JOB_TEMPLATES`
- Verify POST_CHECKOUT_CLEANING template has `requiredRole: 'cleaner'`

---

## 📱 Mobile App Test (Optional)

If you have the mobile app running:

1. **Login as cleaner**
   - Use staff account with `role: "cleaner"`
   
2. **Navigate to Jobs**
   - Check "Available Jobs" tab
   
3. **Verify job appears**
   - Should show the cleaning job
   - Date: January 20, 2026
   - Has "Accept" button

4. **Test role filtering**
   - Login as maintenance staff
   - Job should NOT appear (different role)

---

## 📊 Expected Results Summary

### ✅ If Everything Works:

```
STEP 1: ✅ Booking created
        └─ Status: Confirmed
        └─ Dates: Jan 15-20, 2026

STEP 2: ✅ Calendar event appears
        └─ Shows on calendar
        └─ Correct dates and guest info

STEP 3: ✅ Job created automatically
        └─ Type: Cleaning
        └─ Role: cleaner
        └─ Date: Jan 20, 2026 (checkout)
        └─ Status: Pending
        └─ Visible to cleaners in mobile app

RESULT: 🎉 SYSTEM WORKING PERFECTLY!
```

### ⚠️ If Something Fails:

Document what you see and report:
- Which step failed?
- What appeared vs. what was expected?
- Any error messages?
- Screenshots help!

---

## 🚀 Quick Start

**Ready? Here's what to do RIGHT NOW:**

1. Go to **Bookings tab** in browser
2. Click "**Add Booking**"
3. Fill the form (remember: Status = **Confirmed**)
4. Click **Save**
5. Switch to **Calendar tab** → Look for event
6. Switch to **Tasks tab** → Look for cleaning job
7. **Report results!**

⏱️ **Total time:** ~1-2 minutes

---

## 📞 What to Report Back

After running the test, tell me:

✅ **Success:**
- "All 3 steps passed! Booking, calendar, and job all created."

⚠️ **Partial Success:**
- "Booking and calendar work, but no job yet."
- "Booking created but calendar/job missing."

❌ **Failure:**
- "Booking failed to create."
- "Error message: [paste error]"

---

## 🎯 Why This Test Matters

This verifies:
1. ✅ **Booking system** saves data correctly
2. ✅ **Calendar integration** works automatically
3. ✅ **Job automation** creates tasks on schedule
4. ✅ **Role filtering** sends jobs to right staff
5. ✅ **Mobile integration** makes jobs visible to cleaners

If this test passes, your entire booking-to-job pipeline is working! 🎉

---

**Test Created:** January 6, 2026  
**Status:** Ready for execution  
**Browser Tabs:** Already open and waiting  
**Action Required:** Create the test booking now!
