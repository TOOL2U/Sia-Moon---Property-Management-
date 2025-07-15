import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User ID to add to staff_accounts
const userId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';

// Staff account data
const staffAccountData = {
  firebaseUid: userId,
  name: 'Admin User',
  email: 'admin@siamoon.com',
  phone: '+1234567890',
  address: '123 Admin Street, Admin City',
  role: 'admin',
  status: 'active',
  assignedProperties: [],
  skills: ['management', 'administration'],
  hasCredentials: true,
  isActive: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'system',
  lastModifiedBy: 'system'
};

console.log('🔄 Adding user to staff_accounts collection...');
console.log('User ID:', userId);

try {
  // Add the staff account to Firestore
  const staffRef = doc(db, 'staff_accounts', userId);
  await setDoc(staffRef, staffAccountData);
  
  console.log(`✅ Successfully added user ${userId} to staff_accounts collection`);
  console.log('Staff account data:', staffAccountData);
} catch (error) {
  console.error('❌ Error adding staff account:', error);
}
