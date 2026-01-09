#!/usr/bin/env node

/**
 * Check Jobs using Admin SDK
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://siamoonpm.firebaseio.com'
})

const db = admin.firestore()

console.log('═══════════════════════════════════════════════════')
console.log('🔍 CHECKING JOBS USING ADMIN SDK')
console.log('═══════════════════════════════════════════════════')
console.log()

async function checkJobs() {
  try {
    // Check operational_jobs collection
    console.log('📂 Checking operational_jobs collection...')
    const operationalJobsSnapshot = await db.collection('operational_jobs')
      .orderBy('createdAt', 'desc')
      .get()
    
    console.log(`   Total: ${operationalJobsSnapshot.size} document(s)`)
    console.log()
    
    if (operationalJobsSnapshot.size === 0) {
      console.log('   ❌ No jobs found in operational_jobs collection')
    } else {
      console.log('   📋 Jobs found:')
      console.log()
      
      operationalJobsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ${data.title || data.type || 'Unknown Job'}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Type: ${data.type || 'Unknown'}`)
        console.log(`      Status: ${data.status || 'Unknown'}`)
        console.log(`      Booking ID: ${data.bookingId || 'None'}`)
        console.log(`      Property ID: ${data.propertyId || 'None'}`)
        console.log(`      Assigned To: ${data.assignedTo || 'Unassigned'}`)
        console.log(`      Scheduled For: ${data.scheduledFor?.toDate?.()?.toISOString() || 'Not scheduled'}`)
        console.log(`      Duration: ${data.estimatedDuration || data.duration || 'Unknown'} minutes`)
        console.log(`      Price: $${data.price || 0}`)
        console.log(`      Broadcast: ${data.broadcastToAll ? 'Yes' : 'No'}`)
        console.log(`      Required Role: ${data.requiredRole || 'None'}`)
        console.log(`      Created: ${data.createdAt?.toDate?.()?.toISOString() || 'Unknown'}`)
        console.log()
      })
    }
    
    // Also check jobs collection
    console.log('📂 Checking jobs collection...')
    const jobsSnapshot = await db.collection('jobs').get()
    console.log(`   Total: ${jobsSnapshot.size} document(s)`)
    console.log()
    
    if (jobsSnapshot.size > 0) {
      console.log('   📋 Jobs found in jobs collection:')
      console.log()
      
      jobsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`   ${index + 1}. ${data.title || data.type || 'Unknown Job'}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      Type: ${data.type || 'Unknown'}`)
        console.log(`      Status: ${data.status || 'Unknown'}`)
        console.log(`      Booking ID: ${data.bookingId || 'None'}`)
        console.log()
      })
    }
    
    // Check job_offers collection
    console.log('📂 Checking job_offers collection...')
    const offersSnapshot = await db.collection('job_offers').get()
    console.log(`   Total: ${offersSnapshot.size} document(s)`)
    console.log()
    
    console.log('═══════════════════════════════════════════════════')
    console.log('📊 SUMMARY')
    console.log('═══════════════════════════════════════════════════')
    console.log()
    console.log(`   operational_jobs: ${operationalJobsSnapshot.size} jobs`)
    console.log(`   jobs: ${jobsSnapshot.size} jobs`)
    console.log(`   job_offers: ${offersSnapshot.size} offers`)
    console.log(`   Total: ${operationalJobsSnapshot.size + jobsSnapshot.size} jobs`)
    console.log()
    
    if (operationalJobsSnapshot.size === 2) {
      console.log('✅ CORRECT: You have 2 jobs for the test booking')
      console.log('   - Pre-Arrival Cleaning')
      console.log('   - Post-Checkout Cleaning')
    }
    
  } catch (error) {
    console.error('❌ Error checking jobs:', error)
  }
  
  process.exit(0)
}

checkJobs()
