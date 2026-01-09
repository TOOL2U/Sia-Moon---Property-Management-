#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

const bookingId = '8Ig82NcIU2MeJh8F6eTI'

console.log('🔧 Creating jobs for booking:', bookingId)
console.log('')

// Get booking details
const bookingDoc = await db.collection('bookings').doc(bookingId).get()
if (!bookingDoc.exists) {
  console.log('❌ Booking not found')
  process.exit(1)
}

const booking = bookingDoc.data()
console.log('Booking details:')
console.log('  Guest:', booking.guestName)
console.log('  Check-in:', booking.checkInDate.toDate().toISOString())
console.log('  Check-out:', booking.checkOutDate.toDate().toISOString())
console.log('  Property:', booking.propertyName)
console.log('')

// Create Pre-Arrival Cleaning Job
const checkInDate = booking.checkInDate.toDate()
const preArrivalDate = new Date(checkInDate)
preArrivalDate.setHours(8, 0, 0, 0) // 8 AM on check-in day

const preArrivalJob = {
  jobType: 'pre_arrival_cleaning',
  type: 'cleaning',
  category: 'cleaning',
  title: `Pre-Arrival Cleaning - ${booking.propertyName}`,
  description: `Prepare property for guest arrival on ${checkInDate.toLocaleDateString()}`,
  status: 'pending',
  priority: 'high',
  assignedStaffId: null,
  requiredRole: 'cleaner',
  requiredSkills: ['cleaning'],
  propertyId: booking.propertyId,
  propertyName: booking.propertyName,
  bookingId: bookingId,
  guestName: booking.guestName,
  scheduledFor: admin.firestore.Timestamp.fromDate(preArrivalDate),
  scheduledDate: admin.firestore.Timestamp.fromDate(preArrivalDate),
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  dueBy: booking.checkInDate,
  estimatedDuration: 120, // 2 hours
  requirements: {
    skills: ['cleaning'],
    equipment: ['cleaning supplies', 'vacuum']
  },
  createdBy: 'system',
  createdBySystem: true,
  source: 'booking_automation',
  isAutoCreated: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}

const preArrivalRef = await db.collection('operational_jobs').add(preArrivalJob)
console.log('✅ Pre-Arrival Cleaning Job created')
console.log('   ID:', preArrivalRef.id)
console.log('   Scheduled:', preArrivalDate.toISOString())
console.log('')

// Create Post-Checkout Cleaning Job
const checkOutDate = booking.checkOutDate.toDate()
const postCheckoutDate = new Date(checkOutDate)
postCheckoutDate.setHours(12, 0, 0, 0) // 12 PM on checkout day

const postCheckoutJob = {
  jobType: 'post_checkout_cleaning',
  type: 'cleaning',
  category: 'cleaning',
  title: `Post-Checkout Cleaning - ${booking.propertyName}`,
  description: `Clean property after guest checkout on ${checkOutDate.toLocaleDateString()}`,
  status: 'pending',
  priority: 'high',
  assignedStaffId: null,
  requiredRole: 'cleaner',
  requiredSkills: ['cleaning'],
  propertyId: booking.propertyId,
  propertyName: booking.propertyName,
  bookingId: bookingId,
  guestName: booking.guestName,
  scheduledFor: admin.firestore.Timestamp.fromDate(postCheckoutDate),
  scheduledDate: admin.firestore.Timestamp.fromDate(postCheckoutDate),
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  dueBy: admin.firestore.Timestamp.fromDate(postCheckoutDate),
  estimatedDuration: 150, // 2.5 hours
  requirements: {
    skills: ['cleaning'],
    equipment: ['cleaning supplies', 'vacuum', 'laundry']
  },
  createdBy: 'system',
  createdBySystem: true,
  source: 'booking_automation',
  isAutoCreated: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}

const postCheckoutRef = await db.collection('operational_jobs').add(postCheckoutJob)
console.log('✅ Post-Checkout Cleaning Job created')
console.log('   ID:', postCheckoutRef.id)
console.log('   Scheduled:', postCheckoutDate.toISOString())
console.log('')

console.log('🎉 All jobs created successfully!')
console.log('')
console.log('Check the calendar at: http://localhost:3000/calendar')
console.log('Check the jobs page at: http://localhost:3000/jobs')

process.exit(0)
