import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function checkBackofficeData() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n🔍 CHECKING BACKOFFICE DATA VISIBILITY...\n');
  
  // Check bookings
  console.log('📋 BOOKINGS:');
  const bookingsSnapshot = await db.collection('bookings')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  console.log(`   Total bookings: ${bookingsSnapshot.size}`);
  
  if (bookingsSnapshot.empty) {
    console.log('   ❌ No bookings found!');
  } else {
    bookingsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   ${index + 1}. Booking ID: ${doc.id}`);
      console.log(`      Property: ${data.propertyName}`);
      console.log(`      Guest: ${data.guestName}`);
      console.log(`      Status: ${data.status}`);
      console.log(`      Check-in: ${data.checkInDate?.toDate?.() || data.checkInDate}`);
      console.log(`      Jobs Created: ${data.jobsCreated ? '✅ Yes' : '❌ No'}`);
      if (data.createdJobIds) {
        console.log(`      Job IDs: ${data.createdJobIds.join(', ')}`);
      }
    });
  }
  
  // Check jobs
  console.log('\n\n📋 JOBS:');
  const jobsSnapshot = await db.collection('jobs')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  console.log(`   Total jobs: ${jobsSnapshot.size}`);
  
  if (jobsSnapshot.empty) {
    console.log('   ❌ No jobs found!');
  } else {
    jobsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   ${index + 1}. Job ID: ${doc.id}`);
      console.log(`      Title: ${data.title}`);
      console.log(`      Property: ${data.propertyRef?.name}`);
      console.log(`      Status: ${data.status}`);
      console.log(`      Assigned To: ${data.assignedTo || 'Not assigned'}`);
      console.log(`      Booking ID: ${data.bookingId || 'N/A'}`);
      console.log(`      Has Photos: ${(data.propertyPhotos?.length || 0) > 0 ? '✅' : '❌'}`);
      console.log(`      Has Access: ${data.accessInstructions ? '✅' : '❌'}`);
      console.log(`      Has Maps: ${data.location?.googleMapsLink ? '✅' : '❌'}`);
    });
  }
  
  // Check calendar events
  console.log('\n\n📅 CALENDAR EVENTS:');
  const calendarSnapshot = await db.collection('calendar_events')
    .orderBy('start', 'desc')
    .limit(10)
    .get();
  
  console.log(`   Total calendar events: ${calendarSnapshot.size}`);
  
  if (calendarSnapshot.empty) {
    console.log('   ❌ No calendar events found!');
    console.log('   ⚠️  This is why calendar is empty in backoffice!');
  } else {
    calendarSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   ${index + 1}. Event ID: ${doc.id}`);
      console.log(`      Title: ${data.title}`);
      console.log(`      Type: ${data.type}`);
      console.log(`      Property: ${data.propertyId}`);
      console.log(`      Start: ${data.start?.toDate?.() || data.start}`);
      console.log(`      End: ${data.end?.toDate?.() || data.end}`);
    });
  }
  
  console.log('\n\n💡 DIAGNOSIS:\n');
  
  if (bookingsSnapshot.size > 0) {
    console.log('✅ Bookings exist in database');
  } else {
    console.log('❌ NO BOOKINGS - Need to create calendar events from bookings');
  }
  
  if (jobsSnapshot.size > 0) {
    console.log('✅ Jobs exist in database');
  } else {
    console.log('❌ NO JOBS');
  }
  
  if (calendarSnapshot.size === 0) {
    console.log('❌ NO CALENDAR EVENTS - This is the problem!');
    console.log('\n🔧 SOLUTION NEEDED:');
    console.log('   1. Create calendar events from bookings');
    console.log('   2. Link jobs to calendar events');
    console.log('   3. Update KPI dashboard to show job stats');
  }
}

checkBackofficeData();
