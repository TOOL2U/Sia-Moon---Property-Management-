const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC5h6J7AasIXdbmbJmRtkhFlQRuQ4I2pLQ",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.appspot.com",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:f69e5972e8e1243da2a9fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to prompt for input
async function prompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', data => {
      resolve(data.toString().trim());
    });
  });
}

async function updateStaffWithUserId() {
  try {
    console.log('Updating a staff account with a userId...');
    
    // First, get the staff ID from the user
    const staffId = await prompt('Enter staff ID: ');
    if (!staffId) {
      console.log('No staff ID entered. Exiting.');
      return;
    }
    
    // Get the staff document
    const staffDocRef = doc(db, 'staff_accounts', staffId);
    const staffDoc = await getDoc(staffDocRef);
    
    if (!staffDoc.exists()) {
      console.log(`Staff account ${staffId} does not exist`);
      return;
    }
    
    const staffData = staffDoc.data();
    console.log('\nStaff Account Details:');
    console.log(`Name: ${staffData.name || 'Not specified'}`);
    console.log(`Email: ${staffData.email || 'Not specified'}`);
    console.log(`User ID: ${staffData.userId || 'Not specified'}`);
    
    if (staffData.userId) {
      console.log(`\nThis staff account already has userId: ${staffData.userId}`);
      const shouldContinue = await prompt('Do you want to update it anyway? (y/n): ');
      if (shouldContinue.toLowerCase() !== 'y') {
        console.log('Operation cancelled');
        return;
      }
    }
    
    // Ask for email and password for Firebase Auth
    let email = staffData.email;
    if (!email) {
      email = await prompt('Enter email for the staff account: ');
    } else {
      const useExistingEmail = await prompt(`Use existing email ${email}? (y/n): `);
      if (useExistingEmail.toLowerCase() !== 'y') {
        email = await prompt('Enter new email: ');
      }
    }
    
    const password = await prompt('Enter password for the auth account: ');
    
    // Create or sign in to Firebase Auth
    let userCredential;
    try {
      // First try to create a new user
      console.log('Attempting to create a new Firebase Auth user...');
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`Created new auth account with UID: ${userCredential.user.uid}`);
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('Email already in use. Attempting to sign in...');
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log(`Signed in to existing auth account with UID: ${userCredential.user.uid}`);
        } catch (signInError) {
          console.error('Error signing in:', signInError);
          return;
        }
      } else {
        console.error('Error creating auth account:', authError);
        return;
      }
    }
    
    // Update the staff account with the userId
    await updateDoc(staffDocRef, {
      userId: userCredential.user.uid,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`\nSuccessfully updated staff account ${staffId} with userId: ${userCredential.user.uid}`);
    
    // Print info for creating test jobs
    console.log(`\nTo create test jobs for this staff member, use:`);
    console.log(`
await TestJobService.createTestJob({
  useSpecificStaffId: "${staffId}",
  useSpecificUserId: "${userCredential.user.uid}"
});`);
    
  } catch (error) {
    console.error('Error updating staff account:', error);
  }
}

updateStaffWithUserId()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
