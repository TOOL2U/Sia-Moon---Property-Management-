# 🎯 PROPERTY MATCHING & AUTOMATION SYSTEM
## 3-Phase Implementation Plan

**Status:** Ready for Implementation  
**Priority:** CRITICAL - Core Business Dependency  
**Approach:** Defensive, Fail-Safe, Deterministic

---

## ✅ PRE-IMPLEMENTATION CONFIRMATIONS

### 1. External ID Strategy ✓
**Primary Match Key:** `pmsListingId` (stable across all PMS platforms)

**Fallback Chain:**
```
1. pmsListingId        ← PRIMARY (Hostaway/Guesty/Smoobu)
2. airbnbListingId     ← BACKUP (if PMS exposes it)
3. propertyExternalId  ← MANUAL OVERRIDE
4. propertyName        ← ⚠️ TRIGGERS MANUAL REVIEW
```

### 2. Current System Analysis ✓
**Existing Property Model:** `/src/types/property.ts`
- ✅ Has comprehensive `PropertyLocation` with coordinates
- ✅ Has `PropertyImage[]` array
- ✅ Has `BookingSettings` with check-in instructions
- ❌ **MISSING:** External ID fields for PMS matching
- ❌ **MISSING:** PMS provider tracking

**Current Job Creation:** `/src/services/AutomaticJobCreationService.ts`
- ✅ Already fetches complete property data (line 596)
- ✅ Includes propertyRef in jobs
- ⚠️ **ASSUMPTION:** Property must exist before job creation

### 3. Delivery Commitment ✓
**Phases:**
1. Property Model + Matching Logic (Foundation)
2. Webhook Resolution + Fail-Safe (Safety)
3. Automation Output + Admin UI (Scale)

**Each phase includes:**
- Code implementation
- Firebase structure updates
- Admin UI components
- Testing scripts
- Documentation

---

## 🔹 PHASE 1: PROPERTY IDENTITY & MATCHING (Foundation)

### Objective
Make property matching deterministic and future-proof using stable external IDs.

### 1.1 Property Model Extensions

**File:** `/src/types/property.ts`

Add to `Property` interface:
```typescript
export interface Property {
  // ... existing fields ...
  
  // PMS Integration (NEW)
  pmsIntegration: {
    provider: PMSProvider           // 'hostaway' | 'guesty' | 'smoobu' | 'manual'
    pmsListingId?: string           // PRIMARY matching key
    airbnbListingId?: string        // Airbnb-specific ID
    bookingComListingId?: string    // Booking.com listing ID
    vrboListingId?: string          // VRBO listing ID
    externalIds?: Record<string, string>  // Future channels
    lastSyncedAt?: string
    syncEnabled: boolean
    syncErrors?: PMSSyncError[]
  }
  
  // Enhanced Location (already exists, enhance with)
  location: PropertyLocation & {
    googleMapsLink?: string         // Direct link for mobile nav
    accessInstructions?: string     // How to get there
    parkingInstructions?: string
    entryCode?: string              // Door/gate codes
  }
  
  // Enhanced Images (already exists in PropertyImage[])
  propertyPhotos: PropertyImage[]   // Alias for mobile compatibility
}

export type PMSProvider = 
  | 'hostaway'
  | 'guesty' 
  | 'smoobu'
  | 'lodgify'
  | 'cloudbeds'
  | 'manual'
  | 'other'

export interface PMSSyncError {
  timestamp: string
  error: string
  severity: 'warning' | 'error'
  resolved: boolean
}
```

### 1.2 Property Matching Service

**New File:** `/src/services/PropertyMatchingService.ts`

