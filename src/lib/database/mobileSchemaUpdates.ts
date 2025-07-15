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

/**
 * Create sample staff assignments for testing
 */
export async function createSampleStaffAssignments(): Promise<{
  success: boolean
  created: number
  errors: string[]
}> {
  const database = getDb()
  const errors: string[] = []
  let created = 0

  try {
    console.log('📋 Creating sample staff assignments...')
    
    // Check if assignments already exist
    const existingQuery = query(collection(database, 'task_assignments'))
    const existingSnapshot = await getDocs(existingQuery)
    
    if (!existingSnapshot.empty) {
      console.log('ℹ️ Staff assignments already exist, skipping creation')
      return { success: true, created: 0, errors: [] }
    }
    
    // Sample assignments
    const sampleAssignments = [
      {
        staffId: 'staff_001',
        staffName: 'Maria Santos',
        bookingId: 'booking_001',
        propertyId: 'property_001',
        propertyName: 'Villa Mango Beach',
        taskType: 'cleaning',
        title: 'Pre-arrival Cleaning',
        description: 'Deep clean villa before guest arrival',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        status: 'pending',
        priority: 'high',
        notes: 'Focus on bathrooms and kitchen',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mobileLastSync: 0,
        syncVersion: 1
      },
      {
        staffId: 'staff_002',
        staffName: 'John Maintenance',
        bookingId: 'booking_001',
        propertyId: 'property_001',
        propertyName: 'Villa Mango Beach',
        taskType: 'maintenance',
        title: 'Pool Maintenance',
        description: 'Check pool chemicals and clean filters',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '14:00',
        status: 'pending',
        priority: 'medium',
        notes: 'Check pH levels',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mobileLastSync: 0,
        syncVersion: 1
      },
      {
        staffId: 'staff_001',
        staffName: 'Maria Santos',
        bookingId: 'booking_002',
        propertyId: 'property_002',
        propertyName: 'Ocean View Villa',
        taskType: 'inspection',
        title: 'Property Inspection',
        description: 'Check property condition after guest checkout',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: '11:00',
        status: 'pending',
        priority: 'medium',
        notes: 'Document any damages',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mobileLastSync: 0,
        syncVersion: 1
      }
    ]
    
    // Create assignments
    for (const assignment of sampleAssignments) {
      await addDoc(collection(database, 'task_assignments'), assignment)
      created++
    }
    
    console.log(`✅ Created ${created} sample staff assignments`)
    
    return { success: true, created, errors }
    
  } catch (error) {
    console.error('❌ Error creating sample staff assignments:', error)
    errors.push(`Failed to create assignments: ${error}`)
    return { success: false, created, errors }
  }
}

/**
 * Create sample booking tasks
 */
export async function createSampleBookingTasks(): Promise<{
  success: boolean
  created: number
  errors: string[]
}> {
  const database = getDb()
  const errors: string[] = []
  let created = 0

  try {
    console.log('📋 Creating sample booking tasks...')
    
    // Check if tasks already exist
    const existingQuery = query(collection(database, 'booking_tasks'))
    const existingSnapshot = await getDocs(existingQuery)
    
    if (!existingSnapshot.empty) {
      console.log('ℹ️ Booking tasks already exist, skipping creation')
      return { success: true, created: 0, errors: [] }
    }
    
    // Sample tasks
    const sampleTasks = [
      {
        bookingId: 'booking_001',
        type: 'cleaning',
        title: 'Pre-arrival Deep Clean',
        description: 'Complete deep cleaning before guest arrival',
        assignedTo: 'staff_001',
        dueDate: new Date().toISOString(),
        priority: 'high',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        bookingId: 'booking_001',
        type: 'setup',
        title: 'Welcome Setup',
        description: 'Set up welcome amenities and check supplies',
        assignedTo: 'staff_001',
        dueDate: new Date().toISOString(),
        priority: 'medium',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        bookingId: 'booking_001',
        type: 'maintenance',
        title: 'Pool Check',
        description: 'Check pool equipment and water quality',
        assignedTo: 'staff_002',
        dueDate: new Date().toISOString(),
        priority: 'medium',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ]
    
    // Create tasks
    for (const task of sampleTasks) {
      await addDoc(collection(database, 'booking_tasks'), task)
      created++
    }
    
    console.log(`✅ Created ${created} sample booking tasks`)
    
    return { success: true, created, errors }
    
  } catch (error) {
    console.error('❌ Error creating sample booking tasks:', error)
    errors.push(`Failed to create tasks: ${error}`)
    return { success: false, created, errors }
  }
}

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
    
    // Create sample assignments
    const assignmentResults = await createSampleStaffAssignments()
    results.assignments = assignmentResults
    allErrors.push(...assignmentResults.errors)
    
    // Create sample tasks
    const taskResults = await createSampleBookingTasks()
    results.tasks = taskResults
    allErrors.push(...taskResults.errors)
    
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
