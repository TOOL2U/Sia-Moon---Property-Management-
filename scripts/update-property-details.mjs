import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
console.log('🏡 UPDATE PROPERTY DETAILS (Photos, Pricing, Beds)');
console.log('═══════════════════════════════════════════════════\n');

// Koh Phangan property photos from Unsplash
const propertyPhotos = [
  [
    'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800', // Luxury villa
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Bedroom
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', // Pool view
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', // Living room
  ],
  [
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', // Beach villa
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', // Interior
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800', // Pool
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', // Terrace
  ],
  [
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800', // Yoga villa
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', // Peaceful room
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', // Garden
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', // Meditation area
  ],
  [
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', // Hillside villa
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', // Master bedroom
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', // Kitchen
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800', // View
  ],
];

// Property descriptions based on location
const propertyDescriptions = {
  'Haad Rin': 'Stunning beachfront villa located in the heart of Haad Rin, perfect for those seeking vibrant nightlife and beautiful sunrises. Features include infinity pool overlooking the ocean, modern Thai-inspired design, air-conditioned bedrooms, fully equipped kitchen, and direct beach access. Walking distance to famous Full Moon Party beach and all amenities.',
  
  'Thong Sala': 'Prime location villa in Thong Sala town center, ideal for convenience and comfort. Just minutes from the main pier, night markets, and restaurants. This property offers spacious living areas, tropical garden, private parking, and easy access to all island destinations. Perfect for families and groups.',
  
  'Srithanu': 'Peaceful yoga retreat villa in Srithanu village, known for its wellness community and beautiful sunsets. Features open-plan living, meditation deck, tropical garden, and walking distance to yoga studios, healthy restaurants, and the beach. Ideal for digital nomads and wellness seekers.',
  
  'Bottle Beach': 'Exclusive hillside villa with panoramic ocean views overlooking the pristine Bottle Beach. This secluded property offers ultimate privacy, infinity pool, outdoor sala, and lush jungle surroundings. Perfect for nature lovers seeking tranquility. 4WD access or boat transfer available.',
  
  'Ban Khai': 'Luxury sunset villa in Ban Khai hills with breathtaking ocean and sunset views. Features infinity pool, spacious terraces, modern amenities, and elegant Thai-contemporary design. Walking distance to local restaurants and waterfalls. Ideal for romantic getaways and special occasions.',
  
  'Chaloklum': 'Beachfront paradise villa in quiet Chaloklum Bay. Direct beach access, stunning views, tropical garden, and authentic Thai atmosphere. Close to local fishing village, diving centers, and seafood restaurants. Perfect for peaceful beach holidays and water sports enthusiasts.',
  
  'Haad Yao': 'Beautiful beach villa on Haad Yao\'s famous long sandy beach. Features include beachfront location, pool, outdoor living areas, and stunning sunset views. Walking distance to beach bars, restaurants, and water sports. Ideal for families and beach lovers.',
  
  'Thong Nai Pan': 'Pristine beachfront villa in the exclusive Thong Nai Pan area, one of the island\'s most beautiful beaches. Luxury amenities, private pool, direct beach access, and surrounded by nature. Perfect for honeymooners and those seeking ultimate relaxation.',
  
  'Haad Salad': 'Jungle-view hillside villa with ocean panoramas in peaceful Haad Salad. Multi-level design, infinity pool, tropical gardens, and close to the beach. Surrounded by nature yet convenient to restaurants and shops. Perfect for families and nature enthusiasts.'
};

// Property pricing per night (USD)
const propertyPricing = [
  { min: 180, max: 350 }, // Haad Rin - Party area, high demand
  { min: 150, max: 280 }, // Thong Sala - Town center, convenient
  { min: 120, max: 220 }, // Srithanu - Yoga village, popular
  { min: 200, max: 400 }, // Bottle Beach - Remote, exclusive
  { min: 170, max: 320 }, // Ban Khai - Sunset views, romantic
  { min: 160, max: 300 }, // Chaloklum - Beachfront, peaceful
  { min: 140, max: 260 }, // Haad Yao - Long beach, family-friendly
  { min: 220, max: 450 }, // Thong Nai Pan - Pristine, luxury
  { min: 130, max: 240 }, // Haad Salad - Jungle view, nature
];

