# 📱 Mobile API Documentation

## Overview

The Mobile API provides endpoints for React Native mobile app integration with the property management webapp. It enables real-time synchronization of bookings, staff assignments, and property data between platforms.

## Base URL
```
Production: https://sia-moon-property-management.vercel.app
Development: http://localhost:3000
```

## Authentication

All mobile API endpoints require authentication headers:

```http
X-API-Key: sia-moon-mobile-app-2025-secure-key
X-Mobile-Secret: mobile-app-sync-2025-secure
```

Optional headers:
```http
X-Staff-ID: staff_001
X-Device-ID: device_001
```

## Rate Limiting

- **Limit**: 100 requests per hour per API key
- **Response**: 429 Too Many Requests when exceeded

## Error Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": 1234567890
}
```

## Endpoints

### 1. GET /api/bookings?mobile=true&status=approved

Fetch approved bookings for mobile app.

**Query Parameters:**
- `mobile=true` (required)
- `status` (optional): approved, confirmed, in-progress, completed
- `limit` (optional): max results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_001",
        "propertyId": "property_001",
        "propertyName": "Villa Mango Beach",
        "propertyAddress": "55/45 Moo 8 Koh Phangan",
        "guestName": "John Doe",
        "guestEmail": "john@example.com",
        "guestPhone": "+1234567890",
        "checkIn": "2025-07-20",
        "checkOut": "2025-07-25",
        "status": "approved",
        "totalAmount": 25000,
        "paymentStatus": "pending",
        "specialRequests": "Late check-in",
        "assignedStaff": ["staff_001", "staff_002"],
        "tasks": [],
        "createdAt": "2025-07-01T10:00:00Z",
        "approvedAt": "2025-07-01T11:00:00Z"
      }
    ],
    "count": 1,
    "status": "approved",
    "lastSync": 1234567890
  },
  "timestamp": 1234567890
}
```

### 2. PATCH /api/bookings/[bookingId]

Update booking status from mobile app.

**Request Body:**
```json
{
  "status": "confirmed",
  "updatedBy": "staff_001",
  "notes": "Booking confirmed by mobile app",
  "photos": ["https://example.com/photo1.jpg"],
  "checklistCompleted": ["cleaning", "setup"],
  "timeSpent": 120,
  "timestamp": "2025-07-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_001",
    "oldStatus": "approved",
    "newStatus": "confirmed",
    "updatedAt": "2025-07-01T12:00:00Z",
    "syncTimestamp": 1234567890
  },
  "message": "Booking updated successfully",
  "timestamp": 1234567890
}
```

### 3. GET /api/mobile/assignments

Fetch staff assignments for mobile app.

**Query Parameters:**
- `staffId` (optional): filter by staff member
- `date` (optional): filter by date (YYYY-MM-DD)
- `status` (optional): pending, accepted, in-progress, completed, cancelled
- `limit` (optional): max results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "assignment_001",
        "staffId": "staff_001",
        "staffName": "Maria Santos",
        "bookingId": "booking_001",
        "propertyId": "property_001",
        "propertyName": "Villa Mango Beach",
        "taskType": "cleaning",
        "title": "Pre-arrival Cleaning",
        "description": "Deep clean villa before guest arrival",
        "scheduledDate": "2025-07-20",
        "scheduledTime": "09:00",
        "status": "pending",
        "priority": "high",
        "notes": "Focus on bathrooms and kitchen"
      }
    ],
    "count": 1,
    "filters": {
      "staffId": "staff_001",
      "date": "all",
      "status": "all"
    },
    "lastSync": 1234567890
  },
  "timestamp": 1234567890
}
```

### 4. PATCH /api/mobile/assignments/[assignmentId]

Update assignment status from mobile app.

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Task completed successfully",
  "photos": ["https://example.com/photo1.jpg"],
  "timeSpent": 120,
  "updatedBy": "staff_001",
  "timestamp": "2025-07-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignmentId": "assignment_001",
    "oldStatus": "in-progress",
    "newStatus": "completed",
    "updatedAt": "2025-07-01T12:00:00Z",
    "syncTimestamp": 1234567890
  },
  "message": "Assignment updated successfully",
  "timestamp": 1234567890
}
```

### 5. POST /api/mobile/sync

Bidirectional sync between mobile app and webapp.

**Request Body:**
```json
{
  "lastSyncTimestamp": 1234567890,
  "staffId": "staff_001",
  "deviceId": "device_001",
  "platform": "mobile",
  "pendingChanges": {
    "bookings": [
      {
        "id": "booking_001",
        "type": "update",
        "data": { "status": "confirmed" },
        "timestamp": 1234567890
      }
    ],
    "assignments": [
      {
        "id": "assignment_001",
        "type": "update",
        "data": { "status": "completed" },
        "timestamp": 1234567890
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [],
    "assignments": [],
    "properties": [],
    "lastSyncTimestamp": 1234567890,
    "syncStats": {
      "processed": {
        "bookings": 1,
        "assignments": 1
      },
      "fetched": {
        "bookings": 0,
        "assignments": 0,
        "properties": 0
      },
      "errors": []
    }
  },
  "message": "Sync completed successfully",
  "timestamp": 1234567890
}
```

## Status Workflows

### Booking Status Flow
```
pending_approval → approved → confirmed → in-progress → completed
                           ↘ cancelled
```

### Assignment Status Flow
```
pending → accepted → in-progress → completed
        ↘ cancelled
```

## Data Types

### Task Types
- `cleaning`: Housekeeping and cleaning tasks
- `maintenance`: Pool, equipment, and facility maintenance
- `inspection`: Property condition checks
- `setup`: Welcome amenities and preparation
- `checkout`: Post-departure inspection

### Priority Levels
- `low`: Non-urgent tasks
- `medium`: Standard priority
- `high`: Important tasks
- `urgent`: Critical tasks requiring immediate attention

## Testing

Use the provided test suite to validate API functionality:

```bash
npm test src/tests/mobile-api.test.ts
```

## Error Codes

- `400`: Bad Request - Invalid data or missing required fields
- `401`: Unauthorized - Invalid or missing authentication
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## CORS Configuration

The API is configured to accept requests from mobile applications with appropriate CORS headers.

## Security Notes

1. Store API keys securely in mobile app
2. Use HTTPS in production
3. Implement proper error handling
4. Monitor API usage and rate limits
5. Validate all data before sending to API

## Support

For API support and questions, contact the development team or refer to the main project documentation.
