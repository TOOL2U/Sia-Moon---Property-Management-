/**
 * Real-Time Job Sync Service
 * 
 * Syncs job status updates between Mobile App and Webapp in real-time
 * Mobile app updates: assigned → accepted → in_progress → completed
 * 
 * Based on: REALTIME_SYNC_IMPLEMENTATION_GUIDE.md
 */

import { 
  collection, 
  doc,
  onSnapshot, 
  query, 
  where,
  orderBy,
  Unsubscribe,
  DocumentChange,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

/**
 * Job status workflow - matches JobAssignmentService for compatibility
 */
export type JobStatus = 
  | 'pending'      // Job created, waiting for staff assignment/acceptance
  | 'assigned'     // Job assigned to staff member
  | 'accepted'     // Staff accepted the job
  | 'in_progress'  // Staff started working on the job
  | 'completed'    // Staff completed the job
  | 'verified'     // Admin verified job completion
  | 'cancelled';   // Job was cancelled

export interface Job {
  id: string;
  title: string;
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  status: JobStatus;
  
  // Assignment fields (mobile app uses both)
  assignedTo?: string;        // Preferred field name
  assignedStaffId?: string;   // Legacy field name
  assignedStaffName?: string;
  
  // Job type fields
  jobType?: string;           // Type of job (cleaning, maintenance, etc.)
  type?: string;              // Alternate field name
  bookingId?: string;         // Associated booking ID
  
  // Timestamps
  createdAt: any;
  updatedAt: any;
  scheduledDate: any;
  scheduledStart?: any;       // Alternate field name for scheduled date
  acceptedAt?: any;
  startedAt?: any;
  completedAt?: any;
  
  // Completion fields
  completedBy?: string;
  actualDuration?: number;
  completionNotes?: string;
  actualCost?: number;
  photos?: string[];
  
  // Other fields
  description?: string;
  estimatedDuration?: number;
  duration?: number;          // Alternate field name
  checkInDate?: any;
  checkOutDate?: any;
  guestName?: string;
  guestCount?: number;
  specialInstructions?: string;
  requirements?: any;
  location?: any;
  accessInstructions?: string;
  propertyPhotos?: string[];
}

export interface JobChange {
  type: 'added' | 'modified' | 'removed';
  job: Job;
  previousStatus?: JobStatus;
}

export interface CompletedJob extends Job {
  originalJobId: string;
  movedToCompletedAt: any;
}

type JobUpdateCallback = (jobs: Job[], changes: JobChange[]) => void;
type SingleJobUpdateCallback = (job: Job | null) => void;
type ErrorCallback = (error: Error) => void;

class RealtimeJobSyncService {
  private listeners: Map<string, Unsubscribe> = new Map();
  private jobCache: Map<string, Job> = new Map();
  private static readonly JOBS_COLLECTION = 'jobs';
  private static readonly OPERATIONAL_JOBS_COLLECTION = 'operational_jobs';

  /**
   * Subscribe to all active jobs
   * Listens to BOTH 'jobs' and 'operational_jobs' collections for complete coverage
   * Useful for admin dashboards showing all jobs
   */
  subscribeToAllJobs(
    onUpdate: JobUpdateCallback,
    onError?: ErrorCallback
  ): Unsubscribe {
    const listenerId = 'all-jobs';
    
    // Unsubscribe from previous listeners if they exist
    if (this.listeners.has(`${listenerId}_jobs`)) {
      this.listeners.get(`${listenerId}_jobs`)!();
    }
    if (this.listeners.has(`${listenerId}_operational`)) {
      this.listeners.get(`${listenerId}_operational`)!();
    }

    console.log('🔥 Starting real-time subscription to all jobs (both collections)...');

    try {
      const db = getDb();
      
      // Shared handler for processing snapshots from both collections
      const handleSnapshot = (snapshot: QuerySnapshot, collectionName: string) => {
        const changes: JobChange[] = [];

        snapshot.docChanges().forEach((change: DocumentChange) => {
          const job = { id: change.doc.id, ...change.doc.data() } as Job;
          
          // Detect status changes
          let previousStatus: JobStatus | undefined;
          if (change.type === 'modified' && this.jobCache.has(job.id)) {
            const cachedJob = this.jobCache.get(job.id)!;
            if (cachedJob.status !== job.status) {
              previousStatus = cachedJob.status;
              console.log(`🔔 [${collectionName}] Job ${job.id} status changed: ${previousStatus} → ${job.status}`);
            }
          }

          changes.push({
            type: change.type,
            job,
            previousStatus
          });

          // Update cache
          if (change.type === 'added' || change.type === 'modified') {
            this.jobCache.set(job.id, job);
          } else if (change.type === 'removed') {
            this.jobCache.delete(job.id);
          }
        });

        // Get all jobs from cache and trigger callback if there are changes
        if (changes.length > 0) {
          const allJobs = Array.from(this.jobCache.values());
          console.log(`✅ [${collectionName}] Jobs update: ${allJobs.length} total jobs, ${changes.length} changes`);
          onUpdate(allJobs, changes);
        }
      };

      // Listener 1: 'jobs' collection (mobile app native jobs)
      const jobsRef = collection(db, RealtimeJobSyncService.JOBS_COLLECTION);
      const jobsQuery = query(
        jobsRef,
        orderBy('scheduledDate', 'desc')
      );

      const unsubscribeJobs = onSnapshot(
        jobsQuery,
        (snapshot) => handleSnapshot(snapshot, 'jobs'),
        (error: Error) => {
          console.error('❌ Real-time subscription error (jobs collection):', error);
          if (onError) onError(error);
        }
      );

      // Listener 2: 'operational_jobs' collection (webapp created jobs)
      const operationalJobsRef = collection(db, RealtimeJobSyncService.OPERATIONAL_JOBS_COLLECTION);
      const operationalJobsQuery = query(
        operationalJobsRef,
        orderBy('createdAt', 'desc')
      );

      const unsubscribeOperationalJobs = onSnapshot(
        operationalJobsQuery,
        (snapshot) => handleSnapshot(snapshot, 'operational_jobs'),
        (error: Error) => {
          console.error('❌ Real-time subscription error (operational_jobs collection):', error);
          if (onError) onError(error);
        }
      );

      // Store both unsubscribe functions
      this.listeners.set(`${listenerId}_jobs`, unsubscribeJobs);
      this.listeners.set(`${listenerId}_operational`, unsubscribeOperationalJobs);

      // Return combined unsubscribe function
      return () => {
        console.log('🔌 Unsubscribing from all jobs (both collections)');
        unsubscribeJobs();
        unsubscribeOperationalJobs();
        this.listeners.delete(`${listenerId}_jobs`);
        this.listeners.delete(`${listenerId}_operational`);
      };

    } catch (error) {
      console.error('❌ Failed to setup subscription:', error);
      if (onError && error instanceof Error) onError(error);
      return () => {}; // Return empty unsubscribe function
    }
  }  /**
   * Subscribe to jobs for a specific property
   * Listens to BOTH 'jobs' and 'operational_jobs' collections
   * Useful for property managers viewing their property's jobs
   */
  subscribeToPropertyJobs(
    propertyId: string,
    onUpdate: JobUpdateCallback,
    onError?: ErrorCallback
  ): Unsubscribe {
    console.log(`🔄 Setting up real-time listener for property: ${propertyId} (both collections)`);
    
    try {
      const db = getDb();
      
      const handleSnapshot = (snapshot: QuerySnapshot, collectionName: string) => {
        const changes = this.processSnapshot(snapshot, `property_${propertyId}_${collectionName}`);
        if (changes.length > 0) {
          const jobs = Array.from(this.jobCache.values()).filter(
            job => job.propertyId === propertyId
          );
          
          console.log(`📊 [${collectionName}] Property ${propertyId}: ${jobs.length} jobs, ${changes.length} changes`);
          onUpdate(jobs, changes);
        }
      };

      // Listener 1: 'jobs' collection
      const jobsRef = collection(db, RealtimeJobSyncService.JOBS_COLLECTION);
      const jobsQuery = query(
        jobsRef,
        where('propertyId', '==', propertyId),
        orderBy('scheduledDate', 'asc')
      );
      
      const unsubscribeJobs = onSnapshot(
        jobsQuery,
        (snapshot) => handleSnapshot(snapshot, 'jobs'),
        (error) => {
          console.error(`❌ Real-time listener error (property ${propertyId}, jobs):`, error);
          onError?.(error);
        }
      );

      // Listener 2: 'operational_jobs' collection
      const operationalJobsRef = collection(db, RealtimeJobSyncService.OPERATIONAL_JOBS_COLLECTION);
      const operationalJobsQuery = query(
        operationalJobsRef,
        where('propertyId', '==', propertyId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribeOperationalJobs = onSnapshot(
        operationalJobsQuery,
        (snapshot) => handleSnapshot(snapshot, 'operational_jobs'),
        (error) => {
          console.error(`❌ Real-time listener error (property ${propertyId}, operational_jobs):`, error);
          onError?.(error);
        }
      );
      
      const keyJobs = `property_${propertyId}_jobs`;
      const keyOperational = `property_${propertyId}_operational`;
      this.listeners.set(keyJobs, unsubscribeJobs);
      this.listeners.set(keyOperational, unsubscribeOperationalJobs);
      
      return () => {
        console.log(`🔌 Unsubscribing from property ${propertyId} (both collections)`);
        this.unsubscribe(keyJobs);
        this.unsubscribe(keyOperational);
      };
    } catch (error) {
      console.error('❌ Failed to setup property jobs subscription:', error);
      if (onError && error instanceof Error) onError(error);
      return () => {};
    }
  }

  /**
   * Subscribe to jobs assigned to a specific staff member
   * Useful for staff dashboards
   */
  subscribeToStaffJobs(
    staffId: string,
    onUpdate: JobUpdateCallback,
    onError?: ErrorCallback
  ): Unsubscribe {
    console.log(`🔄 Setting up real-time listener for staff: ${staffId}`);
    
    try {
      const db = getDb(); // Get Firestore instance with lazy initialization
      const jobsRef = collection(db, 'jobs');
      // Query both field names since mobile app uses both
      const q = query(
        jobsRef,
        where('assignedTo', '==', staffId),
        orderBy('scheduledDate', 'asc')
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const changes = this.processSnapshot(snapshot, `staff_${staffId}`);
          const jobs = Array.from(this.jobCache.values()).filter(
            job => job.assignedTo === staffId || job.assignedStaffId === staffId
          );
          
          console.log(`📊 Real-time update for staff ${staffId}: ${jobs.length} jobs, ${changes.length} changes`);
          
          onUpdate(jobs, changes);
        },
        (error) => {
          console.error(`❌ Real-time listener error (staff ${staffId}):`, error);
          onError?.(error);
        }
      );
      
      const key = `staff_${staffId}`;
      this.listeners.set(key, unsubscribe);
      
      return () => this.unsubscribe(key);
    } catch (error) {
      console.error('❌ Failed to setup staff jobs subscription:', error);
      if (onError && error instanceof Error) onError(error);
      return () => {};
    }
  }

  /**
   * Subscribe to a specific job
   * Useful for job detail pages
   */
  subscribeToJob(
    jobId: string,
    onUpdate: SingleJobUpdateCallback,
    onError?: ErrorCallback
  ): Unsubscribe {
    console.log(`🔄 Setting up real-time listener for job: ${jobId}`);
    
    try {
      const db = getDb(); // Get Firestore instance with lazy initialization
      const jobRef = doc(db, 'jobs', jobId);
      
      const unsubscribe = onSnapshot(
        jobRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const job = this.convertDocToJob(snapshot);
            const previousJob = this.jobCache.get(jobId);
            
            if (previousJob && previousJob.status !== job.status) {
              console.log(`🔔 Job ${jobId} status changed: ${previousJob.status} → ${job.status}`);
            }
            
            this.jobCache.set(jobId, job);
            onUpdate(job);
          } else {
            console.log(`📦 Job ${jobId} removed from jobs collection (likely completed)`);
            this.jobCache.delete(jobId);
            onUpdate(null); // Job was deleted/moved to completed_jobs
          }
        },
        (error) => {
          console.error(`❌ Real-time listener error (job ${jobId}):`, error);
          onError?.(error);
        }
      );
      
      const key = `job_${jobId}`;
      this.listeners.set(key, unsubscribe);
      
      return () => this.unsubscribe(key);
    } catch (error) {
      console.error('❌ Failed to setup job subscription:', error);
      if (onError && error instanceof Error) onError(error);
      return () => {};
    }
  }

  /**
   * Subscribe to completed jobs
   * Jobs move from 'jobs' to 'completed_jobs' when staff completes them
   */
    subscribeToCompletedJobs(
    onUpdate: (jobs: CompletedJob[]) => void,
    propertyId?: string,
    onError?: ErrorCallback
  ): Unsubscribe {
    console.log(`🔄 Setting up real-time listener for completed jobs${propertyId ? ` (property: ${propertyId})` : ''}`);
    
    try {
      const db = getDb(); // Get Firestore instance with lazy initialization
      const completedJobsRef = collection(db, 'completed_jobs');
      const q = propertyId
        ? query(
            completedJobsRef,
            where('propertyId', '==', propertyId),
            orderBy('completedAt', 'desc')
          )
        : query(completedJobsRef, orderBy('completedAt', 'desc'));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const completedJobs: CompletedJob[] = [];
          
          snapshot.forEach((doc) => {
            completedJobs.push({
              id: doc.id,
              ...doc.data(),
            } as CompletedJob);
          });
          
          console.log(`📦 Real-time update: ${completedJobs.length} completed jobs`);
          
          onUpdate(completedJobs);
        },
        (error) => {
          console.error('❌ Real-time listener error (completed jobs):', error);
          onError?.(error);
        }
      );
      
      const key = propertyId ? `completed_jobs_${propertyId}` : 'completed_jobs_all';
      this.listeners.set(key, unsubscribe);
      
      return () => this.unsubscribe(key);
    } catch (error) {
      console.error('❌ Failed to setup completed jobs subscription:', error);
      if (onError && error instanceof Error) onError(error);
      return () => {};
    }
  }

  /**
   * Process snapshot changes and update cache
   */
  private processSnapshot(
    snapshot: QuerySnapshot,
    cachePrefix?: string
  ): JobChange[] {
    const changes: JobChange[] = [];
    
    snapshot.docChanges().forEach((change) => {
      const job = this.convertDocToJob(change.doc);
      const previousJob = this.jobCache.get(job.id);
      
      switch (change.type) {
        case 'added':
          console.log(`➕ New job detected: ${job.id} - ${job.title} (${job.status})`);
          this.jobCache.set(job.id, job);
          changes.push({ type: 'added', job });
          break;
          
        case 'modified':
          console.log(`✏️ Job modified: ${job.id} - ${job.title} (${previousJob?.status} → ${job.status})`);
          changes.push({
            type: 'modified',
            job,
            previousStatus: previousJob?.status
          });
          this.jobCache.set(job.id, job);
          break;
          
        case 'removed':
          console.log(`➖ Job removed: ${job.id} - ${job.title} (likely completed)`);
          this.jobCache.delete(job.id);
          changes.push({ type: 'removed', job });
          break;
      }
    });
    
    return changes;
  }

  /**
   * Convert Firestore document to Job object
   */
  private convertDocToJob(doc: DocumentSnapshot): Job {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as Job;
  }

  /**
   * Get cached job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobCache.get(jobId);
  }

  /**
   * Get all cached jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobCache.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobCache.values()).filter(job => job.status === status);
  }

  /**
   * Unsubscribe from a specific listener
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      console.log(`🔌 Unsubscribing from: ${key}`);
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    console.log(`🔌 Unsubscribing from all listeners (${this.listeners.size} active)`);
    this.listeners.forEach((unsubscribe, key) => {
      console.log(`  - Unsubscribing: ${key}`);
      unsubscribe();
    });
    this.listeners.clear();
    this.jobCache.clear();
  }

  /**
   * Get listener count (for debugging)
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Get active listener keys (for debugging)
   */
  getActiveListeners(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// Export singleton instance
export const realtimeJobSync = new RealtimeJobSyncService();

// Export helper functions for common use cases
export const subscribeToAllJobs = realtimeJobSync.subscribeToAllJobs.bind(realtimeJobSync);
export const subscribeToPropertyJobs = realtimeJobSync.subscribeToPropertyJobs.bind(realtimeJobSync);
export const subscribeToStaffJobs = realtimeJobSync.subscribeToStaffJobs.bind(realtimeJobSync);
export const subscribeToJob = realtimeJobSync.subscribeToJob.bind(realtimeJobSync);
export const subscribeToCompletedJobs = realtimeJobSync.subscribeToCompletedJobs.bind(realtimeJobSync);
