// AI_WebApp_DevTeam_Config.ts

// 🎯 System Prompts
export const AI_COO_SYSTEM_PROMPT = `
You are the AI COO (Chief Operating Officer) of Sia Moon Property Management.

Your job is to automate the operations team:
- Analyze incoming bookings and requests
- Approve, assign, and schedule jobs
- Use map and calendar data to optimize decisions
- Obey all company rules and policies
- Log every action with a confidence score and rationale
- Escalate anything unclear to a human manager
`;

export const AI_CFO_SYSTEM_PROMPT = `
You are the AI CFO (Chief Financial Officer) of Sia Moon Property Management.

Your job is to manage finances by:
- Analyzing uploaded spreadsheets and real-time expense data
- Updating Profit & Loss automatically
- Providing insights, alerts, and monthly summaries
- Detecting cost anomalies or trends
- Never make financial edits unless 100% confident
- Log all analysis and send alerts when human review is needed
`;

// 🛡️ Rules + Policies with Versioning
export interface CompanyRule {
  id: string
  version: number
  rule: string
  category: 'booking' | 'financial' | 'staff' | 'emergency' | 'system'
  active: boolean
  createdAt: string
  updatedAt: string
}

export const COMPANY_RULES: CompanyRule[] = [
  {
    id: "R1",
    version: 1,
    rule: "Do not assign jobs to staff more than 5km away unless marked 'remote-capable'.",
    category: 'staff',
    active: true,
    createdAt: "2025-07-20T00:00:00Z",
    updatedAt: "2025-07-20T00:00:00Z"
  },
  {
    id: "R2",
    version: 1,
    rule: "Always assign the staff member with the shortest ETA unless otherwise overridden.",
    category: 'staff',
    active: true,
    createdAt: "2025-07-20T00:00:00Z",
    updatedAt: "2025-07-20T00:00:00Z"
  },
  {
    id: "R3",
    version: 1,
    rule: "Jobs over ฿5000 must be flagged for human approval.",
    category: 'booking',
    active: true,
    createdAt: "2025-07-20T00:00:00Z",
    updatedAt: "2025-07-20T00:00:00Z"
  },
  {
    id: "R4",
    version: 1,
    rule: "Do not approve or assign incomplete or missing booking data.",
    category: 'booking',
    active: true,
    createdAt: "2025-07-20T00:00:00Z",
    updatedAt: "2025-07-20T00:00:00Z"
  },
  {
    id: "R5",
    version: 1,
    rule: "Log every action taken by any AI agent with timestamp, source, and confidence level.",
    category: 'system',
    active: true,
    createdAt: "2025-07-20T00:00:00Z",
    updatedAt: "2025-07-20T00:00:00Z"
  },
  {
    id: "R6",
    version: 1,
    rule: "When in doubt, escalate to human admin with reason.",
    category: 'system',
    active: true,
    createdAt: "2025-07-20T00:00:00Z",
    updatedAt: "2025-07-20T00:00:00Z"
  }
];

// Helper functions for rule management
export function getActiveRules(): CompanyRule[] {
  return COMPANY_RULES.filter(rule => rule.active)
}

export function getRulesByCategory(category: CompanyRule['category']): CompanyRule[] {
  return COMPANY_RULES.filter(rule => rule.active && rule.category === category)
}

export function getRuleVersionString(ruleIds: string[]): string {
  return ruleIds.map(id => {
    const rule = COMPANY_RULES.find(r => r.id === id)
    return rule ? `${rule.id}.v${rule.version}` : id
  }).join(', ')
}

export function getApplicableRules(agent: 'COO' | 'CFO'): CompanyRule[] {
  const systemRules = getRulesByCategory('system')

  if (agent === 'COO') {
    return [
      ...systemRules,
      ...getRulesByCategory('booking'),
      ...getRulesByCategory('staff'),
      ...getRulesByCategory('emergency')
    ]
  } else {
    return [
      ...systemRules,
      ...getRulesByCategory('financial')
    ]
  }
}

// 📡 API Routes Used by AI Agents
export const API_ROUTES = [
  { route: "/api/ai-coo", method: "POST", purpose: "Handle COO decisions" },
  { route: "/api/ai-cfo", method: "POST", purpose: "Handle CFO financial analysis" },
  { route: "/api/ai-log", method: "POST", purpose: "Store AI logs for audit and dashboard" },
  { route: "/api/ai-policy", method: "GET/POST", purpose: "Retrieve and update policies" }
];

// 🔄 Simulation Mode
export const SIMULATION_MODE = true;

// 🎯 Confidence Threshold Control
export const CONFIDENCE_THRESHOLD = 85; // AI must be at least 85% confident for auto-approval
export const HIGH_CONFIDENCE_THRESHOLD = 95; // For critical decisions requiring very high confidence
export const LOW_CONFIDENCE_THRESHOLD = 60; // Below this, immediate escalation required

// 📊 Dashboard Settings
export const DASHBOARD_SETTINGS = {
  enableFeedback: true,
  showConfidenceScores: true,
  maxLogEntries: 500,
  allowManualOverride: true
};

// 🧠 Metadata (Optional for future AI agents)
export const SYSTEM_METADATA = {
  version: "v1.0.0",
  agents: ["COO", "CFO"],
  author: "Founder – Sia Moon",
  lastUpdated: "2025-07-20"
};
