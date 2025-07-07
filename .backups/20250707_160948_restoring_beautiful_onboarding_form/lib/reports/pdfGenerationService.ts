import jsPDF from 'jspdf'
import { MonthlyReport, Property } from '@/lib/db'
import { format } from 'date-fns'

export interface PDFGenerationOptions {
  report: MonthlyReport
  property: Property
  includeCharts?: boolean
}

export interface PDFGenerationResult {
  success: boolean
  pdfBlob?: Blob
  pdfUrl?: string
  error?: string
}

/**
 * Service for generating PDF reports from monthly report data
 */
export class PDFGenerationService {
  
  /**
   * Generate a PDF report from monthly report data
   */
  static async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
    try {
      const { report, property } = options
      
      console.log(`📄 Generating PDF for ${property.name} - ${report.year}-${report.month.toString().padStart(2, '0')}`)
      
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      
      let yPosition = margin
      
      // Helper function to add text with automatic line wrapping
      const addText = (text: string, x: number, y: number, options?: { fontSize?: number, fontStyle?: string, maxWidth?: number }) => {
        const fontSize = options?.fontSize || 10
        const fontStyle = options?.fontStyle || 'normal'
        const maxWidth = options?.maxWidth || contentWidth
        
        pdf.setFontSize(fontSize)
        pdf.setFont('helvetica', fontStyle)
        
        const lines = pdf.splitTextToSize(text, maxWidth)
        pdf.text(lines, x, y)
        
        return y + (lines.length * fontSize * 0.35) + 2
      }
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }
      
      // Header
      pdf.setFillColor(59, 130, 246) // Blue background
      pdf.rect(0, 0, pageWidth, 40, 'F')
      
      pdf.setTextColor(255, 255, 255) // White text
      yPosition = addText('MONTHLY PROPERTY REPORT', margin, 25, { fontSize: 20, fontStyle: 'bold' })
      
      // Reset text color
      pdf.setTextColor(0, 0, 0)
      yPosition = 50
      
