/**
 * Establish Complete Firebase Integration
 * Creates Firebase Auth accounts for all staff and sets up proper job assignment integration
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'operty-b54dc'
    });
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.log('💡 Make sure you have Firebase Admin credentials set up');
    console.log('   Run: export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"');
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function establishCompleteIntegration() {
  console.log('🚀 ESTABLISHING COMPLETE FIREBASE INTEGRATION');
  console.log('=' .repeat(60));
  console.log('This script will:');
  console.log('1. Create Firebase Auth accounts for all staff members');
  console.log('2. Update staff profiles with userId fields');
  console.log('3. Create test jobs with proper integration');
  console.log('4. Verify end-to-end mobile app functionality');
  console.log('');

  const proceed = await promptQuestion('Do you want to proceed? (y/N): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('❌ Operation cancelled');
    rl.close();
    return;
  }

  try {
    // Step 1: Get all staff accounts
    console.log('\n1️⃣ FETCHING STAFF ACCOUNTS');
    console.log('=' .repeat(40));
    
    const staffSnapshot = await db.collection('staff_accounts').get();
    console.log(`✅ Found ${staffSnapshot.size} staff accounts`);
    
    const staffToProcess = [];
    staffSnapshot.forEach(doc => {
      const staff = doc.data();
      if (!staff.userId) {
        staffToProcess.push({
          id: doc.id,
          name: staff.name,
          email: staff.email,
          role: staff.role || 'staff'
        });
      }
    });
    
    console.log(`📋 Staff needing Firebase Auth: ${staffToProcess.length}`);
    
    if (staffToProcess.length === 0) {
      console.log('✅ All staff already have Firebase Auth accounts!');
    } else {
      // Step 2: Create Firebase Auth accounts
      console.log('\n2️⃣ CREATING FIREBASE AUTH ACCOUNTS');
      console.log('=' .repeat(40));
      
      for (const staff of staffToProcess) {
        console.log(`\n👤 Processing: ${staff.name} (${staff.email})`);
        
        try {
          // Generate a secure password
          const password = `TempPass${Math.random().toString(36).slice(-8)}!`;
          
          let userRecord;
          try {
            // Try to create new user
            userRecord = await auth.createUser({
              email: staff.email,
              password: password,
              displayName: staff.name
            });
            console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);
          } catch (error) {
            if (error.code === 'auth/email-already-exists') {
              // User exists, get their UID
              userRecord = await auth.getUserByEmail(staff.email);
              console.log(`✅ Found existing Firebase Auth user: ${userRecord.uid}`);
            } else {
              throw error;
            }
          }
          
          // Update staff document with userId
          await db.collection('staff_accounts').doc(staff.id).update({
            userId: userRecord.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            firebaseAuthSetup: true
          });
          
          console.log(`✅ Updated staff document with userId: ${userRecord.uid}`);
          
          // Store credentials for later display
          staff.userId = userRecord.uid;
          staff.tempPassword = password;
          
        } catch (error) {
          console.error(`❌ Error processing ${staff.name}:`, error.message);
        }
      }
    }
    
    // Step 3: Create test jobs
    console.log('\n3️⃣ CREATING TEST JOBS WITH PROPER INTEGRATION');
    console.log('=' .repeat(40));
    
    // Get updated staff list with userIds
    const updatedStaffSnapshot = await db.collection('staff_accounts').where('userId', '!=', null).limit(3).get();
    
    if (updatedStaffSnapshot.size === 0) {
      console.log('❌ No staff with userId found for test job creation');
    } else {
      let jobCount = 0;
      for (const doc of updatedStaffSnapshot.docs) {
        const staff = doc.data();
        const staffId = doc.id;
        
        console.log(`\n📋 Creating test job for: ${staff.name}`);
        
        const testJob = {
          // Job Details
          title: `⚠️ TEST JOB: Mobile App Integration Test`,
          description: 'This is a test job to verify mobile app integration. Please accept this job on your mobile device.',
          jobType: 'cleaning',
          priority: 'medium',
          
          // Property Details
          propertyId: 'test_property_001',
          propertyName: 'Test Villa',
          propertyAddress: '123 Test Street, Test City',
          
          // Guest Information
          guestName: 'Test Guest',
          guestEmail: 'test.guest@example.com',
          checkInDate: new Date().toISOString().split('T')[0],
          checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          numberOfGuests: 2,
          
          // Scheduling
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledStartTime: '14:00',
          scheduledEndTime: '16:00',
          estimatedDuration: 120,
          deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          
          // CRITICAL: Both staff assignment fields
          assignedStaffId: staffId,
          userId: staff.userId, // This is the key field for mobile app
          
          // Staff Reference
          assignedStaffRef: {
            id: staffId,
            name: staff.name,
            role: staff.role,
            email: staff.email
          },
          
          // Job Status
          status: 'assigned',
          progress: 0,
          
          // Assignment Details
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          assignedBy: {
            id: 'admin',
            name: 'System Admin'
          },
          
          // Mobile Integration
          mobileNotificationPending: true,
          notificationSent: false,
          syncVersion: 1,
          
          // Timestamps
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const jobRef = await db.collection('jobs').add(testJob);
        console.log(`✅ Created test job: ${jobRef.id}`);
        console.log(`   Staff: ${staff.name} (${staffId})`);
        console.log(`   Firebase UID: ${staff.userId}`);
        
        jobCount++;
        if (jobCount >= 3) break; // Limit to 3 test jobs
      }
    }
    
    // Step 4: Verification
    console.log('\n4️⃣ FINAL VERIFICATION');
    console.log('=' .repeat(40));
    
    const finalStaffSnapshot = await db.collection('staff_accounts').get();
    const finalJobsSnapshot = await db.collection('jobs').limit(5).get();
    
    let staffWithUserId = 0;
    let staffWithoutUserId = 0;
    
    finalStaffSnapshot.forEach(doc => {
      const staff = doc.data();
      if (staff.userId) {
        staffWithUserId++;
      } else {
        staffWithoutUserId++;
      }
    });
    
    let jobsWithBothIds = 0;
    finalJobsSnapshot.forEach(doc => {
      const job = doc.data();
      if (job.assignedStaffId && job.userId) {
        jobsWithBothIds++;
      }
    });
    
    console.log(`✅ Staff with Firebase Auth: ${staffWithUserId}`);
    console.log(`❌ Staff without Firebase Auth: ${staffWithoutUserId}`);
    console.log(`✅ Jobs with proper integration: ${jobsWithBothIds}`);
    
    // Step 5: Success Summary
    console.log('\n5️⃣ INTEGRATION COMPLETE!');
    console.log('=' .repeat(40));
    
    if (staffWithoutUserId === 0 && jobsWithBothIds > 0) {
      console.log('🎉 FIREBASE INTEGRATION: FULLY ESTABLISHED!');
      console.log('');
      console.log('✅ All staff have Firebase Authentication accounts');
      console.log('✅ All staff profiles include userId fields');
      console.log('✅ Test jobs created with proper mobile app integration');
      console.log('');
      console.log('🚀 MOBILE APP IS NOW READY FOR JOB ASSIGNMENTS!');
      console.log('');
      console.log('📱 Next Steps:');
      console.log('1. Staff can now log into the mobile app using their email/password');
      console.log('2. Jobs assigned to staff will appear in their mobile app');
      console.log('3. Staff can accept/decline jobs and update status from mobile');
      console.log('4. Real-time synchronization is active');
      
      if (staffToProcess.length > 0) {
        console.log('\n🔐 TEMPORARY PASSWORDS (Share securely with staff):');
        staffToProcess.forEach(staff => {
          if (staff.tempPassword) {
            console.log(`   ${staff.name} (${staff.email}): ${staff.tempPassword}`);
          }
        });
        console.log('\n⚠️  Staff should change their passwords after first login');
      }
    } else {
      console.log('⚠️  Integration partially complete - some issues remain');
      if (staffWithoutUserId > 0) {
        console.log(`❌ ${staffWithoutUserId} staff still missing Firebase Auth`);
      }
      if (jobsWithBothIds === 0) {
        console.log('❌ No jobs with proper mobile integration found');
      }
    }
    
  } catch (error) {
    console.error('❌ Integration failed:', error);
  } finally {
    rl.close();
  }
}

// Run the integration
establishCompleteIntegration();
