/**
 * QUICK START GUIDE
 * How to add real-time job updates to your components
 */

// ====================================
// EXAMPLE 1: Simple Job List
// ====================================

'use client'

import { useAllJobs } from '@/hooks/useRealtimeJobs';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';

export default function SimpleJobList() {
  // That's it! This one hook gives you real-time job updates
  const { jobs, loading } = useAllJobs({ showNotifications: true });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Active Jobs ({jobs.length})</h1>
      {jobs.map(job => (
        <div key={job.id} className="card">
          <h3>{job.title}</h3>
          <p>{job.propertyName}</p>
          <JobStatusBadge status={job.status} />
        </div>
      ))}
    </div>
  );
}

// ====================================
// EXAMPLE 2: Job Dashboard with Stats
// ====================================

'use client'

import { useAllJobs, useJobStats } from '@/hooks/useRealtimeJobs';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';

export default function JobDashboard() {
  const { jobs, loading, getJobsByStatus } = useAllJobs();
  const { stats } = useJobStats();

  const assigned = getJobsByStatus('assigned');
  const inProgress = getJobsByStatus('in_progress');
  const accepted = getJobsByStatus('accepted');

  return (
    <div>
      {/* Real-time stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-neutral-400">Total Jobs</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-blue-400">{stats.assigned}</div>
          <div className="text-neutral-400">Assigned</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-green-400">{stats.accepted}</div>
          <div className="text-neutral-400">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="text-3xl font-bold text-orange-400">{stats.inProgress}</div>
          <div className="text-neutral-400">In Progress</div>
        </div>
      </div>

      {/* Jobs by status */}
      <div className="grid grid-cols-3 gap-4">
        <JobSection title="Assigned" jobs={assigned} />
        <JobSection title="Accepted" jobs={accepted} />
        <JobSection title="In Progress" jobs={inProgress} />
      </div>
    </div>
  );
}

function JobSection({ title, jobs }) {
  return (
    <div>
      <h2>{title} ({jobs.length})</h2>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

// ====================================
// EXAMPLE 3: Property Jobs Page
// ====================================

'use client'

import { usePropertyJobs } from '@/hooks/useRealtimeJobs';

export default function PropertyJobsPage({ params }) {
  const { jobs, loading, error } = usePropertyJobs(params.propertyId, {
    showNotifications: true,
    onJobStatusChange: (job, prevStatus) => {
      console.log(`Job ${job.title}: ${prevStatus} → ${job.status}`);
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>Jobs for Property</h1>
      <p>{jobs.length} active jobs</p>
      
      {jobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <JobStatusBadge status={job.status} />
          <p>Assigned to: {job.assignedStaffName}</p>
        </div>
      ))}
    </div>
  );
}

// ====================================
// EXAMPLE 4: Job Detail Page
// ====================================

'use client'

import { useJob } from '@/hooks/useRealtimeJobs';
import { JobStatusIndicator } from '@/components/jobs/JobStatusBadge';

export default function JobDetailPage({ params }) {
  const { job, loading, error } = useJob(params.jobId);

  if (loading) return <div>Loading job...</div>;
  if (!job) return <div>Job not found (may be completed)</div>;

  return (
    <div>
      <h1>{job.title}</h1>
      
      {/* Shows current status with "Live" indicator */}
      <JobStatusIndicator 
        status={job.status}
        updatedAt={job.updatedAt}
      />

      <div className="details">
        <p>Property: {job.propertyName}</p>
        <p>Assigned: {job.assignedStaffName}</p>
        <p>Scheduled: {formatDate(job.scheduledDate)}</p>
        
        {job.acceptedAt && (
          <p>✅ Accepted: {formatDate(job.acceptedAt)}</p>
        )}
        
        {job.startedAt && (
          <p>🚀 Started: {formatDate(job.startedAt)}</p>
        )}
      </div>
    </div>
  );
}

// ====================================
// EXAMPLE 5: Add to Existing Component
// ====================================

// Before (static data):
function ExistingComponent() {
  const [jobs, setJobs] = useState([]);
  
  useEffect(() => {
    fetchJobs().then(setJobs);
  }, []);
  
  return <JobList jobs={jobs} />;
}

// After (real-time):
import { useAllJobs } from '@/hooks/useRealtimeJobs';

function ExistingComponent() {
  const { jobs } = useAllJobs(); // Just replace with this!
  
  return <JobList jobs={jobs} />;
}

// ====================================
// EXAMPLE 6: Show Notifications
// ====================================

'use client'

import { useAllJobs } from '@/hooks/useRealtimeJobs';

export default function JobsWithNotifications() {
  const { jobs } = useAllJobs({
    showNotifications: true, // ✅ Enable toast notifications
    onJobStatusChange: (job, previousStatus) => {
      // Custom logic when status changes
      if (job.status === 'in_progress') {
        console.log(`${job.assignedStaffName} started working!`);
        // Send email, update dashboard, etc.
      }
    }
  });

  return <JobList jobs={jobs} />;
}

// ====================================
// EXAMPLE 7: Filter Jobs
// ====================================

'use client'

import { useAllJobs } from '@/hooks/useRealtimeJobs';

export default function FilteredJobs() {
  const { jobs, getJobsByStatus } = useAllJobs();
  const [filter, setFilter] = useState('all');

  const filteredJobs = filter === 'all' 
    ? jobs 
    : getJobsByStatus(filter);

  return (
    <div>
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">All Jobs</option>
        <option value="assigned">Assigned</option>
        <option value="accepted">Accepted</option>
        <option value="in_progress">In Progress</option>
      </select>

      <JobList jobs={filteredJobs} />
    </div>
  );
}

// ====================================
// EXAMPLE 8: Completed Jobs
// ====================================

'use client'

import { useCompletedJobs } from '@/hooks/useRealtimeJobs';

export default function CompletedJobsPage() {
  const { completedJobs, loading } = useCompletedJobs();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Completed Jobs ({completedJobs.length})</h1>
      {completedJobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>Completed by: {job.assignedStaffName}</p>
          <p>Completed: {formatDate(job.completedAt)}</p>
          <p>Duration: {job.actualDuration} minutes</p>
          
          {job.photos && job.photos.length > 0 && (
            <div>
              <h4>Photos ({job.photos.length})</h4>
              {job.photos.map(photo => (
                <img key={photo} src={photo} alt="Job photo" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ====================================
// That's it! Just import the hook and use it.
// The hook handles:
// - Real-time Firestore listeners
// - Automatic cleanup
// - Status change detection
// - Toast notifications (optional)
// - Error handling
// ====================================
