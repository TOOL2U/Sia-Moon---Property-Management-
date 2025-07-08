import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { enableNetwork, disableNetwork, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Firebase configuration using direct process.env access
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
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

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

if (missingFields.length > 0) {
  console.error('❌ Firebase configuration is incomplete. Missing fields:', missingFields)
  console.error('Please check your environment variables in .env.local')
  throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`)
}

// Initialize Firebase with singleton pattern
let app
try {
  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase initialized successfully')
  } else {
    app = getApp()
    console.log('✅ Firebase app already initialized, using existing instance')
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
  throw error
}

// Initialize Firebase services
export const auth = getAuth(app)

// Initialize Firestore with custom settings to reduce connection issues
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: false, // Use WebSocket when available
  ignoreUndefinedProperties: true,
})

export const storage = getStorage(app)

// Configure Firestore for better offline handling
if (typeof window !== 'undefined') {
  // Add a delay before enabling network to ensure proper initialization
  setTimeout(() => {
    enableNetwork(db).catch((error) => {
      console.warn('⚠️ Firestore network enable failed:', error)
      // Try to recover by disabling and re-enabling network
      setTimeout(() => {
        disableNetwork(db).then(() => {
          setTimeout(() => {
            enableNetwork(db).catch((retryError) => {
              console.warn('⚠️ Firestore network retry failed:', retryError)
            })
          }, 1000)
        })
      }, 2000)
    })
  }, 1000)
}

// Initialize Analytics (only in browser and if supported)
let analytics: any = null
if (typeof window !== 'undefined') {
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
