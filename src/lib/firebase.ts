import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'

// Firebase configuration using environment variables with build-time safety
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
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
  databaseURL: firebaseConfig.databaseURL || 'MISSING',
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

// Initialize Firebase with singleton pattern (both client and server side)
let app: FirebaseApp | null = null
try {
  // Initialize if we have the required configuration (both browser and server)
  if (missingFields.length === 0) {
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log('✅ Firebase initialized successfully', isBrowser ? '(browser)' : '(server)')
    } else {
      app = getApp()
      console.log('✅ Firebase app already initialized, using existing instance', isBrowser ? '(browser)' : '(server)')
    }
  } else {
    console.log('⏳ Firebase initialization skipped - configuration incomplete')
    console.log('Missing fields:', missingFields)
    app = null
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
  console.error('🔧 Firebase initialization error details:', {
    missingFields,
    configKeys: Object.keys(firebaseConfig),
    environment: process.env.NODE_ENV,
    isBrowser
  })
  app = null
}

// Function to ensure Firebase is initialized (for serverless environments)
export function ensureFirebaseInitialized() {
  if (!app && missingFields.length === 0) {
    try {
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig)
        console.log('✅ Firebase lazy initialized for serverless')
      } else {
        app = getApp()
        console.log('✅ Firebase app retrieved for serverless')
      }
    } catch (error) {
      console.error('❌ Firebase lazy initialization failed:', error)
      throw new Error('Firebase initialization failed')
    }
  }

  if (!app) {
    throw new Error('Firebase not initialized')
  }

  return app
}

// Initialize Firebase services (with null checks for build time)
export const auth = app ? getAuth(app) : null

// Export getAuth function for service usage
export { getAuth } from 'firebase/auth'

// Initialize Firestore with getFirestore (consistent with all other services)
export const db = app ? getFirestore(app) : null

// Function to get Firestore instance with lazy initialization
export function getDb() {
  if (!db) {
    const firebaseApp = ensureFirebaseInitialized()
    return getFirestore(firebaseApp)
  }
  return db
}

// Initialize Storage with additional safety checks (both client and server)
export const storage = (() => {
  try {
    // Initialize storage when app is available (both browser and server)
    if (app && typeof getStorage === 'function') {
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
      analytics = getAnalytics(app!)
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
