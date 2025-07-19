# Expo Push Notifications Integration

## Overview

This document describes the Expo Push Notifications integration for the Sia Moon Property Management system. The integration provides real-time push notifications to staff mobile devices when job assignments or status changes occur.

## Architecture

### Components

1. **ExpoPushService** (`src/services/ExpoPushService.ts`)
   - Core service for Expo Push API interactions
   - Token validation and management
   - Error handling and retry logic

2. **Enhanced NotificationService** (`src/services/NotificationService.ts`)
   - Integrated Expo push as a new delivery channel
   - Maintains compatibility with existing notification flow
   - Enhanced error handling and token cleanup

3. **API Endpoints**
   - `/api/mobile/expo-token` - Token registration/management
   - `/api/admin/send-push-notification` - Manual admin notifications

4. **Database Schema**
   - Extended `staff_accounts` collection with Expo token fields
   - Updated notification interfaces to support `expo_push` channel

## Token Management

### Storage Structure

Expo push tokens are stored in the `staff_accounts` collection:

```typescript
{
  expoPushToken: string,              // ExponentPushToken[...] or ExpoPushToken[...]
  expoPushTokenPlatform: 'ios' | 'android',
  expoPushTokenAppVersion: string,
  expoPushTokenUpdatedAt: Timestamp,
  expoPushTokenIsValid: boolean
}
```

### Token Lifecycle

1. **Registration**: Mobile app registers token via `/api/mobile/expo-token`
2. **Validation**: Token format validated using regex pattern
3. **Storage**: Token stored with metadata in staff account
4. **Cleanup**: Invalid tokens marked and periodically cleaned up

## Notification Flow

### Automatic Notifications

The system automatically sends Expo push notifications for:

- **Job Assignment** (`status: 'assigned'`)
  - High priority with urgent sound and vibration
  - Deep link to JobDetails screen
  - Action buttons for Accept/Decline

- **Job Status Updates** (`accepted`, `completed`, `cancelled`)
  - Medium priority notifications
  - Contextual action buttons

- **Job Reminders** (1 hour before scheduled time)
  - Medium priority with preparation instructions
  - Deep link to job details

- **Escalation Notifications** (unaccepted jobs after 30 minutes)
  - High priority admin alerts
  - Reassignment action buttons

### Delivery Channels

Notifications support multiple delivery channels:
- `expo_push` - Expo Push Notifications (NEW)
- `push` - Firebase Cloud Messaging (existing)
- `email` - Email notifications (existing)
- `sms` - SMS notifications (existing)
- `in_app` - In-app notifications (existing)

### Priority Mapping

```typescript
// Default channel priorities
priorities: {
  high: ['expo_push', 'push', 'in_app'],    // Job assignments, escalations
  medium: ['expo_push', 'push', 'in_app'],  // Reminders, updates
  low: ['in_app']                           // General notifications
}
```

## Error Handling

### Expo-Specific Errors

The system handles these Expo API errors:

1. **DeviceNotRegistered**
   - Token marked as invalid
   - Automatic cleanup scheduled
   - No retry attempted

2. **InvalidCredentials**
   - Logged for investigation
   - Retries attempted

3. **MessageTooBig**
   - Message truncated automatically
   - Warning logged

4. **MessageRateExceeded**
   - Exponential backoff retry
   - Rate limiting respected

### Retry Logic

- **Retryable Errors**: Network issues, rate limits, temporary failures
- **Non-Retryable Errors**: Invalid tokens, malformed messages, device not registered
- **Max Attempts**: 3 retries with exponential backoff
- **Backoff**: 1s, 2s, 4s intervals

## API Endpoints

### Mobile Token Registration

```http
POST /api/mobile/expo-token
Headers:
  X-API-Key: sia-moon-mobile-app-2025-secure-key
  X-Mobile-Secret: mobile-app-sync-2025-secure

Body:
{
  "staffId": "staff_account_id",
  "expoPushToken": "ExponentPushToken[...]",
  "platform": "ios" | "android",
  "appVersion": "1.0.0"
}
```

### Admin Manual Notifications

