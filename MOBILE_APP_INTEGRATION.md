# Mobile App Integration Guide

## Overview

This document provides comprehensive information about the mobile app integration for the Villa Property Management system. The integration enables real-time job assignment, notification delivery, and mobile workforce management.

## Architecture

### Firebase UID Mapping
- **Problem Solved**: Staff accounts now use Firebase UIDs for consistent mobile app queries
- **Implementation**: Fixed staff UID mapping to use Firebase authentication UIDs
- **Staff Account**: `staff@siamoon.com` → Firebase UID: `gTtR5gSKOtUEweLwchSnVreylMy1`

### API Endpoints

#### 1. Mobile Jobs API
**Endpoint**: `GET /api/mobile/jobs`

**Authentication**: Required headers
```
X-API-Key: sia-moon-mobile-app-2025-secure-key
X-Mobile-Secret: mobile-app-sync-2025-secure
```

**Query Parameters**:
- `staffId` (required): Firebase UID of the staff member
- `status` (optional): Filter by job status (assigned, in_progress, completed)
- `limit` (optional): Number of jobs to return (default: 50, max: 100)
- `includeCompleted` (optional): Include completed jobs (default: false)

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/mobile/jobs?staffId=gTtR5gSKOtUEweLwchSnVreylMy1&limit=10" \
  -H "X-API-Key: sia-moon-mobile-app-2025-secure-key" \
  -H "X-Mobile-Secret: mobile-app-sync-2025-secure"
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_id",
        "title": "Villa Cleaning",
        "status": "assigned",
        "assignedStaffId": "gTtR5gSKOtUEweLwchSnVreylMy1",
        "createdAt": "2025-07-18T06:50:11.278Z",
        "mobileOptimized": {
          "title": "Villa Cleaning",
          "address": "123 Villa Street",
          "scheduledTime": "14:00",
          "priority": "high",
          "status": "assigned",
          "estimatedDuration": "2 hours"
        }
      }
    ],
    "totalCount": 1,
    "filters": {
      "staffId": "gTtR5gSKOtUEweLwchSnVreylMy1",
      "status": null,
      "includeCompleted": false
    },
    "syncTimestamp": "2025-07-18T06:50:11.278Z"
  }
}
```

#### 2. Mobile Notifications API
**Endpoint**: `GET /api/mobile/notifications`

**Query Parameters**:
- `staffId` (required): Firebase UID of the staff member
- `limit` (optional): Number of notifications to return (default: 50, max: 100)
- `unreadOnly` (optional): Return only unread notifications (default: false)

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/mobile/notifications?staffId=gTtR5gSKOtUEweLwchSnVreylMy1&limit=10"
```

**Response Format**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "staffId": "gTtR5gSKOtUEweLwchSnVreylMy1",
      "jobId": "job_id",
      "type": "job_assigned",
      "title": "🔔 New Job Assignment",
      "body": "You have been assigned: Villa Cleaning",
      "read": false,
      "delivered": false,
      "createdAt": "2025-07-18T06:50:11.278Z",
      "jobData": {
        "id": "job_id",
        "title": "Villa Cleaning",
        "priority": "high",
        "status": "assigned"
      }
    }
  ],
  "count": 1,
  "staffId": "gTtR5gSKOtUEweLwchSnVreylMy1"
}
```

#### 3. Job Actions API
**Endpoint**: `POST /api/mobile/jobs`

**Actions Supported**:
- `accept_job`: Accept a job assignment
- `start_job`: Start working on a job
- `complete_job`: Mark job as completed
- `update_status`: Update job status
- `get_job_details`: Get detailed job information

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/mobile/jobs" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sia-moon-mobile-app-2025-secure-key" \
  -H "X-Mobile-Secret: mobile-app-sync-2025-secure" \
  -d '{
    "action": "accept_job",
    "jobId": "job_id",
    "staffId": "gTtR5gSKOtUEweLwchSnVreylMy1"
  }'
```

#### 4. Notification Actions API
**Endpoint**: `POST /api/mobile/notifications`

**Actions Supported**:
- `mark_read`: Mark a notification as read
- `mark_all_read`: Mark all notifications as read
- `register_fcm_token`: Register FCM token for push notifications

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/mobile/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mark_read",
    "notificationId": "notification_id",
    "staffId": "gTtR5gSKOtUEweLwchSnVreylMy1"
  }'
```

## Firebase Configuration

### Required Firestore Collections

1. **jobs**: Job assignments with Firebase UID mapping
2. **notifications**: Mobile notifications for job assignments
3. **fcm_tokens**: FCM tokens for push notifications
4. **staff_notifications**: Legacy notification system (maintained for compatibility)

### Required Firestore Indexes

The mobile notifications API requires a composite index:
- Collection: `notifications`
- Fields: `staffId` (Ascending), `createdAt` (Descending)

**Create Index**: Visit the Firebase Console link provided in error messages or manually create the index.

## Mobile App Implementation

### Authentication Flow
1. User logs in with Firebase Authentication
2. App receives Firebase UID
3. Use Firebase UID for all API calls

### Job Synchronization
1. Poll `/api/mobile/jobs` endpoint every 30 seconds
2. Use `syncTimestamp` for efficient updates
3. Cache jobs locally for offline access

### Notification Handling
1. Register FCM token on app startup
2. Listen for push notifications
3. Query `/api/mobile/notifications` for notification details
4. Mark notifications as read when viewed

### Error Handling
- Implement retry logic for network failures
- Handle authentication errors gracefully
- Provide offline mode for cached data

## Testing

### Test Staff Account
- **Email**: `staff@siamoon.com`
- **Firebase UID**: `gTtR5gSKOtUEweLwchSnVreylMy1`
- **Status**: ✅ UID mapping fixed and verified

### API Testing Commands
```bash
# Test mobile jobs API
curl -X GET "http://localhost:3000/api/mobile/jobs?staffId=gTtR5gSKOtUEweLwchSnVreylMy1" \
  -H "X-API-Key: sia-moon-mobile-app-2025-secure-key" \
  -H "X-Mobile-Secret: mobile-app-sync-2025-secure"

# Test mobile notifications API
curl -X GET "http://localhost:3000/api/mobile/notifications?staffId=gTtR5gSKOtUEweLwchSnVreylMy1"
```

## Security

### API Authentication
- Mobile jobs API requires API key and secret
- Notifications API is public but requires valid Firebase UID
- All endpoints validate staff ID ownership

### Data Protection
- Firebase UID used instead of internal IDs
- Sensitive data filtered in mobile responses
- Rate limiting implemented on all endpoints

## Deployment Checklist

- [ ] Firebase UID mapping verified for all staff accounts
- [ ] Firestore indexes created
- [ ] Mobile API endpoints tested
- [ ] FCM configuration verified
- [ ] Push notification testing completed
- [ ] Mobile app authentication flow tested

## Support

For technical support or questions about the mobile app integration:
1. Check server logs for detailed error messages
2. Verify Firebase UID mapping in admin interface
3. Test API endpoints with provided curl commands
4. Review Firestore security rules and indexes

---

**Last Updated**: July 18, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
