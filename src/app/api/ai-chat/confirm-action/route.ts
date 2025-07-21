/**
 * POST /api/ai-chat/confirm-action
 * Handle manual confirmation of AI actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeAction } from '@/lib/ai/actionRouter'
import { getAIAutomationSettingsService } from '@/lib/ai/aiAutomationSettings'
import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      intent,
      userId,
      sessionId,
      confirmed
    } = body

    console.log(`🔐 AI ACTION CONFIRMATION: ${intent.action} - ${confirmed ? 'CONFIRMED' : 'REJECTED'}`)

    // Validate required fields
    if (!intent || !userId || !sessionId || confirmed === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: intent, userId, sessionId, confirmed'
      }, { status: 400 })
    }

    // Log the confirmation decision
    const db = getDb()
    await addDoc(collection(db, 'ai_action_confirmations'), {
      action: intent.action,
      parameters: intent.parameters,
      confidence: intent.confidence,
      safetyLevel: intent.safetyLevel,
      userId,
      sessionId,
      confirmed,
      timestamp: serverTimestamp(),
      source: 'manual_confirmation'
    })

    if (!confirmed) {
      // User rejected the action
      return NextResponse.json({
        success: true,
        message: `Action '${intent.action}' was cancelled by user`,
        confirmed: false,
        executed: false
      })
    }

    // User confirmed - execute the action
    try {
      const executionResult = await executeAction(intent, {
        userId,
        sessionId,
        timestamp: new Date(),
        source: 'ai_chat_confirmed'
      })

      // Log successful confirmation and execution
      await addDoc(collection(db, 'ai_action_logs'), {
        action: intent.action,
        parameters: intent.parameters,
        confidence: intent.confidence,
        safetyLevel: intent.safetyLevel,
        userId,
        sessionId,
        timestamp: serverTimestamp(),
        source: 'manual_confirmation',
        status: executionResult.success ? 'completed' : 'failed',
        result: executionResult,
        confirmed: true
      })

      return NextResponse.json({
        success: true,
        message: executionResult.message,
        confirmed: true,
        executed: executionResult.success,
        data: executionResult.data,
        error: executionResult.error
      })

    } catch (error) {
      console.error('❌ Failed to execute confirmed action:', error)
      
      return NextResponse.json({
        success: false,
        message: `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confirmed: true,
        executed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Action confirmation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/ai-chat/confirm-action
 * Get pending confirmations for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter'
      }, { status: 400 })
    }

    // Get automation settings
    const settingsService = getAIAutomationSettingsService()
    const statusSummary = await settingsService.getStatusSummary()

    return NextResponse.json({
      success: true,
      automationStatus: statusSummary,
      pendingConfirmations: [], // TODO: Implement pending confirmations storage
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Failed to get confirmation status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get confirmation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ai-chat/confirm-action
 * Update automation settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      settings
    } = body

    if (!userId || !settings) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, settings'
      }, { status: 400 })
    }

    // Update automation settings
    const settingsService = getAIAutomationSettingsService()
    await settingsService.updateSettings(settings, userId)

    const updatedStatus = await settingsService.getStatusSummary()

    return NextResponse.json({
      success: true,
      message: 'Automation settings updated successfully',
      automationStatus: updatedStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Failed to update automation settings:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update automation settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
