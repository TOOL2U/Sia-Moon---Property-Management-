# Webapp Team - AI Audit Reports Access Guide

## 🎯 Overview
The Background AI Audit System generates weekly staff performance reports that are automatically stored in Firebase Firestore. This guide explains how the webapp team can access, retrieve, and display these reports in their management dashboard.

## 📊 Data Structure & Storage

### Firestore Collection Structure
```
ai_audits/
├── {staffId}/
│   ├── report_2025-07-14.json    // Weekly report (Monday dates)
│   ├── report_2025-07-21.json
│   ├── report_2025-07-28.json
│   └── ...
└── metadata/
    ├── last_audit_run
    └── audit_schedule
```

### Report Data Schema
Each weekly report contains structured JSON data:

```typescript
interface StaffAuditReport {
  staffId: string;
  weekStart: string;        // ISO date (Monday)
  weekEnd: string;          // ISO date (Sunday)
  trustScore: number;       // 0-100
  qualityScore: number;     // 0-100
  
  metrics: {
    jobsCompleted: number;
    jobsAccepted: number;
    averageCompletionTime: number;    // minutes
    onTimeCompletionRate: number;     // 0-1
    photoComplianceRate: number;      // 0-1
    gpsAccuracy: number;              // 0-1
    aiUsageCount: number;
    responseTime: number;             // average response time
  };
  
  insights: {
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    behavioralPatterns: string[];
  };
  
  trends: {
    trustScoreTrend: 'improving' | 'declining' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';
    productivityTrend: 'improving' | 'declining' | 'stable';
  };
  
  aiAnalysis: string;       // Full AI-generated analysis
  createdAt: string;        // ISO timestamp
  weekNumber: number;       // Week number of the year
  year: number;
}
```

## 🔧 Webapp Integration Methods

### Method 1: Direct Firestore Access (Recommended)

```javascript
// Firebase configuration for webapp
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get latest report for a specific staff member
async function getLatestStaffReport(staffId) {
  try {
    const staffReportsRef = collection(db, 'ai_audits', staffId, 'reports');
    const q = query(staffReportsRef, orderBy('createdAt', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching staff report:', error);
    return null;
  }
}

// Get all reports for a staff member
async function getAllStaffReports(staffId) {
  try {
    const staffReportsRef = collection(db, 'ai_audits', staffId, 'reports');
    const q = query(staffReportsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching staff reports:', error);
    return [];
  }
}

// Get reports for all staff (for dashboard overview)
async function getAllLatestReports() {
  try {
    const auditCollection = collection(db, 'ai_audits');
    const auditDocs = await getDocs(auditCollection);
    
    const reports = [];
    
    for (const auditDoc of auditDocs.docs) {
      const staffId = auditDoc.id;
      if (staffId === 'metadata') continue; // Skip metadata doc
      
      const latestReport = await getLatestStaffReport(staffId);
      if (latestReport) {
        reports.push(latestReport);
      }
    }
    
    return reports;
  } catch (error) {
    console.error('Error fetching all reports:', error);
    return [];
  }
}

// Get specific week report
async function getWeeklyReport(staffId, weekDate) {
  try {
    const reportRef = doc(db, 'ai_audits', staffId, 'reports', `report_${weekDate}`);
    const reportDoc = await getDoc(reportRef);
    
    if (reportDoc.exists()) {
      return {
        id: reportDoc.id,
        ...reportDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    return null;
  }
}
```

### Method 2: REST API Endpoints (If using Firebase Functions)

