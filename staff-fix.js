// Firebase Admin Staff Setup Script
// This script fixes the critical issue of missing userId fields in staff accounts

const admin = require('firebase-admin')
const { getAuth } = require('firebase/auth')
const fs = require('fs')
const readline = require('readline')

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Check if service account file exists
const serviceAccountPath = `${process.env.HOME}/.google/service-account.json`
let serviceAccount

try {
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath)
    console.log(`Found service account at ${serviceAccountPath}`)
  } else {
    console.error('Service account file not found at', serviceAccountPath)
    console.error(
      'Please download a service account key from Firebase Console and save it to this location'
    )
    rl.close()
    process.exit(1)
  }
} catch (error) {
  console.error('Error loading service account:', error)
  rl.close()
  process.exit(1)
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const auth = admin.auth()

// Helper function to prompt for input
async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// List all staff accounts
async function listStaffAccounts() {
  try {
    console.log('Listing all staff accounts...\n')
    const staffSnapshot = await db.collection('staff_accounts').get()

    if (staffSnapshot.empty) {
      console.log('No staff accounts found')
      return []
    }

    const staffAccounts = []
    let withUserIdCount = 0
    let missingUserIdCount = 0

    console.log(`Found ${staffSnapshot.size} staff accounts:`)

    staffSnapshot.forEach((doc) => {
      const staffData = doc.data()

      staffAccounts.push({
        id: doc.id,
        name: staffData.name || 'Not specified',
        email: staffData.email || 'Not specified',
        userId: staffData.userId || null,
        isActive: staffData.isActive === true,
      })

      console.log(`\n${staffAccounts.length}. Staff ID: ${doc.id}`)
      console.log(`   Name: ${staffData.name || 'Not specified'}`)
      console.log(`   Email: ${staffData.email || 'Not specified'}`)

      if (staffData.userId) {
        console.log(`   User ID: ${staffData.userId} ✅`)
        withUserIdCount++
      } else {
        console.log(`   User ID: MISSING ❌`)
        missingUserIdCount++
      }

      console.log(`   Is Active: ${staffData.isActive === true ? 'Yes' : 'No'}`)
    })

    console.log(`\n--- Summary ---`)
    console.log(`Total staff accounts: ${staffSnapshot.size}`)
    console.log(`Staff with userId: ${withUserIdCount}`)
    console.log(`Staff missing userId: ${missingUserIdCount}`)

    return staffAccounts
  } catch (error) {
    console.error('Error listing staff accounts:', error)
    return []
  }
}

// Create a Firebase Auth user and get UID
async function createAuthUser(email, password, displayName) {
  try {
    // First check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(email)
      console.log(
        `User with email ${email} already exists with UID: ${userRecord.uid}`
      )
      return userRecord.uid
    } catch (error) {
      // User doesn't exist, create a new one
      if (error.code === 'auth/user-not-found') {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        })
        console.log(
          `Created new Firebase Auth user with UID: ${userRecord.uid}`
        )
        return userRecord.uid
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('Error in auth operation:', error)
    throw error
  }
}

