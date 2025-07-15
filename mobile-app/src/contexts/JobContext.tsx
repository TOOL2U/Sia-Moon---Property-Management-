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
    setLoading(true);

    // Query jobs assigned to this staff member
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('assignedStaffId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        console.log('🔄 Jobs updated, received', snapshot.size, 'jobs');
        
        const jobList: JobAssignment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          jobList.push({
            id: doc.id,
            ...data
          } as JobAssignment);
        });

        setJobs(jobList);
        setLoading(false);

        // Check for new pending jobs to show notifications
        const newPendingJobs = jobList.filter(job => 
          (job.status === 'pending' || job.status === 'assigned') && 
          !job.staffResponse
        );

        if (newPendingJobs.length > 0) {
          console.log('🔔 Found', newPendingJobs.length, 'new pending jobs');
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
    try {
      console.log('📱 Responding to job:', response.jobId, response.accepted ? 'ACCEPT' : 'DECLINE');
      
      const jobRef = doc(db, 'jobs', response.jobId);
      
      const updateData: any = {
        staffResponse: response,
        status: response.accepted ? 'accepted' : 'declined',
        updatedAt: serverTimestamp(),
        lastMobileSync: serverTimestamp()
      };

      if (response.accepted) {
        updateData.acceptedAt = serverTimestamp();
      } else {
        updateData.declinedAt = serverTimestamp();
      }

      await updateDoc(jobRef, updateData);
      
      console.log('✅ Job response saved successfully');
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
