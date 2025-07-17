# 🧪 System Integration Test Checklist

## ✅ Pre-Test Setup
- [ ] Ensure development server is running (`npm run dev`)
- [ ] Firebase emulator is running (if using local testing)
- [ ] At least 2-3 test staff members exist in the system
- [ ] Test properties and bookings are available

---

## 🧠 AI Performance Dashboard Tests

### **Dashboard Access & Rendering**
- [ ] Navigate to `/admin/backoffice`
- [ ] Click on "AI Dashboard" tab
- [ ] Verify dashboard loads without console errors
- [ ] Check all icons render correctly (Activity, Eye, ThumbsUp, ThumbsDown, etc.)

### **KPI Metrics Cards**
- [ ] Verify 4 KPI cards display:
  - [ ] Average Approval Time (blue card with Clock icon)
  - [ ] Assignment Accuracy (green card with Target icon)
  - [ ] Jobs per Staff (purple card with Users icon)
  - [ ] Admin Satisfaction (yellow card with Star icon)
- [ ] Check that metrics show realistic values (not NaN or undefined)
- [ ] Verify cards have proper gradient backgrounds and animations

### **Filtering System**
- [ ] **Time Range Filter:**
  - [ ] Select "Last 24 Hours" - verify logs update
  - [ ] Select "Last 7 Days" - verify logs update
  - [ ] Select "Last 30 Days" - verify logs update
  - [ ] Select "Last 90 Days" - verify logs update

- [ ] **Decision Type Filter:**
  - [ ] Select "All Types" - shows all decisions
  - [ ] Select "Booking Approved" - filters correctly
  - [ ] Select "Job Assigned" - filters correctly
  - [ ] Select "Job Created" - filters correctly

- [ ] **Status Filter:**
  - [ ] Select "All Status" - shows all statuses
  - [ ] Select "Success" - shows only successful decisions
  - [ ] Select "Pending" - shows only pending decisions
  - [ ] Select "Failed" - shows only failed decisions

- [ ] **Search Functionality:**
  - [ ] Type in search box - verify debounced search (500ms delay)
  - [ ] Search for staff names - verify filtering
  - [ ] Search for property names - verify filtering
  - [ ] Clear search - verify all logs return

### **AI Decision Log Feed**
- [ ] Verify decision log displays with proper formatting
- [ ] Check each log entry shows:
  - [ ] Decision type icon (Calendar, Users, Brain, etc.)
  - [ ] Decision title and description
  - [ ] Status badge (Success/Pending/Failed)
  - [ ] Timestamp in readable format
  - [ ] Metadata (staff name, property, client if available)
  - [ ] Confidence score (if available)

### **Admin Feedback System**
- [ ] **Thumbs Up/Down Buttons:**
  - [ ] Click thumbs up on a decision - verify feedback dialog opens
  - [ ] Click thumbs down on a decision - verify feedback dialog opens
  - [ ] Verify buttons have proper hover states and colors

- [ ] **Feedback Dialog:**
  - [ ] Verify dialog shows correct decision information
  - [ ] Verify thumbs up shows green icon and positive messaging
  - [ ] Verify thumbs down shows red icon and negative messaging
  - [ ] Type comment in textarea - verify character input works
  - [ ] Click "Cancel" - verify dialog closes without saving
  - [ ] Click "Submit Feedback" - verify feedback is saved
  - [ ] Verify success toast appears after submission
  - [ ] Verify KPIs update after feedback submission

### **Loading & Empty States**
- [ ] Refresh page - verify loading spinner appears
- [ ] Clear all filters to show no results - verify empty state with Brain icon
- [ ] Verify "Refresh Data" button works in empty state

---

## 👥 Job Staff Assignment System Tests

### **Job Creation with Staff Assignment**
- [ ] Navigate to Job Assignments section
- [ ] Click "Create Job" button
- [ ] **CreateJobWizardModal:**
  - [ ] Step through wizard to "Staff Assignment" step
  - [ ] Verify staff members load in dropdown
  - [ ] Select a staff member - verify selection highlights
  - [ ] Verify staff member shows name and role
  - [ ] Complete wizard and create job
  - [ ] Verify job is created with correct `assignedStaffId`

### **Job Editing with Staff Assignment**
- [ ] Find an existing job in the job list
- [ ] Click "Edit" button on a job
- [ ] **EditJobModal:**
  - [ ] Verify modal opens with current job data
  - [ ] Navigate to "Staff Assignment" section
  - [ ] Verify current assigned staff is pre-selected
  - [ ] Change staff assignment to different staff member
  - [ ] Save changes
  - [ ] Verify job updates with new staff assignment
  - [ ] Verify status history shows staff assignment change

