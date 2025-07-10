# 🧪 Booking Test Webhook Endpoint

## Purpose

The `/api/booking-test` endpoint is a **safe, dedicated webhook** for receiving and testing parsed booking.com email data from Make.com. This allows us to debug and refine our automated booking pipeline without affecting the live booking system.

## Features

- ✅ **Safe Testing**: Isolated from production booking endpoints
- ✅ **Comprehensive Logging**: Detailed console logs for debugging
- ✅ **Data Storage**: Optional Firebase storage for inspection
- ✅ **Validation**: Basic field validation with missing field detection
- ✅ **Error Handling**: Graceful error responses with detailed information
- ✅ **CORS Support**: Proper CORS headers for cross-origin requests
- ✅ **Documentation**: Built-in endpoint documentation via GET request

---

## 🔗 Endpoint Details

### **URL**: `/api/booking-test`
### **Method**: `POST`
### **Content-Type**: `application/json`

---

## 📋 Expected Payload Structure

```json
{
  "guestName": "John Doe",                    // Required
  "guestEmail": "john.doe@example.com",       // Optional
  "checkIn": "2025-08-01",                    // Required (YYYY-MM-DD)
  "checkOut": "2025-08-07",                   // Required (YYYY-MM-DD)
  "property": "Villa Sunset",                 // Optional
  "propertyId": "prop-123",                   // Optional
  "bookingReference": "BDC-123456789",        // Optional
  "totalAmount": 1500,                        // Optional
  "currency": "USD",                          // Optional
  "guests": 2,                                // Optional
  "specialRequests": "Late check-in",         // Optional
  "bookingSource": "booking.com",             // Optional
  "rawEmailData": { ... },                    // Optional (original email data)
  "parsedAt": "2025-01-10T10:30:00Z"         // Optional (when parsed by Make.com)
}
```

---

## 📤 Response Format

### **Success Response (200)**
```json
{
  "status": "success",
  "message": "Booking test payload received and logged",
  "received": { ...originalPayload },
  "metadata": {
    "timestamp": "2025-01-10T10:30:00.000Z",
    "processingTimeMs": 45,
    "payloadSize": 512,
    "missingFields": ["guestEmail"],          // Only if fields are missing
    "extractedInfo": {
      "guestName": "John Doe",
      "checkIn": "2025-08-01",
      "checkOut": "2025-08-07",
      // ... other extracted fields
    },
    "storedInFirebase": true,
    "firebaseDocId": "abc123def456"
  }
}
```

### **Error Response (400/500)**
```json
{
  "status": "error",
  "error": "Invalid JSON payload",
  "details": "Unexpected token in JSON",      // Additional error details
  "metadata": {
    "timestamp": "2025-01-10T10:30:00.000Z",
    "processingTimeMs": 12
  }
}
```

---

## 🧪 Testing the Webhook (Multiple Options)

### **Option 1: Web Interface (Easiest)**
Visit `/test-booking-trigger` in your browser for a user-friendly test interface:
- **URL**: `http://localhost:3000/test-booking-trigger`
- **Features**: 5 pre-built test scenarios, visual results, batch testing
- **Perfect for**: Quick testing and visual feedback

### **Option 2: Command Line Script**
Use the included test trigger script:
```bash
# Send a single test booking
node trigger-test-booking.js single 0

# Send all test bookings
node trigger-test-booking.js all

# List available test scenarios
node trigger-test-booking.js list

# Test against production
TEST_URL=https://yourdomain.com node trigger-test-booking.js single 0
```

### **Option 3: Manual curl Commands**

#### **Basic Test**
```bash
curl -X POST https://yourdomain.com/api/booking-test \
-H "Content-Type: application/json" \
-d '{
  "guestName": "John Doe",
  "guestEmail": "john.doe@example.com",
  "checkIn": "2025-08-01",
  "checkOut": "2025-08-07",
  "property": "Villa Sunset",
  "bookingReference": "BDC-123456789",
  "totalAmount": 1500,
  "currency": "USD",
  "guests": 2,
  "bookingSource": "booking.com"
}'
```

### **Minimal Test (Required Fields Only)**
```bash
curl -X POST https://yourdomain.com/api/booking-test \
-H "Content-Type: application/json" \
-d '{
  "guestName": "Jane Smith",
  "checkIn": "2025-08-15",
  "checkOut": "2025-08-20"
}'
```

