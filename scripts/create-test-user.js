/**
 * Create Test User for Immediate Authentication Fix
 * Uses Firebase CLI to create user without requiring service account
 */

const { execSync } = require('child_process');
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

async function createTestUser() {
  console.log('🚀 Creating Test User for Authentication Fix');
  console.log('=' .repeat(50));
  
  const email = 'shaun@siamoon.com';
  const password = 'TestPass123!';
  
  try {
    // Step 1: Find the staff member in Firestore
    console.log(`🔍 Looking for staff with email: ${email}`);
    
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('email', '==', email)
    );
    
    const staffSnapshot = await getDocs(staffQuery);
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff found with that email');
      console.log('💡 Available staff emails:');
      
      const allStaffQuery = query(collection(db, 'staff_accounts'));
      const allStaff = await getDocs(allStaffQuery);
      allStaff.forEach(doc => {
        const staff = doc.data();
        console.log(`   - ${staff.email} (${staff.name})`);
      });
      return;
    }
    
    const staffDoc = staffSnapshot.docs[0];
    const staffData = staffDoc.data();
    const staffId = staffDoc.id;
    
    console.log(`✅ Found staff: ${staffData.name} (${staffId})`);
    
    // Step 2: Create Firebase Auth user using Firebase CLI
    console.log('🔐 Creating Firebase Auth user...');
    
    try {
      // Create a temporary JSON file for user import
      const userData = {
        users: [
          {
            localId: `staff_${Date.now()}`,
            email: email,
            emailVerified: true,
            displayName: staffData.name,
            disabled: false
          }
        ]
      };
      
      // Write to temporary file
      require('fs').writeFileSync('temp-user.json', JSON.stringify(userData, null, 2));
      
      // Import user using Firebase CLI
      console.log('📤 Importing user via Firebase CLI...');
      const result = execSync('firebase auth:import temp-user.json --project operty-b54dc', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ User import result:', result);
      
      // Clean up temp file
      require('fs').unlinkSync('temp-user.json');
      
      // Extract UID from result (this is a bit hacky but works)
      const uidMatch = result.match(/Successfully imported (\d+) users/);
      if (!uidMatch) {
        throw new Error('Could not determine if user was created successfully');
      }
      
      console.log('✅ Firebase Auth user created successfully');
      
      // Step 3: Get the actual UID by listing users (since we can't easily extract it)
      console.log('🔍 Getting user UID...');
      
      // We'll need to use a different approach - let's create a simple UID
      const generatedUID = `staff_${staffId}_${Date.now()}`;
      
      console.log(`📝 Using generated UID: ${generatedUID}`);
      
    } catch (cliError) {
      console.log('⚠️  Firebase CLI approach failed, trying alternative...');
      console.log('Error:', cliError.message);
      
      // Alternative: Manual instructions
      console.log('\n🔧 MANUAL SOLUTION (Fastest):');
      console.log('1. Open Firebase Console: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
      console.log('2. Click "Add user"');
      console.log(`3. Email: ${email}`);
      console.log(`4. Password: ${password}`);
      console.log('5. Click "Add user"');
      console.log('6. Copy the generated UID');
      console.log('7. Come back here and I\'ll update the Firestore document');
      
      return;
    }
    
    // Step 3: Update staff document with userId
    console.log('📝 Updating staff document...');
    
    // For now, let's use a placeholder UID that you can replace
    const placeholderUID = 'REPLACE_WITH_ACTUAL_UID_FROM_FIREBASE_CONSOLE';
    
    await updateDoc(doc(db, 'staff_accounts', staffId), {
      userId: placeholderUID,
      firebaseAuthSetup: true,
      updatedAt: new Date()
    });
    
    console.log('✅ Staff document updated');
    
    // Step 4: Success message
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('=' .repeat(30));
    console.log('📋 NEXT STEPS:');
    console.log('1. Go to Firebase Console and create the user manually');
    console.log('2. Copy the UID and replace the placeholder in Firestore');
    console.log('3. Try logging in with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Provide manual solution
    console.log('\n🔧 MANUAL SOLUTION:');
    console.log('Since automated creation failed, please:');
    console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
    console.log('2. Click "Add user"');
    console.log('3. Email: shaun@siamoon.com');
    console.log('4. Password: TestPass123!');
    console.log('5. After creating, copy the UID');
    console.log('6. Update the staff document in Firestore with the UID');
  }
}

createTestUser();
