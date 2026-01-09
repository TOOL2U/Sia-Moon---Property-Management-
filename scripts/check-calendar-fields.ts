import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function checkCalendarEventFields() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore();
  const snapshot = await db.collection('calendar_events').limit(1).get();
  
  if (snapshot.empty) {
    console.log('No calendar events found');
    return;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  
  console.log('\nCalendar Event Field Names:');
  console.log(Object.keys(data).join(', '));
  
  console.log('\nSample Event:');
  console.log(JSON.stringify(data, null, 2));
}

checkCalendarEventFields();
