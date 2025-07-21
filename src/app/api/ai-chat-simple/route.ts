/**
 * Simplified AI Chat with Intent Execution
 * Bypasses complex AI routing and focuses on action execution
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
    
    console.log('🤖 SIMPLE AI CHAT: Processing message:', message)
    
    // Import intent detection and action execution
    const { detectIntent } = await import('@/lib/ai/intentDetector')
    const { executeAction } = await import('@/lib/ai/actionRouter')
    
    // Detect intents
    const detectedIntents = detectIntent(message)
    console.log(`🎯 SIMPLE AI CHAT: Detected ${detectedIntents.length} intents:`, detectedIntents.map(i => i.action))
    
    let response = ''
    let actionExecuted = false
    const executionResults = []
    
    if (detectedIntents.length > 0) {
      console.log('🚀 SIMPLE AI CHAT: Executing intents directly...')
      
      // Execute each intent
      for (const intent of detectedIntents) {
        try {
          console.log(`🔧 Executing: ${intent.action}`)
          
          const result = await executeAction(intent, {
            userId,
            sessionId,
            timestamp: new Date(),
            source: 'simple_ai_chat'
          })
          
          executionResults.push({
            intent: intent.action,
            success: result.success,
            message: result.message,
            data: result.data
          })
          
          if (result.success) {
            response += result.message + '\n\n'
            actionExecuted = true
            console.log(`✅ ${intent.action} executed successfully`)
          } else {
            response += `❌ Failed to execute ${intent.action}: ${result.message}\n\n`
            console.log(`❌ ${intent.action} failed: ${result.message}`)
          }
          
        } catch (error) {
          console.error(`❌ Error executing ${intent.action}:`, error)
          response += `❌ Error executing ${intent.action}: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`
        }
      }
    } else {
      // No intents detected, provide a helpful response
      response = `I understand you want to "${message}" but I couldn't detect a specific action to execute. 

Here are some commands I can execute:
• "Create a booking for [Property Name]"
• "Assign [Staff Name] to [Job]"
• "Schedule maintenance for [Property]"
• "Create calendar event for [Event Name]"
• "Notify [Staff Name] about [Message]"

Please try rephrasing your request using one of these patterns.`
    }
    
    // Clean up response
    response = response.trim()
    
    return NextResponse.json({
      success: true,
      response,
      actionExecuted,
      intents: detectedIntents,
      executionResults,
      model: 'intent-execution',
      actualModel: 'intent-execution',
      taskType: actionExecuted ? 'action' : 'conversation',
      confidence: detectedIntents.length > 0 ? Math.max(...detectedIntents.map(i => i.confidence)) : 0,
      responseTime: 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ SIMPLE AI CHAT ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Simple AI Chat with Intent Execution',
    usage: 'POST with { "message": "your message", "userId": "optional", "sessionId": "optional" }',
    examples: [
      'Create a booking for Maya House',
      'Assign John Doe to cleaning job',
      'Schedule maintenance for Villa Paradise',
      'Create calendar event for team meeting'
    ]
  })
}
