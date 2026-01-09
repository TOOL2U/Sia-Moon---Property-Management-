import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCDaTIILnpuL_P2zzT_0J3wh5T5GqwPTlU",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "438092379093",
  appId: "1:438092379093:web:3d6de5c89fffb1b933aef5",
  measurementId: "G-9XDJCR3BQD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('═══════════════════════════════════════════════════');
console.log('🔧 MANUAL JOB CREATION FOR TEST BOOKING');
console.log('═══════════════════════════════════════════════════\n');

const BOOKING_ID = 'XoRHYcjFYjsw8hOK9vv6'; // From previous test

try {
  // Step 1: Get booking details
  console.log('📋 Step 1: Fetching booking details...\n');
  
  const bookingRef = doc(db, 'bookings', BOOKING_ID);
  const bookingSnap = await getDoc(bookingRef);
  
  if (!bookingSnap.exists()) {
    console.error(`❌ Booking ${BOOKING_ID} not found!`);
    process.exit(1);
  }
  
  const booking = bookingSnap.data();
  
  console.log(`   ✅ Booking Found: ${BOOKING_ID}`);
  console.log(`   🏠 Property: ${booking.propertyName}`);
  console.log(`   👤 Guest: ${booking.guestName}`);
  console.log(`   📅 Check-in: ${booking.checkInDate}`);
  console.log(`   📅 Check-out: ${booking.checkOutDate}\n`);
  
  // Step 2: Get property details
  console.log('🏠 Step 2: Fetching property details...\n');
  
  const propertyRef = doc(db, 'properties', booking.propertyId);
  const propertySnap = await getDoc(propertyRef);
  
  if (!propertySnap.exists()) {
    console.error(`❌ Property ${booking.propertyId} not found!`);
    process.exit(1);
  }
  
  const property = propertySnap.data();
  
  console.log(`   ✅ Property: ${property.name}`);
  console.log(`   📍 Location: ${property.location?.neighborhood || 'Unknown'}\n`);
  
  // Step 3: Create jobs
  console.log('💼 Step 3: Creating cleaning jobs...\n');
  
  // Job 1: Pre-arrival cleaning (day before check-in)
  const preArrivalJob = {
    // Job details
    title: `Pre-Arrival Cleaning - ${property.name}`,
    description: `Prepare property for guest arrival. Ensure all rooms are clean, beds made with fresh linens, bathrooms spotless, and amenities restocked.`,
    jobType: 'pre_arrival_cleaning',
    category: 'cleaning',
    
    // Status - UNASSIGNED initially
    status: 'pending',
    priority: 'high',
    
    // ⭐ NOT ASSIGNED - Broadcast to all cleaners
    assignedTo: null,
    assignedStaffId: null,
    assignedStaffRef: null,
    broadcastToAll: true, // Flag: visible to all cleaners in mobile app
    
    // ⭐ Role requirement - Only cleaners can see/accept this
    requiredRole: 'cleaner',
    requiredStaffType: 'cleaner',
    visibleTo: ['cleaner'], // Array of roles that can see this job
    
    // Property information
    propertyId: booking.propertyId,
    propertyRef: {
      id: booking.propertyId,
      name: property.name,
      address: property.location?.address || booking.propertyAddress,
      neighborhood: property.location?.neighborhood || '',
      coordinates: property.location?.coordinates || null,
      googleMapsLink: property.location?.googleMapsLink || ''
    },
    
    // Booking information
    bookingId: BOOKING_ID,
    bookingRef: {
      id: BOOKING_ID,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      numberOfGuests: booking.numberOfGuests,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      bookingReference: booking.bookingReference
    },
    
    // Dates (ISO format for mobile app compatibility)
    scheduledDate: booking.checkInDate, // Day of check-in
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    
    // Estimated time
    estimatedDuration: 120, // 2 hours in minutes
    estimatedCompletionTime: '2 hours',
    
    // Instructions
    instructions: [
      'Clean all rooms thoroughly',
      'Make beds with fresh linens',
      'Clean and sanitize all bathrooms',
      'Restock amenities (toilet paper, soap, shampoo)',
      'Clean kitchen and restock supplies',
      'Check AC and fans are working',
      'Ensure pool is clean (if applicable)',
      'Take before/after photos',
      'Report any maintenance issues'
    ],
    
    // Checklist items
    checklistItems: [
      { id: 1, task: 'Vacuum and mop all floors', completed: false },
      { id: 2, task: 'Dust all surfaces', completed: false },
      { id: 3, task: 'Clean all windows', completed: false },
      { id: 4, task: 'Make beds with fresh linens', completed: false },
      { id: 5, task: 'Clean bathrooms thoroughly', completed: false },
      { id: 6, task: 'Restock amenities', completed: false },
      { id: 7, task: 'Clean kitchen and appliances', completed: false },
      { id: 8, task: 'Check pool cleanliness', completed: false },
      { id: 9, task: 'Take completion photos', completed: false }
    ],
    
    // Metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'manual-test-script',
    
    // Mobile app flags
    syncedToMobile: false,
    mobileJobId: null,
    
    // Payment
    paymentAmount: 50, // USD
    paymentStatus: 'pending',
    currency: 'USD'
  };
  
  // Job 2: Post-checkout cleaning (day of checkout)
  const postCheckoutJob = {
    ...preArrivalJob,
    title: `Post-Checkout Cleaning - ${property.name}`,
    description: `Deep clean property after guest checkout. Remove all trash, change linens, clean all rooms thoroughly, and prepare for next guest.`,
    jobType: 'post_checkout_cleaning',
    scheduledDate: booking.checkOutDate,
    priority: 'medium',
    estimatedDuration: 150, // 2.5 hours
    estimatedCompletionTime: '2.5 hours',
    paymentAmount: 60, // Slightly more for post-checkout
    
    instructions: [
      'Remove all trash and recyclables',
      'Strip beds and remove used linens',
      'Deep clean all rooms',
      'Clean and sanitize all bathrooms',
      'Clean kitchen thoroughly',
      'Check for any damage or missing items',
      'Clean pool and outdoor areas',
      'Take before/after photos',
      'Report any issues or damage'
    ]
  };
  
  // Create the jobs
  const job1Ref = await addDoc(collection(db, 'jobs'), preArrivalJob);
  const job2Ref = await addDoc(collection(db, 'jobs'), postCheckoutJob);
  
  console.log('   ✅ Created Pre-Arrival Job:');
  console.log(`      📝 ID: ${job1Ref.id}`);
  console.log(`      📅 Scheduled: ${preArrivalJob.scheduledDate}`);
  console.log(`      💰 Payment: $${preArrivalJob.paymentAmount}`);
  console.log(`      📢 Broadcast: YES (all cleaners can see)\n`);
  
  console.log('   ✅ Created Post-Checkout Job:');
  console.log(`      📝 ID: ${job2Ref.id}`);
  console.log(`      📅 Scheduled: ${postCheckoutJob.scheduledDate}`);
  console.log(`      💰 Payment: $${postCheckoutJob.paymentAmount}`);
  console.log(`      📢 Broadcast: YES (all cleaners can see)\n`);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ JOBS CREATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('📱 NEXT STEPS - MOBILE APP TESTING:\n');
  console.log('1. Open mobile app and login as cleaner:');
  console.log('   Email: cleaner@siamoon.com\n');
  
  console.log('2. Navigate to "Available Jobs" section');
  console.log('   • Should see 2 new cleaning jobs');
  console.log('   • Jobs should show property name and dates');
  console.log('   • Status should be "Available"\n');
  
  console.log('3. Tap on a job to view details:');
  console.log('   • Property information');
  console.log('   • Guest information');
  console.log('   • Cleaning checklist');
  console.log('   • Payment amount\n');
  
  console.log('4. Accept the job:');
  console.log('   • Tap "Accept Job" button');
  console.log('   • Job moves to "My Jobs"');
  console.log('   • Status changes to "accepted"\n');
  
  console.log('5. Verify real-time sync:');
  console.log('   • Open: http://localhost:3000/admin/backoffice');
  console.log('   • Go to "Job Assignments" tab');
  console.log('   • Should see job status update within 5 seconds\n');
  
  console.log('6. Complete the job workflow:');
  console.log('   • Start Job → In Progress');
  console.log('   • Complete checklist items');
  console.log('   • Add photos (optional)');
  console.log('   • Submit completion → Completed\n');
  
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📋 Booking ID: ${BOOKING_ID}`);
  console.log(`💼 Job 1 ID: ${job1Ref.id} (Pre-Arrival)`);
  console.log(`💼 Job 2 ID: ${job2Ref.id} (Post-Checkout)`);
  console.log(`🏠 Property: ${property.name}`);
  console.log(`👤 Guest: ${booking.guestName}\n`);
  
  console.log('🎉 Test data ready for mobile app verification!\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ ERROR:', error);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
