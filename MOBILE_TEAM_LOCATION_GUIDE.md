# Mobile App Team - Property Location Coordinates Guide

## 📍 Location Data Structure

All property location data is now fixed and available in Firebase. Here's how to access and use the coordinates in your mobile app.

---

## 🗂️ Firebase Data Structure

### Properties Collection: `/properties/{propertyId}`

Each property document contains location data in this structure:

```typescript
{
  id: "IPpRUm3DuvmiYFBvWzpy",
  name: "Beach Villa Sunset",
  
  // Location data is nested here:
  location: {
    coordinates: {
      latitude: 9.738,      // ← Use this for map markers
      longitude: 100.0194   // ← Use this for map markers
    }
  },
  
  // Alternative locations (less common):
  // Some properties may have coordinates at top level
  coordinates: {
    latitude: 9.7601,
    longitude: 100.0356
  },
  
  // Or in address object
  address: {
    coordinates: {
      latitude: 9.7584,
      longitude: 99.9876
    }
  }
}
```

---

## 🎯 How to Extract Coordinates

Use this priority order to find coordinates:

```typescript
function getPropertyCoordinates(property: any) {
  // Priority 1: location.coordinates (most common)
  if (property.location?.coordinates) {
    return {
      latitude: property.location.coordinates.latitude,
      longitude: property.location.coordinates.longitude
    };
  }
  
  // Priority 2: top-level coordinates
  if (property.coordinates) {
    return {
      latitude: property.coordinates.latitude,
      longitude: property.coordinates.longitude
    };
  }
  
  // Priority 3: address.coordinates
  if (property.address?.coordinates) {
    return {
      latitude: property.address.coordinates.latitude,
      longitude: property.address.coordinates.longitude
    };
  }
  
  // Priority 4: separate lat/lng fields (rare)
  if (property.latitude && property.longitude) {
    return {
      latitude: property.latitude,
      longitude: property.longitude
    };
  }
  
  console.warn('No coordinates found for property:', property.id);
  return null;
}
```

---

## 📋 Jobs Collection: `/operational_jobs/{jobId}`

When jobs are created, they include the property location for navigation:

```typescript
{
  jobId: "xyz123",
  propertyName: "Beach Villa Sunset",
  
  // Location is already extracted for you:
  location: {
    address: "123 Beach Road, Koh Phangan",
    googleMapsLink: "https://www.google.com/maps?q=9.738,100.0194",
    latitude: 9.738,      // ← Ready to use
    longitude: 100.0194   // ← Ready to use
  }
}
```

**For jobs, you can directly use:**
```typescript
const coords = {
  latitude: job.location.latitude,
  longitude: job.location.longitude
};
```

---

## 🗺️ Displaying on Map

### React Native Maps Example:

```tsx
import MapView, { Marker } from 'react-native-maps';

function PropertyMap({ properties }) {
  return (
    <MapView
      initialRegion={{
        latitude: 9.738,    // Center of Koh Phangan
        longitude: 100.0194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {properties.map((property) => {
        const coords = getPropertyCoordinates(property);
        
        if (!coords) return null;
        
        return (
          <Marker
            key={property.id}
            coordinate={{
              latitude: coords.latitude,
              longitude: coords.longitude
            }}
            title={property.name}
            description={property.address?.fullAddress || ''}
          />
        );
      })}
    </MapView>
  );
}
```

---

## ✅ Verified Coordinates

All Koh Phangan properties now have **verified coordinates on land** (not in ocean):

| Property | Latitude | Longitude | Location |
|----------|----------|-----------|----------|
| Beach Villa Sunset | 9.738 | 100.0194 | Thong Sala (main town) |
| City Center Apartment | 9.722 | 100.071 | Haad Rin Beach |
| Beach House Deluxe | 9.763 | 100.057 | Bottle Beach |
| Mountain View Villa | 9.751 | 99.995 | Sri Thanu |
| Mountain Retreat Cabin | 9.705 | 100.045 | Ban Tai |
| Villa Paradise | 9.7123 | 100.0187 | Near Thong Sala |
| Test 1 | 9.7584 | 99.9876 | Near Sri Thanu |
| Ante Cliff | 9.7601 | 100.0356 | Near Bottle Beach |

**Koh Phangan Island Boundaries:**
- Latitude: 9.695°N to 9.77°N
- Longitude: 99.985°E to 100.075°E

---

## 🧪 Testing

To verify coordinates are working:

1. **Check a few markers manually** - Click these Google Maps links to confirm locations:
   - Beach Villa Sunset: https://www.google.com/maps?q=9.738,100.0194
   - City Center Apartment: https://www.google.com/maps?q=9.722,100.071
   - Beach House Deluxe: https://www.google.com/maps?q=9.763,100.057

