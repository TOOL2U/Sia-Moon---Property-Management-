import { BookingService, LiveBooking } from './bookingService'

export interface FinancialReport {
  id: string
  clientId: string
  propertyId?: string
  month: number
  year: number
  
  // Income data
  totalIncome: number
  bookingRevenue: number
  otherIncome: number
  
  // Expense data (placeholder for future implementation)
  totalExpenses: number
  cleaningCosts: number
  maintenanceCosts: number
  utilityCosts: number
  otherExpenses: number
  
  // Calculated metrics
  netProfit: number
  profitMargin: number
  occupancyRate: number
  averageBookingValue: number
  
  // Booking statistics
  totalBookings: number
  approvedBookings: number
  totalNights: number
  
  // Metadata
  generatedAt: string
  currency: string
}

export interface MonthlyMetrics {
  clientId: string
  month: string
  totalRevenue: number
  totalBookings: number
  totalNights: number
  avgOccupancy: number
  topProperty: string
  lastUpdated: string

  totalIncomeThisMonth: number
  totalExpensesThisMonth: number
  netProfitThisMonth: number
  occupancyRateThisMonth: number
  upcomingBookingsCount: number

  // Month-over-month changes
  incomeChange: number
  expensesChange: number
  profitChange: number
  occupancyChange: number
  bookingsChange: number

  currency: string
}

/**
 * Service for generating financial reports from live booking data
 */
export class ReportService {

  /**
   * Add booking data to monthly metrics
   */
  static async addBookingToMetrics(
    clientId: string,
    bookingData: {
      revenue: number
      currency: string
      checkInDate: string
      checkOutDate: string
      propertyId?: string
      bookingSource: string
    }
  ): Promise<void> {
    try {
      console.log('📊 REPORTS: Adding booking to monthly metrics for client:', clientId)

      // Get current month metrics
      const currentMetrics = await this.getMonthlyMetrics(clientId)

      // Calculate booking duration
      const checkIn = new Date(bookingData.checkInDate)
      const checkOut = new Date(bookingData.checkOutDate)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

      // For now, just log the update (in production, this would update stored metrics)
      console.log('✅ REPORTS: Monthly metrics would be updated with:', {
        additionalRevenue: bookingData.revenue,
        additionalNights: nights,
        currency: bookingData.currency
      })

    } catch (error) {
      console.error('❌ REPORTS: Error adding booking to metrics:', error)
      throw error
    }
  }

