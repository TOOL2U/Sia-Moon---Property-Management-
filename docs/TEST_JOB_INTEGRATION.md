# Test Job Integration Documentation

## Overview
This document describes the test job functionality implemented to verify mobile app synchronization with the web application through Firebase.

## 🎯 Purpose
- **Verify mobile app sync**: Ensure jobs created in the web app appear correctly in the mobile app
- **Test Firebase integration**: Validate that the Firebase job schema matches mobile app expectations
- **Debug connectivity**: Troubleshoot any sync issues between web and mobile platforms

## 📱 Mobile App Integration

### Firebase Job Schema
The test jobs use the exact schema expected by the mobile app:

```typescript
interface FirebaseJobSchema {
  id: string                    // Unique job identifier
  assignedStaffId: string       // Staff member Firebase UID
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  propertyId: string           // Property identifier
  bookingId: string            // Related booking identifier
  title: string                // Job title/name
  description: string          // Job description and instructions
  startTime: string            // ISO 8601 datetime string
  location: {
    lat: number                // Latitude coordinate
    lng: number                // Longitude coordinate
  }
  photos?: string[]            // Optional array of photo URLs
  createdAt: Timestamp         // Firebase server timestamp
}
```

### Default Test Job Values
```typescript
{
  id: "test_job_001",
  assignedStaffId: "iJxnTcy4xWZIoDVNnl5AgYSVPku2",
  status: "pending",
  propertyId: "tQK2ouHsHR6PVdS36f9B",
  bookingId: "dummy_booking_001",
  title: "Test Villa Cleaning",
  description: "Villa Cleaning – Sia Moon (Test Job)",
  startTime: "2024-01-15T10:00:00.000Z", // Current timestamp
  location: {
    lat: 9.7108,   // Koh Samui coordinates
    lng: 100.0136
  },
  photos: [],
  createdAt: serverTimestamp()
}
```

## 🔧 Implementation Details

### Test Job Service (`src/services/TestJobService.ts`)
Provides multiple methods for creating test jobs:

#### 1. Basic Test Job
```typescript
await TestJobService.createTestJob()
```
- Creates a single test job with default values
- Returns: `{ success: boolean, jobId: string, error?: string }`

#### 2. Custom Test Job
```typescript
await TestJobService.createCustomTestJob({
  jobId: 'custom_job_123',
  assignedStaffId: 'different_staff_id',
  title: 'Custom Test Job',
  location: { lat: 10.0, lng: 101.0 }
})
```
- Allows customization of job parameters
- Useful for testing different scenarios

#### 3. Multiple Test Jobs
```typescript
await TestJobService.createMultipleTestJobs(5)
```
- Creates multiple test jobs for stress testing
- Each job has slight variations in location and title

#### 4. Test Job Suite
```typescript
await TestJobService.createTestJobSuite()
```
- Creates jobs with different statuses (pending, accepted, in_progress)
- Comprehensive testing of all job states

### UI Integration

#### Test Job Buttons Added To:
1. **Job Management Dashboard** (`src/components/admin/JobManagementDashboard.tsx`)
   - "Send Test Job" button
   - "Test Suite" button for multiple jobs

2. **Job Progress Dashboard** (`src/components/admin/JobProgressDashboard.tsx`)
   - "Test Job" button in header

3. **Back Office Page** (`src/app/admin/backoffice/page.tsx`)
   - "Test Job" button in main dashboard header

#### Button Behavior:
- Shows loading state while creating job
- Displays success toast with job ID
- Shows error toast if creation fails
- Logs detailed information to console

## 🧪 Testing Procedures

### 1. Basic Sync Test
1. Open web app admin dashboard
2. Click "Send Test Job" button
3. Check mobile app for new job notification
4. Verify job details match exactly

### 2. Multiple Jobs Test
1. Click "Test Suite" button
2. Verify 3 jobs created with different statuses
3. Check mobile app receives all jobs
4. Verify status filtering works correctly

### 3. Custom Job Test
```typescript
// In browser console
await TestJobService.createCustomTestJob({
  assignedStaffId: 'your_staff_id',
  title: 'Custom Test',
  location: { lat: 9.7200, lng: 100.0200 }
})
```

### 4. Firebase Verification
```typescript
// Test Firebase connection
await TestJobService.verifyFirebaseConnection()
```

## 📊 Monitoring & Debugging

### Console Logs
The service provides detailed logging:
- `🧪 Creating test job for mobile app...`
- `✅ Test job created successfully: test_job_001`
- `📱 Job data sent to mobile app: {...}`
- `❌ Error creating test job: {...}`

### Toast Notifications
- Success: `✅ Test job assigned to staff - Job ID: test_job_001`
- Error: `❌ Failed to send test job: [error message]`

### Firebase Console
1. Go to Firebase Console → Firestore Database
2. Navigate to `/jobs` collection
3. Look for test job documents
4. Verify schema matches exactly

## 🔍 Troubleshooting

### Common Issues

#### 1. Job Not Appearing in Mobile App
- **Check**: Firebase permissions and authentication
- **Verify**: Staff ID exists and is correct
- **Test**: Firebase connection with `verifyFirebaseConnection()`

#### 2. Schema Mismatch Errors
- **Check**: Job structure matches `FirebaseJobSchema` exactly
- **Verify**: All required fields are present
- **Test**: Run schema validation tests

#### 3. Permission Errors
- **Check**: Firebase security rules allow job creation
- **Verify**: Admin user has write permissions
- **Test**: Try creating job manually in Firebase console

### Debug Commands
```typescript
// Get job schema documentation
TestJobService.getJobSchema()

// Test Firebase connectivity
await TestJobService.verifyFirebaseConnection()

// Create job with full logging
console.log('Creating test job...')
const result = await TestJobService.createTestJob()
console.log('Result:', result)
```

## 📋 Validation Checklist

Before considering sync working correctly:

- [ ] Test job appears in Firebase `/jobs` collection
- [ ] Mobile app receives real-time notification
- [ ] Job details display correctly in mobile app
- [ ] Job status can be updated from mobile app
- [ ] Status updates sync back to web app
- [ ] Location coordinates are accurate
- [ ] Staff assignment is correct
- [ ] Timestamps are in correct timezone

## 🚀 Next Steps

After successful testing:
1. Remove test job functionality from production
2. Implement real job creation workflow
3. Add proper error handling and validation
4. Set up monitoring for job sync failures
5. Create automated tests for continuous integration

## 📞 Support

If sync issues persist:
1. Check Firebase console for errors
2. Verify mobile app Firebase configuration
3. Test with different staff IDs
4. Check network connectivity
5. Review Firebase security rules

## 🔗 Related Files
- `src/services/TestJobService.ts` - Main test job service
- `src/components/admin/JobManagementDashboard.tsx` - Job management UI
- `src/components/admin/JobProgressDashboard.tsx` - Progress dashboard UI
- `src/app/admin/backoffice/page.tsx` - Back office integration
- `src/__tests__/test-job-service.test.ts` - Unit tests
