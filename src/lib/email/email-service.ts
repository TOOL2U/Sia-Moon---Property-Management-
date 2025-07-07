import nodemailer from 'nodemailer'
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from '@/lib/env'

// Email configuration
const emailConfig = {
  host: SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

// Email templates
export const emailTemplates = {
  villaSubmissionConfirmation: (data: {
    ownerName: string
    propertyName: string
    submissionId: string
  }) => ({
    subject: `Villa Submission Received - ${data.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Sia Moon Property Management</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Villa Submission Received</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.ownerName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for submitting your villa <strong>${data.propertyName}</strong> for our property management services. 
            We have received your comprehensive application and are excited to review it.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1f2937; margin-top: 0;">What happens next?</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>Our team will review your submission within 24-48 hours</li>
              <li>We'll schedule a property visit to assess your villa</li>
              <li>You'll receive a customized management proposal</li>
              <li>Upon approval, we'll begin the onboarding process</li>
            </ul>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0; font-weight: 500;">
              📋 Submission ID: ${data.submissionId}
            </p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            If you have any questions or need to provide additional information, please don't hesitate to contact us.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:info@siamoon.com" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Contact Us
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            Sia Moon Property Management<br>
            Professional Villa Management Services<br>
            <a href="mailto:info@siamoon.com" style="color: #3b82f6;">info@siamoon.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
Dear ${data.ownerName},

Thank you for submitting your villa "${data.propertyName}" for our property management services.

We have received your comprehensive application and are excited to review it.

What happens next?
- Our team will review your submission within 24-48 hours
- We'll schedule a property visit to assess your villa
- You'll receive a customized management proposal
- Upon approval, we'll begin the onboarding process

Submission ID: ${data.submissionId}

If you have any questions, please contact us at info@siamoon.com

Best regards,
Sia Moon Property Management Team
    `
  }),

  adminNotification: (data: {
    ownerName: string
    propertyName: string
    ownerEmail: string
    ownerPhone: string
    submissionId: string
    propertyAddress: string
  }) => ({
    subject: `New Villa Submission - ${data.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Villa Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.8;">Admin Notification</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">${data.propertyName}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Owner Details</h3>
            <p><strong>Name:</strong> ${data.ownerName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.ownerEmail}">${data.ownerEmail}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${data.ownerPhone}">${data.ownerPhone}</a></p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Property Details</h3>
            <p><strong>Address:</strong> ${data.propertyAddress}</p>
            <p><strong>Submission ID:</strong> ${data.submissionId}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/villa-reviews" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Review Submission
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
New Villa Submission: ${data.propertyName}

Owner: ${data.ownerName}
Email: ${data.ownerEmail}
Phone: ${data.ownerPhone}
Address: ${data.propertyAddress}
Submission ID: ${data.submissionId}

Review at: ${process.env.NEXT_PUBLIC_APP_URL}/admin/villa-reviews
    `
  }),

  statusUpdate: (data: {
    ownerName: string
    propertyName: string
    status: string
    comments?: string
  }) => ({
    subject: `Villa Application Update - ${data.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Application Update</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${data.propertyName}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.ownerName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            We have an update regarding your villa application for <strong>${data.propertyName}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1f2937; margin-top: 0;">Status: ${data.status.toUpperCase()}</h3>
            ${data.comments ? `<p style="color: #4b5563; font-style: italic;">"${data.comments}"</p>` : ''}
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            If you have any questions about this update, please don't hesitate to contact our team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:info@siamoon.com" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
Dear ${data.ownerName},

Update for your villa application: ${data.propertyName}

Status: ${data.status.toUpperCase()}
${data.comments ? `Comments: ${data.comments}` : ''}

Contact us at info@siamoon.com if you have any questions.

Best regards,
Sia Moon Property Management Team
    `
  })
}

// Send email function
export async function sendEmail(to: string, template: { subject: string; html: string; text: string }) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email credentials not configured, skipping email send')
      return { success: false, error: 'Email not configured' }
    }

    const info = await transporter.sendMail({
      from: `"Sia Moon Property Management" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error }
  }
}

// Convenience functions
export async function sendVillaSubmissionConfirmation(
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  submissionId: string
) {
  const template = emailTemplates.villaSubmissionConfirmation({
    ownerName,
    propertyName,
    submissionId
  })
  
  return await sendEmail(ownerEmail, template)
}

export async function sendAdminNotification(data: {
  ownerName: string
  propertyName: string
  ownerEmail: string
  ownerPhone: string
  submissionId: string
  propertyAddress: string
}) {
  const template = emailTemplates.adminNotification(data)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@siamoon.com'
  
  return await sendEmail(adminEmail, template)
}

export async function sendStatusUpdate(
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  status: string,
  comments?: string
) {
  const template = emailTemplates.statusUpdate({
    ownerName,
    propertyName,
    status,
    comments
  })
  
  return await sendEmail(ownerEmail, template)
}
