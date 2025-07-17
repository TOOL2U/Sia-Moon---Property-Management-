import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if service account file exists in multiple potential locations
const serviceAccountPaths = [
  path.join(__dirname, '../service-account.json'),
  path.join(__dirname, '../service-account-key.json'),
  path.join(__dirname, '../firebase-service-account.json'),
  path.join(process.env.HOME || '~', '.firebase', 'service-account.json'),
]

let serviceAccount = null
for (const filePath of serviceAccountPaths) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`Found service account at ${filePath}`)
      serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      break
    }
  } catch (error) {
    console.log(`Could not find service account at ${filePath}`)
  }
}

if (!serviceAccount) {
  console.error(
    'Could not find service account file. Please download it from Firebase Console.'
  )
  console.error(
    'Place it in the root directory of your project as service-account.json'
  )
  process.exit(1)
}

// Initialize Firebase
initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

async function checkJobs() {
  console.log('Checking jobs collection...')

  try {
    const jobsSnapshot = await db.collection('jobs').limit(5).get()

    if (jobsSnapshot.empty) {
      console.log('No jobs found in the database')
    } else {
      console.log(`Found ${jobsSnapshot.size} jobs:`)
      jobsSnapshot.forEach((doc) => {
        const job = doc.data()
        console.log(`\nJob ID: ${doc.id}`)
        console.log(`Title: ${job.title}`)
        console.log(`Status: ${job.status}`)
        console.log(`Assigned Staff ID: ${job.assignedStaffId}`)
        console.log(`User ID: ${job.userId || 'Not specified'}`)
      })
    }
  } catch (error) {
    console.error('Error getting jobs:', error)
  }
}

async function checkStaffAccounts() {
  console.log('\nChecking staff_accounts collection...')

  try {
    const staffSnapshot = await db.collection('staff_accounts').limit(5).get()

    if (staffSnapshot.empty) {
      console.log('No staff accounts found in the database')
    } else {
      console.log(`Found ${staffSnapshot.size} staff accounts:`)
      staffSnapshot.forEach((doc) => {
        const staff = doc.data()
        console.log(`\nStaff ID: ${doc.id}`)
        console.log(`Name: ${staff.name || 'Not specified'}`)
        console.log(`Email: ${staff.email || 'Not specified'}`)
        console.log(`User ID: ${staff.userId || 'Not specified'}`)
        console.log(`Is Active: ${staff.isActive === true ? 'Yes' : 'No'}`)
      })
    }
  } catch (error) {
    console.error('Error getting staff accounts:', error)
  }
}

async function checkNotifications() {
  console.log('\nChecking staff_notifications collection...')

  try {
    const notificationsSnapshot = await db
      .collection('staff_notifications')
      .limit(5)
      .get()

    if (notificationsSnapshot.empty) {
      console.log('No staff notifications found in the database')
    } else {
      console.log(`Found ${notificationsSnapshot.size} notifications:`)
      notificationsSnapshot.forEach((doc) => {
        const notification = doc.data()
        console.log(`\nNotification ID: ${doc.id}`)
        console.log(`Type: ${notification.type || 'Not specified'}`)
        console.log(`Job ID: ${notification.jobId || 'Not specified'}`)
        console.log(`Staff ID: ${notification.staffId || 'Not specified'}`)
        console.log(`User ID: ${notification.userId || 'Not specified'}`)
        console.log(`Status: ${notification.status || 'Not specified'}`)
      })
    }
  } catch (error) {
    console.error('Error getting notifications:', error)
  }
}

// Run all checks
async function runAllChecks() {
  await checkStaffAccounts()
  await checkJobs()
  await checkNotifications()
}

runAllChecks().catch(console.error)
