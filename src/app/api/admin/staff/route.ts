import { NextRequest, NextResponse } from 'next/server'
import { EnhancedStaffService } from '@/lib/services/enhancedStaffService'

/**
 * GET /api/admin/staff
 * Get all staff members for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 ADMIN API: Getting all staff members...')
    
    // Get all staff from Firebase
    const response = await EnhancedStaffService.getAllEnhancedStaff()
    
    if (response.success && response.staff) {
      console.log(`✅ ADMIN API: Found ${response.staff.length} staff members`)
      
      // Convert enhanced staff profiles to regular staff profiles for the Back Office
      const staffProfiles = response.staff.map(staff => ({
        id: staff.id,
        userId: staff.userId,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        address: staff.address,
        role: staff.role,
        status: staff.status,
        created_at: staff.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: staff.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        assignedProperties: staff.assignedProperties || [],
        assignedRegions: staff.assignedRegions || [],
        skills: staff.skills || [],
        emergencyContact: staff.emergencyContact,
        personalDetails: staff.personalDetails,
        employment: staff.employment,
        completedTasks: (staff as any).performanceMetrics?.tasksCompleted || 0,
        totalAssignedTasks: (staff as any).performanceMetrics?.tasksCompleted || 0,
        averageRating: (staff as any).performanceMetrics?.averageRating || 0,
        completionRate: (staff as any).performanceMetrics?.completionRate || 0,
        createdBy: staff.createdBy,
        lastModifiedBy: staff.lastModifiedBy,
        firebaseUid: staff.firebaseUid
      }))
      
      return NextResponse.json({
        success: true,
        data: staffProfiles,
        stats: {
          total: staffProfiles.length,
          active: staffProfiles.filter(s => s.status === 'active').length,
          inactive: staffProfiles.filter(s => s.status === 'inactive').length,
          onLeave: staffProfiles.filter(s => s.status === 'on-leave').length,
          byRole: {
            cleaner: staffProfiles.filter(s => s.role === 'cleaner').length,
            maintenance: staffProfiles.filter(s => s.role === 'maintenance').length,
            admin: staffProfiles.filter(s => s.role === 'admin').length,
            supervisor: staffProfiles.filter(s => s.role === 'supervisor').length,
            housekeeper: staffProfiles.filter(s => s.role === 'housekeeper').length,
            manager: staffProfiles.filter(s => s.role === 'manager').length,
            concierge: staffProfiles.filter(s => s.role === 'concierge').length,
            security: staffProfiles.filter(s => s.role === 'security').length,
            gardener: staffProfiles.filter(s => s.role === 'gardener').length,
            chef: staffProfiles.filter(s => s.role === 'chef').length,
            driver: staffProfiles.filter(s => s.role === 'driver').length
          },
          totalTasks: staffProfiles.reduce((sum, s) => sum + (s.totalAssignedTasks || 0), 0),
          completedTasks: staffProfiles.reduce((sum, s) => sum + (s.completedTasks || 0), 0),
          pendingTasks: 0,
          inProgressTasks: 0,
          overdueeTasks: 0,
          todayTasks: 0,
          upcomingTasks: 0,
          averageCompletionTime: 0,
          completionRate: 0,
          averageRating: 0,
          performanceMetrics: {
            topPerformers: [],
            lowPerformers: [],
            recentHires: [],
            staffUtilization: 0,
            averageTasksPerStaff: 0
          }
        },
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ ADMIN API: No staff found or error:', response.error)
      return NextResponse.json({
        success: false,
        message: response.message || 'No staff found',
        error: response.error,
        data: [],
        stats: {
          total: 0,
          active: 0,
          inactive: 0,
          onLeave: 0,
          byRole: {},
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          overdueeTasks: 0,
          todayTasks: 0,
          upcomingTasks: 0,
          averageCompletionTime: 0,
          completionRate: 0,
          averageRating: 0,
          performanceMetrics: {
            topPerformers: [],
            lowPerformers: [],
            recentHires: [],
            staffUtilization: 0,
            averageTasksPerStaff: 0
          }
        },
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ ADMIN API: Error getting staff data:', error)
    return NextResponse.json({
      success: false,
      message: 'Error retrieving staff data',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      stats: {
        total: 0,
        active: 0,
        inactive: 0,
        onLeave: 0,
        byRole: {},
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        overdueeTasks: 0,
        todayTasks: 0,
        upcomingTasks: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        averageRating: 0,
        performanceMetrics: {
          topPerformers: [],
          lowPerformers: [],
          recentHires: [],
          staffUtilization: 0,
          averageTasksPerStaff: 0
        }
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
