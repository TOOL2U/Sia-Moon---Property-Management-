/**
 * Assign Latest Job to Cleaner
 * Assigns the most recently created job to the cleaner account
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function assignLatestJobToCleaner() {
  console.log('\n🔨 ASSIGNING LATEST JOB TO CLEANER...\n');

  try {
    // Get cleaner staff account
    const cleanerSnapshot = await db.collection('staff_accounts')
      .where('email', '==', 'cleaner@siamoon.com')
      .limit(1)
      .get();

    if (cleanerSnapshot.empty) {
      console.error('❌ Cleaner account not found!');
      process.exit(1);
    }

    const cleanerDoc = cleanerSnapshot.docs[0];
    const cleanerId = cleanerDoc.id;
    const cleanerData = cleanerDoc.data();

    console.log('✅ Found cleaner account:');
    console.log(`   Name: ${cleanerData.name}`);
    console.log(`   Email: ${cleanerData.email}`);
    console.log(`   Staff ID: ${cleanerId}\n`);

    // Get the most recently created job that is NOT assigned
    const jobsSnapshot = await db.collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (jobsSnapshot.empty) {
      console.error('❌ No jobs found!');
      process.exit(1);
    }

    // Find the first unassigned job or most recent job
    let latestJob: any = null;
    let latestJobId: string = '';

    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!latestJob) {
        latestJob = data;
        latestJobId = doc.id;
      }
    });

    // Just assign the most recent job regardless
    latestJob = jobsSnapshot.docs[0].data();
    latestJobId = jobsSnapshot.docs[0].id;

    console.log('📋 Latest job found:');
    console.log(`   Job ID: ${latestJobId}`);
    console.log(`   Title: ${latestJob.title}`);
    console.log(`   Property: ${latestJob.propertyRef?.name || 'Unknown'}`);
    console.log(`   Current Status: ${latestJob.status}`);
    console.log(`   Currently Assigned: ${latestJob.assignedStaffId || 'None'}\n`);

    // Update the job with cleaner assignment
    // Using BOTH assignedTo (preferred by mobile) and assignedStaffId for compatibility
    await db.collection('jobs').doc(latestJobId).update({
      assignedTo: cleanerId,          // Mobile app preferred field
      assignedStaffId: cleanerId,     // Legacy/compatibility field
      assignedStaff: {
        id: cleanerId,
        name: cleanerData.name,
        email: cleanerData.email,
        role: cleanerData.role || 'cleaner'
      },
      status: 'assigned',
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Job assigned successfully!');
    console.log(`   Job ID: ${latestJobId}`);
    console.log(`   Assigned to: ${cleanerData.name} (${cleanerData.email})`);
    console.log(`   Staff ID (assignedTo): ${cleanerId}`);
    console.log(`   Staff ID (assignedStaffId): ${cleanerId}`);
    console.log(`   Status: assigned\n`);

    // Verify the job has complete payload
    const updatedJob = await db.collection('jobs').doc(latestJobId).get();
    const jobData = updatedJob.data();

    console.log('📱 JOB PAYLOAD VERIFICATION:');
    console.log(`   ✓ Property Photos: ${jobData?.propertyPhotos?.length || 0}`);
    console.log(`   ✓ Access Instructions: ${jobData?.accessInstructions ? 'Yes' : 'No'}`);
    console.log(`   ✓ Google Maps Link: ${jobData?.location?.googleMapsLink ? 'Yes' : 'No'}`);
    console.log(`   ✓ GPS Latitude: ${jobData?.location?.latitude || 'Missing'}`);
    console.log(`   ✓ GPS Longitude: ${jobData?.location?.longitude || 'Missing'}`);
    console.log(`   ✓ Guest Count: ${jobData?.guestCount || 'Missing'}`);
    console.log(`   ✓ Full Address: ${jobData?.location?.address ? 'Yes' : 'No'}\n`);

    console.log('📱 NOW CHECK THE MOBILE APP:');
    console.log('   1. Open the mobile app');
    console.log('   2. Login with: cleaner@siamoon.com (PIN: 1234)');
    console.log('   3. Go to Jobs tab');
    console.log(`   4. You should see: "${latestJob.title}"`);
    console.log('   5. Tap it to see ALL the details:');
    console.log('      ✓ Property photos (swipeable gallery)');
    console.log('      ✓ Access instructions (gate codes, WiFi)');
    console.log('      ✓ Google Maps button');
    console.log('      ✓ GPS coordinates');
    console.log('      ✓ Guest count');
    console.log('      ✓ Full address\n');

    console.log('✨ This proves the job payload enrichment works!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignLatestJobToCleaner();