2. **Verify map rendering** - All markers should appear:
   - On land (not in ocean)
   - Within Koh Phangan island boundaries
   - At recognizable locations (towns, beaches)

3. **Test edge cases:**
   ```typescript
   // Property with no coordinates
   const coords = getPropertyCoordinates(propertyWithoutCoords);
   console.log(coords); // Should log null, handle gracefully
   
   // Property with coordinates in different format
   const coords2 = getPropertyCoordinates(propertyWithTopLevelCoords);
   console.log(coords2); // Should still extract correctly
   ```

---

## 🚨 Common Issues to Avoid

### ❌ Wrong: Using wrong field names
```typescript
// DON'T DO THIS:
const lat = property.lat;  // Wrong field name
const lng = property.lng;  // Wrong field name
```

### ✅ Right: Use the correct nested structure
```typescript
// DO THIS:
const lat = property.location.coordinates.latitude;
const lng = property.location.coordinates.longitude;
```

### ❌ Wrong: Hardcoding coordinates
```typescript
// DON'T DO THIS:
<Marker coordinate={{ latitude: 9.7, longitude: 100.0 }} />
```

### ✅ Right: Use dynamic coordinates from Firebase
```typescript
// DO THIS:
const coords = getPropertyCoordinates(property);
<Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} />
```

### ❌ Wrong: Not handling missing coordinates
```typescript
// DON'T DO THIS - will crash if coords missing:
<Marker coordinate={{ 
  latitude: property.location.coordinates.latitude,  // Crashes if undefined
  longitude: property.location.coordinates.longitude 
}} />
```

### ✅ Right: Check coordinates exist first
```typescript
// DO THIS:
const coords = getPropertyCoordinates(property);
if (coords) {
  return <Marker coordinate={coords} />;
}
return null; // Or show placeholder
```

---

## 📞 Navigation Integration

For "Navigate to Property" buttons:

```typescript
import { Linking, Platform } from 'react-native';

function navigateToProperty(job) {
  const { latitude, longitude } = job.location;
  
  // Use Google Maps link from backend (preferred)
  if (job.location.googleMapsLink) {
    Linking.openURL(job.location.googleMapsLink);
    return;
  }
  
  // Or construct URL manually
  const url = Platform.select({
    ios: `maps:${latitude},${longitude}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`
  });
  
  Linking.openURL(url);
}
```

---

## 🔄 Real-time Updates

If property coordinates are updated in Firebase, use real-time listeners:

```typescript
import { collection, onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'properties'),
    (snapshot) => {
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProperties(properties);
    }
  );
  
  return () => unsubscribe();
}, []);
```

---

## 📊 Data Validation

Add this validation to catch coordinate issues early:

```typescript
function validateCoordinates(coords: { latitude: number; longitude: number }) {
  // Check if coordinates are valid numbers
  if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    console.error('Invalid coordinate types:', coords);
    return false;
  }
  
  // Check if coordinates are in Koh Phangan range
  const isOnKohPhangan = 
    coords.latitude >= 9.695 && coords.latitude <= 9.77 &&
    coords.longitude >= 99.985 && coords.longitude <= 100.075;
  
  if (!isOnKohPhangan) {
    console.warn('Coordinates outside Koh Phangan:', coords);
    // Still return true, but log warning
  }
  
  return true;
}
```

---

## 📝 Summary

**What you need to do:**

1. ✅ Use `property.location.coordinates.latitude` and `property.location.coordinates.longitude`
2. ✅ Implement the extraction function to handle multiple coordinate formats
3. ✅ Handle cases where coordinates might be missing
4. ✅ Test with the Google Maps links provided above
5. ✅ Use job.location for navigation (coordinates already extracted)

**What's already done (backend/webapp):**

1. ✅ All properties have valid coordinates on Koh Phangan island
2. ✅ Jobs automatically include property coordinates
3. ✅ Coordinates are verified to be on land (not in ocean)
4. ✅ Google Maps links are generated for each property

---

## 🆘 Need Help?

If markers still appear incorrectly after implementing the above:

1. Log the coordinates you're receiving:
   ```typescript
   console.log('Property coordinates:', {
     id: property.id,
     name: property.name,
     latitude: property.location?.coordinates?.latitude,
     longitude: property.location?.coordinates?.longitude
   });
   ```

2. Compare with expected values in the table above
3. Check if your map component is using the correct coordinate format
4. Verify your map's initial region is centered on Koh Phangan

---

**Last Updated:** January 9, 2026  
**Status:** All coordinates verified and fixed ✅  
**Backend Contact:** Shaun (Webapp Team)
