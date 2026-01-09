import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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
console.log('🏠 CREATE TEST PROPERTIES - With PMS Integration');
console.log('═══════════════════════════════════════════════════\n');

const testProperties = [
  {
    name: 'Beach Villa Sunset',
    description: 'Stunning 4-bedroom beachfront villa with panoramic ocean views, private pool, and direct beach access. Perfect for families and groups seeking luxury coastal living with modern amenities and breathtaking sunsets.',
    type: 'villa',
    status: 'active',
    ownerId: 'test-owner-1',
    ownerName: 'John Doe',
    ownerEmail: 'john@example.com',
    
    // PMS Integration
    pmsIntegration: {
      provider: 'hostaway',
      pmsListingId: 'HOST-BEACH-001',
      airbnbListingId: 'ABN-554433',
      bookingComListingId: 'BCM-778899',
      syncEnabled: true,
      lastSyncedAt: new Date().toISOString()
    },
    
    // Location with navigation
    location: {
      address: '123 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      country: 'USA',
      zipCode: '33139',
      coordinates: {
        latitude: 25.7907,
        longitude: -80.1300
      },
      googleMapsLink: 'https://www.google.com/maps/search/?api=1&query=25.7907,-80.1300',
      accessInstructions: 'Use the main entrance at the south gate. Gate code will be sent 24 hours before check-in. Follow the palm-lined driveway to the villa entrance.',
      parkingInstructions: 'Private covered parking for 3 vehicles in the driveway. Additional street parking available.',
      entryCode: '1234',
      wifiPassword: 'SunsetVilla2026',
      neighborhood: 'South Beach',
      emergencyContact: {
        name: 'Property Manager - Sarah Johnson',
        phone: '+1 (305) 555-0123',
        relationship: 'Property Manager'
      }
    },
    
    // Pricing
    pricing: {
      baseRate: 450,
      currency: 'USD',
      rateType: 'per_night',
      seasonalRates: [
        {
          id: 'winter-season',
          name: 'Winter Season (Peak)',
          startDate: '2025-12-15',
          endDate: '2026-04-15',
          rate: 650,
          minimumStay: 3,
          active: true
        },
        {
          id: 'summer-season',
          name: 'Summer Season',
          startDate: '2026-06-01',
          endDate: '2026-09-01',
          rate: 550,
          minimumStay: 2,
          active: true
        }
      ],
      weekendPremium: 100,
      holidayPremium: 200,
      weeklyDiscount: 10,
      monthlyDiscount: 20,
      minimumRate: 350,
      maximumRate: 850,
      dynamicPricing: true,
      priceHistory: []
    },
    
    // Basic details
    details: {
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      area: 2500,
      cleaningFee: 250,
      securityDeposit: 1000,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minimumStay: 2
    },
    
    // Amenities
    amenities: [
      { id: 'wifi', name: 'High-Speed WiFi', category: 'technology', available: true },
      { id: 'pool', name: 'Private Pool', category: 'outdoor', available: true },
      { id: 'ac', name: 'Air Conditioning', category: 'climate', available: true },
      { id: 'kitchen', name: 'Full Kitchen', category: 'kitchen', available: true },
      { id: 'parking', name: 'Free Parking', category: 'parking', available: true },
      { id: 'tv', name: 'Smart TV', category: 'entertainment', available: true },
      { id: 'washer', name: 'Washer & Dryer', category: 'laundry', available: true },
      { id: 'beach-access', name: 'Beach Access', category: 'outdoor', available: true },
      { id: 'bbq', name: 'BBQ Grill', category: 'outdoor', available: true },
      { id: 'ocean-view', name: 'Ocean View', category: 'view', available: true }
    ],
    
    // Images - Multiple professional photos
    images: [
      {
        id: 'beach-villa-main',
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
        caption: 'Beachfront Villa Exterior with Ocean Views',
        order: 1,
        room: 'exterior',
        isMain: true,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'beach-villa-pool',
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        caption: 'Private Infinity Pool with Ocean View',
        order: 2,
        room: 'pool',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'beach-villa-living',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
        caption: 'Spacious Living Room with Floor-to-Ceiling Windows',
        order: 3,
        room: 'living_room',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'beach-villa-master',
        url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
        caption: 'Master Bedroom with Ocean Views',
        order: 4,
        room: 'bedroom',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'beach-villa-kitchen',
        url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop',
        caption: 'Modern Gourmet Kitchen',
        order: 5,
        room: 'kitchen',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'beach-villa-deck',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
        caption: 'Sunset Deck with Outdoor Dining',
        order: 6,
        room: 'outdoor',
        isMain: false,
        uploadedAt: new Date().toISOString()
      }
    ],
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationStatus: 'verified',
    complianceStatus: 'compliant'
  },
  {
    name: 'Mountain Retreat Cabin',
    description: 'Charming 3-bedroom mountain cabin nestled in the Rockies with stunning alpine views, wood-burning fireplace, and access to world-class skiing and hiking trails. Authentic rustic luxury with modern comforts.',
    type: 'cabin',
    status: 'active',
    ownerId: 'test-owner-2',
    ownerName: 'Jane Smith',
    ownerEmail: 'jane@example.com',
    
    // PMS Integration
    pmsIntegration: {
      provider: 'guesty',
      pmsListingId: 'GUEST-MOUNT-002',
      airbnbListingId: 'ABN-665544',
      vrboListingId: 'VRBO-123456',
      syncEnabled: true,
      lastSyncedAt: new Date().toISOString()
    },
    
    // Location
    location: {
      address: '456 Mountain Road',
      city: 'Aspen',
      state: 'CO',
      country: 'USA',
      zipCode: '81611',
      coordinates: {
        latitude: 39.1911,
        longitude: -106.8175
      },
      googleMapsLink: 'https://www.google.com/maps/search/?api=1&query=39.1911,-106.8175',
      accessInstructions: '4WD recommended in winter months. Turn left at the red barn, continue 0.5 miles up the mountain road. Cabin is on the right with stone entrance.',
      parkingInstructions: 'Park in front of the cabin - 2 vehicle spaces. Keep chains in vehicle during winter.',
      entryCode: '5678',
      wifiPassword: 'MountainRetreat2026',
      emergencyContact: {
        name: 'Mountain Manager - Tom Davidson',
        phone: '+1 (970) 555-0456',
        relationship: 'Property Manager'
      }
    },
    
    // Pricing
    pricing: {
      baseRate: 325,
      currency: 'USD',
      rateType: 'per_night',
      seasonalRates: [
        {
          id: 'ski-season',
          name: 'Ski Season (Peak)',
          startDate: '2025-12-01',
          endDate: '2026-03-31',
          rate: 525,
          minimumStay: 4,
          active: true
        },
        {
          id: 'summer-hiking',
          name: 'Summer Hiking Season',
          startDate: '2026-06-15',
          endDate: '2026-09-15',
          rate: 400,
          minimumStay: 2,
          active: true
        }
      ],
      weekendPremium: 75,
      holidayPremium: 150,
      weeklyDiscount: 12,
      monthlyDiscount: 25,
      minimumRate: 275,
      maximumRate: 625,
      dynamicPricing: true,
      priceHistory: []
    },
    
    details: {
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      area: 1800,
      cleaningFee: 175,
      securityDeposit: 750,
      checkInTime: '16:00',
      checkOutTime: '10:00',
      minimumStay: 3
    },
    
    // Amenities
    amenities: [
      { id: 'wifi', name: 'High-Speed WiFi', category: 'technology', available: true },
      { id: 'fireplace', name: 'Wood-Burning Fireplace', category: 'heating', available: true },
      { id: 'heating', name: 'Central Heating', category: 'climate', available: true },
      { id: 'kitchen', name: 'Full Kitchen', category: 'kitchen', available: true },
      { id: 'parking', name: 'Free Parking', category: 'parking', available: true },
      { id: 'tv', name: 'Smart TV', category: 'entertainment', available: true },
      { id: 'washer', name: 'Washer & Dryer', category: 'laundry', available: true },
      { id: 'hot-tub', name: 'Private Hot Tub', category: 'outdoor', available: true },
      { id: 'deck', name: 'Mountain View Deck', category: 'outdoor', available: true },
      { id: 'ski-storage', name: 'Ski Storage', category: 'storage', available: true }
    ],
    
    images: [
      {
        id: 'cabin-main',
        url: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&h=300&fit=crop',
        caption: 'Mountain Cabin Exterior in Winter',
        order: 1,
        room: 'exterior',
        isMain: true,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'cabin-living',
        url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=300&fit=crop',
        caption: 'Cozy Living Room with Stone Fireplace',
        order: 2,
        room: 'living_room',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'cabin-bedroom',
        url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop',
        caption: 'Master Bedroom with Mountain Views',
        order: 3,
        room: 'bedroom',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'cabin-kitchen',
        url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop',
        caption: 'Rustic Kitchen with Modern Appliances',
        order: 4,
        room: 'kitchen',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'cabin-hottub',
        url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop',
        caption: 'Private Hot Tub with Mountain Views',
        order: 5,
        room: 'outdoor',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'cabin-deck',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
        caption: 'Wraparound Deck with Alpine Views',
        order: 6,
        room: 'outdoor',
        isMain: false,
        uploadedAt: new Date().toISOString()
      }
    ],
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationStatus: 'verified',
    complianceStatus: 'compliant'
  },
  {
    name: 'City Center Apartment',
    description: 'Sleek 2-bedroom apartment in the heart of Manhattan with floor-to-ceiling windows, modern designer furnishings, and steps from Times Square. Perfect for business travelers and tourists seeking urban luxury.',
    type: 'apartment',
    status: 'active',
    ownerId: 'test-owner-3',
    ownerName: 'Mike Johnson',
    ownerEmail: 'mike@example.com',
    
    // PMS Integration
    pmsIntegration: {
      provider: 'manual',
      propertyExternalId: 'MANUAL-CITY-003',
      syncEnabled: false
    },
    
    // Location
    location: {
      address: '789 Main Street, Apt 12B',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      coordinates: {
        latitude: 40.7506,
        longitude: -73.9935
      },
      googleMapsLink: 'https://www.google.com/maps/search/?api=1&query=40.7506,-73.9935',
      accessInstructions: 'Enter through main lobby on Main Street. Show confirmation to concierge. Use elevator to 12th floor, apartment 12B is on the left.',
      parkingInstructions: 'Public parking garage on 8th Ave (2 blocks). Street parking very limited.',
      entryCode: '9012',
      wifiPassword: 'CityCenter2026',
      emergencyContact: {
        name: 'Building Concierge',
        phone: '+1 (212) 555-0789',
        relationship: 'Building Staff'
      }
    },
    
    // Pricing
    pricing: {
      baseRate: 275,
      currency: 'USD',
      rateType: 'per_night',
      seasonalRates: [
        {
          id: 'holiday-season',
          name: 'Holiday Season',
          startDate: '2025-11-20',
          endDate: '2026-01-05',
          rate: 425,
          minimumStay: 3,
          active: true
        },
        {
          id: 'fashion-week',
          name: 'Fashion Week',
          startDate: '2026-02-10',
          endDate: '2026-02-20',
          rate: 375,
          minimumStay: 2,
          active: true
        }
      ],
      weekendPremium: 50,
      holidayPremium: 100,
      weeklyDiscount: 8,
      monthlyDiscount: 18,
      minimumRate: 225,
      maximumRate: 475,
      dynamicPricing: true,
      priceHistory: []
    },
    
    details: {
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      area: 1200,
      cleaningFee: 125,
      securityDeposit: 500,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minimumStay: 1
    },
    
    // Amenities
    amenities: [
      { id: 'wifi', name: 'High-Speed WiFi', category: 'technology', available: true },
      { id: 'ac', name: 'Central Air', category: 'climate', available: true },
      { id: 'heating', name: 'Central Heating', category: 'climate', available: true },
      { id: 'kitchen', name: 'Full Kitchen', category: 'kitchen', available: true },
      { id: 'elevator', name: 'Elevator Access', category: 'accessibility', available: true },
      { id: 'tv', name: '4K Smart TV', category: 'entertainment', available: true },
      { id: 'washer', name: 'In-Unit Washer/Dryer', category: 'laundry', available: true },
      { id: 'concierge', name: '24/7 Concierge', category: 'service', available: true },
      { id: 'gym', name: 'Building Gym', category: 'fitness', available: true },
      { id: 'city-view', name: 'Skyline Views', category: 'view', available: true }
    ],
    
    images: [
      {
        id: 'apt-main',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
        caption: 'Modern Living Space with City Views',
        order: 1,
        room: 'living_room',
        isMain: true,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'apt-bedroom',
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
        caption: 'Master Bedroom with Designer Furnishings',
        order: 2,
        room: 'bedroom',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'apt-kitchen',
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        caption: 'Contemporary Kitchen with Island',
        order: 3,
        room: 'kitchen',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'apt-bathroom',
        url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
        caption: 'Spa-Like Bathroom',
        order: 4,
        room: 'bathroom',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'apt-view',
        url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
        caption: 'Manhattan Skyline Views',
        order: 5,
        room: 'view',
        isMain: false,
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'apt-workspace',
        url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200&h=800&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop',
        caption: 'Dedicated Workspace Area',
        order: 6,
        room: 'office',
        isMain: false,
        uploadedAt: new Date().toISOString()
      }
    ],
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationStatus: 'verified',
    complianceStatus: 'compliant'
  }
];

