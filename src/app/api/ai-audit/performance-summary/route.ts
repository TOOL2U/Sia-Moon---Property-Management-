import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

/**
 * Performance Summary API
 * Provides overall performance dashboard data for management
 * 
 * SECURITY: Management-only access - aggregated insights across all staff
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generating performance summary dashboard data...')
    
    // TODO: Add management authentication check
    // if (!isManagementUser(request.user)) {
    //   return NextResponse.json({ error: 'Unauthorized - Management access only' }, { status: 403 })
    // }
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'last_month'
    
    const db = getDb()
    
    // Get all staff members
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('isActive', '==', true)
    )
    const staffSnapshot = await getDocs(staffQuery)
    const allStaff = staffSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📋 Analyzing performance for ${allStaff.length} active staff members`)
    
    // Calculate date range
    const dateRange = getPeriodRange(period)
    
    // Collect performance data for all staff
    const performanceData = []
    const departmentStats = new Map()
    const roleStats = new Map()
    
    for (const staff of allStaff) {
      try {
        // Get latest audit reports for this staff member
        const reportsQuery = query(
          collection(db, 'ai_audits', staff.id, 'reports'),
          where('generatedAt', '>=', dateRange.start.toISOString()),
          orderBy('generatedAt', 'desc'),
          limit(10)
        )
        
        const reportsSnapshot = await getDocs(reportsQuery)
        const reports = reportsSnapshot.docs.map(doc => doc.data())
        
        if (reports.length > 0) {
          const latestReport = reports[0]
          const averageScore = reports.reduce((sum, r) => sum + (r.performanceScore || 0), 0) / reports.length
          
          const staffPerformance = {
            staffId: staff.id,
            staffName: staff.name || staff.email,
            department: staff.department || 'Unknown',
            role: staff.role || 'Staff',
            currentScore: latestReport.performanceScore || 0,
            averageScore: Math.round(averageScore),
            totalReports: reports.length,
            lastReportDate: latestReport.generatedAt,
            trend: calculateTrend(reports),
            sessionCount: latestReport.sessionCount || 0,
            anomalies: latestReport.anomalies || []
          }
          
          performanceData.push(staffPerformance)
          
          // Update department stats
          const dept = staffPerformance.department
          if (!departmentStats.has(dept)) {
            departmentStats.set(dept, { totalScore: 0, count: 0, staff: [] })
          }
          const deptData = departmentStats.get(dept)
          deptData.totalScore += staffPerformance.averageScore
          deptData.count += 1
          deptData.staff.push(staffPerformance)
          
          // Update role stats
          const role = staffPerformance.role
          if (!roleStats.has(role)) {
            roleStats.set(role, { totalScore: 0, count: 0, staff: [] })
          }
          const roleData = roleStats.get(role)
          roleData.totalScore += staffPerformance.averageScore
          roleData.count += 1
          roleData.staff.push(staffPerformance)
        }
      } catch (error) {
        console.error(`❌ Error processing staff ${staff.id}:`, error)
      }
    }
    
    // Generate summary statistics
    const summary = generateOverallSummary(performanceData)
    
    // Process department statistics
    const departmentSummary = Array.from(departmentStats.entries()).map(([dept, data]) => ({
      department: dept,
      averageScore: Math.round(data.totalScore / data.count),
      staffCount: data.count,
      topPerformer: data.staff.reduce((top, current) => 
        current.averageScore > top.averageScore ? current : top
      ),
      needsAttention: data.staff.filter(s => s.averageScore < 60).length
    }))
    
    // Process role statistics
    const roleSummary = Array.from(roleStats.entries()).map(([role, data]) => ({
      role: role,
      averageScore: Math.round(data.totalScore / data.count),
      staffCount: data.count,
      topPerformer: data.staff.reduce((top, current) => 
        current.averageScore > top.averageScore ? current : top
      )
    }))
    
    // Identify top performers and those needing attention
    const topPerformers = performanceData
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5)
    
    const needsAttention = performanceData
      .filter(staff => staff.averageScore < 60 || staff.anomalies.length > 2)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5)
    
    // Recent trends analysis
    const recentTrends = {
      improving: performanceData.filter(s => s.trend === 'improving').length,
      declining: performanceData.filter(s => s.trend === 'declining').length,
      stable: performanceData.filter(s => s.trend === 'stable').length
    }
    
    console.log(`✅ Performance summary generated for ${performanceData.length} staff members`)
    
    return NextResponse.json({
      success: true,
      period,
      generatedAt: new Date().toISOString(),
      summary,
      performanceData,
      departmentSummary,
      roleSummary,
      topPerformers,
      needsAttention,
      recentTrends,
      totalStaffAnalyzed: performanceData.length,
      totalStaffActive: allStaff.length
    })
    
  } catch (error) {
    console.error('❌ Error generating performance summary:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate performance summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Calculate trend direction from reports
 */
function calculateTrend(reports: any[]): 'improving' | 'declining' | 'stable' {
  if (reports.length < 2) return 'stable'
  
  const scores = reports.map(r => r.performanceScore || 0)
  const recent = scores.slice(0, Math.ceil(scores.length / 2))
  const older = scores.slice(Math.ceil(scores.length / 2))
  
  const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length
  const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length
  
  if (recentAvg > olderAvg + 5) return 'improving'
  if (recentAvg < olderAvg - 5) return 'declining'
  return 'stable'
}

/**
 * Generate overall summary statistics
 */
function generateOverallSummary(performanceData: any[]) {
  if (performanceData.length === 0) {
    return {
      overallAverageScore: 0,
      totalStaffWithReports: 0,
      excellentPerformers: 0,
      needsImprovement: 0,
      totalJobSessions: 0,
      totalAnomalies: 0
    }
  }
  
  const scores = performanceData.map(s => s.averageScore)
  const overallAverageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  
  return {
    overallAverageScore,
    totalStaffWithReports: performanceData.length,
    excellentPerformers: performanceData.filter(s => s.averageScore >= 85).length,
    goodPerformers: performanceData.filter(s => s.averageScore >= 70 && s.averageScore < 85).length,
    needsImprovement: performanceData.filter(s => s.averageScore < 60).length,
    totalJobSessions: performanceData.reduce((sum, s) => sum + s.sessionCount, 0),
    totalAnomalies: performanceData.reduce((sum, s) => sum + s.anomalies.length, 0),
    scoreDistribution: {
      excellent: performanceData.filter(s => s.averageScore >= 85).length,
      good: performanceData.filter(s => s.averageScore >= 70 && s.averageScore < 85).length,
      average: performanceData.filter(s => s.averageScore >= 50 && s.averageScore < 70).length,
      poor: performanceData.filter(s => s.averageScore < 50).length
    }
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
      start.setDate(start.getDate() - 30)
  }
  
  return { start, end }
}
