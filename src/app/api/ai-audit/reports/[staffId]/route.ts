import { NextRequest, NextResponse } from 'next/server'
import { AIAuditService } from '@/services/AIAuditService'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

/**
 * AI Audit Reports API
 * Provides management access to staff performance audit reports
 * 
 * SECURITY: Management-only access - staff remain unaware
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'last_month'
    
    console.log(`📊 Fetching audit reports for staff: ${staffId}, period: ${period}`)
    
    // TODO: Add management authentication check
    // if (!isManagementUser(request.user)) {
    //   return NextResponse.json({ error: 'Unauthorized - Management access only' }, { status: 403 })
    // }
    
    const db = getDb()
    
    // Calculate date range based on period
    const dateRange = getPeriodRange(period)
    
    // Fetch audit reports from Firestore
    const reportsQuery = query(
      collection(db, 'ai_audits', staffId, 'reports'),
      where('generatedAt', '>=', dateRange.start.toISOString()),
      where('generatedAt', '<=', dateRange.end.toISOString()),
      orderBy('generatedAt', 'desc'),
      limit(50)
    )
    
    const snapshot = await getDocs(reportsQuery)
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Generate summary statistics
    const summary = generateSummaryStats(reports)
    
    console.log(`✅ Retrieved ${reports.length} audit reports for ${staffId}`)
    
    return NextResponse.json({
      success: true,
      staffId,
      period,
      reports,
      summary,
      totalReports: reports.length
    })
    
  } catch (error) {
    console.error('❌ Error fetching audit reports:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch audit reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params
    const body = await request.json()
    const { staffName, forceRegenerate = false } = body
    
    console.log(`🤖 Generating audit report for staff: ${staffId}`)
    
    // TODO: Add management authentication check
    // if (!isManagementUser(request.user)) {
    //   return NextResponse.json({ error: 'Unauthorized - Management access only' }, { status: 403 })
    // }
    
    if (!staffName) {
      return NextResponse.json({
        success: false,
        error: 'Staff name is required'
      }, { status: 400 })
    }
    
    // Generate weekly audit report
    const report = await AIAuditService.generateWeeklyAuditReport(staffId, staffName)
    
    console.log(`✅ Audit report generated for ${staffName} with score: ${report.performanceScore}`)
    
    return NextResponse.json({
      success: true,
      message: 'Audit report generated successfully',
      report,
      generatedAt: report.generatedAt,
      performanceScore: report.performanceScore
    })
    
  } catch (error) {
    console.error('❌ Error generating audit report:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate audit report',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get date range based on period parameter
 */
function getPeriodRange(period: string): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  
  switch (period) {
    case 'last_week':
      start.setDate(start.getDate() - 7)
      break
    case 'last_month':
      start.setDate(start.getDate() - 30)
      break
    case 'last_quarter':
      start.setDate(start.getDate() - 90)
      break
    case 'last_year':
      start.setDate(start.getDate() - 365)
      break
    default:
      start.setDate(start.getDate() - 30) // Default to last month
  }
  
  return { start, end }
}

/**
 * Generate summary statistics from audit reports
 */
function generateSummaryStats(reports: any[]) {
  if (reports.length === 0) {
    return {
      averageScore: 0,
      totalReports: 0,
      trendDirection: 'stable',
      lastReportDate: null,
      performanceCategory: 'no_data'
    }
  }
  
  const scores = reports.map(r => r.performanceScore || 0)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  
  // Calculate trend (comparing first half vs second half of reports)
  const midpoint = Math.floor(reports.length / 2)
  const recentScores = scores.slice(0, midpoint)
  const olderScores = scores.slice(midpoint)
  
  const recentAvg = recentScores.length > 0 
    ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length 
    : averageScore
  const olderAvg = olderScores.length > 0 
    ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length 
    : averageScore
  
  let trendDirection = 'stable'
  if (recentAvg > olderAvg + 5) trendDirection = 'improving'
  else if (recentAvg < olderAvg - 5) trendDirection = 'declining'
  
  // Performance category
  let performanceCategory = 'average'
  if (averageScore >= 85) performanceCategory = 'excellent'
  else if (averageScore >= 70) performanceCategory = 'good'
  else if (averageScore >= 50) performanceCategory = 'needs_improvement'
  else performanceCategory = 'poor'
  
  return {
    averageScore: Math.round(averageScore),
    totalReports: reports.length,
    trendDirection,
    lastReportDate: reports[0]?.generatedAt || null,
    performanceCategory,
    scoreRange: {
      min: Math.min(...scores),
      max: Math.max(...scores)
    },
    recentPerformance: Math.round(recentAvg)
  }
}
