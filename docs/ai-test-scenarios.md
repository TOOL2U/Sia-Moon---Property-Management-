# 🧪 AI Test Scenarios — Simulation Mode

This document outlines the test scenarios used to validate AI Agent behavior in simulation mode for the COO and CFO agents.

---

## COO Agent Tests

### ✅ Test 1: Booking Within Service Area
- Booking ID: B001
- Location: Mae Haad, Koh Phangan
- Price: ฿3500
- Expected: Approve and assign to Nok

### 🛑 Test 2: Booking Over ฿5000 (Escalation Required)
- Booking ID: B002
- Price: ฿7400
- Expected: Escalate due to price threshold

### 🛑 Test 3: No Staff Within 5km
- Booking ID: B003
- Staff: Lek @ 6.2km
- Expected: Reject or escalate

### 🛑 Test 4: Missing Booking Data
- Booking ID: B004
- Missing location
- Expected: Reject + log error

### ⚖️ Test 5: Conflicting Rules
- Booking ID: B005
- Remote staff available + high price
- Expected: Escalate, log dual-rule conflict

---

## CFO Agent Test

### 💰 Test 6: CFO Expense Spreadsheet Parsing
- File: `P&L_June.xlsx`
- Flag expense over ฿7000
- Generate summary report

---

## How to Run

### In code (simulateAIActions.ts)
```ts
await runAIBookingTest("booking1")
await runAIBookingTest("booking2")
await runAICFOTest()
```

Logs will appear in your AI Dashboard under "Decision Logs".
