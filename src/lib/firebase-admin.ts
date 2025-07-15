import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    // Check if we have service account credentials
    const hasServiceAccount = process.env.FIREBASE_ADMIN_PROJECT_ID &&
                             process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
                             process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (hasServiceAccount) {
      console.log('🔧 Using Firebase Admin SDK with service account credentials')

      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}-default-rtdb.firebaseio.com`
      })
    } else {
      console.log('🔧 Using Firebase Admin SDK with application default credentials (development)')

      // For development, try to use application default credentials
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc',
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://operty-b54dc-default-rtdb.firebaseio.com'
      })
    }

    console.log('✅ Firebase Admin SDK initialized successfully')
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error)

    // Fallback: try to initialize with minimal config
    try {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc'
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

// Helper function to check if Admin SDK is properly initialized
export function isAdminSDKAvailable(): boolean {
  try {
    return admin.apps.length > 0
  } catch (error) {
    return false
  }
}

export default admin
