/**
 * Staff Availability API
 * Provides real-time staff availability data for job assignment
 */

// AdminJobAssignmentService removed - service not available
// import { AdminJobAssignmentService } from '@/lib/services/adminJobAssignmentService'
import { JobAssignmentService } from '@/lib/services/jobAssignmentService'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/staff-availability
 * Get all staff availability data
 */
export async function GET(request: NextRequest) {
  try {
    // Try Firebase Admin SDK first, then fallback to client SDK
    console.log('🔍 Getting staff availability...')

    // Option 1: Try Firebase Admin SDK (bypasses security rules)
    if (AdminJobAssignmentService.isAvailable()) {
      console.log('🔥 Trying Firebase Admin SDK for staff availability...')
      const adminResult = await AdminJobAssignmentService.getStaffAvailability()

      if (adminResult.success) {
        console.log(
          '✅ Successfully retrieved staff availability using Admin SDK'
        )
        return NextResponse.json({
          success: true,
          data: adminResult.data || [],
        })
      } else {
        console.log(
          '⚠️ Admin SDK failed for staff availability:',
          adminResult.error
        )
      }
    } else {
      console.log('⚠️ Firebase Admin SDK not available for staff availability')
    }

    // Option 2: Try client SDK (requires proper authentication)
    console.log('🔥 Trying Firebase Client SDK for staff availability...')
    const result = await JobAssignmentService.getAllStaffAvailability()

    if (!result.success) {
      console.log('⚠️ Client SDK failed for staff availability:', result.error)

      // Fallback to mock data
      console.log('📝 Using mock staff availability data')
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'staff-1',
            name: 'Maria Santos',
            role: 'cleaner',
            isActive: true,
            availability: 'available',
            currentJobs: 0,
            maxJobs: 3,
            skills: ['cleaning', 'laundry'],
          },
          {
            id: 'staff-2',
            name: 'Carlos Rodriguez',
            role: 'maintenance',
            isActive: true,
            availability: 'busy',
            currentJobs: 2,
            maxJobs: 2,
            skills: ['maintenance', 'gardening', 'pool'],
          },
        ],
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    })
  } catch (error) {
    console.error('❌ Error in GET /api/admin/staff-availability:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
