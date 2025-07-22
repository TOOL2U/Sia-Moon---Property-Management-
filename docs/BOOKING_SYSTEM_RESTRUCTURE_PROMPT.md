# 🏗️ Booking System Restructure - Development Team Prompt

## 📋 **Executive Summary**

The current booking system has grown organically and now requires restructuring to improve maintainability, testability, and performance. This document provides a comprehensive roadmap for the webapp development team to refactor the booking system into a more organized, scalable architecture.

## 🎯 **Project Objectives**

### Primary Goals
1. **Consolidate Data Architecture** - Reduce from 4+ collections to a unified approach
2. **Standardize API Endpoints** - Create consistent, RESTful APIs
3. **Implement Comprehensive Testing** - Unit, integration, and E2E tests
4. **Improve Performance** - Optimize database queries and data flow
5. **Enhance Developer Experience** - Clear separation of concerns and documentation

### Success Metrics
- [ ] Single source of truth for booking data
- [ ] 95%+ test coverage for booking workflows
- [ ] Sub-2s booking approval times
- [ ] Zero data inconsistency issues
- [ ] Clear API documentation with examples

## 🗄️ **Current System Analysis**

### Current Problems Identified
```typescript
// PROBLEM 1: Multiple Collections Chaos
Collections: pending_bookings, bookings, live_bookings, bookings_approved
Issues: Data duplication, inconsistent queries, sync problems

// PROBLEM 2: Workflow Complexity
Components: StaffAssignmentModal + CreateJobModal (competing)
Issue: "temporarily disabled workflows" causing hanging buttons

// PROBLEM 3: API Inconsistency
/api/bookings vs /api/admin/bookings/integrated vs /api/admin/bookings/pending
Issue: Different response formats, inconsistent error handling

// PROBLEM 4: Testing Gaps
Current: Minimal unit tests, no integration tests
Issue: Cannot verify booking flow end-to-end
```

## 🏛️ **New Architecture Design**

### 1. **Unified Data Model**

```typescript
// NEW: Single Booking Entity with State Management
interface UnifiedBooking {
  // Core Identity
  id: string
  bookingNumber: string // Human-readable: BK-2025-001234

  // Lifecycle State
  status: BookingStatus // See enum below
  workflow: WorkflowState // Current workflow position

  // Guest Information
  guest: {
    name: string
    email: string
    phone?: string
    guestCount: number
    specialRequests?: string
  }

  // Property Information
  property: {
    id: string
    name: string
    address: string
    coordinates?: { lat: number; lng: number }
  }

  // Booking Details
  dates: {
    checkIn: string // ISO 8601
    checkOut: string // ISO 8601
    nights: number
  }

  // Financial
  pricing: {
    amount: number
    currency: string
    breakdown?: PricingBreakdown
  }

  // Source & Metadata
  source: BookingSource
  createdAt: string
  updatedAt: string

  // Workflow Tracking
  approvalHistory: ApprovalEvent[]
  assignments: StaffAssignment[]

  // Sync & Mobile
  syncVersion: number
  mobileOptimized: MobileBookingData
}

// Clear Status Enum
enum BookingStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

// Workflow State Tracking
enum WorkflowState {
  INTAKE = 'intake',           // Just created
  REVIEW = 'review',           // Admin reviewing
  APPROVED = 'approved',       // Approved, awaiting assignment
  ASSIGNED = 'assigned',       // Staff assigned
  ACTIVE = 'active',          // Guest checked in
  COMPLETED = 'completed'      // All done
}
```

### 2. **Restructured Database Schema**

```
Firebase Collections:
├── bookings/                    # PRIMARY: All booking data
│   ├── {bookingId}/
│   │   ├── Core booking fields
│   │   ├── approvals/          # Subcollection: Approval history
│   │   ├── assignments/        # Subcollection: Staff assignments
│   │   └── timeline/           # Subcollection: Status history
│
├── booking_analytics/          # Analytics and reporting data
├── booking_templates/          # Templates for quick booking creation
└── archived_bookings/         # Completed/cancelled bookings (>6 months)

Legacy Collections (TO BE MIGRATED):
├── pending_bookings/          # MIGRATE TO: bookings/ with status=pending_approval
├── live_bookings/             # MIGRATE TO: bookings/ with status=approved/confirmed
└── bookings_approved/         # MIGRATE TO: bookings/ with status=completed
```

### 3. **API Restructure**

