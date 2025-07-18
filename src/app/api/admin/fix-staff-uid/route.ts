import { NextRequest, NextResponse } from 'next/server'
import StaffUidMappingService from '@/services/StaffUidMappingService'

/**
 * API endpoint to fix staff Firebase UID mapping
 * This is critical for mobile app integration
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, firebaseUid } = body

    switch (action) {
      case 'fix_staff_siamoon':
        // Fix the specific staff@siamoon.com account
        const result = await StaffUidMappingService.fixStaffSiamoonAccount()
        return NextResponse.json(result)

      case 'update_staff_uid':
        // Update specific staff account
        if (!email || !firebaseUid) {
          return NextResponse.json(
            { success: false, message: 'Email and firebaseUid are required' },
            { status: 400 }
          )
        }
        
        const updateResult = await StaffUidMappingService.updateStaffFirebaseUid(email, firebaseUid)
        return NextResponse.json(updateResult)

      case 'verify_staff_uid':
        // Verify staff account UID mapping
        if (!email) {
          return NextResponse.json(
            { success: false, message: 'Email is required' },
            { status: 400 }
          )
        }
        
        const verifyResult = await StaffUidMappingService.verifyStaffUidMapping(email)
        return NextResponse.json(verifyResult)

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error in fix-staff-uid API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
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
      case 'list_missing_uid':
        // Get all staff accounts missing Firebase UID
        const listResult = await StaffUidMappingService.getStaffMissingUidMapping()
        return NextResponse.json(listResult)

      case 'verify_staff_siamoon':
        // Verify staff@siamoon.com account
        const verifyResult = await StaffUidMappingService.verifyStaffUidMapping('staff@siamoon.com')
        return NextResponse.json(verifyResult)

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error in fix-staff-uid GET API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
