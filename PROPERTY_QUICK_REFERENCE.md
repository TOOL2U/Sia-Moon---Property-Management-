# Property Management System - Quick Reference Guide

**Last Updated:** January 5, 2026  
**For:** Future Development & Troubleshooting

---

## 🚀 Quick Start

### Creating a Property (Admin)
1. Navigate to `/admin/backoffice`
2. Click "Properties" in sidebar
3. Click "Add Property" button
4. Complete 6-step wizard
5. Submit → Auto-redirects to admin dashboard

### Creating a Property (User)
1. Navigate to `/properties`
2. Click "Add Property" button  
3. Complete 6-step wizard
4. Submit → Redirects to properties list

---

## 📂 File Structure

```
Key Files:
├── src/app/properties/add/page.tsx          # Property Creation Wizard
├── src/app/api/admin/properties/route.ts    # API Endpoint (GET/POST)
├── src/app/admin/backoffice/page.tsx        # Admin Dashboard
├── src/components/property/
│   ├── PropertyDashboard.tsx                # Property Overview Component
│   └── PropertyListing.tsx                  # Property List Component
├── src/lib/services/propertyService.ts      # Property Business Logic
└── src/types/property.ts                    # TypeScript Types

Documentation:
├── PROPERTY_STORAGE_REPORT.md               # Full System Report
└── PROPERTY_QUICK_REFERENCE.md              # This File
```

---

## 🔧 Common Tasks

### View All Properties in Firebase
```bash
# Firebase Console
https://console.firebase.google.com/project/operty-b54dc/firestore

# Collection: properties
# View all documents and their data
```

### Test Property Creation
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to
http://localhost:3000/admin/backoffice

# 3. Go to Properties → Add Property
# 4. Check terminal logs for:
✅ Property created with ID: [document_id]
```

### Debug Property Issues
```javascript
// Check browser console for wizard errors
// Check terminal for API errors
// Verify Firebase document in console

// Common error locations:
1. Wizard validation: /properties/add/page.tsx (lines 140-165)
2. API validation: /api/admin/properties/route.ts (lines 65-82)
3. Firebase write: /api/admin/properties/route.ts (lines 125-130)
```

---

## 📊 Data Schema

### Firestore Collection: `properties`

```typescript
{
  // Required Fields
  name: string              // Property name
  address: string           // Full address
  
  // Core Details
  description: string       // Property description
  city: string             // City name
  country: string          // Country (default: "Thailand")
  bedrooms: number         // Number of bedrooms
  bathrooms: number        // Number of bathrooms
  maxGuests: number        // Maximum capacity
  
  // Location (Google Places)
  location: {
    lat: number,
    lng: number,
    placeId: string,
    formattedAddress: string
  } | null,
  
  // Amenities
  amenities: string[]      // Array of amenity IDs
  hasPool: boolean
  hasGarden: boolean
  hasAirConditioning: boolean
  hasParking: boolean
  hasLaundry: boolean
  hasBackupPower: boolean
  
  // Pricing
  pricePerNight: number
  currency: string         // Default: "THB"
  
  // Media
  photos: string[]         // URLs (pending implementation)
  
  // System
  userId: string           // Owner/creator ID
  status: string           // "active" | "inactive"
  isActive: boolean
  createdAt: Timestamp     // Server timestamp
  updatedAt: Timestamp     // Server timestamp
}
```

---

## 🎯 API Endpoints

### GET /api/admin/properties
**Purpose:** Fetch all properties for admin

**Response:**
```json
{
  "success": true,
  "properties": [...],
  "count": 6
}
```

### POST /api/admin/properties
**Purpose:** Create new property

**Request Body:**
```json
{
  "name": "Villa Paradise",
  "address": "123 Beach Road",
  "city": "Koh Phangan",
  "country": "Thailand",
  "bedrooms": 3,
  "bathrooms": 2,
  "maxGuests": 6,
  "amenities": ["wifi", "pool"],
  "hasPool": true,
  "pricePerNight": 5000,
  "currency": "THB",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "propertyId": "abc123",
  "property": {...}
}
```

---

## 🔍 Troubleshooting

### Property Not Appearing After Creation

**Check:**
1. ✅ Terminal logs show: `✅ Property created with ID: [id]`
2. ✅ No error in browser console
3. ✅ Redirect happened to admin dashboard
4. ✅ Properties section is active
5. ✅ Firebase console shows document

**Fix:**
```javascript
// Force refresh in PropertyDashboard or PropertyListing
// Click the "Refresh" button
// Or reload page with section parameter:
window.location.href = '/admin/backoffice?section=properties'
```

### Wizard Validation Errors

**Common Issues:**
- Empty required fields (name, address)
- Invalid numbers (bedrooms, bathrooms < 1)
- Invalid price (< 0)

**Fix:** Check validation in wizard:
```typescript
// File: /properties/add/page.tsx
// Function: validateCurrentStep()
```

### Firebase Permission Denied

**Issue:** User doesn't have write permissions

**Fix:** Update Firestore rules:
```javascript
// File: /firestore.rules
allow write: if request.auth != null;
```

---

## 🎨 Wizard Steps

### Step 1: Basic Info
- Property name *
- Address * (Google Places)
- Description *
- Location data (lat/lng)

### Step 2: Details
- Bedrooms (1+)
- Bathrooms (1+)
- Max Guests (1+)

### Step 3: Amenities
- Select from 27 amenities
- Boolean flags for key features

### Step 4: Pricing
- Price per night *
- Currency (default: THB)

### Step 5: Photos
- Image upload (pending)

### Step 6: Review
- Final verification
- Submit to API

---

## 🔗 Navigation Parameters

### Context-Aware Redirects

**From Admin:**
```
/properties/add?from=admin
→ Redirects to: /admin/backoffice?section=properties
```

**From User:**
```
/properties/add
→ Redirects to: /properties
```

### Section Navigation

**Direct to Properties:**
```
/admin/backoffice?section=properties
```

**Supported Sections:**
- dashboard
- bookings
- calendar
- properties
- staff
- onboarding
- financial
- operations
- reports
- settings

---

## 📈 Performance Tips

### Optimize Property List Loading
```typescript
// Use pagination in future
const limit = 20
const offset = 0

// Cache property data
const cacheKey = 'properties_list'
```

### Speed Up Creation
- Pre-fill common values
- Cache Google Places results
- Batch amenity updates
- Compress images before upload

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📞 Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/operty-b54dc
- **Local Server:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin/backoffice
- **Properties Page:** http://localhost:3000/properties
- **Add Property:** http://localhost:3000/properties/add

---

## ✅ System Status Checklist

**Core Functionality:**
- [x] Property creation wizard (6 steps)
- [x] Google Places integration
- [x] Firebase storage
- [x] Admin dashboard display
- [x] Context-aware navigation
- [x] Data validation
- [x] Error handling

**Pending:**
- [ ] Image upload & storage
- [ ] Property editing
- [ ] Property deletion
- [ ] Advanced search/filters
- [ ] Property analytics

---

## 🎯 Next Development Priorities

1. **Image Storage** - Implement Cloudinary/Firebase Storage
2. **Property Editing** - Add edit functionality
3. **Property Status** - Add workflow (draft/published)
4. **Search Enhancement** - Advanced filtering
5. **Real-time Updates** - Firebase listeners

---

**Quick Ref Version:** 1.0  
**Maintained By:** Development Team  
**Last Verified:** January 5, 2026
