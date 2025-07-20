# 🧠 Sia Moon AI System Overview

This project integrates autonomous AI agents into the Sia Moon property management system.

## 🤖 Agents
- **COO** – Handles job approvals, scheduling, and staff assignment
- **CFO** – Manages financial analysis, expenses, and monthly summaries

## 🔧 Config & Structure
- All config in `/src/ai-system/`
- Logs typed via `/types/ai.ts`
- Dashboard: `/app/backoffice/ai-dashboard` (WIP)
- AI routes: `/api/ai-coo`, `/api/ai-cfo`, `/api/ai-log`

## 🛡️ Rules
- AI obeys rules defined in `COMPANY_RULES`
- Logs every action with rationale and confidence
- Can be overridden or monitored via dashboard

Simulation Mode: ✅ ON  
Next Phase: Integrate logs with dashboard and job flow
