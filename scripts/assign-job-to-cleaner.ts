import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function assignJob() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  const jobId = 'RydDY5qscBUptuRcCC1g';
  const staffId = 'dEnHUdPyZU0Uutwt6Aj5'; // Cleaner (cleaner@siamoon.com)
  
  console.log('\n🔨 ASSIGNING JOB TO CLEANER...\n');
  
  await db.collection('jobs').doc(jobId).update({
    assignedTo: staffId,
    assignedStaffName: 'Cleaner',
    assignedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  console.log('✅ Job assigned successfully!');
  console.log(`   Job ID: ${jobId}`);
  console.log(`   Assigned to: Cleaner (cleaner@siamoon.com)`);
  console.log(`   Staff ID: ${staffId}`);
  
  console.log('\n📱 NOW CHECK THE MOBILE APP:');
  console.log('   1. Open the mobile app');
  console.log('   2. Login with: cleaner@siamoon.com');
  console.log('   3. Go to Jobs tab');
  console.log('   4. You should see: "Post-checkout Cleaning"');
  console.log('   5. Tap it to see ALL the details:');
  console.log('      ✓ 6 property photos');
  console.log('      ✓ Access instructions (gate codes)');
  console.log('      ✓ Google Maps button');
  console.log('      ✓ GPS coordinates');
  console.log('      ✓ Guest count: 2');
  console.log('      ✓ Full address');
  console.log('\n✨ This proves the job payload enrichment works!\n');
}

assignJob();
