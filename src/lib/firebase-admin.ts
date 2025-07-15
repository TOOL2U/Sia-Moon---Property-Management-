import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    // For development, we'll use the application default credentials
    // In production, you should use proper service account credentials
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    })
    console.log('✅ Firebase Admin SDK initialized successfully')
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error)

    // Fallback: try to initialize with minimal config
    try {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      })
      console.log('✅ Firebase Admin SDK initialized with minimal config')
    } catch (fallbackError) {
      console.error('❌ Firebase Admin SDK fallback initialization failed:', fallbackError)
    }
  }
}

// Export the admin SDK and Firestore database
export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
export const adminStorage = admin.storage()

export default admin
