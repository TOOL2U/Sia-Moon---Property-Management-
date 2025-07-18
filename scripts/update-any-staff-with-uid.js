/**
 * Update Any Staff Document with Firebase UID
 * Quick solution for testing authentication
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function updateStaffWithUID() {
  console.log('📝 Update Staff Document with Firebase UID');
  console.log('=' .repeat(50));
  
  try {
    // Get all staff
    const staffSnapshot = await getDocs(collection(db, 'staff_accounts'));
    
    console.log('Available staff members:');
    const staffList = [];
    staffSnapshot.forEach((doc, index) => {
      const staff = doc.data();
      staffList.push({ id: doc.id, ...staff });
      console.log(`${index + 1}. ${staff.name} (${staff.email}) - ID: ${doc.id}`);
    });
    
    if (staffList.length === 0) {
      console.log('❌ No staff found');
      rl.close();
      return;
    }
    
    // Get user input
    const staffChoice = await promptQuestion('\nEnter staff number to update (or press Enter for first staff): ');
    const uid = await promptQuestion('Enter the Firebase UID you copied from console: ');
    
    if (!uid.trim()) {
      console.log('❌ UID is required');
      rl.close();
      return;
    }
    
    // Select staff
    const selectedIndex = staffChoice.trim() ? parseInt(staffChoice) - 1 : 0;
    const selectedStaff = staffList[selectedIndex];
    
    if (!selectedStaff) {
      console.log('❌ Invalid staff selection');
      rl.close();
      return;
    }
    
    console.log(`\n📝 Updating staff: ${selectedStaff.name}`);
    
    // Update staff document
    await updateDoc(doc(db, 'staff_accounts', selectedStaff.id), {
      userId: uid.trim(),
      firebaseAuthSetup: true,
      updatedAt: new Date(),
      testUserSetup: true // Flag to indicate this is for testing
    });
    
    console.log('✅ Staff document updated successfully!');
    
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('=' .repeat(30));
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('   Email: test@siamoon.com');
    console.log('   Password: TestPass123!');
    console.log('');
    console.log('📄 STAFF DETAILS:');
    console.log(`   Name: ${selectedStaff.name}`);
    console.log(`   Staff ID: ${selectedStaff.id}`);
    console.log(`   Firebase UID: ${uid.trim()}`);
    console.log('');
    console.log('🚀 NOW YOU CAN:');
    console.log('1. Login to web app with test@siamoon.com / TestPass123!');
    console.log('2. Login to mobile app with same credentials');
    console.log('3. Create jobs assigned to this staff member');
    console.log('4. Jobs will appear in mobile app');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

updateStaffWithUID();
