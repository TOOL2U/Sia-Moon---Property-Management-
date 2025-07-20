# 🧠 AI Integration Guide for Sia Moon WebApp

## Overview
This system introduces two AI Agents that automate property management operations:
- **AI COO**: Manages bookings, staff assignment, and scheduling decisions
- **AI CFO**: Handles financial analysis, expense categorization, and anomaly detection

Both agents operate with human oversight through confidence scoring and escalation systems.

---

## 📁 Files & Structure

```
src/
├── ai-system/
│   ├── AI_Integration_Guide.md          ← This master file
│   ├── AI_WebApp_DevTeam_Config.ts      ← Core configuration & rules
│   └── aiDevHelper.ts                   ← Development testing utility
├── middleware/
│   └── aiLogger.ts                      ← Centralized logging system
├── lib/
│   └── escalationNotifier.ts            ← Multi-channel alert system
├── app/api/
│   ├── ai-coo/route.ts                  ← AI COO booking decisions
│   ├── ai-cfo/route.ts                  ← AI CFO financial analysis
│   ├── ai-log/route.ts                  ← Centralized log storage
│   └── ai-policy/route.ts               ← Dynamic rule management
├── components/admin/
│   ├── AIDecisionsTable.tsx             ← Live decisions monitoring
│   ├── AIAnalyticsSidebar.tsx           ← Performance analytics
│   └── AIEscalationQueue.tsx            ← Manual review interface
└── app/backoffice/ai-dashboard/
    └── page.tsx                         ← Main AI operations dashboard
```

---

## ✅ Implementation Status (Prompts 1-15)

### **Core System (P1-P5)**
✅ **P1**: API `/api/ai-coo` - Booking decisions and staff assignment  
✅ **P2**: API `/api/ai-cfo` - Financial analysis and anomaly detection  
✅ **P3**: API `/api/ai-log` - Centralized decision logging  
✅ **P4**: AI system prompts - COO and CFO behavioral definitions  
✅ **P5**: Shared AI config - Centralized rules and settings  

### **Data Processing (P6-P8)**
✅ **P6**: Booking intake + processing - Complete booking workflow  
✅ **P7**: Expense analysis - Financial categorization and alerts  
✅ **P8**: Dashboard + feedback - Real-time monitoring interface  

### **Enterprise Features (P9-P12)**
✅ **P9**: Confidence threshold control - Dynamic AI strictness  
✅ **P10**: Escalation notifications - Multi-channel alerts  
✅ **P11**: Firestore logging - Persistent audit trail  
✅ **P12**: Rule versioning - Traceable business rules  

### **Developer Tools (P13-P15)**
✅ **P13**: Integration guide - This comprehensive documentation  
✅ **P14**: Dev testing utility - Local simulation tools  
✅ **P15**: .gitignore exclusions - Clean production deploys  

---

## 🔧 Configuration Snippet

```typescript
// Core AI Configuration
export const CONFIDENCE_THRESHOLD = 85;        // Auto-approval threshold
export const HIGH_CONFIDENCE_THRESHOLD = 95;   // Critical decisions
export const LOW_CONFIDENCE_THRESHOLD = 60;    // Immediate escalation

// Versioned Company Rules
export const COMPANY_RULES: CompanyRule[] = [
  {
    id: "R1", version: 1,
    rule: "Do not assign jobs to staff more than 5km away unless marked 'remote-capable'.",
    category: 'staff', active: true
  },
  {
    id: "R2", version: 1, 
    rule: "Always assign the staff member with the shortest ETA unless otherwise overridden.",
    category: 'staff', active: true
  },
  {
    id: "R3", version: 1,
    rule: "Jobs over ฿5000 must be flagged for human approval.",
    category: 'booking', active: true
  }
];

// API Routes Configuration
export const API_ROUTES = [
  { route: "/api/ai-coo", method: "POST", purpose: "Handle COO decisions" },
  { route: "/api/ai-cfo", method: "POST", purpose: "Handle CFO analysis" },
  { route: "/api/ai-log", method: "POST", purpose: "Store AI logs" },
  { route: "/api/ai-policy", method: "POST", purpose: "Manage rules" }
];
```

---

## 📊 AI Log Format (TypeScript)

```typescript
interface AILogEntry {
  timestamp: string;           // ISO 8601 timestamp
  agent: "COO" | "CFO";       // Which AI agent made the decision
  decision: string;           // Human-readable decision description
  confidence: number;         // 0-100 confidence score
  source: "auto" | "manual";  // Decision source
  escalation: boolean;        // Whether human review is required
  notes?: string;             // Additional context and rule versions
}

// Example log entry
const logEntry: AILogEntry = {
  timestamp: "2025-07-20T14:30:00Z",
  agent: "COO",
  decision: "APPROVED: Booking for Villa Lotus assigned to Maria Santos",
  confidence: 92,
  source: "auto",
  escalation: false,
  notes: "Booking: BKG-001, Cost: ฿4800, Property: Villa Lotus. Applied rules: R1.v1, R2.v1, R3.v1"
};
```

---

## 🧪 Sample Simulation Payloads

### **AI COO Booking Input**
```json
{
  "bookingId": "BKG-102",
  "property": "Villa Breeze",
  "location": { "lat": 9.7350, "lng": 100.0010 },
  "requestedDate": "2025-07-25",
  "guestNote": "Deep cleaning required",
  "estimatedCost": 4200
}
```

