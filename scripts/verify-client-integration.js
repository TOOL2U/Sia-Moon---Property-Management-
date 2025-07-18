/**
 * Client-side Firebase Integration Verification
 * Verifies Firebase integration using client SDK
 */

const { initializeApp } = require('firebase/app')
const {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
} = require('firebase/firestore')

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw',
  authDomain: 'operty-b54dc.firebaseapp.com',
  projectId: 'operty-b54dc',
  storageBucket: 'operty-b54dc.firebasestorage.app',
  messagingSenderId: '914547669275',
  appId: '1:914547669275:web:0897d32d59b17134a53bbe',
  measurementId: 'G-R1PELW8B8Q',
  databaseURL: 'https://operty-b54dc-default-rtdb.firebaseio.com/',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function verifyClientIntegration() {
  console.log('🔍 Starting Client-side Firebase Integration Verification...\n')

  try {
    // 1. Check Staff Accounts Collection
    console.log('1️⃣ CHECKING STAFF ACCOUNTS COLLECTION')
    console.log('='.repeat(50))

    const staffSnapshot = await getDocs(collection(db, 'staff_accounts'))
    console.log(`✅ Total staff accounts: ${staffSnapshot.size}`)

    let staffWithUserId = 0
    let staffWithoutUserId = 0
    const staffDetails = []

    staffSnapshot.forEach((doc) => {
      const staff = doc.data()
      const staffId = doc.id

      staffDetails.push({
        id: staffId,
        name: staff.name || 'Unknown',
        email: staff.email || 'No email',
        userId: staff.userId || null,
        isActive: staff.isActive,
        role: staff.role || 'Unknown',
      })

      if (staff.userId) {
        staffWithUserId++
        console.log(
          `✅ Staff ${staff.name} (${staffId}) has userId: ${staff.userId}`
        )
      } else {
        staffWithoutUserId++
        console.log(`❌ Staff ${staff.name} (${staffId}) missing userId field`)
      }
    })

    console.log(`\n📊 Staff Account Summary:`)
    console.log(`   ✅ Staff with userId: ${staffWithUserId}`)
    console.log(`   ❌ Staff without userId: ${staffWithoutUserId}`)

    // 2. Check Jobs Collection
    console.log('\n2️⃣ CHECKING JOBS COLLECTION')
    console.log('='.repeat(50))

    const jobsQuery = query(collection(db, 'jobs'), limit(10))
    const jobsSnapshot = await getDocs(jobsQuery)
    console.log(`✅ Sample jobs found: ${jobsSnapshot.size}`)

    let jobsWithBothIds = 0
    let jobsWithStaffIdOnly = 0
    let jobsWithUserIdOnly = 0
    let jobsWithNeitherId = 0

    jobsSnapshot.forEach((doc) => {
      const job = doc.data()
      const hasStaffId = !!job.assignedStaffId
      const hasUserId = !!job.userId

      if (hasStaffId && hasUserId) {
        jobsWithBothIds++
        console.log(
          `✅ Job ${doc.id}: Has both assignedStaffId (${job.assignedStaffId}) and userId (${job.userId})`
        )
      } else if (hasStaffId && !hasUserId) {
        jobsWithStaffIdOnly++
        console.log(
          `⚠️  Job ${doc.id}: Has assignedStaffId (${job.assignedStaffId}) but missing userId`
        )
      } else if (!hasStaffId && hasUserId) {
        jobsWithUserIdOnly++
        console.log(
          `⚠️  Job ${doc.id}: Has userId (${job.userId}) but missing assignedStaffId`
        )
      } else {
        jobsWithNeitherId++
        console.log(`❌ Job ${doc.id}: Missing both assignedStaffId and userId`)
      }
    })

    console.log(`\n📊 Job Assignment Summary:`)
    console.log(`   ✅ Jobs with both IDs: ${jobsWithBothIds}`)
    console.log(`   ⚠️  Jobs with staffId only: ${jobsWithStaffIdOnly}`)
    console.log(`   ⚠️  Jobs with userId only: ${jobsWithUserIdOnly}`)
    console.log(`   ❌ Jobs with neither ID: ${jobsWithNeitherId}`)

    // 3. Mobile App Data Structure Validation
    console.log('\n3️⃣ CHECKING MOBILE APP DATA STRUCTURE')
    console.log('='.repeat(50))

    const requiredFields = ['name', 'email', 'role', 'isActive']
    let validMobileProfiles = 0
    let invalidMobileProfiles = 0

    staffDetails.forEach((staff) => {
      const missingFields = requiredFields.filter((field) => !staff[field])

      if (missingFields.length === 0) {
        validMobileProfiles++
        console.log(
          `✅ Staff ${staff.name}: Has all required mobile app fields`
        )
      } else {
        invalidMobileProfiles++
        console.log(
          `❌ Staff ${staff.name}: Missing fields: ${missingFields.join(', ')}`
        )
      }
    })

    console.log(`\n📊 Mobile App Data Structure:`)
    console.log(`   ✅ Valid profiles: ${validMobileProfiles}`)
    console.log(`   ❌ Invalid profiles: ${invalidMobileProfiles}`)

    // 4. Generate Integration Status
    console.log('\n4️⃣ INTEGRATION STATUS REPORT')
    console.log('='.repeat(50))

    const isFullyIntegrated =
      staffWithoutUserId === 0 &&
      jobsWithBothIds > 0 &&
      invalidMobileProfiles === 0

    if (isFullyIntegrated) {
      console.log('🎉 FIREBASE INTEGRATION: FULLY FUNCTIONAL')
      console.log('✅ All staff profiles have userId fields')
      console.log('✅ Jobs include both assignedStaffId and userId')
      console.log('✅ Mobile app data structure is complete')
      console.log('\n🚀 READY FOR MOBILE APP JOB ASSIGNMENT!')
    } else {
      console.log('⚠️  FIREBASE INTEGRATION: NEEDS ATTENTION')

      if (staffWithoutUserId > 0) {
        console.log(
          `❌ ${staffWithoutUserId} staff members missing userId fields`
        )
      }

      if (jobsWithBothIds === 0) {
        console.log('❌ No jobs found with both assignedStaffId and userId')
      }

      if (invalidMobileProfiles > 0) {
        console.log(
          `❌ ${invalidMobileProfiles} staff profiles missing required mobile app fields`
        )
      }

      console.log('\n🔧 NEXT STEPS TO COMPLETE INTEGRATION:')

      if (staffWithoutUserId > 0) {
        console.log(
          '\n1. Create Firebase Auth accounts for staff without userId:'
        )
        staffDetails
          .filter((staff) => !staff.userId)
          .forEach((staff) => {
            console.log(`   - Run: node scripts/create-staff-with-userid.js`)
            console.log(`     Staff: ${staff.name} (${staff.id})`)
          })
      }

      if (jobsWithBothIds === 0) {
        console.log('\n2. Create test jobs with proper integration:')
        console.log(
          '   - Use TestJobService.createTestJob() with both staffId and userId'
        )
      }

      if (invalidMobileProfiles > 0) {
        console.log('\n3. Update staff profiles with missing mobile app fields')
      }
    }

    // 5. Staff Details Summary
    console.log('\n5️⃣ STAFF DETAILS SUMMARY')
    console.log('='.repeat(50))

    if (staffDetails.length > 0) {
      console.log('Current Staff Members:')
      staffDetails.forEach((staff) => {
        const status = staff.userId ? '✅' : '❌'
        console.log(`${status} ${staff.name} (${staff.id})`)
        console.log(`   Email: ${staff.email}`)
        console.log(`   Role: ${staff.role}`)
        console.log(`   Active: ${staff.isActive}`)
        console.log(`   Firebase UID: ${staff.userId || 'MISSING'}`)
        console.log('')
      })
    } else {
      console.log('❌ No staff members found in database')
      console.log('💡 Create staff members first using the admin panel')
    }
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

// Run verification
verifyClientIntegration()
