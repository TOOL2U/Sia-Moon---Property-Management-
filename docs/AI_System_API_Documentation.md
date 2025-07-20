# 🤖 AI System API Documentation

Complete documentation for the Sia Moon AI System APIs and testing procedures.

---

## 📋 **API Endpoints Overview**

### **Core AI Agents**
- **`POST /api/ai-coo`** - AI COO booking decisions and staff assignments
- **`POST /api/ai-cfo`** - AI CFO financial analysis and anomaly detection
- **`POST /api/ai-log`** - Centralized AI decision logging
- **`POST /api/ai-policy`** - Dynamic rule management

### **Status & Monitoring**
- **`GET /api/ai-coo`** - AI COO agent status and capabilities
- **`GET /api/ai-cfo`** - AI CFO agent status and thresholds
- **`GET /api/ai-log`** - Retrieve AI decision logs
- **`GET /api/ai-policy`** - Get current policy rules

---

## 🤖 **AI COO API - Booking Decisions**

### **POST /api/ai-coo**

**Purpose**: Process booking requests through AI COO agent for approval/rejection and staff assignment.

**Request Format**:
```json
{
  "bookingId": "B001",
  "property": "Villa Lotus",
  "location": { "lat": 9.7311, "lng": 100.0023 },
  "requestedDate": "2025-07-28",
  "guestNote": "Wants sunset dinner setup",
  "estimatedCost": 6200
}
```

**Response Format**:
```json
{
  "success": true,
  "decision": "approved",
  "reason": "Booking approved. Closest staff available within 2km.",
  "confidence": 93,
  "escalate": false,
  "logs": [AILogEntry],
  "assignedStaff": {
    "id": "staff_001",
    "name": "Maria Santos",
    "eta": "25 minutes",
    "distance": 1.8
  }
}
```

**Business Rules**:
- Jobs >฿5000 automatically escalated for human approval
- Staff assignments optimized by geographic proximity
- Confidence <80% triggers escalation
- Past dates or same-day bookings rejected

### **GET /api/ai-coo**

**Purpose**: Get AI COO agent status and configuration.

**Response**:
```json
{
  "success": true,
  "agent": "COO",
  "status": "active",
  "simulationMode": true,
  "capabilities": [
    "Booking evaluation and approval",
    "Staff assignment optimization",
    "Rule-based decision making",
    "Confidence scoring and escalation"
  ],
  "rules": 5,
  "version": "1.0.0"
}
```

---

## 💰 **AI CFO API - Financial Analysis**

### **POST /api/ai-cfo**

**Purpose**: Analyze financial expenses through AI CFO agent for categorization and anomaly detection.

**Request Format**:
```json
{
  "month": "2025-07",
  "expenses": [
    { "label": "Laundry", "amount": 1400 },
    { "label": "Plumbing Emergency", "amount": 9200 },
    { "label": "Fuel", "amount": 1800 }
  ]
}
```

**Response Format**:
```json
{
  "success": true,
  "summary": {
    "Cleaning & Laundry": 1400,
    "Emergency Repairs": 9200,
    "Transportation": 1800
  },
  "anomalies": [
    "Plumbing Emergency exceeds ฿5000 (฿9200) — flag for manual review"
  ],
  "confidence": 98,
  "escalate": true,
  "totalAmount": 12400,
  "categoryBreakdown": {
    "Laundry": 1400,
    "Plumbing Emergency": 9200,
    "Fuel": 1800
  },
  "recommendations": [
    "High maintenance costs detected - investigate recurring issues"
  ],
  "logs": [AILogEntry]
}
```

**Business Rules**:
- Expenses >฿5000 automatically flagged for review
- Duplicate expenses detected and flagged
- Monthly totals >฿15000 trigger budget alerts
- Maintenance costs >฿8000 generate recommendations

### **GET /api/ai-cfo**

**Purpose**: Get AI CFO agent status and financial thresholds.

**Response**:
```json
{
  "success": true,
  "agent": "CFO",
  "status": "active",
  "simulationMode": true,
  "capabilities": [
    "Expense categorization and analysis",
    "Anomaly detection and flagging",
    "Financial pattern recognition",
    "Budget threshold monitoring",
    "Automated P&L insights"
  ],
  "thresholds": {
    "highValueFlag": 5000,
    "monthlyBudgetAlert": 15000,
    "maintenanceAlert": 8000
  },
  "version": "1.0.0"
}
```

---

## 📝 **AI Logging API**

### **POST /api/ai-log**

**Purpose**: Store AI decision logs for audit trail and dashboard visibility.

**Request Format**:
```json
{
  "timestamp": "2025-07-20T08:33:00Z",
  "agent": "COO",
  "decision": "Booking approved for Villa Lotus",
  "confidence": 92,
  "source": "auto",
  "escalation": false,
  "notes": "Closest staff found within 1.8km"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Log entry stored successfully",
  "logId": "coo_1721462000000_abc123",
  "timestamp": "2025-07-20T08:33:00Z"
}
```

