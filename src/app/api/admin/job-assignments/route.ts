/**
 * Job Assignments API
 * Handles CRUD operations for job assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'
import { AdminJobAssignmentService } from '@/lib/services/adminJobAssignmentService'
import { AuthenticatedJobAssignmentService, getIdTokenFromRequest } from '@/lib/services/authenticatedFirebaseService'
import { JobAssignmentFilters, JobType, JobPriority } from '@/types/jobAssignment'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * GET /api/admin/job-assignments
 * Get job assignments with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Get Firebase ID token for authentication
    const idToken = getIdTokenFromRequest(request)
    console.log('🔍 API Route Auth Debug:', {
      idToken: idToken ? 'EXISTS' : 'MISSING'
    })

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters from query parameters
    const filters: JobAssignmentFilters = {}
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[]
    }
    
    if (searchParams.get('jobType')) {
      filters.jobType = searchParams.get('jobType')!.split(',') as JobType[]
    }
    
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')!.split(',') as JobPriority[]
    }
    
    if (searchParams.get('assignedStaff')) {
      filters.assignedStaff = searchParams.get('assignedStaff')!.split(',')
    }
    
    if (searchParams.get('property')) {
      filters.property = searchParams.get('property')!.split(',')
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }
    
    if (searchParams.get('sortBy')) {
      filters.sortBy = searchParams.get('sortBy') as any
    }
    
    if (searchParams.get('sortOrder')) {
      filters.sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc'
    }
    
    // Date range filter
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate }
    }

    // For now, return mock data until Firebase authentication is properly configured
    console.log('🔍 Using mock job assignments data for development')

    // Load real job assignments from Firebase
    const db = getDb()
    const jobsQuery = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const jobsSnapshot = await getDocs(jobsQuery)
    const realJobAssignments = jobsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title || 'Untitled Job',
        description: data.description || '',
        jobType: data.jobType || 'general',
        priority: data.priority || 'medium',
        status: data.status || 'pending',
        assignedStaff: data.assignedStaffId ? [data.assignedStaffId] : [],
        staffNames: data.assignedStaffName ? [data.assignedStaffName] : [],
        property: data.propertyName || 'Unknown Property',
        propertyId: data.propertyId || '',
        scheduledDate: data.startTime ? new Date(data.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        scheduledTime: data.startTime ? new Date(data.startTime).toTimeString().slice(0, 5) : '09:00',
        deadline: data.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || 'admin',
        estimatedDuration: data.estimatedDuration || 120,
        notes: data.notes || '',
        bookingId: data.bookingId || ''
      }
    })

    // Apply filters to real data
    let filteredJobs = realJobAssignments


    if (filters.status && filters.status.length > 0) {
      filteredJobs = filteredJobs.filter(job => filters.status!.includes(job.status))
    }

    if (filters.jobType && filters.jobType.length > 0) {
      filteredJobs = filteredJobs.filter(job => filters.jobType!.includes(job.jobType))
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredJobs = filteredJobs.filter(job => filters.priority!.includes(job.priority))
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'

    filteredJobs.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] as any
      const bValue = b[sortBy as keyof typeof b] as any

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1
      } else {
        return aValue < bValue ? -1 : 1
      }
    })

    // Calculate stats
    const stats = {
      total: filteredJobs.length,
      pending: filteredJobs.filter(j => j.status === 'pending').length,
      in_progress: filteredJobs.filter(j => j.status === 'in_progress').length,
      completed: filteredJobs.filter(j => j.status === 'completed').length,
      overdue: filteredJobs.filter(j => {
        const deadline = new Date(j.deadline)
        return deadline < new Date() && j.status !== 'completed'
      }).length
    }
    // Return the filtered mock data
    return NextResponse.json({
      success: true,
      data: filteredJobs,
      stats: stats
    })
  } catch (error) {
    console.error('❌ Error in GET /api/admin/job-assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/job-assignments
 * Create a new job assignment from booking
 */
export async function POST(request: NextRequest) {
  try {
    // Get Firebase ID token for authentication
    const idToken = getIdTokenFromRequest(request)
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      bookingData,
      jobDetails,
      assignedBy,
      assignedStaffId,
      assignedStaffName,
      notificationOptions
    } = body

    // Validate required fields
    if (!bookingData || !jobDetails || !assignedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingData, jobDetails, assignedBy' },
        { status: 400 }
      )
    }

    // MANDATORY VALIDATION: Staff assignment is required
    if (!assignedStaffId) {
      return NextResponse.json(
        { success: false, error: 'MANDATORY: Staff assignment is required. You must assign this job to a staff member.' },
        { status: 400 }
      )
    }

    // Validate booking data
    const requiredBookingFields = ['id', 'propertyId', 'propertyName', 'guestName', 'checkInDate', 'checkOutDate', 'numberOfGuests']
    for (const field of requiredBookingFields) {
      if (!bookingData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required booking field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate job details
    const requiredJobFields = ['jobType', 'title', 'description', 'priority', 'estimatedDuration', 'requiredSkills', 'scheduledDate', 'deadline']
    for (const field of requiredJobFields) {
      if (!jobDetails[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required job field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate assignedBy
    if (!assignedBy.id || !assignedBy.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required assignedBy fields: id, name' },
        { status: 400 }
      )
    }

    console.log('📋 Creating job with staff assignment...')
    console.log('👤 Assigned staff ID:', assignedStaffId)
    console.log('👤 Assigned staff name:', assignedStaffName)

    // Step 1: Create the job
    const result = await JobAssignmentService.createJobFromBooking(
      bookingData,
      jobDetails,
      assignedBy
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ Job created successfully:', result.jobId)

    // Step 2: Assign staff to the job
    const jobId = result.jobId
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job created but job ID is missing' },
        { status: 500 }
      )
    }

    const assignmentResult = await JobAssignmentService.assignStaffToJob(
      jobId,
      assignedStaffId,
      assignedBy,
      {
        sendNotification: notificationOptions?.sendNotification !== false,
        customMessage: notificationOptions?.customMessage || `New ${jobDetails.jobType} job assigned: ${jobDetails.title}`,
        scheduledStartTime: jobDetails.scheduledStartTime,
        scheduledEndTime: undefined // Will be calculated based on duration
      }
    )

    if (!assignmentResult.success) {
      console.error('❌ Failed to assign staff to job:', assignmentResult.error)
      // Job was created but staff assignment failed
      return NextResponse.json({
        success: false,
        error: `Job created but staff assignment failed: ${assignmentResult.error}`,
        jobId: result.jobId
      }, { status: 500 })
    }

    console.log('✅ Staff assigned successfully to job:', result.jobId)
    console.log('📱 Notifications sent to staff member:', assignedStaffName)

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      assignedStaffId,
      assignedStaffName,
      message: `Job assignment created and assigned to ${assignedStaffName} successfully. Notifications sent to staff dashboard and mobile device.`
    })
  } catch (error) {
    console.error('❌ Error in POST /api/admin/job-assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