      // Property Information
      yPosition = addText('PROPERTY INFORMATION', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
      yPosition += 5
      
      yPosition = addText(`Property: ${property.name}`, margin, yPosition, { fontSize: 12 })
      yPosition = addText(`Address: ${property.address}`, margin, yPosition, { fontSize: 12 })
      yPosition = addText(`Report Period: ${format(new Date(report.year, report.month - 1), 'MMMM yyyy')}`, margin, yPosition, { fontSize: 12 })
      yPosition = addText(`Generated: ${format(new Date(report.generated_at), 'PPP')}`, margin, yPosition, { fontSize: 12 })
      yPosition += 10
      
      // Financial Summary
      checkNewPage(60)
      yPosition = addText('FINANCIAL SUMMARY', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
      yPosition += 5
      
      const formatCurrency = (amount: number) => `${report.currency} ${(amount / 100).toFixed(2)}`
      
      // Create a simple table for financial data
      const financialData = [
        ['Total Income', formatCurrency(report.total_income)],
        ['Total Expenses', formatCurrency(report.total_expenses)],
        ['Net Income', formatCurrency(report.net_income)]
      ]
      
      financialData.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'normal')
        pdf.text(label, margin, yPosition)
        pdf.setFont('helvetica', 'bold')
        pdf.text(value, margin + 80, yPosition)
        yPosition += 7
      })
      
      yPosition += 10
      
      // Occupancy Metrics
      checkNewPage(60)
      yPosition = addText('OCCUPANCY METRICS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
      yPosition += 5
      
      const occupancyData = [
        ['Occupancy Rate', `${report.occupancy_rate.toFixed(1)}%`],
        ['Total Nights', report.total_nights.toString()],
        ['Occupied Nights', report.occupied_nights.toString()],
        ['Total Bookings', report.total_bookings.toString()],
        ['Average Booking Value', formatCurrency(report.average_booking_value)],
        ['Average Stay Length', `${report.average_stay_length.toFixed(1)} nights`],
        ['Revenue per Available Night', formatCurrency(report.revenue_per_available_night)]
      ]
      
      occupancyData.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'normal')
        pdf.text(label, margin, yPosition)
        pdf.setFont('helvetica', 'bold')
        pdf.text(value, margin + 80, yPosition)
        yPosition += 7
      })
      
      yPosition += 10
      
      // Income Breakdown
      if (Object.keys(report.income_breakdown).length > 0) {
        checkNewPage(40 + Object.keys(report.income_breakdown).length * 7)
        yPosition = addText('INCOME BREAKDOWN', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
        yPosition += 5
        
        Object.entries(report.income_breakdown).forEach(([category, amount]) => {
          const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          pdf.setFont('helvetica', 'normal')
          pdf.text(categoryLabel, margin, yPosition)
          pdf.setFont('helvetica', 'bold')
          pdf.text(formatCurrency(amount), margin + 80, yPosition)
          yPosition += 7
        })
        
        yPosition += 10
      }
      
      // Expense Breakdown
      if (Object.keys(report.expense_breakdown).length > 0) {
        checkNewPage(40 + Object.keys(report.expense_breakdown).length * 7)
        yPosition = addText('EXPENSE BREAKDOWN', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
        yPosition += 5
        
        Object.entries(report.expense_breakdown).forEach(([category, amount]) => {
          const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          pdf.setFont('helvetica', 'normal')
          pdf.text(categoryLabel, margin, yPosition)
          pdf.setFont('helvetica', 'bold')
          pdf.text(formatCurrency(amount), margin + 80, yPosition)
          yPosition += 7
        })
        
        yPosition += 10
      }
      
      // Booking Details
      if (report.booking_details.length > 0) {
        checkNewPage(40 + report.booking_details.length * 7)
        yPosition = addText('BOOKING DETAILS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
        yPosition += 5
        
        report.booking_details.forEach((booking, index) => {
          checkNewPage(20)
          yPosition = addText(`${index + 1}. ${booking.guest_name}`, margin, yPosition, { fontSize: 11, fontStyle: 'bold' })
          yPosition = addText(`   Check-in: ${format(new Date(booking.check_in), 'PPP')}`, margin, yPosition, { fontSize: 10 })
          yPosition = addText(`   Check-out: ${format(new Date(booking.check_out), 'PPP')}`, margin, yPosition, { fontSize: 10 })
          yPosition = addText(`   Nights: ${booking.nights}, Revenue: ${formatCurrency(booking.revenue)}, Platform: ${booking.platform}`, margin, yPosition, { fontSize: 10 })
          yPosition += 3
        })
        
        yPosition += 10
      }
      
      // Key Notes
      if (report.key_notes.length > 0) {
        checkNewPage(40 + report.key_notes.length * 10)
        yPosition = addText('KEY INSIGHTS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
        yPosition += 5
        
        report.key_notes.forEach((note, index) => {
          checkNewPage(15)
          yPosition = addText(`• ${note}`, margin, yPosition, { fontSize: 11 })
          yPosition += 3
        })
        
        yPosition += 10
      }
      
      // Recommendations
      if (report.recommendations && report.recommendations.length > 0) {
        checkNewPage(40 + report.recommendations.length * 10)
        yPosition = addText('RECOMMENDATIONS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' })
        yPosition += 5
        
        report.recommendations.forEach((recommendation, index) => {
          checkNewPage(15)
          yPosition = addText(`${index + 1}. ${recommendation}`, margin, yPosition, { fontSize: 11 })
          yPosition += 3
        })
      }
      
      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10)
        pdf.text('Generated by Sia Moon Property Management', margin, pageHeight - 10)
      }
      
      // Generate blob and URL
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      console.log('✅ PDF generated successfully')
      
      return {
        success: true,
        pdfBlob,
        pdfUrl
      }
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
  
  /**
   * Download PDF directly to user's device
   */
  static downloadPDF(pdfBlob: Blob, filename: string) {
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  /**
   * Generate filename for the PDF
   */
  static generateFilename(property: Property, report: MonthlyReport): string {
    const propertyName = property.name.replace(/[^a-zA-Z0-9]/g, '_')
    const monthYear = `${report.year}-${report.month.toString().padStart(2, '0')}`
    return `${propertyName}_Monthly_Report_${monthYear}.pdf`
  }
}
