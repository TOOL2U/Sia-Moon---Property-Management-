import { NextRequest, NextResponse } from 'next/server'
import { StaffAccountService } from '@/lib/services/staffAccountService'

/**
 * DELETE /api/admin/staff-accounts/[id]
 * Delete a staff account by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ ADMIN API: Deleting staff account:', id)

    // Delete staff account using the service
    const result = await StaffAccountService.deleteStaffAccount(id)
    
    if (result.success) {
      console.log('✅ ADMIN API: Staff account deleted successfully')
      
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ ADMIN API: Failed to delete staff account:', result.error)
      
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to delete staff account',
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ ADMIN API: Error deleting staff account:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to delete staff account',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * GET /api/admin/staff-accounts/[id]
 * Get a specific staff account by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📋 ADMIN API: Getting staff account:', id)

    // Get staff account using the service
    const result = await StaffAccountService.getStaffAccountById(id)
    
    if (result.success && result.staffAccount) {
      console.log('✅ ADMIN API: Staff account found')
      
      return NextResponse.json({
        success: true,
        data: result.staffAccount,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ ADMIN API: Staff account not found:', result.error)
      
      return NextResponse.json({
        success: false,
        message: result.message || 'Staff account not found',
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ ADMIN API: Error getting staff account:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get staff account',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * PUT /api/admin/staff-accounts/[id]
 * Update a staff account by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📝 ADMIN API: Updating staff account:', id)

    const body = await request.json()

    // Update staff account using the service
    const result = await StaffAccountService.updateStaffAccount(id, body)
    
    if (result.success) {
      console.log('✅ ADMIN API: Staff account updated successfully')
      
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ ADMIN API: Failed to update staff account:', result.error)
      
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to update staff account',
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ ADMIN API: Error updating staff account:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update staff account',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
