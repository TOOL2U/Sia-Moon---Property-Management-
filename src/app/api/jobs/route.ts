/**
 * Job Management API - Phase 4
 * RESTful API for job operations with role enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import JobEngineService from '@/services/JobEngineService'
import { Job, JobQuery, JobStatusUpdate } from '@/types/job'

/**
 * GET /api/jobs
 * Get jobs with filtering and role enforcement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract user context from headers or session
    const userRole = searchParams.get('userRole')
    const staffId = searchParams.get('staffId')
    
    // Build query filters
    const filters: Partial<JobQuery> = {}
    
    if (searchParams.get('bookingId')) {
      filters.bookingId = searchParams.get('bookingId')!
    }
    
    if (searchParams.get('jobType')) {
      filters.jobType = searchParams.get('jobType') as Job['jobType']
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as Job['status']
    }
    
    if (searchParams.get('assignedStaffId')) {
      filters.assignedStaffId = searchParams.get('assignedStaffId')!
    }

    // Date range filtering
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      filters.dateRange = {
        start: new Date(searchParams.get('startDate')!),
        end: new Date(searchParams.get('endDate')!)
      }
    }

    let result

    // Role-based access control
    if (userRole && ['cleaner', 'inspector', 'maintenance'].includes(userRole) && staffId) {
      // Staff member - only see assigned jobs
      result = await JobEngineService.getJobsForStaffRole(staffId, userRole, filters)
    } else if (userRole && ['admin', 'manager', 'supervisor'].includes(userRole)) {
      // Admin - see all jobs
      result = await JobEngineService.getAllJobs(filters)
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access',
        jobs: [],
        stats: {}
      }, { status: 403 })
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        jobs: [],
        stats: {}
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      stats: 'stats' in result ? result.stats : {
        total: result.jobs.length,
        pending: result.jobs.filter(j => j.status === 'pending').length,
        assigned: result.jobs.filter(j => j.status === 'assigned').length,
        inProgress: result.jobs.filter(j => j.status === 'in_progress').length,
        completed: result.jobs.filter(j => j.status === 'completed').length,
        cancelled: result.jobs.filter(j => j.status === 'cancelled').length
      }
    })

  } catch (error) {
    console.error('❌ Error in GET /api/jobs:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      jobs: [],
      stats: {}
    }, { status: 500 })
  }
}

/**
 * POST /api/jobs/status
 * Update job status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    if (!body.jobId || !body.status || !body.updatedBy) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: jobId, status, updatedBy'
      }, { status: 400 })
    }

    // Prepare status update
    const statusUpdate: JobStatusUpdate = {
      jobId: body.jobId,
      status: body.status,
      assignedStaffId: body.assignedStaffId,
      completionData: body.completionData,
      updatedBy: body.updatedBy
    }

    // Update job status
    const result = await JobEngineService.updateJobStatus(statusUpdate)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      job: result.job,
      message: `Job status updated to ${body.status}`
    })

  } catch (error) {
    console.error('❌ Error in POST /api/jobs/status:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
