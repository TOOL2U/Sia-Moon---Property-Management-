const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'operty-b54dc',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listStaffAccounts() {
  try {
    const staffCollection = collection(db, 'staff_accounts');
    const staffSnapshot = await getDocs(staffCollection);
    
    if (staffSnapshot.empty) {
      console.log('No staff accounts found');
      return;
    }
    
    console.log(`Found ${staffSnapshot.size} staff accounts:`);
    
    staffSnapshot.forEach(doc => {
      const staffData = doc.data();
      console.log(`\nStaff ID: ${doc.id}`);
      console.log(`Name: ${staffData.name || 'Not specified'}`);
      console.log(`Email: ${staffData.email || 'Not specified'}`);
      console.log(`User ID: ${staffData.userId || 'NOT FOUND - NEEDS SETUP'}`);
      console.log(`Is Active: ${staffData.isActive === true ? 'Yes' : 'No'}`);
    });
  } catch (error) {
    console.error('Error listing staff accounts:', error);
  }
}

listStaffAccounts()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));
