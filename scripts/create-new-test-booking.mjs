#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

console.log('🎫 Creating New Test Booking...\n')

const booking = {
  guestName: 'Michael Test Guest 2',
  guestEmail: 'michael.test2@example.com',
  guestPhone: '+1234567891',
  guestCount: 2,
  checkInDate: admin.firestore.Timestamp.fromDate(new Date('2026-01-25T15:00:00')),
  checkOutDate: admin.firestore.Timestamp.fromDate(new Date('2026-01-28T11:00:00')),
  propertyId: 'IPpRUm3DuvmiYFBvWzpy',
  propertyName: 'Beach Villa Sunset',
  totalPrice: 900,
  status: 'confirmed',
  bookingSource: 'direct-test',
  specialRequests: 'Test booking for calendar integration',
  paymentStatus: 'paid',
  nights: 3,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}

console.log('Creating booking with details:')
console.log('  Guest:', booking.guestName)
console.log('  Email:', booking.guestEmail)
console.log('  Check-in: Jan 25, 2026 3:00 PM')
console.log('  Check-out: Jan 28, 2026 11:00 AM')
console.log('  Property:', booking.propertyName)
console.log('  Nights:', booking.nights)
console.log('  Status:', booking.status)
console.log('')

const bookingRef = await db.collection('bookings').add(booking)
console.log('✅ Booking created successfully!')
console.log('   Booking ID:', bookingRef.id)
console.log('')
console.log('⏳ Waiting 3 seconds for automatic job creation...')
console.log('')

await new Promise(resolve => setTimeout(resolve, 3000))

// Check if jobs were created
const jobsSnapshot = await db.collection('operational_jobs')
  .where('bookingId', '==', bookingRef.id)
  .get()

console.log(`📋 Jobs created: ${jobsSnapshot.size}`)
jobsSnapshot.docs.forEach(doc => {
  const job = doc.data()
  console.log(`   - ${job.title || job.jobType}`)
  console.log(`     ID: ${doc.id}`)
  console.log(`     Type: ${job.jobType}`)
  console.log(`     Scheduled: ${job.scheduledFor?.toDate().toISOString()}`)
})

console.log('')
console.log('🎉 Test complete! Check the calendar at http://localhost:3000/calendar')

process.exit(0)
