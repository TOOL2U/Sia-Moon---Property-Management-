import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function getCleanerDetails() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n🔍 GETTING CLEANER PROFILE DETAILS...\n');
  
  const staffId = 'dEnHUdPyZU0Uutwt6Aj5'; // Cleaner (cleaner@siamoon.com)
  
  const staffDoc = await db.collection('staff_accounts').doc(staffId).get();
  
  if (!staffDoc.exists) {
    console.log('❌ Staff not found!');
    return;
  }
  
  const data = staffDoc.data();
  
  console.log('👤 CLEANER PROFILE:\n');
  console.log(`   Name: ${data?.name || 'N/A'}`);
  console.log(`   Email: ${data?.email || 'N/A'}`);
  console.log(`   Role: ${data?.role || 'N/A'}`);
  console.log(`   PIN: ${data?.pin || 'NOT SET'}`);
  console.log(`   Password: ${data?.password || 'NOT SET (stored in Auth)'}`);
  console.log(`   User ID: ${data?.userId || 'N/A'}`);
  console.log(`   Active: ${data?.isActive ? '✅ Yes' : '❌ No'}`);
  console.log(`   Phone: ${data?.phone || 'N/A'}`);
  
  console.log('\n📱 MOBILE APP LOGIN OPTIONS:\n');
  
  if (data?.pin) {
    console.log(`   1. Login with PIN: ${data.pin}`);
  } else {
    console.log('   1. PIN not set - need to use email/password');
  }
  
  console.log(`   2. Login with Email: ${data?.email}`);
  console.log('      Password: (stored in Firebase Auth - check your records)');
  
  // Check other cleaners too
  console.log('\n\n🧹 ALL CLEANER ACCOUNTS:\n');
  
  const cleanersQuery = await db.collection('staff_accounts')
    .where('role', '==', 'cleaner')
    .get();
  
  cleanersQuery.forEach((doc) => {
    const d = doc.data();
    console.log(`📋 ${d.name} (${d.email})`);
    console.log(`   Staff ID: ${doc.id}`);
    console.log(`   PIN: ${d.pin || 'NOT SET'}`);
    console.log(`   User ID: ${d.userId || 'NOT SET'}`);
    console.log(`   Active: ${d.isActive ? '✅' : '❌'}`);
    console.log('');
  });
}

getCleanerDetails();
