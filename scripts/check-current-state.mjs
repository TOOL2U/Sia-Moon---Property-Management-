#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

console.log('📊 Current Database State\n')

// Check bookings
const bookingsSnapshot = await db.collection('bookings').get()
console.log(`Bookings: ${bookingsSnapshot.size}`)
bookingsSnapshot.docs.forEach(doc => {
  const data = doc.data()
  console.log(`  - ${data.guestName} (${data.status})`)
})
console.log('')

// Check jobs
const jobsSnapshot = await db.collection('operational_jobs').get()
console.log(`Jobs: ${jobsSnapshot.size}`)
jobsSnapshot.docs.forEach(doc => {
  const data = doc.data()
  console.log(`  - ${data.title || data.jobType} (${data.status})`)
})

process.exit(0)
