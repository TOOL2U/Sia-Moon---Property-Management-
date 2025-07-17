import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore'

/**
 * DELETE /api/admin/clear-jobs
 * Clear all jobs from the jobs collection for fresh testing
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ ADMIN: Clearing all jobs from Firebase...')
    
    const db = getDb()
    const jobsCollection = collection(db, 'jobs')
    
    // Get all jobs
    const jobsSnapshot = await getDocs(jobsCollection)
    
    if (jobsSnapshot.empty) {
      console.log('ℹ️ No jobs found to delete')
      return NextResponse.json({
        success: true,
        message: 'No jobs found to delete',
        deletedCount: 0
      })
    }
    
    console.log(`📋 Found ${jobsSnapshot.size} jobs to delete`)
    
    // Use batch delete for better performance
    const batch = writeBatch(db)
    let deletedCount = 0
    
    jobsSnapshot.docs.forEach((jobDoc) => {
      batch.delete(doc(db, 'jobs', jobDoc.id))
      deletedCount++
      console.log(`🗑️ Queued for deletion: ${jobDoc.id}`)
    })
    
    // Commit the batch delete
    await batch.commit()
    
    console.log(`✅ Successfully deleted ${deletedCount} jobs`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${deletedCount} jobs from the system`,
      deletedCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error clearing jobs:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear jobs',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/clear-jobs
 * Get count of jobs that would be deleted (preview)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 ADMIN: Getting job count for preview...')
    
    const db = getDb()
    const jobsCollection = collection(db, 'jobs')
    
    // Get all jobs
    const jobsSnapshot = await getDocs(jobsCollection)
    
    console.log(`📊 Found ${jobsSnapshot.size} jobs in the system`)
    
    return NextResponse.json({
      success: true,
      jobCount: jobsSnapshot.size,
      message: `Found ${jobsSnapshot.size} jobs that would be deleted`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error getting job count:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job count',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
