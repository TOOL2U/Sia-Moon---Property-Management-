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

// 🛡️ Rules + Policies
export const COMPANY_RULES = [
  "Do not assign jobs to staff more than 5km away unless marked 'remote-capable'.",
  "Always assign the staff member with the shortest ETA unless otherwise overridden.",
  "Jobs over ฿5000 must be flagged for human approval.",
  "Do not approve or assign incomplete or missing booking data.",
  "Log every action taken by any AI agent with timestamp, source, and confidence level.",
  "When in doubt, escalate to human admin with reason."
];

// 📡 API Routes Used by AI Agents
export const API_ROUTES = [
  { route: "/api/ai-coo", method: "POST", purpose: "Handle COO decisions" },
  { route: "/api/ai-cfo", method: "POST", purpose: "Handle CFO financial analysis" },
  { route: "/api/ai-log", method: "POST", purpose: "Store AI logs for audit and dashboard" },
  { route: "/api/ai-policy", method: "GET/POST", purpose: "Retrieve and update policies" }
];

// 🔄 Simulation Mode
export const SIMULATION_MODE = true;

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
