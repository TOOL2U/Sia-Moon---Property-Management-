# 🔗 Webhook Integration Documentation

## Overview
This document describes the webhook integration for signup confirmation emails using Make.com automation.

## 🎯 Integration Points

### 1. Signup Flow Integration
The webhook is automatically triggered during the user signup process in `SignUpForm.tsx`:

```typescript
// Step 3: Send signup confirmation email via webhook
console.log('📧 Sending signup confirmation email...')
try {
  const webhookResponse = await WebhookService.sendSignupConfirmation({
    name: data.fullName,
    email: data.email,
    userId: user.uid
  })

  if (webhookResponse.success) {
    console.log('✅ Signup confirmation email sent successfully')
  } else {
    console.warn('⚠️ Signup confirmation email failed:', webhookResponse.error)
    // Don't block signup flow for email failure
  }
} catch (webhookError) {
  console.error('❌ Webhook error (non-blocking):', webhookError)
  // Don't block signup flow for webhook failure
}
```

### 2. Webhook Service
The `WebhookService` class handles all webhook communications:

- **Location**: `src/lib/webhookService.ts`
- **Main Method**: `sendSignupConfirmation()`
- **Webhook URL**: `https://hook.eu2.make.com/7ed8ib93t7f5l3mvko2i35rkdn30i9cx`

### 3. Email Templates
Professional email templates are defined in `src/lib/emailTemplates.ts`:

- **Template Function**: `getSignupConfirmationEmail()`
- **Styling**: Professional HTML with inline CSS
- **Content**: Welcome message, login links, support information

## 🔧 Configuration

### Environment Variables
```bash
# Make.com Webhook URL
NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/7ed8ib93t7f5l3mvko2i35rkdn30i9cx
```

### Webhook Payload Structure
```typescript
{
  to: string;                    // Recipient email
  subject: string;               // Email subject
  html: string;                  // HTML email content
  text?: string;                 // Plain text fallback
  from?: string;                 // Sender email
  fromName?: string;             // Sender name
  replyTo?: string;              // Reply-to email
  type: 'signup_confirmation';   // Email type
  userData: {
    name: string;                // User's full name
    email: string;               // User's email
    userId?: string;             // Firebase user ID
  };
  metadata: {
    signupDate: string;          // ISO timestamp
    userAgent: string;           // Browser info
    source: 'web_signup';        // Signup source
  };
}
```

## 🧪 Testing

### Test Pages
1. **Signup Webhook Test**: `/test-signup-webhook`
   - Test signup confirmation emails
   - Verify webhook connectivity
   - Debug webhook responses

2. **General Webhook Test**: `/test-webhook`
   - Test general webhook functionality
   - Onboarding form webhooks

### Manual Testing
1. Navigate to `/auth/signup`
2. Fill out the signup form
3. Check browser console for webhook logs
4. Verify email delivery in Make.com

### Automated Testing
```typescript
// Test signup webhook
const response = await WebhookService.sendSignupConfirmation({
  name: 'Test User',
  email: 'test@example.com',
  userId: 'test-user-123'
});

console.log('Webhook response:', response);
```

## 🔄 Signup Flow

1. **User submits signup form**
2. **Firebase creates user account**
3. **User profile saved to Firestore**
4. **Webhook sends signup confirmation email** ← New integration
5. **User redirected to dashboard**

## 🛡️ Error Handling

The webhook integration is designed to be **non-blocking**:

- ✅ **Success**: Email sent, user continues to dashboard
- ⚠️ **Failure**: Error logged, user still continues to dashboard
- 🔄 **Timeout**: Request times out after 10 seconds, user continues

This ensures that email delivery issues don't prevent users from accessing their accounts.

## 📊 Monitoring

### Console Logs
- `📧 Sending signup confirmation email...`
- `✅ Signup confirmation email sent successfully`
- `⚠️ Signup confirmation email failed: [error]`
- `❌ Webhook error (non-blocking): [error]`

### Success Indicators
- `webhookResponse.success === true`
- `webhookResponse.webhookId` contains unique ID
- `webhookResponse.timestamp` contains ISO timestamp

### Error Indicators
- `webhookResponse.success === false`
- `webhookResponse.error` contains error message
- Console shows warning/error logs

## 🚀 Deployment Notes

### Production Checklist
- ✅ Environment variable `NEXT_PUBLIC_MAKE_WEBHOOK_URL` configured
- ✅ Make.com scenario active and tested
- ✅ Email templates reviewed and approved
- ✅ Error handling tested
- ✅ Webhook timeout configured (10 seconds)

### Make.com Configuration
The webhook expects the payload structure defined above and should:
1. Parse the incoming JSON payload
2. Extract email template data
3. Send email via preferred email service
4. Return success/error response

## 📝 Maintenance

### Regular Checks
- Monitor webhook success rates
- Review email delivery metrics
- Update email templates as needed
- Test webhook connectivity monthly

### Troubleshooting
1. **Webhook not firing**: Check console logs in signup flow
2. **Emails not sending**: Test webhook URL directly
3. **Template issues**: Review email template rendering
4. **Timeout errors**: Check Make.com scenario performance

## 🔗 Related Files

- `src/components/SignUpForm.tsx` - Main integration point
- `src/lib/webhookService.ts` - Webhook service class
- `src/lib/emailTemplates.ts` - Email template definitions
- `src/app/test-signup-webhook/page.tsx` - Testing interface
- `.env.local` - Environment configuration

---

**Status**: ✅ **Active and Integrated**  
**Last Updated**: January 7, 2025  
**Integration**: Firebase Signup → Make.com Webhook → Email Delivery
