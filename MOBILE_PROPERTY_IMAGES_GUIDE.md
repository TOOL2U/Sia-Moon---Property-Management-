# 📸 Property Images Access Guide for Mobile Team

## Overview
Property images are stored **directly in Firestore** within each property document. When a job is created, the property's image array is copied into the job document for offline access.

---

## 🗄️ Storage Location

### Primary Storage: Firestore `properties` Collection
```
Collection: properties
Document ID: {propertyId}
Field: images (array of PropertyImage objects)
```

### Secondary Storage: Jobs Include Property Images
```
Collection: operational_jobs
Document ID: {jobId}
Field: propertyPhotos (array of PropertyImage objects)
```

---

## 📋 Data Structure

### PropertyImage Interface
```typescript
interface PropertyImage {
  id: string              // Unique image identifier (e.g., "img-0-1")
  url: string             // Full image URL (Unsplash or Cloudinary)
  thumbnailUrl?: string   // Optional smaller thumbnail URL
  caption?: string        // Image description (e.g., "Beach Villa - Main View")
  order: number           // Display order (0-indexed)
  isMain: boolean         // Is this the main/cover photo?
  width?: number          // Image width in pixels
  height?: number         // Image height in pixels
  uploadedAt: string      // ISO timestamp
  uploadedBy?: string     // User who uploaded
}
```

### Example Property Document
```json
{
  "id": "property-123",
  "name": "Sunset Beach Villa",
  "location": {
    "address": "123 Beach Road, Koh Phangan, Thailand",
    "coordinates": {
      "latitude": 9.7382,
      "longitude": 100.0608
    },
    "googleMapsLink": "https://www.google.com/maps/search/?api=1&query=9.7382,100.0608"
  },
  "images": [
    {
      "id": "img-0-0",
      "url": "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800",
      "caption": "Sunset Beach Villa - Main View",
      "order": 0,
      "isMain": true,
      "width": 800,
      "height": 600,
      "uploadedAt": "2026-01-09T12:00:00.000Z",
      "uploadedBy": "system"
    },
    {
      "id": "img-0-1",
      "url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "caption": "Sunset Beach Villa - Interior",
      "order": 1,
      "isMain": false,
      "width": 800,
      "height": 600,
      "uploadedAt": "2026-01-09T12:00:00.000Z",
      "uploadedBy": "system"
    },
    {
      "id": "img-0-2",
      "url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "caption": "Sunset Beach Villa - Amenities",
      "order": 2,
      "isMain": false,
      "width": 800,
      "height": 600,
      "uploadedAt": "2026-01-09T12:00:00.000Z",
      "uploadedBy": "system"
    },
    {
      "id": "img-0-3",
      "url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      "caption": "Sunset Beach Villa - Additional View",
      "order": 3,
      "isMain": false,
      "width": 800,
      "height": 600,
      "uploadedAt": "2026-01-09T12:00:00.000Z",
      "uploadedBy": "system"
    }
  ],
  "accessInstructions": "Gate code: #1234*\nFront door: Key under mat\nWiFi: VillaGuest / Welcome2026",
  "specialNotes": "Check beach equipment condition and restock towels."
}
```

---

## 🔧 How to Access Property Images in Mobile App

### Option 1: From Job Document (Recommended)
When a job is sent to the mobile app, it includes the full `propertyPhotos` array:

```typescript
// Read job from operational_jobs collection
const jobDoc = await firestore()
  .collection('operational_jobs')
  .doc(jobId)
  .get();

const jobData = jobDoc.data();

// Access property photos
const propertyPhotos = jobData.propertyPhotos || [];

// Get main photo
const mainPhoto = propertyPhotos.find(img => img.isMain) || propertyPhotos[0];

// Display all photos sorted by order
const sortedPhotos = propertyPhotos.sort((a, b) => a.order - b.order);
```

### Option 2: From Property Document
If you need to fetch directly from the property:

```typescript
// Read property document
const propertyDoc = await firestore()
  .collection('properties')
  .doc(propertyId)
  .get();

const propertyData = propertyDoc.data();

// Access images array
const images = propertyData.images || [];

// Get main image
const mainImage = images.find(img => img.isMain) || images[0];
```

---

## 📱 Image Display Examples

### Display Main Property Photo
```typescript
import { Image } from 'react-native';

const JobCard = ({ job }) => {
  const mainPhoto = job.propertyPhotos?.find(img => img.isMain) || job.propertyPhotos?.[0];
  
  return (
    <View>
      {mainPhoto && (
        <Image
          source={{ uri: mainPhoto.url }}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
      )}
      <Text>{job.propertyName}</Text>
    </View>
  );
};
```

### Display Photo Gallery
```typescript
import { FlatList, Image, TouchableOpacity } from 'react-native';

const PropertyGallery = ({ propertyPhotos }) => {
  const sortedPhotos = propertyPhotos?.sort((a, b) => a.order - b.order) || [];
  
  return (
    <FlatList
      horizontal
      data={sortedPhotos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => openFullScreen(item)}>
          <Image
            source={{ uri: item.url }}
            style={{ width: 100, height: 100, marginRight: 8 }}
            resizeMode="cover"
          />
          {item.isMain && (
            <View style={styles.mainBadge}>
              <Text>Main</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
};
```

### With Image Caching (React Native Fast Image)
```typescript
import FastImage from 'react-native-fast-image';

const CachedPropertyImage = ({ propertyPhoto }) => {
  return (
    <FastImage
      source={{
        uri: propertyPhoto.url,
        priority: propertyPhoto.isMain ? FastImage.priority.high : FastImage.priority.normal,
      }}
      style={{ width: '100%', height: 200 }}
      resizeMode={FastImage.resizeMode.cover}
    />
  );
};
```

