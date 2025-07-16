/**
 * Job Assignments API
 * Handles CRUD operations for job assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'
import { AdminJobAssignmentService } from '@/lib/services/adminJobAssignmentService'
import { AuthenticatedJobAssignmentService, getIdTokenFromRequest } from '@/lib/services/authenticatedFirebaseService'
import { JobAssignmentFilters, JobType, JobPriority } from '@/types/jobAssignment'

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

    // Mock job assignments data
    const mockJobAssignments = [
      {
        id: 'job-001',
        title: 'Pre-arrival Deep Cleaning',
        description: 'Complete deep cleaning of villa before guest check-in',
        jobType: 'cleaning' as JobType,
        priority: 'high' as JobPriority,
        status: 'pending' as const,
        assignedStaff: ['staff-001'],
        staffNames: ['Maria Santos'],
        property: 'Alesia House',
        propertyId: 'prop-001',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(),
        createdBy: 'admin',
        estimatedDuration: 180,
        notes: 'Focus on kitchen, bathrooms, and bedrooms. Check all amenities.',
        bookingId: 'booking-001'
      },
      {
        id: 'job-002',
        title: 'Pool Maintenance & Garden Care',
        description: 'Weekly pool cleaning and garden maintenance',
        jobType: 'maintenance' as JobType,
        priority: 'medium' as JobPriority,
        status: 'in_progress' as const,
        assignedStaff: ['staff-002'],
        staffNames: ['Carlos Rodriguez'],
        property: 'Villa Serenity',
        propertyId: 'prop-002',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:30',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdBy: 'admin',
        estimatedDuration: 120,
        notes: 'Check pool chemical levels and trim hedges',
        bookingId: null
      },
      {
        id: 'job-003',
        title: 'Post-checkout Inspection',
        description: 'Inspect villa after guest checkout and prepare cleaning list',
        jobType: 'maintenance' as JobType, // inspection is not in JobType enum, using maintenance
        priority: 'high' as JobPriority,
        status: 'completed' as const,
        assignedStaff: ['staff-003'],
        staffNames: ['Ana Silva'],
        property: 'Ocean View Villa',
        propertyId: 'prop-003',
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '14:00',
        deadline: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        createdBy: 'admin',
        estimatedDuration: 60,
        notes: 'Completed inspection. Minor cleaning required.',
        bookingId: 'booking-002'
      }
    ]

    // Apply filters to mock data
    let filteredJobs = mockJobAssignments

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
