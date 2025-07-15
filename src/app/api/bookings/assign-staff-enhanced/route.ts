import { NextRequest, NextResponse } from 'next/server'
import { MandatoryStaffAssignmentService } from '@/lib/services/mandatoryStaffAssignmentService'

/**
 * POST /api/bookings/assign-staff-enhanced
 * Enhanced staff assignment with mandatory validation and multi-channel notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'bookingId',
      'propertyName',
      'title',
      'description',
      'assignedStaffIds',
      'assignedBy'
    ]
    
    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Validate mandatory staff selection
    if (!body.assignedStaffIds || !Array.isArray(body.assignedStaffIds) || body.assignedStaffIds.length === 0) {
      return NextResponse.json({
        success: false,
        errors: ['MANDATORY: At least one staff member must be selected for job assignment'],
        warnings: []
      }, { status: 400 })
    }

    // Prepare assignment data
    const assignmentData = {
      bookingId: body.bookingId,
      propertyId: body.propertyId || 'default-property',
      propertyName: body.propertyName,
      propertyAddress: body.propertyAddress || 'Address not provided',
      jobType: body.jobType || 'cleaning',
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      scheduledDate: body.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledStartTime: body.scheduledStartTime,
      deadline: body.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimatedDuration: body.estimatedDuration || 180,
      requiredSkills: body.requiredSkills || [],
      specialInstructions: body.specialInstructions,
      assignedStaffIds: body.assignedStaffIds,
      assignedBy: body.assignedBy
    }

    // Create job assignment with mandatory staff validation
    const result = await MandatoryStaffAssignmentService.createJobWithMandatoryStaff(assignmentData)

    if (result.success) {
      // Log successful assignment
      console.log(`✅ Enhanced job assignment created:`, {
        jobId: result.jobId,
        staffCount: assignmentData.assignedStaffIds.length,
        taskCount: result.taskIds?.length || 0,
        notificationsSent: result.notificationResults?.filter(n => n.success).length || 0
      })

      return NextResponse.json({
        success: true,
        message: `Job successfully assigned to ${assignmentData.assignedStaffIds.length} staff members with multi-channel notifications`,
        data: {
          jobId: result.jobId,
          taskIds: result.taskIds,
          assignedStaffCount: assignmentData.assignedStaffIds.length,
          notificationResults: result.notificationResults,
          warnings: result.warnings
        }
      })
    } else {
      // Return validation errors
      return NextResponse.json({
        success: false,
        errors: result.errors || ['Unknown error occurred'],
        warnings: result.warnings || []
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error in enhanced staff assignment:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error during staff assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/bookings/assign-staff-enhanced
 * Get available staff for assignment with validation info
 */
export async function GET(request: NextRequest) {
  try {
    const availableStaff = await MandatoryStaffAssignmentService.getAvailableStaffForSelection()
    
    return NextResponse.json({
      success: true,
      data: {
        staff: availableStaff,
        totalCount: availableStaff.length,
        activeCount: availableStaff.filter(s => s.isAvailable).length
      }
    })
  } catch (error) {
    console.error('❌ Error getting available staff:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get available staff',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
