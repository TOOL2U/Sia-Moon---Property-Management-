#!/usr/bin/env node

/**
 * Test onSnapshot Real-Time Listener
 * Verifies Firebase real-time listeners are working correctly
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBc5H67-tqhYJrgM76cIIEtKm1RLVBLQr4",
  authDomain: "siamoonpm.firebaseapp.com",
  projectId: "siamoonpm",
  storageBucket: "siamoonpm.firebasestorage.app",
  messagingSenderId: "1043326394032",
  appId: "1:1043326394032:web:0cb96925d5a98c73cac3ca"
}

console.log('═══════════════════════════════════════════════════')
console.log('🔍 TESTING FIREBASE ONSNAPSHOT LISTENER')
console.log('═══════════════════════════════════════════════════')
console.log()

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log('✅ Firebase initialized')
console.log('📡 Setting up real-time listener on bookings collection...')
console.log()

// Set up real-time listener
const bookingsRef = collection(db, 'bookings')
const bookingsQuery = query(bookingsRef, orderBy('createdAt', 'desc'))

let updateCount = 0

const unsubscribe = onSnapshot(
  bookingsQuery,
  (snapshot) => {
    updateCount++
    console.log(`🔔 Real-time update #${updateCount} received!`)
    console.log(`📊 Total bookings: ${snapshot.size}`)
    console.log()
    
    if (snapshot.size === 0) {
      console.log('❌ No bookings found in snapshot')
      console.log('⚠️  This might indicate:')
      console.log('   1. Collection is empty')
      console.log('   2. Firebase rules blocking read access')
      console.log('   3. Wrong collection name')
    } else {
      console.log('📋 Bookings found:')
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ${data.guestName || data.guest_name || 'Unknown Guest'}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Status: ${data.status}`)
        console.log(`      Property: ${data.propertyName || data.property}`)
        console.log(`      Check-in: ${data.checkInDate || data.checkIn || data.check_in}`)
        console.log()
      })
    }
    
    console.log('═══════════════════════════════════════════════════')
    console.log('✅ LISTENER TEST COMPLETE')
    console.log('═══════════════════════════════════════════════════')
    console.log()
    console.log('🎯 Result:', snapshot.size > 0 ? 'WORKING ✅' : 'NO DATA ❌')
    console.log()
    console.log('Press Ctrl+C to stop listening...')
  },
  (error) => {
    console.error('❌ ERROR in onSnapshot listener:')
    console.error(error)
    console.log()
    console.log('Common causes:')
    console.log('   1. Firebase rules denying read access')
    console.log('   2. Invalid query/collection path')
    console.log('   3. Network connectivity issues')
    process.exit(1)
  }
)

// Keep script running
console.log('⏳ Waiting for initial snapshot...')
console.log()

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🔌 Cleaning up listener...')
  unsubscribe()
  process.exit(0)
})
