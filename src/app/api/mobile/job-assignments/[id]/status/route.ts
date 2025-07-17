/**
 * Mobile Job Assignment Status API
 * Handles job status updates from mobile app
 */

import {
  createMobileErrorResponse,
  createMobileSuccessResponse,
  withMobileAuth,
} from '@/lib/middleware/mobileAuth'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'
import { JobStatus } from '@/types/jobAssignment'
import { NextRequest } from 'next/server'

/**
 * PATCH /api/mobile/job-assignments/[id]/status
 * Update job assignment status and progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { id: jobId } = await params
      const body = await request.json()
      const {
        status,
        progress,
        notes,
        completionNotes,
        completionPhotos,
        qualityRating,
        issuesReported,
      } = body

      // Validate required fields
      if (!status) {
        return createMobileErrorResponse('Missing required field: status')
      }

      // Validate status value
      const validStatuses: JobStatus[] = [
        'assigned',
        'accepted',
        'declined',
        'in_progress',
        'completed',
        'cancelled',
      ]
      if (!validStatuses.includes(status)) {
        return createMobileErrorResponse(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        )
      }

      // Validate progress if provided
      if (
        progress !== undefined &&
        (typeof progress !== 'number' || progress < 0 || progress > 100)
      ) {
        return createMobileErrorResponse(
          'Progress must be a number between 0 and 100'
        )
      }

      // Validate quality rating if provided
      if (
        qualityRating !== undefined &&
        (typeof qualityRating !== 'number' ||
          qualityRating < 1 ||
          qualityRating > 5)
      ) {
        return createMobileErrorResponse(
          'Quality rating must be a number between 1 and 5'
        )
      }

      const updates = {
        progress,
        notes,
        completionNotes,
        completionPhotos,
        qualityRating,
        issuesReported,
      }

      const result = await JobAssignmentService.updateJobStatus(
        jobId,
        auth.staffId,
        status,
        updates
      )

      if (!result.success) {
        return createMobileErrorResponse(
          result.error || 'Failed to update job status'
        )
      }

      // Update calendar event with new status
      try {
        const CalendarEventService = (
          await import('@/services/CalendarEventService')
        ).default
        await CalendarEventService.updateEventStatus(jobId, status, {
          progress,
          notes,
          completionNotes,
          updatedBy: auth.staffId,
        })
      } catch (calendarError) {
        console.warn('⚠️ Failed to update calendar event:', calendarError)
        // Don't fail the request if calendar update fails
      }

      return createMobileSuccessResponse({
        message: `Job status updated to ${status} successfully`,
        jobId,
        status,
        progress,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`❌ Error updating mobile job status:`, error)
      return createMobileErrorResponse('Failed to update job status')
    }
  })(request)
}
