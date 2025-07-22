import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration - same as webapp
const firebaseConfig = {
  apiKey: '[REDACTED - Use environment variable]',
  authDomain: 'operty-b54dc.firebaseapp.com',
  projectId: 'operty-b54dc',
  storageBucket: 'operty-b54dc.firebasestorage.app',
  messagingSenderId: '914547669275',
  appId: '1:914547669275:web:0897d32d59b17134a53bbe',
  measurementId: 'G-R1PELW8B8Q',
  databaseURL: 'https://operty-b54dc-default-rtdb.firebaseio.com/',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Auth
const auth = getAuth(app)

// Initialize Firestore
const db = getFirestore(app)

// Initialize Storage
const storage = getStorage(app)

export { auth, db, storage }
export default app
