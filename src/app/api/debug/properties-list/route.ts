import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export async function GET() {
  try {
    console.log('🔍 PROPERTIES DEBUG: Fetching all properties from Firebase...')
    
    // Get all properties directly from Firebase
    const q = query(
      collection(db, 'properties'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const properties: any[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      properties.push({
        id: doc.id,
        name: data.name,
        userId: data.userId,
        address: data.address,
        email: data.email, // In case email is stored here
        createdAt: data.createdAt,
        // Include all fields for debugging
        allData: data
      })
    })
    
    console.log(`🔍 PROPERTIES DEBUG: Found ${properties.length} properties`)
    
    // Look specifically for "Donkey House" variations
    const donkeyHouseVariations = properties.filter(p => 
      p.name && p.name.toLowerCase().includes('donkey')
    )
    
    console.log('🔍 PROPERTIES DEBUG: Donkey House variations:', donkeyHouseVariations)
    
    // Also check for properties with donkey@gmail.com
    const donkeyEmailProperties = properties.filter(p => 
      (p.userId && p.userId.includes('donkey')) || 
      (p.email && p.email.includes('donkey'))
    )
    
    console.log('🔍 PROPERTIES DEBUG: Properties with donkey email:', donkeyEmailProperties)
    
    return NextResponse.json({
      success: true,
      totalProperties: properties.length,
      allProperties: properties,
      donkeyHouseVariations,
      donkeyEmailProperties,
      debug: {
        searchTerms: ['donkey', 'Donkey House', 'donkey house'],
        exactMatches: properties.filter(p => 
          p.name && p.name.toLowerCase().trim() === 'donkey house'
        ),
        partialMatches: properties.filter(p => 
          p.name && p.name.toLowerCase().includes('donkey house')
        )
      }
    })
    
  } catch (error) {
    console.error('❌ PROPERTIES DEBUG: Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
