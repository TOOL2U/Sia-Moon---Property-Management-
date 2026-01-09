#!/usr/bin/env node

/**
 * Create a post-checkout cleaning job directly for Mountain Retreat Cabin
 * Assigned to cleaner@siamoon.com
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

async function createDirectJob() {
  console.log('🧪 Creating direct post-checkout cleaning job for Mountain Retreat Cabin...\n');
  
  try {
    // Find the cleaner
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'cleaner@siamoon.com'));
    const snapshot = await getDocs(q);
    
    let cleanerId = null;
    if (!snapshot.empty) {
      cleanerId = snapshot.docs[0].id;
      console.log('✅ Found cleaner:');
      console.log(`   ID: ${cleanerId}`);
      console.log(`   Email: ${snapshot.docs[0].data().email}\n`);
    } else {
      console.log('⚠️  Cleaner not found, creating unassigned job\n');
    }
    
    // Job scheduled for 2 hours from now
    const scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    const job = {
      // Property details
      propertyId: 'xapwbYmKxzyKH23gcq9L',
      propertyName: 'Mountain Retreat Cabin',
      propertyRef: {
        id: 'xapwbYmKxzyKH23gcq9L',
        name: 'Mountain Retreat Cabin',
        address: 'Ban Tai, Koh Phangan, Thailand'
      },
      
      // Location (UPDATED COORDINATES - ON LAND!)
      location: {
        address: 'Ban Tai, Koh Phangan, Thailand',
        googleMapsLink: 'https://www.google.com/maps?q=9.705,100.045',
        latitude: 9.705,
        longitude: 100.045
      },
      
      // Job details
      jobType: 'cleaning',
      title: 'Post-Checkout Cleaning - Mountain Retreat Cabin',
      description: 'Complete post-checkout cleaning for Test Guest - Mobile App Demo',
      priority: 'high',
      
      // Scheduling
      scheduledDate: Timestamp.fromDate(scheduledTime),
      scheduledStart: Timestamp.fromDate(scheduledTime),
      estimatedDuration: 120, // 2 hours
      deadline: Timestamp.fromDate(new Date(scheduledTime.getTime() + 120 * 60 * 1000)),
      
      // Assignment
      assignedStaffId: cleanerId,
      assignedTo: cleanerId,
      status: 'pending',
      requiredRole: 'cleaner',
      
      // Guest info
      guestName: 'Test Guest - Mobile App Demo',
      guestCount: 2,
      checkInDate: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      checkOutDate: Timestamp.fromDate(new Date()),
      
      // Requirements
      requiredSkills: ['cleaning', 'housekeeping'],
      requiredSupplies: ['cleaning_supplies', 'fresh_linens', 'toiletries'],
      specialInstructions: 'Test job for mobile app - Check property location on map',
      
      // Property details for mobile app
      propertyPhotos: [],
      accessInstructions: 'Test property - Access instructions would go here',
      specialNotes: 'This is a test job to verify location coordinates display correctly',
      
      // Booking reference
      bookingId: 'test-' + Date.now(),
      bookingRef: {
        id: 'test-' + Date.now(),
        guestName: 'Test Guest - Mobile App Demo',
        checkInDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOutDate: new Date().toISOString().split('T')[0],
        totalAmount: 5000
      },
      
      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: 'manual_test',
      notes: 'Test job for mobile app location verification'
    };
    
    const jobRef = await addDoc(collection(db, 'operational_jobs'), job);
    
    console.log('✅ JOB CREATED SUCCESSFULLY!\n');
    console.log('📋 Job Details:');
    console.log(`   Job ID: ${jobRef.id}`);
    console.log(`   Title: Post-Checkout Cleaning`);
    console.log(`   Property: Mountain Retreat Cabin`);
    console.log(`   Property ID: xapwbYmKxzyKH23gcq9L`);
    console.log(`   Assigned to: ${cleanerId || 'Unassigned (all cleaners can see it)'}`);
    console.log(`   Status: pending`);
    console.log(`   Scheduled: ${scheduledTime.toLocaleString()}\n`);
    
    console.log('📍 Location Details:');
    console.log(`   Address: Ban Tai, Koh Phangan, Thailand`);
    console.log(`   Coordinates: 9.705, 100.045`);
    console.log(`   Google Maps: https://www.google.com/maps?q=9.705,100.045\n`);
    
    console.log('📱 Mobile App Testing:');
    console.log(`   1. Log in as: cleaner@siamoon.com`);
    console.log(`   2. Go to Jobs tab`);
    console.log(`   3. Look for: "Post-Checkout Cleaning - Mountain Retreat Cabin"`);
    console.log(`   4. Check if property location appears correctly on map`);
    console.log(`   5. Location should be at Ban Tai (southern part of island)\n`);
    
    console.log('✅ Job is ready for mobile app testing!');
    
  } catch (error) {
    console.error('❌ Error creating job:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createDirectJob();
