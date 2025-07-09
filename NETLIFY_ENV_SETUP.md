# 🔥 Firebase Environment Variables Setup for Netlify

## Required Environment Variables

You need to set these environment variables in your Netlify dashboard:

### 1. Go to Netlify Dashboard
1. Open your site in Netlify dashboard
2. Go to **Site settings** > **Environment variables**
3. Click **Add a variable** for each of the following:

### 2. Firebase Configuration Variables

```bash
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)
```

### 3. How to Get Firebase Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Click on your web app or create one
6. Copy the config values from the `firebaseConfig` object

Example Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Copy this to NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "your-project.firebaseapp.com", // Copy this
  projectId: "your-project-id", // Copy this
  storageBucket: "your-project.appspot.com", // Copy this
  messagingSenderId: "123456789", // Copy this
  appId: "1:123:web:abc123", // Copy this
  measurementId: "G-ABC123" // Copy this (optional)
};
```

### 4. Additional Environment Variables (Optional)

```bash
# Application URL
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app

# Webhook URLs (if using Make.com integration)
NEXT_PUBLIC_MAKE_WEBHOOK_URL=your_webhook_url_here
```

## 🔍 Debugging Firebase Issues

After setting environment variables:

1. **Redeploy your site** - Environment variables only take effect after redeployment
2. **Check the Firebase Status component** - It will show in the bottom-right corner
3. **Check browser console** - Look for Firebase initialization messages
4. **Verify all variables are set** - The status component will show which are missing

## 🚨 Common Issues

### Issue 1: "Firebase is not defined"
- **Cause**: Missing environment variables
- **Solution**: Set all required `NEXT_PUBLIC_FIREBASE_*` variables in Netlify

### Issue 2: "Firebase initialization failed"
- **Cause**: Invalid Firebase configuration values
- **Solution**: Double-check values from Firebase Console

### Issue 3: "Auth/Database not working"
- **Cause**: Firebase services not properly initialized
- **Solution**: Ensure all required environment variables are set and redeploy

## ✅ Verification Steps

1. Set all environment variables in Netlify
2. Trigger a new deployment
3. Visit your live site
4. Check the Firebase Status component (bottom-right corner)
5. All items should show ✅ green checkmarks
6. Test authentication and database functionality

## 🔧 Need Help?

If you're still having issues:
1. Check the Firebase Status component for specific missing variables
2. Verify your Firebase project settings
3. Ensure you've redeployed after setting environment variables
4. Check browser console for detailed error messages
