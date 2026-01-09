#!/usr/bin/env node

/**
 * Verify Koh Phangan coordinates are on land, not in ocean
 * Checks each property's coordinates against known Koh Phangan boundaries
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

/**
 * Koh Phangan Island Boundaries (verified from Google Maps)
 * The island is roughly 12km x 15km
 * 
 * Geographic boundaries:
 * - Northern tip (Haad Khom): ~9.76°N
 * - Southern tip (Ban Tai): ~9.70°N
 * - Western edge (Thong Sala): ~99.99°E
 * - Eastern edge (Haad Thian): ~100.07°E
 */
const KOH_PHANGAN_BOUNDS = {
  minLat: 9.695,    // South
  maxLat: 9.77,     // North
  minLng: 99.985,   // West
  maxLng: 100.075   // East
};

/**
 * Known reference points on Koh Phangan (from Google Maps)
 */
const REFERENCE_POINTS = {
  thongSala: { name: "Thong Sala (main town)", lat: 9.7380, lng: 100.0194 },
  haadRin: { name: "Haad Rin Beach", lat: 9.7220, lng: 100.0710 },
  bottleBeach: { name: "Bottle Beach", lat: 9.7630, lng: 100.0570 },
  srithanu: { name: "Sri Thanu", lat: 9.7510, lng: 99.9950 },
  banTai: { name: "Ban Tai", lat: 9.7050, lng: 100.0450 }
};

function isOnKohPhangan(lat, lng) {
  return lat >= KOH_PHANGAN_BOUNDS.minLat &&
         lat <= KOH_PHANGAN_BOUNDS.maxLat &&
         lng >= KOH_PHANGAN_BOUNDS.minLng &&
         lng <= KOH_PHANGAN_BOUNDS.maxLng;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function verifyCoordinates() {
  console.log('🗺️  VERIFYING KOH PHANGAN COORDINATES\n');
  console.log('📍 Koh Phangan Island Boundaries:');
  console.log(`   Latitude: ${KOH_PHANGAN_BOUNDS.minLat}°N to ${KOH_PHANGAN_BOUNDS.maxLat}°N`);
  console.log(`   Longitude: ${KOH_PHANGAN_BOUNDS.minLng}°E to ${KOH_PHANGAN_BOUNDS.maxLng}°E`);
  console.log('\n🎯 Known Reference Points:');
  Object.values(REFERENCE_POINTS).forEach(point => {
    console.log(`   - ${point.name}: ${point.lat}, ${point.lng}`);
  });
  console.log('\n' + '='.repeat(70) + '\n');

  try {
    const propertiesRef = collection(db, 'properties');
    const propertiesSnapshot = await getDocs(propertiesRef);

    let onIsland = 0;
    let inOcean = 0;
    let outsideArea = 0;

    propertiesSnapshot.forEach((doc) => {
      const data = doc.data();
      const propertyName = data.name || 'Unnamed Property';
      
      // Extract coordinates
      let coords = null;
      if (data.address?.coordinates) {
        coords = data.address.coordinates;
      } else if (data.coordinates) {
        coords = data.coordinates;
      } else if (data.location?.coordinates) {
        coords = data.location.coordinates;
      } else if (data.latitude && data.longitude) {
        coords = { latitude: data.latitude, longitude: data.longitude };
      }

      if (!coords) {
        console.log(`⚠️  ${propertyName}: NO COORDINATES`);
        return;
      }

      const lat = coords.latitude || coords.lat;
      const lng = coords.longitude || coords.lng;

      console.log(`\n🏠 ${propertyName}`);
      console.log(`   Coordinates: ${lat}, ${lng}`);
      console.log(`   Google Maps: https://www.google.com/maps?q=${lat},${lng}`);

      // Check if on Koh Phangan
      if (isOnKohPhangan(lat, lng)) {
        console.log(`   ✅ ON KOH PHANGAN ISLAND`);
        onIsland++;

        // Find nearest reference point
        let nearestPoint = null;
        let minDistance = Infinity;
        
        Object.entries(REFERENCE_POINTS).forEach(([key, point]) => {
          const distance = calculateDistance(lat, lng, point.lat, point.lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = point;
          }
        });

        console.log(`   📍 Nearest: ${nearestPoint.name} (${minDistance.toFixed(2)} km away)`);

        // Additional validation - check if too close to island edges (might be in water)
        const centerLat = (KOH_PHANGAN_BOUNDS.minLat + KOH_PHANGAN_BOUNDS.maxLat) / 2;
        const centerLng = (KOH_PHANGAN_BOUNDS.minLng + KOH_PHANGAN_BOUNDS.maxLng) / 2;
        const distanceFromCenter = calculateDistance(lat, lng, centerLat, centerLng);
        
        if (distanceFromCenter > 8) {
          console.log(`   ⚠️  WARNING: Property is ${distanceFromCenter.toFixed(2)} km from island center`);
          console.log(`      This might be offshore or on a beach edge`);
        }

        // Check if near boundaries (might indicate ocean placement)
        const nearSouthEdge = Math.abs(lat - KOH_PHANGAN_BOUNDS.minLat) < 0.01;
        const nearNorthEdge = Math.abs(lat - KOH_PHANGAN_BOUNDS.maxLat) < 0.01;
        const nearWestEdge = Math.abs(lng - KOH_PHANGAN_BOUNDS.minLng) < 0.01;
        const nearEastEdge = Math.abs(lng - KOH_PHANGAN_BOUNDS.maxLng) < 0.01;

        if (nearSouthEdge || nearNorthEdge || nearWestEdge || nearEastEdge) {
          console.log(`   ⚠️  EDGE WARNING: Very close to island boundary (might be in water)`);
        }

      } else {
        console.log(`   ❌ OUTSIDE KOH PHANGAN`);
        
        // Check if it's in the Gulf of Thailand (ocean)
        const distanceToThongSala = calculateDistance(lat, lng, 
          REFERENCE_POINTS.thongSala.lat, REFERENCE_POINTS.thongSala.lng);
        
        if (distanceToThongSala < 50) {
          console.log(`   🌊 IN OCEAN/WATER (${distanceToThongSala.toFixed(2)} km from Thong Sala)`);
          inOcean++;
        } else {
          console.log(`   🗺️  DIFFERENT LOCATION (${distanceToThongSala.toFixed(2)} km from Koh Phangan)`);
          outsideArea++;
        }
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL VERDICT:\n');
    console.log(`   ✅ ON ISLAND (Land): ${onIsland}`);
    console.log(`   🌊 IN OCEAN: ${inOcean}`);
    console.log(`   🗺️  OUTSIDE AREA: ${outsideArea}`);
    console.log(`   📍 Total Properties: ${propertiesSnapshot.size}`);

    if (inOcean > 0) {
      console.log('\n⚠️  WARNING: Some properties have coordinates in the OCEAN!');
      console.log('   These markers will appear floating in water on the mobile app.');
      console.log('   You need to update these coordinates to actual land locations.');
    } else if (onIsland === propertiesSnapshot.size - outsideArea) {
      console.log('\n✅ GOOD NEWS: All Koh Phangan properties are on land!');
      console.log('   If mobile app shows markers in ocean, it\'s a mobile app rendering issue.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyCoordinates();
