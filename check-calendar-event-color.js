const admin = require('firebase-admin');
const serviceAccount = require('./sia-moon-property-management-firebase-adminsdk-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkColors() {
  console.log('\n=== CHECKING CALENDAR EVENT COLORS ===\n');
  
  // Check the specific job event
  const calendarEventsSnap = await db.collection('calendar_events')
    .where('title', '==', 'Post-Checkout Deep Cleaning - Mountain Retreat Cabin')
    .get();
  
  if (calendarEventsSnap.empty) {
    console.log('❌ Event not found in calendar_events');
    
    // Check operational_jobs
    const jobsSnap = await db.collection('operational_jobs')
      .where('title', '==', 'Post-Checkout Deep Cleaning - Mountain Retreat Cabin')
      .get();
    
    if (!jobsSnap.empty) {
      jobsSnap.forEach(doc => {
        const data = doc.data();
        console.log('✅ Found in operational_jobs:');
        console.log('   ID:', doc.id);
        console.log('   Status:', data.status);
        console.log('   Title:', data.title);
      });
    }
  } else {
    calendarEventsSnap.forEach(doc => {
      const data = doc.data();
      console.log('✅ Found in calendar_events:');
      console.log('   ID:', doc.id);
      console.log('   Status:', data.status);
      console.log('   Color:', data.color);
      console.log('   Title:', data.title);
      console.log('   Type:', data.type);
    });
  }
  
  process.exit(0);
}

checkColors().catch(console.error);
