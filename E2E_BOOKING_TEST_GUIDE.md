# 🧪 End-to-End Booking Test Guide

**Test Objective**: Verify complete flow from Booking → Calendar Event → Automatic Job Creation

**Date**: January 6, 2026

---

## 📋 Test Procedure

### Step 1: Create a New Booking

1. **Open Admin Bookings Page**
   - URL: http://localhost:3000/admin/bookings
   - Or navigate: Admin Dashboard → Bookings

2. **Click "Add Booking" Button**
   - Look for the blue "Add Booking" button in the top right

3. **Fill in Test Booking Details**
   ```
   Guest Information:
   ├─ Guest Name: "E2E Test User"
   ├─ Guest Email: "e2etest@example.com"
   ├─ Guest Phone: "+1234567890"
   └─ Number of Guests: 4
   
   Booking Dates:
   ├─ Check-in Date: January 15, 2026
   └─ Check-out Date: January 20, 2026
   
   Property:
   └─ Select any property from dropdown
   
   Pricing:
   ├─ Total Price: $1500
   └─ Payment Status: Paid
   
   Status:
   └─ Booking Status: Confirmed
   ```

4. **Submit the Booking**
   - Click "Create Booking" or "Save" button
   - Wait for success confirmation message

---

### Step 2: Verify Calendar Event Creation

1. **Navigate to Calendar Page**
   - URL: http://localhost:3000/admin/calendar
   - Or: Admin Dashboard → Calendar

2. **Check for New Booking Event**
   - Look for the week of January 15-20, 2026
   - You should see a calendar event showing:
     * Guest Name: "E2E Test User"
     * Property Name
     * Duration: January 15-20, 2026 (5 nights)
     * Event should span across check-in to check-out dates

3. **Verify Event Details**
   - Click on the calendar event
   - Confirm it shows:
     * ✅ Guest information
     * ✅ Check-in/Check-out dates
     * ✅ Property details
     * ✅ Booking reference/ID

**Expected Result**: ✅ Calendar event created automatically when booking is confirmed

---

### Step 3: Verify Automatic Job Creation

1. **Navigate to Jobs/Tasks Page**
   - URL: http://localhost:3000/admin/tasks
   - Or: Admin Dashboard → Tasks/Jobs

2. **Look for Cleaning Job**
   - Search for jobs related to the test booking
   - Filter by:
     * Date: January 20, 2026 (checkout date)
     * Job Type: "Cleaning" or "Post-Checkout Clean"
     * Property: The property you selected

3. **Verify Job Details**
   The automatic job should have:
   ```
   Job Information:
   ├─ Title: "Post-Checkout Cleaning" or similar
   ├─ Job Type: cleaning
   ├─ Required Role: cleaner
   ├─ Status: pending
   ├─ Priority: High
   └─ Broadcast: Yes (visible to all cleaners)
   
   Scheduling:
   ├─ Scheduled Date: January 20, 2026
   └─ Time: After checkout time (usually 10-11 AM)
   
   Assignment:
   ├─ Assigned To: Unassigned (pending cleaner acceptance)
   └─ Broadcast Status: Available to all cleaners
   
   Details:
   ├─ Property: Same property as booking
   ├─ Booking Reference: Links to test booking
   └─ Description: Cleaning after guest checkout
   ```

**Expected Result**: ✅ Cleaning job automatically created for checkout date

---

### Step 4: Verify Mobile App Integration (Optional)

If you have access to the mobile app:

1. **Open Mobile App**
   - Log in as a cleaner (staff account with role="cleaner")

2. **Check Available Jobs**
   - Navigate to Jobs/Tasks section
   - The cleaning job should appear in "Available Jobs"

3. **Verify Job Visibility**
   - Only cleaners should see this job
   - Job should show:
     * Property name
     * Scheduled date: January 20, 2026
     * Status: Pending acceptance
     * Option to "Accept" the job

**Expected Result**: ✅ Job visible in mobile app for cleaners only

---

## ✅ Success Criteria

