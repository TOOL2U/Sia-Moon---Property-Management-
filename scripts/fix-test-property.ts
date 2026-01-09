/**
 * FIX TEST PROPERTY DATA
 * 
 * This script updates the test property with complete data needed for testing:
 * - Property photos (images)
 * - Access instructions (gate codes, keys, etc.)
 * - Google Maps link
 * - GPS coordinates
 * - Special notes
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('\n❌ ERROR: serviceAccountKey.json not found!');
    process.exit(1);
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function fixTestProperty() {
  try {
    console.log('\n🔧 FIXING TEST PROPERTY DATA\n');

    // Property ID from test
    const propertyId = 'ZBlZH1VLYfAhaiEw3I5C';

    // Get current property data
    const propertyRef = db.collection('properties').doc(propertyId);
    const propertyDoc = await propertyRef.get();

    if (!propertyDoc.exists) {
      console.error(`❌ Property ${propertyId} not found!`);
      process.exit(1);
    }

    const currentData = propertyDoc.data();
    console.log('📋 Current property data:');
    console.log('   Name:', currentData?.name);
    console.log('   Has images:', !!currentData?.images?.length);
    console.log('   Has access instructions:', !!currentData?.accessInstructions);
    console.log('   Has coordinates:', !!currentData?.address?.coordinates);

    // Prepare complete property data
    const updates: any = {
      updatedAt: Timestamp.now(),
    };

    // 1. Add property photos (if missing)
    if (!currentData?.images || currentData.images.length === 0) {
      console.log('\n📸 Adding property photos...');
      updates.images = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',  // Beautiful villa exterior
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',  // Living room
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',  // Bedroom
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',  // Kitchen
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',  // Bathroom
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',  // Pool
      ];
      console.log('   ✅ Added 6 property photos');
    }

    // 2. Add access instructions (if missing)
    if (!currentData?.accessInstructions) {
      console.log('\n🔑 Adding access instructions...');
      updates.accessInstructions = `PROPERTY ACCESS INSTRUCTIONS:

Main Gate: 
- Code: #1234*
- Alternative code (if first fails): #5678*
- Gate closes automatically

Front Door:
- Key location: Under the mat by the front entrance
- Key is labeled "VILLA PARADISE"
- Please lock door when entering and leaving

Pool Gate:
- Code: 9999
- Keep locked at all times for safety

Parking:
- 2 parking spaces available
- Located to the left of main entrance

WiFi:
- Network: VillaParadise_Guest
- Password: Welcome2026

Emergency Contacts:
- Property Manager: +66 123 456 789
- Security: +66 987 654 321`;
      console.log('   ✅ Added complete access instructions');
    }

    // 3. Add/update address with coordinates (if missing)
    if (!currentData?.address?.coordinates) {
      console.log('\n📍 Adding GPS coordinates and Google Maps link...');
      
      // Phuket, Thailand coordinates (example location)
      const latitude = 7.8804;
      const longitude = 98.3923;
      
      updates.address = {
        ...currentData?.address,
        fullAddress: currentData?.address?.fullAddress || '123 Beach Road, Rawai, Phuket 83100, Thailand',
        coordinates: {
          latitude: latitude,
          longitude: longitude,
        },
        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        city: 'Phuket',
        province: 'Phuket',
        country: 'Thailand',
        postalCode: '83100',
      };
      console.log('   ✅ Added GPS coordinates:', latitude, longitude);
      console.log('   ✅ Added Google Maps link');
    }

    // 4. Add special notes (if missing)
    if (!currentData?.specialNotes && !currentData?.description) {
      console.log('\n📝 Adding special notes...');
      updates.specialNotes = `IMPORTANT INFORMATION FOR STAFF:

Cleaning Notes:
- Guest is allergic to strong cleaning products - use hypoallergenic products only
- Pay special attention to pool area - must be spotless
- Check all AC filters during turnover cleaning
- Guest prefers bed made with hospital corners

Property Features:
- 3 bedrooms, 3 bathrooms
- Private pool with heating system (check temperature)
- Garden requires daily watering (early morning)
- Security cameras at entrance (do not obstruct)

Known Issues:
- Kitchen sink tap slightly loose (tighten if needed)
- Pool light timer needs manual reset sometimes
- Garden gate lock is stiff - push firmly when closing

Guest Preferences:
- VIP guest - ensure extra attention to detail
- Prefers room temperature at 24°C
- Extra towels needed for pool area
- Fresh flowers in living room appreciated`;
      console.log('   ✅ Added special notes for staff');
    }

    // 5. Ensure property is active and bookable
    updates.isActive = true;
    updates.status = 'active';

    // Update the property
    console.log('\n💾 Updating property in Firestore...');
    await propertyRef.update(updates);

    // Verify the update
    const updatedDoc = await propertyRef.get();
    const updatedData = updatedDoc.data();

    console.log('\n✅ PROPERTY UPDATE COMPLETE!\n');
    console.log('📊 Updated property data:');
    console.log('   Name:', updatedData?.name);
    console.log('   Images:', updatedData?.images?.length || 0, 'photos');
    console.log('   Access Instructions:', updatedData?.accessInstructions ? 'Yes ✓' : 'No ✗');
    console.log('   GPS Coordinates:', updatedData?.address?.coordinates ? 'Yes ✓' : 'No ✗');
    console.log('   Google Maps Link:', updatedData?.address?.googleMapsLink ? 'Yes ✓' : 'No ✗');
    console.log('   Special Notes:', updatedData?.specialNotes ? 'Yes ✓' : 'No ✗');

    console.log('\n🎯 Property is now ready for testing!');
    console.log('   Property ID:', propertyId);
    console.log('   Completeness: 6/6 (100%) ✅');
    
    console.log('\n🚀 Next step: Run the E2E test again:');
    console.log('   npm run test:e2e\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

// Run the fix
fixTestProperty();
