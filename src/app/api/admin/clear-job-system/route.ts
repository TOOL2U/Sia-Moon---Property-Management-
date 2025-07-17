import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore'

/**
 * DELETE /api/admin/clear-job-system
 * Clear all job-related data for complete fresh start
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ ADMIN: Clearing entire job system for fresh start...')
    
    const db = getDb()
    const results = {
      jobs: 0,
      taskAssignments: 0,
      staffTasks: 0,
      jobNotifications: 0
    }
    
    // Clear jobs collection
    console.log('📋 Clearing jobs collection...')
    const jobsSnapshot = await getDocs(collection(db, 'jobs'))
    if (!jobsSnapshot.empty) {
      const jobsBatch = writeBatch(db)
      jobsSnapshot.docs.forEach((jobDoc) => {
        jobsBatch.delete(doc(db, 'jobs', jobDoc.id))
        results.jobs++
      })
      await jobsBatch.commit()
      console.log(`✅ Deleted ${results.jobs} jobs`)
    }
    
    // Clear task_assignments collection
    console.log('📋 Clearing task_assignments collection...')
    const assignmentsSnapshot = await getDocs(collection(db, 'task_assignments'))
    if (!assignmentsSnapshot.empty) {
      const assignmentsBatch = writeBatch(db)
      assignmentsSnapshot.docs.forEach((assignmentDoc) => {
        assignmentsBatch.delete(doc(db, 'task_assignments', assignmentDoc.id))
        results.taskAssignments++
      })
      await assignmentsBatch.commit()
      console.log(`✅ Deleted ${results.taskAssignments} task assignments`)
    }
    
    // Clear staff_tasks collection
    console.log('📋 Clearing staff_tasks collection...')
    const staffTasksSnapshot = await getDocs(collection(db, 'staff_tasks'))
    if (!staffTasksSnapshot.empty) {
      const staffTasksBatch = writeBatch(db)
      staffTasksSnapshot.docs.forEach((taskDoc) => {
        staffTasksBatch.delete(doc(db, 'staff_tasks', taskDoc.id))
        results.staffTasks++
      })
      await staffTasksBatch.commit()
      console.log(`✅ Deleted ${results.staffTasks} staff tasks`)
    }
    
    // Clear job-related notifications
    console.log('📋 Clearing job notifications...')
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('type', 'in', ['job_assigned', 'job_completed', 'job_updated'])
      )
      const notificationsSnapshot = await getDocs(notificationsQuery)
      if (!notificationsSnapshot.empty) {
        const notificationsBatch = writeBatch(db)
        notificationsSnapshot.docs.forEach((notificationDoc) => {
          notificationsBatch.delete(doc(db, 'notifications', notificationDoc.id))
          results.jobNotifications++
        })
        await notificationsBatch.commit()
        console.log(`✅ Deleted ${results.jobNotifications} job notifications`)
      }
    } catch (error) {
      console.log('ℹ️ No notifications collection or job notifications found')
    }
    
    const totalDeleted = results.jobs + results.taskAssignments + results.staffTasks + results.jobNotifications
    
    console.log('🎉 Job system cleared successfully!')
    console.log('📊 Summary:', results)
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared entire job system - ${totalDeleted} total items deleted`,
      results,
      totalDeleted,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error clearing job system:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear job system',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/clear-job-system
 * Get count of all job-related data that would be deleted (preview)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 ADMIN: Getting job system data count for preview...')
    
    const db = getDb()
    const counts = {
      jobs: 0,
      taskAssignments: 0,
      staffTasks: 0,
      jobNotifications: 0
    }
    
    // Count jobs
    const jobsSnapshot = await getDocs(collection(db, 'jobs'))
    counts.jobs = jobsSnapshot.size
    
    // Count task assignments
    const assignmentsSnapshot = await getDocs(collection(db, 'task_assignments'))
    counts.taskAssignments = assignmentsSnapshot.size
    
    // Count staff tasks
    const staffTasksSnapshot = await getDocs(collection(db, 'staff_tasks'))
    counts.staffTasks = staffTasksSnapshot.size
    
    // Count job notifications
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('type', 'in', ['job_assigned', 'job_completed', 'job_updated'])
      )
      const notificationsSnapshot = await getDocs(notificationsQuery)
      counts.jobNotifications = notificationsSnapshot.size
    } catch (error) {
      counts.jobNotifications = 0
    }
    
    const total = counts.jobs + counts.taskAssignments + counts.staffTasks + counts.jobNotifications
    
    console.log('📊 Job system data count:', counts)
    
    return NextResponse.json({
      success: true,
      counts,
      total,
      message: `Found ${total} total job-related items that would be deleted`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error getting job system count:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job system count',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
