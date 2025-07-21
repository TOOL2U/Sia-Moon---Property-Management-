/**
 * Script to generate sample staff audit reports for testing
 * 
 * Run with: node src/scripts/generate-sample-audit-reports.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration - replace with your own
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample staff IDs - replace with your actual staff IDs
const staffIds = [
  'staff_001',
  'staff_002',
  'staff_003'
];

// Generate a random score between min and max
const randomScore = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a random trend
const randomTrend = () => {
  const trends = ['improving', 'declining', 'stable'];
  return trends[Math.floor(Math.random() * trends.length)];
};

// Generate a random date in the past few weeks (Monday)
const randomWeekStart = () => {
  const now = new Date();
  const weeksAgo = Math.floor(Math.random() * 8) + 1; // 1-8 weeks ago
  const daysToMonday = (now.getDay() + 6) % 7; // Days to previous Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday - (7 * weeksAgo));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Generate a week end date (Sunday) from a week start date (Monday)
const getWeekEnd = (weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
};

// Generate sample strengths
const generateStrengths = (trustScore, qualityScore) => {
  const strengths = [
    'Consistently completes tasks ahead of schedule',
    'Excellent attention to detail in cleaning tasks',
    'Proactive communication with management',
    'High guest satisfaction ratings',
    'Efficient use of resources and time',
    'Adapts quickly to changing priorities',
    'Thorough documentation of maintenance issues',
    'Positive attitude and team collaboration',
    'Minimal supervision required',
    'Effective use of the mobile app for task management'
  ];
  
  // Select 2-4 strengths based on scores
  const count = Math.floor((trustScore + qualityScore) / 50) + 1;
  const selected = [];
  
  for (let i = 0; i < count && i < 4; i++) {
    const index = Math.floor(Math.random() * strengths.length);
    selected.push(strengths[index]);
    strengths.splice(index, 1);
  }
  
  return selected;
};

// Generate sample concerns
const generateConcerns = (trustScore, qualityScore) => {
  const concerns = [
    'Occasional delays in task completion',
    'Inconsistent photo documentation',
    'Some missed cleaning areas reported by guests',
    'GPS location accuracy issues detected',
    'Late responses to urgent requests',
    'Incomplete maintenance reports',
    'Declining task acceptance rate',
    'Irregular check-in/check-out timing',
    'Multiple rescheduling requests',
    'Limited use of available AI assistance tools'
  ];
  
  // Select 0-3 concerns based on inverse scores
  const count = Math.floor((200 - trustScore - qualityScore) / 50);
  const selected = [];
  
  for (let i = 0; i < count && i < 3; i++) {
    const index = Math.floor(Math.random() * concerns.length);
    selected.push(concerns[index]);
    concerns.splice(index, 1);
  }
  
  return selected;
};

// Generate sample recommendations
const generateRecommendations = (concerns) => {
  const recommendations = [
    'Schedule additional training on mobile app features',
    'Review cleaning checklist procedures',
    'Implement daily check-in confirmation',
    'Provide feedback on photo documentation quality',
    'Discuss time management strategies',
    'Set up weekly progress review meetings',
    'Offer guidance on prioritizing urgent tasks',
    'Encourage use of AI assistance for routine questions',
    'Review GPS tracking settings on mobile device',
    'Recognize and reward improvement in key areas'
  ];
  
  // Select 1-3 recommendations
  const count = Math.max(1, concerns.length);
  const selected = [];
  
  for (let i = 0; i < count && i < 3; i++) {
    const index = Math.floor(Math.random() * recommendations.length);
    selected.push(recommendations[index]);
    recommendations.splice(index, 1);
  }
  
  return selected;
};

// Generate sample behavioral patterns
const generatePatterns = () => {
  const patterns = [
    'Performs best on morning assignments',
    'More efficient with cleaning than maintenance tasks',
    'Responds quickly to direct messages',
    'Prefers properties in the downtown area',
    'Most productive on weekdays',
    'Thorough with guest-facing areas',
    'Tends to complete tasks just before deadlines',
    'Works efficiently when assigned multiple tasks in same area',
    'Detailed reporting on maintenance issues',
    'Consistent performance regardless of property type'
  ];
  
  // Select 1-2 patterns
  const count = Math.floor(Math.random() * 2) + 1;
  const selected = [];
  
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * patterns.length);
    selected.push(patterns[index]);
    patterns.splice(index, 1);
  }
  
  return selected;
};

// Generate a full AI analysis
const generateAIAnalysis = (staffId, trustScore, qualityScore, strengths, concerns, recommendations) => {
  return `Weekly Performance Analysis for Staff ID: ${staffId}

Trust Score: ${trustScore}/100 - ${trustScore >= 80 ? 'Excellent' : trustScore >= 60 ? 'Good' : trustScore >= 40 ? 'Fair' : 'Needs Improvement'}
Quality Score: ${qualityScore}/100 - ${qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : qualityScore >= 40 ? 'Fair' : 'Needs Improvement'}

STRENGTHS:
${strengths.map(s => `- ${s}`).join('\n')}

${concerns.length > 0 ? `AREAS OF CONCERN:\n${concerns.map(c => `- ${c}`).join('\n')}\n` : ''}

RECOMMENDATIONS:
${recommendations.map(r => `- ${r}`).join('\n')}

This analysis is based on ${Math.floor(Math.random() * 10) + 5} completed tasks during the reporting period. Performance trends will continue to be monitored in subsequent weeks.`;
};

// Generate and upload sample audit reports
async function generateSampleReports() {
  try {
    console.log('Generating sample staff audit reports...');
    
    let totalReports = 0;
    
    // For each staff member
    for (const staffId of staffIds) {
      // Generate 1-3 reports per staff
      const reportCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < reportCount; i++) {
        // Generate random scores
        const trustScore = randomScore(50, 95);
        const qualityScore = randomScore(55, 98);
        
        // Generate random dates
        const weekStart = randomWeekStart();
        const weekEnd = getWeekEnd(weekStart);
        const weekDate = new Date(weekStart);
        const weekNumber = Math.ceil((weekDate.getDate() - weekDate.getDay() + 1) / 7);
        
        // Generate insights
        const strengths = generateStrengths(trustScore, qualityScore);
        const concerns = generateConcerns(trustScore, qualityScore);
        const recommendations = generateRecommendations(concerns);
        const patterns = generatePatterns();
        
        // Create report object
        const report = {
          staffId,
          weekStart,
          weekEnd,
          trustScore,
          qualityScore,
          metrics: {
            jobsCompleted: randomScore(5, 20),
            jobsAccepted: randomScore(6, 25),
            averageCompletionTime: randomScore(30, 120),
            onTimeCompletionRate: Math.random() * 0.4 + 0.6, // 60-100%
            photoComplianceRate: Math.random() * 0.5 + 0.5, // 50-100%
            gpsAccuracy: Math.random() * 0.3 + 0.7, // 70-100%
            aiUsageCount: randomScore(0, 15),
            responseTime: randomScore(5, 30)
          },
          insights: {
            strengths,
            concerns,
            recommendations,
            behavioralPatterns: patterns
          },
          trends: {
            trustScoreTrend: randomTrend(),
            qualityTrend: randomTrend(),
            productivityTrend: randomTrend()
          },
          aiAnalysis: generateAIAnalysis(staffId, trustScore, qualityScore, strengths, concerns, recommendations),
          createdAt: new Date().toISOString(),
          weekNumber,
          year: weekDate.getFullYear()
        };
        
        // Save to Firestore
        const reportId = `report_${weekStart}`;
        const reportRef = doc(db, 'ai_audits', staffId, 'reports', reportId);
        await setDoc(reportRef, report);
        
        console.log(`Created report for ${staffId} - Week ${weekNumber}, ${weekDate.getFullYear()}`);
        totalReports++;
      }
    }
    
    // Create metadata document
    const metadataRef = doc(db, 'ai_audits', 'metadata');
    await setDoc(metadataRef, {
      last_audit_run: serverTimestamp(),
      audit_schedule: 'weekly',
      total_reports: totalReports,
      updated_at: serverTimestamp()
    });
    
    console.log(`✅ Successfully generated ${totalReports} sample audit reports`);
    
  } catch (error) {
    console.error('Error generating sample reports:', error);
  }
}

// Run the script
generateSampleReports().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
