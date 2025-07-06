// Email templates for various notifications

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SignupConfirmationData {
  userName: string;
  userEmail: string;
  loginUrl: string;
  dashboardUrl: string;
  supportEmail: string;
}

export const signupConfirmationTemplate = (data: SignupConfirmationData): EmailTemplate => {
  const subject = `Welcome to Sia Moon Property Management - Your Account is Ready!`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Sia Moon Property Management</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-message {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: center;
        }
        .message-text {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            display: block;
            width: fit-content;
            transition: transform 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .features {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
        }
        .features-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: center;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-size: 15px;
            color: #475569;
        }
        .feature-icon {
            width: 20px;
            height: 20px;
            background-color: #10b981;
            border-radius: 50%;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .next-steps {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .next-steps-title {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 10px;
        }
        .next-steps-text {
            font-size: 14px;
            color: #78350f;
            margin: 0;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 15px;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
        }
        .unsubscribe {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 20px;
        }
        .unsubscribe a {
            color: #64748b;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">Sia Moon</div>
            <p class="tagline">Property Management Excellence</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <h1 class="welcome-message">Welcome aboard, ${data.userName}! 🎉</h1>
            
            <p class="message-text">
                Your Sia Moon Property Management account has been successfully created. 
                You're now ready to streamline your villa management operations with our comprehensive platform.
            </p>

            <a href="${data.dashboardUrl}" class="cta-button">
                Access Your Dashboard
            </a>

            <!-- Features Section -->
            <div class="features">
                <h2 class="features-title">What you can do now:</h2>
                <ul class="feature-list">
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        Add and manage your villa properties
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        Track bookings and guest information
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        Schedule maintenance and cleaning tasks
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        Generate monthly financial reports
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        Sync with Airbnb, Booking.com, and other platforms
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">✓</span>
                        Manage staff assignments and notifications
                    </li>
                </ul>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <h3 class="next-steps-title">🚀 Quick Start Guide</h3>
                <p class="next-steps-text">
                    1. <strong>Add your first property</strong> - Upload photos and details<br>
                    2. <strong>Connect booking platforms</strong> - Sync with Airbnb, Booking.com<br>
                    3. <strong>Set up your team</strong> - Invite staff and assign roles<br>
                    4. <strong>Configure notifications</strong> - Stay updated on bookings and tasks
                </p>
            </div>

            <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px;">
                Need help getting started? Our support team is here to assist you.<br>
                <a href="mailto:${data.supportEmail}" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                <strong>Sia Moon Property Management</strong><br>
                Streamlining villa operations across Southeast Asia
            </p>
            
            <div class="social-links">
                <a href="#" class="social-link">Website</a>
                <a href="#" class="social-link">Support</a>
                <a href="#" class="social-link">Privacy Policy</a>
            </div>

            <div class="unsubscribe">
                <p>
                    You received this email because you created an account with Sia Moon Property Management.<br>
                    <a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

  const text = `
Welcome to Sia Moon Property Management, ${data.userName}!

Your account has been successfully created and you're ready to start managing your villa properties.

Access your dashboard: ${data.dashboardUrl}

What you can do now:
• Add and manage your villa properties
• Track bookings and guest information  
• Schedule maintenance and cleaning tasks
• Generate monthly financial reports
• Sync with Airbnb, Booking.com, and other platforms
• Manage staff assignments and notifications

Quick Start Guide:
1. Add your first property - Upload photos and details
2. Connect booking platforms - Sync with Airbnb, Booking.com
3. Set up your team - Invite staff and assign roles
4. Configure notifications - Stay updated on bookings and tasks

Need help? Contact our support team at ${data.supportEmail}

Best regards,
The Sia Moon Team
`;

  return { subject, html, text };
};

export const getSignupConfirmationEmail = (userData: {
  name: string;
  email: string;
}): EmailTemplate => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return signupConfirmationTemplate({
    userName: userData.name,
    userEmail: userData.email,
    loginUrl: `${baseUrl}/auth/login`,
    dashboardUrl: `${baseUrl}/dashboard/client`,
    supportEmail: 'support@siamoon.com'
  });
};