```typescript
// NEW: RESTful API Design
Base URL: /api/v2/bookings

// Core CRUD Operations
GET    /api/v2/bookings                    # List bookings with filtering
POST   /api/v2/bookings                    # Create new booking
GET    /api/v2/bookings/{id}               # Get booking details
PUT    /api/v2/bookings/{id}               # Update booking
DELETE /api/v2/bookings/{id}               # Cancel booking

// Workflow Operations
POST   /api/v2/bookings/{id}/approve       # Approve/reject booking
POST   /api/v2/bookings/{id}/assign        # Assign staff
POST   /api/v2/bookings/{id}/checkin       # Guest check-in
POST   /api/v2/bookings/{id}/checkout      # Guest check-out

// Specialized Endpoints
GET    /api/v2/bookings/pending            # Quick access to pending approvals
GET    /api/v2/bookings/analytics          # Booking analytics
POST   /api/v2/bookings/bulk               # Bulk operations
POST   /api/v2/bookings/webhook            # External webhook handler

// Mobile API (v2 compatible)
GET    /api/v2/mobile/bookings             # Mobile-optimized booking list
POST   /api/v2/mobile/sync                 # Bidirectional sync
```

### 4. **Service Layer Architecture**

```typescript
// NEW: Clean Service Architecture
src/services/booking/
├── BookingService.ts              # Core booking operations
├── BookingWorkflowService.ts      # Workflow management
├── BookingValidationService.ts    # Data validation
├── BookingNotificationService.ts  # Notifications
├── BookingAnalyticsService.ts     # Analytics & reporting
└── BookingMigrationService.ts     # Data migration

// Core Service Interface
export class BookingService {
  // CRUD Operations
  async createBooking(data: CreateBookingData): Promise<BookingResult>
  async getBooking(id: string): Promise<BookingDetails>
  async updateBooking(id: string, updates: BookingUpdates): Promise<BookingResult>
  async deleteBooking(id: string): Promise<void>

  // Query Operations
  async listBookings(filters: BookingFilters): Promise<BookingList>
  async searchBookings(query: string): Promise<BookingSearchResult>

  // Business Logic
  async approveBooking(id: string, approver: AdminUser): Promise<ApprovalResult>
  async assignStaff(id: string, assignment: StaffAssignment): Promise<AssignmentResult>
}

// Workflow Service
export class BookingWorkflowService {
  async transitionStatus(
    bookingId: string,
    fromStatus: BookingStatus,
    toStatus: BookingStatus,
    metadata: WorkflowMetadata
  ): Promise<WorkflowResult>

  async getAvailableTransitions(
    bookingId: string
  ): Promise<BookingStatus[]>

  async validateTransition(
    booking: UnifiedBooking,
    targetStatus: BookingStatus
  ): Promise<ValidationResult>
}
```

## 🧪 **Comprehensive Testing Strategy**

### 1. **Unit Tests**

```typescript
// Test File Structure
src/services/booking/__tests__/
├── BookingService.test.ts
├── BookingWorkflowService.test.ts
├── BookingValidationService.test.ts
└── test-utils/
    ├── mockBookingData.ts
    ├── firebaseTestUtils.ts
    └── assertionHelpers.ts

// Example Unit Test
describe('BookingService', () => {
  beforeEach(() => {
    // Setup Firebase emulator
    // Initialize test data
  })

  describe('createBooking', () => {
    it('should create booking with valid data', async () => {
      const bookingData = createMockBookingData()
      const result = await BookingService.createBooking(bookingData)

      expect(result.success).toBe(true)
      expect(result.booking.status).toBe(BookingStatus.PENDING_APPROVAL)
      expect(result.booking.bookingNumber).toMatch(/^BK-2025-\d{6}$/)
    })

    it('should reject invalid guest data', async () => {
      const invalidData = { ...createMockBookingData(), guest: { name: '' } }

      await expect(BookingService.createBooking(invalidData))
        .rejects.toThrow('Guest name is required')
    })
  })
})
```

### 2. **Integration Tests**

```typescript
// Integration Test Example
describe('Booking Approval Workflow', () => {
  it('should complete full approval to assignment flow', async () => {
    // 1. Create booking
    const booking = await BookingService.createBooking(mockBookingData)
    expect(booking.status).toBe(BookingStatus.PENDING_APPROVAL)

    // 2. Approve booking
    const approval = await BookingWorkflowService.approveBooking(
      booking.id,
      mockAdminUser
    )
    expect(approval.success).toBe(true)
    expect(approval.booking.status).toBe(BookingStatus.APPROVED)

    // 3. Verify calendar event created
    const calendarEvents = await CalendarService.getEventsForBooking(booking.id)
    expect(calendarEvents).toHaveLength(1)

    // 4. Assign staff
    const assignment = await BookingService.assignStaff(
      booking.id,
      mockStaffAssignment
    )
    expect(assignment.success).toBe(true)

    // 5. Verify notification sent
    const notifications = await NotificationService.getNotificationsForStaff(
      mockStaffAssignment.staffId
    )
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('job_assigned')
  })
})
```

### 3. **E2E Tests**

