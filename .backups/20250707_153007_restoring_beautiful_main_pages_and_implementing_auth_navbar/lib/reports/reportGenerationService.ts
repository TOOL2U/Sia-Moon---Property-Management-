import { startOfMonth, endOfMonth, getDaysInMonth, format, parseISO } from 'date-fns'
import DatabaseService from '@/lib/dbService'
import { MonthlyReport, FinancialTransaction, Booking, Property } from '@/lib/db'

export interface ReportGenerationOptions {
  propertyId: string
  year: number
  month: number
  currency?: 'USD' | 'EUR' | 'GBP' | 'THB'
  generatePdf?: boolean
}

export interface ReportGenerationResult {
  success: boolean
  report?: MonthlyReport
  error?: string
  pdfUrl?: string
}

/**
 * Service for generating comprehensive monthly property reports
 */
export class ReportGenerationService {
  
  /**
   * Generate a complete monthly report for a property
   */
  static async generateMonthlyReport(options: ReportGenerationOptions): Promise<ReportGenerationResult> {
    try {
      const { propertyId, year, month, currency = 'USD' } = options
      
      console.log(`📊 Generating monthly report for property ${propertyId}, ${year}-${month.toString().padStart(2, '0')}`)
      
      // Check if report already exists
      const existingReportResult = await DatabaseService.getMonthlyReport(propertyId, year, month)
      if (existingReportResult.error) {
        return { success: false, error: existingReportResult.error.message }
      }
      
      // Get property details
      const propertyResult = await DatabaseService.getProperty(propertyId)
      if (propertyResult.error || !propertyResult.data) {
        return { success: false, error: 'Property not found' }
      }
      
      const property = propertyResult.data
      
      // Calculate date range for the month
      const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
      const totalNights = getDaysInMonth(new Date(year, month - 1))
      
      // Get financial transactions for the month
      const transactionsResult = await DatabaseService.getFinancialTransactionsByDateRange(
        propertyId, 
        startDate, 
        endDate
      )
      
      if (transactionsResult.error) {
        return { success: false, error: transactionsResult.error.message }
      }
      
      const transactions = transactionsResult.data || []
      
      // Get bookings for the month
      const allBookingsResult = await DatabaseService.getBookingsByProperty(propertyId)
      if (allBookingsResult.error) {
        return { success: false, error: allBookingsResult.error.message }
      }
      
      const allBookings = allBookingsResult.data || []
      const monthBookings = allBookings.filter(booking => {
        const checkIn = parseISO(booking.check_in)
        const checkOut = parseISO(booking.check_out)
        const monthStart = startOfMonth(new Date(year, month - 1))
        const monthEnd = endOfMonth(new Date(year, month - 1))
        
        // Booking overlaps with the month if check-in is before month end and check-out is after month start
        return checkIn <= monthEnd && checkOut >= monthStart
      })
      
      // Calculate financial metrics
      const incomeTransactions = transactions.filter(t => t.type === 'income')
      const expenseTransactions = transactions.filter(t => t.type === 'expense')
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
      const netIncome = totalIncome - totalExpenses
      
      // Calculate income breakdown by category
      const incomeBreakdown: Record<string, number> = {}
      incomeTransactions.forEach(t => {
        incomeBreakdown[t.category] = (incomeBreakdown[t.category] || 0) + t.amount
      })
      
      // Calculate expense breakdown by category
      const expenseBreakdown: Record<string, number> = {}
      expenseTransactions.forEach(t => {
        expenseBreakdown[t.category] = (expenseBreakdown[t.category] || 0) + t.amount
      })
      
      // Calculate occupancy metrics
      let occupiedNights = 0
      const bookingDetails = monthBookings.map(booking => {
        const checkIn = parseISO(booking.check_in)
        const checkOut = parseISO(booking.check_out)
        const monthStart = startOfMonth(new Date(year, month - 1))
        const monthEnd = endOfMonth(new Date(year, month - 1))
        
        // Calculate nights within the month
        const effectiveCheckIn = checkIn > monthStart ? checkIn : monthStart
        const effectiveCheckOut = checkOut < monthEnd ? checkOut : monthEnd
        const nights = Math.max(0, Math.ceil((effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) / (1000 * 60 * 60 * 24)))
        
        occupiedNights += nights
        
        // Find revenue for this booking
        const bookingRevenue = incomeTransactions
          .filter(t => t.booking_id === booking.id)
          .reduce((sum, t) => sum + t.amount, 0)
        
        return {
          id: booking.id,
          guest_name: booking.guest_name,
          check_in: booking.check_in,
          check_out: booking.check_out,
          nights,
          revenue: bookingRevenue,
          platform: booking.platform || 'manual'
        }
      })
      
      const occupancyRate = totalNights > 0 ? (occupiedNights / totalNights) * 100 : 0
      const averageBookingValue = monthBookings.length > 0 ? totalIncome / monthBookings.length : 0
      const averageStayLength = monthBookings.length > 0 ? occupiedNights / monthBookings.length : 0
      const revenuePerAvailableNight = totalNights > 0 ? totalIncome / totalNights : 0
      
      // Generate key notes and insights
      const keyNotes = this.generateKeyNotes({
        property,
        totalIncome,
        totalExpenses,
        netIncome,
        occupancyRate,
        monthBookings,
        transactions,
        currency
      })
      
      // Create the report
      const reportData: Omit<MonthlyReport, 'id' | 'created_at' | 'updated_at'> = {
        property_id: propertyId,
        year,
        month,
        status: 'completed',
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_income: netIncome,
        currency,
        total_nights: totalNights,
        occupied_nights: occupiedNights,
        occupancy_rate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimal places
        total_bookings: monthBookings.length,
        average_booking_value: Math.round(averageBookingValue),
        average_stay_length: Math.round(averageStayLength * 100) / 100,
        revenue_per_available_night: Math.round(revenuePerAvailableNight),
        income_breakdown: incomeBreakdown,
        expense_breakdown: expenseBreakdown,
        booking_details: bookingDetails,
        key_notes: keyNotes,
        generated_at: new Date().toISOString(),
        generated_by: 'system'
      }
      
      // Save or update the report
      let reportResult
      if (existingReportResult.data) {
        reportResult = await DatabaseService.updateMonthlyReport(existingReportResult.data.id, reportData)
      } else {
        reportResult = await DatabaseService.createMonthlyReport(reportData)
      }
      
      if (reportResult.error) {
        return { success: false, error: reportResult.error.message }
      }
      
      console.log(`✅ Monthly report generated successfully for ${property.name}`)

      // Trigger notification for report generation
      try {
        const { NotificationTriggers } = await import('@/lib/notifications/notificationTriggers')
        await NotificationTriggers.onReportGenerated(reportResult.data!)
      } catch (error) {
        console.error('Error sending report notification:', error)
        // Don't fail the report generation if notification fails
      }

      return {
        success: true,
        report: reportResult.data!
      }
      
    } catch (error) {
      console.error('❌ Error generating monthly report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
  
  /**
   * Generate key insights and notes for the report
   */
  private static generateKeyNotes(data: {
    property: Property
    totalIncome: number
    totalExpenses: number
    netIncome: number
    occupancyRate: number
    monthBookings: any[]
    transactions: FinancialTransaction[]
    currency: string
  }): string[] {
    const notes: string[] = []
    const { totalIncome, totalExpenses, netIncome, occupancyRate, monthBookings, currency } = data
    
    // Format currency amounts
    const formatAmount = (amount: number) => {
      const formatted = (amount / 100).toFixed(2)
      return `${currency} ${formatted}`
    }
    
    // Income insights
    if (totalIncome > 0) {
      notes.push(`Generated ${formatAmount(totalIncome)} in total revenue`)
    }
    
    // Occupancy insights
    if (occupancyRate >= 80) {
      notes.push(`Excellent occupancy rate of ${occupancyRate.toFixed(1)}%`)
    } else if (occupancyRate >= 60) {
      notes.push(`Good occupancy rate of ${occupancyRate.toFixed(1)}%`)
    } else if (occupancyRate >= 40) {
      notes.push(`Moderate occupancy rate of ${occupancyRate.toFixed(1)}% - consider marketing strategies`)
    } else {
      notes.push(`Low occupancy rate of ${occupancyRate.toFixed(1)}% - review pricing and marketing`)
    }
    
    // Booking insights
    if (monthBookings.length > 0) {
      notes.push(`Hosted ${monthBookings.length} booking${monthBookings.length > 1 ? 's' : ''}`)
    }
    
    // Profitability insights
    if (netIncome > 0) {
      notes.push(`Positive net income of ${formatAmount(netIncome)}`)
    } else if (netIncome < 0) {
      notes.push(`Net loss of ${formatAmount(Math.abs(netIncome))} - review expenses`)
    }
    
    // Expense insights
    if (totalExpenses > totalIncome * 0.5) {
      notes.push(`High expense ratio (${((totalExpenses / totalIncome) * 100).toFixed(1)}%) - review cost optimization`)
    }
    
    return notes
  }
  
  /**
   * Generate reports for all properties for a given month
   */
  static async generateAllPropertyReports(year: number, month: number): Promise<{
    success: boolean
    results: ReportGenerationResult[]
    summary: {
      total: number
      successful: number
      failed: number
    }
  }> {
    try {
      console.log(`📊 Generating reports for all properties - ${year}-${month.toString().padStart(2, '0')}`)
      
      // Get all properties
      const propertiesResult = await DatabaseService.getAllProperties()
      if (propertiesResult.error) {
        return {
          success: false,
          results: [],
          summary: { total: 0, successful: 0, failed: 1 }
        }
      }
      
      const properties = propertiesResult.data || []
      const results: ReportGenerationResult[] = []
      
      // Generate report for each property
      for (const property of properties) {
        const result = await this.generateMonthlyReport({
          propertyId: property.id,
          year,
          month,
          currency: 'USD' // Default currency, could be property-specific
        })
        
        results.push(result)
      }
      
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      console.log(`✅ Report generation complete: ${successful}/${properties.length} successful`)
      
      return {
        success: true,
        results,
        summary: {
          total: properties.length,
          successful,
          failed
        }
      }
      
    } catch (error) {
      console.error('❌ Error generating all property reports:', error)
      return {
        success: false,
        results: [],
        summary: { total: 0, successful: 0, failed: 1 }
      }
    }
  }
}
