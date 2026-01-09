# Job Assignment Flow - Staff to Calendar Integration

## 🔄 Complete Workflow

### 1. **Booking Created** (Admin/Customer)
```
Status: 'approved' or 'confirmed'
↓
AutomaticJobCreationService detects booking
↓
Creates 2 jobs:
  - Pre-Arrival Cleaning
  - Post-Checkout Cleaning
↓
Jobs saved to 'operational_jobs' collection
Status: 'pending'
assignedStaffId: null
broadcastToAll: true
```

### 2. **Mobile App - Job Discovery** (Staff/Cleaner)
```
Staff opens mobile app
↓
App calls: GET /api/mobile/jobs?staffId={staffId}
↓
Returns all jobs where:
  - status: 'pending' (unassigned)
  - broadcastToAll: true
  - OR assignedStaffId: staffId
↓
Staff sees available jobs
```

### 3. **Staff Accepts Job** (Mobile App)
```
Staff clicks "Accept Job"
↓
Mobile app calls: PATCH /api/mobile/jobs
Body: {
  jobId: "job_123",
  staffId: "staff_456",
  status: "assigned"  // or "accepted"
}
↓
JobAssignmentService.updateJobStatus()
↓
Job document updated:
  - status: "assigned" → "accepted"
  - assignedStaffId: "staff_456"
  - assignedAt: timestamp
  - statusHistory: [...previous, new entry]
  - updatedAt: timestamp
↓
Notification sent to staff
```

### 4. **Calendar Updates Automatically**
```
EnhancedFullCalendar component (browser)
↓
Listens to 'operational_jobs' collection via onSnapshot
↓
Detects job change (assignedStaffId updated)
↓
Re-renders calendar event with:
  - Job title with 🔧 emoji
  - Staff name displayed
  - Color: Green (cleaning), Red (maintenance), Orange (inspection)
  - Status indicator
↓
Admin sees updated calendar immediately
```

### 5. **Job Progression** (Staff continues work)
```
Staff → "Start Job"
  → status: "in_progress"
  → startedAt: timestamp

Staff → "Complete Job"
  → status: "completed"
  → completedAt: timestamp
  → completionPhotos: [...]
  → completionNotes: "..."

Admin → "Verify Job"
  → status: "verified"
  → verifiedAt: timestamp
```

## 📱 Mobile API Endpoints

### Accept/Update Job
```http
PATCH /api/mobile/jobs
Headers:
  X-API-Key: sia-moon-mobile-app-2025-secure-key
  X-Mobile-Secret: mobile-app-sync-2025-secure
Body:
{
  "jobId": "XzK3v3cb4IiU5ZKqTLcN",
  "status": "accepted",
  "staffId": "staff_123",
  "notes": "On my way to property"
}

Response:
{
  "success": true,
  "data": {
    "jobId": "XzK3v3cb4IiU5ZKqTLcN",
    "newStatus": "accepted",
    "updatedAt": "2026-01-07T..."
  }
}
```

### Get Available Jobs
```http
GET /api/mobile/jobs?staffId=staff_123&status=pending
Headers:
  X-API-Key: sia-moon-mobile-app-2025-secure-key
  X-Mobile-Secret: mobile-app-sync-2025-secure

Response:
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "XzK3v3cb4IiU5ZKqTLcN",
        "title": "Pre-Arrival Cleaning - Beach Villa Sunset",
        "status": "pending",
        "jobType": "pre_arrival_cleaning",
        "priority": "high",
        "scheduledDate": "2026-01-07T08:00:00Z",
        "estimatedDuration": 120,
        "property": {
          "name": "Beach Villa Sunset",
          "address": "123 Beach Road, Patong, Phuket",
          "accessInstructions": "Gate code: 1234"
        },
        "booking": {
          "guestName": "Jane Test Guest",
          "checkInDate": "2026-01-07T15:00:00Z"
        }
      }
    ]
  }
}
```

## 🗄️ Database Schema

