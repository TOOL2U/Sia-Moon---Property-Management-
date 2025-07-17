# Firebase Service Account Setup Guide

This document provides instructions on how to set up a Firebase service account for use with the staff-fix.js script and other administrative tasks.

## Why You Need a Service Account

The `staff-fix.js` script requires administrative access to Firebase Authentication and Firestore to create user accounts and update staff records. This requires a service account key with the appropriate permissions.

## Steps to Create a Firebase Service Account

1. Go to the [Firebase Console](https://console.firebase.google.com/) and select your "Property Management" project.

2. Click on the gear icon (⚙️) in the top left corner and select "Project settings".

3. Navigate to the "Service accounts" tab.

4. Select "Firebase Admin SDK" and click the "Generate new private key" button.

5. Click "Generate key" in the confirmation dialog.

6. A JSON file will be downloaded to your computer. This is your service account key file.

7. Rename this file to `serviceAccountKey.json` and place it in the root directory of your project (the same directory as package.json).

8. **IMPORTANT**: Never commit this file to Git/GitHub as it contains sensitive credentials. Make sure it's listed in your `.gitignore` file.

## Verify Your Service Account

Once you have placed the `serviceAccountKey.json` file in the project root, you can verify it works by running:

```bash
node scripts/staff-fix.js list
```

This should list all staff accounts in your Firestore database.

## Using the Staff Fix Script

The `staff-fix.js` script has several commands:

1. List all staff accounts:

   ```bash
   node scripts/staff-fix.js list
   ```

2. Fix a specific staff account by email:

   ```bash
   node scripts/staff-fix.js fix cleaner@siamoon.com
   ```

3. Fix all staff accounts missing userIds:
   ```bash
   node scripts/staff-fix.js fix-all
   ```

## Troubleshooting

If you encounter any errors:

1. Make sure the `serviceAccountKey.json` file is in the correct location.
2. Verify the service account has the necessary permissions (Firebase Authentication Admin and Firestore Admin).
3. Check that the Firebase project ID in the service account key matches your project.

## Security Notice

The service account key grants administrative access to your Firebase project. Treat it as you would any other sensitive credential:

- Do not commit it to version control
- Do not share it with unauthorized personnel
- Store it securely when not in use
- Regenerate it if you suspect it has been compromised
