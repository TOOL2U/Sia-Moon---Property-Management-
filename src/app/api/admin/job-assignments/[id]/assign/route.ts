/**
 * Job Assignment - Assign Staff API
 * Handles staff assignment to jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'

/**
 * POST /api/admin/job-assignments/[id]/assign
 * Assign staff to a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id
    const body = await request.json()
    const { staffId, assignedBy, options } = body

    // Validate required fields
    if (!staffId || !assignedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: staffId, assignedBy' },
        { status: 400 }
      )
    }

    if (!assignedBy.id || !assignedBy.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required assignedBy fields: id, name' },
        { status: 400 }
      )
    }

    const result = await JobAssignmentService.assignStaffToJob(
      jobId,
      staffId,
      assignedBy,
      options
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff assigned successfully'
    })
  } catch (error) {
    console.error(`❌ Error in POST /api/admin/job-assignments/${params?.id}/assign:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
