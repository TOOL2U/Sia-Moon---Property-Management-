import { NextRequest, NextResponse } from "next/server"
import { submitFeedback, getFeedbackAnalytics, getTrainingLogEntries } from "@/lib/ai/feedbackLoop"

/**
 * POST /api/ai-feedback
 * Submit feedback on an AI decision
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🧠 AI Feedback API: Processing feedback submission...')
    
    const body = await req.json()
    
    // Validate required fields
    const { logId, originalDecision, overrideReason, outcome } = body
    
    if (!logId || !originalDecision || !overrideReason || !outcome) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: logId, originalDecision, overrideReason, outcome"
      }, { status: 400 })
    }
    
    if (!['success', 'failure', 'neutral'].includes(outcome)) {
      return NextResponse.json({
        success: false,
        error: "Invalid outcome. Must be 'success', 'failure', or 'neutral'"
      }, { status: 400 })
    }
    
    // Submit feedback using the feedback loop
    const result = await submitFeedback({
      logId,
      originalDecision,
      overrideReason,
      outcome,
      adminId: body.adminId,
      category: body.category,
      severity: body.severity || 'medium',
      tags: body.tags || []
    })
    
    console.log(`✅ AI Feedback API: Feedback submitted for logId: ${logId}`)
    
    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      data: result
    })
    
  } catch (error) {
    console.error('❌ AI Feedback API: Error submitting feedback:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to submit feedback",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/ai-feedback
 * Get feedback analytics and training log entries
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'entries'
    const limit = parseInt(searchParams.get('limit') || '50')
    const agent = searchParams.get('agent') as 'COO' | 'CFO' | undefined
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'all' || 'week'
    
    console.log(`📊 AI Feedback API: Getting ${type} data...`)
    
    if (type === 'analytics') {
      // Get feedback analytics
      const analytics = await getFeedbackAnalytics(timeRange)
      
      return NextResponse.json({
        success: true,
        data: analytics,
        metadata: {
          type: 'analytics',
          timeRange,
          generatedAt: new Date().toISOString()
        }
      })
      
    } else {
      // Get training log entries
      const entries = await getTrainingLogEntries(limit, agent)
      
      return NextResponse.json({
        success: true,
        data: entries,
        metadata: {
          type: 'entries',
          count: entries.length,
          limit,
          agent: agent || 'all',
          generatedAt: new Date().toISOString()
        }
      })
    }
    
  } catch (error) {
    console.error('❌ AI Feedback API: Error getting data:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to get feedback data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ai-feedback
 * Update feedback entry (for admin corrections)
 */
export async function PUT(req: NextRequest) {
  try {
    console.log('🧠 AI Feedback API: Processing feedback update...')
    
    const body = await req.json()
    const { entryId, updates } = body
    
    if (!entryId) {
      return NextResponse.json({
        success: false,
        error: "Missing required field: entryId"
      }, { status: 400 })
    }
    
    // In production, this would update the training log entry in the database
    // For now, we'll just return a success response
    
    console.log(`✅ AI Feedback API: Feedback entry ${entryId} updated`)
    
    return NextResponse.json({
      success: true,
      message: "Feedback entry updated successfully",
      data: {
        entryId,
        updates,
        updatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ AI Feedback API: Error updating feedback:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to update feedback entry",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/ai-feedback
 * Delete feedback entry (for admin cleanup)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const entryId = searchParams.get('entryId')
    
    if (!entryId) {
      return NextResponse.json({
        success: false,
        error: "Missing required parameter: entryId"
      }, { status: 400 })
    }
    
    console.log(`🗑️ AI Feedback API: Deleting feedback entry: ${entryId}`)
    
    // In production, this would delete the training log entry from the database
    // For now, we'll just return a success response
    
    console.log(`✅ AI Feedback API: Feedback entry ${entryId} deleted`)
    
    return NextResponse.json({
      success: true,
      message: "Feedback entry deleted successfully",
      data: {
        entryId,
        deletedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ AI Feedback API: Error deleting feedback:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete feedback entry",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