```typescript
/**
 * PropertyMatchingService
 * 
 * Deterministic property matching using external IDs.
 * NEVER uses fuzzy string matching - always requires explicit IDs.
 */

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'

export interface PropertyMatchResult {
  success: boolean
  propertyId?: string
  property?: any
  matchMethod: 'pmsListingId' | 'airbnbListingId' | 'externalId' | 'manual' | 'none'
  confidence: 'high' | 'medium' | 'low'
  requiresReview: boolean
  warnings: string[]
}

export class PropertyMatchingService {
  /**
   * Match property using stable external IDs (NO fuzzy matching)
   */
  static async matchProperty(bookingData: {
    pmsListingId?: string
    airbnbListingId?: string
    propertyExternalId?: string
    propertyName?: string  // Display only, not for matching
  }): Promise<PropertyMatchResult> {
    
    const warnings: string[] = []
    
    // PRIORITY 1: Match by pmsListingId (most reliable)
    if (bookingData.pmsListingId) {
      const result = await this.matchByPMSListingId(bookingData.pmsListingId)
      if (result) {
        return {
          success: true,
          propertyId: result.id,
          property: result,
          matchMethod: 'pmsListingId',
          confidence: 'high',
          requiresReview: false,
          warnings: []
        }
      }
      warnings.push(`No property found with pmsListingId: ${bookingData.pmsListingId}`)
    }
    
    // PRIORITY 2: Match by airbnbListingId
    if (bookingData.airbnbListingId) {
      const result = await this.matchByAirbnbListingId(bookingData.airbnbListingId)
      if (result) {
        warnings.push('Matched via Airbnb ID - consider adding pmsListingId for reliability')
        return {
          success: true,
          propertyId: result.id,
          property: result,
          matchMethod: 'airbnbListingId',
          confidence: 'medium',
          requiresReview: false,
          warnings
        }
      }
      warnings.push(`No property found with airbnbListingId: ${bookingData.airbnbListingId}`)
    }
    
    // PRIORITY 3: Match by propertyExternalId (manual override)
    if (bookingData.propertyExternalId) {
      const result = await this.matchByExternalId(bookingData.propertyExternalId)
      if (result) {
        warnings.push('Matched via manual external ID')
        return {
          success: true,
          propertyId: result.id,
          property: result,
          matchMethod: 'externalId',
          confidence: 'medium',
          requiresReview: false,
          warnings
        }
      }
      warnings.push(`No property found with externalId: ${bookingData.propertyExternalId}`)
    }
    
    // FAIL-SAFE: No match found
    warnings.push('⚠️ NO PROPERTY MATCH - Manual intervention required')
    warnings.push(`Property name from booking: ${bookingData.propertyName || 'Unknown'}`)
    
    return {
      success: false,
      matchMethod: 'none',
      confidence: 'low',
      requiresReview: true,
      warnings
    }
  }
  
  private static async matchByPMSListingId(pmsListingId: string): Promise<any | null> {
    const q = query(
      collection(db, 'properties'),
      where('pmsIntegration.pmsListingId', '==', pmsListingId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  }
  
  private static async matchByAirbnbListingId(airbnbListingId: string): Promise<any | null> {
    const q = query(
      collection(db, 'properties'),
      where('pmsIntegration.airbnbListingId', '==', airbnbListingId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  }
  
  private static async matchByExternalId(externalId: string): Promise<any | null> {
    // Query properties collection by ID directly
    const q = query(
      collection(db, 'properties'),
      where('__name__', '==', externalId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  }
}
```

### 1.3 Firebase Structure Updates

**Collections to Add:**
```
properties/
  {propertyId}/
    pmsIntegration: {
      provider: 'hostaway'
      pmsListingId: 'HOST-12345'     ← Matching key
      airbnbListingId: 'ABN-67890'
      syncEnabled: true
      lastSyncedAt: timestamp
    }
    location: {
      address: '...'
      coordinates: { lat, lng }
      googleMapsLink: 'https://...'
      accessInstructions: '...'
    }
```

### Phase 1 Acceptance Criteria
- [x] Property model extended with PMS fields
- [ ] PropertyMatchingService implemented
- [ ] Firestore security rules updated for new fields
- [ ] Test script to verify matching logic
- [ ] Every property can be uniquely matched via external ID
- [ ] No booking proceeds without resolved property

### Phase 1 Deliverables
1. Updated `/src/types/property.ts`
2. New `/src/services/PropertyMatchingService.ts`
3. Firestore index creation script
4. Test script: `/scripts/test-property-matching.mjs`
5. Migration script: `/scripts/migrate-properties-add-pms-fields.mjs`

---

## 🔹 PHASE 2: WEBHOOK RESOLUTION & FAIL-SAFE HANDLING (Safety)

### Objective
Safely resolve properties before any automation runs. Unmatched bookings go to review queue.

### 2.1 Make.com Webhook Payload Requirements

