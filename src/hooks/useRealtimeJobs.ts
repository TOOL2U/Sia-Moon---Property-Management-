/**
 * React Hook for Real-Time Job Sync
 * 
 * Makes it easy to subscribe to job updates in React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  realtimeJobSync,
  Job,
  JobChange,
  JobStatus,
  CompletedJob
} from '@/services/RealtimeJobSyncService';
import { clientToast as toast } from '@/utils/clientToast';

export interface UseJobsOptions {
  propertyId?: string;
  staffId?: string;
  showNotifications?: boolean;
  onJobStatusChange?: (job: Job, previousStatus?: JobStatus) => void;
}

export interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  getJobById: (jobId: string) => Job | undefined;
  getJobsByStatus: (status: JobStatus) => Job[];
}

/**
 * Hook to subscribe to all jobs with real-time updates
 */
export function useAllJobs(options: UseJobsOptions = {}): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotifications = true, onJobStatusChange } = options;
  
  // Track previous jobs for status change detection
  const previousJobsRef = useRef<Map<string, Job>>(new Map());
  
  // Store callback in ref to avoid re-subscription on function change
  const onJobStatusChangeRef = useRef(onJobStatusChange);
  useEffect(() => {
    onJobStatusChangeRef.current = onJobStatusChange;
  }, [onJobStatusChange]);

  useEffect(() => {
    console.log('👂 Setting up real-time listener for all jobs');
    setLoading(true);

    const unsubscribe = realtimeJobSync.subscribeToAllJobs(
      (updatedJobs, changes) => {
        setJobs(updatedJobs);
        setLoading(false);

        // Handle status changes and notifications
        changes.forEach(change => {
          if (change.type === 'modified' && change.previousStatus !== change.job.status) {
            const job = change.job;
            
            // Notify callback using ref to avoid dependency issues
            onJobStatusChangeRef.current?.(job, change.previousStatus);

            // Show toast notifications
            if (showNotifications) {
              const statusMessages = {
                accepted: `✅ ${job.assignedStaffName || 'Staff'} accepted "${job.title}"`,
                in_progress: `🚀 ${job.assignedStaffName || 'Staff'} started "${job.title}"`,
                completed: `🎉 "${job.title}" has been completed!`,
                cancelled: `❌ "${job.title}" was cancelled`
              };

              const message = statusMessages[job.status as keyof typeof statusMessages];
              if (message) {
                toast.success(message);
              }
            }
          }

          // New job notification
          if (change.type === 'added' && showNotifications) {
            toast.success(`📋 New job created: "${change.job.title}"`);
          }

          // Job removed (completed)
          if (change.type === 'removed' && showNotifications) {
            toast.success(`📦 "${change.job.title}" moved to completed jobs`);
          }
        });

        // Update previous jobs map
        previousJobsRef.current.clear();
        updatedJobs.forEach(job => previousJobsRef.current.set(job.id, job));
      },
      (err) => {
        console.error('❌ Real-time job sync error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔌 Cleaning up real-time listener for all jobs');
      unsubscribe();
    };
  }, [showNotifications]);

  const refresh = useCallback(() => {
    setLoading(true);
    // Re-subscription will happen automatically through useEffect
  }, []);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getJobsByStatus = useCallback((status: JobStatus) => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  return {
    jobs,
    loading,
    error,
    refresh,
    getJobById,
    getJobsByStatus
  };
}

/**
 * Hook to subscribe to property jobs with real-time updates
 */
export function usePropertyJobs(
  propertyId: string | undefined,
  options: UseJobsOptions = {}
): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotifications = true, onJobStatusChange } = options;
  
  // Store callback in ref to avoid re-subscription on function change
  const onJobStatusChangeRef = useRef(onJobStatusChange);
  useEffect(() => {
    onJobStatusChangeRef.current = onJobStatusChange;
  }, [onJobStatusChange]);

  useEffect(() => {
    if (!propertyId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    console.log(`👂 Setting up real-time listener for property: ${propertyId}`);
    setLoading(true);

    const unsubscribe = realtimeJobSync.subscribeToPropertyJobs(
      propertyId,
      (updatedJobs, changes) => {
        setJobs(updatedJobs);
        setLoading(false);

        // Handle notifications similar to useAllJobs
        changes.forEach(change => {
          if (change.type === 'modified' && change.previousStatus !== change.job.status) {
            const job = change.job;
            onJobStatusChangeRef.current?.(job, change.previousStatus);

            if (showNotifications) {
              const statusMessages = {
                accepted: `✅ Job accepted: "${job.title}"`,
                in_progress: `🚀 Job started: "${job.title}"`,
                completed: `🎉 Job completed: "${job.title}"`,
                cancelled: `❌ Job cancelled: "${job.title}"`
              };

              const message = statusMessages[job.status as keyof typeof statusMessages];
              if (message) {
                toast.success(message);
              }
            }
          }
        });
      },
      (err) => {
        console.error(`❌ Real-time job sync error (property ${propertyId}):`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log(`🔌 Cleaning up real-time listener for property: ${propertyId}`);
      unsubscribe();
    };
  }, [propertyId, showNotifications]);

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getJobsByStatus = useCallback((status: JobStatus) => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  return {
    jobs,
    loading,
    error,
    refresh,
    getJobById,
    getJobsByStatus
  };
}

/**
 * Hook to subscribe to staff jobs with real-time updates
 */
export function useStaffJobs(
  staffId: string | undefined,
  options: UseJobsOptions = {}
): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotifications = false } = options; // Default false for staff view

  useEffect(() => {
    if (!staffId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    console.log(`👂 Setting up real-time listener for staff: ${staffId}`);
    setLoading(true);

    const unsubscribe = realtimeJobSync.subscribeToStaffJobs(
      staffId,
      (updatedJobs) => {
        setJobs(updatedJobs);
        setLoading(false);
      },
      (err) => {
        console.error(`❌ Real-time job sync error (staff ${staffId}):`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log(`🔌 Cleaning up real-time listener for staff: ${staffId}`);
      unsubscribe();
    };
  }, [staffId, showNotifications]);

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getJobsByStatus = useCallback((status: JobStatus) => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  return {
    jobs,
    loading,
    error,
    refresh,
    getJobById,
    getJobsByStatus
  };
}

/**
 * Hook to subscribe to a single job with real-time updates
 */
export function useJob(jobId: string | undefined) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    console.log(`👂 Setting up real-time listener for job: ${jobId}`);
    setLoading(true);

    const unsubscribe = realtimeJobSync.subscribeToJob(
      jobId,
      (updatedJob) => {
        setJob(updatedJob);
        setLoading(false);

        if (updatedJob === null) {
          console.log(`📦 Job ${jobId} was removed (likely completed)`);
        }
      },
      (err) => {
        console.error(`❌ Real-time job sync error (job ${jobId}):`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log(`🔌 Cleaning up real-time listener for job: ${jobId}`);
      unsubscribe();
    };
  }, [jobId]);

  return { job, loading, error };
}

/**
 * Hook to subscribe to completed jobs with real-time updates
 */
export function useCompletedJobs(propertyId?: string) {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log(`👂 Setting up real-time listener for completed jobs${propertyId ? ` (property: ${propertyId})` : ''}`);
    setLoading(true);

    const unsubscribe = realtimeJobSync.subscribeToCompletedJobs(
      (updatedJobs) => {
        setCompletedJobs(updatedJobs);
        setLoading(false);
      },
      propertyId,
      (err) => {
        console.error('❌ Real-time completed jobs sync error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔌 Cleaning up real-time listener for completed jobs');
      unsubscribe();
    };
  }, [propertyId]);

  return { completedJobs, loading, error };
}

/**
 * Hook to get job statistics with real-time updates
 */
export function useJobStats(propertyId?: string) {
  const { jobs, loading } = propertyId 
    ? usePropertyJobs(propertyId, { showNotifications: false })
    : useAllJobs({ showNotifications: false });

  const stats = {
    total: jobs.length,
    assigned: jobs.filter(j => j.status === 'assigned').length,
    accepted: jobs.filter(j => j.status === 'accepted').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    cancelled: jobs.filter(j => j.status === 'cancelled').length
  };

  return { stats, loading };
}
