// lib/config.ts - Configuration constants for AI agents

/**
 * SIMULATION MODE - Controls whether AI actions are simulated or real
 * Set to false in production to enable real actions
 * Set to true in development/staging for safe testing
 */
export const SIMULATION_MODE = process.env.NODE_ENV !== 'production' || process.env.AI_SIMULATION_MODE === 'true'

/**
 * Simulation Mode Configuration
 */
export const SIMULATION_CONFIG = {
  enabled: SIMULATION_MODE,
  logPrefix: '🧪 SIMULATION MODE',
  responseNote: 'This was a simulation run - no real actions were performed.',
  allowRealActions: !SIMULATION_MODE,
  testDataEnabled: SIMULATION_MODE
}

/**
 * AI COO System Prompt - Defines the AI's role and behavior
 */
export const AI_COO_SYSTEM_PROMPT = `You are an AI Chief Operating Officer (COO) for a premium villa property management company in Thailand. Your role is to:

1. ANALYZE booking requests and operational tasks
2. ASSIGN appropriate staff based on skills, location, and availability
3. ENSURE compliance with company policies and quality standards
4. OPTIMIZE resource allocation and operational efficiency
5. ESCALATE complex or high-value decisions to human management

You have access to:
- Real-time staff availability and locations
- Historical performance data
- Company operational rules and policies
- Customer preferences and requirements

Always prioritize:
- Customer satisfaction and service quality
- Staff safety and fair workload distribution
- Cost efficiency and resource optimization
- Compliance with company policies
- Risk mitigation and quality assurance

Respond with structured JSON containing your decision, confidence level, staff assignments, and detailed reasoning.`

/**
 * AI CFO System Prompt - Defines the AI's financial decision-making role
 */
export const AI_CFO_SYSTEM_PROMPT = `You are an AI Chief Financial Officer (CFO) for a premium villa property management company in Thailand. Your role is to:

1. ANALYZE financial transactions and budget requests
2. APPROVE or REJECT expenses based on budget and ROI
3. MONITOR cash flow and financial performance
4. ENSURE compliance with financial policies
5. ESCALATE significant financial decisions to human oversight

You have access to:
- Current budget allocations and spending
- Historical financial performance
- Revenue projections and forecasts
- Company financial policies and limits
- Market rates and cost benchmarks

Always prioritize:
- Financial sustainability and profitability
- Budget compliance and cost control
- ROI optimization and value creation
- Risk management and financial security
- Regulatory compliance and transparency

Respond with structured JSON containing your decision, confidence level, financial impact assessment, and detailed reasoning.`

/**
 * Company Operational Rules for AI COO
 */
export const COMPANY_RULES = [
  "Reject bookings missing address or job type information",
  "Never assign staff more than 5km away unless marked as remote-capable",
  "Flag jobs over ฿5,000 for human review (reduce confidence)",
  "Prioritize staff with highest ratings for VIP customers",
  "Ensure minimum 2-hour gap between staff assignments",
  "Require supervisor approval for emergency/urgent jobs",
  "Maintain staff workload balance - max 8 hours per day",
  "Always assign backup staff for high-priority bookings",
  "Verify staff skills match job requirements before assignment",
  "Escalate customer complaints or special requests to management",
  "Apply surge pricing during peak hours (6-9 AM, 6-9 PM)",
  "Require safety equipment for maintenance and cleaning jobs",
  "Document all decisions with clear reasoning and confidence scores",
  "Monitor staff performance and adjust assignments accordingly",
  "Ensure compliance with local labor laws and regulations"
]

/**
 * Company Financial Rules for AI CFO
 */
export const FINANCIAL_RULES = [
  "Auto-approve expenses under ฿1,000 with 90%+ confidence",
  "Require human approval for expenses over ฿10,000",
  "Flag recurring expenses that exceed 10% variance from budget",
  "Reject expenses without proper documentation or receipts",
  "Monitor cash flow to maintain minimum 30-day operating reserve",
  "Apply cost-benefit analysis for capital expenditures over ฿5,000",
  "Ensure all expenses align with approved budget categories",
  "Track ROI for marketing and operational investments",
  "Maintain detailed audit trail for all financial decisions",
  "Comply with Thai tax regulations and reporting requirements",
  "Monitor vendor payments to maintain good supplier relationships",
  "Flag unusual spending patterns for fraud prevention",
  "Optimize payment timing for cash flow management",
  "Ensure proper authorization levels for different expense types",
  "Maintain financial transparency and accurate reporting"
]

/**
 * AI Decision Confidence Thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 0.8,    // 80%+ confidence for automatic approval
  HUMAN_REVIEW: 0.7,    // 70-79% confidence requires human review
  AUTO_REJECT: 0.3,     // Below 30% confidence auto-rejects
  ESCALATION: 0.6       // Below 60% confidence escalates to management
}

/**
 * Job Type Categories and Required Skills
 */
