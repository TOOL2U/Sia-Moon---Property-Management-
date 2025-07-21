#!/usr/bin/env node

/**
 * 🧹 Calendar Collection Cleanup Script
 * 
 * This script helps clean up the old 'calendar_events' collection
 * and migrate any important data to the correct 'calendarEvents' collection
 */

const admin = require('firebase-admin')
const path = require('path')

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json')
  
  try {
    const serviceAccount = require(serviceAccountPath)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    })
    console.log('✅ Firebase Admin initialized')
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message)
    console.log('📝 Make sure you have firebase-service-account.json in the project root')
    process.exit(1)
  }
}

const db = admin.firestore()

async function cleanupCalendarCollections() {
  console.log('🧹 Calendar Collection Cleanup')
  console.log('=' .repeat(50))
  
  try {
    // 1. Check old collection
    console.log('🔍 Checking old calendar_events collection...')
    const oldCollectionRef = db.collection('calendar_events')
    const oldSnapshot = await oldCollectionRef.get()
    
    console.log(`📊 Found ${oldSnapshot.size} documents in calendar_events`)
    
    if (oldSnapshot.size === 0) {
      console.log('✅ No documents found in calendar_events - nothing to clean up!')
      return
    }
    
    // 2. Check new collection
    console.log('🔍 Checking current calendarEvents collection...')
    const newCollectionRef = db.collection('calendarEvents')
    const newSnapshot = await newCollectionRef.get()
    
    console.log(`📊 Found ${newSnapshot.size} documents in calendarEvents`)
    
    // 3. Show sample data from old collection
    console.log('\n📋 Sample data from calendar_events:')
    let sampleCount = 0
    oldSnapshot.forEach((doc) => {
      if (sampleCount < 3) {
        const data = doc.data()
        console.log(`   ${doc.id}: ${data.title || 'No title'} (${data.startDate || data.start || 'No date'})`)
        sampleCount++
      }
    })
    
    // 4. Ask for confirmation
    console.log('\n⚠️  CLEANUP OPTIONS:')
    console.log('   1. Delete all documents in calendar_events (recommended)')
    console.log('   2. Show detailed analysis first')
    console.log('   3. Cancel cleanup')
    
    // For now, just show the analysis
    console.log('\n📊 ANALYSIS COMPLETE')
    console.log('=' .repeat(50))
    console.log(`Old collection (calendar_events): ${oldSnapshot.size} documents`)
    console.log(`New collection (calendarEvents): ${newSnapshot.size} documents`)
    console.log('\n✅ RECOMMENDATION:')
    console.log('   • Keep: calendarEvents (correct collection)')
    console.log('   • Remove: calendar_events (old collection)')
    console.log('\n🔧 TO CLEAN UP:')
    console.log('   Run this script with --delete flag to remove old collection')
    console.log('   Example: node scripts/cleanup-old-calendar-collection.js --delete')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

async function deleteOldCollection() {
  console.log('🗑️  DELETING OLD COLLECTION')
  console.log('=' .repeat(50))
  
  try {
    const oldCollectionRef = db.collection('calendar_events')
    const snapshot = await oldCollectionRef.get()
    
    if (snapshot.size === 0) {
      console.log('✅ Collection is already empty!')
      return
    }
    
    console.log(`🗑️  Deleting ${snapshot.size} documents...`)
    
    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    console.log('✅ Successfully deleted all documents from calendar_events')
    
  } catch (error) {
    console.error('❌ Error deleting collection:', error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--delete')) {
    await deleteOldCollection()
  } else {
    await cleanupCalendarCollections()
  }
  
  process.exit(0)
}

main().catch(console.error)
