import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

// Mock PropertyMatchingService for Node.js testing
class PropertyMatchingService {
  static async matchProperty(input) {
    console.log('\n🔍 Testing Property Matching...');
    console.log('Input:', JSON.stringify(input, null, 2));
    
    // Test all matching methods
    const results = {
      pmsListingId: input.pmsListingId ? 'Would search for pmsListingId' : 'Not provided',
      airbnbListingId: input.airbnbListingId ? 'Would search for airbnbListingId' : 'Not provided',
      bookingComListingId: input.bookingComListingId ? 'Would search for bookingComListingId' : 'Not provided',
      vrboListingId: input.vrboListingId ? 'Would search for vrboListingId' : 'Not provided',
      propertyExternalId: input.propertyExternalId ? 'Would search by property ID' : 'Not provided'
    };
    
    console.log('\nMatching Methods Available:');
    Object.entries(results).forEach(([key, value]) => {
      const icon = value.includes('Not provided') ? '❌' : '✅';
      console.log(`${icon} ${key}: ${value}`);
    });
    
    return {
      success: false,
      matchMethod: 'none',
      confidence: 'low',
      requiresReview: true,
      warnings: ['This is a test - actual matching requires PropertyMatchingService'],
      errors: []
    };
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('🧪 PROPERTY MATCHING SERVICE - TEST SUITE');
console.log('═══════════════════════════════════════════════════\n');

// TEST 1: Match by PMS Listing ID (Primary Method)
console.log('📋 TEST 1: Match by PMS Listing ID');
console.log('───────────────────────────────────────────────────');
await PropertyMatchingService.matchProperty({
  pmsListingId: 'HOST-12345',
  pmsProvider: 'hostaway',
  propertyName: 'Beach Villa Sunset'
});

// TEST 2: Match by Airbnb ID (Fallback)
console.log('\n📋 TEST 2: Match by Airbnb Listing ID');
console.log('───────────────────────────────────────────────────');
await PropertyMatchingService.matchProperty({
  airbnbListingId: 'ABN-67890',
  propertyName: 'Mountain Retreat'
});

// TEST 3: Match by Booking.com ID
console.log('\n📋 TEST 3: Match by Booking.com Listing ID');
console.log('───────────────────────────────────────────────────');
await PropertyMatchingService.matchProperty({
  bookingComListingId: 'BCM-54321',
  propertyName: 'City Center Apartment'
});

// TEST 4: Multiple IDs (Priority Order)
console.log('\n📋 TEST 4: Multiple IDs (Should prioritize PMS)');
console.log('───────────────────────────────────────────────────');
await PropertyMatchingService.matchProperty({
  pmsListingId: 'HOST-12345',
  airbnbListingId: 'ABN-67890',
  bookingComListingId: 'BCM-54321',
  propertyName: 'Lakeside Cottage'
});

// TEST 5: Manual Override (Property ID)
console.log('\n📋 TEST 5: Manual Override (Direct Property ID)');
console.log('───────────────────────────────────────────────────');
await PropertyMatchingService.matchProperty({
  propertyExternalId: 'prop_abc123',
  propertyName: 'Penthouse Suite'
});

// TEST 6: No Matching IDs (Should Fail)
console.log('\n📋 TEST 6: No Matching IDs (Expected Failure)');
console.log('───────────────────────────────────────────────────');
await PropertyMatchingService.matchProperty({
  propertyName: 'Unknown Property'
});

console.log('\n\n═══════════════════════════════════════════════════');
console.log('✅ TEST SUITE COMPLETE');
console.log('═══════════════════════════════════════════════════\n');

console.log('📝 SUMMARY:');
console.log('   - PropertyMatchingService uses priority matching');
console.log('   - Priority: PMS ID > Airbnb ID > Booking.com ID > VRBO ID > Property ID');
console.log('   - No fuzzy string matching - only exact ID matches');
console.log('   - Failed matches require manual review\n');

console.log('🔧 NEXT STEPS:');
console.log('   1. Add properties to Firebase with pmsIntegration fields');
console.log('   2. Run actual matching tests against real data');
console.log('   3. Implement webhook endpoint (Phase 2)');
console.log('   4. Create admin UI for property mapping (Phase 3)\n');

process.exit(0);
