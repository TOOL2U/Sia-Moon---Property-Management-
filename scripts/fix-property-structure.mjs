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
console.log('🔧 FIXING PROPERTY DATA STRUCTURE');
console.log('═══════════════════════════════════════════════════\n');

try {
  console.log('🔍 Fetching all properties...\n');
  
  const propertiesRef = collection(db, 'properties');
  const snapshot = await getDocs(propertiesRef);
  
  console.log(`✅ Found ${snapshot.size} properties\n`);
  console.log('═══════════════════════════════════════════════════\n');
  
  let fixedCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const property = docSnap.data();
    const propertyId = docSnap.id;
    
    console.log(`🏡 Fixing: ${property.name}`);
    
    // Get the current incorrect data
    const bedrooms = property.bedrooms || 0;
    const bathrooms = property.bathrooms || 0;
    const maxGuests = property.maxGuests || 0;
    const basePrice = property.pricing?.basePrice || property.pricing?.baseRate || 0;
    const houseRules = property.houseRules || {};
    
    console.log(`   Current (wrong): bedrooms=${bedrooms}, bathrooms=${bathrooms}, pricing.basePrice=${basePrice}`);
    
    // Prepare the correct structure
    const updates = {
      // Move bedrooms/bathrooms/maxGuests into details object
      details: {
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        maxGuests: maxGuests,
        propertyType: property.propertyType || 'villa',
        cleaningFee: property.pricing?.cleaningFee || 50,
        petPolicy: houseRules.petsAllowed ? 'allowed' : 'not allowed',
        smokingPolicy: houseRules.smokingAllowed ? 'allowed' : 'not allowed',
        partyPolicy: houseRules.partiesAllowed ? 'allowed' : 'not allowed',
        checkInTime: houseRules.checkIn || '14:00',
        checkOutTime: houseRules.checkOut || '11:00',
        minimumStay: houseRules.minNights || 2,
        maximumStay: houseRules.maxNights || 30,
      },
      
      // Fix pricing structure - rename basePrice to baseRate
      pricing: {
        baseRate: basePrice,
        currency: property.pricing?.currency || 'USD',
        rateType: 'per_night',
        minPrice: property.pricing?.minPrice || basePrice,
        maxPrice: property.pricing?.maxPrice || basePrice,
        weeklyDiscount: property.pricing?.weeklyDiscount || 10,
        monthlyDiscount: property.pricing?.monthlyDiscount || 20,
        cleaningFee: property.pricing?.cleaningFee || 50,
        extraGuestFee: property.pricing?.extraGuestFee || 20,
        seasonalRates: property.pricing?.seasonalRates || [],
      },
      
      // Keep images as-is (already fixed)
      // Keep amenities as-is
      // Keep location as-is
      
      // Update timestamp
      updatedAt: new Date().toISOString()
    };
    
    console.log(`   Fixed (correct): details.bedrooms=${updates.details.bedrooms}, details.bathrooms=${updates.details.bathrooms}, pricing.baseRate=${updates.pricing.baseRate}`);
    
    // Apply the update
    await updateDoc(doc(db, 'properties', propertyId), updates);
    
    fixedCount++;
    console.log(`   ✅ Structure fixed\n`);
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📊 Summary:`);
  console.log(`   Total Properties: ${snapshot.size}`);
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   🔧 Structure: Moved to nested details/pricing objects`);
  console.log(`   🏷️  Fixed fields:`);
  console.log(`      - bedrooms → details.bedrooms`);
  console.log(`      - bathrooms → details.bathrooms`);
  console.log(`      - maxGuests → details.maxGuests`);
  console.log(`      - pricing.basePrice → pricing.baseRate`);
  console.log(`      + Added all details properties\n`);
  
  console.log('🎉 All properties now have correct data structure!');
  console.log('🔄 Refresh your browser to see the changes.\n');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