### **GET /api/ai-log**

**Purpose**: Retrieve AI decision logs with filtering options.

**Query Parameters**:
- `agent` - Filter by agent type (COO/CFO)
- `escalation` - Filter by escalation status (true/false)
- `limit` - Number of logs to return (default: 50)
- `offset` - Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "logs": [AILogEntry],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25,
    "hasMore": false
  },
  "filters": {
    "agent": "COO",
    "escalation": "true"
  }
}
```

---

## 🔧 **AI Policy Management API**

### **POST /api/ai-policy**

**Purpose**: Add temporary rules for AI agents during live operations.

**Request Format**:
```json
{
  "agent": "COO",
  "newRule": "Never approve bookings past 6 PM without human check.",
  "addedBy": "admin",
  "temporary": true
}
```

**Response Format**:
```json
{
  "success": true,
  "status": "success",
  "ruleAdded": true,
  "ruleId": "rule_1721462000000_abc123",
  "message": "New rule added for AI COO",
  "rule": {
    "id": "rule_1721462000000_abc123",
    "agent": "COO",
    "rule": "Never approve bookings past 6 PM without human check.",
    "addedAt": "2025-07-20T08:33:00Z",
    "temporary": true
  }
}
```

### **GET /api/ai-policy**

**Purpose**: Retrieve current policy rules.

**Query Parameters**:
- `agent` - Filter by agent type (COO/CFO)
- `active` - Show only active rules (true/false)

**Response**:
```json
{
  "success": true,
  "rules": [
    {
      "id": "rule_1721462000000_abc123",
      "agent": "COO",
      "rule": "Never approve bookings past 6 PM without human check.",
      "addedAt": "2025-07-20T08:33:00Z",
      "addedBy": "admin",
      "active": true,
      "temporary": true
    }
  ],
  "total": 1,
  "filters": {
    "agent": "COO",
    "activeOnly": true
  }
}
```

### **DELETE /api/ai-policy**

**Purpose**: Deactivate policy rules.

**Query Parameters**:
- `ruleId` - Specific rule ID to deactivate
- `agent` - Deactivate all rules for specific agent

**Response**:
```json
{
  "success": true,
  "message": "1 rule(s) deactivated",
  "removedCount": 1
}
```

---

## 🧪 **Test Simulations**

### **Running Tests**

```bash
# Install dependencies (if needed)
npm install

# Run test suite
node tests/ai-system-tests.js

# Or run individual tests
node -e "require('./tests/ai-system-tests.js').testCOOBookings()"
```

### **Test Scenarios**

#### **1. Valid COO Booking Test**
```bash
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "TEST001",
    "property": "Villa Mango",
    "location": { "lat": 9.7350, "lng": 100.0010 },
    "requestedDate": "2025-08-02",
    "guestNote": "Allergy-friendly bedding requested",
    "estimatedCost": 4800
  }'
```

**Expected Results**:
- ✅ `"decision": "approved"`
- ✅ `"confidence" > 85`
- ✅ `"escalate": false`
- ✅ `logs` array returned

#### **2. High-Value Booking Test**
```bash
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "TEST002",
    "property": "Villa Lotus",
    "location": { "lat": 9.7311, "lng": 100.0023 },
    "requestedDate": "2025-08-05",
    "guestNote": "VIP guest - premium service required",
    "estimatedCost": 8500
  }'
```

**Expected Results**:
- ✅ `"escalate": true` (due to high cost)
- ✅ Confidence may be lower
- ✅ Reason mentions manual review required

#### **3. Valid CFO Expense Test**
```bash
curl -X POST http://localhost:3000/api/ai-cfo \
  -H "Content-Type: application/json" \
  -d '{
    "month": "2025-07",
    "expenses": [
      { "label": "Electrician Repair", "amount": 6200 },
      { "label": "Fuel", "amount": 1600 },
      { "label": "Villa Cleaner", "amount": 1400 }
    ]
  }'
```

**Expected Results**:
- ✅ `anomalies` should flag expense >฿5000
- ✅ `"confidence" > 90`
- ✅ `"escalate": true` for flagged items
- ✅ Proper expense categorization

#### **4. Malformed Data Test**
```bash
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "TEST003",
    "property": "Villa Rose",
    "requestedDate": "2025-08-10",
    "estimatedCost": 3200
  }'
```

**Expected Results**:
- ✅ HTTP 400 status
- ✅ `"escalate": true`
- ✅ Error details in response
- ✅ Log entry with rejection reason

#### **5. Policy Management Test**
```bash
curl -X POST http://localhost:3000/api/ai-policy \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "COO",
    "newRule": "Never approve bookings past 6 PM without human check."
  }'
