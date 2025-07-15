/**
 * Admin Job Assignment Service
 * Uses Firebase Admin SDK for server-side operations with full database access
 */

import { adminDb, isAdminSDKAvailable } from '@/lib/firebase-admin'
import { JobAssignmentFilters, JobAssignment, JobType, JobPriority, JobStatus } from '@/types/jobAssignment'

export class AdminJobAssignmentService {
  /**
   * Check if Admin SDK is available
   */
  static isAvailable(): boolean {
    return isAdminSDKAvailable()
  }

  /**
   * Get all job assignments using Admin SDK
   */
  static async getJobAssignments(filters: JobAssignmentFilters = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase Admin SDK not available')
      }

      console.log('🔥 Using Firebase Admin SDK for job assignments query')
      
      let query = adminDb.collection('job_assignments')
      
      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.where('status', 'in', filters.status)
      }
      
      if (filters.jobType && filters.jobType.length > 0) {
        query = query.where('jobType', 'in', filters.jobType)
      }
      
      if (filters.priority && filters.priority.length > 0) {
        query = query.where('priority', 'in', filters.priority)
      }
      
      // Apply sorting
      const sortBy = filters.sortBy || 'createdAt'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.orderBy(sortBy, sortOrder)
      
      // Execute query
      const snapshot = await query.get()
      
      const jobs: JobAssignment[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          scheduledDate: data.scheduledDate || '',
          deadline: data.deadline || ''
        } as JobAssignment)
      })
      
      // Calculate stats
      const stats = this.calculateStats(jobs)
      
      console.log(`✅ Retrieved ${jobs.length} job assignments using Admin SDK`)
      
      return {
        success: true,
        data: jobs,
        stats
      }
    } catch (error) {
      console.error('❌ Error getting job assignments with Admin SDK:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        stats: {
          total: 0,
          pending: 0,
          in_progress: 0,
          completed: 0,
          overdue: 0
        }
      }
    }
  }

  /**
   * Create a new job assignment using Admin SDK
   */
  static async createJobAssignment(jobData: Partial<JobAssignment>) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase Admin SDK not available')
      }

      console.log('🔥 Creating job assignment using Admin SDK')
      
      const jobAssignment = {
        ...jobData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: jobData.status || 'pending'
      }
      
      const docRef = await adminDb.collection('job_assignments').add(jobAssignment)
      
      console.log(`✅ Created job assignment ${docRef.id} using Admin SDK`)
      
      return {
        success: true,
        data: { id: docRef.id, ...jobAssignment }
      }
    } catch (error) {
      console.error('❌ Error creating job assignment with Admin SDK:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update a job assignment using Admin SDK
   */
  static async updateJobAssignment(jobId: string, updates: Partial<JobAssignment>) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase Admin SDK not available')
      }

      console.log(`🔥 Updating job assignment ${jobId} using Admin SDK`)
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }
      
      await adminDb.collection('job_assignments').doc(jobId).update(updateData)
      
      console.log(`✅ Updated job assignment ${jobId} using Admin SDK`)
      
      return {
        success: true,
        data: { id: jobId, ...updateData }
      }
    } catch (error) {
      console.error('❌ Error updating job assignment with Admin SDK:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a job assignment using Admin SDK
   */
  static async deleteJobAssignment(jobId: string) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase Admin SDK not available')
      }

      console.log(`🔥 Deleting job assignment ${jobId} using Admin SDK`)
      
      await adminDb.collection('job_assignments').doc(jobId).delete()
      
      console.log(`✅ Deleted job assignment ${jobId} using Admin SDK`)
      
      return {
        success: true
      }
    } catch (error) {
      console.error('❌ Error deleting job assignment with Admin SDK:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get staff availability using Admin SDK
   */
  static async getStaffAvailability() {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase Admin SDK not available')
      }

      console.log('🔥 Getting staff availability using Admin SDK')
      
      const snapshot = await adminDb.collection('staff_accounts')
        .where('isActive', '==', true)
        .get()
      
      const staff: any[] = []
      snapshot.forEach(doc => {
        staff.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      // Sort by name
      staff.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      
      console.log(`✅ Retrieved ${staff.length} active staff members using Admin SDK`)
      
      return {
        success: true,
        data: staff
      }
    } catch (error) {
      console.error('❌ Error getting staff availability with Admin SDK:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }
    }
  }

  /**
   * Calculate job assignment statistics
   */
  private static calculateStats(jobs: JobAssignment[]) {
    const stats = {
      total: jobs.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0
    }

    const now = new Date()

    jobs.forEach(job => {
      // Count by status
      switch (job.status) {
        case 'pending':
          stats.pending++
          break
        case 'in_progress':
          stats.in_progress++
          break
        case 'completed':
          stats.completed++
          break
      }

      // Check for overdue jobs
      if (job.deadline && new Date(job.deadline) < now && job.status !== 'completed') {
        stats.overdue++
      }
    })

    return stats
  }
}
