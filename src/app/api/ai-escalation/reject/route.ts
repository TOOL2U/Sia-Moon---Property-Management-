import { NextRequest, NextResponse } from "next/server"
import { submitFeedback } from "@/lib/feedbackLoop"

/**
 * POST /api/ai-escalation/reject
 * Reject an escalated AI decision
 */
export async function POST(req: NextRequest) {
  try {
    console.log('❌ AI Escalation API: Processing rejection...')
    
    const body = await req.json()
    const { logId, decision, agent, confidence, notes, adminId, reason } = body
    
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
      overrideReason: reason || notes || 'Admin rejected escalated decision after review',
      outcome: 'failure',
      agent: agent as 'COO' | 'CFO',
      confidence: confidence || 0,
      category: 'escalation_rejected',
      adminId: adminId || 'admin',
      metadata: {
        rejectedAt: new Date().toISOString(),
        reviewType: 'escalation_rejection',
        adminNotes: notes,
        rejectionReason: reason
      }
    })
    
    if (!feedbackResult.success) {
      console.warn('⚠️ AI Escalation API: Feedback submission failed:', feedbackResult.error)
    }
    
    console.log(`❌ AI Escalation API: Decision ${logId} rejected successfully`)
    
    return NextResponse.json({
      success: true,
      message: "Escalated decision rejected successfully",
      data: {
        logId,
        decision,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminId || 'admin',
        notes: notes || null,
        reason: reason || null,
        feedbackSubmitted: feedbackResult.success,
        trainingLogId: feedbackResult.trainingLogId
      }
    })
    
  } catch (error) {
    console.error('❌ AI Escalation API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reject escalated decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
