#!/usr/bin/env node

/**
 * Seed script to add mock properties around Koh Phangan, Thailand
 * Run with: node scripts/seed-koh-phangan-properties.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBznNyw1j_2EYvBykjvOmMWHM-9zOQZGPc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "operty-b54dc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "operty-b54dc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "operty-b54dc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "914547669275",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Koh Phangan property locations (around the island)
const PROPERTY_LOCATIONS = [
  // Thong Sala (main town - west side)
  { name: "Sunset Villa Thong Sala", lat: 9.7380, lng: 100.0194, area: "Thong Sala" },
  { name: "Harbor View Resort", lat: 9.7390, lng: 100.0180, area: "Thong Sala" },
  { name: "Beach House Thong Sala", lat: 9.7360, lng: 100.0210, area: "Thong Sala" },
  
  // Haad Rin (southeast - famous for Full Moon Party)
  { name: "Full Moon Beach Villa", lat: 9.6750, lng: 100.0730, area: "Haad Rin" },
  { name: "Sunrise Paradise Resort", lat: 9.6760, lng: 100.0740, area: "Haad Rin" },
  { name: "Party Beach Bungalow", lat: 9.6740, lng: 100.0750, area: "Haad Rin" },
  { name: "Coral Cove Villa", lat: 9.6735, lng: 100.0735, area: "Haad Rin" },
  
  // Haad Yao (west coast)
  { name: "Long Beach Resort", lat: 9.7650, lng: 99.9850, area: "Haad Yao" },
  { name: "Sunset Beach Villa", lat: 9.7660, lng: 99.9840, area: "Haad Yao" },
  { name: "Palm Paradise", lat: 9.7640, lng: 99.9860, area: "Haad Yao" },
  
  // Thong Nai Pan (northeast)
  { name: "Nai Pan Bay Resort", lat: 9.7820, lng: 100.0820, area: "Thong Nai Pan" },
  { name: "Bottle Beach Villa", lat: 9.7840, lng: 100.0840, area: "Thong Nai Pan" },
  { name: "Jungle Paradise", lat: 9.7810, lng: 100.0810, area: "Thong Nai Pan" },
  
  // Haad Salad (northwest)
  { name: "Salad Beach Bungalow", lat: 9.7720, lng: 100.0020, area: "Haad Salad" },
  { name: "Coconut Grove Resort", lat: 9.7730, lng: 100.0010, area: "Haad Salad" },
  
  // Ban Tai (south coast)
  { name: "Ban Tai Villa", lat: 9.7050, lng: 100.0450, area: "Ban Tai" },
  { name: "South Shore Paradise", lat: 9.7040, lng: 100.0460, area: "Ban Tai" },
  { name: "Zen Beach House", lat: 9.7060, lng: 100.0440, area: "Ban Tai" },
  
  // Haad Khom (east coast)
  { name: "Secret Beach Villa", lat: 9.7450, lng: 100.0850, area: "Haad Khom" },
  { name: "Hidden Paradise Resort", lat: 9.7460, lng: 100.0860, area: "Haad Khom" },
  
  // Central island
  { name: "Mountain View Villa", lat: 9.7300, lng: 100.0450, area: "Central" },
  { name: "Jungle Retreat", lat: 9.7320, lng: 100.0470, area: "Central" },
  { name: "Hilltop Sanctuary", lat: 9.7310, lng: 100.0440, area: "Central" },
  
  // More scattered properties
  { name: "Tropical Dream Villa", lat: 9.7200, lng: 100.0250, area: "West Coast" },
  { name: "Ocean Breeze Resort", lat: 9.7550, lng: 100.0650, area: "East Coast" },
  { name: "Island Paradise", lat: 9.7150, lng: 100.0550, area: "South" },
  { name: "Bamboo Beach House", lat: 9.7780, lng: 100.0350, area: "North" },
  { name: "Sea View Sanctuary", lat: 9.7480, lng: 100.0180, area: "West" },
  { name: "Turtle Bay Villa", lat: 9.6900, lng: 100.0600, area: "Southeast" },
  { name: "Moonlight Resort", lat: 9.7600, lng: 100.0100, area: "Northwest" },
];

const STATUSES = ['occupied', 'vacant', 'cleaning', 'maintenance', 'checkout', 'checkin'];

async function seedProperties() {
  console.log('🌴 Seeding Koh Phangan properties...\n');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const property of PROPERTY_LOCATIONS) {
      try {
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        const guestCount = status === 'occupied' ? Math.floor(Math.random() * 6) + 1 : 0;

        const propertyData = {
          propertyId: `prop_${property.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: property.name,
          area: property.area,
          coordinates: {
            latitude: property.lat,
            longitude: property.lng
          },
          status: status,
          guestCount: guestCount,
          lastUpdated: serverTimestamp(),
          address: `${property.name}, ${property.area}, Koh Phangan, Surat Thani, Thailand`,
          createdAt: serverTimestamp()
        };

        // Add to property_status collection for map display
        await addDoc(collection(db, 'property_status'), propertyData);

        console.log(`✅ Added: ${property.name} (${status})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${property.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   ✅ Success: ${successCount} properties`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} properties`);
    }
    console.log('\n📍 Properties are now visible on the Command Center map!');
    console.log('🌐 Visit: http://localhost:3000/command-center\n');

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding
seedProperties();
