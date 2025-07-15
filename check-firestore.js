const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'villa-property-management',
  });
  console.log('Connected to Firestore emulator');
}

const db = admin.firestore();

async function checkStaffAccountsCollection() {
  try {
    console.log('Checking for staff_accounts collection...');
    
    // Try to get the collection reference
    const collectionRef = db.collection('staff_accounts');
    const snapshot = await collectionRef.limit(10).get();
    
    if (snapshot.empty) {
      console.log('❌ staff_accounts collection is empty or does not exist');
      
      // Let's also try to list all collections
      console.log('\nAttempting to list all collections...');
      try {
        const collections = await db.listCollections();
        if (collections.length === 0) {
          console.log('No collections found in the database');
        } else {
          console.log('Available collections:');
          collections.forEach(collection => {
            console.log(`  - ${collection.id}`);
          });
        }
      } catch (listError) {
        console.log('Could not list collections:', listError.message);
      }
      
    } else {
      console.log('✅ staff_accounts collection exists and has documents');
      console.log(`Number of documents found: ${snapshot.size}`);
      
      snapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        console.log(`Document data:`, doc.data());
      });
    }
    
  } catch (error) {
    console.error('Error checking staff_accounts collection:', error.message);
  }
}

checkStaffAccountsCollection().then(() => {
  console.log('\nCheck completed');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
