# END-TO-END TEST GUIDE

## 🎯 Test Objective

Prove that the complete booking → calendar → job → mobile app workflow functions correctly in a real-life scenario.

## 📋 Test Requirements

### SUCCESS CRITERIA (ALL MUST PASS):
- ✅ Booking created successfully
- ✅ Booking visible in calendar
- ✅ Calendar blocks property dates
- ✅ Cleaning job auto-created for checkout
- ✅ Job auto-dispatched to cleaner role
- ✅ Mobile app receives job notification
- ✅ Job contains: maps, photos, address, access notes
- ✅ Cleaner can accept job in mobile app

---

## 🚀 Quick Start

### Prerequisites

1. **Firebase Admin credentials configured** in `.env.local`:
   ```bash
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```

2. **At least one active property** with complete details:
   - Property name ✓
   - Full address ✓
   - Google Maps link ✓
   - Property images ✓
   - Access instructions ✓

3. **At least one cleaner account** in `staff_accounts` collection:
   - role: "cleaner"
   - isActive: true
   - (Optional) expoPushToken for mobile notifications

### Run Test

```bash
# Install dependencies (if not already installed)
npm install

# Run the end-to-end test
npx ts-node scripts/end-to-end-test.ts
```

---

## 📊 Test Flow

### STEP 1: Get Test Property
- Searches for active properties with complete details
- Selects property with highest completeness score
- Verifies property has: name, address, Google Maps, images, access notes

**Expected Result:**
```
✅ Get Test Property
   Data: {
     propertyId: "prop_xyz",
     name: "Beach Villa",
     address: "123 Ocean Drive, Miami, FL",
     hasGoogleMaps: true,
     hasImages: true,
     completenessScore: "6/6"
   }
```

---

### STEP 2: Create Test Booking
- Creates booking for test property
- Guest: "Test Guest (E2E)" <shaun@siamoon.com>
- Check-in: Tomorrow at 3:00 PM
- Check-out: 3 days later at 11:00 AM
- Status: "confirmed"

**Expected Result:**
```
✅ Create Test Booking
   Data: {
     bookingId: "booking_abc",
     propertyName: "Beach Villa",
     checkIn: "2024-01-15T15:00:00.000Z",
     checkOut: "2024-01-18T11:00:00.000Z",
     status: "confirmed"
   }
```

---

### STEP 3: Verify Calendar Event
- Queries `calendar_events` collection for booking
- Verifies booking creates calendar event
- Confirms property dates are blocked

**Expected Result:**
```
✅ Verify Calendar Event
   Data: {
     totalEvents: 2,
     blockingEvents: 1,
     propertyBlocked: true,
     events: [
       {
         type: "booking",
         title: "Booking: Beach Villa",
         start: "2024-01-15T15:00:00.000Z",
         end: "2024-01-18T11:00:00.000Z"
       }
     ]
   }
```

---

### STEP 4: Verify Cleaning Job Auto-Created
- Queries `jobs` collection for booking
- Verifies cleaning/checkout job was auto-created
- Confirms job scheduled for checkout date

**Expected Result:**
```
✅ Verify Cleaning Job
   Data: {
     totalJobs: 3,
     cleaningJobFound: true,
     cleaningJobId: "job_def",
     jobs: [
       {
         type: "cleaning",
         title: "Post-Checkout Cleaning - Beach Villa",
         status: "assigned",
         requiredRole: "cleaner"
       }
     ]
   }
```

---

### STEP 5: Verify Job Assignment
- Checks job's `requiredRole` field
- Verifies job is assigned to "cleaner" role
- Confirms auto-dispatch occurred

**Expected Result:**
```
✅ Verify Job Assignment
   Data: {
     jobId: "job_def",
     title: "Post-Checkout Cleaning - Beach Villa",
     requiredRole: "cleaner",
     assignedTo: "staff_siamoon" or "Not yet assigned",
     assignmentMethod: "auto",
     autoAssigned: true,
     isCleanerRole: true
   }
```

---

### STEP 6: Verify Mobile Notification
- Checks `mobile_notifications` collection
- Queries active cleaners with Expo push tokens
- Verifies notification was sent

**Expected Result:**
```
✅ Verify Mobile Notification
   Data: {
     notificationsSent: 1,
     notifications: [
       {
         type: "job_assignment",
         title: "New Job Assignment",
         staffId: "staff_siamoon"
       }
     ],
     activeCleaners: 2,
     cleanersWithPushTokens: 1
   }
```

---

### STEP 7: Verify Job Property Details
- Reads job document
- Verifies job contains all required property details
- Checks completeness score (7/7)

**Expected Result:**
```
✅ Verify Job Property Details
   Data: {
     completeness: "7/7",
     hasPropertyName: true,
     hasAddress: true,
     hasGoogleMaps: true,
     hasAccessNotes: true,
     hasImages: true,
     hasGuestCount: true,
     hasCheckoutTime: true,
     jobDetails: {
       propertyName: "Beach Villa",
       address: "123 Ocean Drive, Miami, FL",
       googleMapsLink: "https://maps.google.com/...",
       accessInstructions: "✓",
       images: 4,
       numberOfGuests: 2,
       scheduledDate: "2024-01-18T11:00:00.000Z"
     }
   }
```

---

## 📱 Manual Mobile App Verification

After the automated test completes, perform these manual checks:

### 1. Open Mobile App
```bash
cd mobile-app
npm start
# Or: npx expo start
```

### 2. Log In As Cleaner
- Email: (use your test cleaner account)
- Password: (your cleaner password)

### 3. Check Notifications
- Should see notification: "New Job Assignment"
- Notification should include property name
- Tap notification to open job details

### 4. Verify Job Details Screen
Check that all information is visible and correct:

- [ ] **Property Name**: "Beach Villa" (or your property name)
- [ ] **Full Address**: Complete street address
- [ ] **Google Maps Button**: Tap to test - should open Maps app
- [ ] **Property Photos**: 1+ images displayed
- [ ] **Access Instructions**: Entry codes, key location, etc.
- [ ] **Guest Count**: Number of guests
- [ ] **Checkout Date/Time**: Correct date and time
- [ ] **Job Type**: "Cleaning" or "Post-Checkout Cleaning"

### 5. Accept Job
- Tap "Accept Job" button
- Verify success message appears
- Job status should change from "assigned" to "accepted"

### 6. Verify in Firebase Console
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `jobs` collection
4. Find the test job (using Job ID from test report)
5. Verify:
   - `status` = "accepted"
   - `staffResponse` = "accepted"
   - `acceptedAt` timestamp is set

---

## 📊 Test Report

The test generates a detailed JSON report saved to:
```
/test-reports/e2e-test-[timestamp].json
```

### Report Structure:
```json
{
  "totalTests": 7,
  "passedTests": 7,
  "failedTests": 0,
  "successRate": "100.0",
  "results": [
    {
      "step": "Get Test Property",
      "success": true,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "data": { ... }
    },
    ...
  ],
  "testArtifacts": {
    "propertyId": "prop_xyz",
    "bookingId": "booking_abc",
    "jobId": "job_def"
  }
}
```

---

## 🔍 Troubleshooting

### Issue: No properties found
**Solution:** Create at least one property with complete details first:
```bash
# Use the web app to create a property
# Or manually add via Firebase Console
```

### Issue: No calendar events created
**Possible Causes:**
- BookingApprovalWorkflow not triggered
- CalendarIntegrationService listeners not active
- Booking status not "confirmed"

**Debug:**
```bash
# Check Firestore triggers in Firebase Console
# Verify booking status is "confirmed"
# Check server logs for workflow execution
```

### Issue: No jobs created
**Possible Causes:**
- AutomaticJobCreationService not running
- Job templates not configured
- Booking dates in the past

**Debug:**
```bash
# Check if AutomaticJobCreationService is initialized
# Verify booking has future dates
# Check server logs for job creation errors
```

### Issue: No mobile notifications
**Possible Causes:**
- No active cleaners with Expo push tokens
- ExpoPushService not configured
- Mobile app not registering push token

**Debug:**
```bash
# Check staff_accounts collection for expoPushToken field
# Verify mobile app notification permissions granted
# Test manual push notification via admin panel
```

### Issue: Job missing property details
**Possible Causes:**
- Property data incomplete
- Job creation logic not passing property details
- Field mapping mismatch

**Debug:**
```bash
# Verify property has all required fields
# Check AutomaticJobCreationService job creation logic
# Review job document structure in Firestore
```

---

## 🧹 Cleanup Test Data

After testing, you may want to clean up test data:

```bash
# Via Firebase Console:
1. Delete test booking from `bookings` collection
2. Delete test calendar events from `calendar_events` collection
3. Delete test jobs from `jobs` collection
4. Delete test notifications from `mobile_notifications` collection

# OR use this script (create if needed):
npx ts-node scripts/cleanup-test-data.ts --booking-id "booking_abc"
```

---

## ✅ Success Checklist

Use this checklist to confirm all requirements are met:

### Automated Test Results
- [ ] Step 1: Get Test Property ✅
- [ ] Step 2: Create Test Booking ✅
- [ ] Step 3: Verify Calendar Event ✅
- [ ] Step 4: Verify Cleaning Job ✅
- [ ] Step 5: Verify Job Assignment ✅
- [ ] Step 6: Verify Mobile Notification ✅
- [ ] Step 7: Verify Job Property Details ✅

### Manual Mobile App Verification
- [ ] Notification received in mobile app
- [ ] Property name displayed correctly
- [ ] Full address visible
- [ ] Google Maps link works (opens Maps app)
- [ ] Property photos displayed
- [ ] Access instructions visible
- [ ] Guest count shown
- [ ] Checkout date/time correct
- [ ] "Accept Job" button works
- [ ] Job status changes to "accepted"

### Final Confirmation
- [ ] All automated tests passed (7/7)
- [ ] All manual checks passed (10/10)
- [ ] Test report generated successfully
- [ ] Screenshots captured (optional but recommended)

---

## 📸 Evidence Collection (Recommended)

For production readiness proof, collect:

1. **Console Output**: Save complete test execution log
2. **Test Report JSON**: Backup the generated report file
3. **Mobile Screenshots**:
   - Notification received
   - Job details screen
   - Google Maps integration
   - Job accepted confirmation
4. **Firebase Console Screenshots**:
   - Booking document
   - Calendar event document
   - Job document (before acceptance)
   - Job document (after acceptance)

---

## 🎉 Success!

If all tests pass and manual verification confirms the workflow, you have successfully proven:

✅ **Complete end-to-end booking workflow is operational**
✅ **Calendar integration working correctly**
✅ **Automatic job creation functioning**
✅ **Mobile app receiving jobs with full details**
✅ **Cleaner can accept jobs via mobile app**

**System is ready for production use! 🚀**

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console logs
2. Review server logs (Next.js console)
3. Verify mobile app logs (Expo console)
4. Check this guide's Troubleshooting section
5. Review relevant service files:
   - `src/services/BookingApprovalWorkflow.ts`
   - `src/services/AutomaticJobCreationService.ts`
   - `src/services/CalendarIntegrationService.ts`
   - `src/services/ExpoPushService.ts`

---

**Last Updated:** January 2024  
**Test Version:** 1.0.0  
**Status:** Ready for Execution
