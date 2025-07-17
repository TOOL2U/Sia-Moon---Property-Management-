// Staff Setup Script
// This script helps set up staff accounts with Firebase Auth userIds

const { initializeApp } = require('firebase/app')
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require('firebase/auth')
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  addDoc,
} = require('firebase/firestore')
const readline = require('readline')

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC5h6J7AasIXdbmbJmRtkhFlQRuQ4I2pLQ',
  authDomain: 'operty-b54dc.firebaseapp.com',
  projectId: 'operty-b54dc',
  storageBucket: 'operty-b54dc.appspot.com',
  messagingSenderId: '914547669275',
  appId: '1:914547669275:web:f69e5972e8e1243da2a9fd',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Prompt function
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// List all staff accounts
async function listStaffAccounts() {
  try {
    console.log('Listing all staff accounts...')
    const staffCollection = collection(db, 'staff_accounts')
    const staffSnapshot = await getDocs(staffCollection)

    if (staffSnapshot.empty) {
      console.log('No staff accounts found')
      return []
    }

    const staffAccounts = []

    console.log(`\nFound ${staffSnapshot.size} staff accounts:`)

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
      console.log(
        `   User ID: ${staffData.userId || 'NOT FOUND - NEEDS SETUP'}`
      )
      console.log(`   Is Active: ${staffData.isActive === true ? 'Yes' : 'No'}`)
    })

    return staffAccounts
  } catch (error) {
    console.error('Error listing staff accounts:', error)
    return []
  }
}

// Update staff account with userId
async function updateStaffWithUserId(staffId) {
  try {
    console.log(`\nUpdating staff account ${staffId} with a userId...`)

    // Get the staff document
    const staffDocRef = doc(db, 'staff_accounts', staffId)
    const staffDoc = await getDoc(staffDocRef)

    if (!staffDoc.exists()) {
      console.log(`Staff account ${staffId} does not exist`)
      return false
    }

    const staffData = staffDoc.data()
    console.log('\nStaff Account Details:')
    console.log(`Name: ${staffData.name || 'Not specified'}`)
    console.log(`Email: ${staffData.email || 'Not specified'}`)
    console.log(`User ID: ${staffData.userId || 'Not specified'}`)

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

    // Ask for email and password for Firebase Auth
    let email = staffData.email
    if (!email) {
      email = await prompt('Enter email for the staff account: ')
    } else {
      const useExistingEmail = await prompt(
        `Use existing email ${email}? (y/n): `
      )
      if (useExistingEmail.toLowerCase() !== 'y') {
        email = await prompt('Enter new email: ')
      }
    }

    const password = await prompt(
      'Enter password for the auth account (min 6 characters): '
    )

    // Create or sign in to Firebase Auth
    let userCredential
    try {
      // First try to create a new user
      console.log('Attempting to create a new Firebase Auth user...')
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      console.log(
        `Created new auth account with UID: ${userCredential.user.uid}`
      )
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('Email already in use. Attempting to sign in...')
        try {
          userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          )
          console.log(
            `Signed in to existing auth account with UID: ${userCredential.user.uid}`
          )
        } catch (signInError) {
          console.error('Error signing in:', signInError)
          return false
        }
      } else {
        console.error('Error creating auth account:', authError)
        return false
      }
    }

    // Update the staff account with the userId
    await updateDoc(staffDocRef, {
      userId: userCredential.user.uid,
      updatedAt: new Date().toISOString(),
    })

    console.log(
      `\nSuccessfully updated staff account ${staffId} with userId: ${userCredential.user.uid}`
    )

    // Print info for creating test jobs
    console.log(`\nTo create test jobs for this staff member, use:`)
    console.log(`
await TestJobService.createTestJob({
  useSpecificStaffId: "${staffId}",
  useSpecificUserId: "${userCredential.user.uid}"
});`)

    return {
      staffId,
      userId: userCredential.user.uid,
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
    const staffDocRef = doc(db, 'staff_accounts', staffId)
    const staffDoc = await getDoc(staffDocRef)

    if (!staffDoc.exists()) {
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

    // Generate a unique job ID
    const jobId = `test_job_${Date.now().toString(36)}`

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
      userId: userId,
      assignedStaffRef: {
        id: staffId,
        name: staffName,
        role: 'Staff',
        skills: ['cleaning', 'attention_to_detail'],
      },
      // Add user reference in a separate property that won't cause type issues
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
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),

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

    // Save to Firebase
    console.log('Saving test job to Firebase...')
    const jobRef = await addDoc(collection(db, 'jobs'), testJob)
    console.log(`Test job created with ID: ${jobRef.id}`)

    // Create notification in staff_notifications collection
    const notificationData = {
      jobId: jobRef.id,
      staffId: staffId,
      userId: userId,
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
      createdAt: now.toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    }

    const notificationRef = await addDoc(
      collection(db, 'staff_notifications'),
      notificationData
    )
    console.log(`Notification created with ID: ${notificationRef.id}`)

    return {
      success: true,
      jobId: jobRef.id,
      notificationId: notificationRef.id,
    }
  } catch (error) {
    console.error('Error creating test job:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

// Main menu
async function showMenu() {
  console.log('\n=== Staff Setup for Mobile Integration ===')
  console.log('1. List all staff accounts')
  console.log('2. Update a staff account with userId')
  console.log('3. Create a test job for a staff member')
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
      const jobStaffId = await prompt('Enter staff ID: ')
      const userId = await prompt('Enter user ID (Firebase Auth UID): ')
      await createTestJob(jobStaffId, userId)
      break
    case '0':
      console.log('Exiting...')
      rl.close()
      return
    default:
      console.log('Invalid choice')
  }

  await showMenu()
}

// Start the script
console.log('Staff Setup Script for Mobile Integration')
showMenu().catch((error) => {
  console.error('Fatal error:', error)
  rl.close()
})