**Required Fields:**
```json
{
  "source": "airbnb",
  "externalBookingId": "HMNB12345",
  "pmsProvider": "hostaway",
  "pmsListingId": "HOST-12345",         // ← PRIMARY matching key
  "airbnbListingId": "ABN-67890",       // ← Optional backup
  "propertyName": "Beach Villa Sunset", // Display only
  "checkInDate": "2026-02-15T15:00:00Z",
  "checkOutDate": "2026-02-20T11:00:00Z",
  "guestName": "John Smith",
  "guestCount": 4,
  "guestPhone": "+1234567890",
  "guestEmail": "john@example.com",
  "totalPrice": 1500,
  "currency": "USD",
  "specialRequests": "Late check-in"
}
```

### 2.2 Enhanced Webhook Endpoint

**File:** `/src/app/api/pms-webhook/route.ts` (new or replace existing)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PropertyMatchingService } from '@/services/PropertyMatchingService'
import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firestore'

/**
 * PMS Webhook Handler
 * 
 * FAIL-SAFE DESIGN:
 * 1. Validate auth
 * 2. Resolve property via PropertyMatchingService
 * 3. If NO MATCH: Store in unmatched_bookings, notify admin, STOP
 * 4. If MATCH: Create booking with full property data, trigger automation
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Validate webhook authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !isValidWebhookAuth(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // 2. Parse booking payload
    const bookingData = await request.json()
    
    console.log('📥 Webhook received:', {
      source: bookingData.source,
      externalId: bookingData.externalBookingId,
      pmsListingId: bookingData.pmsListingId,
      guest: bookingData.guestName
    })
    
    // 3. Resolve property (CRITICAL STEP)
    const matchResult = await PropertyMatchingService.matchProperty({
      pmsListingId: bookingData.pmsListingId,
      airbnbListingId: bookingData.airbnbListingId,
      propertyName: bookingData.propertyName
    })
    
    // 4. FAIL-SAFE: No property match found
    if (!matchResult.success) {
      console.warn('⚠️ UNMATCHED BOOKING - Storing for manual review')
      
      // Store in unmatched_bookings collection
      await addDoc(collection(db, 'unmatched_bookings'), {
        ...bookingData,
        matchAttempt: matchResult,
        status: 'pending_review',
        createdAt: Timestamp.now(),
        notificationSent: false
      })
      
      // Notify admin (dashboard alert + email)
      await notifyUnmatchedBooking(bookingData, matchResult.warnings)
      
      // Return success but indicate manual review needed
      return NextResponse.json({
        success: true,
        requiresReview: true,
        message: 'Booking stored - property matching required',
        warnings: matchResult.warnings
      })
    }
    
    // 5. SUCCESS: Property matched - create booking with full data
    console.log('✅ Property matched:', {
      propertyId: matchResult.propertyId,
      method: matchResult.matchMethod,
      confidence: matchResult.confidence
    })
    
    // Attach complete property data to booking
    const enrichedBooking = {
      ...bookingData,
      propertyId: matchResult.propertyId,
      propertyName: matchResult.property.name,
      propertyLocation: matchResult.property.location,
      propertyPhotos: matchResult.property.images || [],
      accessInstructions: matchResult.property.location?.accessInstructions,
      checkInTime: matchResult.property.details?.checkInTime,
      checkOutTime: matchResult.property.details?.checkOutTime,
      matchMetadata: {
        method: matchResult.matchMethod,
        confidence: matchResult.confidence,
        matchedAt: Timestamp.now()
      },
      status: 'pending',
      createdAt: Timestamp.now(),
      source: bookingData.source || 'webhook'
    }
    
    // Create booking in pending_bookings
    const bookingRef = await addDoc(
      collection(db, 'pending_bookings'),
      enrichedBooking
    )
    
    console.log('📝 Booking created:', bookingRef.id)
    
    // 6. Trigger automation (calendar + jobs) will happen via
    // existing AutomaticJobCreationService monitoring pending_bookings
    
    return NextResponse.json({
      success: true,
      bookingId: bookingRef.id,
      propertyId: matchResult.propertyId,
      matchMethod: matchResult.matchMethod,
      automationTriggered: true
    })
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function isValidWebhookAuth(authHeader: string): boolean {
  const expectedToken = process.env.PMS_WEBHOOK_SECRET
  return authHeader === `Bearer ${expectedToken}`
}

async function notifyUnmatchedBooking(booking: any, warnings: string[]) {
  // Implementation: Send to admin dashboard + email/SMS
  console.log('📧 Notifying admin of unmatched booking:', {
    guest: booking.guestName,
    property: booking.propertyName,
    warnings
  })
  
  // TODO: Add to admin notifications collection
  await addDoc(collection(db, 'admin_notifications'), {
    type: 'unmatched_booking',
    severity: 'high',
    title: `Unmatched Booking: ${booking.guestName}`,
    message: `Property "${booking.propertyName}" could not be matched. Manual assignment required.`,
    bookingId: booking.externalBookingId,
    warnings,
    createdAt: Timestamp.now(),
    read: false,
    actionRequired: true
  })
}
```

### 2.3 New Collections

```
unmatched_bookings/
  {bookingId}/
    ...bookingData
    matchAttempt: {
      success: false
      warnings: [...]
      confidence: 'low'
    }
    status: 'pending_review'
    assignedProperty?: null
    resolvedAt?: null
    resolvedBy?: null

admin_notifications/
  {notificationId}/
    type: 'unmatched_booking'
    severity: 'high'
    bookingId: string
    read: false
    actionRequired: true
    createdAt: timestamp
```

### Phase 2 Acceptance Criteria
- [ ] Webhook validates auth token
- [ ] Property matching happens BEFORE any automation
- [ ] Unmatched bookings stored in separate collection
- [ ] Admin receives immediate notification
- [ ] NO calendar blocks or jobs created for unmatched bookings
- [ ] Matched bookings include full property data

### Phase 2 Deliverables
1. `/src/app/api/pms-webhook/route.ts` (enhanced)
2. Admin notification system
3. Firestore security rules for unmatched_bookings
4. Webhook testing script
5. Make.com webhook configuration guide

---

## 🔹 PHASE 3: AUTOMATION OUTPUT & ADMIN UI (Scale)

### Objective
Complete automation pipeline + admin tools for property management and unmatched booking resolution.

### 3.1 Enhanced Job Creation Payload

**Modify:** `/src/services/AutomaticJobCreationService.ts`

Jobs must include ALL navigation/property data:

```typescript
const job = {
  title: `${jobTemplate.name}`,
  description: jobTemplate.description,
  jobType: jobTemplate.jobType,
  priority: jobTemplate.priority,
  
  // Complete Property Data (for mobile render-only)
  propertyId: booking.propertyId,
  propertyName: propertyData.name,
  propertyPhotos: propertyData.images || [],
  accessInstructions: propertyData.location?.accessInstructions || '',
  
  // Navigation Data
  location: {
    address: propertyData.location.address,
    city: propertyData.location.city,
    lat: propertyData.location.coordinates?.latitude,
    lng: propertyData.location.coordinates?.longitude,
    googleMapsLink: propertyData.location.googleMapsLink || 
      `https://www.google.com/maps/search/?api=1&query=${propertyData.location.coordinates?.latitude},${propertyData.location.coordinates?.longitude}`
  },
  
  // Booking Context
  bookingRef: {
    id: bookingId,
    guestName: booking.guestName,
    guestCount: booking.guestCount || 1,
    checkIn: booking.checkInDate,
    checkOut: booking.checkOutDate,
    source: booking.source
  },
  
  // Job Scheduling
  scheduledDate: jobTemplate.scheduledDate,
  estimatedDuration: jobTemplate.estimatedDuration,
  
  // Special Instructions
  specialNotes: `
Guest Count: ${booking.guestCount || 1}
Check-in: ${booking.checkInDate}
Check-out: ${booking.checkOutDate}
${booking.specialRequests ? `\nSpecial Requests: ${booking.specialRequests}` : ''}
  `.trim(),
  
  status: 'pending',
  createdAt: Timestamp.now()
}
```

### 3.2 Admin UI Components

#### Component 1: Property Mapping Page

**File:** `/src/app/admin/properties/mapping/page.tsx`

```typescript
/**
 * Property Mapping Manager
 * 
 * Allows admins to:
 * - View all properties with PMS integration status
 * - Add/edit pmsListingId for each property
 * - Bulk import PMS mappings from CSV
 * - Test property matching
 */

