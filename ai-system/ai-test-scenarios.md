# 🧪 AI System Test Scenarios

## Overview
Comprehensive test scenarios for validating AI COO and AI CFO functionality in simulation mode.

---

## 🤖 AI COO Test Scenarios

### Scenario 1: Standard Booking Approval
**Input:**
```json
{
  "address": "123 Beach Road, Tambon Bo Phut, Koh Samui, Surat Thani 84320",
  "jobType": "cleaning",
  "value": 2500,
  "customerType": "standard",
  "scheduledDate": "2025-07-21T10:00:00Z",
  "customerName": "John Smith",
  "contactInfo": "+66 81 234 5678"
}
```

**Expected Result:**
- Decision: `approved`
- Confidence: >80%
- Assigned staff with ETA
- Cost estimation within range

### Scenario 2: High-Value Job Escalation
**Input:**
```json
{
  "address": "456 Luxury Villa, Tambon Maenam, Koh Samui",
  "jobType": "deep-clean",
  "value": 8500,
  "customerType": "vip",
  "urgent": true,
  "notes": "Post-event cleanup, requires special attention"
}
```

**Expected Result:**
- Decision: `approved` but flagged
- Confidence: 60-75% (reduced due to high value)
- Escalate: `true`
- VIP staff assignment

### Scenario 3: Incomplete Data Rejection
**Input:**
```json
{
  "jobType": "maintenance",
  "value": 1500,
  "customerName": "Jane Doe"
}
```

**Expected Result:**
- Decision: `rejected`
- Reason: "Missing required address information"
- Confidence: >90%
- Escalate: `false`

### Scenario 4: Distance-Based Staff Assignment
**Input:**
```json
{
  "address": "789 Remote Villa, Tambon Taling Ngam, Koh Samui",
  "jobType": "pool-cleaning",
  "value": 1800,
  "customerType": "premium"
}
```

**Expected Result:**
- Check staff within 5km radius
- If none available, either reject or assign remote-capable staff
- Clear distance/ETA calculations

### Scenario 5: VIP Customer Priority
**Input:**
```json
{
  "address": "321 Beachfront Resort, Chaweng Beach, Koh Samui",
  "jobType": "organizing",
  "value": 3200,
  "customerType": "vip",
  "scheduledDate": "2025-07-21T14:00:00Z"
}
```

**Expected Result:**
- Highest-rated staff assignment
- Priority scheduling
- Enhanced service notes

---

## 💰 AI CFO Test Scenarios

### Scenario 1: Standard Expense Approval
**Input:**
```json
{
  "expenses": [
    {
      "amount": 850,
      "category": "cleaning_supplies",
      "vendor": "Thai Cleaning Co.",
      "description": "Monthly cleaning supplies restock",
      "receipt": "receipt_001.pdf",
      "date": "2025-07-20"
    }
  ]
}
```

**Expected Result:**
- Decision: `approved`
- Confidence: >90%
- Category: `property_operations`
- Budget impact analysis

### Scenario 2: High-Value Expense Flagging
**Input:**
```json
{
  "expenses": [
    {
      "amount": 15000,
      "category": "maintenance",
      "vendor": "Island Repairs Ltd.",
      "description": "Emergency air conditioning system replacement",
      "receipt": "receipt_002.pdf",
      "date": "2025-07-20"
    }
  ]
}
```

**Expected Result:**
- Decision: `flagged`
- Confidence: 60-75%
- Escalate: `true`
- Detailed justification required

### Scenario 3: Anomaly Detection
**Input:**
```json
{
  "expenses": [
    {
      "amount": 5000,
      "category": "office_supplies",
      "vendor": "Office Mart",
      "description": "Office supplies",
      "date": "2025-07-20T23:45:00Z"
    }
  ]
}
```

**Expected Result:**
- Flag unusual timing (late night)
- Flag amount vs category mismatch
- Request additional documentation

### Scenario 4: Duplicate Payment Detection
**Input:**
```json
{
  "expenses": [
    {
      "amount": 2500,
      "category": "utilities",
      "vendor": "Samui Electric Co.",
      "description": "Monthly electricity bill",
      "date": "2025-07-20"
    },
    {
      "amount": 2500,
      "category": "utilities", 
      "vendor": "Samui Electric Co.",
      "description": "Electricity payment",
      "date": "2025-07-20"
    }
  ]
}
```

**Expected Result:**
- Flag potential duplicate
- Request verification
- Hold second payment

### Scenario 5: Budget Variance Analysis
**Input:**
```json
{
  "period": "2025-07",
  "expenses": [
    {
      "category": "marketing",
      "totalSpent": 35000,
      "budget": 20000
    },
    {
      "category": "maintenance",
      "totalSpent": 18000,
      "budget": 25000
    }
  ]
}
```

**Expected Result:**
- Flag marketing overspend (+75%)
- Note maintenance underspend (-28%)
- Provide variance analysis
- Recommend budget adjustments

---

## 🔄 Integration Test Scenarios

### Scenario 1: End-to-End Booking Flow
1. **COO**: Approve booking and assign staff
2. **CFO**: Process related expenses (travel, supplies)
3. **Logging**: Track all decisions and actions
4. **Dashboard**: Display real-time updates

### Scenario 2: Escalation Workflow
1. **COO**: Flag high-value booking for review
2. **System**: Send escalation notification
3. **Admin**: Review and override decision
4. **Logging**: Record human intervention

### Scenario 3: Financial Reporting Chain
1. **CFO**: Process monthly expenses
2. **System**: Generate financial reports
3. **Dashboard**: Display KPIs and trends
4. **Alerts**: Flag budget variances

---

## 📊 Test Validation Criteria

### AI COO Success Metrics
- ✅ Booking approval rate: 70-85%
- ✅ Staff assignment accuracy: >90%
- ✅ Distance calculations: Within 10% of actual
- ✅ Response time: <2 seconds
- ✅ Escalation rate: 10-20%

### AI CFO Success Metrics
- ✅ Expense categorization: >95% accuracy
- ✅ Anomaly detection: <5% false positives
- ✅ Budget variance tracking: Real-time updates
- ✅ Approval processing: <1 second
- ✅ Fraud detection: 100% of test cases

### System Integration Metrics
- ✅ API response time: <500ms
- ✅ Logging completeness: 100% of actions
- ✅ Dashboard updates: <30 seconds
- ✅ Error handling: Graceful degradation
- ✅ Data consistency: Cross-system validation

---

## 🎯 Test Execution Commands

### Manual Testing
```bash
# Test AI COO booking approval
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{"address":"123 Test St","jobType":"cleaning","value":2500}'

# Test AI CFO expense analysis
curl -X POST http://localhost:3000/api/ai-cfo \
  -H "Content-Type: application/json" \
  -d '{"expenses":[{"amount":850,"category":"supplies"}]}'

# Check AI logs
curl http://localhost:3000/api/ai-log

# Verify system status
curl http://localhost:3000/api/ai-coo
curl http://localhost:3000/api/ai-cfo
```

### Automated Testing
```javascript
// Run comprehensive test suite
npm run test:ai-system

// Run specific agent tests
npm run test:ai-coo
npm run test:ai-cfo

// Run integration tests
npm run test:ai-integration
```

---

## 🚀 Ready for Testing

All test scenarios are configured for `SIMULATION_MODE = true`. The system will:
- Use realistic Thai business data
- Generate plausible staff assignments
- Simulate financial transactions
- Provide detailed logging and analysis
- Enable safe testing without real-world impact

**Execute tests systematically and validate all success criteria before production deployment.**
