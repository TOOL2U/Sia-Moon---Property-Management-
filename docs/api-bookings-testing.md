# Bookings API Testing Documentation

## Overview
The `/api/bookings` endpoint enables automatic booking creation from Make.com automation.

## Endpoint Details
- **URL**: `https://sia-moon-property-management.vercel.app/api/bookings`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: API Key or Vercel Protection Bypass Header

## Authentication Headers

### Option 1: API Key
```
x-api-key: sia-moon-make-com-2025-secure-key
```

### Option 2: Vercel Protection Bypass
```
x-vercel-protection-bypass: sia-moon-vercel-bypass-2025
```

## Request Payload Structure

```json
{
  "property": "Villa Sunset Paradise",
  "address": "123 Beach Road, Seminyak, Bali",
  "guestName": "John Smith",
  "guestEmail": "john.smith@email.com",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-20",
  "nights": "5",
  "guests": "4",
  "price": "$2500",
  "subject": "Booking Confirmation - Villa Sunset Paradise",
  "date": "2025-07-11T10:30:00Z"
}
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Booking created successfully.",
  "bookingId": "abc123xyz789",
  "processingTime": 1250,
  "bookingDetails": {
    "property": "Villa Sunset Paradise",
    "guest": "John Smith",
    "checkIn": "2025-08-15",
    "checkOut": "2025-08-20",
    "price": 2500,
    "status": "pending_approval"
  }
}
```

### Duplicate Booking Response
```json
{
  "success": true,
  "message": "Duplicate booking detected, skipping creation.",
  "duplicate": true,
  "processingTime": 850
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Missing required field: guestEmail",
    "Invalid check-in date format"
  ]
}
```

### Unauthorized Response
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Testing with cURL

### Basic Test
```bash
curl -X POST "https://sia-moon-property-management.vercel.app/api/bookings" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sia-moon-make-com-2025-secure-key" \
  -d '{
    "property": "Test Villa Paradise",
    "address": "123 Test Street, Test City",
    "guestName": "Test Guest",
    "guestEmail": "test@example.com",
    "checkInDate": "2025-08-15",
    "checkOutDate": "2025-08-17",
    "nights": "2",
    "guests": "2",
    "price": "$500",
    "subject": "Test Booking Confirmation",
    "date": "2025-07-11T12:00:00Z"
  }'
```

### Test Duplicate Detection
Run the same cURL command twice to test duplicate detection.

### Test Validation Errors
```bash
curl -X POST "https://sia-moon-property-management.vercel.app/api/bookings" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sia-moon-make-com-2025-secure-key" \
  -d '{
    "property": "",
    "guestEmail": "invalid-email",
    "checkInDate": "invalid-date"
  }'
```

### Test Unauthorized Access
```bash
curl -X POST "https://sia-moon-property-management.vercel.app/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "property": "Test Villa",
    "guestName": "Test Guest"
  }'
```

## Testing with Postman

### Setup
1. Create new POST request
2. URL: `https://sia-moon-property-management.vercel.app/api/bookings`
3. Headers:
   - `Content-Type: application/json`
   - `x-api-key: sia-moon-make-com-2025-secure-key`

### Test Cases

#### Test Case 1: Valid Booking
**Body (JSON):**
```json
{
  "property": "Ocean View Villa",
  "address": "456 Ocean Drive, Miami Beach",
  "guestName": "Sarah Johnson",
  "guestEmail": "sarah.johnson@email.com",
  "checkInDate": "2025-09-01",
  "checkOutDate": "2025-09-05",
  "nights": "4",
  "guests": "3",
  "price": "€1800",
  "subject": "Booking Confirmation - Ocean View Villa",
  "date": "2025-07-11T14:00:00Z"
}
```

#### Test Case 2: Different Price Formats
Test with various price formats:
- `"$1500"`
- `"€1200"`
- `"£900"`
- `"¥150000"`
- `"1500"`
- `1500` (number)

#### Test Case 3: Different Date Formats
Test with various date formats:
- `"2025-08-15"` (ISO)
- `"08/15/2025"` (US)
- `"15/08/2025"` (EU)

## Data Processing

### Automatic Normalization
The API automatically:
- Removes currency symbols from prices
- Converts strings to appropriate data types
- Normalizes dates to ISO format
- Trims whitespace from text fields
- Converts emails to lowercase

### Duplicate Detection
Duplicates are detected using:
- Property name (case-insensitive, trimmed)
- Guest name (case-insensitive, trimmed)
- Check-in date
- Check-out date

### Firebase Storage
Successful bookings are stored in the `bookings` collection with:
- All normalized booking data
- `status: "pending_approval"`
- `source: "make_com_automation"`
- `createdAt` and `updatedAt` timestamps
- `duplicateCheckHash` for future duplicate detection

## Health Check

### GET Request
```bash
curl -X GET "https://sia-moon-property-management.vercel.app/api/bookings"
```

### Response
```json
{
  "success": true,
  "message": "Bookings API is operational",
  "timestamp": "2025-07-11T13:30:00.000Z",
  "endpoints": {
    "POST": "Create new booking",
    "GET": "Health check"
  }
}
```

## Make.com Integration

### HTTP Module Configuration
1. **URL**: `https://sia-moon-property-management.vercel.app/api/bookings`
2. **Method**: POST
3. **Headers**:
   - `Content-Type: application/json`
   - `x-api-key: sia-moon-make-com-2025-secure-key`
4. **Body**: Map parsed email fields to JSON structure

### Field Mapping
Map your Text Parser output to:
```
property → {{textParser.property}}
address → {{textParser.address}}
guestName → {{textParser.guestName}}
guestEmail → {{textParser.guestEmail}}
checkInDate → {{textParser.checkInDate}}
checkOutDate → {{textParser.checkOutDate}}
nights → {{textParser.nights}}
guests → {{textParser.guests}}
price → {{textParser.price}}
subject → {{gmailWatch.subject}}
date → {{gmailWatch.date}}
```

## Monitoring and Logs

### Console Logs
The API logs all activities:
- Request received
- Authentication status
- Validation results
- Data normalization
- Duplicate checks
- Firebase operations
- Success/error responses

### Firebase Collections
- **bookings**: Main booking storage
- **booking_logs**: Detailed processing logs (if implemented)

## Security Features

### Authentication
- API key validation
- Vercel protection bypass support
- Development localhost allowance

### Data Validation
- Required field validation
- Email format validation
- Date format validation
- SQL injection prevention
- XSS protection

### Rate Limiting
Consider implementing rate limiting for production use.

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check API key header
2. **400 Validation Error**: Verify required fields
3. **500 Internal Error**: Check Firebase configuration
4. **Duplicate Detection**: Expected behavior for same booking

### Debug Steps
1. Check console logs
2. Verify Firebase connection
3. Test with minimal payload
4. Check environment variables
5. Validate JSON format
