import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

interface BookingData {
  id: string
  property: string
  propertyName: string
  address: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  status: string
}

interface AssignmentTemplate {
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'setup' | 'checkout'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  daysBeforeCheckIn: number // negative for after check-in
  estimatedDuration: number // minutes
  requiredSkills: string[]
  defaultStaffRole?: string
}

// Default assignment templates for approved bookings
const DEFAULT_ASSIGNMENT_TEMPLATES: AssignmentTemplate[] = [
  {
    taskType: 'cleaning',
    title: 'Pre-arrival Deep Clean',
    description: 'Complete deep cleaning of the property before guest arrival',
    priority: 'high',
    daysBeforeCheckIn: 1,
    estimatedDuration: 180, // 3 hours
    requiredSkills: ['cleaning', 'housekeeping'],
    defaultStaffRole: 'housekeeper'
  },
  {
    taskType: 'inspection',
    title: 'Pre-arrival Inspection',
    description: 'Inspect property condition and ensure everything is ready for guests',
    priority: 'high',
    daysBeforeCheckIn: 1,
    estimatedDuration: 60, // 1 hour
    requiredSkills: ['inspection', 'quality_control'],
    defaultStaffRole: 'supervisor'
  },
  {
    taskType: 'setup',
    title: 'Welcome Setup',
    description: 'Set up welcome amenities, check supplies, and prepare property',
    priority: 'medium',
    daysBeforeCheckIn: 0,
    estimatedDuration: 90, // 1.5 hours
    requiredSkills: ['setup', 'hospitality'],
    defaultStaffRole: 'housekeeper'
  },
  {
    taskType: 'maintenance',
    title: 'Pool & Equipment Check',
    description: 'Check pool chemicals, equipment, and general maintenance items',
    priority: 'medium',
    daysBeforeCheckIn: 1,
    estimatedDuration: 120, // 2 hours
    requiredSkills: ['maintenance', 'pool_maintenance'],
    defaultStaffRole: 'maintenance'
  },
  {
    taskType: 'checkout',
    title: 'Post-departure Inspection',
    description: 'Inspect property after guest checkout and document any issues',
    priority: 'medium',
    daysBeforeCheckIn: -1, // 1 day after check-in (actually checkout day)
    estimatedDuration: 60, // 1 hour
    requiredSkills: ['inspection', 'documentation'],
    defaultStaffRole: 'supervisor'
  }
]

/**
 * Find available staff for a specific task
 */
async function findAvailableStaff(
  taskType: string,
  requiredSkills: string[],
  scheduledDate: string,
  defaultRole?: string
): Promise<{ staffId: string; staffName: string } | null> {
  try {
    const database = getDb()
    
    // Get all active staff
    const staffQuery = query(
      collection(database, 'staff'),
      where('status', '==', 'active')
    )
    
    const staffSnapshot = await getDocs(staffQuery)
    const availableStaff = staffSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(staff => {
        // Check if staff has required skills or role
        const staffSkills = staff.skills || []
        const staffRole = staff.role || ''
        
        const hasRequiredSkills = requiredSkills.some(skill => 
          staffSkills.includes(skill) || staffRole.toLowerCase().includes(skill.toLowerCase())
        )
        
        const hasDefaultRole = defaultRole ? 
          staffRole.toLowerCase().includes(defaultRole.toLowerCase()) : false
        
        return hasRequiredSkills || hasDefaultRole
      })
    
    // For now, return the first available staff
    // In a more sophisticated system, you'd check actual availability
    if (availableStaff.length > 0) {
      const selectedStaff = availableStaff[0]
      return {
        staffId: selectedStaff.id,
        staffName: selectedStaff.name || 'Unknown Staff'
      }
    }
    
    // Fallback: return any active staff
    if (staffSnapshot.docs.length > 0) {
      const fallbackStaff = staffSnapshot.docs[0]
      const data = fallbackStaff.data()
      return {
        staffId: fallbackStaff.id,
        staffName: data.name || 'Unknown Staff'
      }
    }
    
    return null
    
  } catch (error) {
    console.error('❌ Error finding available staff:', error)
    return null
  }
}

/**
 * Calculate scheduled date based on check-in date and days offset
 */
function calculateScheduledDate(checkInDate: string, daysOffset: number): string {
  const checkIn = new Date(checkInDate)
  const scheduledDate = new Date(checkIn)
  scheduledDate.setDate(scheduledDate.getDate() + daysOffset)
  return scheduledDate.toISOString().split('T')[0]
}

/**
 * Create staff assignment from template
 */
