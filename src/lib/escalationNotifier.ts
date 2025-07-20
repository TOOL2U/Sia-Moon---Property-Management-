import { AILogEntry } from '@/types/ai'

// Notification Configuration
interface NotificationConfig {
  telegram: {
    enabled: boolean
    botToken?: string
    chatId?: string
  }
  email: {
    enabled: boolean
    sendgridApiKey?: string
    fromEmail?: string
    toEmails?: string[]
  }
  webhook: {
    enabled: boolean
    url?: string
    secret?: string
  }
}

// Get notification configuration from environment
const getNotificationConfig = (): NotificationConfig => ({
  telegram: {
    enabled: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },
  email: {
    enabled: !!process.env.SENDGRID_API_KEY && !!process.env.NOTIFICATION_FROM_EMAIL,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.NOTIFICATION_FROM_EMAIL,
    toEmails: process.env.NOTIFICATION_TO_EMAILS?.split(',') || []
  },
  webhook: {
    enabled: !!process.env.ESCALATION_WEBHOOK_URL,
    url: process.env.ESCALATION_WEBHOOK_URL,
    secret: process.env.ESCALATION_WEBHOOK_SECRET
  }
})

/**
 * Send escalation notification to configured channels
 */
export async function notifyEscalation(log: AILogEntry): Promise<void> {
  try {
    console.log(`🚨 Escalation Alert: ${log.agent} - ${log.decision}`)
    
    const config = getNotificationConfig()
    const message = formatEscalationMessage(log)
    
    // Send notifications in parallel
    const notifications = []
    
    if (config.telegram.enabled) {
      notifications.push(sendTelegramAlert(message, config.telegram))
    }
    
    if (config.email.enabled) {
      notifications.push(sendEmailAlert(log, config.email))
    }
    
    if (config.webhook.enabled) {
      notifications.push(sendWebhookAlert(log, config.webhook))
    }
    
    // Wait for all notifications to complete (but don't fail if some fail)
    const results = await Promise.allSettled(notifications)
    
    // Log results
    results.forEach((result, index) => {
      const channels = ['Telegram', 'Email', 'Webhook']
      if (result.status === 'fulfilled') {
        console.log(`✅ ${channels[index]} notification sent successfully`)
      } else {
        console.error(`❌ ${channels[index]} notification failed:`, result.reason)
      }
    })
    
  } catch (error) {
    console.error('❌ Escalation notification system error:', error)
  }
}

/**
 * Format escalation message for notifications
 */
function formatEscalationMessage(log: AILogEntry): string {
  const urgencyIcon = log.confidence < 60 ? '🔴' : log.confidence < 80 ? '🟡' : '🟢'
  const timestamp = new Date(log.timestamp).toLocaleString()
  
  return `${urgencyIcon} AI ESCALATION ALERT

🤖 Agent: ${log.agent}
📊 Confidence: ${log.confidence}%
⏰ Time: ${timestamp}
🎯 Decision: ${log.decision}

${log.notes ? `📝 Notes: ${log.notes}` : ''}

🔗 Review at: ${process.env.NEXT_PUBLIC_APP_URL}/backoffice/ai-dashboard

⚡ Immediate action required!`
}

/**
 * Send Telegram notification
 */
async function sendTelegramAlert(message: string, config: NotificationConfig['telegram']): Promise<void> {
  if (!config.botToken || !config.chatId) {
    throw new Error('Telegram configuration missing')
  }

  const telegramUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`
  
  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: config.chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${response.status} - ${error}`)
  }

  console.log('📱 Telegram alert sent successfully')
}

/**
 * Send email notification via SendGrid
 */
async function sendEmailAlert(log: AILogEntry, config: NotificationConfig['email']): Promise<void> {
  if (!config.sendgridApiKey || !config.fromEmail || !config.toEmails?.length) {
    throw new Error('Email configuration missing')
  }

  const subject = `🚨 AI Escalation Alert - ${log.agent} (${log.confidence}%)`
  const htmlContent = formatEmailContent(log)

  const emailData = {
    personalizations: config.toEmails.map(email => ({
      to: [{ email }],
      subject
    })),
    from: { email: config.fromEmail, name: 'Sia Moon AI System' },
    content: [
      {
        type: 'text/html',
        value: htmlContent
      }
    ]
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid API error: ${response.status} - ${error}`)
  }

  console.log('📧 Email alert sent successfully')
}

/**
 * Send webhook notification
 */
async function sendWebhookAlert(log: AILogEntry, config: NotificationConfig['webhook']): Promise<void> {
  if (!config.url) {
    throw new Error('Webhook URL missing')
  }

  const payload = {
    type: 'ai_escalation',
    timestamp: new Date().toISOString(),
    data: {
      agent: log.agent,
      decision: log.decision,
      confidence: log.confidence,
      escalation: log.escalation,
      notes: log.notes,
      originalTimestamp: log.timestamp
    },
    metadata: {
      source: 'sia_moon_ai_system',
      version: '1.0.0'
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'SiaMoon-AI-System/1.0'
  }

  // Add webhook signature if secret is configured
  if (config.secret) {
    const crypto = await import('crypto')
    const signature = crypto
      .createHmac('sha256', config.secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    headers['X-Webhook-Signature'] = `sha256=${signature}`
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Webhook error: ${response.status} - ${error}`)
  }

  console.log('🔗 Webhook alert sent successfully')
}

/**
 * Format email content with HTML styling
 */
function formatEmailContent(log: AILogEntry): string {
  const urgencyColor = log.confidence < 60 ? '#dc3545' : log.confidence < 80 ? '#ffc107' : '#28a745'
  const timestamp = new Date(log.timestamp).toLocaleString()

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AI Escalation Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${urgencyColor}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin: 0;">🚨 AI Escalation Alert</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">Decision Details</h3>
            <p><strong>🤖 Agent:</strong> AI ${log.agent}</p>
            <p><strong>📊 Confidence:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${log.confidence}%</span></p>
            <p><strong>⏰ Timestamp:</strong> ${timestamp}</p>
            <p><strong>🎯 Decision:</strong> ${log.decision}</p>
            ${log.notes ? `<p><strong>📝 Notes:</strong> ${log.notes}</p>` : ''}
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>⚡ Action Required:</strong> This decision requires immediate human review and approval.</p>
        </div>
        
        <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/backoffice/ai-dashboard" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🔗 Review in Dashboard
            </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
            <p>This is an automated alert from the Sia Moon AI System. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`
}

/**
 * Test notification system (for development/testing)
 */
export async function testNotificationSystem(): Promise<void> {
  const testLog: AILogEntry = {
    timestamp: new Date().toISOString(),
    agent: 'COO',
    decision: 'Test escalation notification',
    confidence: 65,
    source: 'auto',
    escalation: true,
    notes: 'This is a test notification from the escalation system'
  }

  console.log('🧪 Testing notification system...')
  await notifyEscalation(testLog)
  console.log('✅ Notification test completed')
}

/**
 * Get notification system status
 */
export function getNotificationStatus(): {
  telegram: boolean
  email: boolean
  webhook: boolean
  configured: boolean
} {
  const config = getNotificationConfig()
  
  return {
    telegram: config.telegram.enabled,
    email: config.email.enabled,
    webhook: config.webhook.enabled,
    configured: config.telegram.enabled || config.email.enabled || config.webhook.enabled
  }
}