```http
POST /api/admin/send-push-notification
Headers:
  Authorization: Bearer admin-sia-moon-2025-secure

Body:
{
  "staffId": "staff_account_id",           // Single staff member
  "staffIds": ["id1", "id2"],             // Multiple staff members
  "title": "Notification Title",
  "message": "Notification message",
  "jobId": "optional_job_id",
  "priority": "high" | "medium" | "low",
  "data": { /* additional data */ }
}
```

## Message Format

### Expo Push Message Structure

```typescript
{
  to: string[],                    // Expo push tokens
  title: string,                   // Notification title
  body: string,                    // Notification body (truncated if needed)
  data: {
    jobId?: string,                // Deep link data
    propertyName?: string,
    priority: string,
    actionButtons?: Array<{}>,
    screen: string,                // Target screen
    timestamp: string
  },
  sound: 'default' | null,         // Sound based on priority
  priority: 'high' | 'normal',     // Delivery priority
  ttl: number,                     // Time to live (seconds)
  badge: number                    // Badge count
}
```

## Integration with Existing Systems

### NotificationService Integration

The Expo push integration extends the existing `NotificationService`:

- **Backward Compatible**: Existing notification flow unchanged
- **Channel Addition**: `expo_push` added to delivery channels
- **Preference Support**: Respects user notification preferences
- **Metrics Tracking**: Tracks Expo push success rates

### Firebase Integration

- **Firestore**: Token storage in existing `staff_accounts` collection
- **Cloud Functions**: Compatible with existing job notification triggers
- **Indexes**: Uses existing notification indexes

## Performance Considerations

### Batch Processing

- **Token Retrieval**: Batch queries for multiple staff members
- **Message Sending**: Expo supports up to 100 tokens per request
- **Error Handling**: Batch processing of delivery results

### Metrics Tracking

```typescript
interface NotificationMetrics {
  totalSent: number,
  deliverySuccessRate: number,
  expoPushSuccessRate: number,      // NEW: Expo-specific success rate
  averageDeliveryTime: number,
  responseRate: number,
  unacceptedJobs: number,
  escalatedJobs: number,
  lastNotificationSent: Date | null
}
```

## Security

### Authentication

- **Mobile API**: API key + secret authentication
- **Admin API**: Bearer token authentication
- **Token Validation**: Expo token format validation

### Data Protection

- **Token Encryption**: Tokens stored securely in Firestore
- **Access Control**: Staff can only manage their own tokens
- **Admin Privileges**: Only admins can send manual notifications

## Monitoring and Maintenance

### Token Cleanup

```typescript
// Periodic cleanup of invalid tokens
await notificationService.cleanupInvalidExpoPushTokens()
```

### Health Checks

- Monitor Expo API response times
- Track token validation success rates
- Alert on high error rates

### Logging

All Expo push operations are logged with:
- Staff ID and token status
- Delivery success/failure
- Error types and cleanup actions
- Performance metrics

## Testing

### Manual Testing

1. Register Expo token via mobile API
2. Trigger job assignment to test automatic notifications
3. Send manual notification via admin API
4. Verify deep linking and action buttons

### Error Testing

1. Test with invalid tokens
2. Simulate network failures
3. Test rate limiting scenarios
4. Verify cleanup processes

## Deployment Notes

### Environment Variables

```env
ADMIN_API_KEY=admin-sia-moon-2025-secure
```

### Firebase Indexes

No additional indexes required - uses existing notification indexes.

### Mobile App Requirements

- Expo SDK with push notification support
- Token registration on app startup
- Deep linking configuration for job details
- Action button handling

## Troubleshooting

### Common Issues

1. **Tokens Not Registering**
   - Check API key authentication
   - Verify token format
   - Check staff account exists

2. **Notifications Not Delivered**
   - Verify token validity
   - Check Expo service status
   - Review error logs

3. **High Error Rates**
   - Run token cleanup
   - Check for app updates
   - Verify Expo credentials

### Debug Commands

```typescript
// Check staff token status
const result = await ExpoPushService.getStaffExpoPushTokens([staffId])

// Manual token cleanup
const cleanup = await notificationService.cleanupInvalidExpoPushTokens()

// Send test notification
await ExpoPushService.sendToStaff([staffId], "Test", "Test message")
```
