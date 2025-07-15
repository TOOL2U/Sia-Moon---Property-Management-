import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

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

// Test credentials
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
  role: 'staff'
};

async function testBcryptAuthentication() {
  console.log('🧪 Testing bcrypt authentication system...\n');
  
  try {
    // Step 1: Create test user with bcrypt password
    console.log('📝 Step 1: Creating test user with bcrypt password...');
    const passwordHash = await bcrypt.hash(testUser.password, 12);
    console.log('✅ Password hashed successfully');
    
    const testStaffData = {
      email: testUser.email.toLowerCase().trim(),
      passwordHash: passwordHash,
      name: testUser.name,
      phone: '+1234567890',
      address: '123 Test Street',
      role: testUser.role,
      department: 'Testing',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null
    };
    
    const testDocRef = doc(collection(db, 'staff_accounts'));
    await setDoc(testDocRef, testStaffData);
    console.log('✅ Test user created with ID:', testDocRef.id);
    
    // Step 2: Test authentication
    console.log('\n📝 Step 2: Testing authentication...');
    
    // Query for the user
    const q = query(
      collection(db, 'staff_accounts'),
      where('email', '==', testUser.email.toLowerCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    console.log('✅ User found:', userData.name);
    
    // Test correct password
    console.log('\n📝 Step 3: Testing correct password...');
    const correctPasswordMatch = await bcrypt.compare(testUser.password, userData.passwordHash);
    if (correctPasswordMatch) {
      console.log('✅ Correct password verification: PASSED');
    } else {
      throw new Error('Correct password verification failed');
    }
    
    // Test incorrect password
    console.log('\n📝 Step 4: Testing incorrect password...');
    const incorrectPasswordMatch = await bcrypt.compare('wrongpassword', userData.passwordHash);
    if (!incorrectPasswordMatch) {
      console.log('✅ Incorrect password verification: PASSED (correctly rejected)');
    } else {
      throw new Error('Incorrect password was accepted - SECURITY ISSUE!');
    }
    
    // Step 5: Clean up
    console.log('\n📝 Step 5: Cleaning up test data...');
    await deleteDoc(doc(db, 'staff_accounts', testDocRef.id));
    console.log('✅ Test user deleted');
    
    console.log('\n🎉 All bcrypt authentication tests PASSED!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Password hashing with 12 salt rounds: WORKING');
    console.log('✅ User creation in staff_accounts collection: WORKING');
    console.log('✅ Correct password verification: WORKING');
    console.log('✅ Incorrect password rejection: WORKING');
    console.log('✅ Database cleanup: WORKING');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testBcryptAuthentication();
