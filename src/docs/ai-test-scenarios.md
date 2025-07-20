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
  "jobType": "Cleaning",
  "address": "Villa Sunset, Phuket",
  "value": 3500,
  "customerType": "regular",
  "urgency": "normal",
  "specialRequirements": [],
  "duration": 4,
  "rooms": 3
}
```

**Test Logic**: Regular cleaning service within normal parameters should be approved automatically with high confidence.

**Expected Response**:
- `decision: "approve"`
- `confidence: >= 0.8`
- `escalate: false`
- `simulated: true`

---

### Test Case 2: High-Value Escalation Case
**ID**: `booking2`
**Expected Outcome**: ⚠️ Escalate
**Expected Confidence**: 60%

```json
{
  "jobType": "Deep Cleaning",
  "address": "Luxury Villa Paradise, Koh Samui",
  "value": 12000,
  "customerType": "premium",
  "urgency": "high",
  "specialRequirements": ["Pool cleaning", "Garden maintenance", "Window cleaning"],
  "duration": 8,
  "rooms": 6,
  "notes": "VIP client, requires special attention"
}
```

**Test Logic**: High-value booking with special requirements should trigger escalation for human review.

**Expected Response**:
- `decision: "escalate"`
- `confidence: ~0.6`
- `escalate: true`
- `reason: "High value booking requires human review"`

---

## 💰 AI CFO Test Scenarios

The AI CFO (Chief Financial Officer) analyzes expenses, approves payments, and monitors financial compliance.

### Test Case: Monthly Expense Analysis
**Expected Outcome**: ✅ Approve
**Expected Confidence**: 85%+

```json
{
  "expenses": [
    {
      "date": "2025-07-20",
      "category": "Cleaning Supplies",
      "amount": 2500,
      "description": "Monthly cleaning supplies purchase",
      "vendor": "CleanCorp Thailand",
      "receipt": "RCP-2025-001"
    },
    {
      "date": "2025-07-19",
      "category": "Staff Wages",
      "amount": 15000,
      "description": "Weekly staff payments",
      "vendor": "Internal Payroll",
      "receipt": "PAY-2025-W03"
    }
  ],
  "analysisType": "monthly_review",
  "period": "January 2025"
}
```

**Test Logic**: Standard business expenses with proper documentation should be approved with high confidence.

**Expected Response**:
- `summary: "Analyzed expenses totaling ฿17,500"`
- `confidence: >= 0.85`
- `escalate: false`
- `simulated: true`

---

## 🚀 How to Run Tests

### Method 1: AI Dashboard (Recommended)
1. Navigate to **AI Dashboard** → **Simulation Tab**
2. Click test buttons:
   - `Test Booking 1` - Standard cleaning
   - `Test Booking 2 (Escalation)` - High-value case
   - `Run CFO Test` - Financial analysis
3. View results in browser console and decision logs

### Method 2: API Testing
```bash
# Test AI COO
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{"jobType":"Cleaning","address":"Test Villa","value":3500}'

# Test AI CFO
curl -X POST http://localhost:3000/api/ai-cfo \
  -H "Content-Type: application/json" \
  -d '{"expenses":[{"date":"2025-07-20","category":"Test","amount":2500}]}'
```

---

## 📊 Expected Results Summary

| Test Case | Agent | Expected Decision | Confidence | Escalate | Notes |
|-----------|-------|------------------|------------|----------|-------|
| booking1 | COO | approve | 80%+ | No | Standard cleaning |
| booking2 | COO | escalate | ~60% | Yes | High-value, special requirements |
| CFO Test | CFO | approve | 85%+ | No | Standard business expenses |

---

## 🔍 Validation Checklist

After running tests, verify:

- ✅ **Simulation Flag**: All responses include `"simulated": true`
- ✅ **No Real Impact**: No actual staff assignments or database changes
- ✅ **Confidence Scores**: Within expected ranges
- ✅ **Escalation Logic**: High-value/emergency cases escalate properly
- ✅ **Logging**: All tests logged to AI decision system
- ✅ **Performance**: Response times under 2 seconds

---

*Last Updated: July 2025*
*Version: 1.0*
*Maintained by: Sia Moon Development Team*
