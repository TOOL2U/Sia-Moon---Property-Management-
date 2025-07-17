# Mobile App Job Integration Fix

## Problem Summary

Staff members are unable to see job assignments in the mobile app because staff accounts in the Firestore database are missing `userId` fields that link to Firebase Authentication UIDs. This prevents the mobile app from retrieving jobs associated with the logged-in staff member.

## Technical Background

### Current Architecture

1. **Web Application:**
   - Staff accounts are stored in the `staff_accounts` collection in Firestore
   - Jobs are created and assigned to staff members using their Firestore document ID
   - Staff can log in using Firebase Authentication

2. **Mobile Application:**
   - Staff log in with Firebase Authentication
   - The mobile app uses the Firebase Auth UID (stored in `userId` field) to retrieve assigned jobs
   - Currently fails because most staff accounts don't have this field populated

3. **Firebase Structure:**
   - **Authentication:** Contains user accounts with UIDs
   - **Firestore:**
     - `staff_accounts` collection stores staff profiles
     - `jobs` collection references staff by their staff_account ID
     - `notifications` collection contains job notifications

## Root Cause

Staff accounts in Firestore (`staff_accounts` collection) don't have the `userId` field populated that would link them to their Firebase Authentication accounts. The mobile app relies on this field to find the correct staff profile after authentication.

## Solution

We've developed the `staff-fix.js` script to:

1. Identify staff accounts without `userId` fields
2. Create Firebase Authentication accounts for these staff members if they don't exist
3. Update the staff accounts with the corresponding Firebase Auth UIDs

### Implementation Steps

1. **Set up a Firebase service account**
   - Follow instructions in [FIREBASE_SERVICE_ACCOUNT_SETUP.md](/docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md)

2. **Run the staff-fix script**
   - To view current staff accounts:
     ```bash
     node scripts/staff-fix.js list
     ```
   - To fix a specific staff account (test with one first):
     ```bash
     node scripts/staff-fix.js fix cleaner@siamoon.com
     ```
   - To fix all staff accounts missing userIds:
     ```bash
     node scripts/staff-fix.js fix-all
     ```

3. **Test job assignment**
   - Create a test job assigned to a staff member using TestJobService
   - Verify the job appears in the mobile app

## Mobile App Team Instructions

1. **No code changes needed in the mobile app** if it's already looking up staff accounts using the Firebase Auth UID.

2. **Login flow should work as follows:**
   - User logs in with email/password via Firebase Authentication
   - Mobile app gets the Firebase Auth UID from the authenticated user
   - App queries Firestore for staff_account where userId = Firebase Auth UID
   - App loads jobs assigned to that staff_account

3. **Testing procedure:**
   - After the fix is applied, test login with a staff account
   - Verify jobs appear correctly
   - If issues persist, check the logs for the specific queries being made

## Technical Implementation Details

### Staff Fix Script Structure

The `staff-fix.js` script performs the following operations:

1. **Lists staff accounts** - Shows all staff and whether they have userIds
2. **Creates Firebase Auth accounts** - For staff without existing Auth accounts
3. **Updates Firestore records** - Adds the Firebase Auth UID to the staff_account

### Impact Assessment

This change should have no negative impact on the web application, as it only adds a field to existing records. The web app doesn't rely on the `userId` field for its operations.

## Verification

After applying the fix:

1. Staff should be able to log in to the mobile app using their email and password
2. Jobs assigned to staff should appear correctly in the mobile app
3. New job notifications should be delivered properly

## Future Considerations

1. **Staff Account Creation Process** - Update the staff creation process to automatically create Firebase Auth accounts and link them to staff_accounts.
2. **Password Reset** - Staff will need to reset their passwords after Firebase Auth accounts are created.
3. **Documentation** - Update the onboarding documentation to reflect the requirement for Firebase Auth accounts.

## Support

For questions or issues regarding this fix, please contact the development team.
