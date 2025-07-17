/**
 * Admin Properties API Route
 * Handles property data for admin operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * GET /api/admin/properties
 * Get all properties for admin operations
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏠 Admin API: Getting all properties...')

    const db = getDb()
    const propertiesRef = collection(db, 'properties')
    const q = query(propertiesRef, orderBy('createdAt', 'desc'))
    
    const querySnapshot = await getDocs(q)
    const properties: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      properties.push({
        id: doc.id,
        name: data.name || data.title || 'Unnamed Property',
        address: data.address || data.location || 'Address not available',
        ...data
      })
    })

    console.log(`✅ Admin API: Found ${properties.length} properties`)

    return NextResponse.json({
      success: true,
      properties,
      count: properties.length
    })
  } catch (error) {
    console.error('❌ Admin API: Error getting properties:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch properties',
        properties: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
