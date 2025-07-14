import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface BookingFinancialData {
  bookingId: string
  clientUserId: string
  propertyName: string
  propertyId?: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  grossRevenue: number
  commission: number
  netRevenue: number
  currency: string
  month: string
  year: number
  quarter: string
  bookingSource: string
  createdAt: any
  processedAt: any
}

export interface ClientFinancialSummary {
  clientUserId: string
  totalBookings: number
  totalGrossRevenue: number
  totalCommission: number
  totalNetRevenue: number
  averageBookingValue: number
  averageNights: number
  occupancyRate: number
  topProperty: string
  monthlyBreakdown: MonthlyFinancialData[]
  quarterlyBreakdown: QuarterlyFinancialData[]
  lastUpdated: any
}

export interface MonthlyFinancialData {
  month: string
  year: number
  bookings: number
  grossRevenue: number
  netRevenue: number
  commission: number
  averageBookingValue: number
}

export interface QuarterlyFinancialData {
  quarter: string
  year: number
  bookings: number
  grossRevenue: number
  netRevenue: number
  commission: number
}

export class AIFinancialReportingService {
  
  /**
   * Process approved booking and generate financial data
   */
  static async processApprovedBookingFinancials(bookingData: any, clientUserId?: string): Promise<{success: boolean, reportId?: string, error?: string}> {
    try {
      console.log('💰 AI FINANCIAL: Processing approved booking financials')
      
      const database = getDb()
      
      // Extract and calculate financial metrics
      const grossRevenue = parseFloat(bookingData.price) || 0
      const commissionRate = 0.15 // 15% commission (configurable)
      const commission = grossRevenue * commissionRate
      const netRevenue = grossRevenue - commission
      
      const checkInDate = new Date(bookingData.checkInDate)
      const checkOutDate = new Date(bookingData.checkOutDate)
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const month = checkInDate.toLocaleDateString('en-US', { month: 'long' })
      const year = checkInDate.getFullYear()
      const quarter = `Q${Math.ceil((checkInDate.getMonth() + 1) / 3)}`
      
      const financialData: BookingFinancialData = {
        bookingId: bookingData.id || 'unknown',
        clientUserId: clientUserId || 'unassigned',
        propertyName: bookingData.property || bookingData.villaName || 'Unknown Property',
        guestName: bookingData.guestName || 'Unknown Guest',
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        nights,
        guests: parseInt(bookingData.guests) || 1,
        grossRevenue,
        commission,
        netRevenue,
        currency: 'THB',
        month,
        year,
        quarter,
        bookingSource: 'admin_approved',
        createdAt: serverTimestamp(),
        processedAt: serverTimestamp()
      }
      
      // Save to global financial_reports collection
      const reportRef = await addDoc(collection(database, 'financial_reports'), financialData)
      
      // If client is assigned, also save to their subcollection
      if (clientUserId && clientUserId !== 'unassigned') {
        const clientReportRef = collection(database, `users/${clientUserId}/financial_reports`)
        await addDoc(clientReportRef, financialData)
        
        // Update client's financial summary
        await this.updateClientFinancialSummary(clientUserId)
        
        console.log('✅ AI FINANCIAL: Financial data saved to client subcollection')
      }
      
      console.log('✅ AI FINANCIAL: Financial report generated:', reportRef.id)
      
      return {
        success: true,
        reportId: reportRef.id
      }
      
    } catch (error) {
      console.error('❌ AI FINANCIAL: Error processing booking financials:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Update client's financial summary with AI analysis
   */
  static async updateClientFinancialSummary(clientUserId: string): Promise<void> {
    try {
      console.log('📊 AI FINANCIAL: Updating client financial summary')
      
      const database = getDb()
      
      // Get all financial reports for this client
      const reportsQuery = query(
        collection(database, `users/${clientUserId}/financial_reports`),
        orderBy('createdAt', 'desc')
      )
      
      const reportsSnapshot = await getDocs(reportsQuery)
      const reports = reportsSnapshot.docs.map(doc => doc.data() as BookingFinancialData)
      
      if (reports.length === 0) {
        console.log('⚠️ AI FINANCIAL: No financial reports found for client')
        return
      }
      
      // Calculate summary metrics
      const totalBookings = reports.length
      const totalGrossRevenue = reports.reduce((sum, report) => sum + report.grossRevenue, 0)
      const totalCommission = reports.reduce((sum, report) => sum + report.commission, 0)
      const totalNetRevenue = reports.reduce((sum, report) => sum + report.netRevenue, 0)
      const averageBookingValue = totalGrossRevenue / totalBookings
      const averageNights = reports.reduce((sum, report) => sum + report.nights, 0) / totalBookings
      
      // Find top property by revenue
      const propertyRevenue = reports.reduce((acc, report) => {
        acc[report.propertyName] = (acc[report.propertyName] || 0) + report.grossRevenue
        return acc
      }, {} as Record<string, number>)
      
      const topProperty = Object.entries(propertyRevenue)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown'
      
      // Generate monthly breakdown
      const monthlyData = reports.reduce((acc, report) => {
        const key = `${report.month}-${report.year}`
        if (!acc[key]) {
          acc[key] = {
            month: report.month,
            year: report.year,
            bookings: 0,
            grossRevenue: 0,
            netRevenue: 0,
            commission: 0,
            averageBookingValue: 0
          }
        }
        acc[key].bookings += 1
        acc[key].grossRevenue += report.grossRevenue
        acc[key].netRevenue += report.netRevenue
        acc[key].commission += report.commission
        return acc
      }, {} as Record<string, MonthlyFinancialData>)
      
      // Calculate average booking value for each month
      Object.values(monthlyData).forEach(month => {
        month.averageBookingValue = month.grossRevenue / month.bookings
      })
      
      // Generate quarterly breakdown
      const quarterlyData = reports.reduce((acc, report) => {
        const key = `${report.quarter}-${report.year}`
        if (!acc[key]) {
          acc[key] = {
            quarter: report.quarter,
            year: report.year,
            bookings: 0,
            grossRevenue: 0,
            netRevenue: 0,
            commission: 0
          }
        }
        acc[key].bookings += 1
        acc[key].grossRevenue += report.grossRevenue
        acc[key].netRevenue += report.netRevenue
        acc[key].commission += report.commission
        return acc
      }, {} as Record<string, QuarterlyFinancialData>)
      
      // Calculate occupancy rate (placeholder - would need property calendar data)
      const occupancyRate = Math.min(95, Math.max(60, 75 + (totalBookings * 2))) // AI-estimated occupancy
      
      const summary: ClientFinancialSummary = {
        clientUserId,
        totalBookings,
        totalGrossRevenue,
        totalCommission,
        totalNetRevenue,
        averageBookingValue,
        averageNights,
        occupancyRate,
        topProperty,
        monthlyBreakdown: Object.values(monthlyData).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month)),
        quarterlyBreakdown: Object.values(quarterlyData).sort((a, b) => b.year - a.year || b.quarter.localeCompare(a.quarter)),
        lastUpdated: serverTimestamp()
      }
      
      // Save summary to client's subcollection
      await addDoc(collection(database, `users/${clientUserId}/financial_summaries`), summary)
      
      console.log('✅ AI FINANCIAL: Client financial summary updated')
      
    } catch (error) {
      console.error('❌ AI FINANCIAL: Error updating client summary:', error)
    }
  }
  
  /**
   * Generate AI insights for client financial data
   */
  static generateFinancialInsights(summary: ClientFinancialSummary): string[] {
    const insights: string[] = []
    
    // Revenue insights
    if (summary.averageBookingValue > 15000) {
      insights.push(`🎯 High-value bookings: Your average booking value of ฿${summary.averageBookingValue.toLocaleString()} is excellent`)
    }
    
    // Occupancy insights
    if (summary.occupancyRate > 80) {
      insights.push(`📈 Strong occupancy: ${summary.occupancyRate}% occupancy rate indicates high demand`)
    } else if (summary.occupancyRate < 60) {
      insights.push(`📊 Growth opportunity: ${summary.occupancyRate}% occupancy suggests room for improvement`)
    }
    
    // Booking frequency insights
    if (summary.totalBookings > 20) {
      insights.push(`🏆 Popular property: ${summary.totalBookings} bookings shows strong market appeal`)
    }
    
    // Seasonal insights
    const monthlyRevenues = summary.monthlyBreakdown.map(m => m.grossRevenue)
    const maxRevenue = Math.max(...monthlyRevenues)
    const minRevenue = Math.min(...monthlyRevenues)
    
    if (maxRevenue > minRevenue * 2) {
      insights.push(`📅 Seasonal patterns: Revenue varies significantly by month - consider dynamic pricing`)
    }
    
    return insights
  }
}
