/**
 * Mobile Jobs API Endpoint
 * Optimized for mobile app synchronization with Firebase
 * Provides real-time job data for staff mobile applications
 */

import { NextRequest, NextResponse } from 'next/server'
import JobAssignmentService from '@/services/JobAssignmentService'

// Mobile API authentication headers
const MOBILE_API_KEY = 'sia-moon-mobile-app-2025-secure-key'
const MOBILE_SECRET = 'mobile-app-sync-2025-secure'

/**
 * Authenticate mobile app requests
 */
function authenticateMobileRequest(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  const mobileSecret = request.headers.get('X-Mobile-Secret')
  
  return apiKey === MOBILE_API_KEY && mobileSecret === MOBILE_SECRET
}

/**
 * GET /api/mobile/jobs
 * Get jobs for mobile app with optional staff filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate mobile request
    if (!authenticateMobileRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized mobile request' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    console.log('📱 Mobile jobs request:', { staffId, status, limit, includeCompleted })

    // Build filters for mobile optimization
    const filters: any = { limit }
    
    if (staffId) {
      filters.staffId = staffId
    }
    
    if (status) {
      filters.status = status as any
    }

    // Get jobs from service
    const result = await JobAssignmentService.getJobs(filters)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    let jobs = result.jobs || []

    // Filter out completed jobs unless specifically requested
    if (!includeCompleted) {
      jobs = jobs.filter(job => 
        job.status !== 'completed' && 
        job.status !== 'verified' && 
        job.status !== 'cancelled'
      )
    }

    // Optimize job data for mobile consumption
    const mobileOptimizedJobs = jobs.map(job => ({
      // Essential job data
      id: job.id,
      title: job.title,
      description: job.description,
      jobType: job.jobType,
      priority: job.priority,
      status: job.status,
      
      // Scheduling information
      scheduledDate: job.scheduledDate,
      scheduledStartTime: job.scheduledStartTime,
      scheduledEndTime: job.scheduledEndTime,
      estimatedDuration: job.estimatedDuration,
      deadline: job.deadline,
      
      // Property information (optimized)
      property: {
        id: job.propertyId,
        name: job.propertyRef.name,
        address: job.location.address,
        coordinates: job.location.coordinates,
        accessInstructions: job.location.accessInstructions,
        parkingInstructions: job.location.parkingInstructions
      },
      
      // Booking information (essential only)
      booking: {
        id: job.bookingId,
        guestName: job.bookingRef.guestName,
        guestCount: job.bookingRef.guestCount,
        checkInDate: job.bookingRef.checkInDate,
        checkOutDate: job.bookingRef.checkOutDate
      },
      
      // Staff assignment
      assignedStaffId: job.assignedStaffId,
      assignedAt: job.assignedAt,
      
      // Job requirements
      requiredSkills: job.requiredSkills,
      specialInstructions: job.specialInstructions,
      requiredSupplies: job.requiredSupplies,
      
      // Completion data
      completedAt: job.completedAt,
      completionPhotos: job.completionPhotos,
      completionNotes: job.completionNotes,
      
      // Mobile optimization
      mobileOptimized: job.mobileOptimized,
      lastSyncedAt: job.lastSyncedAt,
      syncVersion: job.syncVersion,
      
      // Timestamps
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }))

    console.log(`✅ Returning ${mobileOptimizedJobs.length} mobile-optimized jobs`)

    return NextResponse.json({
      success: true,
      data: {
        jobs: mobileOptimizedJobs,
        totalCount: mobileOptimizedJobs.length,
        filters: {
          staffId,
          status,
          includeCompleted
        },
        syncTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Mobile jobs API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch mobile jobs'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/mobile/jobs
 * Update job status from mobile app
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate mobile request
    if (!authenticateMobileRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized mobile request' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, status, notes, completionData, location } = body

    console.log('📱 Mobile job update request:', { jobId, status, notes })

    // Validate required fields
    if (!jobId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: jobId, status' },
        { status: 400 }
      )
    }

    // Prepare additional data for status update
    const additionalData: any = {}

    // Handle completion data
    if (status === 'completed' && completionData) {
      additionalData.completionPhotos = completionData.photos || []
      additionalData.completionNotes = completionData.notes || ''
    }

    // Handle location updates (for tracking)
    if (location) {
      additionalData.lastKnownLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString()
      }
    }

    // Update job status
    const result = await JobAssignmentService.updateJobStatus(
      jobId,
      status,
      'mobile_app', // Updated by mobile app
      notes,
      additionalData
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Job ${jobId} status updated to ${status} via mobile app`)

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        newStatus: status,
        updatedAt: new Date().toISOString()
      },
      message: 'Job status updated successfully'
    })

  } catch (error) {
    console.error('❌ Mobile job update API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update job status'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mobile/jobs/sync
 * Bulk sync endpoint for mobile app offline support
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate mobile request
    if (!authenticateMobileRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized mobile request' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { staffId, lastSyncTimestamp, pendingUpdates } = body

    console.log('📱 Mobile bulk sync request:', { staffId, lastSyncTimestamp, pendingUpdates: pendingUpdates?.length })

    // Process pending updates from mobile app
    const syncResults = []
    
    if (pendingUpdates && pendingUpdates.length > 0) {
      for (const update of pendingUpdates) {
        try {
          const result = await JobAssignmentService.updateJobStatus(
            update.jobId,
            update.status,
            'mobile_app',
            update.notes,
            update.additionalData
          )
          
          syncResults.push({
            jobId: update.jobId,
            success: result.success,
            error: result.error
          })
        } catch (error) {
          syncResults.push({
            jobId: update.jobId,
            success: false,
            error: error instanceof Error ? error.message : 'Update failed'
          })
        }
      }
    }

    // Get updated jobs for staff member
    const jobsResult = await JobAssignmentService.getJobs({
      staffId,
      limit: 100
    })

    const jobs = jobsResult.success ? jobsResult.jobs || [] : []

    // Filter jobs updated since last sync
    const updatedJobs = jobs.filter(job => {
      if (!lastSyncTimestamp) return true
      
      const jobUpdated = new Date(job.updatedAt as string)
      const lastSync = new Date(lastSyncTimestamp)
      
      return jobUpdated > lastSync
    })

    console.log(`✅ Mobile sync complete: ${syncResults.length} updates processed, ${updatedJobs.length} jobs updated`)

    return NextResponse.json({
      success: true,
      data: {
        syncResults,
        updatedJobs: updatedJobs.map(job => ({
          id: job.id,
          status: job.status,
          updatedAt: job.updatedAt,
          syncVersion: job.syncVersion
        })),
        syncTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Mobile sync API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed'
      },
      { status: 500 }
    )
  }
}
