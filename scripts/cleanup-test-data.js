#!/usr/bin/env node

/**
 * 🧹 Complete Test Data Cleanup Script
 * 
 * This script removes all test data from Firestore collections to reset
 * the system to a clean state for production-ready workflow testing.
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

// Collections to clean up
const COLLECTIONS_TO_CLEANUP = [
  'pending_bookings',
  'job_assignments', 
  'calendarEvents',
  'ai_action_logs'
]

async function cleanupCollection(collectionName) {
  console.log(`🧹 Cleaning up ${collectionName} collection...`)
  
  try {
    const collectionRef = db.collection(collectionName)
    const snapshot = await collectionRef.get()
    
    if (snapshot.empty) {
      console.log(`   ✅ ${collectionName} is already empty`)
      return { deleted: 0, errors: 0 }
    }
    
    console.log(`   📊 Found ${snapshot.size} documents to delete`)
    
    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500
    let totalDeleted = 0
    let totalErrors = 0
    
    while (true) {
      const batch = db.batch()
      const docs = await collectionRef.limit(batchSize).get()
      
      if (docs.empty) break
      
      docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      try {
        await batch.commit()
        totalDeleted += docs.size
        console.log(`   🗑️  Deleted ${docs.size} documents (${totalDeleted} total)`)
      } catch (error) {
        console.error(`   ❌ Error deleting batch:`, error.message)
        totalErrors += docs.size
      }
    }
    
    console.log(`   ✅ ${collectionName} cleanup complete: ${totalDeleted} deleted, ${totalErrors} errors`)
    return { deleted: totalDeleted, errors: totalErrors }
    
  } catch (error) {
    console.error(`   ❌ Error cleaning ${collectionName}:`, error.message)
    return { deleted: 0, errors: 1 }
  }
}

async function analyzeTestData() {
  console.log('🔍 ANALYZING TEST DATA')
  console.log('=' .repeat(50))
  
  const analysis = {}
  
  for (const collectionName of COLLECTIONS_TO_CLEANUP) {
    try {
      const snapshot = await db.collection(collectionName).get()
      analysis[collectionName] = {
        count: snapshot.size,
        sampleDocs: []
      }
      
      // Get sample documents
      let sampleCount = 0
      snapshot.forEach(doc => {
        if (sampleCount < 3) {
          const data = doc.data()
          analysis[collectionName].sampleDocs.push({
            id: doc.id,
            title: data.title || data.guestName || data.type || 'Unknown',
            date: data.createdAt || data.checkInDate || data.startDate || 'No date'
          })
          sampleCount++
        }
      })
      
      console.log(`📊 ${collectionName}: ${analysis[collectionName].count} documents`)
      analysis[collectionName].sampleDocs.forEach(sample => {
        console.log(`   • ${sample.id}: ${sample.title} (${sample.date})`)
      })
      
    } catch (error) {
      console.error(`❌ Error analyzing ${collectionName}:`, error.message)
      analysis[collectionName] = { count: 0, error: error.message }
    }
  }
  
  return analysis
}

async function performCleanup() {
  console.log('🧹 PERFORMING CLEANUP')
  console.log('=' .repeat(50))
  
  const results = {}
  
  for (const collectionName of COLLECTIONS_TO_CLEANUP) {
    results[collectionName] = await cleanupCollection(collectionName)
  }
  
  return results
}

async function main() {
  const args = process.argv.slice(2)
  
  console.log('🧹 FIRESTORE TEST DATA CLEANUP')
  console.log('=' .repeat(50))
  console.log('This script will clean up test data from the following collections:')
  COLLECTIONS_TO_CLEANUP.forEach(collection => {
    console.log(`   • ${collection}`)
  })
  console.log('')
  
  try {
    // Step 1: Analyze current data
    const analysis = await analyzeTestData()
    
    // Step 2: Check if cleanup is needed
    const totalDocs = Object.values(analysis).reduce((sum, data) => sum + (data.count || 0), 0)
    
    if (totalDocs === 0) {
      console.log('✅ All collections are already clean!')
      return
    }
    
    console.log(`\n📊 TOTAL DOCUMENTS TO CLEAN: ${totalDocs}`)
    
    // Step 3: Perform cleanup if requested
    if (args.includes('--execute')) {
      console.log('\n⚠️  EXECUTING CLEANUP...')
      const results = await performCleanup()
      
      console.log('\n📊 CLEANUP SUMMARY')
      console.log('=' .repeat(50))
      let totalDeleted = 0
      let totalErrors = 0
      
      Object.entries(results).forEach(([collection, result]) => {
        console.log(`${collection}: ${result.deleted} deleted, ${result.errors} errors`)
        totalDeleted += result.deleted
        totalErrors += result.errors
      })
      
      console.log(`\n✅ CLEANUP COMPLETE: ${totalDeleted} documents deleted, ${totalErrors} errors`)
      
    } else {
      console.log('\n💡 TO EXECUTE CLEANUP:')
      console.log('   node scripts/cleanup-test-data.js --execute')
      console.log('\n⚠️  This will permanently delete all test data!')
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

main().catch(console.error)
