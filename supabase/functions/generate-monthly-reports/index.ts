import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Property {
  id: string
  name: string
  owner_id: string
  created_at: string
}

interface Booking {
  id: string
  property_id: string
  check_in: string
  check_out: string
  total_amount: number
  status: string
}

interface Task {
  id: string
  property_id: string
  cost: number
  task_type: string
  completed_at: string
}

interface ReportData {
  property_id: string
  month: number
  year: number
  income: number
  expenses: number
  occupancy_rate: number
  total_nights: number
  occupied_nights: number
  bookings_count: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Starting monthly report generation...')

    // Calculate previous month
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const month = previousMonth.getMonth() + 1
    const year = previousMonth.getFullYear()

    console.log(`📅 Generating reports for ${year}-${month.toString().padStart(2, '0')}`)

    // Get all properties
    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('id, name, owner_id, created_at')

    if (propertiesError) {
      throw new Error(`Failed to fetch properties: ${propertiesError.message}`)
    }

    console.log(`🏠 Found ${properties?.length || 0} properties`)

    const results = []

    for (const property of properties || []) {
      try {
        console.log(`📊 Processing property: ${property.name} (${property.id})`)

        // Check if report already exists
        const { data: existingReport } = await supabaseClient
          .from('reports')
          .select('id')
          .eq('property_id', property.id)
          .eq('month', month)
          .eq('year', year)
          .single()

        if (existingReport) {
          console.log(`⏭️ Report already exists for ${property.name}, skipping...`)
          continue
        }

        // Calculate report data
        const reportData = await calculateReportData(supabaseClient, property.id, month, year)
        
        // Generate PDF
        const pdfUrl = await generateReportPDF(supabaseClient, property, reportData)
        
        // Save report to database
        const { data: report, error: reportError } = await supabaseClient
          .from('reports')
          .insert({
            property_id: property.id,
            month,
            year,
            income: reportData.income,
            expenses: reportData.expenses,
            occupancy_rate: reportData.occupancy_rate,
            pdf_url: pdfUrl,
            notes: ''
          })
          .select()
          .single()

        if (reportError) {
          throw new Error(`Failed to save report: ${reportError.message}`)
        }

        console.log(`✅ Report generated for ${property.name}`)

        // Send notifications
        await sendNotifications(supabaseClient, property, report, pdfUrl)

        results.push({
          property_id: property.id,
          property_name: property.name,
          success: true,
          report_id: report.id
        })

      } catch (error) {
        console.error(`❌ Error processing property ${property.name}:`, error)
        results.push({
          property_id: property.id,
          property_name: property.name,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`🎉 Report generation complete: ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${successCount} reports successfully`,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          month,
          year
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Fatal error in report generation:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function calculateReportData(
  supabaseClient: any,
  propertyId: string,
  month: number,
  year: number
): Promise<ReportData> {
  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of the month
  const totalNights = endDate.getDate()

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  console.log(`📅 Calculating data for ${startDateStr} to ${endDateStr}`)

  // Get completed bookings for the month
  const { data: bookings, error: bookingsError } = await supabaseClient
    .from('bookings')
    .select('id, check_in, check_out, total_amount, status')
    .eq('property_id', propertyId)
    .eq('status', 'completed')
    .gte('check_in', startDateStr)
    .lte('check_out', endDateStr)

  if (bookingsError) {
    throw new Error(`Failed to fetch bookings: ${bookingsError.message}`)
  }

  // Calculate income and occupied nights
  let totalIncome = 0
  let occupiedNights = 0

  for (const booking of bookings || []) {
    totalIncome += booking.total_amount || 0
    
    // Calculate nights within the month
    const checkIn = new Date(booking.check_in)
    const checkOut = new Date(booking.check_out)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    occupiedNights += nights
  }

  // Get expenses from maintenance and cleaning tasks
  const { data: tasks, error: tasksError } = await supabaseClient
    .from('tasks')
    .select('id, cost, task_type, completed_at')
    .eq('property_id', propertyId)
    .in('task_type', ['maintenance', 'cleaning'])
    .not('cost', 'is', null)
    .gte('completed_at', startDateStr)
    .lte('completed_at', endDateStr)

  if (tasksError) {
    throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
  }

  const totalExpenses = (tasks || []).reduce((sum, task) => sum + (task.cost || 0), 0)

  // Calculate occupancy rate
  const occupancyRate = totalNights > 0 ? (occupiedNights / totalNights) * 100 : 0

  return {
    property_id: propertyId,
    month,
    year,
    income: totalIncome,
    expenses: totalExpenses,
    occupancy_rate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimal places
    total_nights: totalNights,
    occupied_nights: occupiedNights,
    bookings_count: bookings?.length || 0
  }
}

async function generateReportPDF(
  supabaseClient: any,
  property: Property,
  reportData: ReportData
): Promise<string> {
  console.log(`📄 Generating PDF for ${property.name}`)

  // Call the PDF generation function
  const { data, error } = await supabaseClient.functions.invoke('generate-report-pdf', {
    body: {
      property,
      reportData
    }
  })

  if (error) {
    throw new Error(`PDF generation failed: ${error.message}`)
  }

  return data.pdf_url
}

async function sendNotifications(
  supabaseClient: any,
  property: Property,
  report: any,
  pdfUrl: string
): Promise<void> {
  console.log(`📧 Sending notifications for ${property.name}`)

  try {
    // Call the notification function
    await supabaseClient.functions.invoke('send-report-notifications', {
      body: {
        property,
        report,
        pdfUrl
      }
    })
  } catch (error) {
    console.error('Failed to send notifications:', error)
    // Don't throw - notifications are not critical for report generation
  }
}
