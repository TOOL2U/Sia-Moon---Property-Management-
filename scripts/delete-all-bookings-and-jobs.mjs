import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

console.log('🗑️  Starting cleanup of ALL bookings and jobs...\n');

// Delete all bookings
console.log('📋 Deleting all bookings...');
const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
let bookingsDeleted = 0;
for (const docSnap of bookingsSnapshot.docs) {
  await deleteDoc(doc(db, 'bookings', docSnap.id));
  bookingsDeleted++;
  console.log(`  ✅ Deleted booking: ${docSnap.id}`);
}
console.log(`\n🎯 Total bookings deleted: ${bookingsDeleted}\n`);

// Delete all pending_bookings
console.log('⏳ Deleting all pending_bookings...');
const pendingSnapshot = await getDocs(collection(db, 'pending_bookings'));
let pendingDeleted = 0;
for (const docSnap of pendingSnapshot.docs) {
  await deleteDoc(doc(db, 'pending_bookings', docSnap.id));
  pendingDeleted++;
  console.log(`  ✅ Deleted pending booking: ${docSnap.id}`);
}
console.log(`\n🎯 Total pending bookings deleted: ${pendingDeleted}\n`);

// Delete all live_bookings
console.log('📡 Deleting all live_bookings...');
const liveSnapshot = await getDocs(collection(db, 'live_bookings'));
let liveDeleted = 0;
for (const docSnap of liveSnapshot.docs) {
  await deleteDoc(doc(db, 'live_bookings', docSnap.id));
  liveDeleted++;
  console.log(`  ✅ Deleted live booking: ${docSnap.id}`);
}
console.log(`\n🎯 Total live bookings deleted: ${liveDeleted}\n`);

// Delete all bookings_approved
console.log('✅ Deleting all bookings_approved...');
const approvedSnapshot = await getDocs(collection(db, 'bookings_approved'));
let approvedDeleted = 0;
for (const docSnap of approvedSnapshot.docs) {
  await deleteDoc(doc(db, 'bookings_approved', docSnap.id));
  approvedDeleted++;
  console.log(`  ✅ Deleted approved booking: ${docSnap.id}`);
}
console.log(`\n🎯 Total approved bookings deleted: ${approvedDeleted}\n`);

// Delete all jobs
console.log('🔧 Deleting all jobs...');
const jobsSnapshot = await getDocs(collection(db, 'jobs'));
let jobsDeleted = 0;
for (const docSnap of jobsSnapshot.docs) {
  await deleteDoc(doc(db, 'jobs', docSnap.id));
  jobsDeleted++;
  console.log(`  ✅ Deleted job: ${docSnap.id}`);
}
console.log(`\n🎯 Total jobs deleted: ${jobsDeleted}\n`);

// Delete all calendar_events
console.log('📅 Deleting all calendar_events...');
const eventsSnapshot = await getDocs(collection(db, 'calendar_events'));
let eventsDeleted = 0;
for (const docSnap of eventsSnapshot.docs) {
  await deleteDoc(doc(db, 'calendar_events', docSnap.id));
  eventsDeleted++;
  console.log(`  ✅ Deleted calendar event: ${docSnap.id}`);
}
console.log(`\n🎯 Total calendar events deleted: ${eventsDeleted}\n`);

console.log('═══════════════════════════════════════════════════');
console.log('🎉 CLEANUP COMPLETE!');
console.log('═══════════════════════════════════════════════════');
console.log(`📊 Summary:`);
console.log(`   Bookings: ${bookingsDeleted}`);
console.log(`   Pending Bookings: ${pendingDeleted}`);
console.log(`   Live Bookings: ${liveDeleted}`);
console.log(`   Approved Bookings: ${approvedDeleted}`);
console.log(`   Jobs: ${jobsDeleted}`);
console.log(`   Calendar Events: ${eventsDeleted}`);
console.log(`   ────────────────────────────────`);
console.log(`   TOTAL DELETED: ${bookingsDeleted + pendingDeleted + liveDeleted + approvedDeleted + jobsDeleted + eventsDeleted}`);
console.log('═══════════════════════════════════════════════════');
console.log('\n✨ Your database is now clean! Ready for fresh test data.');

process.exit(0);
