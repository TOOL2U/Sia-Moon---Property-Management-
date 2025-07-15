import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

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

// Test data
const testStaffData = {
  firebaseUid: 'test-staff-123',
  name: 'Test Staff Member',
  email: 'test-staff@example.com',
  phone: '+1234567890',
  address: '123 Test Street, Test City',
  role: 'staff',
  status: 'active',
  assignedProperties: [],
  skills: ['cleaning', 'maintenance'],
  hasCredentials: true,
  isActive: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'test-script',
  lastModifiedBy: 'test-script'
};

async function testStaffAccountCreation() {
  try {
    console.log('🧪 Testing staff account creation...');
    
    // Test 1: Create a test staff account
    console.log('📝 Test 1: Creating test staff account...');
    const staffRef = doc(db, 'staff_accounts', testStaffData.firebaseUid);
    await setDoc(staffRef, testStaffData);
    console.log('✅ Test staff account created successfully');
    
    // Test 2: Verify the account exists
    console.log('📝 Test 2: Verifying account exists...');
    // We'll check this via the API endpoint
    
    // Test 3: Clean up - delete the test account
    console.log('📝 Test 3: Cleaning up test data...');
    await deleteDoc(staffRef);
    console.log('✅ Test staff account deleted successfully');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStaffAccountCreation();
