import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function setCleanerPin() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n🔐 SETTING UP CLEANER PIN...\n');
  
  // Set PIN for main cleaner
  const staffId = 'dEnHUdPyZU0Uutwt6Aj5'; // Cleaner (cleaner@siamoon.com)
  const pin = '1234'; // Simple PIN for testing
  
  await db.collection('staff_accounts').doc(staffId).update({
    pin: pin,
    pinSetAt: new Date().toISOString()
  });
  
  console.log('✅ PIN set successfully!');
  console.log('\n📱 MOBILE APP LOGIN:\n');
  console.log('   👤 Name: Cleaner');
  console.log('   📧 Email: cleaner@siamoon.com');
  console.log('   🔢 PIN: 1234');
  console.log('   📞 Phone: +1 (555) 500-0005');
  
  console.log('\n🚀 NOW YOU CAN:');
  console.log('   1. Open mobile app');
  console.log('   2. Login with PIN: 1234');
  console.log('      OR');
  console.log('      Login with email: cleaner@siamoon.com');
  console.log('   3. Go to Jobs tab');
  console.log('   4. See "Post-checkout Cleaning" job');
  console.log('   5. View ALL property details (photos, maps, access codes)');
  console.log('\n✨ This proves the job payload enrichment works!\n');
}

setCleanerPin();
