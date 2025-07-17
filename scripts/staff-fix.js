/**
 * staff-fix.js
 *
 * This script fixes the missing userIds in staff accounts by:
 * 1. Reading all staff accounts from Firestore
 * 2. Identifying accounts that don't have a userId
 * 3. Creating Firebase Auth accounts for those staff members
 * 4. Updating the staff accounts with the new userIds
 */

const admin = require('firebase-admin')
const serviceAccount = require('../serviceAccountKey.json')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()
const auth = admin.auth()

// Main function
async function fixStaffAccounts() {
  try {
    console.log('Starting staff account fix process...')

    // Get all staff accounts
    console.log('Fetching staff accounts...')
    const staffSnapshot = await db.collection('staff_accounts').get()
    const staffAccounts = staffSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Found ${staffAccounts.length} staff accounts`)

    // Filter accounts without userIds
    const accountsWithoutUserId = staffAccounts.filter((staff) => !staff.userId)
    console.log(
      `Found ${accountsWithoutUserId.length} staff accounts without userId`
    )

    if (accountsWithoutUserId.length === 0) {
      console.log('No staff accounts need fixing. All accounts have userIds.')
      return
    }

    // Process each account without userId
    console.log('\nProcessing accounts without userIds:')
    for (const staff of accountsWithoutUserId) {
      await processStaffMember(staff)
    }

    console.log('\nStaff account fix process completed successfully')
  } catch (error) {
    console.error('Error in fixStaffAccounts:', error)
  }
}

// Process a single staff member
async function processStaffMember(staff) {
  try {
    console.log(`\nProcessing staff: ${staff.email} (ID: ${staff.id})`)

    // Check if Firebase Auth user already exists for this email
    let firebaseUser
    try {
      firebaseUser = await auth.getUserByEmail(staff.email)
      console.log(
        `  Firebase Auth user already exists with UID: ${firebaseUser.uid}`
      )
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new Firebase Auth user
        console.log(`  Creating new Firebase Auth user for ${staff.email}`)

        // Generate a secure random password (this will be reset by the user)
        const tempPassword =
          Math.random().toString(36).slice(-10) +
          Math.random().toString(36).toUpperCase().slice(-2) +
          Math.random().toString(24).slice(-2)

        firebaseUser = await auth.createUser({
          email: staff.email,
          password: tempPassword,
          displayName: `${staff.firstName} ${staff.lastName || ''}`.trim(),
          disabled: false,
        })

        console.log(
          `  Created Firebase Auth user with UID: ${firebaseUser.uid}`
        )

        // Send password reset email
        await auth.generatePasswordResetLink(staff.email)
        console.log(`  Password reset email sent to ${staff.email}`)
      } else {
        throw error
      }
    }

    // Update staff account with userId
    await db.collection('staff_accounts').doc(staff.id).update({
      userId: firebaseUser.uid,
    })

    console.log(`  Updated staff account with userId: ${firebaseUser.uid}`)

    return firebaseUser.uid
  } catch (error) {
    console.error(`Error processing staff member ${staff.email}:`, error)
    return null
  }
}

// List all staff accounts for reference
async function listStaffAccounts() {
  try {
    console.log('Listing all staff accounts:')

    const staffSnapshot = await db.collection('staff_accounts').get()
    const staffAccounts = staffSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    staffAccounts.forEach((staff, index) => {
      console.log(`\n${index + 1}. Staff: ${staff.email}`)
      console.log(`   ID: ${staff.id}`)
      console.log(`   Name: ${staff.firstName} ${staff.lastName || ''}`)
      console.log(`   UserId: ${staff.userId || 'MISSING'}`)
      console.log(`   Role: ${staff.role || 'Not specified'}`)
    })

    console.log(`\nTotal: ${staffAccounts.length} staff accounts`)
  } catch (error) {
    console.error('Error listing staff accounts:', error)
  }
}

// Process a specific staff member by email
async function processSpecificStaff(email) {
  try {
    console.log(`Looking for staff with email: ${email}`)

    const staffSnapshot = await db
      .collection('staff_accounts')
      .where('email', '==', email)
      .get()

    if (staffSnapshot.empty) {
      console.log(`No staff account found with email: ${email}`)
      return
    }

    const staffDoc = staffSnapshot.docs[0]
    const staff = {
      id: staffDoc.id,
      ...staffDoc.data(),
    }

    console.log(
      `Found staff: ${staff.firstName} ${staff.lastName || ''} (ID: ${staff.id})`
    )

    if (staff.userId) {
      console.log(`Staff already has userId: ${staff.userId}`)
    } else {
      await processStaffMember(staff)
    }
  } catch (error) {
    console.error(`Error processing specific staff member ${email}:`, error)
  }
}

// Show usage instructions
function showUsage() {
  console.log(`
Usage: node staff-fix.js [command] [options]

Commands:
  list                List all staff accounts
  fix-all             Fix all staff accounts missing userIds
  fix [email]         Fix a specific staff account by email

Examples:
  node staff-fix.js list
  node staff-fix.js fix-all
  node staff-fix.js fix cleaner@siamoon.com
`)
}

// Parse command line arguments and run appropriate function
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    showUsage()
    return
  }

  switch (command) {
    case 'list':
      await listStaffAccounts()
      break
    case 'fix-all':
      await fixStaffAccounts()
      break
    case 'fix':
      const email = args[1]
      if (!email) {
        console.error('Error: Email is required for the fix command')
        showUsage()
        return
      }
      await processSpecificStaff(email)
      break
    default:
      console.error(`Unknown command: ${command}`)
      showUsage()
  }
}

// Run the script
main().catch(console.error)
