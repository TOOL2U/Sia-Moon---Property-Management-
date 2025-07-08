// Webhook service for sending emails via Make.com

export interface EmailWebhookPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  type: 'signup_confirmation' | 'booking_notification' | 'task_assignment' | 'monthly_report';
  userData?: {
    name: string;
    email: string;
    role?: string;
    userId?: string;
  };
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  success: boolean;
  error?: string;
  webhookId?: string;
  timestamp?: string;
}

export interface SignupData {
  // User Information
  name: string;
  email: string;
  phone?: string;
  role?: string;
  userId?: string;

  // Account Details
  account_type?: string;
  subscription_plan?: string;
  referral_source?: string;
  marketing_consent?: boolean;

  // Business Information
  company_name?: string;
  business_type?: string;
  property_count?: string;
  experience_level?: string;
  primary_goals?: string[];

  // Technical Details
  signup_method?: string;
  device_type?: string;
  browser?: string;
  ip_address?: string;
  user_agent?: string;

  // Timestamps
  signup_date?: string;
  email_verified?: boolean;
  profile_completed?: boolean;

  // Preferences
  communication_preferences?: string[];
  timezone?: string;
  language?: string;

  // Metadata
  source?: string;
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

class WebhookService {
  private static readonly SIGNUP_WEBHOOK_URL = process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL || 'https://hook.eu2.make.com/7ed8ib93t7f5l3mvko2i35rkdn30i9cx';
  private static readonly ONBOARDING_WEBHOOK_URL = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL || 'https://hook.eu2.make.com/b59iga7bj65atyrgo5ej9dwvlujdsupa';
  private static readonly TIMEOUT_MS = 10000; // 10 seconds

  /**
   * Send email via Make.com webhook
   */
  static async sendEmail(payload: EmailWebhookPayload, webhookUrl?: string): Promise<WebhookResponse> {
    try {
      console.log('📧 Sending email via Make.com webhook:', {
        to: payload.to,
        subject: payload.subject,
        type: payload.type
      });

      // Prepare the webhook payload
      const webhookPayload = {
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'sia-moon-property-management',
        environment: process.env.NODE_ENV || 'development'
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      // Send webhook request
      const targetUrl = webhookUrl || this.SIGNUP_WEBHOOK_URL;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiaMoon-PropertyManagement/1.0'
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status} ${response.statusText}`);
      }

      const result = await response.json().catch(() => ({}));

      console.log('✅ Email webhook sent successfully:', {
        status: response.status,
        to: payload.to,
        type: payload.type
      });

      return {
        success: true,
        webhookId: result.id || `webhook-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Email webhook failed:', error);
      
      // Don't throw error - email failure shouldn't break signup
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown webhook error'
      };
    }
  }

