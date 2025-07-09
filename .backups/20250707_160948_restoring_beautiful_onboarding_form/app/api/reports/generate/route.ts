import { NextRequest, NextResponse } from 'next/server'
import { ReportGenerationService } from '@/lib/reports/reportGenerationService'

/**
 * API Route: POST /api/reports/generate
 * 
 * Generate a monthly report for a specific property
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, year, month, currency = 'USD' } = body
    
    // Validate required fields
    if (!propertyId || !year || !month) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: propertyId, year, month'
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
    console.error('❌ Error in report generation API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API Route: GET /api/reports/generate
 * 
 * Get information about the report generation API
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Report generation API is operational',
    endpoints: {
      generate_report: 'POST /api/reports/generate',
      generate_all: 'POST /api/reports/generate-all',
      get_reports: 'GET /api/reports/property/[propertyId]'
    },
    documentation: {
      description: 'Monthly report generation API for property management',
      features: [
        'Generate comprehensive monthly reports',
        'Financial analysis and metrics',
        'Occupancy rate calculations',
        'Automated insights and recommendations'
      ],
      example_request: {
        propertyId: 'property-id',
        year: 2024,
        month: 12,
        currency: 'USD'
      }
    }
  })
}
