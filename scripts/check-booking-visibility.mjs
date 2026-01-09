import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

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
console.log('🔍 CHECKING BOOKING VISIBILITY IN ALL COLLECTIONS');
console.log('═══════════════════════════════════════════════════\n');

try {
  const collections = ['bookings', 'pending_bookings', 'live_bookings', 'bookings_approved'];
  
  for (const collectionName of collections) {
    console.log(`\n📂 Checking ${collectionName}...\n`);
    
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      console.log(`   Total: ${snapshot.size} document(s)`);
      
      if (snapshot.size > 0) {
        console.log('\n   📋 Documents:\n');
        
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ${data.guestName || data.guest_name || 'Unknown Guest'}`);
          console.log(`      ID: ${doc.id}`);
          console.log(`      Status: ${data.status || 'unknown'}`);
          console.log(`      Property: ${data.propertyName || data.property || 'Unknown'}`);
          console.log(`      Check-in: ${data.checkInDate || data.checkIn || data.check_in || 'unknown'}`);
          console.log(`      Check-out: ${data.checkOutDate || data.checkOut || data.check_out || 'unknown'}`);
          console.log(`      Created: ${data.createdAt?.toDate?.()?.toISOString() || data.createdAt || 'unknown'}`);
          console.log(`      Source: ${data.source || 'unknown'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ No bookings found\n');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  // Check calendar visibility
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📅 CALENDAR EVENTS');
  console.log('═══════════════════════════════════════════════════\n');
  
  const calendarSnapshot = await getDocs(collection(db, 'calendar_events'));
  console.log(`Total calendar events: ${calendarSnapshot.size}\n`);
  
  if (calendarSnapshot.size > 0) {
    console.log('   📅 Events:\n');
    calendarSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. ${data.title || 'Untitled'}`);
      console.log(`      Type: ${data.type || 'unknown'}`);
      console.log(`      Booking ID: ${data.bookingId || 'N/A'}`);
      console.log(`      Start: ${data.start?.toDate?.()?.toISOString() || data.start || 'unknown'}`);
      console.log('');
    });
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');
  
  const totalBookings = (await getDocs(collection(db, 'bookings'))).size +
                        (await getDocs(collection(db, 'pending_bookings'))).size +
                        (await getDocs(collection(db, 'live_bookings'))).size;
  
  const totalCalendarEvents = calendarSnapshot.size;
  
  console.log(`   Total Bookings: ${totalBookings}`);
  console.log(`   Total Calendar Events: ${totalCalendarEvents}`);
  console.log(`   Collections checked: bookings, pending_bookings, live_bookings, bookings_approved\n`);
  
  if (totalBookings > 0 && totalCalendarEvents === 0) {
    console.log('⚠️  WARNING: Bookings exist but no calendar events found!');
    console.log('   Action: Approve bookings to create calendar events\n');
  } else if (totalBookings === 0 && totalCalendarEvents > 0) {
    console.log('⚠️  WARNING: Calendar events exist but no bookings found!');
    console.log('   This might indicate orphaned calendar events\n');
  } else if (totalBookings > 0 && totalCalendarEvents > 0) {
    console.log('✅ Both bookings and calendar events exist');
    console.log('   Note: Calendar shows approved/confirmed bookings + calendar events\n');
  } else {
    console.log('ℹ️  No bookings or calendar events found\n');
  }
  
  // API endpoint info
  console.log('═══════════════════════════════════════════════════');
  console.log('🔗 API ENDPOINTS');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('Admin Bookings Page uses:');
  console.log('   GET /api/admin/bookings/integrated');
  console.log('   Checks: pending_bookings, bookings, live_bookings\n');
  
  console.log('Calendar Page uses:');
  console.log('   Component: CalendarView.tsx');
  console.log('   Listens to: calendar_events + bookings (approved/confirmed)\n');
  
  console.log('To fix sync issues:');
  console.log('   1. Ensure booking exists in one of the main collections');
  console.log('   2. Approve booking to create calendar events');
  console.log('   3. Both will appear in their respective views\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ ERROR:', error);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
