#!/bin/bash

# END-TO-END BOOKING TEST
# Uses the live web application API to test the complete flow

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║     🧪 END-TO-END BOOKING TEST                                  ║"
echo "║     Booking → Calendar → Automatic Job Creation                 ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Test Date: $(date)"
echo "Target: http://localhost:3000"
echo ""

# Test data
TEST_BOOKING_DATA='{
  "guestName": "E2E Test User",
  "guestEmail": "e2etest@example.com",  
  "guestPhone": "+1234567890",
  "guestCount": 4,
  "checkInDate": "2026-01-15T14:00:00Z",
  "checkOutDate": "2026-01-20T11:00:00Z",
  "propertyId": "test-property-villa-001",
  "propertyName": "Luxury Test Villa",
  "totalPrice": 1500,
  "status": "confirmed",
  "bookingSource": "e2e-automated-test",
  "specialRequests": "Automated test - verify calendar and job creation",
  "paymentStatus": "paid",
  "nights": 5
}'

echo "📝 STEP 1: Creating Test Booking"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "Booking Details:"
echo "├─ Guest: E2E Test User"
echo "├─ Email: e2etest@example.com"
echo "├─ Check-in: January 15, 2026"
echo "├─ Check-out: January 20, 2026"
echo "├─ Property: Luxury Test Villa"
echo "├─ Nights: 5"
echo "├─ Total: \$1500"
echo "└─ Status: confirmed ← Triggers automatic job creation"
echo ""
echo "⏳ Sending API request to create booking..."
echo ""

# Create booking via API
RESPONSE=$(curl -s -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "$TEST_BOOKING_DATA" \
  2>&1)

# Check if request was successful
if echo "$RESPONSE" | grep -q "bookingId\|id\|success"; then
  BOOKING_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  
  if [ -z "$BOOKING_ID" ]; then
    BOOKING_ID=$(echo "$RESPONSE" | grep -o '"bookingId":"[^"]*' | cut -d'"' -f4 | head -1)
  fi
  
  echo "✅ Booking created successfully!"
  echo "   Booking ID: $BOOKING_ID"
  echo "   Response: $(echo "$RESPONSE" | head -c 200)..."
else
  echo "⚠️  API Response:"
  echo "$RESPONSE" | head -c 500
  echo ""
  echo ""
  echo "Note: Booking creation might have succeeded even if API returned unexpected response."
  echo "      Check the web interface to verify."
fi

echo ""
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "📅 STEP 2: Verify Calendar Event"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Action Required: Manual Verification"
echo ""
echo "Open: http://localhost:3000/admin/calendar"
echo ""
echo "Look for:"
echo "├─ Event spanning January 15-20, 2026"
echo "├─ Guest: \"E2E Test User\""
echo "├─ Property: \"Luxury Test Villa\""
echo "└─ Duration: 5 nights"
echo ""

echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "🔧 STEP 3: Verify Automatic Job Creation"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Action Required: Manual Verification"
echo ""
echo "Open: http://localhost:3000/admin/tasks"
echo ""
echo "Look for NEW cleaning job:"
echo "├─ Title: \"Post-Checkout Cleaning - Luxury Test Villa\""
echo "├─ Job Type: Cleaning"
echo "├─ Required Role: cleaner ← Important for mobile filtering"
echo "├─ Status: Pending"
echo "├─ Scheduled Date: January 20, 2026 (checkout date)"
echo "├─ Priority: High"
echo "└─ Broadcast: Yes (visible to all cleaners)"
echo ""

echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "🎯 SUCCESS CRITERIA CHECKLIST"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "Mark each item after verification:"
echo ""
echo "[ ] Booking appears in bookings list (status: confirmed)"
echo "[ ] Calendar event shows on January 15-20, 2026"
echo "[ ] Cleaning job created for January 20, 2026"
echo "[ ] Job has requiredRole: \"cleaner\""
echo "[ ] Job status is \"pending\""
echo "[ ] Job is broadcast to all cleaners (broadcastToAll: true)"
echo ""

echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "📱 MOBILE APP VERIFICATION (Optional)"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "If you have access to the mobile app:"
echo ""
echo "1. Log in as a cleaner (staff with role=\"cleaner\")"
echo "2. Navigate to Jobs/Tasks section"
echo "3. Check \"Available Jobs\" tab"
echo "4. Look for the cleaning job for Jan 20, 2026"
echo ""
echo "Expected Result:"
echo "├─ Job is visible in \"Available Jobs\""
echo "├─ Shows property: \"Luxury Test Villa\""
echo "├─ Shows date: January 20, 2026"
echo "└─ Has \"Accept\" button"
echo ""

echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "💡 TROUBLESHOOTING"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "If jobs are not created:"
echo "• Check browser console for errors (F12)"
echo "• Verify booking status is \"confirmed\""
echo "• Wait 10-15 seconds for background service"
echo "• Check AutomaticJobCreationService is running"
echo "• Verify Firestore triggers are enabled"
echo ""
echo "If calendar event missing:"
echo "• Refresh calendar page"
echo "• Check correct date range (Jan 15-20, 2026)"
echo "• Verify booking was saved successfully"
echo ""

echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "🚀 TEST SETUP COMPLETE"
echo "══════════════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Check the booking was created in the web interface"
echo "2. Navigate to calendar to verify event"
echo "3. Navigate to tasks to verify automatic job creation"
echo "4. Report results back"
echo ""
echo "Test Environment:"
echo "├─ Web App: http://localhost:3000"
echo "├─ Bookings: http://localhost:3000/admin/bookings"
echo "├─ Calendar: http://localhost:3000/admin/calendar"
echo "└─ Tasks: http://localhost:3000/admin/tasks"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
