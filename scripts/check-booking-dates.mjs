import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

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

console.log('🔍 Checking booking date formats...\n');

const bookingsRef = collection(db, 'bookings');
const q = query(bookingsRef, limit(3));
const snapshot = await getDocs(q);

snapshot.forEach((doc) => {
  const data = doc.data();
  console.log(`📋 Booking ${doc.id}:`);
  console.log(`  Guest: ${data.guestName || 'Unknown'}`);
  console.log(`  Status: ${data.status}`);
  console.log(`  checkIn: ${data.checkIn} (type: ${typeof data.checkIn})`);
  console.log(`  checkInDate: ${data.checkInDate} (type: ${typeof data.checkInDate})`);
  console.log(`  checkOut: ${data.checkOut} (type: ${typeof data.checkOut})`);
  console.log(`  checkOutDate: ${data.checkOutDate} (type: ${typeof data.checkOutDate})`);
  
  if (data.checkIn?.toDate) {
    console.log(`  checkIn as Date: ${data.checkIn.toDate()}`);
  }
  if (data.checkOut?.toDate) {
    console.log(`  checkOut as Date: ${data.checkOut.toDate()}`);
  }
  console.log('');
});

process.exit(0);
