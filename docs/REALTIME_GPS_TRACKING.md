# Real-time GPS Tracking Integration - Koh Phangan

## Overview

This document describes the implementation of real-time GPS tracking for staff members across Koh Phangan, Thailand using Firebase Firestore. The system provides live location updates, interactive map markers with island-themed visualization, and comprehensive staff monitoring capabilities.

## Architecture

### Firebase Integration

- **Collection**: `/staff_locations/{staffId}`
- **Real-time Listeners**: Uses `onSnapshot()` for live updates
- **Connection Management**: Handles online/offline states gracefully
- **Data Validation**: Filters recent locations (within 30 minutes)

### Component Structure

```
StaffLocationTracker.tsx
├── Firebase Real-time Listeners
├── Staff Profile Management
├── Interactive Map View
├── Status Monitoring
└── Connection State Management
```

## Data Structure

### Firestore Document (`/staff_locations/{staffId}`)

```typescript
interface FirebaseStaffLocation {
  staffId: string // Staff member identifier
  latitude: number // GPS latitude coordinate
  longitude: number // GPS longitude coordinate
  accuracy: number // GPS accuracy in meters
  timestamp: Timestamp // Firebase timestamp of location update
  isOnline?: boolean // Staff online status
  batteryLevel?: number // Device battery percentage (0-100)
}
```

### Staff Profile Data

```typescript
interface StaffProfile {
  id: string // Staff ID
  name: string // Full name
  email: string // Email address
  avatar?: string // Profile image URL
  role: string // Job role
  status: string // Account status
  currentJobId?: string // Active job assignment
}
```

## Key Features

### 1. Real-time Location Updates

- **Firebase Listeners**: Automatic updates when location data changes
- **Debounced Updates**: Prevents excessive re-renders
- **Recent Filter**: Only shows locations updated within 30 minutes
- **Connection Monitoring**: Handles network connectivity changes

### 2. Interactive Map Markers

- **Staff Avatars**: Shows profile images or initials
- **Status Indicators**: Color-coded status badges
- **Hover Tooltips**: Detailed information on hover
- **Click Interactions**: Select staff for detailed view
- **Pulse Animations**: Visual indicators for active staff

### 3. Status Management

- **Available**: Green - Ready for assignments
- **On Job**: Blue - Currently working (with pulse animation)
- **Offline**: Gray - Not connected
- **Break**: Yellow - On break
- **Emergency**: Red - Emergency status
- **Traveling**: Purple - In transit

### 4. Performance Optimizations

- **Memoized Callbacks**: Prevents unnecessary re-renders
- **Efficient Queries**: Limited result sets with proper indexing
- **Connection Pooling**: Reuses Firebase connections
- **Memory Management**: Proper cleanup of listeners

## Implementation Details

### Setting Up Real-time Listeners

```typescript
const setupLocationListener = useCallback(() => {
  const db = getDb()
  const locationsQuery = query(
    collection(db, 'staff_locations'),
    orderBy('timestamp', 'desc'),
    limit(100)
  )

  const unsubscribe = onSnapshot(locationsQuery, (snapshot) => {
    // Process location updates
    const locationUpdates = snapshot.docs
      .filter((doc) => isLocationRecent(doc.data().timestamp))
      .map((doc) => transformLocationData(doc.data()))

    setStaffLocations(locationUpdates)
  })

  return unsubscribe
}, [staffProfiles])
```

### Connection State Management

```typescript
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true)
    setupLocationListener()
  }

  const handleOffline = () => {
    setIsOnline(false)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [setupLocationListener])
```

## Testing

### Test API Endpoint

- **URL**: `/api/admin/staff-locations/test`
- **Method**: POST
- **Purpose**: Creates sample location data for testing

### Sample Test Data

```bash
curl -X POST http://localhost:3000/api/admin/staff-locations/test
```

## Koh Phangan Map Features

### Geographic Coverage

- **Island Bounds**: Covers the entire Koh Phangan island
- **Coordinates**: 9.700°N to 9.760°N, 100.020°E to 100.080°E
- **Famous Locations**: Haad Rin Beach, Thong Sala, Bottle Beach, Thong Nai Pan, Chaloklum

### Visual Elements

- **Island Theme**: Tropical blue-green gradient background representing the ocean
- **Beach Markers**: Yellow circular markers for major beach areas
- **Landmark Icons**: Emojis representing different location types (🏖️🏘️🥥🌴🎣)
- **Staff Positioning**: Real GPS coordinates mapped to accurate island positions

### Test Locations

- **Thong Nai Pan Beach**: 9.738°N, 100.073°E
- **Haad Rin Beach**: 9.728°N, 100.065°E
- **Bottle Beach**: 9.745°N, 100.058°E
- **Chaloklum**: 9.732°N, 100.042°E
- **Thong Sala**: 9.718°N, 100.052°E

## Security Considerations

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /staff_locations/{staffId} {
      allow read, write: if request.auth != null
        && request.auth.token.role in ['admin', 'manager'];
    }
  }
}
```

### Data Privacy

- Location data is only accessible to authorized users
- Automatic cleanup of old location data (>24 hours)
- Encrypted transmission using Firebase's built-in security

## Deployment Checklist

- [ ] Firebase project configured
- [ ] Firestore security rules updated
- [ ] Staff accounts collection populated
- [ ] Location permissions enabled on mobile devices
- [ ] Real-time listeners tested
- [ ] Connection state handling verified
- [ ] Performance monitoring enabled

## Troubleshooting

### Common Issues

1. **No location updates**: Check Firebase connection and security rules
2. **Markers not appearing**: Verify staff profile data is loaded
3. **Connection errors**: Check network connectivity and Firebase config
4. **Performance issues**: Review query limits and indexing

### Debug Commands

```javascript
// Check Firebase connection
console.log('Firebase initialized:', !!getDb())

// Monitor location updates
console.log('Location count:', staffLocations.length)

// Check connection state
console.log('Online status:', isOnline)
```

## Future Enhancements

- [ ] Geofencing alerts
- [ ] Route optimization
- [ ] Historical location tracking
- [ ] Advanced analytics
- [ ] Push notifications for location events
- [ ] Integration with Google Maps/Mapbox
