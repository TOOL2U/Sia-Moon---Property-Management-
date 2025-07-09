import { NextRequest, NextResponse } from 'next/server'
import { ReportGenerationService } from '@/lib/reports/reportGenerationService'

/**
 * API Route: POST /api/reports/generate-all
 * 
 * Generate monthly reports for all properties
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month } = body
    
    // Validate required fields
    if (!year || !month) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: year, month'
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
    
    console.log(`📊 API: Generating reports for all properties - ${year}-${month.toString().padStart(2, '0')}`)
    
    // Generate reports for all properties
    const result = await ReportGenerationService.generateAllPropertyReports(year, month)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Generated reports for ${result.summary.successful}/${result.summary.total} properties`,
        summary: result.summary,
        results: result.results
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate reports',
        summary: result.summary,
        results: result.results
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error in bulk report generation API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API Route: GET /api/reports/generate-all
 * 
 * Get information about the bulk report generation API
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Bulk report generation API is operational',
    description: 'Generate monthly reports for all properties at once',
    example_request: {
      year: 2024,
      month: 12
    },
    use_cases: [
      'Monthly automated report generation',
      'Bulk report generation for specific months',
      'Administrative report management'
    ]
  })
}
