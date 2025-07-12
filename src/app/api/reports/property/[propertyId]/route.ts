import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: GET /api/reports/property/[propertyId]
 * 
 * Get all monthly reports for a specific property
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params
    
    if (!propertyId) {
      return NextResponse.json({
        success: false,
        error: 'Property ID is required'
      }, { status: 400 })
    }
    
    console.log(`📊 API: Fetching reports for property ${propertyId}`)
    
    // For now, return a simple error since this method doesn't exist
    // TODO: Implement proper report retrieval when database methods are available
    return NextResponse.json({
      success: false,
      error: 'Property reports retrieval not yet implemented - database methods need to be updated'
    }, { status: 501 })
    
  } catch (error) {
    console.error('❌ Error fetching property reports:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API Route: POST /api/reports/property/[propertyId]
 * 
 * Generate a report for a specific property and month
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params
    const body = await request.json()
    const { year, month, currency = 'USD' } = body
    
    if (!propertyId) {
      return NextResponse.json({
        success: false,
        error: 'Property ID is required'
      }, { status: 400 })
    }
    
    if (!year || !month) {
      return NextResponse.json({
        success: false,
        error: 'Year and month are required'
      }, { status: 400 })
    }
    
    // Validate year and month
    if (year < 2020 || year > 2030) {
      return NextResponse.json({
        success: false,
        error: 'Invalid year. Must be between 2020 and 2030'
      }, { status: 400 })
    }
    
    if (month < 1 || month > 12) {
      return NextResponse.json({
        success: false,
        error: 'Invalid month. Must be between 1 and 12'
      }, { status: 400 })
    }
    
    console.log(`📊 API: Generating report for property ${propertyId}, ${year}-${month.toString().padStart(2, '0')}`)
    
    // Import the service here to avoid circular dependencies
    const { ReportGenerationService } = await import('@/lib/reports/reportGenerationService')
    
    // Generate the report
    const result = await ReportGenerationService.generateMonthlyReport({
      propertyId,
      year,
      month,
      currency
    })
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Report generated successfully',
        report: result.report
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error generating property report:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
