/**
 * AI Feedback API Route
 * Handles admin feedback submission for AI decisions
 */

import { NextRequest, NextResponse } from 'next/server'
import AILogsService from '@/services/AILogsService'

/**
 * POST /api/ai/feedback
 * Submit admin feedback for an AI decision
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('💬 AI Feedback API: Submitting feedback for decision:', body.decisionId)

    // Validate required fields
    if (!body.decisionId || !body.logId || !body.rating || !body.adminId || !body.adminName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: decisionId, logId, rating, adminId, adminName'
      }, { status: 400 })
    }

    // Validate rating
    if (!['positive', 'negative'].includes(body.rating)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid rating. Must be "positive" or "negative"'
      }, { status: 400 })
    }

    // Submit feedback through service
    await AILogsService.submitFeedback({
      decisionId: body.decisionId,
      logId: body.logId,
      rating: body.rating,
      comment: body.comment,
      adminId: body.adminId,
      adminName: body.adminName
    })

    console.log('✅ AI Feedback API: Feedback submitted successfully')

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    })

  } catch (error) {
    console.error('❌ AI Feedback API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/feedback
 * Get feedback for a specific AI log
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const logId = searchParams.get('logId')

    if (!logId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: logId'
      }, { status: 400 })
    }

    console.log('📋 AI Feedback API: Getting feedback for log:', logId)

    // Get feedback from service
    const feedback = await AILogsService.getFeedbackForLog(logId)

    console.log(`✅ AI Feedback API: Retrieved ${feedback.length} feedback entries`)

    return NextResponse.json({
      success: true,
      feedback
    })

  } catch (error) {
    console.error('❌ AI Feedback API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