  /**
   * Generate monthly financial report for a client
   */
  static async generateMonthlyReport(
    clientId: string,
    year: number,
    month: number
  ): Promise<FinancialReport> {
    try {
      console.log(`📊 Generating monthly report for client ${clientId}, ${year}-${month.toString().padStart(2, '0')}`)
      
      // Get bookings for the specified month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`
      
      const monthlyBookings = await BookingService.getBookingsByDateRange(startDate, endDate, clientId)
      const approvedBookings = monthlyBookings.filter(b => b.status === 'approved')
      
      // Calculate income from live bookings
      const bookingRevenue = approvedBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0)
      const totalIncome = bookingRevenue // For now, only booking revenue
      
      // Calculate expenses (placeholder - will be enhanced later)
      const estimatedCleaningCosts = approvedBookings.length * 150 // $150 per booking
      const estimatedMaintenanceCosts = totalIncome * 0.05 // 5% of income
      const estimatedUtilityCosts = totalIncome * 0.08 // 8% of income
      const totalExpenses = estimatedCleaningCosts + estimatedMaintenanceCosts + estimatedUtilityCosts
      
      // Calculate metrics
      const netProfit = totalIncome - totalExpenses
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
      
      // Calculate occupancy rate
      const totalNights = approvedBookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.checkInDate)
        const checkOut = new Date(booking.checkOutDate)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + nights
      }, 0)
      
      const daysInMonth = new Date(year, month, 0).getDate()
      const occupancyRate = (totalNights / daysInMonth) * 100
      
      const averageBookingValue = approvedBookings.length > 0 ? bookingRevenue / approvedBookings.length : 0
      
      const report: FinancialReport = {
        id: `${clientId}-${year}-${month}`,
        clientId,
        month,
        year,
        
        // Income
        totalIncome,
        bookingRevenue,
        otherIncome: 0,
        
        // Expenses
        totalExpenses,
        cleaningCosts: estimatedCleaningCosts,
        maintenanceCosts: estimatedMaintenanceCosts,
        utilityCosts: estimatedUtilityCosts,
        otherExpenses: 0,
        
        // Metrics
        netProfit,
        profitMargin,
        occupancyRate: Math.min(occupancyRate, 100),
        averageBookingValue,
        
        // Booking stats
        totalBookings: monthlyBookings.length,
        approvedBookings: approvedBookings.length,
        totalNights,
        
        // Metadata
        generatedAt: new Date().toISOString(),
        currency: 'USD'
      }
      
      console.log('✅ Monthly report generated:', {
        income: totalIncome,
        expenses: totalExpenses,
        profit: netProfit,
        bookings: approvedBookings.length
      })
      
      return report
      
    } catch (error) {
      console.error('❌ Error generating monthly report:', error)
      
      // Return empty report on error
      return {
        id: `${clientId}-${year}-${month}`,
        clientId,
        month,
        year,
        totalIncome: 0,
        bookingRevenue: 0,
        otherIncome: 0,
        totalExpenses: 0,
        cleaningCosts: 0,
        maintenanceCosts: 0,
        utilityCosts: 0,
        otherExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        occupancyRate: 0,
        averageBookingValue: 0,
        totalBookings: 0,
        approvedBookings: 0,
        totalNights: 0,
        generatedAt: new Date().toISOString(),
        currency: 'USD'
      }
    }
  }
  
  /**
   * Get monthly metrics for dashboard display
   */
  static async getMonthlyMetrics(clientId: string): Promise<MonthlyMetrics> {
    try {
      console.log(`📊 Calculating monthly metrics for client ${clientId}`)
      
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
      
      // Get current and previous month reports
      const currentReport = await this.generateMonthlyReport(clientId, currentYear, currentMonth)
      const lastReport = await this.generateMonthlyReport(clientId, lastMonthYear, lastMonth)
      
      // Calculate month-over-month changes
      const incomeChange = lastReport.totalIncome > 0 
        ? ((currentReport.totalIncome - lastReport.totalIncome) / lastReport.totalIncome) * 100 
        : 0
        
      const expensesChange = lastReport.totalExpenses > 0 
        ? ((currentReport.totalExpenses - lastReport.totalExpenses) / lastReport.totalExpenses) * 100 
        : 0
        
      const profitChange = lastReport.netProfit !== 0 
        ? ((currentReport.netProfit - lastReport.netProfit) / Math.abs(lastReport.netProfit)) * 100 
        : 0
        
      const occupancyChange = lastReport.occupancyRate > 0 
        ? ((currentReport.occupancyRate - lastReport.occupancyRate) / lastReport.occupancyRate) * 100 
        : 0
        
      const bookingsChange = lastReport.totalBookings > 0 
        ? ((currentReport.totalBookings - lastReport.totalBookings) / lastReport.totalBookings) * 100 
        : 0
      
      // Get upcoming bookings count
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const upcomingBookings = await BookingService.getBookingsByDateRange(
        currentDate.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0],
        clientId
      )
      
      const metrics: MonthlyMetrics = {
        clientId,
        month: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
        totalRevenue: currentReport.totalIncome,
        totalBookings: currentReport.totalBookings,
        totalNights: currentReport.totalBookings * 2, // Estimate
        avgOccupancy: currentReport.occupancyRate,
        topProperty: 'unknown', // Would be calculated from bookings
        lastUpdated: new Date().toISOString(),

        totalIncomeThisMonth: currentReport.totalIncome,
        totalExpensesThisMonth: currentReport.totalExpenses,
        netProfitThisMonth: currentReport.netProfit,
        occupancyRateThisMonth: currentReport.occupancyRate,
        upcomingBookingsCount: upcomingBookings.filter(b => b.status === 'approved').length,

        incomeChange,
        expensesChange,
        profitChange,
        occupancyChange,
        bookingsChange,

        currency: 'USD'
      }
      
      console.log('✅ Monthly metrics calculated:', metrics)
      return metrics
      
    } catch (error) {
      console.error('❌ Error calculating monthly metrics:', error)
      
      return {
        clientId,
        month: new Date().toISOString().slice(0, 7),
        totalRevenue: 0,
        totalBookings: 0,
        totalNights: 0,
        avgOccupancy: 0,
        topProperty: 'unknown',
        lastUpdated: new Date().toISOString(),

        totalIncomeThisMonth: 0,
        totalExpensesThisMonth: 0,
        netProfitThisMonth: 0,
        occupancyRateThisMonth: 0,
        upcomingBookingsCount: 0,
        incomeChange: 0,
        expensesChange: 0,
        profitChange: 0,
        occupancyChange: 0,
        bookingsChange: 0,
        currency: 'USD'
      }
    }
  }
  
  /**
   * Get historical reports for a client
   */
  static async getHistoricalReports(
    clientId: string,
    monthsBack: number = 12
  ): Promise<FinancialReport[]> {
    try {
      console.log(`📊 Generating ${monthsBack} months of historical reports for client ${clientId}`)
      
      const reports: FinancialReport[] = []
      const currentDate = new Date()
      
      for (let i = 0; i < monthsBack; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const year = targetDate.getFullYear()
        const month = targetDate.getMonth() + 1
        
        const report = await this.generateMonthlyReport(clientId, year, month)
        reports.push(report)
      }
      
      console.log(`✅ Generated ${reports.length} historical reports`)
      return reports.reverse() // Return in chronological order
      
    } catch (error) {
      console.error('❌ Error generating historical reports:', error)
      return []
    }
  }
}
