# Admin Account Setup Guide

## Quick Answer

**Default Admin Email:** `admin@siamoon.com` or `shaun@siamoon.com`

**You need to create the account first!** The application uses Firebase Authentication, so there's no pre-existing username/password. You must sign up first, then grant admin privileges.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Sign Up
1. Start your development server (if not running):
   ```bash
   npm run dev
   ```

2. Open: http://localhost:3000/auth/signup

3. Fill in the form:
   - **Email:** `admin@siamoon.com` (or your preferred email)
   - **Password:** Choose a secure password (min 6 characters)
   - **Full Name:** `Admin User` (or your name)
   - **Role:** Select "Client" (we'll upgrade to admin next)

4. Click **Sign Up**

### Step 2: Grant Admin Privileges

**Option A - Using Admin Setup Page (Easiest):**
1. Go to: http://localhost:3000/admin-setup
2. Click **"Check Status"** button
3. Click **"Setup Admin User"** button
4. Wait for success message

**Option B - Using Firebase Console:**
1. Go to: https://console.firebase.google.com
2. Select project: **sia-moon-sanctuary**
3. Go to **Firestore Database**
4. Navigate to **users** collection
5. Find your user document (by email)
6. Edit the document:
   - Set `role` to `"admin"`
   - Add field `isAdmin` = `true`
   - Add field `adminLevel` = `10`
7. Save changes

### Step 3: Login
1. Go to: http://localhost:3000/auth/login
2. Enter your credentials
3. You should now have admin access!

---

## 🔧 Alternative Methods

### Method 1: Using the Script (Node.js Required)

If you have Firebase Admin SDK configured:

```bash
cd scripts
node create-admin-user.js
```

Follow the prompts to create an admin user.

**Note:** This requires the Firebase service account key file.

### Method 2: Using the Simple Script

```bash
cd scripts
./create-admin-simple.sh
```

This will guide you through the manual process step-by-step.

---

## 🏗️ Pre-configured Admin Emails

The system recognizes these emails as admin users:
- `admin@siamoon.com` ✅
- `shaun@siamoon.com` ✅ (hardcoded in AuthContext)
- `developer@siamoon.com`
- `test@siamoon.com`
- `demo@siamoon.com`

**Important:** Even these emails need to be created through signup first!

---

## 🔐 Recommended Test Credentials

For development/testing, you can use:

```
Email: admin@siamoon.com
Password: Admin123!
```

Or:

```
Email: test@siamoon.com
Password: Test123!
```

---

## 🛠️ Troubleshooting

### Problem: "No account found with this email"
**Solution:** You haven't signed up yet. Go to `/auth/signup` first.

### Problem: "Access denied. Admin privileges required"
**Solution:** Your account exists but doesn't have admin role. Use the admin-setup page or Firebase console to grant admin privileges.

### Problem: "Firebase Auth not initialized"
**Solution:** Check your Firebase configuration in `src/lib/firebase.ts` and ensure environment variables are set.

### Problem: Can't access admin-setup page
**Solution:** The admin-setup page should be accessible without authentication. If not, check the route in `src/app/admin-setup/page.tsx`.

---

## 📋 What Gets Created

When you create an admin user, the following is set up:

1. **Firebase Authentication Account**
   - Email/password credentials
   - Email verification status

2. **Firestore `users` Collection**
   ```json
   {
     "id": "user_firebase_uid",
     "email": "admin@siamoon.com",
     "fullName": "Admin User",
     "role": "admin",
     "isAdmin": true,
     "adminLevel": 10,
     "createdAt": "timestamp",
     "updatedAt": "timestamp"
   }
   ```

3. **Firestore `profiles` Collection**
   ```json
   {
     "id": "user_firebase_uid",
     "email": "admin@siamoon.com",
     "fullName": "Admin User",
     "role": "admin",
     "properties": [],
     "preferences": {
       "notifications": true,
       "emailUpdates": true
     },
     "createdAt": "timestamp",
     "updatedAt": "timestamp"
   }
   ```

4. **Firestore `staff_accounts` Collection** (Optional)
   ```json
   {
     "id": "user_firebase_uid",
     "firebaseUid": "user_firebase_uid",
     "email": "admin@siamoon.com",
     "name": "Admin User",
     "role": "admin",
     "status": "active",
     "isActive": true,
     "hasCredentials": true
   }
   ```

---

## 🔍 Verify Admin Access

After setup, verify you have admin access:

1. **Check Authentication:**
   - You should be able to login at `/auth/login`
   
2. **Check Admin Pages:**
   - Access `/admin` - Admin Dashboard
   - Access `/admin-setup` - Admin Setup Page
   - Access `/command-center` - Command Center
   - Access `/backoffice` - Back Office

3. **Check User Role:**
   - In browser console: `localStorage.getItem('user')`
   - Should show `role: "admin"`

---

## 📞 Need Help?

If you're still having issues:

1. Check browser console for errors (F12)
2. Check terminal/server logs
3. Verify Firebase project is set up correctly
4. Check Firebase Security Rules allow admin operations

---

## 🎯 Next Steps After Login

Once logged in as admin, you can:
- Access the Admin Dashboard
- Manage properties and staff
- View onboarding submissions
- Configure system settings
- Access AI features and monitoring
- Use the Command Center for testing

Enjoy your admin access! 🎉
