# Comprehensive Supabase Setup Guide for Villa Management System

## ✅ **Current Status**

### **Completed Steps:**
- ✅ Supabase project linked (`alkogpgjxpshoqsfgqef`)
- ✅ Edge Functions deployed:
  - `generate-monthly-reports`
  - `generate-report-pdf` 
  - `send-report-notifications`
- ✅ Database schema created
- ✅ Storage buckets configured
- ✅ Authentication system set up
- ✅ Database schema files created
- ✅ Manual setup SQL script ready

### **Next Steps Required:**
- ⬜ Add Profile Creation Trigger
- ⬜ Test full user authentication flow
- ⬜ Verify webhook integrations

## 1. **Database Schema Setup**

Since the automated migration had conflicts with existing tables, you need to run the manual setup:

### Option A: Via Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/sql
2. Copy the contents of `supabase/manual_setup.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute the setup

### Option B: Via CLI (if you have database password)
```bash
supabase db reset --db-url "postgresql://postgres:[PASSWORD]@db.alkogpgjxpshoqsfgqef.supabase.co:5432/postgres"
```

## 2. **Environment Variables Setup**

### Update your `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://alkogpgjxpshoqsfgqef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Get these keys from: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/settings/api
```

### Set Edge Function Environment Variables:
Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/functions

Add these environment variables:
```env
EMAIL_SERVICE_URL=https://api.resend.com/emails
EMAIL_API_KEY=your_resend_api_key
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_rest_api_key
APP_URL=https://your-domain.com
PDF_API_KEY=your_pdf_service_key (optional)
```

## 3. **Row Level Security (RLS) Setup**

The manual setup script includes RLS policies, but verify they're enabled:

1. Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/auth/policies
2. Ensure all tables have RLS enabled
3. Verify policies are created for each table

## 4. **Storage Setup**

Verify storage buckets are created:
1. Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/storage/buckets
2. Should see buckets: `reports`, `property-images`, `avatars`
3. Verify bucket policies for public access

## 5. **Authentication Setup**

Configure authentication settings:
1. Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/auth/settings
2. Set Site URL: `http://localhost:3001` (development) or your production URL
3. Add redirect URLs if needed
4. Configure email templates (optional)

## 6. **Test the Setup**

### Test Edge Functions:
```bash
# Test report generation
curl -X POST 'https://alkogpgjxpshoqsfgqef.supabase.co/functions/v1/generate-monthly-reports' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Test PDF generation
curl -X POST 'https://alkogpgjxpshoqsfgqef.supabase.co/functions/v1/generate-report-pdf' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"property": {"id": "test", "name": "Test Property"}, "reportData": {"month": 12, "year": 2024}}'
```

### Test Database Connection:
```bash
npm run test:supabase
```

## 7. **Monthly Automation Setup (Optional)**

### Option A: Supabase Cron (if available)
Run this SQL in the Supabase SQL Editor:
```sql
SELECT cron.schedule(
  'monthly-reports-generation',
  '0 2 1 * *',  -- 2 AM UTC on 1st of every month
  $$
  SELECT net.http_post(
    url := 'https://alkogpgjxpshoqsfgqef.supabase.co/functions/v1/generate-monthly-reports',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Option B: GitHub Actions
Create `.github/workflows/monthly-reports.yml`:
```yaml
name: Generate Monthly Reports
on:
  schedule:
    - cron: '0 2 1 * *'  # 2 AM UTC on 1st of every month
  workflow_dispatch:

jobs:
  generate-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Reports
        run: |
          curl -X POST 'https://alkogpgjxpshoqsfgqef.supabase.co/functions/v1/generate-monthly-reports' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

## 8. **Update Application Code**

### Create Supabase Hook:
```typescript
// src/hooks/useSupabase.ts
import { createSupabaseComponentClient } from '@/lib/supabase'

export function useSupabase() {
  return createSupabaseComponentClient()
}
```

### Update Reports Hook:
Update `src/hooks/useSupabaseReports.ts` to use the real Supabase client instead of local database.

## 9. **Verification Checklist**

- [ ] Database schema created successfully
- [ ] All tables have proper RLS policies
- [ ] Storage buckets created with correct policies
- [ ] Edge Functions deployed and accessible
- [ ] Environment variables set in Supabase dashboard
- [ ] Authentication configured
- [ ] Test functions work correctly
- [ ] Application connects to Supabase successfully

## 10. **Useful Links**

- **Project Dashboard**: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef
- **API Documentation**: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/api
- **Edge Functions**: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/functions
- **Database**: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/editor
- **Storage**: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/storage/buckets
- **Authentication**: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/auth/users

## 11. **Troubleshooting**

### Common Issues:

**Edge Functions not working:**
- Check environment variables are set
- Verify function logs in dashboard
- Ensure proper authentication headers

**Database connection issues:**
- Verify API keys in .env.local
- Check RLS policies
- Ensure user has proper permissions

**Storage issues:**
- Verify bucket policies
- Check file upload permissions
- Ensure bucket names match code

### Getting Help:
- Check function logs: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/functions
- View database logs: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/logs
- Supabase documentation: https://supabase.com/docs

## 12. **Add Profile Creation Trigger**

To ensure user profiles are automatically created when a new user signs up, add this trigger via the SQL Editor:

```sql
-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the function after a new user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Verify the trigger was created
select * from pg_triggers where tgname = 'on_auth_user_created';
```

You can find this SQL in the `add-profile-trigger.sql` file.

## 13. **Testing Authentication Flow**

After adding the trigger, verify the full authentication flow:

1. Run the test scripts:
   ```bash
   node test-supabase.js
   node test-profile-creation.js
   ```

2. Create a new user through the application interface:
   - Visit `/auth/signup`
   - Fill out the form and submit
   - Verify you're redirected to the dashboard

3. Check in Supabase that:
   - The user exists in `auth.users`
   - A matching profile exists in `public.profiles`

## 14. **Next Steps After Setup**

1. **Test the complete system** using `/test-supabase-reports`
2. **Create sample data** for testing
3. **Configure email service** (Resend, SendGrid, etc.)
4. **Set up OneSignal** for push notifications
5. **Deploy to production** with proper environment variables

---

**The Supabase infrastructure is now ready for your villa management system!** 🚀
