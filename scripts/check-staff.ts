import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function checkStaff() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n🔍 CHECKING STAFF ACCOUNTS...\n');
  
  // Get all staff
  const allStaff = await db.collection('staff_accounts').get();
  console.log(`📊 Total staff accounts: ${allStaff.size}`);
  
  if (allStaff.size === 0) {
    console.log('❌ No staff accounts found!');
    return;
  }
  
  console.log('\n👥 STAFF MEMBERS:\n');
  
  allStaff.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. Staff ID: ${doc.id}`);
    console.log(`   Name: ${data.name || 'N/A'}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   Role: ${data.role || data.roles || 'N/A'}`);
    console.log(`   Active: ${data.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   Has Expo Push Token: ${data.expoPushToken ? '✅ Yes' : '❌ No'}`);
    console.log(`   User ID: ${data.userId || 'N/A'}`);
    console.log('');
  });
  
  // Check for cleaners specifically
  const cleaners = allStaff.docs.filter(doc => {
    const data = doc.data();
    const role = data.role || '';
    const roles = data.roles || [];
    return role === 'cleaner' || 
           role.toLowerCase().includes('clean') ||
           roles.includes('cleaner') ||
           JSON.stringify(roles).toLowerCase().includes('clean');
  });
  
  console.log(`\n🧹 Cleaners found: ${cleaners.length}`);
  
  if (cleaners.length > 0) {
    console.log('\nACTIVE CLEANERS:');
    cleaners.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.name} (${data.email}) - Active: ${data.isActive ? '✅' : '❌'}`);
    });
  }
  
  // Show the job that was created
  console.log('\n\n📋 CHECKING CREATED JOB...\n');
  const jobId = 'RydDY5qscBUptuRcCC1g';
  const jobDoc = await db.collection('jobs').doc(jobId).get();
  
  if (jobDoc.exists) {
    const jobData = jobDoc.data();
    console.log('✅ Job found!');
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Title: ${jobData?.title}`);
    console.log(`   Status: ${jobData?.status}`);
    console.log(`   Assigned To: ${jobData?.assignedTo || 'NOT ASSIGNED'}`);
    console.log(`   Property: ${jobData?.propertyRef?.name}`);
    console.log(`   Has Photos: ${(jobData?.propertyPhotos || []).length > 0 ? '✅' : '❌'}`);
    console.log(`   Has Access Info: ${jobData?.accessInstructions ? '✅' : '❌'}`);
    console.log(`   Has Maps Link: ${jobData?.location?.googleMapsLink ? '✅' : '❌'}`);
    console.log(`   Guest Count: ${jobData?.guestCount || 'N/A'}`);
  } else {
    console.log('❌ Job not found!');
  }
}

checkStaff();
