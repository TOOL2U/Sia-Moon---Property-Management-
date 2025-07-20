# 🧠 Sia Moon AI Integration – Web App Dev Team

## 🚀 OVERVIEW

This document contains the full instructions to implement and manage the new AI AGENTS inside the Sia Moon Property Management web application.
The goal is to build fully autonomous AI Agents that handle operations and finances — while remaining fully observable and controllable by the admin and founder.

---

## 🤖 AI AGENTS OVERVIEW

### COO Agent
- Automates job approvals, staff assignment, task scheduling
- Uses live calendar and map to optimize task routing
- Obeys all company rules and override structures
- Sends logs and confidence scores to AI Dashboard

### CFO Agent
- Receives uploaded spreadsheets and real-time expense data
- Analyzes P&L and financials
- Prepares monthly reports, anomaly alerts, cost optimizations

---

## 📦 PROJECT STRUCTURE

/src/ai-system/
AI_WebApp_DevTeam_Config.ts   ← AI system prompts, rules, routes
/docs/
AI_WebApp_DevTeam_Guide.md    ← This guide
/app/backoffice/ai-dashboard/   ← AI control panel (to be implemented)


---

## 🔌 API ROUTES TO SETUP

| Route                | Method | Purpose                                |
|---------------------|--------|----------------------------------------|
| `/api/ai-coo`       | POST   | Receives job data, returns AI COO decision |
| `/api/ai-cfo`       | POST   | Processes financial data from CFO Agent |
| `/api/ai-log`       | POST   | Logs all decisions made by AI agents   |

> These routes will be consumed by the dashboard, booking parser, and mobile backend.

---

## 🧠 CONFIG FILE: `AI_WebApp_DevTeam_Config.ts`

- `AI_COO_SYSTEM_PROMPT`: Full behavior prompt for operational decisions
- `AI_CFO_SYSTEM_PROMPT`: Financial prompt logic
- `COMPANY_RULES`: All enforced logic boundaries
- `SIMULATION_MODE`: Optional toggle to test without real action
- `API_ROUTES`: Reference map of endpoint purpose

> This is the core config file that Augment AI will use to generate new functionality or adjust behavior dynamically.

---

## 🧭 AI DASHBOARD (Admin Backoffice Tab)

To be implemented in `/app/backoffice/ai-dashboard/`:

- **Tabs**: Logs / Policies / KPIs / Feedback
- **Live AI logs**: Table of decisions, time, result, confidence
- **KPI Widgets**:
  - Avg time-to-assign
  - Manual overrides
  - Accuracy % (admin-rated)
- **Policy control panel**: Add/edit company logic
- **Manual override & test zone**

---

## 🧪 DEVELOPMENT STAGES

1. ✅ Remove legacy AI logic and dashboard
2. ✅ Install new `AI_WebApp_DevTeam_Config.ts`
3. ✅ Setup API routes: `/api/ai-coo`, `/api/ai-cfo`, `/api/ai-log`
4. 🧠 Connect routes to new AI logic (Augment assist)
5. 🖥️ Build the AI Dashboard page with all features
6. 🔁 Add simulation toggle, testing interface
7. 📈 Connect to live booking + map/calendar data
8. 🧪 Test with real and simulated job data
9. 📦 Deploy with monitoring and fail-safes

---

## 🧩 OPTIONAL ENHANCEMENTS

- Predictive booking AI (suggest job groupings)
- Feedback loop (admin rates decisions to train model)
- Version-controlled policy history
- AI version tags with rollback option

---

## ✅ DONE FOR YOU
- Core prompts and system logic
- `.ts` config files for Augment to use
- Clean folder structure for scalable growth

---

## 🙏 FINAL NOTE

You are not working alone — the AI agents are part of your dev team now.
Maintain clear routes, logging, and clean logic so both humans and AI can work together.

Let the system run with clarity, confidence, and control.
– Sia Moon Dev Team