console.log('📝 Creating test properties with PMS integration...\n');

for (const property of testProperties) {
  try {
    const docRef = await addDoc(collection(db, 'properties'), property);
    
    console.log(`✅ Created: ${property.name}`);
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Type: ${property.type.charAt(0).toUpperCase() + property.type.slice(1)}`);
    console.log(`   📍 Location: ${property.location.city}, ${property.location.state}`);
    console.log(`   💰 Base Rate: $${property.pricing.baseRate}/${property.pricing.rateType.replace('per_', '')}`);
    console.log(`   🛏️  ${property.details.bedrooms} bed, ${property.details.bathrooms} bath, ${property.details.maxGuests} guests`);
    console.log(`   🖼️  Images: ${property.images.length} photos`);
    console.log(`   🔧 PMS Provider: ${property.pmsIntegration.provider}`);
    console.log(`   🆔 PMS Listing ID: ${property.pmsIntegration.pmsListingId || 'N/A'}`);
    console.log(`   🏠 Airbnb ID: ${property.pmsIntegration.airbnbListingId || 'N/A'}`);
    console.log(`   🗺️  Google Maps: ${property.location.googleMapsLink ? '✅' : '❌'}`);
    console.log('');
    
  } catch (error) {
    console.error(`❌ Error creating ${property.name}:`, error.message);
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('✅ TEST PROPERTIES CREATED');
console.log('═══════════════════════════════════════════════════\n');

console.log('🔧 You can now test property matching with:');
console.log('   node scripts/test-property-matching.mjs\n');

console.log('📋 Test Matching Scenarios:');
console.log('   1. By Hostaway ID:  HOST-BEACH-001');
console.log('   2. By Airbnb ID:    ABN-665544');
console.log('   3. By Booking.com:  BCM-778899');
console.log('   4. By VRBO ID:      VRBO-123456');
console.log('   5. By Property ID:  Use actual Firebase doc ID\n');

process.exit(0);