### **Job Display with Staff Information**
- [ ] **Grid View:**
  - [ ] Verify each job card shows assigned staff name
  - [ ] Verify "Unassigned" shows for jobs without staff
  - [ ] Verify staff name appears with User icon

- [ ] **List View:**
  - [ ] Switch to list view
  - [ ] Verify each job row shows assigned staff name
  - [ ] Verify consistent formatting with grid view

### **Job Details Modal**
- [ ] Click "View" on a job
- [ ] Verify job details modal shows:
  - [ ] Assigned staff name in "Staff Assignment" section
  - [ ] Staff role information
  - [ ] Property information
  - [ ] All job metadata

---

## 🔄 Integration Workflow Tests

### **Booking to Job Creation Flow**
- [ ] Navigate to Bookings section
- [ ] Find a pending booking
- [ ] Approve the booking
- [ ] Verify job creation modal appears
- [ ] Assign staff member to the job
- [ ] Complete job creation
- [ ] **Verify AI Decision Logging:**
  - [ ] Navigate to AI Dashboard
  - [ ] Verify new "job_assigned" decision appears in log
  - [ ] Verify decision includes staff and property metadata

### **Staff Assignment Change Tracking**
- [ ] Edit an existing job's staff assignment
- [ ] Change from one staff member to another
- [ ] Save changes
- [ ] **Verify Status History:**
  - [ ] View job details
  - [ ] Check status history shows staff assignment change
  - [ ] Verify timestamp and admin who made change

### **Mobile App Data Consistency**
- [ ] Create/edit jobs with staff assignments in web admin
- [ ] **Mobile App Verification:**
  - [ ] Open mobile app (or check mobile API endpoints)
  - [ ] Verify jobs appear for assigned staff members only
  - [ ] Verify job data matches web admin (title, property, schedule)
  - [ ] Verify `assignedStaffId` filtering works correctly

---

## ⚠️ Error Handling Tests

### **Network & API Errors**
- [ ] Disconnect internet - verify graceful error handling
- [ ] Try to load staff list with network error - verify error message
- [ ] Try to submit feedback with network error - verify retry mechanism

### **Data Validation Errors**
- [ ] Try to create job without selecting staff - verify validation error
- [ ] Try to assign job to non-existent staff ID - verify error handling
- [ ] Try to submit empty feedback - verify validation

### **Edge Cases**
- [ ] **Unassigned Jobs:**
  - [ ] Create job without staff assignment
  - [ ] Verify "Unassigned" displays correctly
  - [ ] Verify job can be edited to add staff later

- [ ] **Missing Staff Data:**
  - [ ] Job with invalid `assignedStaffId`
  - [ ] Verify graceful fallback to "Unknown Staff"
  - [ ] Verify system doesn't crash

- [ ] **Large Data Sets:**
  - [ ] Test with 50+ jobs in list
  - [ ] Test with 20+ staff members in dropdown
  - [ ] Verify performance remains acceptable

---

## 📊 Performance & UX Tests

### **Loading Performance**
- [ ] Dashboard loads within 2 seconds
- [ ] Staff dropdown loads within 1 second
- [ ] Job list updates smoothly without flickering
- [ ] Animations are smooth (60fps)

### **Responsive Design**
- [ ] Test on mobile viewport (375px width)
- [ ] Test on tablet viewport (768px width)
- [ ] Test on desktop viewport (1200px+ width)
- [ ] Verify all components remain usable

### **Accessibility**
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test with screen reader (basic functionality)
- [ ] Verify color contrast meets standards

---

## ✅ Success Criteria

**System is ready for production when:**
- [ ] All dashboard components render without errors
- [ ] All job creation/editing workflows complete successfully
- [ ] Staff assignment data is consistent between web and mobile
- [ ] AI decision logging captures all relevant actions
- [ ] Admin feedback system works end-to-end
- [ ] Error handling provides clear user feedback
- [ ] Performance meets acceptable standards
- [ ] Mobile app compatibility is verified

---

## 🐛 Issue Reporting Template

**If issues are found, report using this format:**

```
**Issue:** [Brief description]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Browser/Device:** [Chrome 120, iPhone 14, etc.]
**Console Errors:** [Any JavaScript errors]
**Screenshots:** [If applicable]
```
