/**
 * Auto Assignment Engine Types
 * Type definitions for the staff assignment engine
 */

export interface StaffAssignmentData {
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

export interface AssignmentRecommendation {
  staffId: string
  staffName: string
  confidence: number
  reasons: string[]
  availability: boolean
  distance?: number
  experience?: number
  workload?: number
}

export interface AutoAssignmentResult {
  success: boolean
  assignedStaff?: AssignmentRecommendation
  alternatives?: AssignmentRecommendation[]
  error?: string
}
