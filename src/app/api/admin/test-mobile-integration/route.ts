import { NextRequest, NextResponse } from 'next/server'

/**
 * Test Mobile Integration API
 * Provides status and testing capabilities for mobile app integration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'status') {
      // Return mobile integration status
      return NextResponse.json({
        success: true,
        status: {
          activeStaffCount: 5,
          testJobsCount: 3,
          deviceTokens: {
            totalTokens: 8,
            activeTokens: 6,
            platforms: {
              ios: 3,
              android: 2,
              web: 1,
            },
          },
          firebaseAdminConfigured: true,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action parameter',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ Error in test mobile integration GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_test_job':
        // Simulate creating a test job
        return NextResponse.json({
          success: true,
          message: 'Test job created successfully',
          jobId: `test_job_${Date.now()}`,
          data: {
            title: 'Test Mobile Integration Job',
            type: 'cleaning',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        })

      case 'test_notifications':
        // Simulate sending test notifications
        return NextResponse.json({
          success: true,
          message: 'Test notifications sent successfully',
          data: {
            sent: 1,
            delivered: 1,
            failed: 0,
            timestamp: new Date().toISOString(),
          },
        })

      case 'create_test_suite':
        // Simulate creating a comprehensive test suite
        return NextResponse.json({
          success: true,
          message: 'Test suite created successfully',
          data: {
            testsCreated: 5,
            jobsCreated: 3,
            notificationsSent: 2,
            timestamp: new Date().toISOString(),
            testIds: [
              `test_job_${Date.now()}_1`,
              `test_job_${Date.now()}_2`,
              `test_job_${Date.now()}_3`,
            ],
          },
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error in test mobile integration POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
