#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

const propertyId = 'IPpRUm3DuvmiYFBvWzpy'

console.log('🔧 Updating property with Google Maps link...\n')

// Add Google Maps link to property
await db.collection('properties').doc(propertyId).update({
  googleMapsLink: 'https://maps.google.com/?q=Beach+Villa+Sunset+Phuket',
  mapsLink: 'https://maps.google.com/?q=Beach+Villa+Sunset+Phuket',
  address: '123 Beach Road, Patong, Phuket, Thailand',
  latitude: 7.8804,
  longitude: 98.3923,
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
})

console.log('✅ Property updated with Google Maps link!')
console.log('   Property ID:', propertyId)
console.log('   Maps Link: https://maps.google.com/?q=Beach+Villa+Sunset+Phuket')
console.log('')
console.log('Now retry the booking by updating its jobCreationError field...')
console.log('')

// Reset the booking to retry job creation
await db.collection('bookings').doc('M68Yx2LEQ5HoHBUOjIuT').update({
  jobCreationError: admin.firestore.FieldValue.delete(),
  jobCreationAttempts: 0,
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
})

console.log('✅ Booking reset - automation will retry on next detection')
console.log('')
console.log('The automation service should detect this change and create jobs!')
console.log('Check the browser console for: "📋 approved booking detected"')

process.exit(0)
