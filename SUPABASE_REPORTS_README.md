# Automated Monthly Report Generation System

A comprehensive automated monthly report generation system for villa property management using Next.js, Supabase Edge Functions, and automated notifications.

## 🏗️ System Architecture

### Core Components

1. **Supabase Edge Functions** - Serverless functions for report generation
2. **Automated Scheduling** - Monthly execution on the 1st of each month
3. **PDF Generation** - Professional report PDFs with property metrics
4. **Multi-Channel Notifications** - Email and push notifications
5. **Dashboard Integration** - Client-facing reports interface

### Database Schema

```sql
-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  year INTEGER CHECK (year >= 2020 AND year <= 2050),
  income DECIMAL(12,2) DEFAULT 0.00,
  expenses DECIMAL(12,2) DEFAULT 0.00,
  occupancy_rate DECIMAL(5,2) DEFAULT 0.00,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, month, year)
);
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment variables:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Service (Resend, SendGrid, etc.)
EMAIL_SERVICE_URL=https://api.resend.com/emails
EMAIL_API_KEY=your-email-api-key

# OneSignal Push Notifications
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_API_KEY=your-rest-api-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Migration

Run the database migration to create the reports schema:

```bash
npm run supabase:migrate
```

### 3. Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
npm run supabase:deploy-functions
```

### 4. Set Up Scheduled Execution

#### Option A: Supabase Cron (Recommended)

Enable pg_cron in your Supabase project and run:

```sql
SELECT cron.schedule(
  'monthly-reports-generation',
  '0 2 1 * *',  -- 2 AM UTC on 1st of every month
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-monthly-reports',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Option B: GitHub Actions

Create `.github/workflows/monthly-reports.yml`:

```yaml
name: Generate Monthly Reports
on:
  schedule:
    - cron: '0 2 1 * *'  # 2 AM UTC on 1st of every month
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Reports
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/generate-monthly-reports' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

## 📊 Report Generation Process

### Automated Flow

1. **Trigger**: Runs automatically on the 1st of each month at 2 AM UTC
2. **Data Collection**: Gathers booking and expense data for previous month
3. **Calculations**: Computes income, expenses, and occupancy rate
4. **PDF Generation**: Creates professional PDF report
5. **Storage**: Uploads PDF to Supabase Storage
6. **Database**: Saves report metadata to database
7. **Notifications**: Sends email and push notifications to property owners

### Manual Generation

Generate reports manually via the dashboard or API:

```typescript
// Via React Hook
const { generateReport } = useSupabaseReports()
await generateReport(propertyId, month, year)

// Via API
const response = await fetch('/api/supabase-functions/generate-monthly-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    propertyId: 'property-uuid',
    month: 12,
    year: 2024,
    single: true
  })
})
```

## 📄 Report Content

Each monthly report includes:

### Financial Metrics
- **Total Income**: Sum of completed bookings
- **Total Expenses**: Maintenance and cleaning costs
- **Net Income**: Income minus expenses
- **Revenue per Night**: Average revenue per occupied night

### Occupancy Metrics
- **Occupancy Rate**: Percentage of nights booked
- **Total Nights**: Days in the month
- **Occupied Nights**: Number of booked nights
- **Number of Bookings**: Total booking count

### Professional Presentation
- Property branding and information
- Visual charts and metrics
- Month/year period details
- Generated timestamp

## 🔔 Notification System

### Email Notifications
- Professional HTML templates
- Property performance summary
- Direct PDF download link
- Branded design with company logo

### Push Notifications
- OneSignal integration
- Mobile-friendly alerts
- Deep linking to dashboard
- Customizable based on user preferences

### Notification Preferences
Users can control:
- Email report notifications (on/off)
- Push notification preferences
- Quiet hours for push notifications
- Notification frequency settings

## 🎯 Dashboard Integration

### Client Dashboard Features

#### Reports Tab
- **Monthly Reports List**: Chronological list of all reports
- **Quick Metrics**: Income, expenses, net income, occupancy rate
- **PDF Actions**: Download and view online options
- **Generate New**: Manual report generation interface
- **Mobile-First Design**: Responsive Tailwind CSS layout

