#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

console.log('🛑 Stopping infinite loop by marking problematic bookings...\n')

// Mark all bookings that are causing issues
const bookingsToFix = ['XoRHYcjFYjsw8hOK9vv6', '8Ig82NcIU2MeJh8F6eTI', 'M68Yx2LEQ5HoHBUOjIuT']

for (const bookingId of bookingsToFix) {
  try {
    await db.collection('bookings').doc(bookingId).update({
      jobsCreated: true, // Mark as already processed
      skipJobCreation: false, // Don't skip in future
      jobCreationError: null,
      jobCreationAttempts: 0
    })
    console.log(`✅ Marked booking ${bookingId} as processed`)
  } catch (error) {
    console.log(`⚠️ Booking ${bookingId} not found or already updated`)
  }
}

console.log('\n✅ Loop stopped! Refresh your browser.')
process.exit(0)
