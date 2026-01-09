/**
 * Admin Properties API Route
 * Handles property data for admin operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { PropertyService } from '@/lib/services/propertyService'

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

/**
 * POST /api/admin/properties
 * Create a new property
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🏠 Admin API: Creating new property...')

    const body = await request.json()
    const { 
      name, 
      address, 
      city, 
      country, 
      bedrooms, 
      bathrooms, 
      maxGuests, 
      amenities, 
      description,
      pricePerNight,
      currency,
      hasPool,
      hasGarden,
      hasAirConditioning,
      hasParking,
      hasLaundry,
      hasBackupPower,
      userId,
      location // Google Places location data
    } = body

    console.log('📋 Property data to create:', body)

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property name and address are required' 
        },
        { status: 400 }
      )
    }

    const db = getDb()
    
    // Create property document
    const propertyData = {
      // Basic Information
      name: name.trim(),
      description: description?.trim() || '',
      address: address.trim(),
      city: city?.trim() || '',
      country: country || 'Thailand',

      // Property Details
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      maxGuests: parseInt(maxGuests) || 0,
      
      // Amenities
      amenities: amenities || [],
      hasPool: Boolean(hasPool),
      hasGarden: Boolean(hasGarden),
      hasAirConditioning: Boolean(hasAirConditioning),
      hasParking: Boolean(hasParking),
      hasLaundry: Boolean(hasLaundry),
      hasBackupPower: Boolean(hasBackupPower),

      // Rental Information
      pricePerNight: parseFloat(pricePerNight) || 0,
      currency: currency || 'THB',
      
      // Location Data
      location: location || null,

      // User Assignment
      userId: userId || 'admin',

      // Status
      status: 'active',
      isActive: true,

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Save to Firebase
    const propertiesRef = collection(db, 'properties')
    const docRef = await addDoc(propertiesRef, propertyData)

    console.log(`✅ Admin API: Property created with ID: ${docRef.id}`)

    return NextResponse.json({
      success: true,
      message: 'Property created successfully',
      propertyId: docRef.id,
      property: {
        id: docRef.id,
        ...propertyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('❌ Admin API: Error creating property:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create property',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
