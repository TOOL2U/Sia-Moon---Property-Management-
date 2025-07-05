-- Create a scheduled job to run monthly report generation on the 1st of each month at 2 AM UTC
-- This uses pg_cron extension in Supabase

-- Enable pg_cron extension if not already enabled
-- This needs to be run by a superuser in the Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the monthly report generation
-- Runs on the 1st of every month at 2:00 AM UTC
SELECT cron.schedule(
  'monthly-reports-generation',
  '0 2 1 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/generate-monthly-reports',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Alternative: Use Supabase Edge Function with HTTP trigger
-- You can also set up a webhook or use GitHub Actions to trigger this monthly

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the scheduled job (if needed):
-- SELECT cron.unschedule('monthly-reports-generation');