// Update a staff account with userId
async function updateStaffWithUserId(staffId) {
  try {
    console.log(`\nUpdating staff account ${staffId} with a userId...`)

    // Get the staff document
    const staffDoc = await db.collection('staff_accounts').doc(staffId).get()

    if (!staffDoc.exists) {
      console.log(`Staff account ${staffId} does not exist`)
      return false
    }

    const staffData = staffDoc.data()
    console.log('\nStaff Account Details:')
    console.log(`Name: ${staffData.name || 'Not specified'}`)
    console.log(`Email: ${staffData.email || 'Not specified'}`)

    if (staffData.userId) {
      console.log(
        `\nThis staff account already has userId: ${staffData.userId}`
      )
      const shouldContinue = await prompt(
        'Do you want to update it anyway? (y/n): '
      )
      if (shouldContinue.toLowerCase() !== 'y') {
        console.log('Operation cancelled')
        return false
      }
    }

    // Handle email
    let email = staffData.email
    if (!email) {
      email = await prompt(
        'Staff has no email. Please enter an email address: '
      )
    } else {
      const useExistingEmail = await prompt(
        `Use existing email "${email}"? (y/n): `
      )
      if (useExistingEmail.toLowerCase() !== 'y') {
        email = await prompt('Enter new email: ')
      }
    }

    // Handle name
    let name = staffData.name
    if (!name) {
      name = await prompt('Staff has no name. Please enter a name: ')
    }

    // Password for Firebase Auth
    const password = await prompt(
      'Enter password for the auth account (min 6 characters): '
    )

    // Create Firebase Auth user and get UID
    const uid = await createAuthUser(email, password, name)

    // Update the staff account with the userId
    await db.collection('staff_accounts').doc(staffId).update({
      userId: uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(
      `\nSuccessfully updated staff account ${staffId} with userId: ${uid}`
    )

    return {
      staffId,
      userId: uid,
      email,
    }
  } catch (error) {
    console.error('Error updating staff account:', error)
    return false
  }
}

// Create a test job for a staff member
async function createTestJob(staffId, userId) {
  try {
    console.log(
      `\nCreating test job for staff ${staffId} with userId ${userId}...`
    )

    // Get staff details
    const staffDoc = await db.collection('staff_accounts').doc(staffId).get()

    if (!staffDoc.exists) {
      console.log(`Staff account ${staffId} does not exist`)
      return false
    }

    const staffData = staffDoc.data()
    const staffName = staffData.name || 'Test Staff'
    const staffEmail = staffData.email || 'test@example.com'

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Format dates
    const todayFormatted = now.toISOString().split('T')[0]
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0]

    // Create test job data
    const testJob = {
      // Booking Reference
      bookingId: `test_booking_${Date.now().toString(36)}`,
      bookingRef: {
        id: `test_booking_${Date.now().toString(36)}`,
        guestName: 'Test Guest',
        propertyName: 'Test Villa',
        checkInDate: todayFormatted,
        checkOutDate: tomorrowFormatted,
        guestCount: 4,
      },

      // Property Reference
      propertyId: `test_property_${Date.now().toString(36)}`,
      propertyRef: {
        id: `test_property_${Date.now().toString(36)}`,
        name: 'Test Villa',
        address: '123 Test Street, Test City',
        coordinates: {
          latitude: 7.9519, // Phuket coordinates
          longitude: 98.3381,
        },
      },

      // Job Details
      jobType: 'cleaning',
      title: '⚠️ TEST JOB: Villa Cleaning',
      description:
        'This is a test job for mobile app integration. Please accept this job to test the mobile app functionality.',
      priority: 'medium',

      // Scheduling
      scheduledDate: todayFormatted,
      scheduledStartTime: '14:00',
      scheduledEndTime: '16:00',
      estimatedDuration: 120, // 2 hours
      deadline: tomorrowFormatted,

      // Staff Assignment - add userId field required by database policy
      assignedStaffId: staffId,
      userId: userId, // CRITICAL: This is what links the job to the Firebase Auth user
      assignedStaffRef: {
        id: staffId,
        name: staffName,
        role: staffData.role || 'Staff',
        skills: staffData.skills || ['cleaning', 'attention_to_detail'],
      },
      userRef: {
        userId: userId,
      },

      // Assignment Details
      assignedAt: now.toISOString(),
      assignedBy: {
        id: 'admin',
        name: 'System Admin',
      },

      // Job Status - start with assigned immediately
      status: 'assigned',
      statusHistory: [
        {
          status: 'assigned',
          timestamp: now.toISOString(),
          updatedBy: 'admin',
          notes: 'Test job created for mobile app testing',
        },
      ],

      // Requirements
      requiredSkills: ['cleaning', 'attention_to_detail'],
      specialInstructions:
        'This is a test job. Please accept and test the mobile workflow.',

      // Location & Access
      location: {
        address: '123 Test Street, Test City',
        coordinates: {
          latitude: 7.9519,
          longitude: 98.3381,
        },
        accessInstructions: 'Test villa access code: 1234',
        parkingInstructions: 'Parking available in front of villa',
      },

      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      // Mobile Sync Optimization
      syncVersion: 1,
      mobileOptimized: {
        essentialData: {
          title: '⚠️ TEST JOB: Villa Cleaning',
          address: '123 Test Street, Test City',
          scheduledTime: '14:00',
          priority: 'medium',
        },
      },

      // Required for mobile notification system
      notificationSent: true,
      mobileNotificationPending: true,
    }

    // Save job to Firebase
    const jobRef = await db.collection('jobs').add(testJob)
    console.log(`✅ Test job created with ID: ${jobRef.id}`)

    // Create notification
    const notificationData = {
      jobId: jobRef.id,
      staffId: staffId,
      userId: userId, // CRITICAL: This is what links the notification to the Firebase Auth user
      staffName: staffName,
      staffEmail: staffEmail,
      jobTitle: testJob.title,
      jobType: testJob.jobType,
      priority: testJob.priority,
      propertyName: testJob.propertyRef.name,
      propertyAddress: testJob.location.address,
      scheduledDate: testJob.scheduledDate,
      scheduledStartTime: testJob.scheduledStartTime,
      estimatedDuration: testJob.estimatedDuration,
      specialInstructions: testJob.specialInstructions,
      type: 'job_assigned',
      status: 'pending',
      readAt: null,
      actionRequired: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }

    const notificationRef = await db
      .collection('staff_notifications')
      .add(notificationData)
    console.log(`✅ Notification created with ID: ${notificationRef.id}`)

    return {
      success: true,
      jobId: jobRef.id,
      notificationId: notificationRef.id,
      staffId,
      userId,
    }
  } catch (error) {
    console.error('Error creating test job:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

// Process all staff members (auto-update option)
async function processAllStaff() {
  try {
    console.log('\nProcessing all staff accounts to add userIds...')

    // Get all staff accounts
    const staffSnapshot = await db
      .collection('staff_accounts')
      .where('isActive', '==', true)
      .get()

    if (staffSnapshot.empty) {
      console.log('No active staff accounts found')
      return []
    }

    console.log(`Found ${staffSnapshot.size} active staff accounts`)
    const defaultPassword = await prompt(
      'Enter default password for all staff auth accounts: '
    )

    let processed = 0
    let failed = 0

    // Process each staff account
    for (const staffDoc of staffSnapshot.docs) {
      const staffData = staffDoc.data()
      const staffId = staffDoc.id

      // Skip staff that already have userIds unless forced
      if (staffData.userId) {
        console.log(
          `\nStaff ${staffData.name || staffId} already has userId: ${staffData.userId} - SKIPPING`
        )
        continue
      }

      console.log(
        `\nProcessing staff: ${staffData.name || 'No name'} (${staffId})`
      )

      // Skip if no email
      if (!staffData.email) {
        console.log('  No email address found - SKIPPING')
        failed++
        continue
      }

      try {
        // Create auth user and update staff account
        const uid = await createAuthUser(
          staffData.email,
          defaultPassword,
          staffData.name || 'Staff User'
        )

        await db.collection('staff_accounts').doc(staffId).update({
          userId: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        console.log(`  ✅ Updated with userId: ${uid}`)
        processed++
      } catch (error) {
        console.error(`  ❌ Failed to update: ${error.message}`)
        failed++
      }
    }

    console.log(`\n--- Processing Complete ---`)
    console.log(`Processed: ${processed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Skipped: ${staffSnapshot.size - processed - failed}`)

    return { processed, failed }
  } catch (error) {
    console.error('Error processing all staff:', error)
    return { processed: 0, failed: 0, error: error.message }
  }
}

// Main menu
async function showMenu() {
  console.log('\n=== CRITICAL FIX: Staff-Mobile Integration ===')
  console.log('1. List all staff accounts (show missing userIds)')
  console.log('2. Update a single staff account with userId')
  console.log('3. Process ALL staff accounts (add missing userIds)')
  console.log('4. Create a test job for a staff member')
  console.log('5. Fix cleaner@siamoon.com (quick start)')
  console.log('0. Exit')

  const choice = await prompt('\nEnter your choice: ')

  switch (choice) {
    case '1':
      await listStaffAccounts()
      break
    case '2':
      const staffId = await prompt('Enter staff ID to update: ')
      await updateStaffWithUserId(staffId)
      break
    case '3':
      const confirm = await prompt(
        'This will add userIds to ALL staff accounts without one. Continue? (y/n): '
      )
      if (confirm.toLowerCase() === 'y') {
        await processAllStaff()
      } else {
        console.log('Operation cancelled')
      }
      break
    case '4':
      const jobStaffId = await prompt('Enter staff ID: ')
      const userId = await prompt('Enter user ID (Firebase Auth UID): ')
      await createTestJob(jobStaffId, userId)
      break
    case '5':
      // Find cleaner staff account
      console.log('\nQuick start: Setting up cleaner@siamoon.com...')
      const cleanerSnapshot = await db
        .collection('staff_accounts')
        .where('email', '==', 'cleaner@siamoon.com')
        .get()

      if (cleanerSnapshot.empty) {
        console.log('❌ No staff account found with email cleaner@siamoon.com')
      } else {
        const cleanerDoc = cleanerSnapshot.docs[0]
        console.log(`Found cleaner account: ${cleanerDoc.id}`)
        await updateStaffWithUserId(cleanerDoc.id)

        // Create test job if userId was added
        const updatedCleanerDoc = await db
          .collection('staff_accounts')
          .doc(cleanerDoc.id)
          .get()
        const updatedCleanerData = updatedCleanerDoc.data()

        if (updatedCleanerData.userId) {
          const createJob = await prompt(
            'Create a test job for this staff? (y/n): '
          )
          if (createJob.toLowerCase() === 'y') {
            await createTestJob(cleanerDoc.id, updatedCleanerData.userId)
          }
        }
      }
      break
    case '0':
      console.log('Exiting...')
      rl.close()
      process.exit(0)
    default:
      console.log('Invalid choice')
  }

  // Back to menu
  await showMenu()
}

// Start the script
console.log('🚨 CRITICAL ISSUE FIXER: Staff-Mobile Integration 🚨')
console.log('This script fixes missing userIds in staff accounts')

showMenu().catch((error) => {
  console.error('Fatal error:', error)
  rl.close()
  process.exit(1)
})
