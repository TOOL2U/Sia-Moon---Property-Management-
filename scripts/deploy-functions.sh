#!/bin/bash

# Complete Supabase Setup Script for Villa Management System
# Make sure you have Supabase CLI installed and logged in

echo "🚀 Setting up Supabase for Villa Management System..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

echo "📊 Pushing database migrations..."
supabase db push

echo "📦 Deploying Edge Functions..."

# Deploy all functions
echo "📦 Deploying generate-monthly-reports function..."
supabase functions deploy generate-monthly-reports

echo "📄 Deploying generate-report-pdf function..."
supabase functions deploy generate-report-pdf

echo "📧 Deploying send-report-notifications function..."
supabase functions deploy send-report-notifications

echo "🔧 Setting up environment variables..."

# Get project reference
PROJECT_REF=$(supabase projects list --output json | jq -r '.[0].id' 2>/dev/null || echo "YOUR_PROJECT_REF")

echo ""
echo "✅ Database and functions deployed successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Set up environment variables in Supabase dashboard:"
echo "   Go to: https://app.supabase.com/project/$PROJECT_REF/settings/functions"
echo ""
echo "   Required environment variables:"
echo "   - EMAIL_SERVICE_URL=https://api.resend.com/emails"
echo "   - EMAIL_API_KEY=your_resend_api_key"
echo "   - ONESIGNAL_APP_ID=your_onesignal_app_id"
echo "   - ONESIGNAL_API_KEY=your_onesignal_rest_api_key"
echo "   - APP_URL=https://your-domain.com"
echo "   - PDF_API_KEY=your_pdf_service_key (optional)"
echo ""
echo "2. Update your .env.local file:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_REF.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
echo ""
echo "3. Test the setup:"
echo "   npm run test:supabase"
echo ""
echo "4. Set up monthly cron job (optional):"
echo "   Run the SQL in supabase/functions/generate-monthly-reports/cron.sql"
echo ""
echo "🔗 Useful links:"
echo "   Dashboard: https://app.supabase.com/project/$PROJECT_REF"
echo "   API Docs: https://app.supabase.com/project/$PROJECT_REF/api"
echo "   Functions: https://app.supabase.com/project/$PROJECT_REF/functions"
