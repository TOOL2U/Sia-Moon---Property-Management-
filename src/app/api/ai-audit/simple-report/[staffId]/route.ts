import { getDb } from '@/lib/firebase'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Simplified AI Audit Report API for testing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params
    const body = await request.json()
    const { staffName } = body

    console.log(`📊 Generating simple audit report for staff: ${staffId}`)

    const db = getDb()

    // Get job sessions for the last 7 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    console.log(`📅 Fetching sessions from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Query job sessions (simplified to avoid index requirement)
    const sessionsQuery = query(
      collection(db, 'job_sessions'),
      where('staffId', '==', staffId),
      limit(50)
    )

    const snapshot = await getDocs(sessionsQuery)
    const allSessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filter sessions by date range in memory
    const sessions = allSessions.filter(session => {
      if (!session.createdAt) return false
      const sessionDate = session.createdAt.toDate ? session.createdAt.toDate() : new Date(session.createdAt)
      return sessionDate >= startDate && sessionDate <= endDate
    })

    console.log(`✅ Retrieved ${sessions.length} job sessions (filtered from ${allSessions.length} total)`)

    // Calculate basic metrics
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const averageDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0) / completedSessions.length
      : 0

    const averageCompletionRate = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.checklistCompletionRate || 0), 0) / completedSessions.length
      : 0

    // Generate simple AI-style analysis (without OpenAI for now)
    const performanceScore = Math.round(averageCompletionRate * 0.7 + (completedSessions.length / Math.max(totalSessions, 1)) * 30)

    const report = {
      staffId,
      staffName,
      reportPeriod: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      generatedAt: new Date().toISOString(),
      performanceScore,
      analysis: {
        performanceScore,
        strengths: [
          totalSessions > 0 ? 'Active job participation' : 'No recent activity',
          averageCompletionRate > 80 ? 'High task completion rate' : 'Moderate task completion',
          completedSessions.length > 0 ? 'Consistent job completion' : 'Limited completion data'
        ],
        improvements: [
          averageCompletionRate < 90 ? 'Focus on completing all required tasks' : 'Maintain excellent completion rate',
          averageDuration > 120 ? 'Work on time efficiency' : 'Good time management',
          totalSessions < 5 ? 'Increase job activity' : 'Maintain current activity level'
        ],
        recommendations: [
          'Continue current performance level',
          'Focus on consistent quality delivery',
          'Maintain detailed documentation'
        ],
        trends: [
          `Completed ${completedSessions.length} out of ${totalSessions} jobs this week`,
          `Average completion rate: ${averageCompletionRate.toFixed(1)}%`,
          `Average job duration: ${averageDuration.toFixed(0)} minutes`
        ],
        summary: `${staffName} has completed ${completedSessions.length} jobs with an average completion rate of ${averageCompletionRate.toFixed(1)}% and performance score of ${performanceScore}.`
      },
      rawMetrics: {
        averageJobDuration: averageDuration,
        onTimePerformance: completedSessions.length / Math.max(totalSessions, 1),
        averageCompletionRate,
        documentationScore: completedSessions.reduce((sum, s) => sum + (s.photoCount || 0), 0) / Math.max(completedSessions.length, 1),
        locationAccuracy: completedSessions.filter(s => s.startLocation && s.endLocation).length / Math.max(completedSessions.length, 1),
        noteQuality: completedSessions.reduce((sum, s) => sum + (s.noteCount || 0), 0) / Math.max(completedSessions.length, 1),
        sessionCount: totalSessions,
        totalJobsCompleted: completedSessions.length
      },
      sessionCount: totalSessions,
      recommendations: [
        'Continue maintaining high performance standards',
        'Focus on consistent task completion',
        'Ensure proper documentation for all jobs'
      ],
      trends: [
        `${completedSessions.length} jobs completed this week`,
        `${averageCompletionRate.toFixed(1)}% average completion rate`,
        performanceScore >= 80 ? 'Strong performance trend' : 'Room for improvement'
      ],
      anomalies: [
        ...(averageDuration > 150 ? ['Some jobs taking longer than expected'] : []),
        ...(averageCompletionRate < 80 ? ['Low task completion rate detected'] : []),
        ...(totalSessions === 0 ? ['No job activity in the past week'] : [])
      ]
    }

    console.log(`✅ Simple audit report generated with score: ${performanceScore}`)

    return NextResponse.json({
      success: true,
      message: 'Simple audit report generated successfully',
      report,
      generatedAt: report.generatedAt,
      performanceScore: report.performanceScore
    })

  } catch (error) {
    console.error('❌ Error generating simple audit report:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate simple audit report',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
