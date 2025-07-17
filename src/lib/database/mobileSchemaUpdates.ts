import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * Add mobile sync fields to existing bookings
 */
export async function addMobileSyncFieldsToBookings(): Promise<{
  success: boolean
  updated: number
  errors: string[]
}> {
  const database = getDb()
  const errors: string[] = []
  let updated = 0

  try {
    console.log('📋 Adding mobile sync fields to existing bookings...')
    
    // Get all bookings that don't have mobile sync fields
    const bookingsQuery = query(
      collection(database, 'bookings'),
      where('mobileLastSync', '==', null)
    )
    
    const snapshot = await getDocs(bookingsQuery)
    const batch = writeBatch(database)
    
    snapshot.docs.forEach((docSnapshot) => {
      const bookingRef = doc(database, 'bookings', docSnapshot.id)
      batch.update(bookingRef, {
        mobileLastSync: 0,
        syncVersion: 1,
        lastSyncedAt: serverTimestamp(),
        syncedFromMobile: false,
        mobileNotes: '',
        mobilePhotos: []
      })
      updated++
    })
    
    if (updated > 0) {
      await batch.commit()
      console.log(`✅ Updated ${updated} bookings with mobile sync fields`)
    }
    
    return { success: true, updated, errors }
    
  } catch (error) {
    console.error('❌ Error adding mobile sync fields to bookings:', error)
    errors.push(`Failed to update bookings: ${error}`)
    return { success: false, updated, errors }
  }
}

// Sample staff assignments creation removed for production

// Sample booking tasks creation removed for production

/**
 * Add mobile sync fields to existing staff records
 */
export async function addMobileSyncFieldsToStaff(): Promise<{
  success: boolean
  updated: number
  errors: string[]
}> {
  const database = getDb()
  const errors: string[] = []
  let updated = 0

  try {
    console.log('📋 Adding mobile sync fields to existing staff...')
    
    // Get all staff that don't have mobile sync fields
    const staffSnapshot = await getDocs(collection(database, 'staff'))
    const batch = writeBatch(database)
    
    staffSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      if (!data.mobileLastSync) {
        const staffRef = doc(database, 'staff', docSnapshot.id)
        batch.update(staffRef, {
          mobileLastSync: 0,
          syncVersion: 1,
          lastSyncedAt: serverTimestamp(),
          mobileEnabled: true,
          deviceIds: []
        })
        updated++
      }
    })
    
    if (updated > 0) {
      await batch.commit()
      console.log(`✅ Updated ${updated} staff records with mobile sync fields`)
    }
    
    return { success: true, updated, errors }
    
  } catch (error) {
    console.error('❌ Error adding mobile sync fields to staff:', error)
    errors.push(`Failed to update staff: ${error}`)
    return { success: false, updated, errors }
  }
}

/**
 * Run all mobile schema updates
 */
export async function runMobileSchemaUpdates(): Promise<{
  success: boolean
  results: Record<string, any>
  errors: string[]
}> {
  console.log('🚀 Starting mobile schema updates...')
  
  const results: Record<string, any> = {}
  const allErrors: string[] = []
  
  try {
    // Update bookings
    const bookingResults = await addMobileSyncFieldsToBookings()
    results.bookings = bookingResults
    allErrors.push(...bookingResults.errors)
    
    // Update staff
    const staffResults = await addMobileSyncFieldsToStaff()
    results.staff = staffResults
    allErrors.push(...staffResults.errors)
    
    // Sample data creation removed for production
    console.log('ℹ️ Sample data creation skipped for production')
    
    const success = allErrors.length === 0
    
    console.log('✅ Mobile schema updates completed')
    console.log('📋 Results:', results)
    
    return { success, results, errors: allErrors }
    
  } catch (error) {
    console.error('❌ Error running mobile schema updates:', error)
    allErrors.push(`Schema update failed: ${error}`)
    return { success: false, results, errors: allErrors }
  }
}
