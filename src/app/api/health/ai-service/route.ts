import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check if AI service environment variables are configured
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    
    if (!openaiKey && !anthropicKey) {
      return NextResponse.json({
        status: 'error',
        message: 'No AI service keys configured',
        responseTime: Date.now() - startTime,
        services: {
          openai: 'not_configured',
          anthropic: 'not_configured'
        }
      }, { status: 503 })
    }

    const services: Record<string, string> = {}
    const errors: string[] = []

    // Test OpenAI if configured
    if (openaiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        if (openaiResponse.ok) {
          services.openai = 'healthy'
        } else {
          services.openai = 'error'
          errors.push(`OpenAI API returned ${openaiResponse.status}`)
        }
      } catch (error) {
        services.openai = 'error'
        errors.push(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      services.openai = 'not_configured'
    }

    // Test Anthropic if configured
    if (anthropicKey) {
      try {
        // Anthropic doesn't have a simple health check endpoint, so we'll just verify the key format
        if (anthropicKey.startsWith('sk-ant-')) {
          services.anthropic = 'configured'
        } else {
          services.anthropic = 'invalid_key'
          errors.push('Anthropic API key format invalid')
        }
      } catch (error) {
        services.anthropic = 'error'
        errors.push(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      services.anthropic = 'not_configured'
    }

    const responseTime = Date.now() - startTime
    const hasHealthyService = Object.values(services).some(status => 
      status === 'healthy' || status === 'configured'
    )

    const overallStatus = hasHealthyService ? 'healthy' : 'error'

    const response = {
      status: overallStatus,
      message: hasHealthyService ? 'AI services operational' : 'No AI services available',
      responseTime,
      services,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }

    console.log(`🤖 AI Service health check: ${overallStatus} (${responseTime}ms)`)

    return NextResponse.json(response, { 
      status: overallStatus === 'healthy' ? 200 : 503 
    })

  } catch (error) {
    console.error('❌ AI Service health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
