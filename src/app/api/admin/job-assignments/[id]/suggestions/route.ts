/**
 * Job Assignment - Staff Suggestions API
 * Provides smart staff suggestions for job assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'

/**
 * GET /api/admin/job-assignments/[id]/suggestions
 * Get smart staff suggestions for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id
    const { searchParams } = new URL(request.url)
    
    // Parse options from query parameters
    const options: any = {}
    
    if (searchParams.get('maxSuggestions')) {
      options.maxSuggestions = parseInt(searchParams.get('maxSuggestions')!)
    }
    
    if (searchParams.get('includeUnavailable')) {
      options.includeUnavailable = searchParams.get('includeUnavailable') === 'true'
    }
    
    if (searchParams.get('preferredSkills')) {
      options.preferredSkills = searchParams.get('preferredSkills')!.split(',')
    }

    const result = await JobAssignmentService.getStaffSuggestions(jobId, options)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions || []
    })
  } catch (error) {
    console.error(`❌ Error in GET /api/admin/job-assignments/${params?.id}/suggestions:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
