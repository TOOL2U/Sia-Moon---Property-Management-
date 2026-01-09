import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

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
console.log('🔍 TESTING BOOKING → CALENDAR INTEGRATION');
console.log('═══════════════════════════════════════════════════\n');

const BOOKING_ID = 'XoRHYcjFYjsw8hOK9vv6'; // Our test booking

try {
  // Step 1: Check booking exists and its status
  console.log('📋 Step 1: Checking test booking...\n');
  
  const bookingRef = doc(db, 'bookings', BOOKING_ID);
  const bookingSnap = await getDoc(bookingRef);
  
  if (!bookingSnap.exists()) {
    console.error(`❌ Booking ${BOOKING_ID} not found!`);
    console.log('\n💡 Run this first: node scripts/test-automatic-job-creation.mjs\n');
    process.exit(1);
  }
  
  const booking = bookingSnap.data();
  
  console.log('   ✅ Booking Found:');
  console.log(`      ID: ${BOOKING_ID}`);
  console.log(`      Guest: ${booking.guestName}`);
  console.log(`      Property: ${booking.propertyName}`);
  console.log(`      Status: ${booking.status}`);
  console.log(`      Check-in: ${booking.checkInDate}`);
  console.log(`      Check-out: ${booking.checkOutDate}\n`);
  
  // Step 2: Check for calendar events for this booking
  console.log('📅 Step 2: Checking calendar events...\n');
  
  const calendarQuery = query(
    collection(db, 'calendar_events'),
    where('bookingId', '==', BOOKING_ID)
  );
  const calendarSnap = await getDocs(calendarQuery);
  
  console.log(`   Found: ${calendarSnap.size} calendar event(s)\n`);
  
  if (calendarSnap.size > 0) {
    console.log('   ✅ Calendar Events:');
    calendarSnap.forEach((eventDoc, index) => {
      const event = eventDoc.data();
      console.log(`\n   ${index + 1}. ${event.title || 'Untitled'}`);
      console.log(`      ID: ${eventDoc.id}`);
      console.log(`      Type: ${event.type || 'unknown'}`);
      console.log(`      Status: ${event.status || 'unknown'}`);
      console.log(`      Start: ${event.start?.toDate?.()?.toISOString() || event.start || 'unknown'}`);
      console.log(`      End: ${event.end?.toDate?.()?.toISOString() || event.end || 'unknown'}`);
      console.log(`      Color: ${event.color || 'unknown'}`);
    });
    console.log('');
  } else {
    console.log('   ⚠️  No calendar events found for this booking');
    console.log('   This might be because:');
    console.log('   - Booking status is not "approved" or "confirmed"');
    console.log('   - Calendar events were not created during approval');
    console.log('   - CalendarEventService has creation disabled\n');
  }
  
  // Step 3: Check calendar_events collection (all events)
  console.log('📊 Step 3: Checking all calendar events...\n');
  
  const allCalendarSnap = await getDocs(collection(db, 'calendar_events'));
  console.log(`   Total calendar events: ${allCalendarSnap.size}\n`);
  
  if (allCalendarSnap.size > 0) {
    console.log('   Recent events:');
    allCalendarSnap.docs.slice(0, 3).forEach((eventDoc, index) => {
      const event = eventDoc.data();
      console.log(`   ${index + 1}. ${event.title || 'Untitled'} (${event.type || 'unknown type'})`);
    });
    console.log('');
  }
  
  // Step 4: Calendar integration status
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 INTEGRATION STATUS:');
  console.log('═══════════════════════════════════════════════════\n');
  
  const integrationStatus = {
    bookingExists: bookingSnap.exists(),
    bookingStatus: booking.status,
    calendarEventsFound: calendarSnap.size > 0,
    totalCalendarEvents: allCalendarSnap.size,
    calendarEventsForBooking: calendarSnap.size,
  };
  
  console.log('   📋 Booking:');
  console.log(`      Exists: ${integrationStatus.bookingExists ? '✅' : '❌'}`);
  console.log(`      Status: ${integrationStatus.bookingStatus}`);
  console.log(`      Ready for Calendar: ${['approved', 'confirmed'].includes(integrationStatus.bookingStatus) ? '✅' : '❌'}\n`);
  
  console.log('   📅 Calendar:');
  console.log(`      Total Events: ${integrationStatus.totalCalendarEvents}`);
  console.log(`      Events for Test Booking: ${integrationStatus.calendarEventsForBooking}`);
  console.log(`      Integration Working: ${integrationStatus.calendarEventsFound ? '✅' : '⚠️'}\n`);
  
  // Step 5: Recommendations
  console.log('═══════════════════════════════════════════════════');
  console.log('💡 NEXT STEPS:');
  console.log('═══════════════════════════════════════════════════\n');
  
  if (booking.status === 'confirmed' && calendarSnap.size === 0) {
    console.log('⚠️  Booking is confirmed but no calendar events found!\n');
    console.log('Solution Options:\n');
    console.log('1. APPROVE THE BOOKING (Recommended):');
    console.log('   • Go to: http://localhost:3000/admin/bookings');
    console.log('   • Find booking: ' + booking.guestName);
    console.log('   • Click "Approve" button');
    console.log('   • Calendar events will be created automatically\n');
    
    console.log('2. OR manually trigger calendar event creation:');
    console.log('   • The API endpoint handles this automatically');
    console.log('   • See: /api/bookings/approve (line 308-318)\n');
  } else if (booking.status === 'approved' && calendarSnap.size === 0) {
    console.log('⚠️  Booking is approved but calendar events missing!\n');
    console.log('This might indicate:');
    console.log('   • Calendar event creation was disabled');
    console.log('   • An error occurred during creation');
    console.log('   • Check server logs for errors\n');
  } else if (calendarSnap.size > 0) {
    console.log('✅ Integration is working correctly!\n');
    console.log('Verification:\n');
    console.log('1. View in webapp:');
    console.log('   • Bookings: http://localhost:3000/admin/bookings');
    console.log('   • Calendar: http://localhost:3000/calendar');
    console.log('   • Should see booking displayed on calendar\n');
    
    console.log('2. Calendar shows:');
    console.log('   • Approved/confirmed bookings from "bookings" collection');
    console.log('   • Events from "calendar_events" collection');
    console.log('   • Both are displayed together\n');
  } else {
    console.log('📋 Booking needs to be approved first\n');
    console.log('Steps:');
    console.log('1. Open: http://localhost:3000/admin/bookings');
    console.log('2. Find booking: ' + booking.guestName);
    console.log('3. Click "Approve" button');
    console.log('4. System will automatically:');
    console.log('   ✅ Create calendar events');
    console.log('   ✅ Create cleaning jobs');
    console.log('   ✅ Sync to mobile app');
    console.log('   ✅ Display on calendar page\n');
  }
  
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📋 Test Booking ID: ${BOOKING_ID}`);
  console.log(`📊 Booking Status: ${booking.status}`);
  console.log(`📅 Calendar Events: ${calendarSnap.size}`);
  console.log(`🎯 Integration: ${calendarSnap.size > 0 || ['approved', 'confirmed'].includes(booking.status) ? 'READY' : 'PENDING APPROVAL'}\n`);
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ ERROR:', error);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