```

**Expected Results**:
- ✅ `"ruleAdded": true`
- ✅ Unique `ruleId` returned
- ✅ Rule appears in GET /api/ai-policy

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**

```bash
# Basic Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Firebase (Optional - for persistent logging)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT=path/to/service-account.json

# MongoDB (Optional - alternative to Firebase)
MONGO_URI=mongodb://localhost:27017/ai_system
MONGO_DB_NAME=ai_system

# Development
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### **Database Schema**

#### **Firestore Collection: `ai_logs`**
```json
{
  "timestamp": "2025-07-20T08:33:00Z",
  "agent": "COO",
  "decision": "Booking approved for Villa Lotus",
  "confidence": 92,
  "source": "auto",
  "escalation": false,
  "notes": "Closest staff found within 1.8km",
  "logId": "coo_1721462000000_abc123",
  "createdAt": "2025-07-20T08:33:00Z",
  "processed": false
}
```

#### **MongoDB Collection: `ai_logs`**
Same schema as Firestore, stored as documents in MongoDB.

---

## 📊 **Dashboard Integration**

The AI System includes a comprehensive dashboard at `/backoffice/ai-dashboard` featuring:

- **Live AI Decisions Table** - Real-time monitoring of all AI decisions
- **Escalation Queue** - Manual review interface for escalated decisions
- **Analytics Sidebar** - Performance metrics and trends
- **Manual Controls** - Rule injection and policy management
- **Real-time Updates** - Auto-refresh every 15 seconds

---

## 🚀 **Production Deployment**

### **Pre-deployment Checklist**

1. ✅ Configure production database (Firestore/MongoDB)
2. ✅ Set up proper authentication for admin endpoints
3. ✅ Configure environment variables
4. ✅ Test all API endpoints with production data
5. ✅ Set up monitoring and alerting
6. ✅ Configure backup and disaster recovery

### **Monitoring & Alerts**

- Monitor escalation rates (should be <30%)
- Track average confidence scores (should be >80%)
- Alert on system errors or API failures
- Monitor database performance and storage

---

## 🔒 **Security Considerations**

- All admin endpoints require authentication
- Input validation on all API endpoints
- Rate limiting on AI decision endpoints
- Audit logging for all policy changes
- Secure database connections with encryption

---

## 📈 **Performance Optimization**

- Database indexing on timestamp and agent fields
- Caching for frequently accessed rules
- Async logging to prevent blocking
- Connection pooling for database operations
- CDN for static dashboard assets

---

## 🧪 **Quick Test Commands**

### **Test All Endpoints (Copy & Paste)**

```bash
# Test AI COO Status
curl -X GET http://localhost:3000/api/ai-coo

# Test Valid Booking
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"TEST001","property":"Villa Mango","location":{"lat":9.7350,"lng":100.0010},"requestedDate":"2025-08-02","guestNote":"Allergy-friendly bedding","estimatedCost":4800}'

# Test High-Value Booking (Should Escalate)
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"TEST002","property":"Villa Lotus","location":{"lat":9.7311,"lng":100.0023},"requestedDate":"2025-08-05","guestNote":"VIP guest","estimatedCost":8500}'

# Test AI CFO Status
curl -X GET http://localhost:3000/api/ai-cfo

# Test Valid Expenses
curl -X POST http://localhost:3000/api/ai-cfo \
  -H "Content-Type: application/json" \
  -d '{"month":"2025-07","expenses":[{"label":"Electrician Repair","amount":6200},{"label":"Fuel","amount":1600},{"label":"Villa Cleaner","amount":1400}]}'

# Test Policy Addition
curl -X POST http://localhost:3000/api/ai-policy \
  -H "Content-Type: application/json" \
  -d '{"agent":"COO","newRule":"Never approve bookings past 6 PM without human check."}'

# Test Policy Retrieval
curl -X GET http://localhost:3000/api/ai-policy

# Test Log Retrieval
curl -X GET http://localhost:3000/api/ai-log
```

---

## 🔧 **Enterprise-Grade Enhancements**

### **🎯 Confidence Threshold Control**

**Centralized Configuration**: All confidence thresholds are now managed in `AI_WebApp_DevTeam_Config.ts`:

```typescript
export const CONFIDENCE_THRESHOLD = 85; // Main threshold for auto-approval
export const HIGH_CONFIDENCE_THRESHOLD = 95; // For critical decisions
export const LOW_CONFIDENCE_THRESHOLD = 60; // Immediate escalation required
```

**Dynamic Control**: Change AI strictness system-wide by updating a single value. No need to edit multiple files.

**Usage**: Both AI COO and CFO now use `CONFIDENCE_THRESHOLD` instead of hardcoded values.

### **🚨 Escalation Alert System**

**Instant Notifications**: Admins are immediately notified when AI lacks confidence via multiple channels:

