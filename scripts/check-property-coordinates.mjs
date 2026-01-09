#!/usr/bin/env node

/**
 * Check property coordinates in database
 * Determines if map marker issues are webapp (bad data) or mobile app (bad rendering)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBznNyw1j_2EYvBykjvOmMWHM-9zOQZGPc",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPropertyCoordinates() {
  console.log('🗺️  Checking property coordinates in database...\n');

  try {
    const propertiesRef = collection(db, 'properties');
    const propertiesSnapshot = await getDocs(propertiesRef);

    if (propertiesSnapshot.empty) {
      console.log('❌ No properties found in database');
      return;
    }

    console.log(`📊 Found ${propertiesSnapshot.size} properties\n`);

    let hasCoordinates = 0;
    let missingCoordinates = 0;

    propertiesSnapshot.forEach((doc) => {
      const data = doc.data();
      const propertyName = data.name || 'Unnamed Property';
      
      console.log(`\n🏠 Property: ${propertyName}`);
      console.log(`   ID: ${doc.id}`);
      
      // Check various possible coordinate locations
      let foundCoords = false;
      let coords = null;
      
      // Check address.coordinates
      if (data.address?.coordinates) {
        coords = data.address.coordinates;
        console.log(`   ✅ Found coordinates in address.coordinates:`);
        foundCoords = true;
      }
      // Check top-level coordinates
      else if (data.coordinates) {
        coords = data.coordinates;
        console.log(`   ✅ Found coordinates in coordinates:`);
        foundCoords = true;
      }
      // Check location.coordinates
      else if (data.location?.coordinates) {
        coords = data.location.coordinates;
        console.log(`   ✅ Found coordinates in location.coordinates:`);
        foundCoords = true;
      }
      // Check for separate latitude/longitude fields
      else if (data.latitude && data.longitude) {
        coords = { latitude: data.latitude, longitude: data.longitude };
        console.log(`   ✅ Found separate latitude/longitude fields:`);
        foundCoords = true;
      }
      
      if (foundCoords && coords) {
        console.log(`      Latitude: ${coords.latitude || coords.lat}`);
        console.log(`      Longitude: ${coords.longitude || coords.lng}`);
        
        // Validate coordinates are in reasonable range
        const lat = coords.latitude || coords.lat;
        const lng = coords.longitude || coords.lng;
        
        if (lat && lng) {
          // Koh Phangan is around latitude 9.7, longitude 100.0
          if (lat >= 9.6 && lat <= 9.9 && lng >= 99.9 && lng <= 100.2) {
            console.log(`      ✅ Coordinates look correct for Koh Phangan`);
            hasCoordinates++;
          } else {
            console.log(`      ⚠️  WARNING: Coordinates outside Koh Phangan range!`);
            console.log(`         Expected: lat 9.6-9.9, lng 99.9-100.2`);
            console.log(`         Got: lat ${lat}, lng ${lng}`);
            hasCoordinates++;
          }
          
          // Generate Google Maps link to verify
          console.log(`      🗺️  Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
        } else {
          console.log(`      ❌ Invalid coordinate values`);
          missingCoordinates++;
        }
      } else {
        console.log(`   ❌ NO COORDINATES FOUND`);
        console.log(`      Property has these fields: ${Object.keys(data).join(', ')}`);
        missingCoordinates++;
      }
      
      // Show address if available
      if (data.address?.fullAddress) {
        console.log(`   📍 Address: ${data.address.fullAddress}`);
      } else if (data.location) {
        console.log(`   📍 Location: ${data.location}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total Properties: ${propertiesSnapshot.size}`);
    console.log(`   ✅ With Coordinates: ${hasCoordinates}`);
    console.log(`   ❌ Missing Coordinates: ${missingCoordinates}`);
    
    if (missingCoordinates > 0) {
      console.log('\n⚠️  DIAGNOSIS: This is a WEBAPP ISSUE');
      console.log('   The properties in your database are missing GPS coordinates.');
      console.log('   The mobile app cannot display markers without coordinate data.');
      console.log('\n💡 SOLUTION:');
      console.log('   1. Add coordinates to each property during property creation');
      console.log('   2. Update existing properties with their GPS coordinates');
      console.log('   3. Properties should have address.coordinates with latitude/longitude');
    } else {
      console.log('\n✅ All properties have coordinates!');
      console.log('   If map markers are still misplaced, this is a MOBILE APP issue.');
      console.log('   The mobile app may be rendering coordinates incorrectly.');
    }
    
  } catch (error) {
    console.error('❌ Error checking coordinates:', error);
  } finally {
    process.exit(0);
  }
}

checkPropertyCoordinates();