### operational_jobs Collection
```typescript
{
  // Job ID (auto-generated)
  id: "XzK3v3cb4IiU5ZKqTLcN",
  
  // Job Details
  jobType: "pre_arrival_cleaning",
  title: "Pre-Arrival Cleaning - Beach Villa Sunset",
  description: "Prepare property for guest arrival",
  status: "pending" | "assigned" | "accepted" | "in_progress" | "completed",
  priority: "high",
  
  // Scheduling
  scheduledFor: Timestamp,
  scheduledDate: Timestamp,
  estimatedDuration: 120, // minutes
  
  // Property Reference
  propertyId: "IPpRUm3DuvmiYFBvWzpy",
  propertyName: "Beach Villa Sunset",
  
  // Booking Reference
  bookingId: "XoRHYcjFYjsw8hOK9vv6",
  
  // Staff Assignment
  assignedStaffId: null | "staff_456", // null = unassigned
  assignedAt: null | Timestamp,
  
  // Broadcasting
  broadcastToAll: true, // Makes job visible to all cleaners
  requiredRole: "cleaner",
  
  // Requirements
  requiredSkills: ["cleaning"],
  requirements: {
    skills: ["cleaning"],
    equipment: ["vacuum", "cleaning supplies"]
  },
  
  // Completion
  completedAt: null | Timestamp,
  completionNotes: null | "string",
  completionPhotos: [],
  
  // Tracking
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBySystem: true,
  source: "booking_automation"
}
```

## 🎯 Real-Time Updates

### Calendar Component (EnhancedFullCalendar.tsx)
```typescript
// Lines 117-200
useEffect(() => {
  // Listen to operational_jobs collection
  const jobsQuery = query(
    collection(db, 'operational_jobs'),
    orderBy('createdAt', 'desc')
  )

  const jobsUnsubscribe = onSnapshot(jobsQuery, (snapshot) => {
    const jobEvents: CalendarEvent[] = []

    snapshot.forEach((doc) => {
      const job = doc.data()
      
      // When assignedStaffId changes from null to staffId:
      // - Calendar event automatically updates
      // - Shows staff name
      // - Updates color/status
      
      jobEvents.push({
        id: `job-${doc.id}`,
        title: `🔧 ${job.title}`,
        start: job.scheduledFor.toDate().toISOString(),
        extendedProps: {
          assignedStaff: job.assignedStaffId ? getStaffName(job.assignedStaffId) : 'Unassigned',
          status: job.status,
          jobType: job.jobType
        }
      })
    })

    setEvents([...bookingEvents, ...jobEvents]) // Calendar updates!
  })

  return () => jobsUnsubscribe()
}, [])
```

## ✅ What Happens When Staff Accepts Job

1. **Mobile App**: Staff clicks "Accept" → Sends PATCH request with staffId
2. **API**: `/api/mobile/jobs` receives request → Calls `JobAssignmentService.updateJobStatus()`
3. **Firestore**: Job document updated with `assignedStaffId` and `status: 'accepted'`
4. **Real-time Listener**: `onSnapshot` in calendar component detects change
5. **Calendar**: Re-renders event with staff name and updated status
6. **Admin View**: Sees job assigned to specific cleaner in real-time
7. **Staff Profile**: Job added to staff member's active jobs list

## 🔧 Testing the Flow

### Manual Test Script
```bash
# 1. Check current jobs
node scripts/check-current-state.mjs

# 2. Simulate staff acceptance via API
curl -X PATCH http://localhost:3000/api/mobile/jobs \
  -H "X-API-Key: sia-moon-mobile-app-2025-secure-key" \
  -H "X-Mobile-Secret: mobile-app-sync-2025-secure" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "XzK3v3cb4IiU5ZKqTLcN",
    "status": "accepted",
    "staffId": "staff_test_123",
    "notes": "Accepted from mobile app"
  }'

# 3. Check calendar updates immediately
# Open: http://localhost:3000/calendar
```

## 📝 Current Implementation Status

✅ **COMPLETED:**
- AutomaticJobCreationService creates jobs automatically
- Jobs broadcast to all cleaners (`broadcastToAll: true`)
- Mobile API endpoints for job listing and updates
- JobAssignmentService.updateJobStatus() handles staff assignment
- Calendar real-time listener for job updates
- Jobs appear on calendar with correct dates and colors

✅ **WORKING FLOW:**
- Booking → Jobs Created → Mobile App Shows Jobs → Staff Accepts → Calendar Updates

🎯 **READY FOR PRODUCTION:**
- Mobile app just needs to call existing API endpoints
- All backend services are fully functional
- Real-time updates already implemented
- No additional code needed!

## 🚀 Next Steps (Mobile App Integration)

The mobile app developer needs to:

1. **Implement Job List Screen**
   - Call: `GET /api/mobile/jobs?staffId={id}&status=pending`
   - Display available jobs

2. **Add "Accept Job" Button**
   - On click: `PATCH /api/mobile/jobs` with `status: "accepted"`
   - Update local UI

3. **Job Progress Updates**
   - "Start Job": `status: "in_progress"`
   - "Complete Job": `status: "completed"` + photos + notes

4. **Test Authentication**
   - Use provided API key and secret
   - Store staff ID after login

That's it! The backend is 100% ready! 🎉
