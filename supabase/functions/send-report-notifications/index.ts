import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { property, report, pdfUrl } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`📧 Sending notifications for property: ${property.name}`)

    // Get property owner details
    const { data: owner, error: ownerError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', property.owner_id)
      .single()

    if (ownerError || !owner) {
      throw new Error(`Failed to fetch property owner: ${ownerError?.message}`)
    }

    // Get notification preferences
    const { data: preferences } = await supabaseClient
      .from('notification_preferences')
      .select('email_reports, push_reports, onesignal_player_id')
      .eq('user_id', property.owner_id)
      .single()

    const shouldSendEmail = preferences?.email_reports !== false // Default to true
    const shouldSendPush = preferences?.push_reports !== false // Default to true

    const results = {
      email: { sent: false, success: false, error: null },
      push: { sent: false, success: false, error: null }
    }

    // Send email notification
    if (shouldSendEmail) {
      try {
        results.email.sent = true
        await sendEmailNotification(owner, property, report, pdfUrl)
        results.email.success = true
        console.log(`✅ Email sent to ${owner.email}`)
      } catch (error) {
        results.email.error = error.message
        console.error(`❌ Email failed for ${owner.email}:`, error)
      }
    }

    // Send push notification
    if (shouldSendPush && preferences?.onesignal_player_id) {
      try {
        results.push.sent = true
        await sendPushNotification(preferences.onesignal_player_id, property, report)
        results.push.success = true
        console.log(`✅ Push notification sent`)
      } catch (error) {
        results.push.error = error.message
        console.error(`❌ Push notification failed:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications processed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error sending notifications:', error)
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

async function sendEmailNotification(
  owner: any,
  property: any,
  report: any,
  pdfUrl: string
): Promise<void> {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthName = monthNames[report.month - 1]
  const netIncome = report.income - report.expenses

  const emailData = {
    to: owner.email,
    subject: `Monthly Report Available - ${property.name} (${monthName} ${report.year})`,
    html: generateEmailHTML(owner, property, report, pdfUrl, monthName, netIncome),
    text: generateEmailText(owner, property, report, pdfUrl, monthName, netIncome)
  }

  // Send via your email service (e.g., SendGrid, Resend, etc.)
  const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL')
  const emailApiKey = Deno.env.get('EMAIL_API_KEY')

  if (!emailServiceUrl || !emailApiKey) {
    console.log('📧 Email service not configured, skipping email...')
    return
  }

  const response = await fetch(emailServiceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${emailApiKey}`
    },
    body: JSON.stringify(emailData)
  })

  if (!response.ok) {
    throw new Error(`Email service error: ${response.statusText}`)
  }
}

async function sendPushNotification(
  playerId: string,
  property: any,
  report: any
): Promise<void> {
  const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
  const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY')

  if (!oneSignalAppId || !oneSignalApiKey) {
    console.log('📱 OneSignal not configured, skipping push notification...')
    return
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthName = monthNames[report.month - 1]

  const pushData = {
    app_id: oneSignalAppId,
    include_player_ids: [playerId],
    headings: { en: 'Monthly Report Ready' },
    contents: { 
      en: `Your ${monthName} ${report.year} report for ${property.name} is now available. Net income: $${(report.income - report.expenses).toLocaleString()}` 
    },
    data: {
      type: 'monthly_report',
      property_id: property.id,
      report_id: report.id
    },
    url: `${Deno.env.get('APP_URL')}/dashboard/client?tab=reports`
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${oneSignalApiKey}`
    },
    body: JSON.stringify(pushData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`OneSignal error: ${errorData.errors?.[0] || response.statusText}`)
  }
}

function generateEmailHTML(
  owner: any,
  property: any,
  report: any,
  pdfUrl: string,
  monthName: string,
  netIncome: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Monthly Report Available</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px 20px; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; }
        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .income { color: #10b981; }
        .expense { color: #ef4444; }
        .net-positive { color: #10b981; }
        .net-negative { color: #ef4444; }
        .occupancy { color: #3b82f6; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Monthly Report Available</h1>
          <p>${monthName} ${report.year} - ${property.name}</p>
        </div>
        
        <div class="content">
          <p>Hello ${owner.full_name || 'Property Owner'},</p>
          
          <p>Your monthly property report for <strong>${property.name}</strong> is now available for ${monthName} ${report.year}.</p>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-value income">$${report.income.toLocaleString()}</div>
              <div class="metric-label">Total Income</div>
            </div>
            <div class="metric">
              <div class="metric-value expense">$${report.expenses.toLocaleString()}</div>
              <div class="metric-label">Total Expenses</div>
            </div>
            <div class="metric">
              <div class="metric-value ${netIncome >= 0 ? 'net-positive' : 'net-negative'}">$${netIncome.toLocaleString()}</div>
              <div class="metric-label">Net Income</div>
            </div>
            <div class="metric">
              <div class="metric-value occupancy">${report.occupancy_rate}%</div>
              <div class="metric-label">Occupancy Rate</div>
            </div>
          </div>
          
          <p>You can download the complete PDF report using the button below:</p>
          
          <a href="${pdfUrl}" class="button">Download PDF Report</a>
          
          <p>You can also view all your reports in your <a href="${Deno.env.get('APP_URL')}/dashboard/client">client dashboard</a>.</p>
        </div>
        
        <div class="footer">
          <p>Sia Moon Property Management<br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateEmailText(
  owner: any,
  property: any,
  report: any,
  pdfUrl: string,
  monthName: string,
  netIncome: number
): string {
  return `
Monthly Report Available - ${property.name}

Hello ${owner.full_name || 'Property Owner'},

Your monthly property report for ${property.name} is now available for ${monthName} ${report.year}.

Key Metrics:
- Total Income: $${report.income.toLocaleString()}
- Total Expenses: $${report.expenses.toLocaleString()}
- Net Income: $${netIncome.toLocaleString()}
- Occupancy Rate: ${report.occupancy_rate}%

Download your complete PDF report: ${pdfUrl}

View all reports in your dashboard: ${Deno.env.get('APP_URL')}/dashboard/client

---
Sia Moon Property Management
This is an automated message. Please do not reply to this email.
  `
}
