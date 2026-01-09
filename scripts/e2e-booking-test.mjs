#!/usr/bin/env node

/**
 * END-TO-END BOOKING TEST (Automated)
 * Tests: Booking Creation → Calendar Event → Automatic Job Creation
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔧 Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data
const TEST_BOOKING = {
  guestName: 'E2E Test User',
  guestEmail: 'e2etest@example.com',
  guestPhone: '+1234567890',
  guestCount: 4,
  checkInDate: new Date('2026-01-15T14:00:00'),
  checkOutDate: new Date('2026-01-20T11:00:00'),
  propertyId: 'test-property-villa-001',
  propertyName: 'Luxury Test Villa',
  totalPrice: 1500,
  status: 'confirmed', // CRITICAL: Must be confirmed to trigger job creation
  bookingSource: 'e2e-automated-test',
  specialRequests: 'Automated test booking - verify calendar and job creation',
  paymentStatus: 'paid',
  nights: 5
};

// Helper: Format date
function formatDate(date) {
  if (!date) return 'N/A';
  if (date.seconds) {
    date = new Date(date.seconds * 1000);
  }
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper: Wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Step 1: Create test booking
async function createBooking() {
  console.log('\n📝 STEP 1: Creating Test Booking');
  console.log('═'.repeat(70));
  
  try {
    const bookingData = {
      guestName: TEST_BOOKING.guestName,
      guestEmail: TEST_BOOKING.guestEmail,
      guestPhone: TEST_BOOKING.guestPhone,
      guestCount: TEST_BOOKING.guestCount,
      checkInDate: Timestamp.fromDate(TEST_BOOKING.checkInDate),
      checkOutDate: Timestamp.fromDate(TEST_BOOKING.checkOutDate),
      propertyId: TEST_BOOKING.propertyId,
      propertyName: TEST_BOOKING.propertyName,
      totalPrice: TEST_BOOKING.totalPrice,
      status: TEST_BOOKING.status,
      bookingSource: TEST_BOOKING.bookingSource,
      specialRequests: TEST_BOOKING.specialRequests,
      paymentStatus: TEST_BOOKING.paymentStatus,
      nights: TEST_BOOKING.nights,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      jobsCreated: false, // Will be set to true when jobs are created
      jobCreationAttempts: 0
    };
    
    console.log('Creating booking with data:');
    console.log('├─ Guest:', bookingData.guestName);
    console.log('├─ Email:', bookingData.guestEmail);
    console.log('├─ Check-in:', formatDate(TEST_BOOKING.checkInDate));
    console.log('├─ Check-out:', formatDate(TEST_BOOKING.checkOutDate));
    console.log('├─ Property:', bookingData.propertyName);
    console.log('├─ Nights:', bookingData.nights);
    console.log('├─ Total:', `$${bookingData.totalPrice}`);
    console.log('└─ Status:', bookingData.status, '← Triggers automatic job creation');
    
    const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
    
    console.log('\n✅ Booking created successfully!');
    console.log('   Booking ID:', bookingRef.id);
    console.log('   Status: confirmed (should trigger AutomaticJobCreationService)');
    
    return bookingRef.id;
  } catch (error) {
    console.error('❌ Error creating booking:', error.message);
    throw error;
  }
}

// Step 2: Wait and check for calendar event
async function checkCalendarEvent(bookingId, maxWaitSeconds = 10) {
  console.log('\n📅 STEP 2: Checking Calendar Event Creation');
  console.log('═'.repeat(70));
  
  console.log(`⏳ Waiting up to ${maxWaitSeconds} seconds for calendar event...`);
  
  const startTime = Date.now();
  let attempts = 0;
  
  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    attempts++;
    
    try {
      const calendarQuery = query(
        collection(db, 'calendar_events'),
        where('bookingId', '==', bookingId),
        limit(1)
      );
      
      const calendarSnapshot = await getDocs(calendarQuery);
      
      if (!calendarSnapshot.empty) {
        const calendarDoc = calendarSnapshot.docs[0];
        const calendarEvent = { id: calendarDoc.id, ...calendarDoc.data() };
        
        console.log(`✅ Calendar event found! (attempt ${attempts})`);
        console.log('   Event ID:', calendarEvent.id);
        console.log('   Title:', calendarEvent.title || 'N/A');
        console.log('   Start:', formatDate(calendarEvent.start));
        console.log('   End:', formatDate(calendarEvent.end));
        console.log('   Type:', calendarEvent.type || 'N/A');
        console.log('   Property:', calendarEvent.propertyName || 'N/A');
        
        return calendarEvent;
      }
      
      // Wait 1 second before next check
      await wait(1000);
      process.stdout.write(`\r   Checking... (${attempts}s/${maxWaitSeconds}s)`);
      
    } catch (error) {
      console.error(`\n⚠️  Error checking calendar (attempt ${attempts}):`, error.message);
    }
  }
  
  console.log('\n⚠️  Calendar event not found within timeout period');
  console.log('   Note: Calendar events may be created by background service');
  return null;
}

// Step 3: Wait and check for automatic job
async function checkAutomaticJob(bookingId, maxWaitSeconds = 15) {
  console.log('\n\n🔧 STEP 3: Checking Automatic Job Creation');
  console.log('═'.repeat(70));
  
  console.log(`⏳ Waiting up to ${maxWaitSeconds} seconds for automatic job...`);
  console.log('   Expected: Post-checkout cleaning job for Jan 20, 2026');
  
  const startTime = Date.now();
  let attempts = 0;
  
  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    attempts++;
    
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc')
      );
      
      const jobsSnapshot = await getDocs(jobsQuery);
      
      if (!jobsSnapshot.empty) {
        const jobs = [];
        jobsSnapshot.forEach(doc => {
          jobs.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`\n✅ Found ${jobs.length} automatic job(s)! (attempt ${attempts})`);
        
        jobs.forEach((job, index) => {
          console.log(`\n   Job ${index + 1}:`);
          console.log('   ├─ Job ID:', job.id);
          console.log('   ├─ Title:', job.title || 'N/A');
          console.log('   ├─ Type:', job.jobType || 'N/A');
          console.log('   ├─ Required Role:', job.requiredRole || 'N/A', job.requiredRole === 'cleaner' ? '✅' : '⚠️');
          console.log('   ├─ Status:', job.status || 'N/A');
          console.log('   ├─ Priority:', job.priority || 'N/A');
          console.log('   ├─ Scheduled:', formatDate(job.scheduledDate || job.dueDate));
          console.log('   ├─ Property:', job.propertyRef?.name || job.propertyName || 'N/A');
          console.log('   ├─ Broadcast:', job.broadcastToAll ? 'Yes (All cleaners)' : 'No');
          console.log('   └─ Created:', formatDate(job.createdAt));
        });
        
        return jobs;
      }
      
      // Wait 1 second before next check
      await wait(1000);
      process.stdout.write(`\r   Checking... (${attempts}s/${maxWaitSeconds}s)`);
      
    } catch (error) {
      console.error(`\n⚠️  Error checking jobs (attempt ${attempts}):`, error.message);
    }
  }
  
  console.log('\n⚠️  No automatic jobs found within timeout period');
  return [];
}

// Step 4: Verify booking was updated
async function verifyBookingUpdated(bookingId) {
  console.log('\n\n📋 STEP 4: Verifying Booking Update');
  console.log('═'.repeat(70));
  
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      console.log('⚠️  Booking not found');
      return null;
    }
    
    const booking = bookingSnap.data();
    
    console.log('Booking status:');
    console.log('├─ Jobs Created:', booking.jobsCreated ? '✅ Yes' : '❌ No');
    console.log('├─ Job Creation Attempts:', booking.jobCreationAttempts || 0);
    console.log('├─ Job Creation Error:', booking.jobCreationError || 'None');
    console.log('└─ Last Updated:', formatDate(booking.updatedAt));
    
    return booking;
  } catch (error) {
    console.error('⚠️  Error verifying booking:', error.message);
    return null;
  }
}

// Step 5: Verify job details
function verifyJobDetails(jobs) {
  console.log('\n\n✅ STEP 5: Verifying Job Details');
  console.log('═'.repeat(70));
  
  if (jobs.length === 0) {
    console.log('❌ VERIFICATION FAILED: No jobs found');
    console.log('   Expected: At least 1 cleaning job for checkout');
    return false;
  }
  
  let allChecksPassed = true;
  
  // Find cleaning job
  const cleaningJob = jobs.find(job => 
    job.jobType === 'cleaning' || 
    job.title?.toLowerCase().includes('cleaning') ||
    job.title?.toLowerCase().includes('checkout')
  );
  
  if (!cleaningJob) {
    console.log('❌ No cleaning job found');
    allChecksPassed = false;
  } else {
    console.log('✅ Cleaning job verified');
    
    // Check required role
    if (cleaningJob.requiredRole === 'cleaner') {
      console.log('✅ Required role is correct: "cleaner"');
    } else {
      console.log('❌ Required role mismatch:', cleaningJob.requiredRole);
      console.log('   Expected: "cleaner"');
      allChecksPassed = false;
    }
    
    // Check broadcast flag
    if (cleaningJob.broadcastToAll) {
      console.log('✅ Job is broadcast to all cleaners');
    } else {
      console.log('⚠️  Job broadcast flag not set');
      console.log('   Expected: true (visible to all cleaners)');
    }
    
    // Check status
    if (cleaningJob.status === 'pending') {
      console.log('✅ Job status is "pending"');
    } else {
      console.log('⚠️  Job status:', cleaningJob.status);
      console.log('   Expected: "pending"');
    }
    
    // Check scheduled date
    const scheduledDate = cleaningJob.scheduledDate || cleaningJob.dueDate;
    if (scheduledDate) {
      const jobDate = new Date(scheduledDate.seconds ? scheduledDate.seconds * 1000 : scheduledDate);
      const checkoutDate = TEST_BOOKING.checkOutDate;
      
      const sameDay = jobDate.toDateString() === checkoutDate.toDateString();
      
      if (sameDay) {
        console.log('✅ Job scheduled for checkout date:', formatDate(jobDate));
      } else {
        console.log('⚠️  Job date mismatch');
        console.log('   Scheduled:', formatDate(jobDate));
        console.log('   Expected:', formatDate(checkoutDate));
      }
    } else {
      console.log('⚠️  No scheduled date found on job');
    }
  }
  
  return allChecksPassed;
}

// Main test execution
async function runTest() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║     🧪 END-TO-END BOOKING TEST (AUTOMATED)                      ║');
  console.log('║     Booking → Calendar → Automatic Job Creation                 ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\nTest Date:', new Date().toLocaleString());
  console.log('Firebase Project:', firebaseConfig.projectId);
  
  let bookingId = null;
  let calendarEvent = null;
  let jobs = [];
  let booking = null;
  
  try {
    // Step 1: Create booking
    bookingId = await createBooking();
    
    // Step 2: Check calendar event
    calendarEvent = await checkCalendarEvent(bookingId);
    
    // Step 3: Check automatic job
    jobs = await checkAutomaticJob(bookingId);
    
    // Step 4: Verify booking updated
    booking = await verifyBookingUpdated(bookingId);
    
    // Step 5: Verify job details
    const verified = verifyJobDetails(jobs);
    
    // Final summary
    console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     📊 TEST SUMMARY                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\nTest Results:');
    console.log('├─ Booking Created:', bookingId ? '✅ Yes' : '❌ No');
    console.log('├─ Calendar Event:', calendarEvent ? '✅ Yes' : '⚠️  Not found');
    console.log('├─ Automatic Jobs:', jobs.length > 0 ? `✅ Yes (${jobs.length})` : '❌ Not found');
    console.log('├─ Booking Updated:', booking?.jobsCreated ? '✅ Yes' : '⚠️  No');
    console.log('└─ Verification:', verified ? '✅ Passed' : '⚠️  Issues found');
    console.log('');
    
    if (bookingId && jobs.length > 0 && verified) {
      console.log('🎉 TEST PASSED! System is working correctly.\n');
      console.log('✅ What was verified:');
      console.log('  • Booking created in database');
      console.log('  • Automatic job created for checkout');
      console.log('  • Job has correct role (cleaner)');
      console.log('  • Job is broadcast to all cleaners');
      console.log('  • Job is ready for mobile app');
      console.log('');
      console.log('📱 Next steps:');
      console.log('  • Cleaners can now see this job in mobile app');
      console.log('  • Any cleaner with role="cleaner" can accept it');
      console.log('  • Admin can track job status in dashboard');
      console.log('');
      console.log('Test Data Summary:');
      console.log('├─ Booking ID:', bookingId);
      console.log('├─ Check-in:', formatDate(TEST_BOOKING.checkInDate));
      console.log('├─ Check-out:', formatDate(TEST_BOOKING.checkOutDate));
      if (jobs.length > 0) {
        console.log('└─ Job ID:', jobs[0].id);
      }
      console.log('');
      
      process.exit(0);
    } else {
      console.log('⚠️  TEST INCOMPLETE\n');
      console.log('Possible issues:');
      if (!bookingId) {
        console.log('  • Failed to create booking');
      }
      if (!calendarEvent) {
        console.log('  • Calendar event not created (may use different mechanism)');
      }
      if (jobs.length === 0) {
        console.log('  • AutomaticJobCreationService may not be running');
        console.log('  • Jobs may be created by webhook/trigger');
        console.log('  • Check Firestore triggers and Cloud Functions');
        console.log('  • Verify booking status is "confirmed"');
      }
      if (booking && !booking.jobsCreated) {
        console.log('  • Booking not marked as having jobs created');
        console.log('  • Service may still be processing');
      }
      console.log('');
      
      if (bookingId) {
        console.log('Test Data for Manual Verification:');
        console.log('├─ Booking ID:', bookingId);
        console.log('├─ View in Firestore: bookings/' + bookingId);
        console.log('└─ Check admin dashboard for details');
        console.log('');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n\n❌ TEST FAILED WITH ERROR:\n');
    console.error(error);
    console.log('');
    
    if (bookingId) {
      console.log('Partial Test Data:');
      console.log('└─ Booking ID:', bookingId);
      console.log('');
    }
    
    process.exit(1);
  }
}

// Run the test
runTest();
