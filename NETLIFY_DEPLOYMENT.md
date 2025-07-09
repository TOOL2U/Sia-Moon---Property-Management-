# 🚀 Netlify Deployment Guide

## 📋 **Environment Variables Setup**

After deploying to Netlify, you need to configure the following environment variables in your Netlify dashboard:

### **🔧 How to Add Environment Variables:**

1. **Go to your Netlify dashboard**
2. **Select your site**
3. **Go to Site settings → Environment variables**
4. **Add the following variables:**

### **🔥 Required Firebase Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY = your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID = your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = your_measurement_id
```

### **🌐 Application Variables:**
```
NEXT_PUBLIC_APP_URL = https://your-site.netlify.app
NODE_ENV = production
```

### **📧 Webhook Variables:**
```
NEXT_PUBLIC_SIGNUP_WEBHOOK_URL = your_make_webhook_url
```

### **☁️ Optional Cloudinary Variables:**
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = your_cloudinary_cloud_name
CLOUDINARY_API_KEY = your_cloudinary_api_key
CLOUDINARY_API_SECRET = your_cloudinary_api_secret
```

## 🔄 **After Adding Variables:**

1. **Trigger a new deploy** in Netlify
2. **Check the deploy logs** for any remaining issues
3. **Test your application** functionality

## 🛠️ **Troubleshooting:**

If you encounter issues:
1. **Check all environment variables** are correctly set
2. **Verify Firebase project** is properly configured
3. **Check Netlify function logs** for runtime errors
4. **Ensure webhook URLs** are accessible

## ✅ **Deployment Checklist:**

- [ ] All Firebase environment variables configured
- [ ] Application URL set correctly
- [ ] Webhook URLs configured
- [ ] Site deploys successfully
- [ ] Authentication works
- [ ] Database connections work
- [ ] Email notifications work (if configured)

Your Sia Moon Property Management app should now be live! 🎉
