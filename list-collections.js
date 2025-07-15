// Simple script to list all collections in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, listCollections } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com", 
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

async function listAllCollections() {
  try {
    console.log('🔍 Connecting to Firestore...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📋 Attempting to list collections...');
    
    // Note: listCollections() is not available in client SDK
    // Let's try a different approach - check for known collections
    const { collection, getDocs } = require('firebase/firestore');
    
    const collectionsToCheck = [
      'staff_accounts',
      'users', 
      'bookings',
      'properties',
      'staff',
      'accounts'
    ];
    
    console.log('🔍 Checking for common collections...');
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (!snapshot.empty) {
          console.log(`✅ ${collectionName}: ${snapshot.size} documents`);
        } else {
          console.log(`📭 ${collectionName}: empty or doesn't exist`);
        }
      } catch (error) {
        console.log(`❌ ${collectionName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllCollections();
