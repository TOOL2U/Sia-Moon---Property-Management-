# Sia Moon Staff Mobile App

A React Native (Expo) mobile application for Sia Moon property management staff to receive, accept, and complete job assignments.

## 🚀 Features

### ✅ **Job Reception & Approval System**
- **Real-time job notifications** when new assignments are created
- **Accept/Decline workflow** with instant Firebase sync
- **Push notifications** for new job assignments
- **Job status tracking** (pending → accepted → in progress → completed)

### 📱 **Active Jobs Management**
- **Active jobs dashboard** with job details and progress tracking
- **Google Maps integration** for navigation to job locations
- **Job completion workflow** with photo verification
- **Real-time status updates** synced with webapp

### 📸 **Photo Upload & Verification**
- **Camera integration** for taking completion photos
- **Gallery selection** for existing photos
- **Firebase Storage upload** with progress tracking
- **Photo verification** required before job completion

### 🔐 **Staff Authentication**
- **Firebase Auth integration** using staff email/password
- **Staff profile management** with role-based access
- **Secure session management** with auto-logout
- **Profile statistics** and job history

### 🗺️ **Navigation Integration**
- **Google Maps navigation** to job locations
- **Apple Maps support** on iOS devices
- **Current location detection** for optimal routing
- **Multiple transport modes** (driving, walking, transit)

## 🛠️ Technology Stack

- **React Native** with Expo SDK 50
- **TypeScript** for type safety
- **Firebase** (Auth, Firestore, Storage)
- **React Navigation** for screen navigation
- **React Native Paper** for Material Design UI
- **Expo Camera** for photo capture
- **Expo Location** for GPS functionality
- **Expo Notifications** for push notifications

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Emulator
- Firebase project with same configuration as webapp

## 🚀 Installation

1. **Clone and navigate to mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Ensure Firebase configuration in `src/config/firebase.ts` matches webapp
   - Verify Firestore security rules allow staff access
   - Enable Firebase Storage for photo uploads

4. **Start development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 🔧 Configuration

### Firebase Setup
The app uses the same Firebase project as the webapp:
- **Project ID:** `operty-b54dc`
- **Collections:** `staff_accounts`, `jobs`, `users`
- **Storage:** Job completion photos in `job-completions/` folder

### Environment Variables
No additional environment variables needed - Firebase config is embedded in the app.

### Permissions Required
- **Camera:** For taking job completion photos
- **Location:** For navigation to job sites
- **Notifications:** For job assignment alerts

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   └── JobNotificationBanner.tsx
├── contexts/           # React contexts for state management
│   ├── AuthContext.tsx
│   ├── JobContext.tsx
│   └── NotificationContext.tsx
├── screens/            # App screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ActiveJobsScreen.tsx
│   ├── JobDetailsScreen.tsx
│   ├── JobCompletionScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # Business logic services
│   ├── photoUploadService.ts
│   └── navigationService.ts
├── types/              # TypeScript type definitions
│   └── job.ts
└── config/             # App configuration
    └── firebase.ts
```

## 🔄 Data Flow

1. **Job Assignment (Webapp → Mobile):**
   - Admin creates job in webapp
   - Job document created in Firestore with `assignedStaffId`
   - Mobile app receives real-time update via Firestore listener
   - Push notification sent to staff member
   - Job notification banner appears in mobile app

2. **Job Acceptance (Mobile → Webapp):**
   - Staff accepts/declines job in mobile app
   - Job document updated with `staffResponse` and `status`
   - Webapp receives real-time update
   - Job moves to appropriate status in webapp

3. **Job Completion (Mobile → Webapp):**
   - Staff completes job with photos and notes
   - Photos uploaded to Firebase Storage
   - Job document updated with completion data
   - Webapp shows completed job with proof photos

## 🔐 Security

- **Authentication:** Firebase Auth with email/password
- **Authorization:** Staff can only see jobs assigned to their UID
- **Data Access:** Firestore security rules enforce staff-level permissions
- **Photo Storage:** Firebase Storage with authenticated access only

## 📊 Testing

### Test Staff Account
Create a test staff account in the webapp's staff management section:
- Email: `test.staff@siamoon.com`
- Password: `TestStaff123!`
- Role: `cleaner` or `maintenance`

### Test Job Assignment
1. Create a job assignment in webapp for the test staff member
2. Mobile app should receive notification immediately
3. Accept job and test navigation/completion workflow

## 🚀 Deployment

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Build (EAS)
```bash
eas build --platform android
eas build --platform ios
```

### App Store Submission
```bash
eas submit --platform ios
eas submit --platform android
```

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Connection Issues:**
   - Verify Firebase config matches webapp
   - Check Firestore security rules
   - Ensure staff account exists in `staff_accounts` collection

2. **Push Notifications Not Working:**
   - Check notification permissions
   - Verify Expo push token generation
   - Test with Expo push notification tool

3. **Photo Upload Failures:**
   - Check Firebase Storage permissions
   - Verify camera permissions granted
   - Check network connectivity

4. **Navigation Not Working:**
   - Ensure location permissions granted
   - Check if Google Maps/Apple Maps installed
   - Verify property addresses are valid

## 📞 Support

For technical support or questions:
- Check webapp Firebase configuration
- Verify staff account setup in webapp
- Test job assignment workflow end-to-end

## 🎯 Future Enhancements

- **Offline support** for job data
- **GPS tracking** during job execution
- **Time tracking** for job duration
- **Chat system** with property managers
- **Advanced reporting** and analytics
