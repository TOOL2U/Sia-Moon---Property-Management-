/**
 * Firebase Integration Verification Script
 * Verifies complete Firebase integration for staff profiles and mobile app job assignment
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'operty-b54dc'
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function verifyFirebaseIntegration() {
  console.log('🔍 Starting Firebase Integration Verification...\n');

  try {
    // 1. Check Firebase Authentication Setup
    console.log('1️⃣ CHECKING FIREBASE AUTHENTICATION SETUP');
    console.log('=' .repeat(50));
    
    const authUsers = await auth.listUsers();
    console.log(`✅ Total Firebase Auth users: ${authUsers.users.length}`);
    
    // 2. Check Staff Accounts Collection
    console.log('\n2️⃣ CHECKING STAFF ACCOUNTS COLLECTION');
    console.log('=' .repeat(50));
    
    const staffSnapshot = await db.collection('staff_accounts').get();
    console.log(`✅ Total staff accounts: ${staffSnapshot.size}`);
    
    let staffWithUserId = 0;
    let staffWithoutUserId = 0;
    const staffProblems = [];
    
    for (const doc of staffSnapshot.docs) {
      const staff = doc.data();
      const staffId = doc.id;
      
      if (staff.userId) {
        staffWithUserId++;
        
        // Verify Firebase Auth user exists
        try {
          await auth.getUser(staff.userId);
          console.log(`✅ Staff ${staff.name} (${staffId}) has valid Firebase Auth (${staff.userId})`);
        } catch (error) {
          console.log(`❌ Staff ${staff.name} (${staffId}) has invalid Firebase Auth UID: ${staff.userId}`);
          staffProblems.push({
            staffId,
            name: staff.name,
            issue: 'Invalid Firebase Auth UID',
            userId: staff.userId
          });
        }
      } else {
        staffWithoutUserId++;
        console.log(`⚠️  Staff ${staff.name} (${staffId}) missing userId field`);
        staffProblems.push({
          staffId,
          name: staff.name,
          issue: 'Missing userId field'
        });
      }
    }
    
    console.log(`\n📊 Staff Account Summary:`);
    console.log(`   ✅ Staff with userId: ${staffWithUserId}`);
    console.log(`   ❌ Staff without userId: ${staffWithoutUserId}`);
    
    // 3. Check Job Assignment Integration
    console.log('\n3️⃣ CHECKING JOB ASSIGNMENT INTEGRATION');
    console.log('=' .repeat(50));
    
    const jobsSnapshot = await db.collection('jobs').limit(10).get();
    console.log(`✅ Sample jobs found: ${jobsSnapshot.size}`);
    
    let jobsWithBothIds = 0;
    let jobsWithStaffIdOnly = 0;
    let jobsWithUserIdOnly = 0;
    let jobsWithNeitherId = 0;
    
    jobsSnapshot.forEach(doc => {
      const job = doc.data();
      const hasStaffId = !!job.assignedStaffId;
      const hasUserId = !!job.userId;
      
      if (hasStaffId && hasUserId) {
        jobsWithBothIds++;
        console.log(`✅ Job ${doc.id}: Has both assignedStaffId (${job.assignedStaffId}) and userId (${job.userId})`);
      } else if (hasStaffId && !hasUserId) {
        jobsWithStaffIdOnly++;
        console.log(`⚠️  Job ${doc.id}: Has assignedStaffId (${job.assignedStaffId}) but missing userId`);
      } else if (!hasStaffId && hasUserId) {
        jobsWithUserIdOnly++;
        console.log(`⚠️  Job ${doc.id}: Has userId (${job.userId}) but missing assignedStaffId`);
      } else {
        jobsWithNeitherId++;
        console.log(`❌ Job ${doc.id}: Missing both assignedStaffId and userId`);
      }
    });
    
    console.log(`\n📊 Job Assignment Summary:`);
    console.log(`   ✅ Jobs with both IDs: ${jobsWithBothIds}`);
    console.log(`   ⚠️  Jobs with staffId only: ${jobsWithStaffIdOnly}`);
    console.log(`   ⚠️  Jobs with userId only: ${jobsWithUserIdOnly}`);
    console.log(`   ❌ Jobs with neither ID: ${jobsWithNeitherId}`);
    
    // 4. Mobile App Data Structure Validation
    console.log('\n4️⃣ CHECKING MOBILE APP DATA STRUCTURE');
    console.log('=' .repeat(50));
    
    // Check if staff profiles have required mobile app fields
    let validMobileProfiles = 0;
    let invalidMobileProfiles = 0;
    
    const requiredFields = ['name', 'email', 'role', 'isActive'];
    
    for (const doc of staffSnapshot.docs) {
      const staff = doc.data();
      const missingFields = requiredFields.filter(field => !staff[field]);
      
      if (missingFields.length === 0) {
        validMobileProfiles++;
        console.log(`✅ Staff ${staff.name}: Has all required mobile app fields`);
      } else {
        invalidMobileProfiles++;
        console.log(`❌ Staff ${staff.name}: Missing fields: ${missingFields.join(', ')}`);
      }
    }
    
    console.log(`\n📊 Mobile App Data Structure:`);
    console.log(`   ✅ Valid profiles: ${validMobileProfiles}`);
    console.log(`   ❌ Invalid profiles: ${invalidMobileProfiles}`);
    
    // 5. Generate Summary Report
    console.log('\n5️⃣ INTEGRATION SUMMARY REPORT');
    console.log('=' .repeat(50));
    
    const isFullyIntegrated = (
      staffWithoutUserId === 0 && 
      staffProblems.length === 0 && 
      jobsWithBothIds > 0 && 
      invalidMobileProfiles === 0
    );
    
    if (isFullyIntegrated) {
      console.log('🎉 FIREBASE INTEGRATION: FULLY FUNCTIONAL');
      console.log('✅ All staff have Firebase Auth accounts');
      console.log('✅ All staff profiles have userId fields');
      console.log('✅ Jobs include both assignedStaffId and userId');
      console.log('✅ Mobile app data structure is complete');
      console.log('\n🚀 READY FOR MOBILE APP JOB ASSIGNMENT!');
    } else {
      console.log('⚠️  FIREBASE INTEGRATION: NEEDS ATTENTION');
      
      if (staffWithoutUserId > 0) {
        console.log(`❌ ${staffWithoutUserId} staff members missing userId fields`);
      }
      
      if (staffProblems.length > 0) {
        console.log(`❌ ${staffProblems.length} staff members have authentication issues`);
      }
      
      if (jobsWithBothIds === 0) {
        console.log('❌ No jobs found with both assignedStaffId and userId');
      }
      
      if (invalidMobileProfiles > 0) {
        console.log(`❌ ${invalidMobileProfiles} staff profiles missing required mobile app fields`);
      }
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      
      if (staffProblems.length > 0) {
        console.log('\n📝 Staff Issues to Fix:');
        staffProblems.forEach(problem => {
          console.log(`   - ${problem.name} (${problem.staffId}): ${problem.issue}`);
        });
        
        console.log('\n💡 To fix staff authentication issues, run:');
        console.log('   node scripts/create-staff-with-userid.js');
      }
      
      if (jobsWithBothIds === 0) {
        console.log('\n💡 To create test jobs with proper integration, run:');
        console.log('   await TestJobService.createTestJob({');
        console.log('     useSpecificStaffId: "staff_id",');
        console.log('     useSpecificUserId: "firebase_auth_uid"');
        console.log('   });');
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyFirebaseIntegration();
