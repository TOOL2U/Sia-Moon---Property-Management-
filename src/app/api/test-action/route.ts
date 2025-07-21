/**
 * Test endpoint for action execution
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, userId = 'test-user', sessionId = 'test-session' } = await request.json()
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }
    
    console.log('🧪 TESTING ACTION EXECUTION for message:', message)
    
    // Import intent detection and action execution
    const { detectIntent } = await import('@/lib/ai/intentDetector')
    const { executeAction } = await import('@/lib/ai/actionRouter')
    
    // Detect intents
    const detectedIntents = detectIntent(message)
    console.log('🧪 DETECTED INTENTS:', detectedIntents)
    
    const executionResults = []
    
    // Execute each intent
    for (const intent of detectedIntents) {
      console.log(`🧪 EXECUTING INTENT: ${intent.action}`)
      
      try {
        const result = await executeAction(intent, {
          userId,
          sessionId,
          timestamp: new Date(),
          source: 'test_api'
        })
        
        executionResults.push({
          intent: intent.action,
          success: result.success,
          message: result.message,
          data: result.data,
          error: result.error
        })
        
        console.log(`🧪 EXECUTION RESULT:`, result)
        
      } catch (error) {
        console.error(`🧪 EXECUTION ERROR for ${intent.action}:`, error)
        
        executionResults.push({
          intent: intent.action,
          success: false,
          message: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message,
      intents: detectedIntents,
      executionResults,
      summary: {
        intentsDetected: detectedIntents.length,
        actionsExecuted: executionResults.filter(r => r.success).length,
        actionsFailed: executionResults.filter(r => !r.success).length
      }
    })
    
  } catch (error) {
    console.error('🧪 ACTION TEST ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Action execution test endpoint',
    usage: 'POST with { "message": "your test message", "userId": "optional", "sessionId": "optional" }'
  })
}
