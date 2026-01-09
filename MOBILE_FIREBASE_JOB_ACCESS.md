# Mobile App - Firebase Job Storage & Access

## 📦 Where Jobs Are Stored

### Firebase Collection Path:
```
/operational_jobs/{jobId}
```

Your test job is stored at:
```
/operational_jobs/cOlnK6OzyEc9fqL79oHt
```

---

## 🔥 Firebase Firestore Structure

```
Firebase Project: operty-b54dc
│
├── 📁 operational_jobs/          ← ALL JOBS STORED HERE
│   ├── cOlnK6OzyEc9fqL79oHt     ← Your test job
│   ├── I5h4j1GbOEajBc9dw95E     ← Other jobs
│   ├── RyUxNflWIa4LUEyLvjwi
│   └── ...
│
├── 📁 bookings/                  ← Booking data
├── 📁 properties/                ← Property data (coordinates here)
├── 📁 users/                     ← User accounts (cleaners, staff)
└── 📁 calendar_events/           ← Calendar entries
```

---

## 📱 How Mobile App Accesses Jobs

### Method 1: Query All Jobs (Recommended)

```typescript
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

// Get all pending jobs for cleaners
const jobsRef = collection(db, 'operational_jobs');
const jobsQuery = query(
  jobsRef,
  where('requiredRole', '==', 'cleaner'),
  where('status', 'in', ['pending', 'offered'])
);

// Real-time listener (updates automatically)
const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
  const jobs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`Found ${jobs.length} jobs`);
  // Update your UI with jobs
  setJobs(jobs);
});
```

### Method 2: Get Assigned Jobs for Specific Cleaner

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

// Get jobs assigned to logged-in cleaner
const cleanerId = auth.currentUser.uid;

const assignedJobsQuery = query(
  collection(db, 'operational_jobs'),
  where('assignedStaffId', '==', cleanerId),
  where('status', 'in', ['assigned', 'in_progress'])
);

const snapshot = await getDocs(assignedJobsQuery);
const myJobs = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Method 3: Get Single Job by ID

```typescript
import { doc, getDoc } from 'firebase/firestore';

const jobRef = doc(db, 'operational_jobs', 'cOlnK6OzyEc9fqL79oHt');
const jobSnapshot = await getDoc(jobRef);

if (jobSnapshot.exists()) {
  const job = { id: jobSnapshot.id, ...jobSnapshot.data() };
  console.log('Job:', job.title);
  console.log('Location:', job.location.latitude, job.location.longitude);
}
```

---

## 🔐 Firebase Configuration for Mobile App

Your mobile app needs this Firebase config (already in your app):

```typescript
// mobile-app/src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBznNyw1j_2EYvBykjvOmMWHM-9zOQZGPc",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};
```

---

## 📊 Job Document Structure (What Mobile App Receives)

```typescript
{
  // Job ID (document ID in Firestore)
  id: "cOlnK6OzyEc9fqL79oHt",
  
  // Property details
  propertyId: "xapwbYmKxzyKH23gcq9L",
  propertyName: "Mountain Retreat Cabin",
  
  // 📍 LOCATION DATA (This is what you need for map!)
  location: {
    address: "Ban Tai, Koh Phangan",
    googleMapsLink: "https://www.google.com/maps?q=9.705,100.045",
    latitude: 9.705,        // ← Use this
    longitude: 100.045      // ← Use this
  },
  
  // Job details
  jobType: "cleaning",
  title: "Post-Checkout Cleaning - Mountain Retreat Cabin",
  description: "Test job for mobile app",
  priority: "high",
  
  // Scheduling (Firestore Timestamps)
  scheduledDate: Timestamp,
  checkInDate: Timestamp,
  checkOutDate: Timestamp,
  
  // Assignment
  assignedStaffId: null,     // null = unassigned (all cleaners see it)
  status: "pending",         // pending, accepted, in_progress, completed
  requiredRole: "cleaner",
  
  // Guest info
  guestName: "Test Guest",
  guestCount: 2,
  
  // Metadata
  createdAt: Timestamp,
  createdBy: "manual_test"
}
```

---

## 🔄 Real-Time Updates

Jobs update in **real-time** when:
- ✅ New jobs are created → Mobile app sees them immediately
- ✅ Staff accepts a job → Status changes to "accepted"
- ✅ Job is assigned → `assignedStaffId` updates
- ✅ Job is completed → Status changes to "completed"

### Example: Listen for Job Changes