export const JOB_CATEGORIES = {
  cleaning: {
    requiredSkills: ['cleaning', 'housekeeping'],
    estimatedDuration: 120, // minutes
    baseRate: 350, // THB per hour
    priority: 5
  },
  maintenance: {
    requiredSkills: ['maintenance', 'plumbing', 'electrical'],
    estimatedDuration: 180,
    baseRate: 450,
    priority: 7
  },
  'deep-clean': {
    requiredSkills: ['cleaning', 'deep-clean'],
    estimatedDuration: 240,
    baseRate: 380,
    priority: 6
  },
  laundry: {
    requiredSkills: ['laundry', 'housekeeping'],
    estimatedDuration: 90,
    baseRate: 320,
    priority: 4
  },
  organizing: {
    requiredSkills: ['organizing', 'housekeeping'],
    estimatedDuration: 150,
    baseRate: 360,
    priority: 5
  },
  gardening: {
    requiredSkills: ['gardening', 'maintenance'],
    estimatedDuration: 120,
    baseRate: 400,
    priority: 4
  },
  'pool-cleaning': {
    requiredSkills: ['pool-cleaning', 'maintenance'],
    estimatedDuration: 90,
    baseRate: 420,
    priority: 6
  }
}

/**
 * Customer Types and Service Levels
 */
export const CUSTOMER_TYPES = {
  standard: {
    priorityMultiplier: 1.0,
    responseTime: 60, // minutes
    qualityLevel: 'standard'
  },
  premium: {
    priorityMultiplier: 1.5,
    responseTime: 30,
    qualityLevel: 'premium'
  },
  vip: {
    priorityMultiplier: 2.0,
    responseTime: 15,
    qualityLevel: 'luxury'
  }
}

/**
 * Operating Hours and Pricing
 */
export const OPERATING_CONFIG = {
  standardHours: {
    start: 8, // 8 AM
    end: 18,  // 6 PM
    multiplier: 1.0
  },
  extendedHours: {
    start: 6, // 6 AM
    end: 22,  // 10 PM
    multiplier: 1.2
  },
  emergencyHours: {
    start: 0, // 24/7
    end: 24,
    multiplier: 1.5
  },
  peakHours: [
    { start: 6, end: 9, multiplier: 1.3 },   // Morning rush
    { start: 18, end: 21, multiplier: 1.3 }  // Evening rush
  ]
}

/**
 * Geographic Service Areas (Bangkok)
 */
export const SERVICE_AREAS = {
  central: {
    name: 'Bangkok Central',
    coordinates: { lat: 13.7563, lng: 100.5018 },
    serviceRadius: 15, // km
    surgeMultiplier: 1.0
  },
  sukhumvit: {
    name: 'Sukhumvit Area',
    coordinates: { lat: 13.7650, lng: 100.5380 },
    serviceRadius: 12,
    surgeMultiplier: 1.1
  },
  silom: {
    name: 'Silom District',
    coordinates: { lat: 13.7440, lng: 100.5330 },
    serviceRadius: 10,
    surgeMultiplier: 1.2
  },
  sathorn: {
    name: 'Sathorn Area',
    coordinates: { lat: 13.7308, lng: 100.5418 },
    serviceRadius: 12,
    surgeMultiplier: 1.1
  },
  lumpini: {
    name: 'Lumpini Area',
    coordinates: { lat: 13.7367, lng: 100.5480 },
    serviceRadius: 8,
    surgeMultiplier: 1.3
  }
}

/**
 * Quality Assurance Standards
 */
export const QUALITY_STANDARDS = {
  minimumRating: 4.0,
  maximumComplaints: 2, // per month
  requiredCertifications: ['safety', 'hygiene'],
  performanceReviewFrequency: 30, // days
  customerSatisfactionTarget: 4.5
}

/**
 * Emergency Response Configuration
 */
export const EMERGENCY_CONFIG = {
  responseTime: 30, // minutes
  escalationLevels: [
    { level: 1, responseTime: 15, staffRequired: 1 },
    { level: 2, responseTime: 30, staffRequired: 2 },
    { level: 3, responseTime: 60, staffRequired: 3 }
  ],
  emergencyTypes: [
    'water-leak',
    'electrical-fault',
    'security-breach',
    'medical-emergency',
    'fire-hazard'
  ]
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  rateLimits: {
    booking: 100, // per hour
    financial: 50,
    emergency: 200
  },
  cacheExpiry: {
    staff: 300,     // 5 minutes
    pricing: 3600,  // 1 hour
    rules: 86400    // 24 hours
  }
}
