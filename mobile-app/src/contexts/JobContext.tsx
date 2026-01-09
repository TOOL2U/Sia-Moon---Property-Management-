import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { JobAssignment, JobResponse, JobCompletionData } from '../types/job';

interface JobContextType {
  jobs: JobAssignment[];
  pendingJobs: JobAssignment[];
  activeJobs: JobAssignment[];
  completedJobs: JobAssignment[];
  loading: boolean;
  respondToJob: (response: JobResponse) => Promise<void>;
  startJob: (jobId: string) => Promise<void>;
  completeJob: (completion: JobCompletionData) => Promise<void>;
  refreshJobs: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, staffProfile } = useAuth();

  // Computed job lists
  const pendingJobs = jobs.filter(job => job.status === 'pending' || job.status === 'assigned');
  const activeJobs = jobs.filter(job => job.status === 'accepted' || job.status === 'in_progress');
  const completedJobs = jobs.filter(job => job.status === 'completed');

  // Listen for job assignments in real-time
  useEffect(() => {
    if (!user || !staffProfile) {
      setJobs([]);
      setLoading(false);
      return;
    }

    console.log('📱 Setting up job listener for staff:', staffProfile.id);
    console.log('📱 Staff role:', (staffProfile as any)?.role || 'unknown');
    setLoading(true);

    // ✅ SIMPLIFIED: Get all jobs, filter client-side
    // This avoids Firebase composite index requirements
    const jobsQuery = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        console.log('🔄 Jobs updated, received', snapshot.size, 'jobs');
        
        const jobList: JobAssignment[] = [];
        const staffRole = (staffProfile as any)?.role || (staffProfile as any)?.staffType || 'cleaner';
        
        console.log(`📱 Filtering jobs for role: ${staffRole}, uid: ${user.uid}`);
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const job = {
            id: doc.id,
            ...data
          } as JobAssignment;
          
          // ✅ Client-side filtering for all active statuses
          const validStatuses = ['pending', 'assigned', 'accepted', 'in_progress'];
          if (!validStatuses.includes(job.status)) {
            return; // Skip completed/cancelled jobs
          }
          
          // Filter logic:
          // 1. Show jobs assigned to this staff (accepted/in_progress)
          // 2. Show pending jobs that match staff role AND not declined
          const isAssignedToMe = job.assignedStaffId === user.uid;
          const isPending = job.status === 'pending';
          const hasDeclined = (data.declinedBy && data.declinedBy[user.uid]);
          
          // ✅ Check if job role matches staff role (for pending jobs)
          const jobRole = data.requiredRole || data.requiredStaffType || 'cleaner';
          const roleMatches = jobRole.toLowerCase() === staffRole.toLowerCase();
          
          console.log(`Job ${doc.id}: role=${jobRole}, staffRole=${staffRole}, matches=${roleMatches}, pending=${isPending}, assigned=${isAssignedToMe}`);
          
          if (isAssignedToMe || (isPending && !hasDeclined && roleMatches)) {
            jobList.push(job);
          }
        });

        console.log(`✅ Filtered to ${jobList.length} jobs for role: ${staffRole}`);
        setJobs(jobList);
        setLoading(false);

        // Check for new pending jobs to show notifications
        const newPendingJobs = jobList.filter(job => 
          job.status === 'pending' && !job.staffResponse
        );

        if (newPendingJobs.length > 0) {
          console.log('🔔 Found', newPendingJobs.length, 'new available jobs');
          // Notification will be handled by NotificationContext
        }
      },
      (error) => {
        console.error('❌ Error listening to jobs:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up job listener');
      unsubscribe();
    };
  }, [user, staffProfile]);

  // Respond to job assignment (accept/decline)
  const respondToJob = async (response: JobResponse) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('📱 Responding to job:', response.jobId, response.accepted ? 'ACCEPT' : 'DECLINE');
      
      const jobRef = doc(db, 'jobs', response.jobId);
      
      if (response.accepted) {
        // ✅ ACCEPTING JOB: Assign to this cleaner
        console.log('👍 Cleaner accepting job, assigning to:', user.uid);
        
        const updateData: any = {
          // Assign job to this cleaner
          assignedStaffId: user.uid,
          assignedTo: user.uid,
          assignedStaffRef: {
            id: user.uid,
            name: (staffProfile as any)?.name || 'Staff Member',
            email: user.email || '',
            phone: (staffProfile as any)?.phone || ''
          },
          
          // ✅ Update status: pending → assigned (cleaner accepted it)
          status: 'assigned',
          
          // Record response
          staffResponse: response,
          acceptedAt: serverTimestamp(),
          acceptedBy: user.uid,
          
          // Remove broadcast flag
          broadcastToAll: false,
          
          // Timestamps
          updatedAt: serverTimestamp(),
          lastMobileSync: serverTimestamp()
        };

        await updateDoc(jobRef, updateData);
        
        console.log('✅ Job accepted and assigned to', user.email);
        console.log('🔄 Job will disappear from other cleaners\' lists');
        
      } else {
        // ❌ DECLINING JOB: Don't assign, keep it available for others
        console.log('👎 Cleaner declining job, keeping it available for others');
        
        const updateData: any = {
          // Record this cleaner's decline (so they don't see it again)
          [`declinedBy.${user.uid}`]: {
            declinedAt: serverTimestamp(),
            reason: (response as any).declineReason || 'No reason provided'
          },
          
          // Keep status as pending for other cleaners
          status: 'pending',
          
          // Timestamps
          updatedAt: serverTimestamp(),
          lastMobileSync: serverTimestamp()
        };

        await updateDoc(jobRef, updateData);
        
        console.log('✅ Job decline recorded, still available for other cleaners');
      }
      
    } catch (error) {
      console.error('❌ Error responding to job:', error);
      throw error;
    }
  };

  // Start working on a job
  const startJob = async (jobId: string) => {
    try {
      console.log('📱 Starting job:', jobId);
      
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMobileSync: serverTimestamp()
      });
      
      console.log('✅ Job started successfully');
    } catch (error) {
      console.error('❌ Error starting job:', error);
      throw error;
    }
  };

  // Complete a job
  const completeJob = async (completion: JobCompletionData) => {
    try {
      console.log('📱 Completing job:', completion.jobId);
      
      const jobRef = doc(db, 'jobs', completion.jobId);
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        completionNotes: completion.completionNotes,
        completionPhotos: completion.completionPhotos,
        qualityRating: completion.qualityRating,
        issuesReported: completion.issuesReported,
        progress: 100,
        updatedAt: serverTimestamp(),
        lastMobileSync: serverTimestamp()
      });
      
      console.log('✅ Job completed successfully');
    } catch (error) {
      console.error('❌ Error completing job:', error);
      throw error;
    }
  };

  // Refresh jobs manually
  const refreshJobs = () => {
    console.log('📱 Manual job refresh requested');
    // The real-time listener will automatically update
  };

  const value: JobContextType = {
    jobs,
    pendingJobs,
    activeJobs,
    completedJobs,
    loading,
    respondToJob,
    startJob,
    completeJob,
    refreshJobs
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}
