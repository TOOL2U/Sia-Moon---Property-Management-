import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

console.log('🎯 Creating February 2026 test booking...\n');

// February 10-14, 2026 (Valentine's Week!)
const checkInDate = new Date('2026-02-10T15:00:00');
const checkOutDate = new Date('2026-02-14T11:00:00');

const booking = {
  guestName: 'February Test Guest',
  propertyName: 'Beach House Villa',
  checkInDate: Timestamp.fromDate(checkInDate),
  checkOutDate: Timestamp.fromDate(checkOutDate),
  status: 'confirmed',
  source: 'test',
  createdAt: Timestamp.now(),
  totalPrice: 1200,
  numberOfGuests: 2,
  notes: 'Valentine Week Test Booking - Should be visible in February 2026 calendar'
};

console.log('📋 Booking details:');
console.log(`  Guest: ${booking.guestName}`);
console.log(`  Property: ${booking.propertyName}`);
console.log(`  Check-in: ${checkInDate.toLocaleDateString()}`);
console.log(`  Check-out: ${checkOutDate.toLocaleDateString()}`);
console.log(`  Status: ${booking.status}`);

const bookingsRef = collection(db, 'bookings');
const docRef = await addDoc(bookingsRef, booking);

console.log('\n✅ Booking created with ID:', docRef.id);
console.log('🎉 Go to the calendar and navigate to FEBRUARY 2026 to see it!');

process.exit(0);
