import { NextResponse } from 'next/server'
import { collection, getDocs, query, orderBy, Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Use the centralized Firebase db instance

// Helper function to ensure db is available
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

export async function GET() {
  try {
    console.log('🔍 PROPERTIES DEBUG: Fetching all properties from Firebase...')

    // Get all properties directly from Firebase
    const q = query(
      collection(getDb(), 'properties'),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const properties: Array<{ id: string; [key: string]: unknown }> = []

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

    console.log(`✅ PROPERTIES DEBUG: Found ${properties.length} properties`)

    return NextResponse.json({
      success: true,
      count: properties.length,
      properties,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ PROPERTIES DEBUG: Error fetching properties:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch properties',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}