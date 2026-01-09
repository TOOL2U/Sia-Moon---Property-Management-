import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
console.log('🧹 CLEANUP OLD TEST PROPERTIES');
console.log('═══════════════════════════════════════════════════\n');

try {
  console.log('🔍 Searching for properties with example.com images...\n');

  const propertiesRef = collection(db, 'properties');
  const snapshot = await getDocs(propertiesRef);
  
  let deletedCount = 0;
  let keptCount = 0;

  for (const docSnap of snapshot.docs) {
    const property = docSnap.data();
    
    // Check if property has example.com URLs in images
    const hasExampleUrls = property.images?.some(img => 
      img.url?.includes('example.com')
    );

    if (hasExampleUrls) {
      console.log(`🗑️  Deleting: ${property.name} (ID: ${docSnap.id})`);
      console.log(`   Reason: Contains example.com image URLs`);
      await deleteDoc(doc(db, 'properties', docSnap.id));
      deletedCount++;
    } else {
      console.log(`✅ Keeping: ${property.name} (ID: ${docSnap.id})`);
      if (property.images?.[0]?.url) {
        const hostname = new URL(property.images[0].url).hostname;
        console.log(`   Images from: ${hostname}`);
      }
      keptCount++;
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`📊 Summary:`);
  console.log(`   🗑️  Deleted: ${deletedCount} properties`);
  console.log(`   ✅ Kept: ${keptCount} properties\n`);

  if (deletedCount === 0) {
    console.log('💡 No old test properties found. All properties are using valid image sources!\n');
  } else {
    console.log('💡 Tip: Run the create-test-properties-with-pms.mjs script to create new test properties with real images.\n');
  }

} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}

process.exit(0);