All of the following should be TRUE:

- [ ] **Booking Created Successfully**
  - Booking appears in bookings list
  - Status shows as "Confirmed"
  - All guest and property details saved correctly

- [ ] **Calendar Event Created**
  - Event appears on calendar for check-in to check-out dates
  - Event shows guest name and property
  - Clicking event shows full booking details

- [ ] **Automatic Job Created**
  - Cleaning job created automatically (no manual creation needed)
  - Job scheduled for checkout date (January 20, 2026)
  - Job has `requiredRole: "cleaner"`
  - Job status is "pending"
  - Job is broadcast to all cleaners

- [ ] **Role-Based Filtering Works**
  - Job visible to staff with role="cleaner" in mobile app
  - Job NOT visible to staff with role="maintenance" or other roles
  - Job appears in "Available Jobs" section for cleaners

---

## 🔍 What to Check in Database (Firestore Console)

If you want to verify in the database directly:

### 1. Check `bookings` Collection
```javascript
// Should contain new document with:
{
  guestName: "E2E Test User",
  guestEmail: "e2etest@example.com",
  checkInDate: Timestamp(2026-01-15),
  checkOutDate: Timestamp(2026-01-20),
  status: "confirmed",
  // ... other booking details
}
```

### 2. Check `calendar_events` Collection
```javascript
// Should contain new document with:
{
  bookingId: "<booking-id>",
  title: "E2E Test User - <Property Name>",
  start: Timestamp(2026-01-15),
  end: Timestamp(2026-01-20),
  type: "booking",
  // ... other event details
}
```

### 3. Check `jobs` Collection
```javascript
// Should contain new document with:
{
  bookingId: "<booking-id>",
  title: "Post-Checkout Cleaning - <Property Name>",
  jobType: "cleaning",
  requiredRole: "cleaner",
  status: "pending",
  priority: "high",
  scheduledDate: "2026-01-20",
  broadcastToAll: true,
  // ... other job details
}
```

---

## 🔧 Troubleshooting

### Problem: Calendar Event Not Showing

**Possible Causes**:
1. Calendar component may need refresh
2. Event dates may be outside current view
3. Firestore rules may block calendar write

**Solutions**:
- Refresh the calendar page (F5)
- Navigate to January 2026 in calendar
- Check browser console for errors
- Verify booking status is "confirmed"

---

### Problem: Automatic Job Not Created

**Possible Causes**:
1. AutomaticJobCreationService not running
2. Booking status not "confirmed"
3. Firestore triggers disabled
4. Property not configured for auto-jobs

**Solutions**:
- Ensure booking status is set to "confirmed"
- Check for errors in browser console
- Verify Firestore triggers are enabled
- Check `AutomaticJobCreationService.ts` configuration
- Manual job creation may be required as fallback

---

### Problem: Job Not Visible in Mobile App

**Possible Causes**:
1. Staff account role is not "cleaner"
2. Job not broadcast (`broadcastToAll: false`)
3. Mobile app not syncing
4. Network connection issue

**Solutions**:
- Verify staff account has `role: "cleaner"`
- Check job has `requiredRole: "cleaner"`
- Pull down to refresh in mobile app
- Check mobile app logs for sync errors
- Verify API endpoint `/api/mobile/jobs` is working

---

## 📊 Expected System Behavior

### Automatic Job Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Admin Creates Booking                                   │
│     └─> Status: "confirmed"                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Calendar Event Created (Automatic)                      │
│     ├─> Event spans check-in to check-out                   │
│     └─> Linked to booking via bookingId                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  3. AutomaticJobCreationService Triggered                   │
│     ├─> Detects new confirmed booking                       │
│     ├─> Calculates checkout date                            │
│     └─> Creates cleaning job template                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Job Created in Database                                 │
│     ├─> Title: "Post-Checkout Cleaning"                     │
│     ├─> Type: cleaning                                      │
│     ├─> Required Role: cleaner                              │
│     ├─> Scheduled: Checkout date                            │
│     ├─> Status: pending                                     │
│     └─> Broadcast: true (all cleaners can see)              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Mobile App Sync (Real-time)                             │
│     ├─> JobContext.tsx monitors jobs collection             │
│     ├─> Filters by: requiredRole === staffProfile.role      │
│     ├─> Shows job to cleaners only                          │
│     └─> Cleaner can accept/decline job                      │
└─────────────────────────────────────────────────────────────┘
```

### Role-Based Job Distribution

```
Job Created:
├─ requiredRole: "cleaner"
├─ broadcastToAll: true
└─ status: "pending"

