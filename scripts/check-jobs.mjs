#!/usr/bin/env node

/**
 * Check Jobs in operational_jobs Collection
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBc5H67-tqhYJrgM76cIIEtKm1RLVBLQr4",
  authDomain: "siamoonpm.firebaseapp.com",
  projectId: "siamoonpm",
  storageBucket: "siamoonpm.firebasestorage.app",
  messagingSenderId: "1043326394032",
  appId: "1:1043326394032:web:0cb96925d5a98c73cac3ca"
}

console.log('═══════════════════════════════════════════════════')
console.log('🔍 CHECKING JOBS IN OPERATIONAL_JOBS COLLECTION')
console.log('═══════════════════════════════════════════════════')
console.log()

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkJobs() {
  try {
    // Check operational_jobs collection
    console.log('📂 Checking operational_jobs collection...')
    const jobsQuery = query(collection(db, 'operational_jobs'), orderBy('createdAt', 'desc'))
    const jobsSnapshot = await getDocs(jobsQuery)
    
    console.log(`   Total: ${jobsSnapshot.size} document(s)`)
    console.log()
    
    if (jobsSnapshot.size === 0) {
      console.log('   ❌ No jobs found in operational_jobs collection')
    } else {
      console.log('   📋 Jobs found:')
      console.log()
      
      jobsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ${data.title || data.type || 'Unknown Job'}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Type: ${data.type || 'Unknown'}`)
        console.log(`      Status: ${data.status || 'Unknown'}`)
        console.log(`      Booking ID: ${data.bookingId || 'None'}`)
        console.log(`      Property ID: ${data.propertyId || 'None'}`)
        console.log(`      Assigned To: ${data.assignedTo || 'Unassigned'}`)
        console.log(`      Scheduled For: ${data.scheduledFor || 'Not scheduled'}`)
        console.log(`      Duration: ${data.estimatedDuration || data.duration || 'Unknown'} minutes`)
        console.log(`      Price: $${data.price || 0}`)
        console.log(`      Created: ${data.createdAt?.toDate?.()?.toISOString() || 'Unknown'}`)
        console.log()
      })
    }
    
    // Also check jobs collection (if it exists)
    console.log('📂 Checking jobs collection...')
    const altJobsSnapshot = await getDocs(collection(db, 'jobs'))
    console.log(`   Total: ${altJobsSnapshot.size} document(s)`)
    
    if (altJobsSnapshot.size > 0) {
      console.log('   📋 Jobs found in jobs collection:')
      console.log()
      
      altJobsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ${data.title || data.type || 'Unknown Job'}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Type: ${data.type || 'Unknown'}`)
        console.log(`      Status: ${data.status || 'Unknown'}`)
        console.log()
      })
    }
    
    console.log('═══════════════════════════════════════════════════')
    console.log('📊 SUMMARY')
    console.log('═══════════════════════════════════════════════════')
    console.log()
    console.log(`   operational_jobs: ${jobsSnapshot.size} jobs`)
    console.log(`   jobs: ${altJobsSnapshot.size} jobs`)
    console.log(`   Total: ${jobsSnapshot.size + altJobsSnapshot.size} jobs`)
    console.log()
    
  } catch (error) {
    console.error('❌ Error checking jobs:', error)
  }
  
  process.exit(0)
}

checkJobs()
