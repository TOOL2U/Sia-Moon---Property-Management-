# ✅ END-TO-END TEST EXECUTION CHECKLIST

## 📋 PRE-TEST SETUP

### Required Before Running Test:

- [ ] **Firebase credentials configured in `.env.local`:**
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

- [ ] **At least one property exists with:**
  - [ ] Property name
  - [ ] Full address
  - [ ] Google Maps link
  - [ ] Property images (1+)
  - [ ] Access instructions
  - [ ] Status: Active

- [ ] **At least one cleaner account exists:**
  - [ ] Role: "cleaner"
  - [ ] Status: Active (isActive: true)
  - [ ] (Optional) Expo push token registered

- [ ] **Development server NOT running**
  - Test uses Firebase Admin SDK directly
  - No need for server to be running

---

## 🚀 TEST EXECUTION

### Run Command:
```bash
npm run test:e2e
```

### Watch For These Steps (All Must Pass):

- [ ] ✅ **STEP 1:** Get Test Property
  - Expected: Property found with completeness score 4-6/6
  
- [ ] ✅ **STEP 2:** Create Test Booking
  - Expected: Booking ID returned, status "confirmed"
  
- [ ] ✅ **STEP 3:** Verify Calendar Event
  - Expected: 1-2 events created, property blocked
  
- [ ] ✅ **STEP 4:** Verify Cleaning Job
  - Expected: Job created for checkout date
  
- [ ] ✅ **STEP 5:** Verify Job Assignment
  - Expected: requiredRole = "cleaner", autoAssigned = true
  
- [ ] ✅ **STEP 6:** Verify Mobile Notification
  - Expected: Notification sent (if push token exists)
  
- [ ] ✅ **STEP 7:** Verify Property Details
  - Expected: Completeness score 7/7

### Test Artifacts (Save These):

- [ ] **Property ID:** ___________________________
- [ ] **Booking ID:** ___________________________
- [ ] **Job ID:** ___________________________
- [ ] **Report Path:** ___________________________

---

## 📱 MANUAL MOBILE APP VERIFICATION

### Open Mobile App:
```bash
cd mobile-app
npm start
# Or: npx expo start
```

### Log In As Cleaner:
- [ ] Email: ___________________________
- [ ] Password: ___________________________
- [ ] Login successful

### Check Notification:
- [ ] Notification received: "New Job Assignment"
- [ ] Notification shows property name
- [ ] Tapped notification → Opens job details

### Verify Job Details Screen:

#### Property Information:
- [ ] **Property Name:** Displayed correctly
- [ ] **Full Address:** Complete street address shown
- [ ] **Google Maps Link:** 
  - [ ] Button/link visible
  - [ ] Tapped → Opens Google Maps app
  - [ ] Correct location shown

#### Property Media:
- [ ] **Photos:** 1+ images displayed
- [ ] Photos load correctly
- [ ] Photos are of correct property

#### Job Details:
- [ ] **Job Type:** "Cleaning" or similar
- [ ] **Status:** "Assigned" or "Pending"
- [ ] **Checkout Date:** Correct date shown
- [ ] **Checkout Time:** Correct time shown
- [ ] **Guest Count:** Number matches booking (2 guests)

#### Access Information:
- [ ] **Access Instructions:** Visible and readable
- [ ] Instructions contain entry info (codes/keys)

### Accept Job:
- [ ] "Accept Job" button visible
- [ ] Tapped "Accept Job" button
- [ ] Success message displayed
- [ ] Job status changes to "Accepted"

### Verify in Firebase Console:
- [ ] Opened Firebase Console
- [ ] Navigate to Firestore → jobs collection
- [ ] Found job using Job ID: ___________________________
- [ ] Verified fields:
  - [ ] `status` = "accepted"
  - [ ] `staffResponse` = "accepted"
  - [ ] `acceptedAt` timestamp exists
  - [ ] `acceptedBy` = cleaner staff ID

---

## 📊 TEST RESULTS SUMMARY

### Automated Tests:
- **Total:** 7
- **Passed:** _____ / 7
- **Failed:** _____ / 7
- **Success Rate:** _____ %

### Manual Checks:
- **Total:** 10
- **Passed:** _____ / 10
- **Failed:** _____ / 10

### Overall:
- **Combined Total:** 17 checkpoints
- **All Passed:** [ ] YES / [ ] NO

---

## 📸 EVIDENCE COLLECTION (Optional but Recommended)

### Screenshots to Capture:

- [ ] **Console output** (test execution log)
- [ ] **Test report** (JSON file)
- [ ] **Mobile: Notification received**
- [ ] **Mobile: Job details screen** (showing all info)
- [ ] **Mobile: Google Maps opened** (correct location)
- [ ] **Mobile: Job accepted** (success message)
- [ ] **Firebase Console: Booking document**
- [ ] **Firebase Console: Calendar event document**
- [ ] **Firebase Console: Job document (before acceptance)**
- [ ] **Firebase Console: Job document (after acceptance)**

### Save Evidence To:
- Folder: ___________________________
- Date: ___________________________

---

## ⚠️ IF ANY STEP FAILS

### Troubleshooting Actions:

1. **Check Prerequisites:**
   - [ ] Firebase credentials correct?
   - [ ] Property has all required data?
   - [ ] Cleaner account exists and active?

2. **Review Logs:**
   - [ ] Check console output for errors
   - [ ] Review Firebase Console logs
   - [ ] Check mobile app console (if applicable)

3. **Verify Services:**
   - [ ] BookingApprovalWorkflow initialized?
   - [ ] AutomaticJobCreationService running?
   - [ ] CalendarIntegrationService active?

4. **Re-run Test:**
   - [ ] Fix identified issues
   - [ ] Run `npm run test:e2e` again
   - [ ] Complete checklist from start

---

## ✅ FINAL SIGN-OFF

### When ALL 17 Checkpoints Pass:

**Automated Test Results:** ✅ 7/7 Passed  
**Manual Verification:** ✅ 10/10 Passed  
**System Status:** ✅ PRODUCTION READY

### Sign-Off:

- **Tested By:** ___________________________
- **Date:** ___________________________
- **Time:** ___________________________
- **Environment:** [ ] Development / [ ] Staging / [ ] Production
- **Status:** [ ] PASS / [ ] FAIL

### Notes:
```
___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________
```

---

## 🎉 SUCCESS!

**If all checkpoints passed, congratulations! Your system is proven to work end-to-end.**

### Next Actions:
1. ✅ Save this completed checklist
2. ✅ Archive test report and screenshots
3. ✅ Share results with stakeholders
4. ✅ Schedule production deployment
5. ✅ Prepare user training materials

---

## 🧹 POST-TEST CLEANUP (Optional)

### Clean Up Test Data:

- [ ] Delete test booking: `bookings/{booking_id}`
- [ ] Delete calendar events: `calendar_events` (where bookingId = test)
- [ ] Delete test jobs: `jobs` (where bookingId = test)
- [ ] Delete notifications: `mobile_notifications` (where jobId = test)

### Firebase Console Path:
```
Firestore Database → Collections → [Select Collection] → [Find Document] → Delete
```

---

**Checklist Version:** 1.0.0  
**Last Updated:** January 2024  
**Test Status:** Ready for Execution
