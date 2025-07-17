# CRITICAL ISSUE FIX: Mobile Staff Integration

## ISSUE SUMMARY

The mobile app cannot display jobs for staff because staff accounts in Firestore are missing `userId` fields that link to Firebase Auth UIDs. When staff log in via Firebase Auth, the mobile app queries jobs using `where("userId", "==", currentUser.uid)`, but without this field, no jobs appear.

## ACTION PLAN

### IMMEDIATE STEPS:

1. **Update Staff Accounts with Firebase Auth UIDs**
   - Use the provided `staff-fix.js` script to add missing userIds
   - Start with cleaner@siamoon.com as a test case
   - Script creates Firebase Auth accounts & updates Firestore documents

2. **Create Test Jobs for Staff**
   - After adding userIds, create test jobs for specific staff members
   - Verify jobs include the staff's userId field
   - Jobs must include both assignedStaffId AND userId fields

3. **Update Staff Creation Workflow**
   - Modify staff creation process to include Firebase Auth account creation
   - Save Auth UID to staff account's userId field

### TESTING PROTOCOL:

1. Run: `node staff-fix.js`
2. Select option 5 (Quick start with cleaner@siamoon.com)
3. Enter a password for the account
4. Create a test job when prompted
5. Test login to mobile app with credentials
6. Verify job appears in the mobile app

## TECHNICAL DETAILS

### MOBILE APP QUERY PATTERN:

```javascript
// This is the critical query in the mobile app
const jobsQuery = query(
  collection(db, 'jobs'),
  where('userId', '==', currentUser.uid), // This must match Firebase Auth UID
  orderBy('createdAt', 'desc')
)
```

### DATA MODEL REQUIREMENTS:

- **Staff Account Document**: Must include `userId` field containing Firebase Auth UID
- **Job Document**: Must include matching `userId` field (same as staff's userId)
- **Firebase Auth**: Each staff member must have an authentication account

### SCRIPT USAGE:

```
node staff-fix.js
```

Options:

1. List all staff accounts (shows missing userIds)
2. Update a single staff account with userId
3. Process ALL staff accounts (batch update)
4. Create test jobs for staff members
5. Quick start with cleaner@siamoon.com

## VERIFICATION CHECKLIST:

- [ ] Staff accounts updated with userIds
- [ ] Firebase Auth accounts created for staff
- [ ] Test jobs created with proper userId fields
- [ ] Staff can log in to mobile app
- [ ] Jobs appear for specific staff in mobile app
- [ ] New staff creation process includes userId

After completing these steps, the mobile app should be able to properly display jobs for authenticated staff members.

## DEVELOPER NOTES:

1. The `staff-fix.js` script requires admin privileges to Firebase.
2. Passwords set during this process should be communicated to staff for mobile login.
3. The mobile app development team has confirmed the query pattern using `userId`.
4. This is a one-time fix for existing staff; ensure future staff creation includes Firebase Auth integration.
