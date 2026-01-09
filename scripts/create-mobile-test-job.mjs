#!/usr/bin/env node

/**
 * Create a test booking for Mountain Retreat Cabin
 * This will trigger automatic job creation for the mobile app
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBznNyw1j_2EYvBykjvOmMWHM-9zOQZGPc",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestBooking() {
  console.log('🧪 Creating test booking for Mountain Retreat Cabin...\n');
  
  try {
    // Find the cleaner user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'cleaner@siamoon.com'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.error('❌ Cleaner not found: cleaner@siamoon.com');
      console.log('\n📋 Available users:');
      const allUsers = await getDocs(collection(db, 'users'));
      allUsers.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.email} (role: ${data.role || 'N/A'})`);
      });
      process.exit(1);
    }
    
    const cleanerDoc = snapshot.docs[0];
    console.log('✅ Found cleaner:');
    console.log(`   ID: ${cleanerDoc.id}`);
    console.log(`   Email: ${cleanerDoc.data().email}`);
    console.log(`   Name: ${cleanerDoc.data().displayName || cleanerDoc.data().name || 'N/A'}\n`);
    
    // Create booking that will trigger job creation
    const now = new Date();
    const checkOut = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const checkIn = new Date(checkOut.getTime() - 24 * 60 * 60 * 1000); // 1 day before checkout
    
    const booking = {
      propertyId: 'xapwbYmKxzyKH23gcq9L', // Mountain Retreat Cabin
      propertyName: 'Mountain Retreat Cabin',
      propertyAddress: 'Ban Tai, Koh Phangan',
      guestName: 'Test Guest - Mobile App Demo',
      guestEmail: 'testguest@example.com',
      guestPhone: '+66 12 345 6789',
      numberOfGuests: 2,
      
      // Dates
      checkIn: Timestamp.fromDate(checkIn),
      checkOut: Timestamp.fromDate(checkOut),
      checkInDate: Timestamp.fromDate(checkIn),
      checkOutDate: Timestamp.fromDate(checkOut),
      
      totalAmount: 5000,
      status: 'confirmed', // Triggers job creation
      
      // Job flags
      jobsCreated: false,
      broadcastToAllCleaners: false,
      
      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      bookingSource: 'manual_test',
      notes: 'Test booking for mobile app - Post-checkout cleaning job'
    };
    
    const bookingRef = await addDoc(collection(db, 'bookings'), booking);
    
    console.log('✅ TEST BOOKING CREATED!\n');
    console.log('📋 Booking Details:');
    console.log(`   Booking ID: ${bookingRef.id}`);
    console.log(`   Property: Mountain Retreat Cabin`);
    console.log(`   Property ID: xapwbYmKxzyKH23gcq9L`);
    console.log(`   Guest: Test Guest - Mobile App Demo`);
    console.log(`   Check-in: ${checkIn.toLocaleString()}`);
    console.log(`   Check-out: ${checkOut.toLocaleString()}`);
    console.log(`   Status: confirmed\n`);
    
    console.log('⏳ AutomaticJobCreationService will now:');
    console.log('   1. Detect this new confirmed booking');
    console.log('   2. Create a Post-Checkout Cleaning job');
    console.log('   3. Include property coordinates (9.705, 100.045)');
    console.log('   4. Broadcast to all cleaners\n');
    
    console.log('📱 Mobile App Testing:');
    console.log('   • Log in as: cleaner@siamoon.com');
    console.log('   • Check Jobs tab for new job');
    console.log('   • Job title: "Post-Checkout Cleaning"');
    console.log('   • Property: Mountain Retreat Cabin');
    console.log('   • Location: Ban Tai, Koh Phangan');
    console.log('   • Coordinates: 9.705, 100.045\n');
    
    console.log('🗺️  Verify location on map:');
    console.log('   https://www.google.com/maps?q=9.705,100.045\n');
    
    console.log('⏰ Wait 5-10 seconds for job creation, then refresh mobile app');
    
  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createTestBooking();
