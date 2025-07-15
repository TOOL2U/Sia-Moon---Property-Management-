/**
 * Mandatory Staff Assignment Service
 * Handles job creation with mandatory staff selection and multi-channel notifications
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { EnhancedNotificationService } from './enhancedNotificationService'

export interface MandatoryStaffAssignmentData {
  bookingId: string
  propertyId: string
  propertyName: string
  propertyAddress: string
  jobType: 'cleaning' | 'maintenance' | 'inspection' | 'setup' | 'checkout'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: string
  scheduledStartTime?: string
  deadline: string
  estimatedDuration: number
  requiredSkills: string[]
  specialInstructions?: string
  assignedStaffIds: string[] // MANDATORY - must have at least one
  assignedBy: {
    id: string
    name: string
  }
}

export interface StaffValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validStaff: Array<{
    id: string
    name: string
    email: string
    role: string
    skills: string[]
    isAvailable: boolean
  }>
}

export class MandatoryStaffAssignmentService {
  private static db = getDb()

  /**
   * Validate mandatory staff selection with comprehensive checks
   */
  static async validateMandatoryStaffSelection(
    assignedStaffIds: string[],
    requiredSkills: string[] = []
  ): Promise<StaffValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const validStaff: any[] = []

    // 1. MANDATORY: Check if at least one staff member is selected
    if (!assignedStaffIds || assignedStaffIds.length === 0) {
      errors.push('MANDATORY: At least one staff member must be selected before creating a job assignment')
      return { isValid: false, errors, warnings, validStaff }
    }

    // 2. Validate each selected staff member
    try {
      for (const staffId of assignedStaffIds) {
        const staffDoc = await getDoc(doc(this.db, 'staff_accounts', staffId))
        
        if (!staffDoc.exists()) {
          errors.push(`Staff member with ID ${staffId} does not exist`)
          continue
        }

        const staffData = staffDoc.data()
        
        // Check if staff is active
        if (staffData.status !== 'active') {
          errors.push(`Staff member ${staffData.name} is not active (status: ${staffData.status})`)
          continue
        }

        // Check availability
        const isAvailable = staffData.availability?.isAvailable !== false
        if (!isAvailable) {
          warnings.push(`Staff member ${staffData.name} is currently marked as unavailable`)
        }

        // Check required skills
        const staffSkills = staffData.skills || []
        const missingSkills = requiredSkills.filter(skill => !staffSkills.includes(skill))
        
        if (missingSkills.length > 0) {
          warnings.push(`Staff member ${staffData.name} is missing required skills: ${missingSkills.join(', ')}`)
        }

        // Add to valid staff list
        validStaff.push({
          id: staffId,
          name: staffData.name,
          email: staffData.email,
          role: staffData.role,
          skills: staffSkills,
          isAvailable
        })
      }

      // 3. Final validation - must have at least one valid staff member
      if (validStaff.length === 0) {
        errors.push('No valid staff members found. Please select active staff members.')
      }

    } catch (error) {
      errors.push(`Error validating staff: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validStaff
    }
  }

  /**
   * Create job assignment with mandatory staff validation
   */
  static async createJobWithMandatoryStaff(
    data: MandatoryStaffAssignmentData
  ): Promise<{
    success: boolean
    jobId?: string
    taskIds?: string[]
    errors?: string[]
    warnings?: string[]
    notificationResults?: Array<{ staffId: string; success: boolean; error?: string }>
  }> {
    try {
      // 1. MANDATORY VALIDATION: Staff selection
      const staffValidation = await this.validateMandatoryStaffSelection(
        data.assignedStaffIds,
        data.requiredSkills
      )

      if (!staffValidation.isValid) {
        return {
          success: false,
          errors: staffValidation.errors,
          warnings: staffValidation.warnings
        }
      }

      // 2. Additional field validation
      const fieldErrors: string[] = []
      
      if (!data.title?.trim()) fieldErrors.push('Job title is required')
      if (!data.description?.trim()) fieldErrors.push('Job description is required')
      if (!data.scheduledDate) fieldErrors.push('Scheduled date is required')
      if (!data.deadline) fieldErrors.push('Deadline is required')
      if (data.estimatedDuration <= 0) fieldErrors.push('Estimated duration must be greater than 0')

      if (fieldErrors.length > 0) {
        return {
          success: false,
          errors: fieldErrors,
          warnings: staffValidation.warnings
        }
      }

      // 3. Create job assignment
      const jobAssignment = {
        bookingId: data.bookingId,
        propertyId: data.propertyId,
        propertyName: data.propertyName,
        propertyAddress: data.propertyAddress,
        jobType: data.jobType,
        title: data.title,
        description: data.description,
        priority: data.priority,
        scheduledDate: data.scheduledDate,
        scheduledStartTime: data.scheduledStartTime,
        deadline: data.deadline,
        estimatedDuration: data.estimatedDuration,
        requiredSkills: data.requiredSkills,
        specialInstructions: data.specialInstructions,
        assignedStaffIds: data.assignedStaffIds,
        assignedStaffCount: data.assignedStaffIds.length,
        assignedBy: data.assignedBy,
        status: 'assigned',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: 1,
        lastSyncedAt: serverTimestamp()
      }

      const jobRef = await addDoc(collection(this.db, 'job_assignments'), jobAssignment)
      const jobId = jobRef.id

      // 4. Create individual task assignments for each staff member
      const batch = writeBatch(this.db)
      const taskIds: string[] = []

      for (const staffMember of staffValidation.validStaff) {
        const taskRef = doc(collection(this.db, 'task_assignments'))
        taskIds.push(taskRef.id)

        batch.set(taskRef, {
          jobId,
          bookingId: data.bookingId,
          propertyId: data.propertyId,
          propertyName: data.propertyName,
          assignedStaffId: staffMember.id,
          assignedStaffName: staffMember.name,
          assignedStaffEmail: staffMember.email,
          assignedStaffRole: staffMember.role,
          taskType: data.jobType,
          title: data.title,
          description: data.description,
          priority: data.priority,
          scheduledDate: data.scheduledDate,
          scheduledStartTime: data.scheduledStartTime,
          deadline: data.deadline,
          estimatedDuration: data.estimatedDuration,
          specialInstructions: data.specialInstructions,
          assignedBy: data.assignedBy,
          status: 'assigned',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          syncVersion: 1,
          lastSyncedAt: serverTimestamp()
        })
      }

      await batch.commit()

      // 5. Send multi-channel notifications to all assigned staff
      const notificationResults = await Promise.allSettled(
        staffValidation.validStaff.map(async (staffMember) => {
          const result = await EnhancedNotificationService.sendJobAssignmentNotification(
            staffMember.id,
            {
              jobId,
              bookingId: data.bookingId,
              propertyName: data.propertyName,
              taskType: data.jobType,
              priority: data.priority,
              scheduledDate: data.scheduledDate,
              assignedBy: data.assignedBy.id,
              assignedByName: data.assignedBy.name
            }
          )
          
          return {
            staffId: staffMember.id,
            success: result.success,
            error: result.error
          }
        })
      )

      const notificationResultsData = notificationResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            staffId: staffValidation.validStaff[index].id,
            success: false,
            error: result.reason?.message || 'Unknown notification error'
          }
        }
      })

      // 6. Update staff dashboard entries
      await this.updateStaffDashboards(staffValidation.validStaff, {
        jobId,
        taskIds,
        jobTitle: data.title,
        propertyName: data.propertyName,
        scheduledDate: data.scheduledDate,
        priority: data.priority
      })

      console.log(`✅ Job assignment created with mandatory staff validation: ${jobId}`)
      console.log(`👥 Assigned to ${staffValidation.validStaff.length} staff members`)
      console.log(`📋 Created ${taskIds.length} task assignments`)
      console.log(`📱 Sent notifications to ${notificationResultsData.length} staff members`)

      return {
        success: true,
        jobId,
        taskIds,
        warnings: staffValidation.warnings,
        notificationResults: notificationResultsData
      }

    } catch (error) {
      console.error('❌ Error creating job with mandatory staff:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }
    }
  }

  /**
   * Update staff dashboards with new job assignments
   */
  private static async updateStaffDashboards(
    staffMembers: Array<{ id: string; name: string }>,
    jobData: {
      jobId: string
      taskIds: string[]
      jobTitle: string
      propertyName: string
      scheduledDate: string
      priority: string
    }
  ): Promise<void> {
    try {
      const batch = writeBatch(this.db)

      for (const staff of staffMembers) {
        // Add job to staff's dashboard
        const dashboardRef = doc(collection(this.db, `staff_accounts/${staff.id}/dashboard_jobs`))
        
        batch.set(dashboardRef, {
          jobId: jobData.jobId,
          title: jobData.jobTitle,
          propertyName: jobData.propertyName,
          scheduledDate: jobData.scheduledDate,
          priority: jobData.priority,
          status: 'assigned',
          addedAt: serverTimestamp(),
          isVisible: true
        })
      }

      await batch.commit()
      console.log(`📊 Updated dashboards for ${staffMembers.length} staff members`)
    } catch (error) {
      console.error('Error updating staff dashboards:', error)
    }
  }

  /**
   * Get available staff for selection with validation info
   */
  static async getAvailableStaffForSelection(): Promise<Array<{
    id: string
    name: string
    email: string
    role: string
    skills: string[]
    status: string
    isAvailable: boolean
    currentJobs: number
    maxJobs: number
  }>> {
    try {
      const staffQuery = query(
        collection(this.db, 'staff_accounts'),
        where('status', '==', 'active')
      )
      
      const snapshot = await getDocs(staffQuery)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          role: data.role || 'staff',
          skills: data.skills || [],
          status: data.status || 'unknown',
          isAvailable: data.availability?.isAvailable !== false,
          currentJobs: data.availability?.currentJobs || 0,
          maxJobs: data.availability?.maxJobs || 5
        }
      })
    } catch (error) {
      console.error('Error getting available staff:', error)
      return []
    }
  }
}