- **Telegram**: Real-time mobile alerts
- **Email**: HTML-formatted notifications via SendGrid
- **Webhook**: Custom integrations with external systems

**Configuration**: Set environment variables to enable notifications:

```bash
# Telegram Alerts
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Email Alerts
SENDGRID_API_KEY=your_sendgrid_key
NOTIFICATION_FROM_EMAIL=ai@siamoon.com
NOTIFICATION_TO_EMAILS=admin1@siamoon.com,admin2@siamoon.com

# Webhook Alerts
ESCALATION_WEBHOOK_URL=https://your-system.com/webhooks/ai-escalation
ESCALATION_WEBHOOK_SECRET=your_webhook_secret
```

**Smart Formatting**: Notifications include urgency indicators, confidence scores, and direct dashboard links.

### **💾 Enhanced Firestore Logging**

**Production-Ready**: Upgraded to Firebase Admin SDK for server-side operations:

```typescript
// Automatic database detection and initialization
await initializeAILogger()

// Persistent logging with fallback
await logAIDecision(logEntry) // Logs to Firestore + console
```

**Features**:
- **Automatic Fallback**: Console logging if database unavailable
- **Query Capabilities**: Filter logs by agent, confidence, date range
- **Audit Trail**: Complete searchable history of all AI decisions
- **Performance Optimized**: Async operations with connection pooling

### **📋 Rule Versioning System**

**Traceable Rules**: Every AI decision now tracks which rule versions were applied:

```typescript
interface CompanyRule {
  id: string          // R1, R2, R3...
  version: number     // 1, 2, 3...
  rule: string        // The actual rule text
  category: string    // booking, financial, staff, etc.
  active: boolean     // Enable/disable rules
  createdAt: string   // Creation timestamp
  updatedAt: string   // Last modification
}
```

**Version Tracking**: All logs now include rule versions:
```
"Applied rules: R1.v1, R3.v2, R5.v1"
```

**Benefits**:
- **Audit Compliance**: Know exactly which rules influenced each decision
- **Change Management**: Track rule evolution over time
- **Debugging**: Identify which rule versions caused issues
- **Rollback Capability**: Revert to previous rule versions if needed

---

## 🔒 **Production Environment Setup**

### **Required Environment Variables**

```bash
# Core Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
CONFIDENCE_THRESHOLD=85

# Firebase Admin (for persistent logging)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Notification System
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
SENDGRID_API_KEY=your_sendgrid_api_key
NOTIFICATION_FROM_EMAIL=ai-system@your-domain.com
NOTIFICATION_TO_EMAILS=admin@your-domain.com

# Optional: Webhook Integration
ESCALATION_WEBHOOK_URL=https://your-system.com/webhooks/ai-escalation
ESCALATION_WEBHOOK_SECRET=your_webhook_secret

# Optional: MongoDB (alternative to Firestore)
MONGO_URI=mongodb://your-mongo-connection-string
MONGO_DB_NAME=ai_system
```

### **Security Checklist**

- ✅ All admin endpoints protected by authentication middleware
- ✅ Input validation on all API endpoints
- ✅ Secure database connections with encryption
- ✅ Webhook signature verification
- ✅ Rate limiting ready for implementation
- ✅ Environment variable security
- ✅ Audit logging for all policy changes

---

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**

1. **Escalation Rate**: Should be <30% for healthy operation
2. **Average Confidence**: Should be >80% for reliable decisions
3. **Response Time**: API response times for performance monitoring
4. **Success Rate**: Percentage of successful AI decisions
5. **Rule Application**: Which rules are triggered most frequently

### **Alert Thresholds**

- **High Escalation Rate**: >40% escalations in 1 hour
- **Low Confidence**: Average confidence <70% over 30 minutes
- **System Errors**: >5 API errors in 10 minutes
- **Database Issues**: Connection failures or slow queries

---

## 🚀 **Deployment Checklist**

### **Pre-Production**
- [ ] Configure all environment variables
- [ ] Set up Firestore database with proper indexes
- [ ] Configure notification channels (Telegram/Email)
- [ ] Test all API endpoints with production data
- [ ] Verify authentication and authorization
- [ ] Set up monitoring and alerting

### **Production Launch**
- [ ] Deploy with SIMULATION_MODE=false for live decisions
- [ ] Monitor escalation rates closely
- [ ] Verify notification system is working
- [ ] Check database performance and storage
- [ ] Confirm backup and disaster recovery procedures

### **Post-Launch**
- [ ] Monitor system performance and user feedback
- [ ] Analyze AI decision patterns and accuracy
- [ ] Optimize confidence thresholds based on real data
- [ ] Update rules based on operational learnings
- [ ] Scale infrastructure as needed

This completes the comprehensive AI System documentation with enterprise-grade enhancements. The system is now fully operational and ready for production deployment! 🎉
