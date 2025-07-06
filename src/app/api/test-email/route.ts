import { NextRequest, NextResponse } from 'next/server'
import WebhookService from '@/lib/webhookService'
import { getSignupConfirmationEmail } from '@/lib/emailTemplates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'preview'
    const email = searchParams.get('email') || 'test@example.com'
    const name = searchParams.get('name') || 'Test User'

    if (action === 'preview') {
      // Return HTML preview of the email
      const emailTemplate = getSignupConfirmationEmail({
        name: name,
        email: email
      })

      return new Response(emailTemplate.html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    if (action === 'send') {
      // Send actual test email
      console.log('🧪 Testing email webhook...')
      
      const result = await WebhookService.sendSignupConfirmation({
        name: name,
        email: email,
        role: 'client',
        userId: 'test-user-id'
      })

      return NextResponse.json({
        success: result.success,
        error: result.error,
        webhookId: result.webhookId,
        timestamp: result.timestamp,
        testData: {
          email,
          name,
          action
        }
      })
    }

    if (action === 'webhook-test') {
      // Test webhook connection only
      const result = await WebhookService.testWebhook()

      return NextResponse.json({
        success: result.success,
        error: result.error,
        webhookId: result.webhookId,
        timestamp: result.timestamp,
        message: 'Webhook connection test'
      })
    }

    if (action === 'onboarding') {
      // Test onboarding survey completion email
      console.log('🧪 Testing onboarding survey email webhook...')

      const result = await WebhookService.sendOnboardingSurveyCompletion({
        name: name,
        email: email,
        propertyType: 'Luxury Villa',
        propertyCount: '1-3 properties',
        primaryGoal: 'Increase bookings and revenue',
        experienceLevel: 'Intermediate',
        userId: 'test-user-id'
      })

      return NextResponse.json({
        success: result.success,
        error: result.error,
        webhookId: result.webhookId,
        timestamp: result.timestamp,
        testData: {
          email,
          name,
          action,
          surveyData: {
            propertyType: 'Luxury Villa',
            propertyCount: '1-3 properties',
            primaryGoal: 'Increase bookings and revenue',
            experienceLevel: 'Intermediate'
          }
        }
      })
    }

    // Default: return template data
    const emailTemplate = getSignupConfirmationEmail({
      name: name,
      email: email
    })

    return NextResponse.json({
      subject: emailTemplate.subject,
      htmlLength: emailTemplate.html.length,
      textLength: emailTemplate.text?.length || 0,
      testUrls: {
        preview: `/api/test-email?action=preview&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
        send: `/api/test-email?action=send&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
        webhookTest: `/api/test-email?action=webhook-test`
      }
    })

  } catch (error) {
    console.error('❌ Email test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Email test failed'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, action = 'send' } = body

    if (!email || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email and name are required'
      }, { status: 400 })
    }

    console.log('🧪 Testing email webhook via POST...')
    
    const result = await WebhookService.sendSignupConfirmation({
      name: name,
      email: email,
      role: 'client',
      userId: 'test-user-id'
    })

    return NextResponse.json({
      success: result.success,
      error: result.error,
      webhookId: result.webhookId,
      timestamp: result.timestamp,
      testData: {
        email,
        name,
        action
      }
    })

  } catch (error) {
    console.error('❌ Email test POST failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Email test failed'
    }, { status: 500 })
  }
}
