import { NextRequest, NextResponse } from 'next/server'
import { TestJobSessionService } from '@/services/TestJobSessionService'

/**
 * Test Job Workflow API
 * Creates complete job workflows from creation to AI audit analysis
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      staffId, 
      staffName, 
      jobType = 'cleaning', 
      performance = 'excellent',
      duration,
      location 
    } = body
    
    console.log(`🧪 Creating test job workflow for ${staffName}...`)
    
    if (!staffId || !staffName) {
      return NextResponse.json({
        success: false,
        error: 'staffId and staffName are required'
      }, { status: 400 })
    }
    
    const result = await TestJobSessionService.createCompleteJobWorkflow(
      staffId,
      staffName,
      { jobType, performance, duration, location }
    )
    
    if (result.success) {
      console.log(`✅ Test job workflow created successfully`)
      return NextResponse.json({
        success: true,
        message: 'Complete job workflow created successfully',
        data: {
          jobId: result.jobId,
          sessionId: result.sessionId,
          performanceScore: result.performanceScore,
          staffName,
          jobType,
          performance
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error in job workflow API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create job workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'scenarios') {
      console.log('🧪 Creating test scenarios for multiple staff members...')
      
      const results = await TestJobSessionService.createTestScenarios()
      
      return NextResponse.json({
        success: true,
        message: 'Test scenarios created successfully',
        scenarios: results,
        totalCreated: results.filter(r => r.success).length
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test Job Workflow API',
      endpoints: {
        'POST /api/test/job-workflow': 'Create single job workflow',
        'GET /api/test/job-workflow?action=scenarios': 'Create multiple test scenarios'
      },
      parameters: {
        staffId: 'Firebase UID of staff member',
        staffName: 'Display name of staff member',
        jobType: 'cleaning | maintenance | inspection',
        performance: 'excellent | good | average | poor',
        duration: 'Job duration in minutes (optional)',
        location: '{ lat: number, lng: number } (optional)'
      }
    })
    
  } catch (error) {
    console.error('❌ Error in job workflow GET API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