```javascript
// Create Firebase Cloud Functions for easier webapp access

// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Get latest reports for all staff
exports.getLatestAuditReports = functions.https.onRequest(async (req, res) => {
  try {
    // Add authentication check here
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = admin.firestore();
    const auditCollection = db.collection('ai_audits');
    const auditDocs = await auditCollection.get();
    
    const reports = [];
    
    for (const auditDoc of auditDocs.docs) {
      const staffId = auditDoc.id;
      if (staffId === 'metadata') continue;
      
      // Get latest report for this staff member
      const reportsRef = auditDoc.ref.collection('reports');
      const latestQuery = await reportsRef.orderBy('createdAt', 'desc').limit(1).get();
      
      if (!latestQuery.empty) {
        const reportData = latestQuery.docs[0].data();
        reports.push({
          staffId,
          reportId: latestQuery.docs[0].id,
          ...reportData
        });
      }
    }
    
    res.json({ reports, total: reports.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific staff report history
exports.getStaffAuditHistory = functions.https.onRequest(async (req, res) => {
  try {
    const { staffId } = req.params;
    const { limit: limitParam } = req.query;
    
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID required' });
    }

    const db = admin.firestore();
    const reportsRef = db.collection('ai_audits').doc(staffId).collection('reports');
    
    let query = reportsRef.orderBy('createdAt', 'desc');
    if (limitParam) {
      query = query.limit(parseInt(limitParam));
    }
    
    const querySnapshot = await query.get();
    const reports = querySnapshot.docs.map(doc => ({
      reportId: doc.id,
      ...doc.data()
    }));
    
    res.json({ staffId, reports, total: reports.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Method 3: Real-time Listening (For Live Updates)

```javascript
// Real-time listener for new audit reports
import { onSnapshot } from 'firebase/firestore';

function setupRealtimeAuditListener() {
  const auditCollection = collection(db, 'ai_audits');
  
  return onSnapshot(auditCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const staffId = change.doc.id;
        if (staffId !== 'metadata') {
          console.log(`New/updated audit data for staff: ${staffId}`);
          // Refresh dashboard data
          updateDashboardForStaff(staffId);
        }
      }
    });
  });
}

// Listen for specific staff updates
function listenToStaffReports(staffId, callback) {
  const reportsRef = collection(db, 'ai_audits', staffId, 'reports');
  const q = query(reportsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reports);
  });
}
```

## 🎨 Dashboard Display Examples

### Management Dashboard Summary
```html
<!-- Example HTML structure for dashboard -->
<div class="audit-dashboard">
  <div class="dashboard-header">
    <h2>Staff Performance Audit Dashboard</h2>
    <div class="last-updated">Last Updated: <span id="lastUpdate"></span></div>
  </div>
  
  <div class="staff-overview">
    <div class="metric-card trust-score">
      <h3>Average Trust Score</h3>
      <div class="score" id="avgTrustScore">--</div>
    </div>
    
    <div class="metric-card quality-score">
      <h3>Average Quality Score</h3>
      <div class="score" id="avgQualityScore">--</div>
    </div>
    
    <div class="metric-card staff-count">
      <h3>Active Staff</h3>
      <div class="count" id="activeStaffCount">--</div>
    </div>
  </div>
  
  <div class="staff-reports">
    <table class="reports-table">
      <thead>
        <tr>
          <th>Staff Member</th>
          <th>Trust Score</th>
          <th>Quality Score</th>
          <th>Jobs Completed</th>
          <th>Last Report</th>
          <th>Trend</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="reportsTableBody">
        <!-- Dynamic content -->
      </tbody>
    </table>
  </div>
</div>
```

### JavaScript Dashboard Controller
```javascript
class AuditDashboard {
  constructor() {
    this.reports = [];
    this.init();
  }
  
  async init() {
    await this.loadReports();
    this.setupRealtimeUpdates();
    this.renderDashboard();
  }
  
