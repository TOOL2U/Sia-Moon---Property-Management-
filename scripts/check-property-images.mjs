import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCDaTIILnpuL_P2zzT_0J3wh5T5GqwPTlU",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "438092379093",
  appId: "1:438092379093:web:3d6de5c89fffb1b933aef5",
  measurementId: "G-9XDJCR3BQD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('═══════════════════════════════════════════════════');
console.log('📸 PROPERTY IMAGES REPORT');
console.log('═══════════════════════════════════════════════════\n');

try {
  const propertiesSnapshot = await getDocs(collection(db, 'properties'));
  
  let totalProperties = 0;
  let totalImages = 0;
  let propertiesWithoutImages = 0;

  console.log('🏠 Property Image Details:\n');

  propertiesSnapshot.forEach(doc => {
    const property = doc.data();
    totalProperties++;
    
    const imageCount = property.images?.length || 0;
    totalImages += imageCount;
    
    if (imageCount === 0) {
      propertiesWithoutImages++;
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏠 ${property.name}`);
    console.log(`   Property ID: ${doc.id}`);
    console.log(`   Location: ${property.location?.address || 'No address'}`);
    console.log(`   Total Images: ${imageCount}`);
    
    if (property.images && property.images.length > 0) {
      console.log(`\n   📸 Image Details:`);
      property.images
        .sort((a, b) => a.order - b.order)
        .forEach((img, index) => {
          console.log(`\n   ${index + 1}. ${img.caption || 'Untitled'}`);
          console.log(`      ${img.isMain ? '⭐ MAIN IMAGE' : '   Regular Image'}`);
          console.log(`      Order: ${img.order}`);
          console.log(`      URL: ${img.url}`);
          if (img.width && img.height) {
            console.log(`      Size: ${img.width}x${img.height}px`);
          }
          console.log(`      Uploaded: ${new Date(img.uploadedAt).toLocaleDateString()}`);
        });
    } else {
      console.log(`   ⚠️  WARNING: No images found for this property!`);
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('📊 SUMMARY STATISTICS');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Total Properties: ${totalProperties}`);
  console.log(`Total Images: ${totalImages}`);
  console.log(`Average Images per Property: ${(totalImages / totalProperties).toFixed(1)}`);
  console.log(`Properties without Images: ${propertiesWithoutImages}`);
  
  if (propertiesWithoutImages > 0) {
    console.log(`\n⚠️  ${propertiesWithoutImages} properties need images!`);
    console.log(`   Run: node scripts/fix-property-images.mjs`);
  } else {
    console.log(`\n✅ All properties have images!`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📱 MOBILE TEAM NOTES');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Property images are stored in Firestore, not Firebase Storage.');
  console.log('Access them from job documents:');
  console.log('  - Field: job.propertyPhotos (array of image objects)');
  console.log('  - Each image has: url, caption, isMain, order');
  console.log('  - Main image: propertyPhotos.find(img => img.isMain)');
  console.log('\nSee MOBILE_PROPERTY_IMAGES_GUIDE.md for full details.\n');

} catch (error) {
  console.error('❌ Error fetching properties:', error);
  process.exit(1);
}

process.exit(0);
