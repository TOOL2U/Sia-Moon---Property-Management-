# 🚀 Deploying the Booking Test Webhook to Vercel

## Overview

This guide explains how to deploy your booking test webhook to your Vercel-hosted domain at:
https://sia-moon-property-management-1qbste8lq-tool2us-projects.vercel.app/

## Deployment Steps

### 1. Commit Your Changes

First, commit the new webhook endpoint and test files to your repository:

```bash
# Add the new files
git add src/app/api/booking-test/route.ts
git add src/app/test-booking-trigger/page.tsx
git add trigger-test-booking.js
git add BOOKING_TEST_WEBHOOK.md

# Commit with a descriptive message
git commit -m "Add booking test webhook endpoint and test triggers"

# Push to your repository
git push origin main
```

### 2. Automatic Deployment

If you have automatic deployments set up with Vercel, your changes will be deployed automatically when you push to your repository. Wait for the deployment to complete.

### 3. Manual Deployment (if needed)

If automatic deployments are not set up, you can deploy manually:

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel
```

### 4. Verify Deployment

After deployment, verify that your webhook endpoint is accessible:

1. **Check the endpoint documentation**:
   - Visit: https://sia-moon-property-management-1qbste8lq-tool2us-projects.vercel.app/api/booking-test
   - You should see the JSON documentation response

2. **Check the test interface**:
   - Visit: https://sia-moon-property-management-1qbste8lq-tool2us-projects.vercel.app/test-booking-trigger
   - You should see the test interface with booking scenarios

### 5. Update Test Script (if needed)

If you need to test against your production domain, update the BASE_URL in your test script:

```bash
# Test against production
TEST_URL=https://sia-moon-property-management-1qbste8lq-tool2us-projects.vercel.app node trigger-test-booking.js single 0
```

## Make.com Integration

Once deployed, you can configure Make.com to send data to your webhook:

1. **In Make.com**:
   - Create a new scenario or edit an existing one
   - Add an HTTP module with these settings:
     - URL: `https://sia-moon-property-management-1qbste8lq-tool2us-projects.vercel.app/api/booking-test`
     - Method: `POST`
     - Headers: `Content-Type: application/json`
     - Body: JSON payload with parsed booking data

2. **Test the integration**:
   - Run your Make.com scenario with test data
   - Check the Vercel logs for request details
   - Verify the response in Make.com

## Monitoring Logs

To monitor incoming webhook requests:

1. **Vercel Dashboard**:
   - Go to your project in the Vercel dashboard
   - Navigate to "Functions" tab
   - Find the `/api/booking-test` function
   - Check the logs for request details

2. **Firebase Console** (if Firebase storage is enabled):
   - Go to your Firebase console
   - Navigate to Firestore Database
   - Check the `booking_test_logs` collection for stored payloads

## Troubleshooting

If you encounter issues:

1. **Check Vercel Logs**:
   - Look for error messages in the function logs
   - Verify that the function is being called

2. **Test Locally First**:
   - Run `npm run dev` to start your local development server
   - Test with `http://localhost:3000/api/booking-test`
   - Fix any issues before deploying

3. **CORS Issues**:
   - If Make.com has CORS issues, verify the OPTIONS handler in your route.ts file
   - Check that the CORS headers are being set correctly

4. **Firebase Connection**:
   - If Firebase storage fails, check your Firebase configuration
   - Verify that the service account has the correct permissions

## Next Steps

After successful deployment and testing:

1. **Refine Data Structure**:
   - Analyze the actual data coming from Make.com
   - Adjust the webhook to handle any unexpected fields

2. **Enhance Validation**:
   - Add more robust validation for production use
   - Implement business rules specific to your booking process

3. **Add Authentication**:
   - Implement API key or webhook signature validation
   - Restrict access to authorized sources only

4. **Migrate to Production**:
   - Create a production endpoint at `/api/bookings`
   - Implement full booking creation logic
   - Connect to your booking management system

## Support

If you need help with deployment or integration:

1. **Vercel Documentation**:
   - https://vercel.com/docs

2. **Make.com Documentation**:
   - https://www.make.com/en/help/tools/http

3. **Firebase Documentation**:
   - https://firebase.google.com/docs/firestore
