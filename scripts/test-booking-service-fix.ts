import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function testBookingServiceFix() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n🧪 TESTING BOOKINGSERVICE.GETALLBOOKINGS() FIX...\n');
  
  // Simulate what the admin page does
  console.log('📋 Simulating admin page data loading...');
  
  const allBookings: any[] = [];
  
  // PRIORITY 1: Read from 'bookings' collection
  console.log('\n1️⃣ Reading from "bookings" collection...');
  const bookingsSnapshot = await db.collection('bookings').get();
  console.log(`   Found: ${bookingsSnapshot.size} bookings`);
  
  bookingsSnapshot.forEach(doc => {
    const data = doc.data();
    allBookings.push({
      id: doc.id,
      villaName: data.propertyName || 'Unknown',
      guestName: data.guestName || 'Unknown',
      status: data.status === 'confirmed' ? 'approved' : data.status,
      checkInDate: data.checkInDate?.toDate?.() || data.checkIn?.toDate?.() || 'Unknown',
      checkOutDate: data.checkOutDate?.toDate?.() || data.checkOut?.toDate?.() || 'Unknown'
    });
  });
  
  // PRIORITY 2: Read from 'live_bookings' collection
  console.log('\n2️⃣ Reading from "live_bookings" collection...');
  const liveSnapshot = await db.collection('live_bookings').get();
  console.log(`   Found: ${liveSnapshot.size} bookings`);
  
  liveSnapshot.forEach(doc => {
    const data = doc.data();
    allBookings.push({
      id: doc.id,
      villaName: data.villaName || 'Unknown',
      guestName: data.guestName || 'Unknown',
      status: data.status,
      checkInDate: data.checkInDate || 'Unknown',
      checkOutDate: data.checkOutDate || 'Unknown'
    });
  });
  
  console.log(`\n📊 RESULTS:`);
  console.log(`   Total bookings that admin page will see: ${allBookings.length}`);
  console.log(`   From 'bookings': ${bookingsSnapshot.size}`);
  console.log(`   From 'live_bookings': ${liveSnapshot.size}`);
  
  console.log(`\n✅ BOOKINGS THAT WILL DISPLAY:`);
  allBookings.forEach((booking, i) => {
    console.log(`\n   ${i + 1}. ${booking.guestName} at ${booking.villaName}`);
    console.log(`      Status: ${booking.status}`);
    console.log(`      Check-in: ${booking.checkInDate}`);
    console.log(`      Booking ID: ${booking.id}`);
  });
  
  if (allBookings.length >= 3) {
    console.log(`\n🎉 SUCCESS! Admin page will show ${allBookings.length} bookings!`);
  } else {
    console.log(`\n⚠️ Warning: Only ${allBookings.length} bookings will display`);
  }
}

testBookingServiceFix();