### **Complex Test with Raw Email Data**
```bash
curl -X POST https://yourdomain.com/api/booking-test \
-H "Content-Type: application/json" \
-d '{
  "guestName": "Mike Wilson",
  "guestEmail": "mike.wilson@example.com",
  "checkIn": "2025-09-01",
  "checkOut": "2025-09-05",
  "property": "Ocean View Villa",
  "propertyId": "villa-ocean-001",
  "bookingReference": "BDC-987654321",
  "totalAmount": 2400,
  "currency": "USD",
  "guests": 4,
  "specialRequests": "Ground floor room, early check-in",
  "bookingSource": "booking.com",
  "rawEmailData": {
    "subject": "New booking confirmation",
    "from": "noreply@booking.com",
    "receivedAt": "2025-01-10T08:15:00Z"
  },
  "parsedAt": "2025-01-10T08:16:30Z"
}'
```

### **Get Endpoint Documentation**
```bash
curl -X GET https://yourdomain.com/api/booking-test
```

---

## 🔍 Debugging & Monitoring

### **Console Logs**
The endpoint provides detailed console logging:
- Request headers and metadata
- Complete payload dump
- Extracted booking information
- Processing time and performance metrics
- Firebase storage results
- Error details with stack traces

### **Firebase Storage**
Test payloads are automatically stored in the `booking_test_logs` collection with:
- Original payload data
- Extracted booking information
- Processing metadata
- Timestamp and performance metrics
- Missing field analysis

### **Log Example**
```
🔄 Booking Test Webhook - Incoming request
   Timestamp: 2025-01-10T10:30:00.000Z
   User-Agent: Make.com/1.0
   Content-Type: application/json

📦 Booking Test Payload Received:
   Raw payload: { "guestName": "John Doe", ... }
   Payload size: 512 bytes

📋 Extracted Booking Information:
   guestName: John Doe
   checkIn: 2025-08-01
   checkOut: 2025-08-07
   property: Villa Sunset
   totalAmount: 1500

💾 Test payload stored in Firebase: abc123def456
✅ Booking test webhook processed in 45ms
```

---

## 🔧 Make.com Integration

### **HTTP Module Configuration**
1. **URL**: `https://yourdomain.com/api/booking-test`
2. **Method**: `POST`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body**: JSON payload with parsed booking data

### **Recommended Make.com Flow**
1. **Email Parser**: Extract data from booking.com emails
2. **Data Transformer**: Format data to match expected payload structure
3. **HTTP Request**: POST to `/api/booking-test`
4. **Response Handler**: Log success/error responses
5. **Error Handling**: Retry logic for failed requests

---

## 🚀 Production Migration

When ready to move to production:

1. **Update Make.com URL**: Change from `/api/booking-test` to `/api/bookings`
2. **Add Authentication**: Implement API key or webhook signature validation
3. **Enhanced Validation**: Add stricter field validation and business rules
4. **Database Integration**: Store in production booking tables
5. **Notification System**: Trigger booking confirmation emails
6. **Error Monitoring**: Set up alerts for failed bookings

---

## 🛡️ Security Considerations

- **No Authentication**: This is a test endpoint - add auth for production
- **Rate Limiting**: Consider adding rate limiting for production use
- **Input Validation**: Basic validation only - enhance for production
- **CORS**: Currently allows all origins - restrict for production
- **Logging**: Sensitive data is logged - review for production

---

## 📊 Monitoring & Analytics

Track these metrics during testing:
- **Request Volume**: Number of test requests received
- **Processing Time**: Average response time
- **Error Rate**: Failed vs successful requests
- **Data Quality**: Missing fields and validation issues
- **Make.com Performance**: End-to-end pipeline timing

---

## 🔗 Related Endpoints

- **Production Booking**: `/api/bookings` (when implemented)
- **Booking Sync**: `/api/booking-sync/property/[propertyId]`
- **Webhook Documentation**: `/api/booking-test` (GET request)

---

## ✅ **Implementation Status**

**COMPLETED** - The booking test webhook endpoint is fully implemented and ready for Make.com integration!

### **📁 Files Created:**
- `src/app/api/booking-test/route.ts` - Main webhook endpoint
- `src/app/test-booking-trigger/page.tsx` - Web-based test interface
- `trigger-test-booking.js` - Command-line test trigger script
- `BOOKING_TEST_WEBHOOK.md` - Complete documentation

### **🧪 Testing Status:**
- ✅ Endpoint structure validated
- ✅ Error handling tested
- ✅ Firebase integration ready
- ✅ CORS configuration complete
- ✅ Documentation endpoint working
- ✅ TypeScript compilation successful

### **🚀 Deployment Ready:**
The endpoint is ready for deployment and Make.com integration. Simply deploy your Next.js application and configure Make.com to POST to `/api/booking-test`.

---

**This endpoint is designed for testing and development only. Do not use in production without proper authentication and validation.**
