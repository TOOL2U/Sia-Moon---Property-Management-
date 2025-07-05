# Villa Management Webhook Integration

## Overview

This document describes the webhook integration between our villa management web app and Make.com for automated email confirmations when users submit onboarding requests.

## Architecture

```
User Form Submission → useOnboardingSubmit Hook → Make.com Webhook → Automated Email
```

## Implementation

### 1. Environment Configuration

Add the Make.com webhook URL to your `.env.local` file:

```env
NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/b59iga7bj65atyrgo5ej9dwvlujdsupa
```

### 2. Hook Usage

The `useOnboardingSubmit` hook provides a clean interface for webhook submissions:

```typescript
import { useOnboardingSubmit } from '@/hooks/useOnboardingSubmit'

const { isLoading, isSuccess, error, submitOnboarding, reset } = useOnboardingSubmit()

// Submit data
await submitOnboarding({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  property_address: '123 Villa Street',
  notes: 'Looking for property management services'
})
```

### 3. Data Format

The webhook sends the following JSON payload to Make.com:

```json
{
  "name": "Client Name",
  "email": "client@example.com", 
  "phone": "client phone",
  "property_address": "property address",
  "notes": "additional notes"
}
```

## Features

### ✅ Type Safety
- Full TypeScript support with proper interfaces
- Compile-time validation of data structures

### ✅ Error Handling
- Network error detection and user-friendly messages
- HTTP status code handling (4xx, 5xx)
- Client-side validation before submission

### ✅ Loading States
- `isLoading` state for UI feedback
- Disabled form controls during submission
- Loading spinners and progress indicators

### ✅ Success Management
- `isSuccess` state for confirmation UI
- Automatic form clearing on success
- Success toast notifications

### ✅ Validation
- Required field validation
- Email format validation
- Phone number validation
- Property address validation

### ✅ Logging & Debugging
- Detailed console logging for development
- Masked sensitive data in logs
- Error tracking and reporting

## Usage Examples

### Simple Onboarding Form

Located at `/onboard-simple`, this form collects basic information and sends it to Make.com:

- Clean, mobile-friendly UI
- Real-time validation
- Success/error states
- Automatic redirect after submission

### Complex Villa Onboarding

The existing comprehensive villa onboarding form (`/onboard`) also integrates with the webhook:

- Sends basic info to Make.com for confirmation email
- Continues to save full data to database
- Non-blocking: webhook failure doesn't prevent form submission

## Testing

### Test Page

Visit `/test-webhook` to test the webhook integration:

- Test valid submissions
- Test validation with invalid data
- View environment configuration
- Monitor test logs and results

### Manual Testing

1. Fill out the simple onboarding form at `/onboard-simple`
2. Check browser console for webhook logs
3. Verify Make.com scenario receives the data
4. Confirm automated email is sent

## Error Handling

### Client-Side Errors
- Missing required fields → Validation error
- Invalid email format → Format error
- Network issues → User-friendly network error message

### Server-Side Errors
- HTTP 4xx → "Invalid request" message
- HTTP 5xx → "Server error" message
- Timeout → "Network error" message

### Graceful Degradation
- Webhook failures don't break the main application flow
- Users still receive success confirmation
- Errors are logged for debugging

## Security

### Data Protection
- No sensitive data stored in webhook payload
- Email addresses masked in console logs
- HTTPS-only webhook communication

### Validation
- Client-side validation prevents malformed requests
- Server-side validation at Make.com webhook endpoint
- Rate limiting and abuse prevention

## Monitoring

### Logging
- All webhook requests logged to browser console
- Success/failure tracking
- Performance monitoring

### Error Tracking
- Failed webhook submissions logged
- User-friendly error messages displayed
- Debugging information preserved

## Make.com Configuration

### Webhook Setup
1. Create new scenario in Make.com
2. Add "Webhooks" → "Custom webhook" trigger
3. Copy the webhook URL to environment variables
4. Configure email sending module
5. Test the scenario with sample data

### Email Template
The webhook provides these variables for email templates:
- `{{name}}` - Client's full name
- `{{email}}` - Client's email address
- `{{phone}}` - Client's phone number
- `{{property_address}}` - Property address
- `{{notes}}` - Additional notes from client

## Troubleshooting

### Common Issues

1. **Webhook URL not configured**
   - Check `.env.local` file
   - Verify `NEXT_PUBLIC_MAKE_WEBHOOK_URL` is set

2. **Network errors**
   - Check internet connection
   - Verify Make.com webhook URL is accessible
   - Check browser network tab for failed requests

3. **Validation errors**
   - Ensure all required fields are filled
   - Check email format is valid
   - Verify phone number format

4. **Make.com not receiving data**
   - Check Make.com scenario is active
   - Verify webhook URL is correct
   - Check Make.com execution history

### Debug Steps

1. Open browser developer tools
2. Go to Console tab
3. Submit the form
4. Check for webhook-related log messages
5. Verify network requests in Network tab

## Future Enhancements

- [ ] Retry mechanism for failed webhook submissions
- [ ] Webhook response validation
- [ ] Analytics and metrics tracking
- [ ] A/B testing for different email templates
- [ ] Multi-language email support
