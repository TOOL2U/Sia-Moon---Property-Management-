# 🔥 Firebase Setup Guide - REQUIRED

## ⚠️ Critical Issue

Your application cannot run because Firebase is not configured. You're missing the `.env.local` file with Firebase credentials.

---

## 🚀 Quick Fix (5 Minutes)

### Step 1: Get Firebase Credentials

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/operty-b54dc/settings/general

2. **Find Your Web App Config:**
   - Scroll down to "Your apps" section
   - Look for the Web app (look for `</>` icon)
   - If no web app exists, click "Add app" → Web
   - Click the "Config" radio button (not "npm")
   - You should see something like:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "operty-b54dc.firebaseapp.com",
     projectId: "operty-b54dc",
     storageBucket: "operty-b54dc.firebasestorage.app",
     messagingSenderId: "914547669275",
     appId: "1:914547669275:web:...",
     measurementId: "G-..."
   };
   ```

3. **Copy the Values**

### Step 2: Update .env.local File

I've created a template `.env.local` file in your project root. Open it and replace the placeholder values:

```bash
# Open the file in VS Code
code .env.local
```

Replace:
- `your_api_key_here` with your actual `apiKey`
- `your_app_id_here` with your actual `appId`
- `your_measurement_id_here` with your actual `measurementId`

**Example:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBMiN2YG4RgAB-MdysGI3J6y0tLZDCs0X8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=operty-b54dc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=operty-b54dc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=operty-b54dc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=914547669275
NEXT_PUBLIC_FIREBASE_APP_ID=1:914547669275:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 3: Restart Development Server

After updating `.env.local`:

1. **Stop the current server** (Ctrl+C in terminal)
2. **Restart it:**
   ```bash
   npm run dev
   ```

3. **Check the console** for Firebase initialization messages

---

## ✅ Verification

After restarting, you should see in the browser console:

```
✅ Firebase initialized successfully (browser)
🔥 Firebase services initialized: {auth: true, firestore: true, storage: true, ...}
```

If you still see errors, check:
1. All values are copied correctly (no extra spaces)
2. The `.env.local` file is in the project root
3. You've restarted the dev server

---

## 🔒 Security Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed
- ✅ These keys are safe to use in the browser (they're public keys)
- ⚠️ Make sure to set up Firebase Security Rules to protect your data
- ⚠️ Never commit `.env.local` to version control

---

## 🎯 Alternative: Quick Copy-Paste Method

If you have the old config (before the security incident), you can use those values temporarily. However, for security, it's better to regenerate them.

### Temporary Config (Use only for testing):

**Based on your project ID `operty-b54dc`, you need these values from Firebase Console.**

---

## 📞 Still Having Issues?

### Common Problems:

**Problem:** "Firebase Auth is not initialized"
- **Solution:** You haven't set up `.env.local` yet. Follow Step 1-3 above.

**Problem:** "Missing fields: apiKey, appId, measurementId"
- **Solution:** You need to copy the actual values from Firebase Console. The placeholders won't work.

**Problem:** Changes not reflecting
- **Solution:** Restart the dev server after updating `.env.local`

---

## 🎉 Next Steps

Once Firebase is configured:
1. Go to http://localhost:3000/auth/signup
2. Create your admin account
3. Use the admin-setup page to grant admin privileges
4. Login and enjoy!

---

## 📋 Complete .env.local Template

Here's what your complete `.env.local` should look like:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your...key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=operty-b54dc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=operty-b54dc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=operty-b54dc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=914547669275
NEXT_PUBLIC_FIREBASE_APP_ID=1:914547669275:web:...your...app...id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-...your...measurement...id

# Optional: Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key_if_needed

# Environment
NODE_ENV=development
```

---

**Need help getting the credentials?** Open Firebase Console and follow the visual guide in the screenshots above! 📸
