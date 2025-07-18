import { NextRequest, NextResponse } from 'next/server'
import { MobileStaffSetupService } from '@/services/MobileStaffSetupService'

/**
 * API endpoint to set up ALL staff members for mobile app integration
 * Creates Firebase Auth accounts and updates Firestore documents
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'setup_all_staff':
        console.log('🚀 API: Setting up all staff for mobile app...')
        
        const setupResult = await MobileStaffSetupService.setupAllStaffForMobile()
        
        if (setupResult.success) {
          console.log('✅ API: Mobile staff setup completed successfully')
          return NextResponse.json({
            success: true,
            message: setupResult.message,
            data: {
              summary: {
                totalStaff: setupResult.results.totalStaff,
                alreadySetup: setupResult.results.alreadySetup,
                newlySetup: setupResult.results.newlySetup,
                failed: setupResult.results.failed
              },
              details: setupResult.results.details,
              timestamp: new Date().toISOString()
            }
          })
        } else {
          console.error('❌ API: Mobile staff setup failed:', setupResult.message)
          return NextResponse.json(
            {
              success: false,
              error: setupResult.message,
              data: setupResult.results
            },
            { status: 500 }
          )
        }

      case 'verify_staff_readiness':
        console.log('🔍 API: Verifying staff mobile readiness...')
        
        const verifyResult = await MobileStaffSetupService.verifyAllStaffMobileReady()
        
        return NextResponse.json({
          success: verifyResult.success,
          data: {
            summary: {
              totalStaff: verifyResult.totalStaff,
              readyStaff: verifyResult.readyStaff,
              notReadyStaff: verifyResult.notReadyStaff,
              readinessPercentage: verifyResult.totalStaff > 0 
                ? Math.round((verifyResult.readyStaff / verifyResult.totalStaff) * 100)
                : 0
            },
            staffStatus: verifyResult.staffStatus,
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "setup_all_staff" or "verify_staff_readiness"' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ API Error in setup-mobile-staff:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        // Get current mobile staff setup status
        const statusResult = await MobileStaffSetupService.verifyAllStaffMobileReady()
        
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalStaff: statusResult.totalStaff,
              readyStaff: statusResult.readyStaff,
              notReadyStaff: statusResult.notReadyStaff,
              readinessPercentage: statusResult.totalStaff > 0 
                ? Math.round((statusResult.readyStaff / statusResult.totalStaff) * 100)
                : 0
            },
            isFullyReady: statusResult.notReadyStaff === 0 && statusResult.totalStaff > 0,
            timestamp: new Date().toISOString()
          }
        })

      case 'staff_list':
        // Get detailed staff readiness list
        const listResult = await MobileStaffSetupService.verifyAllStaffMobileReady()
        
        return NextResponse.json({
          success: true,
          data: {
            staffStatus: listResult.staffStatus,
            summary: {
              totalStaff: listResult.totalStaff,
              readyStaff: listResult.readyStaff,
              notReadyStaff: listResult.notReadyStaff
            }
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "status" or "staff_list"' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ API Error in setup-mobile-staff GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
