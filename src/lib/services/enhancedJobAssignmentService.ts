/**
 * Enhanced Job Assignment Service
 * Comprehensive service for professional job assignment management
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  JobAssignment,
  JobFilters,
  JobAnalytics,
  StaffLocation,
  StaffMember,
  CreateJobRequest,
  UpdateJobRequest,
  JobAssignmentResponse,
  StaffLocationResponse,
  JobStatus,
  JobCategory,
  JobPriority,
  StaffStatus,
  JobUpdate,
  StaffPerformance,
  PropertyPerformance
} from '@/types/enhancedJobAssignment'

export class EnhancedJobAssignmentService {
  private static readonly COLLECTIONS = {
    JOBS: 'enhanced_job_assignments',
    STAFF_LOCATIONS: 'staff_locations',
    STAFF_MEMBERS: 'staff_members',
    JOB_UPDATES: 'job_updates',
    GEOFENCES: 'geofences',
    ANALYTICS: 'job_analytics'
  }

  // ============================================================================
  // JOB ASSIGNMENT MANAGEMENT
  // ============================================================================

  /**
   * Get all job assignments with filtering and analytics
   */
  static async getJobAssignments(filters: JobFilters = {}): Promise<JobAssignmentResponse> {
    try {
      console.log('🔍 Getting enhanced job assignments with filters:', filters)
      
      let q = collection(db, this.COLLECTIONS.JOBS)
      
      // Apply filters
      if (filters.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }
      
      if (filters.category && filters.category.length > 0) {
        q = query(q, where('category', 'in', filters.category))
      }
      
      if (filters.priority && filters.priority.length > 0) {
        q = query(q, where('priority', 'in', filters.priority))
      }
      
      if (filters.assignedStaff && filters.assignedStaff.length > 0) {
        q = query(q, where('assignedStaff', 'array-contains-any', filters.assignedStaff))
      }
      
      if (filters.properties && filters.properties.length > 0) {
        q = query(q, where('propertyId', 'in', filters.properties))
      }
      
      // Apply sorting
      const sortBy = filters.sortBy || 'createdAt'
      const sortOrder = filters.sortOrder || 'desc'
      q = query(q, orderBy(sortBy, sortOrder))
      
      const snapshot = await getDocs(q)
      const jobs: JobAssignment[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          scheduledStartDate: data.scheduledStartDate?.toDate?.() || new Date(),
          scheduledEndDate: data.scheduledEndDate?.toDate?.(),
          actualStartTime: data.actualStartTime?.toDate?.(),
          actualEndTime: data.actualEndTime?.toDate?.(),
          completedAt: data.completedAt?.toDate?.(),
          verifiedAt: data.verifiedAt?.toDate?.(),
          assignedAt: data.assignedAt?.toDate?.() || new Date(),
          lastUpdate: data.lastUpdate?.toDate?.() || new Date()
        } as JobAssignment)
      })
      
      // Calculate analytics
      const stats = await this.calculateJobAnalytics(jobs)
      
      console.log(`✅ Retrieved ${jobs.length} enhanced job assignments`)
      
      return {
        success: true,
        data: jobs,
        stats
      }
    } catch (error) {
      console.error('❌ Error getting enhanced job assignments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a new job assignment
   */
  static async createJobAssignment(jobData: CreateJobRequest): Promise<JobAssignmentResponse> {
    try {
      console.log('🔥 Creating enhanced job assignment:', jobData.title)
      
      const newJob: Partial<JobAssignment> = {
        ...jobData,
        status: 'pending',
        progressPercentage: 0,
        timeSpent: 0,
        actualCost: 0,
        laborCost: 0,
        supplyCost: 0,
        equipmentCost: 0,
        isRecurring: false,
        updates: [],
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: new Date(),
        lastUpdate: new Date()
      }
      
      // Get staff names
      const staffNames = await this.getStaffNames(jobData.assignedStaff)
      newJob.assignedStaffNames = staffNames
      
      const docRef = await addDoc(collection(db, this.COLLECTIONS.JOBS), {
        ...newJob,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        scheduledStartDate: Timestamp.fromDate(jobData.scheduledStartDate),
        assignedAt: Timestamp.now(),
        lastUpdate: Timestamp.now()
      })
      
      // Create initial job update
      await this.addJobUpdate(docRef.id, {
        type: 'status_change',
        message: 'Job created and assigned',
        newStatus: 'pending',
        staffId: 'system',
        staffName: 'System'
      })
      
      console.log(`✅ Created enhanced job assignment: ${docRef.id}`)
      
      return {
        success: true,
        data: [{ ...newJob, id: docRef.id } as JobAssignment]
      }
    } catch (error) {
      console.error('❌ Error creating enhanced job assignment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update job assignment
   */
  static async updateJobAssignment(jobId: string, updates: UpdateJobRequest): Promise<JobAssignmentResponse> {
    try {
      console.log(`🔄 Updating enhanced job assignment: ${jobId}`)
      
      const jobRef = doc(db, this.COLLECTIONS.JOBS, jobId)
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
        lastUpdate: Timestamp.now()
      }
      
      if (updates.scheduledStartDate) {
        updateData.scheduledStartDate = Timestamp.fromDate(updates.scheduledStartDate)
      }
      
      await updateDoc(jobRef, updateData)
      
      // Add job update if status changed
      if (updates.status) {
        await this.addJobUpdate(jobId, {
          type: 'status_change',
          message: `Status changed to ${updates.status}`,
          newStatus: updates.status,
          staffId: 'system',
          staffName: 'System'
        })
      }
      
      console.log(`✅ Updated enhanced job assignment: ${jobId}`)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating enhanced job assignment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete job assignment
   */
  static async deleteJobAssignment(jobId: string): Promise<JobAssignmentResponse> {
    try {
      console.log(`🗑️ Deleting enhanced job assignment: ${jobId}`)
      
      const batch = writeBatch(db)
      
      // Delete job
      const jobRef = doc(db, this.COLLECTIONS.JOBS, jobId)
      batch.delete(jobRef)
      
      // Delete related updates
      const updatesQuery = query(
        collection(db, this.COLLECTIONS.JOB_UPDATES),
        where('jobId', '==', jobId)
      )
      const updatesSnapshot = await getDocs(updatesQuery)
      updatesSnapshot.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      
      console.log(`✅ Deleted enhanced job assignment: ${jobId}`)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error deleting enhanced job assignment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============================================================================
  // STAFF LOCATION TRACKING
  // ============================================================================

  /**
   * Get real-time staff locations
   */
  static async getStaffLocations(): Promise<StaffLocationResponse> {
    try {
      console.log('📍 Getting staff locations')
      
      const snapshot = await getDocs(collection(db, this.COLLECTIONS.STAFF_LOCATIONS))
      const locations: StaffLocation[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        locations.push({
          ...data,
          currentLocation: {
            ...data.currentLocation,
            timestamp: data.currentLocation.timestamp?.toDate?.() || new Date()
          },
          lastUpdated: data.lastUpdated?.toDate?.() || new Date()
        } as StaffLocation)
      })
      
      console.log(`✅ Retrieved ${locations.length} staff locations`)
      
      return {
        success: true,
        data: locations
      }
    } catch (error) {
      console.error('❌ Error getting staff locations:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update staff location
   */
  static async updateStaffLocation(staffId: string, location: StaffLocation): Promise<boolean> {
    try {
      const locationRef = doc(db, this.COLLECTIONS.STAFF_LOCATIONS, staffId)
      await updateDoc(locationRef, {
        ...location,
        lastUpdated: Timestamp.now(),
        currentLocation: {
          ...location.currentLocation,
          timestamp: Timestamp.fromDate(location.currentLocation.timestamp)
        }
      })
      
      return true
    } catch (error) {
      console.error('❌ Error updating staff location:', error)
      return false
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Calculate comprehensive job analytics
   */
  private static async calculateJobAnalytics(jobs: JobAssignment[]): Promise<JobAnalytics> {
    const now = new Date()
    
    // Basic counts
    const totalJobs = jobs.length
    const completedJobs = jobs.filter(j => j.status === 'completed').length
    const pendingJobs = jobs.filter(j => j.status === 'pending').length
    const overdueJobs = jobs.filter(j => 
      j.scheduledStartDate < now && !['completed', 'verified'].includes(j.status)
    ).length
    
    // Time analysis
    const completedJobsWithTime = jobs.filter(j => j.actualDuration && j.actualDuration > 0)
    const averageCompletionTime = completedJobsWithTime.length > 0
      ? completedJobsWithTime.reduce((sum, j) => sum + (j.actualDuration || 0), 0) / completedJobsWithTime.length
      : 0
    
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    
    // Category analysis
    const jobsByCategory = {} as Record<JobCategory, number>
    const completionByCategory = {} as Record<JobCategory, number>
    
    jobs.forEach(job => {
      jobsByCategory[job.category] = (jobsByCategory[job.category] || 0) + 1
      if (job.status === 'completed') {
        completionByCategory[job.category] = (completionByCategory[job.category] || 0) + 1
      }
    })
    
    // Priority analysis
    const jobsByPriority = {} as Record<JobPriority, number>
    jobs.forEach(job => {
      jobsByPriority[job.priority] = (jobsByPriority[job.priority] || 0) + 1
    })
    
    // Staff analysis
    const jobsByStaff = {} as Record<string, number>
    const performanceByStaff = {} as Record<string, StaffPerformance>
    
    jobs.forEach(job => {
      job.assignedStaff.forEach((staffId, index) => {
        const staffName = job.assignedStaffNames[index] || 'Unknown'
        jobsByStaff[staffId] = (jobsByStaff[staffId] || 0) + 1
        
        if (!performanceByStaff[staffId]) {
          performanceByStaff[staffId] = {
            staffId,
            staffName,
            totalJobs: 0,
            completedJobs: 0,
            completionRate: 0,
            averageJobTime: 0,
            rating: 0,
            onTimePercentage: 0,
            qualityScore: 0,
            efficiency: 0
          }
        }
        
        performanceByStaff[staffId].totalJobs++
        if (job.status === 'completed') {
          performanceByStaff[staffId].completedJobs++
        }
      })
    })
    
    // Calculate completion rates for staff
    Object.values(performanceByStaff).forEach(perf => {
      perf.completionRate = perf.totalJobs > 0 ? (perf.completedJobs / perf.totalJobs) * 100 : 0
    })
    
    // Property analysis
    const jobsByProperty = {} as Record<string, number>
    const propertyPerformance = {} as Record<string, PropertyPerformance>
    
    jobs.forEach(job => {
      jobsByProperty[job.propertyId] = (jobsByProperty[job.propertyId] || 0) + 1
      
      if (!propertyPerformance[job.propertyId]) {
        propertyPerformance[job.propertyId] = {
          propertyId: job.propertyId,
          propertyName: job.propertyName,
          totalJobs: 0,
          completedJobs: 0,
          averageJobTime: 0,
          totalCost: 0,
          maintenanceFrequency: 0,
          issueCount: 0
        }
      }
      
      const prop = propertyPerformance[job.propertyId]
      prop.totalJobs++
      prop.totalCost += job.actualCost || 0
      
      if (job.status === 'completed') {
        prop.completedJobs++
      }
    })
    
    // Cost analysis
    const totalCost = jobs.reduce((sum, job) => sum + (job.actualCost || 0), 0)
    const averageCostPerJob = totalJobs > 0 ? totalCost / totalJobs : 0
    
    const costByCategory = {} as Record<JobCategory, number>
    jobs.forEach(job => {
      costByCategory[job.category] = (costByCategory[job.category] || 0) + (job.actualCost || 0)
    })
    
    return {
      totalJobs,
      completedJobs,
      pendingJobs,
      overdueJobs,
      averageCompletionTime,
      completionRate,
      jobsByCategory,
      completionByCategory,
      jobsByPriority,
      jobsByStaff,
      performanceByStaff,
      peakHours: [], // TODO: Implement peak hours analysis
      averageJobDuration: averageCompletionTime,
      timeEfficiency: 0, // TODO: Implement time efficiency calculation
      totalCost,
      averageCostPerJob,
      costByCategory,
      jobsByProperty,
      propertyPerformance
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get staff names by IDs
   */
  private static async getStaffNames(staffIds: string[]): Promise<string[]> {
    try {
      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('__name__', 'in', staffIds)
      )
      const snapshot = await getDocs(staffQuery)
      const staffMap = new Map<string, string>()
      
      snapshot.forEach(doc => {
        const data = doc.data()
        staffMap.set(doc.id, data.name || 'Unknown')
      })
      
      return staffIds.map(id => staffMap.get(id) || 'Unknown')
    } catch (error) {
      console.error('❌ Error getting staff names:', error)
      return staffIds.map(() => 'Unknown')
    }
  }

  /**
   * Add job update
   */
  private static async addJobUpdate(jobId: string, update: Partial<JobUpdate>): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTIONS.JOB_UPDATES), {
        ...update,
        id: crypto.randomUUID(),
        jobId,
        timestamp: Timestamp.now()
      })
    } catch (error) {
      console.error('❌ Error adding job update:', error)
    }
  }

  /**
   * Set up real-time listeners
   */
  static setupRealtimeListeners(
    onJobsUpdate: (jobs: JobAssignment[]) => void,
    onLocationsUpdate: (locations: StaffLocation[]) => void
  ) {
    // Jobs listener
    const jobsQuery = query(
      collection(db, this.COLLECTIONS.JOBS),
      orderBy('createdAt', 'desc')
    )
    
    onSnapshot(jobsQuery, (snapshot) => {
      const jobs: JobAssignment[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          scheduledStartDate: data.scheduledStartDate?.toDate?.() || new Date(),
          scheduledEndDate: data.scheduledEndDate?.toDate?.(),
          actualStartTime: data.actualStartTime?.toDate?.(),
          actualEndTime: data.actualEndTime?.toDate?.(),
          completedAt: data.completedAt?.toDate?.(),
          verifiedAt: data.verifiedAt?.toDate?.(),
          assignedAt: data.assignedAt?.toDate?.() || new Date(),
          lastUpdate: data.lastUpdate?.toDate?.() || new Date()
        } as JobAssignment)
      })
      onJobsUpdate(jobs)
    })
    
    // Locations listener
    onSnapshot(collection(db, this.COLLECTIONS.STAFF_LOCATIONS), (snapshot) => {
      const locations: StaffLocation[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        locations.push({
          ...data,
          currentLocation: {
            ...data.currentLocation,
            timestamp: data.currentLocation.timestamp?.toDate?.() || new Date()
          },
          lastUpdated: data.lastUpdated?.toDate?.() || new Date()
        } as StaffLocation)
      })
      onLocationsUpdate(locations)
    })
  }
}