### **AI COO Expected Response**
```json
{
  "success": true,
  "decision": "approved",
  "reason": "Booking approved. Closest staff available within 2km.",
  "confidence": 89,
  "escalate": false,
  "assignedStaff": {
    "id": "staff_001",
    "name": "Maria Santos",
    "eta": "25 minutes",
    "distance": 1.8
  },
  "logs": [AILogEntry]
}
```

### **AI CFO Expense Input**
```json
{
  "month": "2025-07",
  "expenses": [
    { "label": "Pool Cleaner", "amount": 3500 },
    { "label": "Emergency Plumber", "amount": 7200 },
    { "label": "Fuel", "amount": 680 }
  ]
}
```

### **AI CFO Expected Response**
```json
{
  "success": true,
  "summary": {
    "Maintenance & Repairs": 10700,
    "Transportation": 680
  },
  "anomalies": [
    "Emergency Plumber exceeds ฿5000 (฿7200) — flag for manual review"
  ],
  "confidence": 94,
  "escalate": true,
  "totalAmount": 11380,
  "recommendations": [
    "High maintenance costs detected - investigate recurring issues"
  ]
}
```

---

## 🚀 Quick Start Guide

### **1. Environment Setup**
```bash
# Core Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONFIDENCE_THRESHOLD=85
SIMULATION_MODE=true

# Firebase (Persistent Logging)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Notifications (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
SENDGRID_API_KEY=your_sendgrid_key
NOTIFICATION_FROM_EMAIL=ai@siamoon.com
NOTIFICATION_TO_EMAILS=admin@siamoon.com
```

### **2. Test the System**
```bash
# Run the development server
npm run dev

# Test AI COO endpoint
curl -X POST http://localhost:3000/api/ai-coo \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"TEST001","property":"Villa Test","location":{"lat":9.7350,"lng":100.0010},"requestedDate":"2025-08-01","estimatedCost":4000}'

# Test AI CFO endpoint  
curl -X POST http://localhost:3000/api/ai-cfo \
  -H "Content-Type: application/json" \
  -d '{"month":"2025-07","expenses":[{"label":"Test Expense","amount":3000}]}'

# View the dashboard
open http://localhost:3000/backoffice/ai-dashboard
```

### **3. Run Test Suite**
```bash
# JavaScript test suite
node tests/ai-system-tests.js

# Bash test script
chmod +x tests/test-ai-system.sh
./tests/test-ai-system.sh
```

---

## 🔧 Development Workflow

### **Adding New Rules**
1. Update `COMPANY_RULES` in `AI_WebApp_DevTeam_Config.ts`
2. Increment version number for modified rules
3. Test with simulation data
4. Deploy and monitor escalation rates

### **Adjusting AI Behavior**
1. Modify `CONFIDENCE_THRESHOLD` for system-wide changes
2. Update agent prompts in `AI_WebApp_DevTeam_Config.ts`
3. Test with various confidence scenarios
4. Monitor dashboard for performance impact

### **Adding New Notification Channels**
1. Extend `escalationNotifier.ts` with new channel
2. Add environment variables for configuration
3. Test notification delivery
4. Update documentation

---

## 📊 Monitoring & Maintenance

### **Key Metrics**
- **Escalation Rate**: Should be <30% for healthy operation
- **Average Confidence**: Should be >80% for reliable decisions  
- **Response Time**: API calls should complete <2 seconds
- **Success Rate**: >99% successful API responses

### **Dashboard Access**
- **URL**: `/backoffice/ai-dashboard`
- **Features**: Live decisions, escalation queue, analytics, manual controls
- **Updates**: Auto-refresh every 15 seconds

### **Log Analysis**
- **Storage**: Firestore collection `ai_logs`
- **Retention**: Configurable (default: unlimited)
- **Queries**: Filter by agent, confidence, escalation, date range

---

## 🔒 Security & Compliance

### **Authentication**
- All admin endpoints protected by middleware
- Dashboard requires valid authentication
- API endpoints validate input data

### **Audit Trail**
- Every AI decision logged with timestamp
- Rule versions tracked in all decisions
- Complete escalation history maintained
- Searchable and filterable logs

### **Data Privacy**
- No sensitive guest data stored in logs
- Booking IDs used for reference only
- Financial data aggregated and anonymized

---

## 🎯 Production Deployment

### **Pre-Deployment Checklist**
- [ ] Set `SIMULATION_MODE=false`
- [ ] Configure production database
- [ ] Set up notification channels
- [ ] Test all API endpoints
- [ ] Verify authentication system
- [ ] Configure monitoring alerts

### **Go-Live Process**
1. Deploy with simulation mode enabled
2. Monitor system performance for 24 hours
3. Gradually enable live decisions
4. Monitor escalation rates closely
5. Adjust thresholds based on real data

---

## 📞 Support & Troubleshooting

### **Common Issues**
- **High Escalation Rate**: Lower `CONFIDENCE_THRESHOLD`
- **Low Confidence Scores**: Review and update rules
- **Notification Failures**: Check environment variables
- **Database Errors**: Verify Firestore configuration

### **Debug Mode**
Set `NODE_ENV=development` for detailed console logging.

### **Contact**
For technical support, refer to the development team or check the GitHub repository issues.

---

**✅ Result**: Everything your dev team and AI agents need — unified in one comprehensive guide! 🚀
