import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/dbService'

/**
 * API Route: GET /api/reports/pdf/[reportId]
 * 
 * Generate and download PDF for a specific report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    
    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'Report ID is required'
      }, { status: 400 })
    }
    
    console.log(`📄 API: Generating PDF for report ${reportId}`)
    
    // Get all reports to find the one with matching ID
    const allReportsResult = await DatabaseService.getAllMonthlyReports()
    
    if (allReportsResult.error) {
      return NextResponse.json({
        success: false,
        error: allReportsResult.error.message
      }, { status: 500 })
    }
    
    const report = allReportsResult.data?.find(r => r.id === reportId)
    
    if (!report) {
      return NextResponse.json({
        success: false,
        error: 'Report not found'
      }, { status: 404 })
    }
    
    // Get property details
    const propertyResult = await DatabaseService.getProperty(report.property_id)
    
    if (propertyResult.error || !propertyResult.data) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }
    
    // Import PDF service here to avoid issues with client-side imports
    const { PDFGenerationService } = await import('@/lib/reports/pdfGenerationService')
    
    // Generate PDF
    const pdfResult = await PDFGenerationService.generatePDF({
      report,
      property: propertyResult.data
    })
    
    if (!pdfResult.success || !pdfResult.pdfBlob) {
      return NextResponse.json({
        success: false,
        error: pdfResult.error || 'Failed to generate PDF'
      }, { status: 500 })
    }
    
    // Convert blob to buffer for response
    const buffer = await pdfResult.pdfBlob.arrayBuffer()
    
    // Generate filename
    const filename = PDFGenerationService.generateFilename(propertyResult.data, report)
    
    // Return PDF as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    })
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API Route: POST /api/reports/pdf/[reportId]
 * 
 * Generate PDF URL for a specific report (for preview)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    
    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'Report ID is required'
      }, { status: 400 })
    }
    
    console.log(`📄 API: Generating PDF URL for report ${reportId}`)
    
    // Get all reports to find the one with matching ID
    const allReportsResult = await DatabaseService.getAllMonthlyReports()
    
    if (allReportsResult.error) {
      return NextResponse.json({
        success: false,
        error: allReportsResult.error.message
      }, { status: 500 })
    }
    
    const report = allReportsResult.data?.find(r => r.id === reportId)
    
    if (!report) {
      return NextResponse.json({
        success: false,
        error: 'Report not found'
      }, { status: 404 })
    }
    
    // Get property details
    const propertyResult = await DatabaseService.getProperty(report.property_id)
    
    if (propertyResult.error || !propertyResult.data) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }
    
    // Return metadata for client-side PDF generation
    return NextResponse.json({
      success: true,
      report,
      property: propertyResult.data,
      downloadUrl: `/api/reports/pdf/${reportId}`,
      filename: `${propertyResult.data.name.replace(/[^a-zA-Z0-9]/g, '_')}_Monthly_Report_${report.year}-${report.month.toString().padStart(2, '0')}.pdf`
    })
    
  } catch (error) {
    console.error('❌ Error generating PDF metadata:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
