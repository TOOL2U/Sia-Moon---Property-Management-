/**
 * Mobile Job Assignment Response API
 * Handles staff acceptance/decline of job assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth, createMobileSuccessResponse, createMobileErrorResponse } from '@/lib/middleware/mobileAuth'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'

/**
 * POST /api/mobile/job-assignments/[id]/respond
 * Staff accepts or declines a job assignment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMobileAuth(request, async (staffId: string) => {
    try {
      const jobId = params.id
      const body = await request.json()
      const { accepted, notes, estimatedArrival, alternativeTime } = body

      // Validate required fields
      if (typeof accepted !== 'boolean') {
        return createMobileErrorResponse('Missing or invalid field: accepted (must be boolean)')
      }

      const response = {
        accepted,
        notes,
        estimatedArrival,
        alternativeTime
      }

      const result = await JobAssignmentService.respondToJobAssignment(
        jobId,
        staffId,
        response
      )

      if (!result.success) {
        return createMobileErrorResponse(result.error || 'Failed to respond to job assignment')
      }

      return createMobileSuccessResponse({
        message: `Job assignment ${accepted ? 'accepted' : 'declined'} successfully`,
        jobId,
        response: {
          accepted,
          responseAt: new Date().toISOString(),
          notes,
          estimatedArrival,
          alternativeTime
        }
      })
    } catch (error) {
      console.error(`❌ Error in mobile job response for job ${params?.id}:`, error)
      return createMobileErrorResponse('Failed to process job response')
    }
  })
}