---

## 🚀 Job Document Structure (Mobile App)

When a job is dispatched to mobile, it includes:

```typescript
{
  id: "job-xyz123",
  jobType: "cleaning",
  status: "pending",
  priority: "high",
  
  // Property Information
  propertyId: "property-123",
  propertyName: "Sunset Beach Villa",
  
  // ✨ Property Photos Array (Full PropertyImage objects)
  propertyPhotos: [
    {
      id: "img-0-0",
      url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800",
      caption: "Sunset Beach Villa - Main View",
      order: 0,
      isMain: true,
      width: 800,
      height: 600,
      uploadedAt: "2026-01-09T12:00:00.000Z"
    },
    // ... more images
  ],
  
  // Access & Location
  accessInstructions: "Gate code: #1234*\nFront door: Key under mat",
  location: {
    address: "123 Beach Road, Koh Phangan, Thailand",
    latitude: 9.7382,
    longitude: 100.0608,
    googleMapsLink: "https://www.google.com/maps/search/?api=1&query=9.7382,100.0608"
  },
  
  // Job Details
  title: "Post-Checkout Deep Clean - Sunset Beach Villa",
  scheduledDate: Timestamp,
  estimatedDuration: 120,
  specialInstructions: "Check beach equipment...",
  
  // Assignment
  assignedTo: "cleaner-abc",
  assignedStaff: {
    id: "cleaner-abc",
    name: "Maria Santos",
    email: "maria@example.com",
    role: "cleaner"
  }
}
```

---

## 🔍 Testing Property Images

### Script to View Property Images
```bash
# Run this script to see all property images
cd /Users/shaunducker/Desktop/Sia-Moon---Property-Management-
node scripts/check-property-images.mjs
```

### Create Test Script (check-property-images.mjs)
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCDaTIILnpuL_P2zzT_0J3wh5T5GqwPTlU",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "438092379093",
  appId: "1:438092379093:web:3d6de5c89fffb1b933aef5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('📸 Property Images Report\n');

const propertiesSnapshot = await getDocs(collection(db, 'properties'));

propertiesSnapshot.forEach(doc => {
  const property = doc.data();
  console.log(`\n🏠 ${property.name}`);
  console.log(`   Property ID: ${doc.id}`);
  console.log(`   Total Images: ${property.images?.length || 0}`);
  
  if (property.images && property.images.length > 0) {
    property.images.forEach((img, index) => {
      console.log(`   ${index + 1}. ${img.caption || 'Untitled'}`);
      console.log(`      URL: ${img.url}`);
      console.log(`      Main: ${img.isMain ? '⭐ YES' : 'No'}`);
      console.log(`      Order: ${img.order}`);
    });
  } else {
    console.log('   ⚠️  No images found!');
  }
});

process.exit(0);
```

---

## ⚠️ Important Notes

### Image Sources
Currently using **Unsplash** for test/demo properties:
- ✅ No authentication required
- ✅ Direct HTTPS URLs
- ✅ Publicly accessible
- ✅ Works with React Native Image component

**Future Production Images:**
- May migrate to **Cloudinary** for uploaded property images
- Cloudinary URLs will work the same way
- Structure will remain identical

### Image Validation
When creating jobs, the system checks:
```typescript
if (propertyDetails.photos.length === 0) {
  console.warn('⚠️ Property has no photos - mobile functionality will be limited');
}
```

**All properties should have at least 1 image** for mobile app to function properly.

### Offline Access
Recommend using **react-native-fast-image** for:
- ✅ Image caching
- ✅ Offline viewing after first load
- ✅ Better performance
- ✅ Progressive loading

---

## 📊 Current Image Counts

All test properties currently have **4 images each**:
1. Main View (isMain: true)
2. Interior View
3. Amenities/Pool
4. Additional View

---

## 🔗 Firebase Collections Reference

```
Firebase Project: operty-b54dc

Collections:
├── properties
│   └── {propertyId}
│       └── images: PropertyImage[]    ← Property images stored here
│
└── operational_jobs
    └── {jobId}
        └── propertyPhotos: PropertyImage[]    ← Copy of property images for offline access
```

---

## 📝 Quick Integration Checklist

- [ ] Install `react-native-fast-image` for image caching
- [ ] Set up Firebase Firestore SDK in mobile app
- [ ] Read `propertyPhotos` array from job documents
- [ ] Display main photo (`isMain: true`) in job cards
- [ ] Implement photo gallery for full property view
- [ ] Sort images by `order` field for consistent display
- [ ] Handle missing images gracefully (show placeholder)
- [ ] Test with real job documents from `operational_jobs` collection
- [ ] Implement image caching for offline viewing

---

## 🆘 Support

**Questions about property images?**
- Check job document structure in Firebase Console
- All current properties have 4 images each
- Images are copied to jobs during automatic job creation
- Contact web team if images are missing or URLs are broken

**Firebase Console Access:**
- Project: `operty-b54dc`
- Collection: `properties` → See `images` array
- Collection: `operational_jobs` → See `propertyPhotos` array

---

## ✅ Summary

**For Mobile Team:**
1. Property images are in `job.propertyPhotos` array
2. Each image has: `url`, `caption`, `isMain`, `order`
3. Use `img.url` directly in `<Image source={{ uri: img.url }}>`
4. Main photo: `propertyPhotos.find(img => img.isMain)`
5. All photos sorted: `propertyPhotos.sort((a, b) => a.order - b.order)`
6. Images are publicly accessible Unsplash URLs (no auth needed)

**No Firebase Storage needed** - all images are direct URLs stored in Firestore!
