/**
 * Admin Jobs API Route
 * Handles CRUD operations for job management
 */

import { NextRequest, NextResponse } from 'next/server'
import JobAssignmentService from '@/services/JobAssignmentService'

/**
 * GET /api/admin/jobs
 * Get all jobs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication is handled by middleware
    console.log('📋 Jobs API: Getting all jobs...')

    const { searchParams } = new URL(request.url)

    // Add debug parameter to list all jobs for debugging
    const debug = searchParams.get('debug') === 'true'
    const cleanup = searchParams.get('cleanup') === 'true'

    if (debug) {
      console.log('🔍 DEBUG MODE: Listing all jobs in Firebase...')
      const { getDb } = await import('@/lib/firebase')
      const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore')

      const db = getDb()
      const jobsRef = collection(db, 'jobs')
      const snapshot = await getDocs(jobsRef)

      const allJobs: any[] = []
      let cleanupCount = 0

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data()
        const firebaseId = docSnapshot.id
        const customId = data.id

        allJobs.push({
          firebaseId: firebaseId,
          customId: customId || 'NO_CUSTOM_ID',
          title: data.title || 'NO_TITLE',
          status: data.status || 'NO_STATUS',
          createdAt: data.createdAt || 'NO_CREATED_AT'
        })

        // Cleanup: Remove custom 'id' field if it exists and is different from Firebase ID
        if (cleanup && customId && customId !== firebaseId) {
          console.log(`🧹 Cleaning up job ${firebaseId}: removing custom ID '${customId}'`)
          const jobRef = doc(db, 'jobs', firebaseId)
          const { id, ...cleanData } = data // Remove the 'id' field
          await updateDoc(jobRef, cleanData)
          cleanupCount++
        }
      }

      console.log(`🔍 Found ${allJobs.length} jobs in Firebase:`)
      allJobs.forEach(job => {
        console.log(`  - Firebase ID: ${job.firebaseId}, Custom ID: ${job.customId}, Title: ${job.title}`)
      })

      if (cleanup) {
        console.log(`🧹 Cleaned up ${cleanupCount} jobs`)
      }

      return NextResponse.json({
        success: true,
        debug: true,
        cleanup: cleanup,
        cleanupCount: cleanupCount,
        jobs: allJobs,
        count: allJobs.length
      })
    }

    // Parse filters from query parameters
    const filters: any = {}
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }
    
    if (searchParams.get('staffId')) {
      filters.staffId = searchParams.get('staffId')
    }
    
    if (searchParams.get('dateRange')) {
      const dateRange = searchParams.get('dateRange')
      if (dateRange) {
        const [start, end] = dateRange.split(',')
        filters.dateRange = { start, end }
      }
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!)
    }

    console.log('📋 Getting jobs with filters:', filters)

    // Get jobs from service
    const result = await JobAssignmentService.getJobs(filters)

    if (result.success) {
      console.log(`✅ Retrieved ${result.jobs?.length || 0} jobs`)
      return NextResponse.json({
        success: true,
        jobs: result.jobs || [],
        count: result.jobs?.length || 0
      })
    } else {
      console.error('❌ Error getting jobs:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get jobs' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error in GET /api/admin/jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/jobs
 * Create a new job manually (not tied to booking)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication is handled by middleware
    console.log('🔧 Jobs API: Creating new job...')

    const body = await request.json()
    const { jobData, createdBy } = body

    // Validate required fields
    if (!jobData || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: jobData, createdBy' },
        { status: 400 }
      )
    }

    console.log('🔧 Creating manual job:', jobData.title)

    // Create job directly using the service's createJob method
    // Note: Don't set a custom 'id' field - Firebase will generate the document ID
    const jobDetails = {
      jobType: jobData.jobType,
      title: jobData.title,
      description: jobData.description,
      priority: jobData.priority,
      estimatedDuration: jobData.estimatedDuration,
      scheduledDate: jobData.scheduledDate,
      scheduledStartTime: jobData.scheduledStartTime,
      deadline: jobData.deadline,
      specialInstructions: jobData.specialInstructions,
      requiredSkills: jobData.requiredSkills || [],
      requiredSupplies: jobData.requiredSupplies || [],
      propertyId: jobData.propertyId,
      assignedStaffId: jobData.assignedStaffId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      isManualJob: true, // Flag to indicate this is a manually created job
      relatedBookingId: null // No booking associated with manual jobs
    }

    // Create the job directly in Firebase
    const result = await JobAssignmentService.createManualJob(jobDetails, createdBy)

    if (result.success) {
      console.log('✅ Manual job created successfully:', result.jobId)
      return NextResponse.json({
        success: true,
        jobId: result.jobId,
        message: 'Job created successfully'
      })
    } else {
      console.error('❌ Error creating manual job:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create job' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error in POST /api/admin/jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
