import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function checkAllBookingCollections() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n📋 CHECKING ALL BOOKING COLLECTIONS...\n');
  
  // Check 'bookings' collection
  console.log('1️⃣ BOOKINGS COLLECTION:');
  const bookingsSnapshot = await db.collection('bookings').get();
  console.log(`   Total: ${bookingsSnapshot.size} documents`);
  bookingsSnapshot.forEach((doc, i) => {
    const data = doc.data();
    console.log(`   ${i + 1}. ${doc.id}`);
    console.log(`      Guest: ${data.guestName}`);
    console.log(`      Property: ${data.propertyName}`);
    console.log(`      Status: ${data.status}`);
  });
  
  // Check 'live_bookings' collection
  console.log('\n2️⃣ LIVE_BOOKINGS COLLECTION (Admin page uses this):');
  const liveBookingsSnapshot = await db.collection('live_bookings').get();
  console.log(`   Total: ${liveBookingsSnapshot.size} documents`);
  if (liveBookingsSnapshot.empty) {
    console.log('   ❌ EMPTY - This is why admin page shows no bookings!');
  } else {
    liveBookingsSnapshot.forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i + 1}. ${doc.id}`);
      console.log(`      Guest: ${data.guestName}`);
      console.log(`      Property: ${data.villaName}`);
      console.log(`      Status: ${data.status}`);
    });
  }
  
  // Check 'pending_bookings' collection
  console.log('\n3️⃣ PENDING_BOOKINGS COLLECTION:');
  const pendingBookingsSnapshot = await db.collection('pending_bookings').get();
  console.log(`   Total: ${pendingBookingsSnapshot.size} documents`);
  
  // Check 'confirmed_bookings' collection
  console.log('\n4️⃣ CONFIRMED_BOOKINGS COLLECTION:');
  const confirmedBookingsSnapshot = await db.collection('confirmed_bookings').get();
  console.log(`   Total: ${confirmedBookingsSnapshot.size} documents`);
  
  console.log('\n\n💡 DIAGNOSIS:');
  console.log(`   'bookings' collection: ${bookingsSnapshot.size} docs`);
  console.log(`   'live_bookings' collection: ${liveBookingsSnapshot.size} docs ← Admin page reads from here`);
  console.log(`   'pending_bookings' collection: ${pendingBookingsSnapshot.size} docs`);
  console.log(`   'confirmed_bookings' collection: ${confirmedBookingsSnapshot.size} docs`);
  
  if (bookingsSnapshot.size > 0 && liveBookingsSnapshot.size === 0) {
    console.log('\n🔧 SOLUTION:');
    console.log('   Option 1: Copy bookings from "bookings" to "live_bookings"');
    console.log('   Option 2: Update admin page to read from "bookings" collection');
    console.log('   Option 3: Update job creation to write to both collections');
  }
}

checkAllBookingCollections();