// Property bedroom/bathroom configurations
const propertyConfigs = [
  { bedrooms: 3, bathrooms: 2, maxGuests: 6 },   // Haad Rin
  { bedrooms: 4, bathrooms: 3, maxGuests: 8 },   // Thong Sala
  { bedrooms: 2, bathrooms: 2, maxGuests: 4 },   // Srithanu
  { bedrooms: 5, bathrooms: 4, maxGuests: 10 },  // Bottle Beach
  { bedrooms: 3, bathrooms: 3, maxGuests: 6 },   // Ban Khai
  { bedrooms: 4, bathrooms: 3, maxGuests: 8 },   // Chaloklum
  { bedrooms: 3, bathrooms: 2, maxGuests: 6 },   // Haad Yao
  { bedrooms: 4, bathrooms: 4, maxGuests: 8 },   // Thong Nai Pan
  { bedrooms: 3, bathrooms: 2, maxGuests: 6 },   // Haad Salad
];

// Amenities based on property type
const commonAmenities = [
  'Air Conditioning',
  'WiFi',
  'Swimming Pool',
  'Kitchen',
  'Washing Machine',
  'TV',
  'Free Parking',
  'Hot Water',
  'Bed Linens',
  'Towels',
  'Beach Access',
  'Sea View',
  'Garden',
  'Outdoor Furniture',
  'BBQ Grill',
  'Safety Deposit Box',
  'First Aid Kit',
  'Fire Extinguisher',
  'Motorbike Parking',
];

try {
  console.log('🔍 Fetching all properties...\n');
  
  const propertiesRef = collection(db, 'properties');
  const snapshot = await getDocs(propertiesRef);
  
  const properties = [];
  snapshot.forEach(doc => {
    properties.push({ id: doc.id, ...doc.data() });
  });

  console.log(`✅ Found ${properties.length} properties\n`);
  console.log('═══════════════════════════════════════════════════\n');
  
  let updatedCount = 0;
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const config = propertyConfigs[i % propertyConfigs.length];
    const pricing = propertyPricing[i % propertyPricing.length];
    const photos = propertyPhotos[i % propertyPhotos.length];
    
    // Get neighborhood from existing location
    const neighborhood = property.location?.neighborhood || 'Koh Phangan';
    const description = propertyDescriptions[neighborhood] || propertyDescriptions['Thong Sala'];
    
    console.log(`🏡 Updating: ${property.name}`);
    console.log(`   Location: ${neighborhood}`);
    console.log(`   Bedrooms: ${config.bedrooms} | Bathrooms: ${config.bathrooms}`);
    console.log(`   Price: $${pricing.min}-${pricing.max}/night`);
    console.log(`   Photos: ${photos.length} images`);
    
    // Calculate average price
    const averagePrice = Math.round((pricing.min + pricing.max) / 2);
    
    // Update the property with complete details
    await updateDoc(doc(db, 'properties', property.id), {
      // Pricing
      pricing: {
        basePrice: averagePrice,
        currency: 'USD',
        minPrice: pricing.min,
        maxPrice: pricing.max,
        weeklyDiscount: 10,
        monthlyDiscount: 20,
        cleaningFee: 50,
        extraGuestFee: 20,
      },
      
      // Property details
      bedrooms: config.bedrooms,
      bathrooms: config.bathrooms,
      maxGuests: config.maxGuests,
      propertyType: 'villa',
      
      // Description
      description: description,
      
      // Photos
      photos: photos,
      
      // Amenities
      amenities: commonAmenities,
      
      // Features
      features: {
        wifi: true,
        airConditioning: true,
        pool: true,
        kitchen: true,
        parking: true,
        beachAccess: true,
        seaView: true,
      },
      
      // Status - set to active
      status: 'active',
      
      // House rules
      houseRules: {
        checkIn: '14:00',
        checkOut: '11:00',
        smokingAllowed: false,
        petsAllowed: false,
        partiesAllowed: false,
        childrenAllowed: true,
        minNights: 2,
        maxNights: 30,
      },
      
      // Update timestamp
      updatedAt: new Date().toISOString()
    });
    
    updatedCount++;
    console.log(`   ✅ Updated successfully\n`);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ UPDATE COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📊 Summary:`);
  console.log(`   Total Properties: ${properties.length}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   💵 Pricing: $120-$450/night range`);
  console.log(`   🛏️  Bedrooms: 2-5 per property`);
  console.log(`   🖼️  Photos: 4 per property`);
  console.log(`   ✨ Amenities: ${commonAmenities.length} items\n`);
  
  console.log('🎉 All properties now have complete details!');
  console.log('📸 Photos, pricing, descriptions, and amenities added.\n');

} catch (error) {
  console.error('❌ Error updating properties:', error);
  process.exit(1);
}

process.exit(0);