```typescript
import { doc, onSnapshot } from 'firebase/firestore';

const jobRef = doc(db, 'operational_jobs', 'cOlnK6OzyEc9fqL79oHt');

// Listen for changes to this specific job
const unsubscribe = onSnapshot(jobRef, (docSnapshot) => {
  if (docSnapshot.exists()) {
    const job = docSnapshot.data();
    console.log('Job updated:', job.status);
    
    // Update UI
    if (job.status === 'accepted') {
      showNotification('Job accepted!');
    }
  }
});

// Don't forget to cleanup
return () => unsubscribe();
```

---

## 🗺️ Displaying Job Location on Map

### React Native Maps Example:

```typescript
import MapView, { Marker } from 'react-native-maps';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function JobsMap() {
  const [jobs, setJobs] = useState([]);
  
  useEffect(() => {
    // Listen to all pending cleaning jobs
    const jobsQuery = query(
      collection(db, 'operational_jobs'),
      where('requiredRole', '==', 'cleaner'),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsList);
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <MapView
      initialRegion={{
        latitude: 9.738,    // Koh Phangan center
        longitude: 100.0194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      }}
    >
      {jobs.map((job) => {
        // Extract location from job
        const { latitude, longitude } = job.location;
        
        return (
          <Marker
            key={job.id}
            coordinate={{ latitude, longitude }}
            title={job.propertyName}
            description={job.title}
            pinColor={job.priority === 'high' ? 'red' : 'blue'}
          />
        );
      })}
    </MapView>
  );
}
```

---

## 🔍 Test Your Firebase Connection

### Check if Mobile App Can Read Jobs:

```typescript
import { collection, getDocs } from 'firebase/firestore';

async function testFirebaseConnection() {
  try {
    const jobsRef = collection(db, 'operational_jobs');
    const snapshot = await getDocs(jobsRef);
    
    console.log(`✅ Connected! Found ${snapshot.size} jobs`);
    
    snapshot.forEach(doc => {
      const job = doc.data();
      console.log(`Job: ${job.title}`);
      console.log(`  Location: ${job.location.latitude}, ${job.location.longitude}`);
    });
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
  }
}
```

---

## 📝 Current Test Job Details

Your test job is live in Firebase right now:

```
Collection: operational_jobs
Document ID: cOlnK6OzyEc9fqL79oHt

Data:
  - Property: Mountain Retreat Cabin
  - Location: 9.705, 100.045 (Ban Tai)
  - Status: pending
  - Assigned: null (visible to all cleaners)
  - Required Role: cleaner
```

### To See It on Mobile App:

1. **Open mobile app**
2. **Log in as**: `cleaner@siamoon.com`
3. **Go to Jobs tab**
4. **The app should query**: `collection(db, 'operational_jobs')`
5. **Job will appear** with title "Post-Checkout Cleaning - Mountain Retreat Cabin"
6. **Map marker** should show at coordinates: 9.705, 100.045

---

## 🚨 Common Issues & Solutions

### Issue 1: "Job not appearing"
**Check:**
- Mobile app is querying `operational_jobs` collection
- Query filters are correct (requiredRole = 'cleaner', status = 'pending')
- Firebase authentication is working
- User is logged in as cleaner

**Debug:**
```typescript
const snapshot = await getDocs(collection(db, 'operational_jobs'));
console.log('Total jobs in database:', snapshot.size);
```

### Issue 2: "Location not showing on map"
**Check:**
- Job document has `location.latitude` and `location.longitude`
- Coordinates are numbers, not strings
- Map component is receiving correct props

**Debug:**
```typescript
console.log('Job location:', job.location);
console.log('Latitude type:', typeof job.location.latitude);
console.log('Longitude type:', typeof job.location.longitude);
```

### Issue 3: "Real-time updates not working"
**Solution:** Use `onSnapshot` instead of `getDocs`:
```typescript
// ❌ Wrong (no real-time updates)
const snapshot = await getDocs(jobsQuery);

// ✅ Right (real-time updates)
const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
  // Update UI here
});
```

---

## 🎯 Summary

**Where Job Is Stored:**
- Firebase Firestore
- Collection: `operational_jobs`
- Document ID: `cOlnK6OzyEc9fqL79oHt`

**How Mobile App Accesses It:**
- Query: `collection(db, 'operational_jobs')`
- Filter by: `requiredRole == 'cleaner'` and `status == 'pending'`
- Listen with: `onSnapshot()` for real-time updates

**Location Data:**
- Field: `job.location.latitude` and `job.location.longitude`
- Your test job: 9.705, 100.045
- Maps to: Ban Tai, Koh Phangan (on land!)

**Next Steps:**
1. Open mobile app
2. Check if Firebase connection works
3. Verify job appears in jobs list
4. Check if map shows marker at correct location

---

**Firebase Project**: operty-b54dc  
**Test Job ID**: cOlnK6OzyEc9fqL79oHt  
**Status**: Live and ready for testing ✅