  async loadReports() {
    try {
      this.reports = await getAllLatestReports();
      console.log(`Loaded ${this.reports.length} audit reports`);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  }
  
  renderDashboard() {
    this.renderSummaryMetrics();
    this.renderStaffTable();
  }
  
  renderSummaryMetrics() {
    if (this.reports.length === 0) return;
    
    const avgTrust = this.reports.reduce((sum, r) => sum + r.trustScore, 0) / this.reports.length;
    const avgQuality = this.reports.reduce((sum, r) => sum + r.qualityScore, 0) / this.reports.length;
    
    document.getElementById('avgTrustScore').textContent = Math.round(avgTrust);
    document.getElementById('avgQualityScore').textContent = Math.round(avgQuality);
    document.getElementById('activeStaffCount').textContent = this.reports.length;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
  }
  
  renderStaffTable() {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';
    
    this.reports.forEach(report => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${report.staffId}</td>
        <td class="score-cell ${this.getScoreClass(report.trustScore)}">${report.trustScore}</td>
        <td class="score-cell ${this.getScoreClass(report.qualityScore)}">${report.qualityScore}</td>
        <td>${report.metrics.jobsCompleted}</td>
        <td>${new Date(report.createdAt).toLocaleDateString()}</td>
        <td class="trend-cell">
          <span class="trend ${report.trends.trustScoreTrend}">${report.trends.trustScoreTrend}</span>
        </td>
        <td>
          <button onclick="viewDetailedReport('${report.staffId}')">View Details</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  }
  
  setupRealtimeUpdates() {
    // Refresh every 5 minutes
    setInterval(async () => {
      await this.loadReports();
      this.renderDashboard();
    }, 5 * 60 * 1000);
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  new AuditDashboard();
});
```

## 🔐 Security & Access Control

### Firestore Security Rules
```javascript
// firestore.rules - Add these rules for audit data access
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Audit reports - read-only for authenticated admin users
    match /ai_audits/{staffId}/reports/{reportId} {
      allow read: if request.auth != null && 
                     request.auth.token.role == 'admin' ||
                     request.auth.token.role == 'manager';
      allow write: if false; // Only the mobile app can write
    }
    
    // Audit metadata
    match /ai_audits/metadata/{document} {
      allow read: if request.auth != null && 
                     request.auth.token.role == 'admin' ||
                     request.auth.token.role == 'manager';
    }
  }
}
```

### Authentication Setup
```javascript
// Ensure webapp users have proper authentication
import { signInWithEmailAndPassword } from 'firebase/auth';

async function authenticateWebappUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verify user has admin/manager role
    const token = await userCredential.user.getIdTokenResult();
    if (!['admin', 'manager'].includes(token.claims.role)) {
      throw new Error('Insufficient permissions to view audit reports');
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

## 📈 Advanced Features

### Report Aggregation
```javascript
// Generate team performance summary
function generateTeamSummary(reports) {
  const summary = {
    totalStaff: reports.length,
    averageScores: {
      trust: reports.reduce((sum, r) => sum + r.trustScore, 0) / reports.length,
      quality: reports.reduce((sum, r) => sum + r.qualityScore, 0) / reports.length
    },
    topPerformers: reports
      .sort((a, b) => (b.trustScore + b.qualityScore) - (a.trustScore + a.qualityScore))
      .slice(0, 5),
    needsAttention: reports
      .filter(r => r.trustScore < 60 || r.qualityScore < 60),
    trends: {
      improving: reports.filter(r => r.trends.trustScoreTrend === 'improving').length,
      declining: reports.filter(r => r.trends.trustScoreTrend === 'declining').length,
      stable: reports.filter(r => r.trends.trustScoreTrend === 'stable').length
    }
  };
  
  return summary;
}
```

### Export Functionality
```javascript
// Export reports to CSV
function exportReportsToCSV(reports) {
  const headers = [
    'Staff ID', 'Week Start', 'Trust Score', 'Quality Score',
    'Jobs Completed', 'Completion Rate', 'AI Usage', 'Created At'
  ];
  
  const csvContent = [
    headers.join(','),
    ...reports.map(report => [
      report.staffId,
      report.weekStart,
      report.trustScore,
      report.qualityScore,
      report.metrics.jobsCompleted,
      report.metrics.onTimeCompletionRate,
      report.metrics.aiUsageCount,
      report.createdAt
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `staff_audit_reports_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

## 🚀 Getting Started Checklist

### For Webapp Team:
1. ✅ **Firebase Setup**: Ensure webapp has access to the same Firebase project
2. ✅ **Authentication**: Implement admin/manager role verification
3. ✅ **Firestore Access**: Add the provided JavaScript functions to your webapp
4. ✅ **Security Rules**: Update Firestore rules for audit data access
5. ✅ **Dashboard UI**: Implement the dashboard HTML/CSS structure
6. ✅ **Real-time Updates**: Add listeners for live report updates
7. ✅ **Testing**: Verify data access with sample audit reports

### Sample Implementation Schedule:
- **Week 1**: Firebase setup and basic data access
- **Week 2**: Dashboard UI and summary metrics
- **Week 3**: Detailed report views and real-time updates
- **Week 4**: Export functionality and advanced features

---

**Status**: ✅ **READY FOR WEBAPP INTEGRATION**

The mobile app generates weekly audit reports automatically. The webapp team can now access this data using the methods outlined above. Reports are generated every Sunday and are immediately available in Firestore for webapp consumption.
