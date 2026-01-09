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
console.log('🖼️  FIX PROPERTY IMAGES - Convert to Proper Format');
console.log('═══════════════════════════════════════════════════\n');

// Koh Phangan property photos from Unsplash (same as before)
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

const imageLabels = ['Main View', 'Interior', 'Amenities', 'Additional View'];

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
    const photos = propertyPhotos[i % propertyPhotos.length];
    
    console.log(`🖼️  Updating: ${property.name}`);
    console.log(`   Current images format: ${typeof property.images}`);
    
    // Convert photos array to proper PropertyImage format
    const propertyImages = photos.map((url, index) => ({
      id: `img-${i}-${index}`,
      url: url,
      caption: `${property.name} - ${imageLabels[index]}`,
      order: index,
      isMain: index === 0,
      width: 800,
      height: 600,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'system'
    }));
    
    console.log(`   New images: ${propertyImages.length} images in proper format`);
    console.log(`   Main image: ${propertyImages[0].url}`);
    
    // Update the property with properly formatted images
    await updateDoc(doc(db, 'properties', property.id), {
      images: propertyImages,
      updatedAt: new Date().toISOString()
    });
    
    updatedCount++;
    console.log(`   ✅ Updated successfully\n`);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ IMAGE FORMAT UPDATE COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📊 Summary:`);
  console.log(`   Total Properties: ${properties.length}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   🖼️  Images per property: 4`);
  console.log(`   📐 Format: PropertyImage[] with proper structure\n`);
  
  console.log('🎉 All properties now have properly formatted images!');
  console.log('✨ Images structure: { id, url, caption, order, isMain, width, height, uploadedAt }\n');

} catch (error) {
  console.error('❌ Error updating properties:', error);
  process.exit(1);
}

process.exit(0);
