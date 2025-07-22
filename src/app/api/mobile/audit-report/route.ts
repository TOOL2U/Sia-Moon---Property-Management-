import { db } from '@/lib/firebase'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 📱 Mobile App - Audit Report Submission API
 *
 * Receives completed audit reports from mobile app AI system
 * Stores them in the ai_audits collection for webapp consumption
 */

interface MobileAuditReport {
  staffId: string
  weekStart: string        // ISO date (Monday)
  weekEnd: string          // ISO date (Sunday)
  trustScore: number       // 0-100
  qualityScore: number     // 0-100

  metrics: {
    jobsCompleted: number
    jobsAccepted: number
    averageCompletionTime: number    // minutes
    onTimeCompletionRate: number     // 0-1
    photoComplianceRate: number      // 0-1
    gpsAccuracy: number              // 0-1
    aiUsageCount: number
    responseTime: number             // average response time
  }

  insights: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    behavioralPatterns: string[]
  }

  trends: {
    trustScoreTrend: 'improving' | 'declining' | 'stable'
    qualityTrend: 'improving' | 'declining' | 'stable'
    productivityTrend: 'improving' | 'declining' | 'stable'
  }

  aiAnalysis: string       // Full AI-generated analysis
  weekNumber: number       // Week number of the year
  year: number

  // Mobile app specific fields
  generatedBy: string      // Mobile app version/identifier
  dataPoints: number       // Number of data points used in analysis
  confidenceLevel: number  // 0-1, confidence in the analysis
}

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Mobile App: Audit report received')

    const auditReport: MobileAuditReport = await request.json()

    // Validate required fields
    if (!auditReport.staffId || !auditReport.weekStart || !auditReport.weekEnd) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: staffId, weekStart, weekEnd' },
        { status: 400 }
      )
    }

    // Validate scores are within range
    if (auditReport.trustScore < 0 || auditReport.trustScore > 100 ||
        auditReport.qualityScore < 0 || auditReport.qualityScore > 100) {
      return NextResponse.json(
        { success: false, error: 'Trust and quality scores must be between 0-100' },
        { status: 400 }
      )
    }

    console.log('📊 Processing audit report:', {
      staffId: auditReport.staffId,
      weekStart: auditReport.weekStart,
      trustScore: auditReport.trustScore,
      qualityScore: auditReport.qualityScore,
      dataPoints: auditReport.dataPoints
    })

    // Create the complete audit report with timestamps
    const completeReport = {
      ...auditReport,
      createdAt: new Date().toISOString(),
      receivedAt: serverTimestamp(),
      source: 'mobile_app'
    }

    // Store in the ai_audits collection using the structure from the guide
    if (!db) {
      throw new Error('Database not initialized')
    }

    const reportId = `report_${auditReport.weekStart}`
    const reportRef = doc(db, 'ai_audits', auditReport.staffId, 'reports', reportId)

    await setDoc(reportRef, completeReport)
    console.log('✅ Audit report stored:', `${auditReport.staffId}/${reportId}`)

    // Update metadata
    const metadataRef = doc(db, 'ai_audits', 'metadata')
    await setDoc(metadataRef, {
      last_audit_run: serverTimestamp(),
      audit_schedule: 'weekly',
      last_mobile_report: {
        staffId: auditReport.staffId,
        weekStart: auditReport.weekStart,
        receivedAt: serverTimestamp()
      },
      updated_at: serverTimestamp()
    }, { merge: true })

    // Log the audit report reception
    await addDoc(collection(db, 'ai_action_logs'), {
      timestamp: serverTimestamp(),
      agent: 'mobile-audit-system',
      action: 'audit_report_received',
      staffId: auditReport.staffId,
      success: true,
      details: {
        weekStart: auditReport.weekStart,
        weekEnd: auditReport.weekEnd,
        trustScore: auditReport.trustScore,
        qualityScore: auditReport.qualityScore,
        jobsCompleted: auditReport.metrics.jobsCompleted,
        dataPoints: auditReport.dataPoints,
        confidenceLevel: auditReport.confidenceLevel,
        generatedBy: auditReport.generatedBy
      }
    })

    // Trigger real-time update notification
    // This will be picked up by the webapp's real-time listeners
    await addDoc(collection(db, 'audit_notifications'), {
      type: 'new_audit_report',
      staffId: auditReport.staffId,
      weekStart: auditReport.weekStart,
      trustScore: auditReport.trustScore,
      qualityScore: auditReport.qualityScore,
      timestamp: serverTimestamp(),
      read: false
    })

    console.log('🔔 Real-time notification sent for new audit report')

    return NextResponse.json({
      success: true,
      message: 'Audit report received and stored successfully',
      reportId,
      staffId: auditReport.staffId,
      weekStart: auditReport.weekStart,
      scores: {
        trust: auditReport.trustScore,
        quality: auditReport.qualityScore
      }
    })

  } catch (error) {
    console.error('❌ Mobile App Audit Report Error:', error)

    // Log the error
    try {
      if (db) {
        await addDoc(collection(db, 'ai_action_logs'), {
          timestamp: serverTimestamp(),
          agent: 'mobile-audit-system',
          action: 'audit_report_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing and status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Mobile App Audit Report API is active',
    description: 'This endpoint receives completed audit reports from the mobile app AI system',
    storageLocation: 'ai_audits/{staffId}/reports/report_{weekStart}',
    expectedData: {
      staffId: 'string (required)',
      weekStart: 'ISO date string - Monday (required)',
      weekEnd: 'ISO date string - Sunday (required)',
      trustScore: 'number 0-100 (required)',
      qualityScore: 'number 0-100 (required)',
      metrics: 'object with job completion metrics (required)',
      insights: 'object with strengths, concerns, recommendations (required)',
      trends: 'object with trend indicators (required)',
      aiAnalysis: 'string with full AI analysis (required)',
      weekNumber: 'number (required)',
      year: 'number (required)',
      generatedBy: 'string - mobile app identifier (optional)',
      dataPoints: 'number - data points used (optional)',
      confidenceLevel: 'number 0-1 - analysis confidence (optional)'
    }
  })
}
