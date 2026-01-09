import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function addNotes() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  const propertyRef = db.collection('properties').doc('ZBlZH1VLYfAhaiEw3I5C');

  await propertyRef.update({
    specialNotes: `IMPORTANT INFORMATION FOR STAFF:

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
- Fresh flowers in living room appreciated`,
    description: 'Luxury 3-bedroom villa with private pool in Rawai, Phuket. Perfect for families and small groups.',
    updatedAt: Timestamp.now()
  });

  console.log('✅ Special notes and description added!');
}

addNotes();
