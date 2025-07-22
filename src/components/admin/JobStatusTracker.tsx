'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import JobAssignmentService, { JobData, JobStatus } from '@/services/JobAssignmentService'
import { clientToast as toast } from '@/utils/clientToast'
import { formatLocalDate, formatLocalDateTime, getDifferenceInMinutes } from '@/utils/dateUtils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Briefcase,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Image,
  Mail,
  Phone,
  Play,
  RefreshCw,
  Search,
  Square,
  Star,
  Timer,
  TrendingUp,
  User,
  Zap
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
// JobTimelineView removed - component not available
import { PhotoProofGallery } from './PhotoProofGallery'

interface JobStatusTrackerProps {
  bookingId?: string
  className?: string
  showAllJobs?: boolean
  staffId?: string
}

interface JobTrackingData extends JobData {
  staffInfo: {
    name: string
    email: string
    phone?: string
    avatar?: string
    rating?: number
  }
  progressPercentage: number
  timeElapsed?: number
  estimatedTimeRemaining?: number
  photoProofStatus: {
    required: boolean
    uploaded: boolean
    count: number
    lastUploadedAt?: Date
  }
  lastActivity?: {
    action: string
    timestamp: string
    location?: { latitude: number; longitude: number }
  }
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 }
  }
}

const cardHoverVariants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