#### Report Cards
Each report displays:
- Month and year
- Property name
- Financial summary
- Occupancy percentage
- Profit/loss indicator
- Download/view buttons
- Generation timestamp

## 🧪 Testing

### Test Pages

#### `/test-supabase-reports`
Comprehensive testing interface for:
- Single property report generation
- Bulk report generation for all properties
- PDF generation testing
- Notification system testing
- Real-time test results and logging

### Manual Testing

```bash
# Test report generation
npm run reports:test

# Test individual functions
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-monthly-reports' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"propertyId": "uuid", "month": 12, "year": 2024, "single": true}'
```

## 🔧 Configuration

### PDF Generation

The system supports multiple PDF generation methods:

1. **PDF Service API** (Recommended for production)
2. **Puppeteer** (For self-hosted solutions)
3. **Fallback Text PDF** (Development/testing)

Configure in the Edge Function environment variables.

### Email Service Integration

Supports multiple email providers:
- **Resend** (Recommended)
- **SendGrid**
- **AWS SES**
- **Custom SMTP**

### Storage Configuration

Reports are stored in Supabase Storage:
- Bucket: `reports`
- Path: `reports/{property_id}_{year}_{month}.pdf`
- Public access for authenticated users
- Automatic cleanup policies (optional)

## 📈 Monitoring and Analytics

### Logging
- Comprehensive console logging in Edge Functions
- Error tracking and reporting
- Performance metrics
- Delivery status tracking

### Metrics to Monitor
- Report generation success rate
- PDF generation time
- Email delivery rates
- Push notification delivery
- Storage usage
- Function execution time

## 🔒 Security

### Access Control
- Row Level Security (RLS) policies
- Property owner can only see their reports
- Staff can manage all reports
- Secure PDF URLs with time-limited access

### Data Protection
- Encrypted data transmission
- Secure storage in Supabase
- Environment variable protection
- API key rotation support

## 🚀 Production Deployment

### Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Edge Functions deployed
- [ ] Cron job scheduled
- [ ] Email service configured
- [ ] OneSignal set up
- [ ] Storage bucket created
- [ ] RLS policies enabled
- [ ] Test report generation
- [ ] Verify notifications

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on reports table
2. **PDF Caching**: Consider caching generated PDFs
3. **Batch Processing**: Optimize bulk report generation
4. **Error Handling**: Implement retry mechanisms
5. **Monitoring**: Set up alerts for failures

## 🆘 Troubleshooting

### Common Issues

#### Reports Not Generating
- Check Edge Function logs in Supabase dashboard
- Verify environment variables are set
- Ensure database permissions are correct
- Check cron job configuration

#### PDF Generation Fails
- Verify PDF service API key
- Check HTML template rendering
- Monitor function timeout limits
- Review storage permissions

#### Notifications Not Sending
- Verify email service configuration
- Check OneSignal API keys
- Review user notification preferences
- Monitor delivery logs

### Debug Commands

```bash
# Check function logs
supabase functions logs generate-monthly-reports

# Test database connection
supabase db ping

# Verify storage access
supabase storage ls reports
```

## 📚 API Reference

### Edge Functions

#### `generate-monthly-reports`
Generates monthly reports for properties.

**Request:**
```json
{
  "propertyId": "uuid",  // Optional: specific property
  "month": 12,           // Optional: specific month
  "year": 2024,          // Optional: specific year
  "single": true         // Optional: single property mode
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 5 reports successfully",
  "results": [...],
  "summary": {
    "total": 5,
    "successful": 5,
    "failed": 0
  }
}
```

#### `generate-report-pdf`
Generates PDF for a specific report.

#### `send-report-notifications`
Sends email and push notifications for a report.

### React Hooks

#### `useSupabaseReports`
```typescript
const {
  reports,
  loading,
  error,
  loadReports,
  generateReport,
  downloadReport,
  refreshReports
} = useSupabaseReports({ propertyId, autoLoad: true })
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
