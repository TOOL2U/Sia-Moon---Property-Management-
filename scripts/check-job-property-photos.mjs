import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

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

console.log('═══════════════════════════════════════════════════');
console.log('🔍 JOB PROPERTY PHOTOS VERIFICATION');
console.log('═══════════════════════════════════════════════════\n');

try {
  const jobsQuery = query(
    collection(db, 'operational_jobs'),
    orderBy('createdAt', 'desc'),
    limit(3)
  );
  
  const snapshot = await getDocs(jobsQuery);
  
  if (snapshot.empty) {
    console.log('❌ No jobs found in operational_jobs collection');
    process.exit(0);
  }
  
  console.log(`Found ${snapshot.size} recent jobs\n`);
  
  snapshot.forEach((doc, index) => {
    const job = doc.data();
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 Job ${index + 1}`);
    console.log(`   Job ID: ${doc.id}`);
    console.log(`   Property: ${job.propertyName || 'Unknown'}`);
    console.log(`   Property ID: ${job.propertyId || 'Not set'}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Job Type: ${job.jobType || job.taskType}`);
    
    // Check for property photos
    if (job.propertyPhotos && Array.isArray(job.propertyPhotos)) {
      console.log(`\n   ✅ propertyPhotos: ${job.propertyPhotos.length} images found`);
      
      if (job.propertyPhotos.length > 0) {
        console.log(`\n   📸 Image Details:`);
        job.propertyPhotos
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .forEach((img, i) => {
            console.log(`\n   ${i + 1}. ${img.caption || 'Untitled'}`);
            console.log(`      ${img.isMain ? '⭐ MAIN IMAGE' : '   Regular Image'}`);
            console.log(`      Order: ${img.order !== undefined ? img.order : 'Not set'}`);
            if (img.url && typeof img.url === 'string') {
              console.log(`      URL: ${img.url.substring(0, 60)}...`);
            } else {
              console.log(`      URL: ${JSON.stringify(img.url)}`);
            }
          });
      }
    } else {
      console.log(`\n   ❌ propertyPhotos: NOT FOUND or not an array`);
      console.log(`      Type: ${typeof job.propertyPhotos}`);
    }
    
    // Check for location data
    if (job.location) {
      console.log(`\n   📍 Location:`);
      console.log(`      Address: ${job.location.address || 'Not set'}`);
      if (job.location.latitude && job.location.longitude) {
        console.log(`      GPS: ${job.location.latitude}, ${job.location.longitude}`);
      }
      if (job.location.googleMapsLink) {
        console.log(`      Maps: ${job.location.googleMapsLink.substring(0, 60)}...`);
      }
    }
    
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('💡 For mobile team:');
  console.log('   - Access images via: job.propertyPhotos');
  console.log('   - Each image has: url, caption, isMain, order');
  console.log('   - Main image: job.propertyPhotos.find(img => img.isMain)');
  console.log('   - See MOBILE_PROPERTY_IMAGES_GUIDE.md for examples\n');

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

process.exit(0);
