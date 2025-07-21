import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore'

/**
 * 🧹 Test Data Cleanup API
 * 
 * This API endpoint removes all test data from Firestore collections
 * to reset the system to a clean state for production-ready workflow testing.
 */

// Collections to clean up
const COLLECTIONS_TO_CLEANUP = [
  'pending_bookings',
  'job_assignments', 
  'calendarEvents',
  'ai_action_logs'
]

async function analyzeCollection(collectionName: string) {
  try {
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(collectionRef)
    
    const sampleDocs: any[] = []
    let sampleCount = 0
    
    snapshot.forEach((docSnap) => {
      if (sampleCount < 3) {
        const data = docSnap.data()
        sampleDocs.push({
          id: docSnap.id,
          title: data.title || data.guestName || data.type || 'Unknown',
          date: data.createdAt?.toDate?.()?.toISOString() || 
                data.checkInDate || 
                data.startDate || 
                'No date'
        })
        sampleCount++
      }
    })
    
    return {
      count: snapshot.size,
      sampleDocs
    }
  } catch (error) {
    console.error(`Error analyzing ${collectionName}:`, error)
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function cleanupCollection(collectionName: string) {
  try {
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(collectionRef)
    
    if (snapshot.empty) {
      return { deleted: 0, errors: 0 }
    }
    
    // Delete in batches (Firestore batch limit is 500)
    const batchSize = 500
    let totalDeleted = 0
    let totalErrors = 0
    
    const docs = snapshot.docs
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchDocs = docs.slice(i, i + batchSize)
      
      batchDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref)
      })
      
      try {
        await batch.commit()
        totalDeleted += batchDocs.length
      } catch (error) {
        console.error(`Error deleting batch from ${collectionName}:`, error)
        totalErrors += batchDocs.length
      }
    }
    
    return { deleted: totalDeleted, errors: totalErrors }
  } catch (error) {
    console.error(`Error cleaning ${collectionName}:`, error)
    return { deleted: 0, errors: 1 }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Analyzing test data...')
    
    const analysis: Record<string, any> = {}
    
    for (const collectionName of COLLECTIONS_TO_CLEANUP) {
      analysis[collectionName] = await analyzeCollection(collectionName)
    }
    
    const totalDocs = Object.values(analysis).reduce((sum: number, data: any) => sum + (data.count || 0), 0)
    
    return NextResponse.json({
      success: true,
      message: 'Test data analysis complete',
      analysis,
      totalDocuments: totalDocs,
      collectionsToCleanup: COLLECTIONS_TO_CLEANUP
    })
    
  } catch (error) {
    console.error('Error analyzing test data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Starting test data cleanup...')
    
    const results: Record<string, any> = {}
    
    for (const collectionName of COLLECTIONS_TO_CLEANUP) {
      console.log(`Cleaning up ${collectionName}...`)
      results[collectionName] = await cleanupCollection(collectionName)
    }
    
    const totalDeleted = Object.values(results).reduce((sum: number, result: any) => sum + (result.deleted || 0), 0)
    const totalErrors = Object.values(results).reduce((sum: number, result: any) => sum + (result.errors || 0), 0)
    
    console.log(`✅ Cleanup complete: ${totalDeleted} documents deleted, ${totalErrors} errors`)
    
    return NextResponse.json({
      success: true,
      message: 'Test data cleanup complete',
      results,
      summary: {
        totalDeleted,
        totalErrors
      }
    })
    
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
