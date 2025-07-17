// Firebase admin script to create a staff account with userId
// This script creates/updates a new staff account with a userId from Firebase Auth

const admin = require('firebase-admin')
const readline = require('readline')

// Check if service account file is provided
if (process.argv.length < 3) {
  console.error('Please provide path to service account JSON file')
  console.error(
    'Usage: node create-staff-with-userid.js path/to/serviceAccount.json [staffEmail]'
  )
  process.exit(1)
}

// Initialize Firebase
const serviceAccountPath = process.argv[2]
let serviceAccount

try {
  serviceAccount = require(serviceAccountPath)
} catch (error) {
  console.error(
    `Error loading service account from ${serviceAccountPath}:`,
    error
  )
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const auth = admin.auth()

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Prompt for user input
async function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Main function to create a staff account with userId
async function createStaffWithUserId() {
  try {
    console.log('Creating a staff account with Firebase Auth userId...')

    // Get email from command line or prompt
    const email =
      process.argv[3] || (await promptQuestion('Enter staff email: '))
    const name = await promptQuestion('Enter staff name: ')
    const password = await promptQuestion(
      'Enter password (minimum 6 characters): '
    )

    // Create the Firebase Auth user
    console.log(`Creating Firebase Auth user for ${email}...`)
    let userRecord

    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name,
      })
      console.log(
        `✅ Successfully created Firebase Auth user: ${userRecord.uid}`
      )
    } catch (error) {
      // Handle case where user might already exist
      if (error.code === 'auth/email-already-exists') {
        console.log(`User with email ${email} already exists. Fetching UID...`)
        userRecord = await auth.getUserByEmail(email)
        console.log(`✅ Found existing user with UID: ${userRecord.uid}`)
      } else {
        throw error
      }
    }

    // Create/update staff account in Firestore
    const staffId = await promptQuestion(
      'Enter staff ID (leave blank to generate one): '
    )

    let staffDocRef
    if (staffId) {
      staffDocRef = db.collection('staff_accounts').doc(staffId)
      // Check if staff exists
      const doc = await staffDocRef.get()
      if (doc.exists) {
        console.log(`Staff with ID ${staffId} already exists. Updating...`)
        await staffDocRef.update({
          userId: userRecord.uid,
          name: name,
          email: email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      } else {
        console.log(`Creating new staff with ID ${staffId}...`)
        await staffDocRef.set({
          userId: userRecord.uid,
          name: name,
          email: email,
          isActive: true,
          role: 'staff',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    } else {
      // Generate a new staff document
      staffDocRef = db.collection('staff_accounts').doc()
      console.log(`Creating new staff with generated ID ${staffDocRef.id}...`)
      await staffDocRef.set({
        userId: userRecord.uid,
        name: name,
        email: email,
        isActive: true,
        role: 'staff',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    console.log(`✅ Staff account created/updated successfully!`)
    console.log(`
Staff ID: ${staffDocRef.id}
User ID (Auth UID): ${userRecord.uid}
Name: ${name}
Email: ${email}
    `)

    // For testing jobs
    console.log(`
To create test jobs for this user, use:
await TestJobService.createTestJob({
  useSpecificStaffId: "${staffDocRef.id}",
  useSpecificUserId: "${userRecord.uid}"
});
    `)
  } catch (error) {
    console.error('❌ Error creating staff account:', error)
  } finally {
    rl.close()
  }
}

// Run the main function
createStaffWithUserId()
  .then(() => {
    console.log('Process completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