Mobile App Filtering:
├─ Staff with role="cleaner" → ✅ Can see job
├─ Staff with role="maintenance" → ❌ Cannot see job
├─ Staff with role="manager" → ❌ Cannot see job
└─ Only matching roles see the job

Job Acceptance:
├─ Any cleaner can accept
├─ First to accept gets assigned
├─ Others see "Already assigned"
└─ Job status changes to "in_progress"
```

---

## 🎯 Test Completion Checklist

Use this checklist to confirm the test:

### Pre-Test Setup
- [ ] Dev server is running (http://localhost:3000)
- [ ] Logged in as admin
- [ ] Have access to admin bookings page

### Test Execution
- [ ] Created test booking with specified details
- [ ] Booking shows in bookings list
- [ ] Navigated to calendar page
- [ ] Found calendar event for test booking
- [ ] Calendar event shows correct dates and guest info
- [ ] Navigated to jobs/tasks page
- [ ] Found automatic cleaning job for checkout date
- [ ] Verified job has `requiredRole: "cleaner"`
- [ ] Verified job is broadcast to cleaners

### Post-Test Verification (Optional)
- [ ] Checked Firestore console for booking document
- [ ] Checked Firestore console for calendar event
- [ ] Checked Firestore console for job document
- [ ] Verified job visible in mobile app (if available)
- [ ] Confirmed role filtering works correctly

---

## 📝 Test Results Template

```
=== E2E BOOKING TEST RESULTS ===
Date: January 6, 2026
Tester: [Your Name]

STEP 1 - BOOKING CREATION
Status: [ ] Pass  [ ] Fail
Booking ID: _______________________
Notes: 

STEP 2 - CALENDAR EVENT
Status: [ ] Pass  [ ] Fail
Event ID: _______________________
Notes: 

STEP 3 - AUTOMATIC JOB CREATION
Status: [ ] Pass  [ ] Fail
Job ID: _______________________
Job Type: _______________________
Required Role: _______________________
Scheduled Date: _______________________
Notes: 

STEP 4 - MOBILE APP (Optional)
Status: [ ] Pass  [ ] Fail  [ ] Not Tested
Notes: 

OVERALL TEST RESULT: [ ] PASS  [ ] FAIL

Issues Found:

Action Items:
```

---

## 🚀 Next Steps After Successful Test

If all tests pass:

1. **Document the Test Results**
   - Save screenshots of each step
   - Record booking ID, calendar event ID, and job ID
   - Note any timing delays observed

2. **Test Variations**
   - Try different property types
   - Test with different date ranges
   - Verify with multiple simultaneous bookings

3. **Production Readiness**
   - System is ready for real bookings
   - Automatic job creation is working
   - Mobile app integration is functional

4. **Monitor in Production**
   - Watch for automatic job creation
   - Track cleaner response times
   - Monitor job assignment rates

---

## 📞 Support

If you encounter issues during testing:

1. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for error messages in Console tab

2. **Check Service Status**
   - Verify all Firebase services are running
   - Check Firestore connection
   - Verify API endpoints are responding

3. **Review Documentation**
   - See `STAFF_ROLES_MOBILE_INTEGRATION.md` for role details
   - See `STAFF_MANAGEMENT_COMPLETE.md` for staff setup
   - See `AutomaticJobCreationService.ts` for job creation logic

---

**Test Created**: January 6, 2026  
**Last Updated**: January 6, 2026  
**Status**: Ready for execution
