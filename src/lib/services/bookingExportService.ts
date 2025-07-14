import { LiveBooking } from './bookingService'

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  dateRange?: {
    start: string
    end: string
  }
  status?: string[]
  properties?: string[]
  includeFinancials?: boolean
}

export class BookingExportService {
  
  /**
   * Export bookings to CSV format
   */
  static exportToCSV(bookings: LiveBooking[], options: ExportOptions = { format: 'csv' }): string {
    console.log('📊 EXPORT: Generating CSV export...')
    
    // Define CSV headers
    const headers = [
      'Booking ID',
      'Guest Name',
      'Guest Email',
      'Property',
      'Check-in Date',
      'Check-out Date',
      'Nights',
      'Guests',
      'Price',
      'Currency',
      'Status',
      'Booking Source',
      'Special Requests',
      'Received Date',
      'Client ID',
      'Match Confidence'
    ]
    
    if (options.includeFinancials) {
      headers.push('Revenue', 'Commission', 'Net Revenue')
    }
    
    // Filter bookings based on options
    let filteredBookings = bookings
    
    if (options.dateRange) {
      filteredBookings = filteredBookings.filter(booking => {
        const checkIn = booking.checkInDate
        return checkIn >= options.dateRange!.start && checkIn <= options.dateRange!.end
      })
    }
    
    if (options.status && options.status.length > 0) {
      filteredBookings = filteredBookings.filter(booking => 
        options.status!.includes(booking.status)
      )
    }
    
    if (options.properties && options.properties.length > 0) {
      filteredBookings = filteredBookings.filter(booking => 
        options.properties!.includes(booking.villaName)
      )
    }
    
    // Generate CSV rows
    const rows = filteredBookings.map(booking => {
      const baseRow = [
        booking.id,
        booking.guestName,
        booking.guestEmail || '',
        booking.villaName,
        booking.checkInDate,
        booking.checkOutDate,
        this.calculateNights(booking.checkInDate, booking.checkOutDate),
        booking.guests || '',
        booking.price || booking.revenue || 0,
        booking.currency || 'THB',
        booking.status,
        booking.bookingSource,
        booking.specialRequests || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Date((booking.receivedAt as any)?.toDate?.() || booking.receivedAt as any).toLocaleDateString(),
        booking.clientId || '',
        booking.matchConfidence || ''
      ]
      
      if (options.includeFinancials) {
        const revenue = booking.revenue || booking.price || 0
        const commission = revenue * 0.15 // 15% commission
        const netRevenue = revenue - commission
        
        baseRow.push(
          revenue.toString(),
          commission.toFixed(2),
          netRevenue.toFixed(2)
        )
      }
      
      return baseRow
    })
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    console.log(`✅ EXPORT: CSV generated with ${filteredBookings.length} bookings`)
    return csvContent
  }
  
  /**
   * Download CSV file
   */
  static downloadCSV(bookings: LiveBooking[], filename?: string, options: ExportOptions = { format: 'csv' }): void {
    const csvContent = this.exportToCSV(bookings, options)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `bookings-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('✅ EXPORT: CSV download initiated')
  }
  
  /**
   * Generate booking summary report
   */
  static generateSummaryReport(bookings: LiveBooking[]): {
    totalBookings: number
    byStatus: Record<string, number>
    byProperty: Record<string, number>
    totalRevenue: number
    averageBookingValue: number
    upcomingCheckIns: number
    recentBookings: number
  } {
    const summary = {
      totalBookings: bookings.length,
      byStatus: {} as Record<string, number>,
      byProperty: {} as Record<string, number>,
      totalRevenue: 0,
      averageBookingValue: 0,
      upcomingCheckIns: 0,
      recentBookings: 0
    }
    
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    bookings.forEach(booking => {
      // Count by status
      summary.byStatus[booking.status] = (summary.byStatus[booking.status] || 0) + 1
      
      // Count by property
      summary.byProperty[booking.villaName] = (summary.byProperty[booking.villaName] || 0) + 1
      
      // Calculate revenue
      const revenue = booking.revenue || booking.price || 0
      summary.totalRevenue += revenue
      
      // Count upcoming check-ins
      const checkInDate = new Date(booking.checkInDate)
      if (checkInDate >= now && checkInDate <= sevenDaysFromNow) {
        summary.upcomingCheckIns++
      }
      
      // Count recent bookings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receivedDate = (booking.receivedAt as any)?.toDate?.() || new Date(booking.receivedAt as any)
      if (receivedDate >= thirtyDaysAgo) {
        summary.recentBookings++
      }
    })
    
    summary.averageBookingValue = summary.totalBookings > 0 ? summary.totalRevenue / summary.totalBookings : 0
    
    return summary
  }
  
  /**
   * Calculate nights between dates
   */
  private static calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
}
