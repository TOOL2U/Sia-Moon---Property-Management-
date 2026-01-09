#!/usr/bin/env node

/**
 * Clean up duplicate jobs from 'jobs' collection
 * Keep only operational_jobs
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function cleanupDuplicateJobs() {
  try {
    console.log('🗑️  Cleaning up duplicate jobs from "jobs" collection...')
    
    const jobsSnapshot = await db.collection('jobs').get()
    
    if (jobsSnapshot.empty) {
      console.log('✅ No jobs to delete')
      return
    }
    
    console.log(`Found ${jobsSnapshot.size} jobs to delete`)
    
    const batch = db.batch()
    jobsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    console.log(`✅ Deleted ${jobsSnapshot.size} duplicate jobs`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
  
  process.exit(0)
}

cleanupDuplicateJobs()
