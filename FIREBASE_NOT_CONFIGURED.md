# 🚨 URGENT: Firebase Not Configured

## The Problem

You're getting this error:
```
Error: Firebase Auth is not initialized
```

**Root Cause:** Missing `.env.local` file with Firebase credentials.

---

## 🎯 Quick Fix (Choose One Method)

### Method 1: Use the Interactive Script (Easiest)

```bash
cd /Users/shaunducker/Desktop/Sia-Moon---Property-Management-
./scripts/setup-firebase.sh
```

This script will:
1. Guide you through getting credentials from Firebase Console
2. Create the `.env.local` file automatically
3. Tell you when to restart the server

### Method 2: Manual Setup (5 Minutes)

#### Step A: Get Firebase Credentials

1. **Open:** https://console.firebase.google.com/project/operty-b54dc/settings/general

2. **Scroll down** to "Your apps" section

3. **Find/Create Web App:**
   - Look for web app icon (</>)
   - If none exists, click "Add app" → Web
   
4. **Copy Config:**
   - Click "SDK setup and configuration"
   - Select "Config" (not npm)
   - You'll see something like:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",              // ← Copy this
     authDomain: "operty-b54dc.firebaseapp.com",
     projectId: "operty-b54dc",
     storageBucket: "operty-b54dc.firebasestorage.app",
     messagingSenderId: "914547669275",
     appId: "1:914547669275:web:...",  // ← Copy this
     measurementId: "G-..."             // ← Copy this
   };
   ```

#### Step B: Update .env.local

Open the `.env.local` file in your project root and replace the placeholders:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your...actual...key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=operty-b54dc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=operty-b54dc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=operty-b54dc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=914547669275
NEXT_PUBLIC_FIREBASE_APP_ID=1:914547669275:web:...your...actual...appid
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-...your...actual...id
```

#### Step C: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ Verification

After restarting, open browser console. You should see:

```
✅ Firebase initialized successfully (browser)
🔥 Firebase services initialized: {auth: true, firestore: true, ...}
```

If you see errors, double-check:
- [ ] All values are copied correctly
- [ ] No extra spaces or quotes
- [ ] File is named `.env.local` (with the dot)
- [ ] File is in project root directory
- [ ] Dev server was restarted

---

## 🎯 After Firebase is Working

### Create Admin Account:

1. **Sign Up:**
   - Go to: http://localhost:3000/auth/signup
   - Email: `admin@siamoon.com`
   - Password: (choose a secure one)
   - Full Name: `Admin User`

2. **Grant Admin Role:**
   - Go to: http://localhost:3000/admin-setup
   - Click "Check Status"
   - Click "Setup Admin User"

3. **Login:**
   - Go to: http://localhost:3000/auth/login
   - Use your credentials

---

## 📁 Files Created

I've created these files to help you:

1. **`.env.local`** - Template file (needs your Firebase keys)
2. **`FIREBASE_SETUP_GUIDE.md`** - Detailed setup guide
3. **`scripts/setup-firebase.sh`** - Interactive setup script
4. **`ADMIN_ACCOUNT_SETUP.md`** - How to create admin account

---

## 🆘 Quick Help

**Q: Where do I find Firebase credentials?**
A: https://console.firebase.google.com/project/operty-b54dc/settings/general

**Q: What if I don't have access to Firebase Console?**
A: You need access to the Firebase project to get credentials. Contact your Firebase admin.

**Q: Can I use old/example credentials?**
A: No, you need the actual credentials from your Firebase project.

**Q: The .env.local file isn't working**
A: Make sure it's in the project root (same folder as package.json) and restart the dev server.

---

## 📞 Need More Help?

Check these files:
- `FIREBASE_SETUP_GUIDE.md` - Detailed guide
- `ADMIN_ACCOUNT_SETUP.md` - After Firebase is working
- Run: `./scripts/setup-firebase.sh` - Interactive helper

---

**Bottom Line:** You need to get your Firebase credentials and put them in `.env.local`, then restart the dev server. That's it! 🚀
