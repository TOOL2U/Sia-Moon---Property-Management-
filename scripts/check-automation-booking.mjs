#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

const bookingId = 'M68Yx2LEQ5HoHBUOjIuT'

console.log('🔍 Checking automation test booking...\n')

// Check booking
const bookingDoc = await db.collection('bookings').doc(bookingId).get()
if (!bookingDoc.exists) {
  console.log('❌ Booking not found')
  process.exit(1)
}

const booking = bookingDoc.data()
console.log('📋 Booking Status:')
console.log('  ID:', bookingId)
console.log('  Guest:', booking.guestName)
console.log('  Status:', booking.status)
console.log('  Jobs Created:', booking.jobsCreated || false)
console.log('  Job Creation Attempts:', booking.jobCreationAttempts || 0)
console.log('  Job Creation Error:', booking.jobCreationError || 'None')
console.log('')

// Check for jobs
const jobsSnapshot = await db.collection('operational_jobs')
  .where('bookingId', '==', bookingId)
  .get()

console.log(`📋 Jobs: ${jobsSnapshot.size} found`)
if (jobsSnapshot.size > 0) {
  jobsSnapshot.docs.forEach((doc, index) => {
    const job = doc.data()
    console.log(`  ${index + 1}. ${job.title || job.jobType}`)
    console.log(`     ID: ${doc.id}`)
    console.log(`     Status: ${job.status}`)
    console.log(`     Scheduled: ${job.scheduledFor?.toDate().toISOString()}`)
  })
} else {
  console.log('  ⚠️  No jobs found yet - automation may still be processing')
  console.log('     OR the webapp client SDK listener may have permission issues')
}

console.log('')
console.log('💡 TIP: Check the browser console at http://localhost:3000')
console.log('   Look for logs like:')
console.log('   "📋 approved booking detected: ' + bookingId + '"')

process.exit(0)
