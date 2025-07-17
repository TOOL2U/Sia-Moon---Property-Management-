import { NextRequest, NextResponse } from 'next/server'
import { StaffAccountService } from '@/lib/services/staffAccountService'

/**
 * GET /api/admin/staff-accounts
 * Get all staff accounts for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 ADMIN API: Getting all staff accounts...')
    
    // Get all staff accounts from Firebase
    const response = await StaffAccountService.getAllStaffAccounts()
    
    if (response.success && response.staffAccounts) {
      console.log(`✅ ADMIN API: Found ${response.staffAccounts.length} staff accounts`)

      // Convert staff accounts to the format expected by the Back Office
      const staffProfiles = response.staffAccounts.map(account => ({
        id: account.id,
        userId: account.firebaseUid,
        name: account.name,
        email: account.email,
        phone: account.phone,
        address: account.address,
        role: account.role,
        status: account.status,
        created_at: account.createdAt instanceof Date ? account.createdAt.toISOString() : new Date().toISOString(),
        updated_at: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : new Date().toISOString(),
        assignedProperties: account.assignedProperties || [],
        assignedRegions: [], // Not used in staff accounts
        skills: account.skills || [],
        emergencyContact: account.emergencyContact,
        personalDetails: account.personalDetails,
        employment: account.employment,
        completedTasks: 0, // TODO: Get from performance metrics
        totalAssignedTasks: 0, // TODO: Get from task assignments
        averageRating: 0, // TODO: Get from performance metrics
        completionRate: 0, // TODO: Calculate from tasks
        createdBy: account.createdBy,
        lastModifiedBy: account.lastModifiedBy,
        firebaseUid: account.firebaseUid,
        hasCredentials: account.hasCredentials,
        isActive: account.isActive
      }))
      
      return NextResponse.json({
        success: true,
        data: staffProfiles,
        stats: {
          total: staffProfiles.length,
          active: staffProfiles.filter(s => s.status === 'active').length,
          inactive: staffProfiles.filter(s => s.status === 'inactive').length,
          onLeave: staffProfiles.filter(s => s.status === 'suspended').length,
          byRole: {
            admin: staffProfiles.filter(s => s.role === 'admin').length,
            manager: staffProfiles.filter(s => s.role === 'manager').length,
            cleaner: staffProfiles.filter(s => s.role === 'cleaner').length,
            maintenance: staffProfiles.filter(s => s.role === 'maintenance').length,
            staff: staffProfiles.filter(s => s.role === 'staff').length
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
            recentHires: staffProfiles.filter(s => {
              const createdDate = new Date(s.created_at)
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              return createdDate > thirtyDaysAgo
            }),
            staffUtilization: 0,
            averageTasksPerStaff: 0
          }
        },
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ ADMIN API: No staff accounts found or error:', response.error)
      return NextResponse.json({
        success: false,
        message: response.message || 'No staff accounts found',
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
    console.error('❌ ADMIN API: Error getting staff accounts:', error)
    return NextResponse.json({
      success: false,
      message: 'Error retrieving staff accounts',
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

/**
 * POST /api/admin/staff-accounts
 * Create a new staff account with bcrypt password hashing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 ADMIN API: Creating new staff account...')

    const body = await request.json()

    // Create staff account using the service
    const result = await StaffAccountService.createStaffAccount(body)

    if (result.success) {
      console.log('✅ ADMIN API: Staff account created successfully')

      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.staffAccount,
        credentials: result.userCredentials,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ ADMIN API: Failed to create staff account:', result.error)

      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to create staff account',
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ ADMIN API: Error creating staff account:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create staff account',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
