import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'

// Firebase configuration using environment variables with build-time safety
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
}

// Debug logging to check configuration values
console.log("🔍 Firebase Config Debug:", {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  authDomain: firebaseConfig.authDomain || 'MISSING',
  projectId: firebaseConfig.projectId || 'MISSING',
  storageBucket: firebaseConfig.storageBucket || 'MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'MISSING',
  measurementId: firebaseConfig.measurementId || 'MISSING'
})

// Validate Firebase configuration (only in runtime, not during build)
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

if (missingFields.length > 0) {
  console.warn('⚠️ Firebase configuration is incomplete. Missing fields:', missingFields)

  if (isBrowser) {
    // In browser, show user-friendly error
    console.error('❌ Firebase configuration is missing. Please check environment variables.')
    console.error('Missing fields:', missingFields)

    // Show detailed missing field information
    missingFields.forEach(field => {
      const envVarName = `NEXT_PUBLIC_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`
      console.error(`❌ Missing: ${envVarName} (for ${field})`)
    })

    // Create a helpful error message for users
    if (process.env.NODE_ENV === 'production') {
      console.error('🔧 This appears to be a deployment configuration issue.')
      console.error('Please ensure Firebase environment variables are set in your hosting platform.')
      console.error('🔍 Visit /debug-firebase to see detailed configuration status')
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.error('❌ Firebase configuration is incomplete for development')
    console.error('Please check your environment variables in .env.local')
  } else {
    console.log('🔧 Build time: Firebase configuration will be validated at runtime')
  }
}

// Initialize Firebase with singleton pattern (only if config is complete and not during build)
let app
try {
  // Only initialize if we have the required configuration and we're in browser
  if (missingFields.length === 0 && isBrowser) {
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log('✅ Firebase initialized successfully')
    } else {
      app = getApp()
      console.log('✅ Firebase app already initialized, using existing instance')
    }
  } else {
    if (!isBrowser) {
      console.log('🔧 Server-side: Firebase initialization skipped')
    } else {
      console.log('⏳ Firebase initialization skipped - configuration incomplete')
    }
    app = null
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
  // Only throw in browser environment
  if (isBrowser) {
    console.error('🔧 Firebase initialization error details:', {
      missingFields,
      configKeys: Object.keys(firebaseConfig),
      environment: process.env.NODE_ENV
    })
  }
  app = null
}

// Initialize Firebase services (with null checks for build time)
export const auth = app ? getAuth(app) : null

// Initialize Firestore with simplified settings to avoid state conflicts
export const db = app ? initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}) : null

// Initialize Storage with additional safety checks
export const storage = (() => {
  try {
    // Only initialize storage in browser environment and when app is available
    if (typeof window !== 'undefined' && app && typeof getStorage === 'function') {
      return getStorage(app)
    }
    return null
  } catch (error) {
    console.warn('⚠️ Firebase Storage initialization failed:', error)
    return null
  }
})()

// Initialize Analytics (only in browser and if supported)
let analytics: Analytics | null = null
if (typeof window !== 'undefined' && app) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
      console.log('📊 Firebase Analytics initialized')
    } else {
      console.log('📊 Firebase Analytics not supported in this environment')
    }
  }).catch((error) => {
    console.warn('⚠️ Firebase Analytics initialization failed:', error)
  })
}

export { analytics }

// Export the app instance
export default app

// Log configuration status
console.log('🔥 Firebase services initialized:', {
  auth: !!auth,
  firestore: !!db,
  storage: !!storage,
  analytics: !!analytics,
  projectId: firebaseConfig.projectId
})