```typescript
// E2E Test with Playwright
describe('Booking Management E2E', () => {
  test('Admin can approve booking and assign staff', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/admin/login')
    await page.fill('[data-testid=email]', 'admin@test.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-btn]')

    // 2. Navigate to bookings
    await page.click('[data-testid=nav-bookings]')
    await expect(page.locator('[data-testid=bookings-list]')).toBeVisible()

    // 3. Find pending booking
    const pendingBooking = page.locator('[data-testid*=booking-][data-status=pending_approval]').first()
    await expect(pendingBooking).toBeVisible()

    // 4. Approve booking
    await pendingBooking.click('[data-testid=approve-btn]')
    await page.click('[data-testid=confirm-approval]')

    // 5. Verify approval success
    await expect(page.locator('[data-testid=success-toast]')).toContainText('Booking approved')

    // 6. Verify staff assignment modal opens
    await expect(page.locator('[data-testid=staff-assignment-modal]')).toBeVisible()

    // 7. Assign staff
    await page.click('[data-testid=staff-select]')
    await page.click('[data-testid=staff-option]:first-child')
    await page.click('[data-testid=assign-staff-btn]')

    // 8. Verify assignment success
    await expect(page.locator('[data-testid=assignment-success]')).toBeVisible()
  })
})
```

### 4. **Test Data Management**

```typescript
// Test Data Factory
export class BookingTestFactory {
  static createMockBooking(overrides?: Partial<UnifiedBooking>): UnifiedBooking {
    return {
      id: generateTestId(),
      bookingNumber: generateBookingNumber(),
      status: BookingStatus.PENDING_APPROVAL,
      workflow: WorkflowState.REVIEW,
      guest: {
        name: 'John Doe',
        email: 'john@test.com',
        guestCount: 2,
      },
      property: {
        id: 'prop_001',
        name: 'Test Villa',
        address: '123 Test Street',
      },
      dates: {
        checkIn: '2025-08-01',
        checkOut: '2025-08-07',
        nights: 6,
      },
      pricing: {
        amount: 1200,
        currency: 'USD',
      },
      source: BookingSource.DIRECT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalHistory: [],
      assignments: [],
      syncVersion: 1,
      mobileOptimized: {
        essentialData: {
          title: 'Test Villa - John Doe',
          address: '123 Test Street',
          checkIn: '2025-08-01',
          priority: 'medium',
        },
      },
      ...overrides,
    }
  }

  static createBulkTestBookings(count: number): UnifiedBooking[] {
    return Array.from({ length: count }, (_, index) =>
      this.createMockBooking({
        guest: { name: `Test Guest ${index + 1}`, email: `guest${index + 1}@test.com`, guestCount: 2 },
        dates: {
          checkIn: addDays(new Date(), index * 2).toISOString().split('T')[0],
          checkOut: addDays(new Date(), (index * 2) + 3).toISOString().split('T')[0],
          nights: 3,
        },
      })
    )
  }
}
```

## 📦 **Implementation Roadmap**

### Phase 1: Foundation (Week 1-2)
```bash
# Tasks:
1. Create new unified booking interface and types
2. Implement BookingService with core CRUD operations
3. Setup test infrastructure (Jest, Firebase emulator)
4. Create migration scripts for existing data

# Deliverables:
- [ ] UnifiedBooking interface
- [ ] BookingService class with basic operations
- [ ] Unit test setup
- [ ] Data migration strategy document
```

### Phase 2: API Restructure (Week 3-4)
```bash
# Tasks:
1. Implement new /api/v2/bookings endpoints
2. Create BookingWorkflowService
3. Setup integration tests
4. Implement data validation layer

# Deliverables:
- [ ] Complete API v2 implementation
- [ ] Workflow service with state management
- [ ] Integration test suite
- [ ] API documentation
```

### Phase 3: Frontend Refactor (Week 5-6)
```bash
# Tasks:
1. Refactor booking management components
2. Consolidate StaffAssignmentModal vs CreateJobModal
3. Implement E2E tests
4. Performance optimization

# Deliverables:
- [ ] Unified booking management interface
- [ ] Single staff assignment workflow
- [ ] E2E test coverage
- [ ] Performance benchmarks
```

### Phase 4: Migration & Deployment (Week 7-8)
```bash
# Tasks:
1. Data migration from legacy collections
2. Gradual API migration (v1 → v2)
3. Mobile app compatibility testing
4. Production deployment

# Deliverables:
- [ ] Completed data migration
- [ ] API versioning strategy
- [ ] Mobile app compatibility
- [ ] Production deployment plan
```

## 🔧 **Development Standards**

### Code Organization
```
src/
├── types/
│   └── booking.ts              # All booking-related types
├── services/
│   └── booking/               # Booking service layer
├── components/
│   └── booking/               # Booking UI components
├── pages/api/v2/
│   └── bookings/              # New API endpoints
├── hooks/
│   └── useBookings.ts         # React hooks for booking data
└── __tests__/
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── e2e/                   # E2E tests
```

