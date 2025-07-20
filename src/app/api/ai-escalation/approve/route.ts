import { NextRequest, NextResponse } from "next/server"
import { submitFeedback } from "@/lib/feedbackLoop"

/**
 * POST /api/ai-escalation/approve
 * Approve an escalated AI decision
 */
export async function POST(req: NextRequest) {
  try {
    console.log('✅ AI Escalation API: Processing approval...')
    
    const body = await req.json()
    const { logId, decision, agent, confidence, notes, adminId } = body
    
    // Validate required fields
    if (!logId || !decision || !agent) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: logId, decision, agent"
      }, { status: 400 })
    }
    
    // Submit feedback to the learning system
    const feedbackResult = await submitFeedback({
      logId,
      originalDecision: decision,
      overrideReason: notes || 'Admin approved escalated decision after review',
      outcome: 'success',
      agent: agent as 'COO' | 'CFO',
      confidence: confidence || 0,
      category: 'escalation_approved',
      adminId: adminId || 'admin',
      metadata: {
        approvedAt: new Date().toISOString(),
        reviewType: 'escalation_approval',
        adminNotes: notes
      }
    })
    
    if (!feedbackResult.success) {
      console.warn('⚠️ AI Escalation API: Feedback submission failed:', feedbackResult.error)
    }
    
    console.log(`✅ AI Escalation API: Decision ${logId} approved successfully`)
    
    return NextResponse.json({
      success: true,
      message: "Escalated decision approved successfully",
      data: {
        logId,
        decision,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminId || 'admin',
        notes: notes || null,
        feedbackSubmitted: feedbackResult.success,
        trainingLogId: feedbackResult.trainingLogId
      }
    })
    
  } catch (error) {
    console.error('❌ AI Escalation API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve escalated decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
