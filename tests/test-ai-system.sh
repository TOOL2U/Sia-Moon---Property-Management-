#!/bin/bash

# AI System Test Script
# Run with: chmod +x tests/test-ai-system.sh && ./tests/test-ai-system.sh

BASE_URL="http://localhost:3000"
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        ((PASS_COUNT++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        ((FAIL_COUNT++))
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    fi
}

# Helper function to test HTTP endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5

    echo -e "\n${BLUE}🧪 Testing: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    # Extract HTTP status and body
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

    echo "📡 Request: $method $endpoint"
    echo "📊 Status: $http_status"
    echo "📄 Response: $body" | jq . 2>/dev/null || echo "📄 Response: $body"

    # Check if status matches expected
    if [ "$http_status" = "$expected_status" ]; then
        print_status "PASS" "$test_name - HTTP Status $http_status"
    else
        print_status "FAIL" "$test_name - Expected $expected_status, got $http_status"
    fi

    # Return the response for further validation
    echo "$body"
}

# Start testing
echo -e "${BLUE}🚀 Starting AI System Test Suite${NC}"
echo "=" | tr ' ' '=' | head -c 50; echo

# Test 1: AI COO Status
print_status "INFO" "Testing AI COO Status Endpoint"
coo_status=$(test_endpoint "GET" "/api/ai-coo" "" "200" "AI COO Status")

# Test 2: Valid Booking
print_status "INFO" "Testing Valid Booking Approval"
valid_booking='{
  "bookingId": "TEST001",
  "property": "Villa Mango",
  "location": { "lat": 9.7350, "lng": 100.0010 },
  "requestedDate": "2025-08-02",
  "guestNote": "Allergy-friendly bedding requested",
  "estimatedCost": 4800
}'
booking_response=$(test_endpoint "POST" "/api/ai-coo" "$valid_booking" "200" "Valid Booking")

# Validate booking response
if echo "$booking_response" | jq -e '.decision == "approved"' > /dev/null 2>&1; then
    print_status "PASS" "Booking decision is 'approved'"
else
    print_status "FAIL" "Booking decision is not 'approved'"
fi

if echo "$booking_response" | jq -e '.confidence > 85' > /dev/null 2>&1; then
    print_status "PASS" "Booking confidence > 85%"
else
    print_status "FAIL" "Booking confidence <= 85%"
fi

# Test 3: High-Value Booking (Should Escalate)
print_status "INFO" "Testing High-Value Booking (Should Escalate)"
high_value_booking='{
  "bookingId": "TEST002",
  "property": "Villa Lotus",
  "location": { "lat": 9.7311, "lng": 100.0023 },
  "requestedDate": "2025-08-05",
  "guestNote": "VIP guest - premium service required",
  "estimatedCost": 8500
}'
escalation_response=$(test_endpoint "POST" "/api/ai-coo" "$high_value_booking" "200" "High-Value Booking")

# Validate escalation
if echo "$escalation_response" | jq -e '.escalate == true' > /dev/null 2>&1; then
    print_status "PASS" "High-value booking escalated correctly"
else
    print_status "FAIL" "High-value booking not escalated"
fi

# Test 4: Malformed Booking
print_status "INFO" "Testing Malformed Booking (Missing Location)"
malformed_booking='{
  "bookingId": "TEST003",
  "property": "Villa Rose",
  "requestedDate": "2025-08-10",
  "guestNote": "Missing location data",
  "estimatedCost": 3200
}'
malformed_response=$(test_endpoint "POST" "/api/ai-coo" "$malformed_booking" "400" "Malformed Booking")

# Test 5: AI CFO Status
print_status "INFO" "Testing AI CFO Status Endpoint"
cfo_status=$(test_endpoint "GET" "/api/ai-cfo" "" "200" "AI CFO Status")

# Test 6: Valid Expenses
print_status "INFO" "Testing Valid Expense Analysis"
valid_expenses='{
  "month": "2025-07",
  "expenses": [
    { "label": "Electrician Repair", "amount": 6200 },
    { "label": "Fuel", "amount": 1600 },
    { "label": "Villa Cleaner", "amount": 1400 }
  ]
}'
expense_response=$(test_endpoint "POST" "/api/ai-cfo" "$valid_expenses" "200" "Valid Expenses")

# Validate expense response
if echo "$expense_response" | jq -e '.confidence > 90' > /dev/null 2>&1; then
    print_status "PASS" "Expense analysis confidence > 90%"
else
    print_status "FAIL" "Expense analysis confidence <= 90%"
fi

if echo "$expense_response" | jq -e '.escalate == true' > /dev/null 2>&1; then
    print_status "PASS" "High-value expense escalated correctly"
else
    print_status "FAIL" "High-value expense not escalated"
fi

# Test 7: Malformed Expenses
print_status "INFO" "Testing Malformed Expenses (Missing Month)"
malformed_expenses='{
  "expenses": [
    { "label": "Broken Test", "amount": 1000 }
  ]
}'
malformed_expense_response=$(test_endpoint "POST" "/api/ai-cfo" "$malformed_expenses" "400" "Malformed Expenses")

# Test 8: Policy Management
print_status "INFO" "Testing Policy Rule Addition"
new_policy='{
  "agent": "COO",
  "newRule": "Never approve bookings past 6 PM without human check.",
  "addedBy": "test-script"
}'
policy_response=$(test_endpoint "POST" "/api/ai-policy" "$new_policy" "200" "Policy Addition")

# Validate policy response
if echo "$policy_response" | jq -e '.ruleAdded == true' > /dev/null 2>&1; then
    print_status "PASS" "Policy rule added successfully"
else
    print_status "FAIL" "Policy rule not added"
fi

# Test 9: Policy Retrieval
print_status "INFO" "Testing Policy Rule Retrieval"
policy_list=$(test_endpoint "GET" "/api/ai-policy?agent=COO" "" "200" "Policy Retrieval")

# Test 10: AI Logging
print_status "INFO" "Testing AI Log Retrieval"
log_response=$(test_endpoint "GET" "/api/ai-log" "" "200" "AI Log Retrieval")

# Test 11: Manual Log Entry
print_status "INFO" "Testing Manual Log Entry"
test_log='{
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "agent": "COO",
  "decision": "Test log entry from bash script",
  "confidence": 95,
  "source": "auto",
  "escalation": false,
  "notes": "This is a test log entry from the bash test script"
}'
log_entry_response=$(test_endpoint "POST" "/api/ai-log" "$test_log" "200" "Manual Log Entry")

# Test Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "=" | tr ' ' '=' | head -c 50; echo
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo -e "📊 Total: $((PASS_COUNT + FAIL_COUNT))"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! AI System is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the AI System configuration.${NC}"
    exit 1
fi
