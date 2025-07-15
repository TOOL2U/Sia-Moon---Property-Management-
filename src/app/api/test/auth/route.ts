import { NextRequest, NextResponse } from 'next/server'
import { StaffAccountService } from '@/lib/services/staffAccountService'

/**
 * GET /api/test/auth
 * Test the bcrypt authentication system
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing bcrypt authentication system...')
    
    // Test data
    const testCredentials = {
      email: 'admin@siamoon.com',
      password: 'admin123'
    }
    
    console.log('🔐 Testing login with credentials:', testCredentials.email)
    
    // Test authentication
    const authResult = await StaffAccountService.verifyStaffLogin(
      testCredentials.email,
      testCredentials.password
    )
    
    if (authResult.success && authResult.user) {
      console.log('✅ Authentication successful for user:', authResult.user.name)
      
      return NextResponse.json({
        success: true,
        message: 'Authentication test passed',
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
          role: authResult.user.role,
          department: authResult.user.department,
          isActive: authResult.user.isActive,
          lastLogin: authResult.user.lastLogin
        },
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ Authentication failed:', authResult.error)
      
      return NextResponse.json({
        success: false,
        message: 'Authentication test failed',
        error: authResult.error,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * POST /api/test/auth
 * Test creating a staff account with bcrypt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🧪 Testing staff account creation...')
    
    const testStaffData = {
      name: body.name || 'Test User',
      email: body.email || 'test@example.com',
      password: body.password || 'testpassword123',
      phone: body.phone || '+1234567890',
      address: body.address || '123 Test Street',
      role: body.role || 'staff' as 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff',
      department: body.department || 'Testing'
    }
    
    console.log('📝 Creating staff account for:', testStaffData.email)
    
    const result = await StaffAccountService.createStaffAccount(testStaffData)
    
    if (result.success) {
      console.log('✅ Staff account created successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Staff account creation test passed',
        staffAccount: result.staffAccount ? {
          id: result.staffAccount.id,
          name: result.staffAccount.name,
          email: result.staffAccount.email,
          role: result.staffAccount.role,
          department: result.staffAccount.department,
          isActive: result.staffAccount.isActive
        } : null,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ Staff account creation failed:', result.error)
      
      return NextResponse.json({
        success: false,
        message: 'Staff account creation test failed',
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
