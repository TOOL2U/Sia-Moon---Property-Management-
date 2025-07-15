import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { withMobileAuth, createMobileSuccessResponse, createMobileErrorResponse } from '@/lib/middleware/mobileAuth'

interface StaffAssignmentData {
  id: string
  staffId: string
  staffName: string
  bookingId: string
  propertyId: string
  propertyName: string
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'setup' | 'checkout'
  title: string
  description: string
  scheduledDate: string
  scheduledTime: string
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
}

/**
 * Convert Firestore assignment to mobile API format
 */
function convertAssignmentToMobileFormat(assignment: any): StaffAssignmentData {
  return {
    id: assignment.id,
    staffId: assignment.staffId || assignment.assignedTo || '',
    staffName: assignment.staffName || assignment.assignedToName || 'Unknown Staff',
    bookingId: assignment.bookingId || assignment.relatedBooking || '',
    propertyId: assignment.propertyId || assignment.bookingId || '',
    propertyName: assignment.propertyName || assignment.property || 'Unknown Property',
    taskType: assignment.taskType || assignment.type || 'cleaning',
    title: assignment.title || assignment.taskTitle || 'Task',
    description: assignment.description || assignment.notes || '',
    scheduledDate: assignment.scheduledDate || assignment.dueDate || new Date().toISOString().split('T')[0],
    scheduledTime: assignment.scheduledTime || assignment.time || '09:00',
    status: assignment.status || 'pending',
    priority: assignment.priority || 'medium',
    notes: assignment.notes || assignment.description || ''
  }
}

/**
 * GET /api/mobile/assignments
 * Fetch staff assignments for mobile app
 */
export async function GET(request: NextRequest) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(request.url)
      const staffId = searchParams.get('staffId')
      const date = searchParams.get('date')
      const status = searchParams.get('status')
      const limitParam = searchParams.get('limit')
      
      console.log(`📱 Mobile API: Fetching assignments for staff ${staffId}, date ${date}`)
      
      const database = getDb()
      const maxResults = limitParam ? parseInt(limitParam) : 50
      
      // Build base query
      let assignmentsQuery = query(
        collection(database, 'task_assignments'),
        orderBy('scheduledDate', 'desc'),
        limit(maxResults)
      )
      
      // Add staff filter if specified
      if (staffId) {
        assignmentsQuery = query(
          collection(database, 'task_assignments'),
          where('staffId', '==', staffId),
          orderBy('scheduledDate', 'desc'),
          limit(maxResults)
        )
      }
      
      // Execute query
      const snapshot = await getDocs(assignmentsQuery)
      let assignments = snapshot.docs.map(doc => {
        const data = doc.data()
        return convertAssignmentToMobileFormat({ id: doc.id, ...data })
      })
      
      // Apply client-side filters (since Firestore has limitations on compound queries)
      if (date) {
        assignments = assignments.filter(assignment => 
          assignment.scheduledDate === date
        )
      }
      
      if (status) {
        assignments = assignments.filter(assignment => 
          assignment.status === status
        )
      }
      
      console.log(`✅ Mobile API: Returning ${assignments.length} assignments`)
      
      return createMobileSuccessResponse({
        assignments,
        count: assignments.length,
        filters: {
          staffId: staffId || 'all',
          date: date || 'all',
          status: status || 'all'
        },
        lastSync: Date.now()
      })
      
    } catch (error) {
      console.error('❌ Error fetching assignments:', error)
      return createMobileErrorResponse(
        'Failed to fetch assignments',
        500
      )
    }
  })(request)
}

/**
 * POST /api/mobile/assignments
 * Create new assignment (for future use)
 */
export async function POST(request: NextRequest) {
  return withMobileAuth(async (req, auth) => {
    try {
      console.log('📱 Mobile API: Creating new assignment')
      
      // For now, return not implemented
      return createMobileErrorResponse(
        'Assignment creation not yet implemented',
        501
      )
      
    } catch (error) {
      console.error('❌ Error creating assignment:', error)
      return createMobileErrorResponse(
        'Failed to create assignment',
        500
      )
    }
  })(request)
}
