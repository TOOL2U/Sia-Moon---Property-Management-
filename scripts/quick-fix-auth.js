/**
 * Quick Fix: Create Firebase Auth for Specific User
 * Creates Firebase Auth account for immediate testing
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
    console.log('💡 This script requires Firebase Admin credentials');
    console.log('   For now, let me provide an alternative solution...');
    
    // Alternative: Show manual steps
    console.log('\n🔧 MANUAL SOLUTION:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Select your project: operty-b54dc');
    console.log('3. Go to Authentication > Users');
    console.log('4. Click "Add user"');
    console.log('5. Add: shaun@siamoon.com with a password');
    console.log('6. Copy the UID and update the staff document');
    
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

async function quickFixAuth() {
  console.log('🚀 QUICK FIX: Creating Firebase Auth for Testing');
  console.log('=' .repeat(50));
  
  try {
    // Get the specific staff member
    const email = 'shaun@siamoon.com';
    console.log(`🔍 Looking for staff with email: ${email}`);
    
    const staffQuery = await db.collection('staff_accounts')
      .where('email', '==', email)
      .get();
    
    if (staffQuery.empty) {
      console.log('❌ No staff found with that email');
      console.log('💡 Available staff emails:');
      
      const allStaff = await db.collection('staff_accounts').get();
      allStaff.forEach(doc => {
        const staff = doc.data();
        console.log(`   - ${staff.email} (${staff.name})`);
      });
      
      rl.close();
      return;
    }
    
    const staffDoc = staffQuery.docs[0];
    const staffData = staffDoc.data();
    const staffId = staffDoc.id;
    
    console.log(`✅ Found staff: ${staffData.name} (${staffId})`);
    
    // Check if already has Firebase Auth
    if (staffData.userId) {
      console.log(`⚠️  Staff already has userId: ${staffData.userId}`);
      
      // Verify the Firebase Auth account exists
      try {
        const userRecord = await auth.getUser(staffData.userId);
        console.log(`✅ Firebase Auth account exists: ${userRecord.email}`);
        console.log('🎯 The issue might be the password. Try resetting it in Firebase Console.');
        rl.close();
        return;
      } catch (error) {
        console.log(`❌ Firebase Auth account doesn't exist for UID: ${staffData.userId}`);
        console.log('🔧 Will create new Firebase Auth account...');
      }
    }
    
    // Create Firebase Auth account
    const password = await promptQuestion('Enter password for this user (min 6 characters): ');
    
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      rl.close();
      return;
    }
    
    console.log(`🔐 Creating Firebase Auth account for ${email}...`);
    
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: staffData.name
      });
      console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('✅ Firebase Auth user already exists, getting UID...');
        userRecord = await auth.getUserByEmail(email);
        console.log(`✅ Found existing user: ${userRecord.uid}`);
        
        // Update password
        await auth.updateUser(userRecord.uid, { password: password });
        console.log('✅ Updated password');
      } else {
        throw error;
      }
    }
    
    // Update staff document with userId
    await db.collection('staff_accounts').doc(staffId).update({
      userId: userRecord.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      firebaseAuthSetup: true
    });
    
    console.log(`✅ Updated staff document with userId: ${userRecord.uid}`);
    
    // Create a test job for this user
    console.log('\n📋 Creating test job...');
    
    const testJob = {
      title: '⚠️ TEST JOB: Mobile App Integration Test',
      description: 'Test job to verify mobile app integration works correctly.',
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
      userId: userRecord.uid, // This enables mobile app queries
      
      // Staff Reference
      assignedStaffRef: {
        id: staffId,
        name: staffData.name,
        role: staffData.role,
        email: staffData.email
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
    
    // Success summary
    console.log('\n🎉 QUICK FIX COMPLETE!');
    console.log('=' .repeat(30));
    console.log(`✅ Firebase Auth created for: ${email}`);
    console.log(`✅ Staff document updated with userId: ${userRecord.uid}`);
    console.log(`✅ Test job created: ${jobRef.id}`);
    console.log('');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('📱 NOW YOU CAN:');
    console.log('1. Try logging into the web app with these credentials');
    console.log('2. The mobile app should also accept these credentials');
    console.log('3. The test job should appear in the mobile app');
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
  } finally {
    rl.close();
  }
}

// Run the quick fix
quickFixAuth();
