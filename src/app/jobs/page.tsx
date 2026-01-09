'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Eye,
  Edit,
  Play,
  Bell,
  Trash2
} from 'lucide-react';
import { useAllJobs } from '@/hooks/useRealtimeJobs';

interface Job {
  id: string;
  bookingId: string;
  propertyId: string;
  type: string;
  status: 'pending' | 'assigned' | 'offered' | 'in_progress' | 'completed' | 'cancelled';
  assignedStaffId?: string;
  scheduledFor: Date | any;
  scheduledStart?: Date | any;
  duration: number;
  estimatedDuration?: number;
  requirements?: {
    skills?: string[];
    certifications?: string[];
    equipment?: string[];
  };
  description?: string;
  propertyName?: string;
  staffName?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
  title?: string;
  jobType?: string;
}

interface JobOffer {
  id: string;
  jobId: string;
  staffId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  staffName?: string;
  jobTitle?: string;
}

export default function JobsPage() {
  // Use real-time jobs hook for automatic updates from both collections
  const { jobs: realtimeJobs, loading, error } = useAllJobs({
    showNotifications: true,
    onJobStatusChange: (job, previousStatus) => {
      console.log(`🔄 Job ${job.id} status changed: ${previousStatus} → ${job.status}`);
    }
  });

  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'offers'>('jobs');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [offersLoading, setOffersLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete all jobs function
  const handleDeleteAllJobs = async () => {
    if (!db) {
      alert('Firebase not initialized');
      return;
    }

    try {
      setIsDeleting(true);

      // Delete from both collections in batches
      const collections = ['jobs', 'operational_jobs'];
      let totalDeleted = 0;

      for (const collectionName of collections) {
        // Get all documents
        const jobsQuery = query(collection(db, collectionName));
        const snapshot = await getDocs(jobsQuery);
        
        // Delete in batches of 500 (Firestore limit)
        const batchSize = 500;
        const batches: any[] = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;

        snapshot.docs.forEach((document) => {
          currentBatch.delete(doc(db, collectionName, document.id));
          operationCount++;

          if (operationCount === batchSize) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        });

        // Add remaining operations
        if (operationCount > 0) {
          batches.push(currentBatch);
        }

        // Commit all batches
        for (const batch of batches) {
          await batch.commit();
        }

        totalDeleted += snapshot.docs.length;
        console.log(`✅ Deleted ${snapshot.docs.length} jobs from ${collectionName}`);
      }

      // Also delete related calendar events
      const calendarQuery = query(
        collection(db, 'calendarEvents'),
        orderBy('createdAt', 'desc')
      );
      const calendarSnapshot = await getDocs(calendarQuery);
      const jobCalendarEvents = calendarSnapshot.docs.filter(doc => 
        doc.data().type === 'job' || doc.id.startsWith('job-')
      );

      const calendarBatches: any[] = [];
      let calendarBatch = writeBatch(db);
      let calendarOps = 0;

      jobCalendarEvents.forEach((document) => {
        calendarBatch.delete(doc(db, 'calendarEvents', document.id));
        calendarOps++;

        if (calendarOps === 500) {
          calendarBatches.push(calendarBatch);
          calendarBatch = writeBatch(db);
          calendarOps = 0;
        }
      });

      if (calendarOps > 0) {
        calendarBatches.push(calendarBatch);
      }

      for (const batch of calendarBatches) {
        await batch.commit();
      }

      console.log(`✅ Deleted ${jobCalendarEvents.length} calendar events`);
      console.log(`✅ Total cleanup: ${totalDeleted} jobs + ${jobCalendarEvents.length} calendar events`);

      alert(`Successfully deleted ${totalDeleted} jobs and ${jobCalendarEvents.length} calendar events`);
      setShowDeleteConfirm(false);

    } catch (error) {
      console.error('❌ Error deleting jobs:', error);
      alert('Error deleting jobs. Check console for details.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch offers on mount
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setOffersLoading(true);
        if (!db) return;
        
        const offersQuery = query(
          collection(db, 'job_offers'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const offersSnapshot = await getDocs(offersQuery);
        const offersData = offersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          expiresAt: doc.data().expiresAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        })) as JobOffer[];

        setOffers(offersData);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Convert realtime jobs to expected format
  const jobs: Job[] = realtimeJobs.map(job => ({
    id: job.id,
    bookingId: job.bookingId || '',
    propertyId: job.propertyId,
    type: job.jobType || job.type || 'cleaning',
    status: job.status as any,
    assignedStaffId: job.assignedStaffId || job.assignedTo,
    scheduledFor: job.scheduledDate,
    scheduledStart: job.scheduledDate,
    duration: job.estimatedDuration || 120,
    estimatedDuration: job.estimatedDuration,
    requirements: {
      skills: Array.isArray(job.requirements) ? job.requirements : [],
      certifications: [],
      equipment: []
    },
    description: job.specialInstructions || job.description,
    propertyName: job.propertyName,
    staffName: job.assignedStaffName,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    title: job.title,
    jobType: job.jobType || job.type
  }));

  const getStatusBadge = (status: string, type: 'job' | 'offer' = 'job') => {
    const jobVariants = {
      pending: 'bg-yellow-900 text-yellow-300 border border-yellow-600',
      assigned: 'bg-blue-900 text-blue-300 border border-blue-600',
      offered: 'bg-purple-900 text-purple-300 border border-purple-600',
      in_progress: 'bg-orange-900 text-orange-300 border border-orange-600',
      completed: 'bg-green-900 text-green-300 border border-green-600',
      cancelled: 'bg-red-900 text-red-300 border border-red-600',
    };

    const offerVariants = {
      pending: 'bg-yellow-900 text-yellow-300 border border-yellow-600',
      accepted: 'bg-green-900 text-green-300 border border-green-600',
      declined: 'bg-red-900 text-red-300 border border-red-600',
      expired: 'bg-neutral-900 text-neutral-300 border border-neutral-600',
    };

    const variants = type === 'job' ? jobVariants : offerVariants;

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.toUpperCase().replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Settings className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'offered':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-neutral-500" />;
      default:
        return <Clock className="h-4 w-4 text-neutral-500" />;
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'Not scheduled';
    
    try {
      // Handle Firestore Timestamp
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter);

  const filteredOffers = statusFilter === 'all' 
    ? offers 
    : offers.filter(offer => offer.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-400 text-sm">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                Jobs & Offers Management
              </h1>
              <p className="mt-2 text-neutral-400">
                Monitor job assignments and auto-dispatch offers
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Jobs
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="bg-neutral-900 border-red-800 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Confirm Delete All Jobs
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  This action cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-950/30 border border-red-900 rounded-lg p-4">
                    <p className="text-sm text-red-400 font-medium mb-2">
                      ⚠️ WARNING: This will permanently delete:
                    </p>
                    <ul className="text-sm text-neutral-300 space-y-1 ml-4">
                      <li>• All jobs from 'jobs' collection</li>
                      <li>• All jobs from 'operational_jobs' collection</li>
                      <li>• All related calendar events</li>
                      <li>• Approximately {jobs.length} total job records</li>
                    </ul>
                  </div>

                  <p className="text-sm text-neutral-400">
                    Are you absolutely sure you want to delete all jobs? This operation
                    will remove all job data from the system.
                  </p>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAllJobs}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Yes, Delete All Jobs
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-neutral-900 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Jobs ({filteredJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'offers'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Offers ({filteredOffers.length})
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          
          {activeTab === 'jobs' ? (
            <>
              {['pending', 'offered', 'assigned', 'in_progress', 'completed', 'cancelled'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status.replace('_', ' ')}
                  <span className="ml-2 bg-neutral-800 px-2 py-1 rounded-full text-xs">
                    {jobs.filter(job => job.status === status).length}
                  </span>
                </Button>
              ))}
            </>
          ) : (
            <>
              {['pending', 'accepted', 'declined', 'expired'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status}
                  <span className="ml-2 bg-neutral-800 px-2 py-1 rounded-full text-xs">
                    {offers.filter(offer => offer.status === status).length}
                  </span>
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <Card key={job.id} className="bg-neutral-950 border-neutral-800 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          {job.title || `Job #${job.id?.slice(-8) || 'Unknown'}`}
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                          {job.type} • {job.propertyName || job.propertyId || 'Unknown Property'}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {getStatusBadge(job.status)}
                        <span className="text-sm text-neutral-400">
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-neutral-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium text-neutral-300">Scheduled</div>
                          <div>{formatDate(job.scheduledFor)}</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-neutral-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium text-neutral-300">Duration</div>
                          <div>{job.duration} minutes</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-neutral-400">
                        <Users className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium text-neutral-300">Assigned Staff</div>
                          <div>{job.staffName || 'Unassigned'}</div>
                        </div>
                      </div>
                    </div>

                    {job.requirements && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Requirements</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(job.requirements.skills) && job.requirements.skills.map(skill => (
                            <Badge key={skill} variant="outline" className="text-blue-400 border-blue-600">
                              {skill}
                            </Badge>
                          ))}
                          {Array.isArray(job.requirements.equipment) && job.requirements.equipment.map(equipment => (
                            <Badge key={equipment} variant="outline" className="text-green-400 border-green-600">
                              {equipment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <div className="text-sm text-neutral-400">
                        Booking: {job.bookingId}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {job.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <Play className="h-4 w-4 mr-1" />
                              Dispatch
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
                <p className="text-neutral-400">
                  {statusFilter === 'all'
                    ? 'No jobs have been created yet.'
                    : `No ${statusFilter} jobs found.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            {filteredOffers.length > 0 ? (
              filteredOffers.map((offer) => (
                <Card key={offer.id} className="bg-neutral-950 border-neutral-800 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Offer #{offer.id?.slice(-8) || 'Unknown'}
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                          {offer.jobTitle || `Job ${offer.jobId?.slice(-8) || 'Unknown'}`} • {offer.staffName || offer.staffId || 'Unknown Staff'}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {getStatusBadge(offer.status, 'offer')}
                        <span className="text-sm text-neutral-400">
                          {formatDate(offer.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-neutral-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium text-neutral-300">Created</div>
                          <div>{formatDate(offer.createdAt)}</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-neutral-400">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium text-neutral-300">Expires</div>
                          <div>{formatDate(offer.expiresAt)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <div className="text-sm text-neutral-400">
                        Staff: {offer.staffName || offer.staffId}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Job
                        </Button>
                        {offer.status === 'pending' && (
                          <Button size="sm" variant="outline" className="text-red-400 border-red-800 hover:bg-red-900">
                            Cancel Offer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No offers found</h3>
                <p className="text-neutral-400">
                  {statusFilter === 'all'
                    ? 'No job offers have been created yet.'
                    : `No ${statusFilter} offers found.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="mt-8 bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">System Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{jobs.length}</div>
                <div className="text-sm text-neutral-400">Total Jobs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {jobs.filter(j => j.status === 'completed').length}
                </div>
                <div className="text-sm text-neutral-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {jobs.filter(j => j.status === 'in_progress').length}
                </div>
                <div className="text-sm text-neutral-400">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {offers.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-sm text-neutral-400">Active Offers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