'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc } from 'firestore'

export default function PropertyMappingPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI: Table showing all properties with editable PMS fields
  // Columns: Property Name | PMS Provider | PMS Listing ID | Airbnb ID | Status | Actions
  
  return (
    <div>
      <h1>Property PMS Mapping</h1>
      {/* Table with inline editing */}
      {/* Bulk import button */}
      {/* Test matching button */}
    </div>
  )
}
```

#### Component 2: Unmatched Bookings Queue

**File:** `/src/app/admin/bookings/unmatched/page.tsx`

```typescript
/**
 * Unmatched Bookings Queue
 * 
 * Allows admins to:
 * - View all bookings awaiting property assignment
 * - Manually assign property to booking
 * - Trigger reprocessing after assignment
 * - View match attempt details
 */

'use client'

export default function UnmatchedBookingsPage() {
  // UI: List of unmatched bookings
  // Each row: Guest | Property Name | Check-in | Source | Actions
  // Actions: Assign Property (dropdown) | View Details | Dismiss
  
  async function assignProperty(bookingId: string, propertyId: string) {
    // 1. Update unmatched booking with propertyId
    // 2. Move to pending_bookings
    // 3. Trigger automation (calendar + jobs)
    // 4. Mark notification as resolved
  }
  
  return (
    <div>
      <h1>Unmatched Bookings</h1>
      {/* Queue table */}
    </div>
  )
}
```

### 3.3 Calendar Integration

**No changes needed** - calendar already reads from bookings collection.
Once booking has `propertyId`, calendar will display it automatically.

### Phase 3 Acceptance Criteria
- [ ] Jobs include complete property + navigation data
- [ ] Mobile app receives all needed info (no additional fetches)
- [ ] Property mapping UI functional
- [ ] Unmatched bookings queue functional
- [ ] Manual assignment triggers full automation
- [ ] End-to-end flow: Webhook → Property Match → Booking → Calendar → Jobs → Mobile

### Phase 3 Deliverables
1. Enhanced AutomaticJobCreationService
2. Property mapping admin page
3. Unmatched bookings queue page
4. Admin notification center
5. Complete end-to-end test script
6. Operator training guide

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Update Property TypeScript types
- [ ] Create PropertyMatchingService
- [ ] Write property matching tests
- [ ] Create Firestore indexes
- [ ] Migration script for existing properties
- [ ] Documentation

### Phase 2: Webhook Safety
- [ ] Implement /api/pms-webhook endpoint
- [ ] Add unmatched_bookings collection
- [ ] Add admin_notifications collection
- [ ] Webhook authentication
- [ ] Admin notification system
- [ ] Webhook testing suite
- [ ] Make.com configuration guide

### Phase 3: Automation + Admin
- [ ] Enhance job creation payload
- [ ] Property mapping UI
- [ ] Unmatched bookings queue UI
- [ ] Manual assignment workflow
- [ ] End-to-end integration test
- [ ] Monitoring & alerts
- [ ] Training documentation

---

## 🚀 ROLLOUT PLAN

### Week 1: Phase 1 (Foundation)
- Days 1-2: Property model + matching service
- Days 3-4: Testing + migration
- Day 5: Review + adjustments

### Week 2: Phase 2 (Safety)
- Days 1-3: Webhook implementation
- Days 4-5: Testing + Make.com integration

### Week 3: Phase 3 (Scale)
- Days 1-2: Job payload enhancement
- Days 3-4: Admin UI
- Day 5: End-to-end testing

### Week 4: Deployment
- Days 1-2: Production deployment
- Days 3-5: Monitoring + support

---

## 📊 SUCCESS METRICS

1. **Property Match Rate:** Target 100% for known properties
2. **Automation Success Rate:** 95%+ bookings fully automated
3. **Manual Review Time:** < 5 minutes per unmatched booking
4. **Job Creation Accuracy:** 100% with correct property data
5. **Mobile App Satisfaction:** No missing property info complaints

---

## ⚠️ RISK MITIGATION

### Risk: PMS doesn't provide stable listing IDs
**Mitigation:** Fallback to manual propertyExternalId mapping + admin UI for assignment

### Risk: Existing bookings lack propertyId
**Mitigation:** Migration script + unmatched queue handles backlog

### Risk: Calendar conflicts with multiple sources
**Mitigation:** Property resolution happens FIRST, calendar uses resolved propertyId

### Risk: Mobile app breaks without data
**Mitigation:** Jobs include ALL data, mobile never fetches property/booking separately

---

## 📝 NEXT STEPS

**Confirm and Proceed:**

1. **Which PMS provider are you using?** (Hostaway, Guesty, Smoobu, other?)
2. **Does your PMS webhook include a stable listing ID?** (Need to verify payload)
3. **Do you want me to start with Phase 1 implementation NOW?**

Once confirmed, I will:
- Begin Phase 1 implementation
- Create all files and code
- Provide testing scripts
- Guide you through Firebase setup

**Ready to proceed?** 🚀
