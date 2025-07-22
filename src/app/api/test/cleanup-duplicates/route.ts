import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore'

export async function POST() {
  try {
    if (!db) {
      throw new Error('Firebase not initialized')
    }

    let deletedCount = 0

    // Clean up duplicate property statuses
    const propertyQuery = query(
      collection(db, 'property_status'),
      orderBy('lastUpdated', 'desc')
    )
    
    const propertySnapshot = await getDocs(propertyQuery)
    const seenProperties = new Set<string>()
    const propertiesToDelete: string[] = []

    propertySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const propertyId = data.propertyId

      if (seenProperties.has(propertyId)) {
        // This is a duplicate, mark for deletion
        propertiesToDelete.push(docSnapshot.id)
      } else {
        // First occurrence, keep it
        seenProperties.add(propertyId)
      }
    })

    // Delete duplicate property statuses
    for (const docId of propertiesToDelete) {
      await deleteDoc(doc(db, 'property_status', docId))
      deletedCount++
    }

    // Clean up duplicate staff locations (keep only latest per staff)
    const staffQuery = query(
      collection(db, 'staff_locations'),
      orderBy('timestamp', 'desc')
    )
    
    const staffSnapshot = await getDocs(staffQuery)
    const seenStaff = new Set<string>()
    const staffToDelete: string[] = []

    staffSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const staffId = data.staffId

      if (seenStaff.has(staffId)) {
        // This is an older location, mark for deletion
        staffToDelete.push(docSnapshot.id)
      } else {
        // Latest location, keep it
        seenStaff.add(staffId)
      }
    })

    // Delete old staff locations (keep only latest)
    for (const docId of staffToDelete) {
      await deleteDoc(doc(db, 'staff_locations', docId))
      deletedCount++
    }

    return NextResponse.json({
      success: true,
      message: 'Duplicate data cleaned up successfully',
      data: {
        deletedDocuments: deletedCount,
        uniqueProperties: seenProperties.size,
        uniqueStaff: seenStaff.size
      }
    })

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error)
    return NextResponse.json(
      { 
        error: 'Failed to cleanup duplicates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Duplicate Data Cleanup',
    usage: 'POST to this endpoint to remove duplicate property and staff data',
    note: 'This will keep only the latest entry per property/staff member'
  })
}
