import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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
console.log('🔄 PROPERTY MIGRATION - Add PMS Integration Fields');
console.log('═══════════════════════════════════════════════════\n');

console.log('📋 Step 1: Fetching all properties...\n');

const propertiesSnapshot = await getDocs(collection(db, 'properties'));

if (propertiesSnapshot.empty) {
  console.log('⚠️  No properties found in database');
  console.log('   You can create test properties first, or skip this migration.\n');
  process.exit(0);
}

console.log(`✅ Found ${propertiesSnapshot.size} properties\n`);

console.log('📋 Step 2: Adding PMS integration fields to each property...\n');

let updated = 0;
let skipped = 0;
let errors = 0;

for (const propertyDoc of propertiesSnapshot.docs) {
  const propertyId = propertyDoc.id;
  const propertyData = propertyDoc.data();
  
  console.log(`🏠 Processing: ${propertyData.name || propertyId}`);
  
  // Check if already has pmsIntegration
  if (propertyData.pmsIntegration) {
    console.log(`   ⏭️  Already has pmsIntegration - skipping`);
    skipped++;
    continue;
  }
  
  try {
    // Add default pmsIntegration structure
    const pmsIntegration = {
      provider: 'manual',  // Default to manual until PMS is chosen
      syncEnabled: false,
      // pmsListingId will be added manually via admin UI later
      // airbnbListingId will be added manually via admin UI later
      // bookingComListingId will be added manually via admin UI later
    };
    
    // Also enhance location with navigation fields if missing
    const locationEnhancements = {};
    
    if (propertyData.location) {
      // Generate Google Maps link if coordinates exist
      if (propertyData.location.coordinates?.latitude && propertyData.location.coordinates?.longitude) {
        const lat = propertyData.location.coordinates.latitude;
        const lng = propertyData.location.coordinates.longitude;
        locationEnhancements['location.googleMapsLink'] = 
          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }
    
    await updateDoc(doc(db, 'properties', propertyId), {
      pmsIntegration,
      ...locationEnhancements,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`   ✅ Updated successfully`);
    if (Object.keys(locationEnhancements).length > 0) {
      console.log(`      Added Google Maps link`);
    }
    updated++;
    
  } catch (error) {
    console.error(`   ❌ Error updating: ${error.message}`);
    errors++;
  }
}

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ MIGRATION COMPLETE');
console.log('═══════════════════════════════════════════════════\n');

console.log('📊 Summary:');
console.log(`   Total Properties: ${propertiesSnapshot.size}`);
console.log(`   ✅ Updated: ${updated}`);
console.log(`   ⏭️  Skipped: ${skipped}`);
console.log(`   ❌ Errors: ${errors}\n`);

console.log('🔧 Next Steps:');
console.log('   1. Go to Admin > Properties page');
console.log('   2. For each property, add the appropriate listing IDs:');
console.log('      - pmsListingId (from your PMS system)');
console.log('      - airbnbListingId (from Airbnb)');
console.log('      - bookingComListingId (from Booking.com)');
console.log('      - etc.');
console.log('   3. Update provider from "manual" to your actual PMS');
console.log('   4. Enable syncEnabled: true when ready\n');

console.log('💡 Tips:');
console.log('   - Start with one property to test the matching');
console.log('   - Use the property mapping admin UI (Phase 3)');
console.log('   - Test webhook integration before going live\n');

process.exit(0);