### Naming Conventions
```typescript
// Files: PascalCase for components, camelCase for services
BookingManagement.tsx
bookingService.ts

// Functions: Verb-noun pattern
createBooking()
updateBookingStatus()
assignStaffToBooking()

// Test files: .test.ts or .spec.ts
BookingService.test.ts
booking-workflow.e2e.spec.ts

// Constants: UPPER_SNAKE_CASE
BOOKING_STATUS_TRANSITIONS
DEFAULT_BOOKING_DURATION
```

### Error Handling
```typescript
// Standardized Error Response
interface BookingError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Service Layer Error Handling
try {
  const result = await BookingService.createBooking(data)
  return { success: true, data: result }
} catch (error) {
  return {
    success: false,
    error: {
      code: 'BOOKING_CREATION_FAILED',
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    },
  }
}
```

## 📊 **Performance Requirements**

### Response Time Targets
- **Booking List Load**: < 2 seconds
- **Booking Approval**: < 1 second
- **Staff Assignment**: < 3 seconds
- **Calendar Sync**: < 5 seconds

### Database Optimization
```typescript
// Firestore Indexes Required
Collection: bookings
- status (ascending)
- createdAt (descending)
- property.id + dates.checkIn (compound)
- guest.email (ascending)

// Query Optimization Examples
const optimizedBookingQuery = query(
  collection(db, 'bookings'),
  where('status', '==', 'pending_approval'),
  orderBy('createdAt', 'desc'),
  limit(50)
)
```

## 🚀 **Testing Commands**

```bash
# Unit Tests
npm run test:unit
npm run test:unit:watch
npm run test:unit:coverage

# Integration Tests
npm run test:integration
npm run test:integration:booking-workflow

# E2E Tests
npm run test:e2e
npm run test:e2e:booking-management

# All Tests
npm run test:all
npm run test:ci

# Firebase Emulator
npm run firebase:emulators
npm run test:emulator

# Performance Tests
npm run test:performance
npm run test:load-booking-api
```

## 📋 **Quality Gates**

### Before Merge Requirements
- [ ] All unit tests pass (95%+ coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass for booking workflow
- [ ] API documentation updated
- [ ] Performance benchmarks met
- [ ] Code review approved by 2+ developers

### Definition of Done
- [ ] Feature works in all supported browsers
- [ ] Mobile app compatibility verified
- [ ] No breaking changes to existing functionality
- [ ] Error handling and logging implemented
- [ ] Monitoring and alerts configured

## 🔍 **Monitoring & Debugging**

### Logging Strategy
```typescript
// Structured Logging
import { Logger } from '@/utils/logger'

const logger = new Logger('BookingService')

logger.info('Booking created', {
  bookingId: booking.id,
  guestName: booking.guest.name,
  propertyId: booking.property.id,
  source: booking.source,
})

logger.error('Booking approval failed', {
  bookingId,
  error: error.message,
  adminId: approver.id,
  timestamp: new Date().toISOString(),
})
```

### Analytics Events
```typescript
// Track Key Business Events
analytics.track('booking_created', {
  bookingId: booking.id,
  source: booking.source,
  propertyType: booking.property.type,
  guestCount: booking.guest.guestCount,
  bookingValue: booking.pricing.amount,
})

analytics.track('booking_approved', {
  bookingId: booking.id,
  approvalTime: timeToApproval,
  adminId: approver.id,
})
```

## 📞 **Support & Communication**

### Development Team Contacts
- **Lead Developer**: Review architecture decisions
- **Backend Team**: API and database implementation
- **Frontend Team**: UI component development
- **QA Team**: Test strategy and execution
- **DevOps Team**: Deployment and monitoring

### Progress Reporting
- **Daily Standups**: Progress updates and blockers
- **Weekly Demo**: Show working features to stakeholders
- **Sprint Review**: Completed deliverables and metrics

### Decision Log
Document all major architectural decisions in:
`/docs/BOOKING_SYSTEM_DECISIONS.md`

---

## 🎯 **Success Criteria**

By the end of this restructure, the team should achieve:

1. **Single Source of Truth** - All booking data in unified `bookings` collection
2. **Comprehensive Test Coverage** - 95%+ coverage with unit, integration, and E2E tests
3. **Performance Improvement** - Sub-2s booking operations
4. **Developer Experience** - Clear APIs, good documentation, easy debugging
5. **Production Stability** - Zero data loss during migration, backward compatibility

**Timeline**: 8 weeks
**Team Size**: 4-6 developers
**Budget**: Technical debt reduction + improved system reliability

---

*This restructure will transform the booking system from a complex, hard-to-test codebase into a well-organized, thoroughly tested, and maintainable system that can scale with business growth.*
