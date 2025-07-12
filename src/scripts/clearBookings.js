// Clear all bookings from Firebase for fresh testing
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function clearAllBookings() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📋 Fetching all bookings from live_bookings collection...');
    const bookingsRef = collection(db, 'live_bookings');
    const snapshot = await getDocs(bookingsRef);
    
    console.log(`📊 Found ${snapshot.size} bookings to delete`);
    
    if (snapshot.size === 0) {
      console.log('✅ No bookings found - collection is already empty');
      return;
    }
    
    console.log('🗑️ Deleting all bookings...');
    const deletePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      console.log(`🗑️ Queuing deletion of booking: ${docSnapshot.id}`);
      deletePromises.push(deleteDoc(doc(db, 'live_bookings', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ All bookings deleted successfully!');
    console.log('🎯 Database is now clean and ready for fresh test bookings');
    
  } catch (error) {
    console.error('❌ Error clearing bookings:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearAllBookings()
  .then(() => {
    console.log('🎉 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
