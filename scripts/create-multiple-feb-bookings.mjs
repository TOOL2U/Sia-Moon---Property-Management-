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

console.log('🎯 Creating multiple February 2026 bookings...\n');

const bookings = [
  {
    guestName: 'Sarah Wilson',
    propertyName: 'Mountain Retreat',
    checkInDate: Timestamp.fromDate(new Date('2026-02-01T15:00:00')),
    checkOutDate: Timestamp.fromDate(new Date('2026-02-05T11:00:00')),
    status: 'confirmed',
    source: 'Airbnb',
    numberOfGuests: 4,
    totalPrice: 1600
  },
  {
    guestName: 'Michael Chen',
    propertyName: 'City Center Apartment',
    checkInDate: Timestamp.fromDate(new Date('2026-02-15T15:00:00')),
    checkOutDate: Timestamp.fromDate(new Date('2026-02-20T11:00:00')),
    status: 'confirmed',
    source: 'Booking.com',
    numberOfGuests: 2,
    totalPrice: 1500
  },
  {
    guestName: 'Emma Rodriguez',
    propertyName: 'Lakeside Cottage',
    checkInDate: Timestamp.fromDate(new Date('2026-02-22T15:00:00')),
    checkOutDate: Timestamp.fromDate(new Date('2026-02-28T11:00:00')),
    status: 'confirmed',
    source: 'Direct',
    numberOfGuests: 3,
    totalPrice: 1800
  }
];

for (const booking of bookings) {
  const bookingData = {
    ...booking,
    createdAt: Timestamp.now(),
    notes: 'Test booking visible in February 2026 calendar'
  };
  
  const docRef = await addDoc(collection(db, 'bookings'), bookingData);
  
  const checkIn = booking.checkInDate.toDate();
  const checkOut = booking.checkOutDate.toDate();
  
  console.log(`✅ Created: ${booking.guestName} at ${booking.propertyName}`);
  console.log(`   ${checkIn.toLocaleDateString()} → ${checkOut.toLocaleDateString()}`);
  console.log(`   ID: ${docRef.id}\n`);
}

console.log('🎉 All February 2026 bookings created!');
console.log('📅 Navigate to FEBRUARY 2026 in the calendar to see all bookings');

process.exit(0);
