/**
 * Test endpoint for intent detection
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }
    
    console.log('🧪 TESTING INTENT DETECTION for message:', message)
    
    // Import and test intent detection
    const { detectIntent } = await import('@/lib/ai/intentDetector')
    const detectedIntents = detectIntent(message)
    
    console.log('🧪 DETECTED INTENTS:', detectedIntents)
    
    return NextResponse.json({
      success: true,
      message,
      intents: detectedIntents,
      count: detectedIntents.length
    })
    
  } catch (error) {
    console.error('🧪 INTENT TEST ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Intent detection test endpoint',
    usage: 'POST with { "message": "your test message" }'
  })
}
