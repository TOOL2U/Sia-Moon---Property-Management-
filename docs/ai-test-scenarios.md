# AI Test Scenarios - Sia Moon Property Management

This document outlines comprehensive test scenarios for the AI COO and AI CFO agents in the Sia Moon Property Management system. All tests run in **simulation mode** to ensure no real-world impact.

## 🧪 Overview

The AI simulation system provides safe testing of AI agents without affecting real data, staff assignments, or financial records. All tests are designed to validate AI decision-making logic, confidence scoring, and escalation triggers.

### ⚠️ Critical Requirements

- **Simulation Mode**: `SIMULATION_MODE = true` must be active
- **No Real Impact**: AI agents must not assign real staff or affect real data
- **Logging**: All actions logged to `/api/ai-log` with `simulate: true` flag
- **Safety**: Tests can be run repeatedly without consequences

---

## 🏢 AI COO Test Scenarios

The AI COO (Chief Operating Officer) handles booking requests, staff assignments, and operational decisions.

### Test Case 1: Standard Cleaning Booking
**ID**: `booking1`
**Expected Outcome**: ✅ Approve
**Expected Confidence**: 80%+

```json
{
  "bookingId": "B001",
  "location": "Haad Rin",
  "task": "Villa Cleaning",
  "price": 3500,
  "preferredDate": "2025-07-26",
  "staffNearby": [
    { "name": "Som", "distanceKm": 2.1, "available": true },
    { "name": "Noi", "distanceKm": 4.3, "available": false }
  ]
}
```

**Expected AI Response**:
- Decision: `approve`
- Assigned Staff: Som (closest available)
- Confidence: 85%+
- No escalation required

### Test Case 2: High-Value Escalation Booking
**ID**: `booking2`
**Expected Outcome**: ⚠️ Escalate
**Expected Confidence**: 70%+

```json
{
  "bookingId": "B002",
  "location": "Thong Sala",
  "task": "Deep Cleaning + Laundry",
  "price": 7400,
  "preferredDate": "2025-07-27",
  "staffNearby": [
    { "name": "Dao", "distanceKm": 3.0, "available": true }
  ]
}
```

**Expected AI Response**:
- Decision: `escalate`
- Reason: High value booking (>฿5000)
- Escalation: Admin approval required
- Confidence: 75%+

### Test Case 3: Pool Maintenance Booking
**ID**: `booking3`
**Expected Outcome**: ✅ Approve
**Expected Confidence**: 80%+

```json
{
  "bookingId": "B003",
  "location": "Thong Nai Pan",
  "task": "Pool Maintenance",
  "price": 2000,
  "preferredDate": "2025-07-28",
  "staffNearby": [
    { "name": "Lek", "distanceKm": 6.2, "available": true }
  ]
}
```

**Expected AI Response**:
- Decision: `approve` (if distance rules allow) or `escalate` (if >5km rule)
- Staff consideration: Lek at 6.2km
- Confidence: 70%+

### Test Case 4: Incomplete Data Booking
**ID**: `booking4`
**Expected Outcome**: ❌ Reject or ⚠️ Escalate
**Expected Confidence**: 50%+

```json
{
  "bookingId": "B004",
  "task": "Garden Clean",
  "price": 1800
}
```

**Expected AI Response**:
- Decision: `escalate` or `reject`
- Reason: Missing location and staff data
- Confidence: 50-60%
- Requires human review

### Test Case 5: Remote Staff Capability
**ID**: `booking5`
**Expected Outcome**: ⚠️ Escalate
**Expected Confidence**: 65%+

```json
{
  "bookingId": "B005",
  "location": "Chaloklum",
  "task": "Villa Painting",
  "price": 5200,
  "preferredDate": "2025-07-30",
  "staffNearby": [
    { "name": "Ton", "distanceKm": 7.5, "remoteCapable": true }
  ]
}
```

**Expected AI Response**:
- Decision: `escalate`
- Reason: High price + remote staff
- Dual rule conflict
- Confidence: 65%+

---

## 💰 AI CFO Test Scenarios

The AI CFO (Chief Financial Officer) analyzes financial data, detects anomalies, and provides insights.

### Test Case 6: Monthly Financial Analysis
**ID**: `cfo_analysis`
**Expected Outcome**: ✅ Analysis with Insights
**Expected Confidence**: 90%+

```json
{
  "spreadsheetId": "P&L_June.xlsx",
  "expenses": [
    {
      "date": "2024-06-01",
      "category": "Cleaning Supplies",
      "amount": 2500,
      "description": "Monthly cleaning supplies purchase"
    },
    {
      "date": "2024-06-02",
      "category": "Staff Wages",
      "amount": 15000,
      "description": "Weekly staff payments"
    },
    {
      "date": "2024-06-03",
      "category": "Property Maintenance",
      "amount": 8500,
      "description": "Villa repairs and maintenance"
    }
  ]
}
```

**Expected AI Response**:
- Analysis: Detailed financial breakdown
- Anomalies: Flag high maintenance cost (฿8500)
- Recommendations: Cost optimization suggestions
- Confidence: 90%+
- Risk Level: Medium (due to high maintenance)

---

## 🧪 How to Run Tests

### Using the AI Dashboard (Recommended)

1. Navigate to `/dashboard/ai`
2. Click on the **Simulation** tab
3. Use the test buttons:
   - **Test Booking 1**: Standard cleaning test
   - **Test Booking 2**: Escalation test
   - **Run CFO Test**: Financial analysis test

### Using Code (simulateAIActions.ts)

```typescript
import { runAIBookingTest, runAICFOTest } from '@/lib/ai/simulateAIActions'

// Run individual booking tests
const result1 = await runAIBookingTest("booking1")
const result2 = await runAIBookingTest("booking2")
const result3 = await runAIBookingTest("booking3")

// Run CFO test
const cfoResult = await runAICFOTest()

// Check results
console.log('Test Results:', { result1, result2, result3, cfoResult })
```

### Using API Directly

```bash
# Test AI COO
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "B001",
    "location": "Haad Rin",
    "task": "Villa Cleaning",
    "price": 3500,
    "simulate": true,
    "testMode": true
  }'

# Test AI CFO
curl -X POST http://localhost:3000/api/ai-cfo \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "P&L_June.xlsx",
    "expenses": [...],
    "simulate": true,
    "testMode": true
  }'
```

---

## 📊 Expected Test Results

### Success Criteria

- **Response Time**: < 5 seconds per test
- **Confidence Scores**: > 70% for clear decisions
- **Logging**: All actions logged with `simulate: true`
- **No Side Effects**: No real data modifications
- **Consistent Results**: Same input = same output

### Monitoring

- Check `/api/ai-log` for test entries
- Monitor AI Dashboard Decision Log
- Verify simulation mode indicators
- Confirm no real staff assignments

---

## 🔧 Troubleshooting

### Common Issues

1. **Tests Not Running**: Check `SIMULATION_MODE = true`
2. **No Responses**: Verify API endpoints are running
3. **Missing Logs**: Check `/api/ai-log` endpoint
4. **Real Actions**: Ensure `simulate: true` in payloads

### Debug Mode

Enable detailed logging by setting:
```bash
export AI_DEBUG_MODE=true
export NODE_ENV=development
```

---

## 📚 Reference Links

- **AI Dashboard**: `/dashboard/ai`
- **API Documentation**: `/docs/AI_System_API_Documentation.md`
- **Configuration**: `/src/lib/config.ts`
- **Test Implementation**: `/src/lib/ai/simulateAIActions.ts`

Logs will appear in your AI Dashboard under "Decision Logs".
Logs will appear in your AI Dashboard under "Decision Logs".
