/**
 * AI Memory Management API
 * Handle memory operations, command re-runs, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAIMemoryService } from '@/lib/ai/aiMemory'
import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

/**
 * GET /api/ai-memory
 * Retrieve AI memory for admin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({
        success: false,
        error: 'Missing adminId parameter'
      }, { status: 400 })
    }

    console.log(`🧠 AI MEMORY API: Getting memory for admin ${adminId}`)

    const aiMemoryService = getAIMemoryService()
    const memory = await aiMemoryService.getMemory(adminId)

    // Log access for audit
    await logAuditEvent(adminId, 'memory_accessed', {
      timestamp: new Date().toISOString(),
      commandCount: memory.recentCommands.length,
      rejectionCount: memory.rejectedSuggestions.length
    })

    return NextResponse.json({
      success: true,
      data: memory,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI MEMORY API: Error getting memory:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/ai-memory
 * Update memory or perform memory operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, action, data } = body

    if (!adminId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: adminId, action'
      }, { status: 400 })
    }

    console.log(`🧠 AI MEMORY API: Processing ${action} for admin ${adminId}`)

    const aiMemoryService = getAIMemoryService()

    switch (action) {
      case 'add_command':
        const commandId = await aiMemoryService.addCommand(adminId, data.command)
        
        await logAuditEvent(adminId, 'command_added_via_api', {
          commandId,
          commandType: data.command.type,
          source: 'api'
        })

        return NextResponse.json({
          success: true,
          message: 'Command added to memory',
          commandId
        })

      case 'update_command_status':
        await aiMemoryService.updateCommandStatus(
          adminId,
          data.commandId,
          data.status,
          data.executionResult
        )

        await logAuditEvent(adminId, 'command_status_updated', {
          commandId: data.commandId,
          newStatus: data.status,
          source: 'api'
        })

        return NextResponse.json({
          success: true,
          message: 'Command status updated'
        })

      case 'add_rejected_suggestion':
        const rejectionId = await aiMemoryService.addRejectedSuggestion(
          adminId,
          data.suggestion,
          data.reason,
          data.context
        )

        await logAuditEvent(adminId, 'suggestion_rejected_via_api', {
          rejectionId,
          suggestion: data.suggestion,
          reason: data.reason,
          source: 'api'
        })

        return NextResponse.json({
          success: true,
          message: 'Rejected suggestion added to memory',
          rejectionId
        })

      case 'update_preferences':
        await aiMemoryService.updatePreferences(adminId, data.preferences)

        await logAuditEvent(adminId, 'preferences_updated_via_api', {
          updatedFields: Object.keys(data.preferences),
          source: 'api'
        })

        return NextResponse.json({
          success: true,
          message: 'Preferences updated'
        })

      case 'clear_memory':
        await aiMemoryService.clearMemory(adminId, data.type || 'all')

        await logAuditEvent(adminId, 'memory_cleared_via_api', {
          type: data.type || 'all',
          source: 'api'
        })

        return NextResponse.json({
          success: true,
          message: `Memory cleared: ${data.type || 'all'}`
        })

      case 'rerun_command':
        // This would trigger command re-execution
        const command = data.command
        
        await logAuditEvent(adminId, 'command_rerun_requested', {
          originalCommandId: command.id,
          commandType: command.type,
          source: 'api'
        })

        // For now, just log the re-run request
        // In a full implementation, this would trigger the command execution system
        return NextResponse.json({
          success: true,
          message: 'Command re-run requested',
          note: 'Command execution would be triggered here'
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ AI MEMORY API: Error processing request:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process memory operation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/ai-memory
 * Clear specific memory types
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const type = searchParams.get('type') || 'all'
    const confirm = searchParams.get('confirm')

    if (!adminId) {
      return NextResponse.json({
        success: false,
        error: 'Missing adminId parameter'
      }, { status: 400 })
    }

    if (confirm !== 'true') {
      return NextResponse.json({
        success: false,
        error: 'Missing confirmation. Add ?confirm=true to proceed.'
      }, { status: 400 })
    }

    console.log(`🧠 AI MEMORY API: Clearing ${type} memory for admin ${adminId}`)

    const aiMemoryService = getAIMemoryService()
    await aiMemoryService.clearMemory(adminId, type as any)

    await logAuditEvent(adminId, 'memory_cleared_via_delete', {
      type,
      source: 'api_delete'
    })

    return NextResponse.json({
      success: true,
      message: `Memory cleared: ${type}`
    })

  } catch (error) {
    console.error('❌ AI MEMORY API: Error clearing memory:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Log audit event for memory operations
 */
async function logAuditEvent(
  adminId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const db = getDb()
    await addDoc(collection(db, 'ai_memory_audit'), {
      adminId,
      action,
      details,
      timestamp: serverTimestamp(),
      source: 'ai_memory_api',
      userAgent: 'api',
      ipAddress: 'server'
    })
  } catch (error) {
    console.error('❌ Failed to log audit event:', error)
    // Don't throw - audit logging shouldn't break main functionality
  }
}
