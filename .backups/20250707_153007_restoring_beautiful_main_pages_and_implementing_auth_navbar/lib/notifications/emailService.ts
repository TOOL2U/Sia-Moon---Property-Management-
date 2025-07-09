export interface EmailRequest {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface EmailResult {
  success: boolean
  error?: string
  messageId?: string
}

/**
 * Email service for sending notifications via Make.com webhook
 */
export class EmailService {
  
  /**
   * Send a notification email using Make.com webhook
   */
  static async sendNotificationEmail(request: EmailRequest): Promise<EmailResult> {
    try {
      console.log(`📧 Sending email to ${request.to}: ${request.subject}`)
      
      const webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
      if (!webhookUrl) {
        return {
          success: false,
          error: 'Email webhook URL not configured'
        }
      }
      
      // Get email template content
      const emailContent = this.getEmailTemplate(request.template, request.data)
      
      // Prepare webhook payload
      const payload = {
        type: 'email_notification',
        email: {
          to: request.to,
          subject: request.subject,
          html: emailContent.html,
          text: emailContent.text
        },
        data: request.data,
        timestamp: new Date().toISOString()
      }
      
      // Send via webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log('✅ Email sent successfully via webhook')
      
      return {
        success: true,
        messageId: result.messageId || 'webhook-sent'
      }
      
    } catch (error) {
      console.error('❌ Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Get email template content based on template name and data
   */
  private static getEmailTemplate(templateName: string, data: Record<string, any>): {
    html: string
    text: string
  } {
    switch (templateName) {
      case 'report_generated':
        return this.getReportGeneratedTemplate(data)
      case 'task_assigned':
        return this.getTaskAssignedTemplate(data)
      case 'task_completed':
        return this.getTaskCompletedTemplate(data)
      case 'invoice_created':
        return this.getInvoiceCreatedTemplate(data)
      case 'booking_confirmed':
        return this.getBookingConfirmedTemplate(data)
      case 'maintenance_required':
        return this.getMaintenanceRequiredTemplate(data)
      case 'system_alert':
        return this.getSystemAlertTemplate(data)
      default:
        return this.getDefaultTemplate(data)
    }
  }
  
  /**
   * Report generated email template
   */
  private static getReportGeneratedTemplate(data: Record<string, any>): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Monthly Report Available</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Monthly Report Available</h1>
          </div>
          <div class="content">
            <p>Hello ${data.user_name || 'Property Owner'},</p>
            <p>Your monthly property report for <strong>${data.property_name || 'your property'}</strong> is now available.</p>
            <p><strong>Report Period:</strong> ${data.report_period || 'Current Month'}</p>
            <p><strong>Key Highlights:</strong></p>
            <ul>
              <li>Net Income: ${data.net_income || 'N/A'}</li>
              <li>Occupancy Rate: ${data.occupancy_rate || 'N/A'}</li>
              <li>Total Bookings: ${data.total_bookings || 'N/A'}</li>
            </ul>
            <p>You can view and download your complete report from your dashboard.</p>
            <a href="${data.report_url || '#'}" class="button">View Report</a>
          </div>
          <div class="footer">
            <p>Sia Moon Property Management<br>
            This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      Monthly Report Available
      
      Hello ${data.user_name || 'Property Owner'},
      
      Your monthly property report for ${data.property_name || 'your property'} is now available.
      
      Report Period: ${data.report_period || 'Current Month'}
      
      Key Highlights:
      - Net Income: ${data.net_income || 'N/A'}
      - Occupancy Rate: ${data.occupancy_rate || 'N/A'}
      - Total Bookings: ${data.total_bookings || 'N/A'}
      
      You can view and download your complete report from your dashboard.
      
      Report URL: ${data.report_url || 'Please check your dashboard'}
      
      ---
      Sia Moon Property Management
      This is an automated message. Please do not reply to this email.
    `
    
    return { html, text }
  }
  
  /**
   * Task assigned email template
   */
  private static getTaskAssignedTemplate(data: Record<string, any>): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Task Assigned</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-details { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hello ${data.staff_name || 'Team Member'},</p>
            <p>A new task has been assigned to you:</p>
            <div class="task-details">
              <h3>${data.task_title || 'Task'}</h3>
              <p><strong>Property:</strong> ${data.property_name || 'N/A'}</p>
              <p><strong>Due Date:</strong> ${data.due_date || 'N/A'}</p>
              <p><strong>Priority:</strong> ${data.priority || 'Normal'}</p>
              <p><strong>Description:</strong> ${data.task_description || 'No description provided'}</p>
            </div>
            <p>Please log in to your dashboard to view full details and update the task status.</p>
            <a href="${data.task_url || '#'}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>Sia Moon Property Management<br>
            This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      New Task Assigned
      
      Hello ${data.staff_name || 'Team Member'},
      
      A new task has been assigned to you:
      
      Task: ${data.task_title || 'Task'}
      Property: ${data.property_name || 'N/A'}
      Due Date: ${data.due_date || 'N/A'}
      Priority: ${data.priority || 'Normal'}
      Description: ${data.task_description || 'No description provided'}
      
      Please log in to your dashboard to view full details and update the task status.
      
      Task URL: ${data.task_url || 'Please check your dashboard'}
      
      ---
      Sia Moon Property Management
      This is an automated message. Please do not reply to this email.
    `
    
    return { html, text }
  }
  
  /**
   * Default email template
   */
  private static getDefaultTemplate(data: Record<string, any>): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title || 'Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.title || 'Notification'}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.user_name || 'User'},</p>
            <p>${data.message || 'You have a new notification.'}</p>
          </div>
          <div class="footer">
            <p>Sia Moon Property Management<br>
            This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      ${data.title || 'Notification'}
      
      Hello ${data.user_name || 'User'},
      
      ${data.message || 'You have a new notification.'}
      
      ---
      Sia Moon Property Management
      This is an automated message. Please do not reply to this email.
    `
    
    return { html, text }
  }
  
  // Additional template methods would go here...
  private static getTaskCompletedTemplate(data: Record<string, any>) { return this.getDefaultTemplate(data) }
  private static getInvoiceCreatedTemplate(data: Record<string, any>) { return this.getDefaultTemplate(data) }
  private static getBookingConfirmedTemplate(data: Record<string, any>) { return this.getDefaultTemplate(data) }
  private static getMaintenanceRequiredTemplate(data: Record<string, any>) { return this.getDefaultTemplate(data) }
  private static getSystemAlertTemplate(data: Record<string, any>) { return this.getDefaultTemplate(data) }
}
