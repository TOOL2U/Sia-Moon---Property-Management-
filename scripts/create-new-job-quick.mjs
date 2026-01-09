import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBznNyw1j_2EYvBykjvOmMWHM-9zOQZGPc',
  authDomain: 'operty-b54dc.firebaseapp.com',
  projectId: 'operty-b54dc',
  storageBucket: 'operty-b54dc.firebasestorage.app',
  messagingSenderId: '914547669275',
  appId: '1:914547669275:web:0897d32d59b17134a53bbe'
});

const db = getFirestore(app);
const now = Date.now();

addDoc(collection(db, 'operational_jobs'), {
  propertyId: 'xapwbYmKxzyKH23gcq9L',
  propertyName: 'Mountain Retreat Cabin',
  location: { 
    address: 'Ban Tai, Koh Phangan', 
    latitude: 9.705, 
    longitude: 100.045,
    googleMapsLink: 'https://www.google.com/maps?q=9.705,100.045'
  },
  jobType: 'cleaning',
  title: 'Post-Checkout Cleaning - Mountain Retreat Cabin',
  description: 'TEST JOB - ' + new Date().toLocaleString(),
  priority: 'high',
  scheduledDate: Timestamp.fromDate(new Date(now + 2*60*60*1000)),
  estimatedDuration: 120,
  assignedStaffId: null,
  status: 'pending',
  requiredRole: 'cleaner',
  guestName: 'Test Guest',
  guestCount: 2,
  createdAt: Timestamp.now()
}).then(ref => {
  console.log('✅ Job ID:', ref.id);
  console.log('📍 Location: 9.705, 100.045');
  console.log('📱 Check mobile app!');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
