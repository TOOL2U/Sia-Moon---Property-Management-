import { NextRequest, NextResponse } from 'next/server'
import { ServerStaffService } from '@/lib/services/serverStaffService'

/**
 * GET /api/test/staff
 * Test endpoint to check staff data in Firebase using Admin SDK
 */
export async function GET() {
  try {
    console.log('🧪 TEST: Checking staff data in Firebase using Admin SDK...')

    // Get all staff from Firebase using Admin SDK
    const response = await ServerStaffService.getAllEnhancedStaff()

    if (response.success && response.staff) {
      console.log(`✅ TEST: Found ${response.staff.length} staff members in Firebase`)

      // Log each staff member for debugging
      response.staff.forEach((staff, index) => {
        console.log(`📋 Staff ${index + 1}:`, {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          status: staff.status,
          createdAt: staff.createdAt instanceof Date ? staff.createdAt.toISOString() :
                    staff.createdAt?.toDate?.()?.toISOString() || 'No date'
        })
      })

      return NextResponse.json({
        success: true,
        message: `Found ${response.staff.length} staff members`,
        data: response.staff.map(staff => ({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          status: staff.status,
          createdAt: staff.createdAt instanceof Date ? staff.createdAt.toISOString() :
                    staff.createdAt?.toDate?.()?.toISOString() || 'No date',
          userId: staff.userId,
          firebaseUid: staff.firebaseUid
        })),
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ TEST: No staff found or error:', response.error)
      return NextResponse.json({
        success: false,
        message: response.message || 'No staff found',
        error: response.error,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ TEST: Error checking staff data:', error)
    return NextResponse.json({
      success: false,
      message: 'Error checking staff data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
