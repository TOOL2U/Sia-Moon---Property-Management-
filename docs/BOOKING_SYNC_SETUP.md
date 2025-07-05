# Booking Sync Integration Guide

This guide explains how to set up and use the automated booking synchronization system that integrates with Airbnb and Booking.com via iCal feeds.

## Overview

The booking sync system automatically:
- Fetches bookings from Airbnb and Booking.com iCal feeds
- Prevents duplicate entries by checking external IDs
- Creates cleaning tasks automatically for new check-outs
- Sends email notifications to staff for new tasks
- Runs on a scheduled basis (every 2 hours) or manually

## Features

### ✅ **Automatic Sync**
- **Scheduled Sync**: Runs every 2 hours automatically
- **Frequent Updates**: Quick sync every 30 minutes for urgent changes
- **Manual Triggers**: On-demand sync via admin dashboard or API

### ✅ **Platform Support**
- **Airbnb**: Full iCal integration with guest name extraction
- **Booking.com**: Complete iCal support with booking details
- **Generic iCal**: Support for other platforms using standard iCal format

### ✅ **Smart Duplicate Prevention**
- **External ID Tracking**: Uses platform-specific booking IDs
- **Update Detection**: Only updates bookings when data changes
- **Conflict Resolution**: Handles overlapping bookings gracefully

### ✅ **Automatic Task Creation**
- **Cleaning Tasks**: Auto-created for new check-outs
- **Staff Assignment**: Assigns to available staff members
- **Email Notifications**: Sends task details to assigned staff
- **Due Date Calculation**: Sets cleaning due 24 hours after checkout

## Setup Instructions

### 1. **Airbnb iCal Setup**

