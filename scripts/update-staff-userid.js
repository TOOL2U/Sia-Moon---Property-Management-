/**
 * Update Staff Document with Firebase Auth UID
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe",
  measurementId: "G-R1PELW8B8Q",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateStaffUserId() {
  console.log('📝 Updating staff document with Firebase Auth UID...');
  
  const email = 'shaun@siamoon.com';
  const uid = 'shaun_siamoon_user_001';
  
  try {
    // Find the staff member
    console.log(`🔍 Looking for staff with email: ${email}`);
    
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('email', '==', email)
    );
    
    const staffSnapshot = await getDocs(staffQuery);
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff found with that email');
      return;
    }
    
    const staffDoc = staffSnapshot.docs[0];
    const staffData = staffDoc.data();
    const staffId = staffDoc.id;
    
    console.log(`✅ Found staff: ${staffData.name} (${staffId})`);
    
    // Update with userId
    await updateDoc(doc(db, 'staff_accounts', staffId), {
      userId: uid,
      firebaseAuthSetup: true,
      updatedAt: new Date()
    });
    
    console.log(`✅ Updated staff document with userId: ${uid}`);
    
    console.log('\n🎉 FIRESTORE UPDATE COMPLETE!');
    console.log('=' .repeat(40));
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 Firebase UID: ${uid}`);
    console.log(`📄 Staff Document ID: ${staffId}`);
    
    console.log('\n🔧 FINAL STEP: Set Password in Firebase Console');
    console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
    console.log(`2. Find user: ${email} (UID: ${uid})`);
    console.log('3. Click the user to edit');
    console.log('4. Set password to: TestPass123!');
    console.log('5. Save');
    
    console.log('\n🚀 THEN YOU CAN LOGIN WITH:');
    console.log(`   Email: ${email}`);
    console.log('   Password: TestPass123!');
    
  } catch (error) {
    console.error('❌ Error updating staff document:', error);
  }
}

updateStaffUserId();
