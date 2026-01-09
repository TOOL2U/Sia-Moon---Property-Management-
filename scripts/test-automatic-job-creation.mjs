#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

console.log('🧪 Testing Automatic Job Creation\n')
console.log('═══════════════════════════════════════\n')

// Create a new booking with 'approved' status (should trigger automation)
const booking = {
  guestName: 'Automation Test Guest',
  guestEmail: 'automation@test.com',
  guestPhone: '+1234567892',
  guestCount: 3,
  checkInDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-15T15:00:00')),
  checkOutDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-20T11:00:00')),
  propertyId: 'IPpRUm3DuvmiYFBvWzpy',
  propertyName: 'Beach Villa Sunset',
  totalPrice: 1500,
  status: 'approved', // This status should trigger automatic job creation
  bookingSource: 'direct-automation-test',
  specialRequests: 'Testing automatic job creation system',
  paymentStatus: 'paid',
  nights: 5,
  jobsCreated: false, // Will be set to true by automation
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}

console.log('Creating APPROVED booking (should trigger automatic jobs):\n')
console.log('  Guest:', booking.guestName)
console.log('  Check-in: Feb 15, 2026 3:00 PM')
console.log('  Check-out: Feb 20, 2026 11:00 AM')
console.log('  Property:', booking.propertyName)
console.log('  Status:', booking.status, '← Should trigger AutomaticJobCreationService')
console.log('')

const bookingRef = await db.collection('bookings').add(booking)
console.log('✅ Booking created!')
console.log('   Booking ID:', bookingRef.id)
console.log('')
console.log('⏳ Waiting 5 seconds for AutomaticJobCreationService to detect and create jobs...')
console.log('   (The webapp must be running for this to work!)')
console.log('')

await new Promise(resolve => setTimeout(resolve, 5000))

// Check if jobs were created
const jobsSnapshot = await db.collection('operational_jobs')
  .where('bookingId', '==', bookingRef.id)
  .get()

console.log('═══════════════════════════════════════')
console.log('📊 RESULTS\n')

if (jobsSnapshot.size > 0) {
  console.log(`✅ SUCCESS! ${jobsSnapshot.size} job(s) created automatically:\n`)
  jobsSnapshot.docs.forEach((doc, index) => {
    const job = doc.data()
    console.log(`   ${index + 1}. ${job.title || job.jobType}`)
    console.log(`      ID: ${doc.id}`)
    console.log(`      Type: ${job.jobType}`)
    console.log(`      Status: ${job.status}`)
    console.log(`      Scheduled: ${job.scheduledFor?.toDate().toISOString()}`)
    console.log('')
  })
  
  // Check if booking was updated
  const bookingDoc = await db.collection('bookings').doc(bookingRef.id).get()
  const bookingData = bookingDoc.data()
  
  if (bookingData.jobsCreated) {
    console.log('✅ Booking marked as jobsCreated: true')
  } else {
    console.log('⚠️  Booking not yet marked as jobsCreated')
  }
  
  console.log('')
  console.log('🎉 AUTOMATION TEST PASSED!')
  console.log('   The AutomaticJobCreationService is working correctly!')
  
} else {
  console.log('❌ AUTOMATION TEST FAILED')
  console.log('   No jobs were created automatically.')
  console.log('')
  console.log('Possible reasons:')
  console.log('  1. The webapp is not running (http://localhost:3000)')
  console.log('  2. AutomaticJobCreationService is not initialized')
  console.log('  3. Service is watching different status values')
  console.log('  4. Firebase listener has permission issues')
  console.log('')
  console.log('Check browser console for logs like:')
  console.log('  "AutomaticJobCreationService.ts: Starting monitoring..."')
  console.log('  "approved booking detected: ' + bookingRef.id + '"')
}

console.log('')
console.log('To verify: Check http://localhost:3000/calendar and http://localhost:3000/jobs')

process.exit(jobsSnapshot.size > 0 ? 0 : 1)
