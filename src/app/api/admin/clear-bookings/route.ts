import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, deleteDoc, doc, Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Helper function to ensure db is available
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

/**
 * DELETE /api/admin/clear-bookings
 * Clear all bookings from the live_bookings collection
 * For testing purposes only
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 ADMIN: Clear bookings request received')
    
    // Simple authentication check - only allow in development or with admin key
    const adminKey = request.headers.get('x-admin-key')
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && adminKey !== 'sia-moon-admin-clear-2025') {
      console.log('❌ ADMIN: Unauthorized clear bookings request')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (!db) {
      console.log('❌ ADMIN: Firebase not initialized')
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }
    
    console.log('📋 ADMIN: Fetching all bookings from live_bookings collection...')
    const bookingsRef = collection(getDb(), 'live_bookings')
    const snapshot = await getDocs(bookingsRef)
    
    console.log(`📊 ADMIN: Found ${snapshot.size} bookings to delete`)
    
    if (snapshot.size === 0) {
      console.log('✅ ADMIN: No bookings found - collection is already empty')
      return NextResponse.json({
        success: true,
        message: 'No bookings to delete - collection is already empty',
        deletedCount: 0
      })
    }
    
    console.log('🗑️ ADMIN: Deleting all bookings...')
    const deletePromises: Promise<void>[] = []
    const deletedIds: string[] = []
    
    snapshot.forEach((docSnapshot) => {
      console.log(`🗑️ ADMIN: Queuing deletion of booking: ${docSnapshot.id}`)
      deletedIds.push(docSnapshot.id)
      deletePromises.push(deleteDoc(doc(getDb(), 'live_bookings', docSnapshot.id)))
    })
    
    await Promise.all(deletePromises)
    
    console.log('✅ ADMIN: All bookings deleted successfully!')
    console.log('🎯 ADMIN: Database is now clean and ready for fresh test bookings')
    
    return NextResponse.json({
      success: true,
      message: 'All bookings cleared successfully',
      deletedCount: deletedIds.length,
      deletedIds: deletedIds
    })
    
  } catch (error) {
    console.error('❌ ADMIN: Error clearing bookings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