1. **Access Your Airbnb Dashboard**
   - Go to [airbnb.com/hosting](https://airbnb.com/hosting)
   - Navigate to your property listing

2. **Find Calendar Settings**
   - Click on "Calendar" in the main menu
   - Go to "Availability settings" or "Calendar sync"

3. **Export Calendar**
   - Look for "Export calendar" or "Calendar export"
   - Copy the iCal URL (usually starts with `https://www.airbnb.com/calendar/ical/`)

4. **Configure in System**
   - Go to Admin Dashboard → Booking Sync
   - Find your property and click the settings icon
   - Paste the Airbnb iCal URL
   - Enable sync and save

### 2. **Booking.com iCal Setup**

1. **Access Partner Dashboard**
   - Log into [admin.booking.com](https://admin.booking.com)
   - Select your property

2. **Navigate to Calendar**
   - Go to "Property" → "Calendar" or "Rates & Availability"
   - Look for "Calendar export" or "iCal export"

3. **Get iCal URL**
   - Find the "Export calendar" option
   - Copy the iCal URL (usually starts with `https://admin.booking.com/hotel/hoteladmin/ical/`)

4. **Configure in System**
   - Go to Admin Dashboard → Booking Sync
   - Find your property and click the settings icon
   - Paste the Booking.com iCal URL
   - Enable sync and save

### 3. **System Configuration**

#### **Environment Variables**
Add these to your `.env.local` file:

```bash
# Optional: Enable automatic cron jobs in production
ENABLE_BOOKING_SYNC_CRON=true

# Optional: API key for webhook authentication
SYNC_API_KEY=your-secure-api-key-here

# Required: Make.com webhook for email notifications
NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-url
```

#### **Property Configuration**
For each property, configure:
- **Airbnb iCal URL**: The calendar export URL from Airbnb
- **Booking.com iCal URL**: The calendar export URL from Booking.com
- **Sync Enabled**: Toggle to enable/disable automatic sync
- **Last Sync**: Shows when the property was last synchronized

## Usage

### **Admin Dashboard**

Access the booking sync management at `/dashboard/admin/booking-sync`:

1. **View Sync Status**
   - See all properties and their sync configuration
   - Check last sync times and status badges
   - View booking statistics by platform

2. **Configure Properties**
   - Click the settings icon next to any property
   - Add or update iCal URLs
   - Enable/disable sync for each property

3. **Manual Sync**
   - Click "Sync All Properties" for a full sync
   - Use individual property sync buttons for specific properties
   - View real-time sync results and statistics

4. **Monitor Results**
   - See recent sync results with detailed statistics
   - View any errors or warnings
   - Track cleaning tasks created automatically

### **API Endpoints**

#### **Sync All Properties**
```bash
POST /api/booking-sync/all
```
Triggers sync for all properties with sync enabled.

#### **Sync Specific Property**
```bash
POST /api/booking-sync/property/[propertyId]
Content-Type: application/json

{
  "airbnbICalUrl": "https://www.airbnb.com/calendar/ical/...",
  "bookingComICalUrl": "https://admin.booking.com/hotel/hoteladmin/ical/...",
  "enableAutoCleaningTasks": true
}
```

#### **Get Property Sync Status**
```bash
GET /api/booking-sync/property/[propertyId]
```
Returns sync configuration and statistics for a property.

#### **Update Property Sync Config**
```bash
PUT /api/booking-sync/property/[propertyId]
Content-Type: application/json

{
  "airbnbICalUrl": "https://www.airbnb.com/calendar/ical/...",
  "bookingComICalUrl": "https://admin.booking.com/hotel/hoteladmin/ical/...",
  "syncEnabled": true
}
```

### **Automated Scheduling**

The system includes built-in cron jobs:

- **Main Sync**: Every 2 hours (0 */2 * * *)
- **Frequent Sync**: Every 30 minutes (*/30 * * * *)
- **Daily Cleanup**: Daily at 2 AM (0 2 * * *)

To enable in production, set `ENABLE_BOOKING_SYNC_CRON=true` in your environment.

## Data Flow

### **Sync Process**

1. **Fetch iCal Data**
   - Download iCal feeds from configured URLs
   - Parse calendar events using iCal parser
   - Extract booking information and guest details

2. **Process Bookings**
   - Check for existing bookings using external IDs
   - Create new bookings or update existing ones
   - Validate dates and guest information

3. **Create Tasks**
   - Generate cleaning tasks for new check-outs
   - Assign tasks to available staff members
   - Set due dates (24 hours after checkout)

4. **Send Notifications**
   - Email staff members about new task assignments
   - Include task details and property information
   - Use Make.com webhook for email delivery

### **Data Structure**

#### **Enhanced Booking Model**
```typescript
interface Booking {
  id: string
  property_id: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  status: 'confirmed' | 'pending' | 'cancelled'
  
  // Sync metadata
  external_id?: string // Platform booking ID
  platform?: 'airbnb' | 'booking_com' | 'manual'
  sync_source?: string // iCal URL
  last_synced?: string // Last sync timestamp
  
  created_at: string
  updated_at: string
}
```

#### **Property Sync Configuration**
```typescript
interface Property {
  // ... existing fields
  
  // Sync configuration
  airbnb_ical_url?: string
  booking_com_ical_url?: string
  sync_enabled?: boolean
  last_sync?: string
}
```

## Troubleshooting

### **Common Issues**

#### **iCal URL Not Working**
- Verify the URL is correct and accessible
- Check that the calendar is set to "public" or "exportable"
- Ensure the URL hasn't expired (some platforms rotate URLs)

#### **No Bookings Found**
- Check that the iCal feed contains future bookings
- Verify the calendar has bookings in the expected date range
- Look for parsing errors in the sync results

#### **Duplicate Bookings**
- The system should prevent duplicates automatically
- If duplicates occur, check that external IDs are being set correctly
- Manual bookings won't have external IDs and won't conflict

#### **Cleaning Tasks Not Created**
- Ensure staff members exist in the system
- Check that the booking has a valid checkout date
- Verify that cleaning task creation is enabled

### **Debugging**

#### **Check Sync Logs**
- View recent sync results in the admin dashboard
- Look for error messages and warnings
- Check sync duration and statistics

#### **Test API Endpoints**
- Use the test page at `/test-tasks` to test sync functionality
- Try manual sync for individual properties
- Check API responses for detailed error information

#### **Monitor Console Logs**
- Check browser console for client-side errors
- Review server logs for API and sync errors
- Look for network issues or timeout errors

## Security Considerations

### **iCal URL Security**
- iCal URLs may contain sensitive information
- Store URLs securely and don't expose in logs
- Consider URL rotation policies from platforms

### **API Authentication**
- Add authentication to sync API endpoints in production
- Use API keys or JWT tokens for webhook calls
- Implement rate limiting for sync endpoints

### **Data Privacy**
- Guest information is stored locally during development
- Ensure compliance with data protection regulations
- Consider data retention policies for old bookings

## Performance Optimization

### **Sync Frequency**
- Adjust cron schedules based on booking volume
- Use frequent sync only for high-priority properties
- Consider time zone differences for optimal sync timing

### **Error Handling**
- Implement retry logic for failed syncs
- Use exponential backoff for network errors
- Log errors for monitoring and debugging

### **Resource Management**
- Limit concurrent sync operations
- Implement timeout handling for slow iCal feeds
- Monitor memory usage during large syncs

## Migration to Production

### **Supabase Integration**
When ready for production with Supabase:

1. **Database Schema**
   - Create tables matching the TypeScript interfaces
   - Add indexes for external_id and sync fields
   - Set up foreign key relationships

2. **Environment Setup**
   - Configure Supabase connection strings
   - Set up database migrations
   - Update environment variables

3. **Deployment**
   - Enable cron jobs in production environment
   - Set up monitoring and alerting
   - Configure backup and recovery procedures

This booking sync system provides a robust foundation for automated booking management with room for customization and scaling as your property management needs grow.
