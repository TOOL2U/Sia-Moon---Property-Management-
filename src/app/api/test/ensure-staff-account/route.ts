/**
 * API endpoint to ensure the default staff account exists for job assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('👤 Ensuring default staff account exists...')

    const db = getDb()
    const staffEmail = 'staff@siamoon.com'
    
    // Check if staff account already exists
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('email', '==', staffEmail)
    )
    
    const existingStaff = await getDocs(staffQuery)
    
    if (!existingStaff.empty) {
      const staffDoc = existingStaff.docs[0]
      const staffData = { id: staffDoc.id, ...staffDoc.data() }
      
      console.log(`✅ Staff account already exists: ${staffEmail}`)
      
      return NextResponse.json({
        success: true,
        message: 'Staff account already exists',
        staffId: staffDoc.id,
        staffData
      })
    }

    // Create the default staff account
    const staffData = {
      name: 'Default Staff Member',
      email: staffEmail,
      phone: '+1234567890',
      role: 'staff',
      status: 'active',
      
      // Skills for all job types
      skills: [
        'cleaning',
        'housekeeping',
        'deep_cleaning',
        'inspection',
        'maintenance',
        'quality_control',
        'hospitality',
        'guest_services',
        'inventory',
        'setup',
        'laundry'
      ],
      
      // Work schedule
      workingHours: {
        start: '08:00',
        end: '18:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      
      // Performance metrics
      completionRate: 95,
      averageRating: 4.8,
      totalJobsCompleted: 150,
      
      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'SYSTEM_SETUP',
      
      // Flags
      isDefaultStaff: true,
      autoAssignEnabled: true
    }

    const staffRef = await addDoc(collection(db, 'staff_accounts'), staffData)
    
    console.log(`✅ Created default staff account: ${staffRef.id}`)

    return NextResponse.json({
      success: true,
      message: 'Default staff account created successfully',
      staffId: staffRef.id,
      staffData: {
        ...staffData,
        id: staffRef.id
      }
    })

  } catch (error) {
    console.error('❌ Error ensuring staff account:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