export function JobStatusTracker({
  bookingId,
  className,
  showAllJobs = false,
  staffId
}: JobStatusTrackerProps) {
  // State management
  const [jobs, setJobs] = useState<JobTrackingData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobTrackingData | null>(null)
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [photoGalleryJob, setPhotoGalleryJob] = useState<JobTrackingData | null>(null)
  const [timelineJob, setTimelineJob] = useState<JobTrackingData | null>(null)

  // Real-time subscription
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null)

  // Load jobs with real-time updates
  const loadJobs = useCallback(() => {
    console.log('📊 Setting up real-time job tracking...')

    const filters: any = {}
    if (staffId) filters.staffId = staffId
    if (!showAllJobs && bookingId) filters.bookingId = bookingId

    const unsubscribeFn = JobAssignmentService.subscribeToJobs((updatedJobs) => {
      console.log(`✅ Received ${updatedJobs.length} jobs for tracking`)

      // Transform jobs to tracking data
      const trackingData: JobTrackingData[] = updatedJobs.map(job => ({
        ...job,
        staffInfo: {
          name: job.assignedStaffRef?.name || 'Unknown Staff',
          email: (job.assignedStaffRef as any)?.email || '',
          phone: job.assignedStaffRef?.phone,
          avatar: (job.assignedStaffRef as any)?.avatar,
          rating: (job.assignedStaffRef as any)?.rating || 4.5
        },
        progressPercentage: calculateProgressPercentage(job.status),
        timeElapsed: calculateTimeElapsed(job.createdAt, job.status),
        estimatedTimeRemaining: calculateTimeRemaining(job),
        photoProofStatus: {
          required: job.jobType === 'cleaning' || job.jobType === 'maintenance',
          uploaded: (job.completionPhotos?.length || 0) > 0,
          count: job.completionPhotos?.length || 0,
          lastUploadedAt: job.completionPhotos?.[0] ? new Date() : undefined
        },
        lastActivity: job.statusHistory?.[job.statusHistory.length - 1] ? {
          action: job.statusHistory[job.statusHistory.length - 1].status,
          timestamp: job.statusHistory[job.statusHistory.length - 1].timestamp,
          location: (job as any).lastKnownLocation
        } : undefined
      }))

      setJobs(trackingData)
      setLoading(false)
    }, filters)

    setUnsubscribe(() => unsubscribeFn)
    return unsubscribeFn
  }, [bookingId, showAllJobs, staffId])

  // Calculate progress percentage based on status
  const calculateProgressPercentage = (status: JobStatus): number => {
    const statusProgress: Record<JobStatus, number> = {
      pending: 0,
      assigned: 20,
      accepted: 40,
      in_progress: 70,
      completed: 90,
      verified: 100,
      cancelled: 0
    }
    return statusProgress[status] || 0
  }

  // Calculate time elapsed
  const calculateTimeElapsed = (createdAt: any, status: JobStatus): number => {
    if (status === 'pending' || status === 'assigned') return 0

    return getDifferenceInMinutes(createdAt)
  }

  // Calculate estimated time remaining
  const calculateTimeRemaining = (job: JobData): number => {
    if (job.status === 'completed' || job.status === 'verified') return 0
    if (job.status === 'pending' || job.status === 'assigned') return job.estimatedDuration || 120

    const elapsed = calculateTimeElapsed(job.createdAt, job.status)
    const estimated = job.estimatedDuration || 120
    return Math.max(0, estimated - elapsed)
  }

  // Get status color
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'assigned':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'accepted':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'verified':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Get status icon
  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'assigned':
        return <User className="w-4 h-4" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'in_progress':
        return <Play className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'verified':
        return <Star className="w-4 h-4" />
      case 'cancelled':
        return <Square className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  // Format time duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Refresh jobs manually
  const refreshJobs = async () => {
    setRefreshing(true)
    try {
      // Reload the subscription
      if (unsubscribe) {
        unsubscribe()
      }
      loadJobs()
      toast.success('Job status updated')
    } catch (error) {
      console.error('❌ Error refreshing jobs:', error)
      toast.error('Failed to refresh job status')
    } finally {
      setTimeout(() => setRefreshing(false), 1000)
    }
  }

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus
    const matchesSearch = !searchTerm ||
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.staffInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.propertyRef?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job as any).propertyName?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  // Calculate summary stats
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    active: jobs.filter(j => ['assigned', 'accepted', 'in_progress'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
    verified: jobs.filter(j => j.status === 'verified').length,
    withPhotos: jobs.filter(j => j.photoProofStatus.uploaded).length
  }

  // Setup real-time subscription on mount
  useEffect(() => {
    const unsubscribeFn = loadJobs()

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn()
      }
    }
  }, [loadJobs])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [unsubscribe])

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Stats */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                    Job Status Tracker
                  </CardTitle>
                  <p className="text-gray-400 mt-1">
                    Real-time monitoring of job progress across all staff members
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live Updates
                </Badge>
                <Button
                  onClick={refreshJobs}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.active}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.verified}</div>
                <div className="text-sm text-gray-400">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.withPhotos}</div>
                <div className="text-sm text-gray-400">With Photos</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-64">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, staff, or properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as JobStatus | 'all')}
                className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Job Cards */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Loading Job Status</h3>
              <p className="text-gray-400">Setting up real-time job monitoring...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-600/20 to-slate-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-3">No jobs found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : showAllJobs
                  ? 'No jobs have been assigned yet'
                  : 'No jobs found for this booking'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={cardHoverVariants.hover}
                  className="group"
                >
                  <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm h-full">
                    <CardContent className="p-6 h-full flex flex-col">
                      {/* Job Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getStatusIcon(job.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white truncate text-sm">
                              {job.title}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {job.propertyRef?.name || (job as any).propertyName || 'Unknown Property'}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(job.status)} text-xs flex-shrink-0`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Progress</span>
                          <span className="text-xs text-white font-medium">
                            {job.progressPercentage}%
                          </span>
                        </div>
                        <Progress
                          value={job.progressPercentage}
                          className="h-2 bg-gray-800"
                        />
                      </div>

                      {/* Staff Info */}
                      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/30 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={job.staffInfo.avatar} />
                          <AvatarFallback className="bg-indigo-500 text-white text-xs">
                            {job.staffInfo?.name?.split(' ').map(n => n[0]).join('') || 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {job.staffInfo?.name || 'Unknown Staff'}
                          </p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-400">
                              {job.staffInfo.rating?.toFixed(1) || '4.5'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                            onClick={() => window.open(`tel:${job.staffInfo.phone}`, '_self')}
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                            onClick={() => window.open(`mailto:${job.staffInfo.email}`, '_self')}
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled</span>
                          </div>
                          <span className="text-white">
                            {typeof job.scheduledDate === 'string' ? job.scheduledDate : formatLocalDate(job.scheduledDate)} {job.scheduledStartTime && `at ${job.scheduledStartTime}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Timer className="w-3 h-3" />
                            <span>Duration</span>
                          </div>
                          <span className="text-white">
                            {formatDuration(job.estimatedDuration || 120)}
                          </span>
                        </div>

                        {job.timeElapsed && job.timeElapsed > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>Elapsed</span>
                            </div>
                            <span className="text-white">
                              {formatDuration(job.timeElapsed)}
                            </span>
                          </div>
                        )}

                        {job.estimatedTimeRemaining && job.estimatedTimeRemaining > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-gray-400">
                              <TrendingUp className="w-3 h-3" />
                              <span>Remaining</span>
                            </div>
                            <span className="text-white">
                              {formatDuration(job.estimatedTimeRemaining)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Photo Proof Status */}
                      <div className="mb-4 p-3 bg-gray-800/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">Photo Proof</span>
                          </div>
                          <Badge className={
                            job.photoProofStatus.uploaded
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : job.photoProofStatus.required
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }>
                            {job.photoProofStatus.uploaded
                              ? `${job.photoProofStatus.count} Uploaded`
                              : job.photoProofStatus.required
                                ? 'Required'
                                : 'Not Required'
                            }
                          </Badge>
                        </div>

                        {job.photoProofStatus.uploaded && job.photoProofStatus.lastUploadedAt && (
                          <p className="text-xs text-gray-500">
                            Last uploaded: {formatLocalDateTime(job.photoProofStatus.lastUploadedAt)}
                          </p>
                        )}
                      </div>

                      {/* Last Activity */}
                      {job.lastActivity && (
                        <div className="mb-4 p-3 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-3 h-3 text-indigo-400" />
                            <span className="text-xs font-medium text-indigo-300">Last Activity</span>
                          </div>
                          <p className="text-xs text-gray-300">
                            {job.lastActivity.action.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatLocalDateTime(job.lastActivity.timestamp)}
                          </p>
                        </div>
                      )}

                      {/* Completion Info */}
                      {(job.status === 'completed' || job.status === 'verified') && job.completedAt && (
                        <div className="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-xs font-medium text-green-300">
                              {job.status === 'verified' ? 'Verified' : 'Completed'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">
                            {formatLocalDateTime(job.completedAt)}
                          </p>
                          {job.completionNotes && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {job.completionNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>

                        {job.photoProofStatus.uploaded && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 text-xs"
                            onClick={() => setPhotoGalleryJob(job)}
                          >
                            <Image className="w-3 h-3" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-xs"
                          onClick={() => setTimelineJob(job)}
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Photo Proof Gallery */}
      <PhotoProofGallery
        isOpen={!!photoGalleryJob}
        onClose={() => setPhotoGalleryJob(null)}
        job={photoGalleryJob}
      />

      {/* Job Timeline View - temporarily disabled */}
      {timelineJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Job Timeline</h3>
            <p className="text-gray-600 mb-4">Timeline view temporarily unavailable</p>
            <Button onClick={() => setTimelineJob(null)}>Close</Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
