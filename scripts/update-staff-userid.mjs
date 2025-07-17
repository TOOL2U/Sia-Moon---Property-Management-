import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore'

// Firebase configuration - replace with your config if needed
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: 'operty-b54dc', // Your current project ID
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

/**
 * Update a staff account with a userId
 * @param {string} staffId The staff ID to update
 * @param {string} email The email address for the auth account (should match staff email)
 * @param {string} password The password for the auth account
 */
async function updateStaffWithUserId(staffId, email, password) {
  try {
    console.log(`🔄 Updating staff account ${staffId} with email ${email}...`)

    // First, check if staff exists
    const staffDocRef = doc(db, 'staff_accounts', staffId)
    const staffDoc = await getDoc(staffDocRef)

    if (!staffDoc.exists()) {
      console.error(`❌ Staff account ${staffId} does not exist!`)
      return
    }

    const staffData = staffDoc.data()
    console.log(`✅ Found staff account: ${staffData.name || 'Unknown Name'}`)

    if (staffData.userId) {
      console.log(`⚠️ Staff account already has userId: ${staffData.userId}`)

      // Check if this is actually what we want
      const confirm = process.argv.includes('--force')
        ? 'y'
        : await new Promise((resolve) => {
            process.stdout.write('Do you want to update it anyway? (y/n): ')
            process.stdin.once('data', (data) => {
              resolve(data.toString().trim().toLowerCase())
            })
          })

      if (confirm !== 'y') {
        console.log('❌ Operation cancelled')
        return
      }
    }

    // Create a new auth account
    let userCredential
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      console.log(
        `✅ Created new auth account with UID: ${userCredential.user.uid}`
      )
    } catch (authError) {
      console.error(`❌ Error creating auth account: ${authError.message}`)
      console.log(
        '⚠️ The email might already be in use. Trying to continue with staff account update...'
      )

      // Prompt for userId
      const userId =
        process.argv[4] ||
        (await new Promise((resolve) => {
          process.stdout.write('Please enter the existing userId/uid: ')
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim())
          })
        }))

      if (!userId) {
        console.error('❌ No userId provided, cannot continue')
        return
      }

      // Update the staff account with the provided userId
      await updateDoc(staffDocRef, {
        userId: userId,
      })

      console.log(`✅ Staff account updated with provided userId: ${userId}`)
      return
    }

    // Update the staff account with the new userId
    await updateDoc(staffDocRef, {
      userId: userCredential.user.uid,
    })

    console.log(
      `✅ Staff account ${staffId} successfully updated with userId: ${userCredential.user.uid}`
    )
  } catch (error) {
    console.error('❌ Error updating staff account:', error)
  }
}

// Get command line arguments
const staffId = process.argv[2]
const email = process.argv[3]
const password = process.argv[4] || 'Password123!'

if (!staffId || !email) {
  console.error(
    '❌ Usage: node update-staff-userid.mjs <staffId> <email> [password] [--force]'
  )
  process.exit(1)
}

// Run the update function
updateStaffWithUserId(staffId, email, password)
  .then(() => {
    console.log('🎉 Process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