async function createAssignmentFromTemplate(
  booking: BookingData,
  template: AssignmentTemplate
): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
  try {
    const database = getDb()
    
    // Calculate scheduled date
    const scheduledDate = calculateScheduledDate(
      booking.checkInDate,
      template.daysBeforeCheckIn
    )
    
    // Find available staff
    const assignedStaff = await findAvailableStaff(
      template.taskType,
      template.requiredSkills,
      scheduledDate,
      template.defaultStaffRole
    )
    
    if (!assignedStaff) {
      console.log(`⚠️ No available staff found for ${template.taskType} task`)
      // Still create the assignment without staff assignment
    }
    
    // Create assignment
    const assignment = {
      bookingId: booking.id,
      propertyId: booking.id, // Use booking ID as property ID for now
      propertyName: booking.propertyName || booking.property,
      propertyAddress: booking.address,
      taskType: template.taskType,
      title: template.title,
      description: template.description,
      priority: template.priority,
      scheduledDate,
      scheduledTime: getDefaultTimeForTask(template.taskType),
      estimatedDuration: template.estimatedDuration,
      requiredSkills: template.requiredSkills,
      status: 'pending',
      staffId: assignedStaff?.staffId || '',
      staffName: assignedStaff?.staffName || '',
      assignedTo: assignedStaff?.staffId || '',
      assignedToName: assignedStaff?.staffName || '',
      guestName: booking.guestName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      autoGenerated: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      mobileLastSync: 0,
      syncVersion: 1
    }
    
    const assignmentRef = await addDoc(collection(database, 'task_assignments'), assignment)
    
    console.log(`✅ Created assignment: ${template.title} for booking ${booking.id}`)
    
    return { success: true, assignmentId: assignmentRef.id }
    
  } catch (error) {
    console.error('❌ Error creating assignment from template:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get default time for different task types
 */
function getDefaultTimeForTask(taskType: string): string {
  const defaultTimes: Record<string, string> = {
    cleaning: '09:00',
    maintenance: '14:00',
    inspection: '11:00',
    setup: '15:00',
    checkout: '12:00'
  }
  
  return defaultTimes[taskType] || '10:00'
}

/**
 * Generate automatic assignments for an approved booking
 */
export async function generateAutomaticAssignments(
  bookingId: string,
  bookingData: BookingData
): Promise<{
  success: boolean
  assignmentsCreated: number
  assignments: string[]
  errors: string[]
}> {
  console.log(`🏗️ Generating automatic assignments for booking ${bookingId}`)
  
  const assignments: string[] = []
  const errors: string[] = []
  let assignmentsCreated = 0
  
  try {
    // Check if assignments already exist for this booking
    const database = getDb()
    const existingQuery = query(
      collection(database, 'task_assignments'),
      where('bookingId', '==', bookingId)
    )
    
    const existingSnapshot = await getDocs(existingQuery)
    if (!existingSnapshot.empty) {
      console.log(`ℹ️ Assignments already exist for booking ${bookingId}`)
      return {
        success: true,
        assignmentsCreated: 0,
        assignments: [],
        errors: ['Assignments already exist for this booking']
      }
    }
    
    // Create assignments from templates
    for (const template of DEFAULT_ASSIGNMENT_TEMPLATES) {
      const result = await createAssignmentFromTemplate(bookingData, template)
      
      if (result.success && result.assignmentId) {
        assignments.push(result.assignmentId)
        assignmentsCreated++
      } else {
        errors.push(result.error || `Failed to create ${template.title}`)
      }
    }
    
    // Update booking with assignment generation timestamp
    const bookingRef = doc(database, 'bookings', bookingId)
    await updateDoc(bookingRef, {
      assignmentsGenerated: true,
      assignmentsGeneratedAt: serverTimestamp(),
      assignmentCount: assignmentsCreated
    })
    
    console.log(`✅ Generated ${assignmentsCreated} assignments for booking ${bookingId}`)
    
    return {
      success: true,
      assignmentsCreated,
      assignments,
      errors
    }
    
  } catch (error) {
    console.error('❌ Error generating automatic assignments:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    return {
      success: false,
      assignmentsCreated,
      assignments,
      errors
    }
  }
}

/**
 * Trigger automatic assignment generation when booking is approved
 */
export async function onBookingApproved(bookingId: string): Promise<void> {
  try {
    console.log(`📋 Booking ${bookingId} approved, generating assignments...`)
    
    const database = getDb()
    const bookingRef = doc(database, 'bookings', bookingId)
    const bookingDoc = await getDocs(query(collection(database, 'bookings'), where('__name__', '==', bookingId)))
    
    if (bookingDoc.empty) {
      console.log(`❌ Booking ${bookingId} not found`)
      return
    }
    
    const bookingData = { id: bookingId, ...bookingDoc.docs[0].data() } as BookingData
    
    // Generate assignments
    const result = await generateAutomaticAssignments(bookingId, bookingData)
    
    if (result.success) {
      console.log(`✅ Successfully generated ${result.assignmentsCreated} assignments`)
    } else {
      console.log(`⚠️ Assignment generation completed with errors:`, result.errors)
    }
    
  } catch (error) {
    console.error('❌ Error in onBookingApproved:', error)
  }
}
