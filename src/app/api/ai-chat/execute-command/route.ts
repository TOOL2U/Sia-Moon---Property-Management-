import { NextRequest, NextResponse } from 'next/server'
import { executeCommand } from '@/lib/ai/commandExecutor'
import { validateCommand } from '@/lib/ai/commandParser'

/**
 * POST /api/ai-chat/execute-command
 * Execute a validated AI command with admin approval
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🤖 COMMAND EXECUTION: Processing command execution request')

    const body = await request.json()
    const { command, adminId, adminName } = body

    if (!command || !adminId) {
      return NextResponse.json(
        { success: false, error: 'Command and admin ID are required' },
        { status: 400 }
      )
    }

    // Validate command structure
    const validation = validateCommand(command)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Command validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Execute the command
    const executionContext = {
      adminId,
      adminName: adminName || 'Admin User',
      timestamp: new Date()
    }

    const result = await executeCommand(command, executionContext)

    console.log('✅ COMMAND EXECUTION: Command executed', { 
      success: result.success, 
      commandType: command.type 
    })

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
      auditLogId: result.auditLogId,
      errors: result.errors,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ COMMAND EXECUTION: Error executing command:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute command',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-chat/execute-command
 * Get command execution status and available command types
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    availableCommands: [
      {
        type: 'assign_staff',
        description: 'Assign staff member to a job',
        safetyLevel: 'safe',
        requiredData: ['staffName', 'jobId']
      },
      {
        type: 'approve_booking',
        description: 'Approve a pending booking',
        safetyLevel: 'caution',
        requiredData: ['bookingId']
      },
      {
        type: 'reschedule_job',
        description: 'Reschedule job to different date',
        safetyLevel: 'caution',
        requiredData: ['originalDate', 'newDate']
      },
      {
        type: 'update_calendar',
        description: 'Update calendar events',
        safetyLevel: 'safe',
        requiredData: ['bookingId?']
      },
      {
        type: 'create_job',
        description: 'Create new job',
        safetyLevel: 'safe',
        requiredData: ['property', 'date?']
      },
      {
        type: 'update_booking',
        description: 'Update booking details',
        safetyLevel: 'caution',
        requiredData: ['bookingId', 'updates']
      },
      {
        type: 'delete_job',
        description: 'Delete job (requires override)',
        safetyLevel: 'dangerous',
        requiredData: ['jobId', 'hasOverride']
      },
      {
        type: 'reassign_staff',
        description: 'Reassign staff between jobs',
        safetyLevel: 'caution',
        requiredData: ['staffName', 'fromJobId', 'toJobId']
      }
    ],
    timestamp: new Date().toISOString()
  })
}