  /**
   * Send comprehensive signup data to webhook and email
   */
  static async sendSignupConfirmation(signupData: SignupData): Promise<WebhookResponse> {
    try {
      console.log('🚀 Sending comprehensive signup data to Make.com:', {
        email: signupData.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for logging
        name: signupData.name,
        userId: signupData.userId
      });

      // Prepare comprehensive signup payload
      const webhookPayload = {
        // User Information
        name: signupData.name?.trim(),
        email: signupData.email?.trim(),
        phone: signupData.phone?.trim(),
        role: signupData.role || 'property_owner',
        userId: signupData.userId,

        // Account Details
        account_type: signupData.account_type || 'standard',
        subscription_plan: signupData.subscription_plan || 'free',
        referral_source: signupData.referral_source,
        marketing_consent: signupData.marketing_consent || false,

        // Business Information
        company_name: signupData.company_name?.trim(),
        business_type: signupData.business_type,
        property_count: signupData.property_count,
        experience_level: signupData.experience_level,
        primary_goals: signupData.primary_goals || [],

        // Technical Details
        signup_method: signupData.signup_method || 'web_form',
        device_type: signupData.device_type,
        browser: signupData.browser,
        ip_address: signupData.ip_address,
        user_agent: signupData.user_agent,

        // Timestamps
        signup_date: signupData.signup_date || new Date().toISOString(),
        email_verified: signupData.email_verified || false,
        profile_completed: signupData.profile_completed || false,

        // Preferences
        communication_preferences: signupData.communication_preferences || ['email'],
        timezone: signupData.timezone,
        language: signupData.language || 'en',

        // Metadata
        source: signupData.source || 'sia_moon_webapp',
        campaign_id: signupData.campaign_id,
        utm_source: signupData.utm_source,
        utm_medium: signupData.utm_medium,
        utm_campaign: signupData.utm_campaign,

        // System metadata
        submission_type: 'user_signup',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };

      // Send to webhook
      const response = await fetch(this.SIGNUP_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiaMoon-PropertyManagement/1.0'
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        throw new Error(`Signup webhook failed with status: ${response.status}`);
      }

      console.log('✅ Signup data sent successfully to Make.com');

      return {
        success: true,
        webhookId: `signup-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Signup webhook failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown signup webhook error'
      };
    }
  }

  /**
   * Send onboarding survey completion email
   */
  static async sendOnboardingSurveyCompletion(surveyData: {
    name: string;
    email: string;
    propertyType: string;
    propertyCount: string;
    primaryGoal: string;
    experienceLevel: string;
    userId?: string;
  }): Promise<WebhookResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const subject = `Thank you ${surveyData.name}! Your Sia Moon setup is complete 🎯`;

    // Use the HTML template directly (embedded)
    const htmlTemplate = `
<!-- Onboarding Survey Completion Email -->
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; color: white;">
        <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.5px;">Sia Moon</div>
        <p style="font-size: 16px; opacity: 0.9; margin: 0;">Property Management Excellence</p>
    </div>
    <div style="padding: 40px 30px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center;">
            Thank you, ${surveyData.name}! Your setup is complete 🎯
        </h1>
        <p style="font-size: 16px; color: #64748b; margin-bottom: 30px; text-align: center;">
            We've received your onboarding survey and your Sia Moon Property Management account is now fully customized to your needs.
            Based on your responses, we've prepared personalized recommendations to help you get the most out of our platform.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/dashboard/client" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Your Personalized Dashboard
            </a>
        </div>
        <div style="background-color: #f0f9ff; border-radius: 8px; padding: 30px; margin: 30px 0; border-left: 4px solid #3b82f6;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center;">📋 Your Survey Summary</h2>
            <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 15px;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #1e293b;">Property Type:</strong> ${surveyData.propertyType}<br>
                    <strong style="color: #1e293b;">Number of Properties:</strong> ${surveyData.propertyCount}<br>
                    <strong style="color: #1e293b;">Primary Goal:</strong> ${surveyData.primaryGoal}<br>
                    <strong style="color: #1e293b;">Experience Level:</strong> ${surveyData.experienceLevel}
                </p>
            </div>
        </div>
        <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px;">
            Questions about your account or need assistance?<br>
            <a href="mailto:support@siamoon.com" style="color: #3b82f6; text-decoration: none;">Contact our support team</a> - we typically respond within 2 hours.
        </p>
    </div>
</div>`;

    const textContent = `
Thank you ${surveyData.name}!

Your Sia Moon Property Management onboarding survey has been completed successfully.

Survey Summary:
- Property Type: ${surveyData.propertyType}
- Number of Properties: ${surveyData.propertyCount}
- Primary Goal: ${surveyData.primaryGoal}
- Experience Level: ${surveyData.experienceLevel}

Access your personalized dashboard: ${baseUrl}/dashboard/client

Need help? Contact our support team at support@siamoon.com

Best regards,
The Sia Moon Team
`;

    return this.sendEmail({
      to: surveyData.email,
      subject: subject,
      html: htmlTemplate,
      text: textContent,
      from: 'onboarding@siamoon.com',
      fromName: 'Sia Moon Onboarding Team',
      replyTo: 'support@siamoon.com',
      type: 'signup_confirmation', // Using existing type for now
      userData: {
        name: surveyData.name,
        email: surveyData.email,
        userId: surveyData.userId
      },
      metadata: {
        surveyCompletionDate: new Date().toISOString(),
        propertyType: surveyData.propertyType,
        propertyCount: surveyData.propertyCount,
        primaryGoal: surveyData.primaryGoal,
        experienceLevel: surveyData.experienceLevel,
        source: 'onboarding_survey'
      }
    }, this.ONBOARDING_WEBHOOK_URL);
  }

  /**
   * Send booking notification email
   */
  static async sendBookingNotification(bookingData: {
    guestEmail: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    bookingId: string;
  }): Promise<WebhookResponse> {
    return this.sendEmail({
      to: bookingData.guestEmail,
      subject: `Booking Confirmation - ${bookingData.propertyName}`,
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Dear ${bookingData.guestName},</p>
        <p>Your booking for <strong>${bookingData.propertyName}</strong> has been confirmed.</p>
        <p><strong>Check-in:</strong> ${bookingData.checkIn}</p>
        <p><strong>Check-out:</strong> ${bookingData.checkOut}</p>
        <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
      `,
      text: `Booking Confirmed! Dear ${bookingData.guestName}, your booking for ${bookingData.propertyName} has been confirmed. Check-in: ${bookingData.checkIn}, Check-out: ${bookingData.checkOut}, Booking ID: ${bookingData.bookingId}`,
      from: 'bookings@siamoon.com',
      fromName: 'Sia Moon Bookings',
      type: 'booking_notification',
      metadata: {
        bookingId: bookingData.bookingId,
        propertyName: bookingData.propertyName
      }
    });
  }

  /**
   * Send task assignment email
   */
  static async sendTaskAssignment(taskData: {
    staffEmail: string;
    staffName: string;
    taskTitle: string;
    propertyName: string;
    dueDate: string;
    taskId: string;
  }): Promise<WebhookResponse> {
    return this.sendEmail({
      to: taskData.staffEmail,
      subject: `New Task Assignment - ${taskData.taskTitle}`,
      html: `
        <h2>New Task Assignment</h2>
        <p>Dear ${taskData.staffName},</p>
        <p>You have been assigned a new task:</p>
        <p><strong>Task:</strong> ${taskData.taskTitle}</p>
        <p><strong>Property:</strong> ${taskData.propertyName}</p>
        <p><strong>Due Date:</strong> ${taskData.dueDate}</p>
        <p><strong>Task ID:</strong> ${taskData.taskId}</p>
      `,
      text: `New Task Assignment. Dear ${taskData.staffName}, you have been assigned: ${taskData.taskTitle} at ${taskData.propertyName}. Due: ${taskData.dueDate}. Task ID: ${taskData.taskId}`,
      from: 'tasks@siamoon.com',
      fromName: 'Sia Moon Task Management',
      type: 'task_assignment',
      metadata: {
        taskId: taskData.taskId,
        propertyName: taskData.propertyName
      }
    });
  }

  /**
   * Test webhook connection
   */
  static async testWebhook(): Promise<WebhookResponse> {
    return this.sendEmail({
      to: 'test@example.com',
      subject: 'Webhook Test - Sia Moon Property Management',
      html: '<h2>Webhook Test</h2><p>This is a test email to verify the webhook connection.</p>',
      text: 'Webhook Test - This is a test email to verify the webhook connection.',
      type: 'signup_confirmation',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export default WebhookService;
