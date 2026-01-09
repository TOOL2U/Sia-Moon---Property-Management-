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
console.log('🔧 CREATING JOBS IN CORRECT COLLECTION');
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
  
  // Step 3: Create jobs in OPERATIONAL_JOBS collection
  console.log('💼 Step 3: Creating jobs in "operational_jobs" collection...\n');
  
  // Job 1: Pre-arrival cleaning
  const preArrivalJob = {
    // Job identification
    jobType: 'pre_arrival_cleaning',
    type: 'pre_arrival_cleaning', // Alias for compatibility
    category: 'cleaning',
    title: `Pre-Arrival Cleaning - ${property.name}`,
    description: `Prepare property for guest arrival. Clean all rooms, make beds with fresh linens, sanitize bathrooms, and restock amenities.`,
    
    // Status - UNASSIGNED initially
    status: 'pending',
    priority: 'high',
    
    // ⭐ NOT ASSIGNED - Broadcast to all cleaners
    assignedStaffId: null,
    assignedStaffRef: null,
    offeredTo: [], // Will be populated by auto-dispatch
    
    // ⭐ Role requirement - Only cleaners
    requiredRole: 'cleaner',
    requiredSkills: ['cleaning', 'property_preparation'],
    
    // Property information
    propertyId: booking.propertyId,
    propertyRef: {
      id: booking.propertyId,
      name: property.name,
      address: property.location?.address || booking.propertyAddress,
      neighborhood: property.location?.neighborhood || '',
      coordinates: property.location?.coordinates || null
    },
    
    // Booking information
    bookingId: BOOKING_ID,
    bookingRef: {
      id: BOOKING_ID,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      numberOfGuests: booking.numberOfGuests || 2,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate
    },
    
    // Timing (using Firestore Timestamps for proper date handling)
    scheduledFor: booking.checkIn, // Keep original Timestamp
    scheduledDate: booking.checkInDate, // ISO string for display
    dueBy: booking.checkIn,
    estimatedDuration: 120, // 2 hours in minutes
    
    // Requirements
    requirements: {
      skills: ['cleaning', 'property_preparation'],
      certifications: [],
      equipment: ['cleaning_supplies', 'vacuum', 'mop']
    },
    
    // Workflow
    workflow: {
      currentStep: 'created',
      steps: [
        { id: 'created', name: 'Job Created', completed: true, completedAt: new Date().toISOString() },
        { id: 'offered', name: 'Offered to Staff', completed: false },
        { id: 'assigned', name: 'Assigned', completed: false },
        { id: 'in_progress', name: 'In Progress', completed: false },
        { id: 'completed', name: 'Completed', completed: false }
      ]
    },
    
    // Checklist
    checklistItems: [
      { id: '1', task: 'Vacuum and mop all floors', completed: false },
      { id: '2', task: 'Dust all surfaces', completed: false },
      { id: '3', task: 'Clean all windows', completed: false },
      { id: '4', task: 'Make beds with fresh linens', completed: false },
      { id: '5', task: 'Clean and sanitize bathrooms', completed: false },
      { id: '6', task: 'Restock bathroom amenities', completed: false },
      { id: '7', task: 'Clean kitchen thoroughly', completed: false },
      { id: '8', task: 'Check pool cleanliness', completed: false },
      { id: '9', task: 'Take completion photos', completed: false }
    ],
    
    // Metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'system',
    createdBySystem: true,
    source: 'booking_automation',
    
    // Flags
    isAutoCreated: true,
    notificationsSent: false,
    
    // Payment
    paymentAmount: 50,
    paymentCurrency: 'USD',
    paymentStatus: 'pending'
  };
  
  // Job 2: Post-checkout cleaning
  const postCheckoutJob = {
    ...preArrivalJob,
    jobType: 'post_checkout_cleaning',
    type: 'post_checkout_cleaning',
    title: `Post-Checkout Cleaning - ${property.name}`,
    description: `Deep clean property after guest checkout. Remove trash, strip beds, clean all rooms, and prepare for next guest.`,
    scheduledFor: booking.checkOut,
    scheduledDate: booking.checkOutDate,
    dueBy: booking.checkOut,
    priority: 'medium',
    estimatedDuration: 150, // 2.5 hours
    paymentAmount: 60,
    
    checklistItems: [
      { id: '1', task: 'Remove all trash and recyclables', completed: false },
      { id: '2', task: 'Strip beds and collect used linens', completed: false },
      { id: '3', task: 'Deep clean all rooms', completed: false },
      { id: '4', task: 'Clean and sanitize all bathrooms', completed: false },
      { id: '5', task: 'Clean kitchen and appliances', completed: false },
      { id: '6', task: 'Check for damage or missing items', completed: false },
      { id: '7', task: 'Clean pool and outdoor areas', completed: false },
      { id: '8', task: 'Vacuum and mop all floors', completed: false },
      { id: '9', task: 'Take before/after photos', completed: false }
    ]
  };
  
  // Create jobs in operational_jobs collection
  const job1Ref = await addDoc(collection(db, 'operational_jobs'), preArrivalJob);
  const job2Ref = await addDoc(collection(db, 'operational_jobs'), postCheckoutJob);
  
  console.log('   ✅ Created Pre-Arrival Job:');
  console.log(`      📝 ID: ${job1Ref.id}`);
  console.log(`      📅 Scheduled: ${preArrivalJob.scheduledDate}`);
  console.log(`      💰 Payment: $${preArrivalJob.paymentAmount}`);
  console.log(`      📊 Status: ${preArrivalJob.status}`);
  console.log(`      🎯 Collection: operational_jobs\n`);
  
  console.log('   ✅ Created Post-Checkout Job:');
  console.log(`      📝 ID: ${job2Ref.id}`);
  console.log(`      📅 Scheduled: ${postCheckoutJob.scheduledDate}`);
  console.log(`      💰 Payment: $${postCheckoutJob.paymentAmount}`);
  console.log(`      📊 Status: ${postCheckoutJob.status}`);
  console.log(`      🎯 Collection: operational_jobs\n`);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ JOBS CREATED IN CORRECT COLLECTION!');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('🔍 VERIFICATION STEPS:\n');
  console.log('1. WEBAPP - Jobs Page:');
  console.log('   URL: http://localhost:3000/jobs');
  console.log('   Should now see 2 new jobs\n');
  
  console.log('2. WEBAPP - Bookings Page:');
  console.log('   URL: http://localhost:3000/bookings');
  console.log('   Should see the test booking\n');
  
  console.log('3. WEBAPP - Backoffice:');
  console.log('   URL: http://localhost:3000/admin/backoffice');
  console.log('   Go to Job Assignments tab');
  console.log('   Should see both jobs listed\n');
  
  console.log('4. MOBILE APP:');
  console.log('   Login as: cleaner@siamoon.com');
  console.log('   Navigate to Jobs screen');
  console.log('   Should see 2 available jobs\n');
  
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📋 Booking ID: ${BOOKING_ID}`);
  console.log(`💼 Pre-Arrival Job ID: ${job1Ref.id}`);
  console.log(`💼 Post-Checkout Job ID: ${job2Ref.id}`);
  console.log(`🏠 Property: ${property.name}`);
  console.log(`👤 Guest: ${booking.guestName}`);
  console.log(`📅 Check-in: ${booking.checkInDate}`);
  console.log(`📅 Check-out: ${booking.checkOutDate}\n`);
  
  console.log('🎉 Jobs are now in the correct collection and ready for testing!\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ ERROR:', error);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
