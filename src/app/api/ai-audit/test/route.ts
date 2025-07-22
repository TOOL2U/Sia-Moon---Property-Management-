import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple test endpoint to verify AI audit API is working
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 AI Audit Test API called')
    
    return NextResponse.json({
      success: true,
      message: 'AI Audit API is working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasFirebase: !!process.env.FIREBASE_ADMIN_PROJECT_ID
      }
    })
  } catch (error) {
    console.error('❌ AI Audit Test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test API failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 AI Audit Test POST API called')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'AI Audit POST API is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ AI Audit Test POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test POST API failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
