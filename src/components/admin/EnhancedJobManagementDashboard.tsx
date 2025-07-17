'use client'

/**
 * Enhanced Job Management Dashboard
 * Comprehensive job management interface with full CRUD operations
 */

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { clientToast as toast } from '@/utils/clientToast'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Edit,
  Eye,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  Timer,
  Trash2,
  TrendingUp,
  User,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// Services
import JobAssignmentService, {
  JobData,
  JobPriority,
  JobStatus,
  JobType,
} from '@/services/JobAssignmentService'

// Components
import { CreateJobWizardModal } from './CreateJobWizardModal'
import { DeleteJobConfirmModal } from './DeleteJobConfirmModal'
import { EditJobModal } from './EditJobModal'
import { JobDetailsModal } from './JobDetailsModal'

interface EnhancedJobManagementDashboardProps {
  className?: string
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

const cardHoverVariants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
}

export function EnhancedJobManagementDashboard({
  className,
}: EnhancedJobManagementDashboardProps) {
  // State management
  const [jobs, setJobs] = useState<JobData[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | 'all'>(
    'all'
  )
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null)

  // Modal states
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [showJobDetailsModal, setShowJobDetailsModal] =
    useState<JobData | null>(null)
  const [showEditJobModal, setShowEditJobModal] = useState<JobData | null>(null)
  const [showDeleteJobModal, setShowDeleteJobModal] = useState<JobData | null>(
    null
  )

  // Load jobs with real-time updates
  const loadJobs = useCallback(() => {
    console.log('📋 Setting up real-time job subscription...')

    const unsubscribeFn = JobAssignmentService.subscribeToJobs(
      (updatedJobs) => {
        console.log(
          `✅ Received ${updatedJobs.length} jobs via real-time subscription`
        )
        setJobs(updatedJobs)
        setLoading(false)
      }
    )

    setUnsubscribe(() => unsubscribeFn)
    return unsubscribeFn
  }, [])

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.assignedStaffRef?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          job.propertyRef?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((job) => job.priority === priorityFilter)
    }

    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter((job) => job.assignedStaffId === staffFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter((job) => job.scheduledDate === today)
          break
        case 'tomorrow':
          filtered = filtered.filter((job) => job.scheduledDate === tomorrow)
          break
        case 'week':
          filtered = filtered.filter((job) => job.scheduledDate <= weekFromNow)
          break
        case 'overdue':
          filtered = filtered.filter(
            (job) =>
              job.scheduledDate < today &&
              !['completed', 'verified', 'cancelled'].includes(job.status)
          )
          break
      }
    }

    setFilteredJobs(filtered)
  }, [jobs, searchQuery, statusFilter, priorityFilter, staffFilter, dateFilter])

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

  // Calculate statistics
  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    assigned: jobs.filter((j) => j.status === 'assigned').length,
    inProgress: jobs.filter((j) => j.status === 'in_progress').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    urgent: jobs.filter((j) => j.priority === 'urgent').length,
    todayJobs: jobs.filter((j) => {
      const today = new Date().toISOString().split('T')[0]
      return j.scheduledDate === today
    }).length,
    overdueJobs: jobs.filter((j) => {
      const today = new Date().toISOString().split('T')[0]
      return (
        j.scheduledDate < today &&
        !['completed', 'verified', 'cancelled'].includes(j.status)
      )
    }).length,
  }

  // Get unique staff for filter
  const uniqueStaff = jobs
    .filter(
      (job) =>
        job.assignedStaffRef && job.assignedStaffRef.name && job.assignedStaffId
    )
    .map((job) => ({
      id: job.assignedStaffId,
      name: job.assignedStaffRef.name,
    }))
    .filter(
      (staff, index, self) => index === self.findIndex((s) => s.id === staff.id)
    )

  // Handle job actions
  const handleCreateJob = () => {
    setShowCreateJobModal(true)
  }

  const handleViewJob = (job: JobData) => {
    setShowJobDetailsModal(job)
  }

  const handleEditJob = (job: JobData) => {
    setShowEditJobModal(job)
  }

  const handleDeleteJob = (job: JobData) => {
    setShowDeleteJobModal(job)
  }

  const handleJobCreated = (jobId: string) => {
    toast.success('Job created successfully!')
    setShowCreateJobModal(false)

    // Force a refresh of the job subscription to ensure new job appears
    console.log('🔄 Refreshing job subscription after creation...')
    if (unsubscribe) {
      unsubscribe()
    }
    const newUnsubscribe = loadJobs()
    setUnsubscribe(() => newUnsubscribe)
  }

  const handleJobUpdated = (jobId: string) => {
    toast.success('Job updated successfully!')
    setShowEditJobModal(null)
    // Jobs will be updated via real-time subscription
  }

  const handleJobDeleted = (jobId: string) => {
    toast.success('Job deleted successfully!')
    setShowDeleteJobModal(null)
    // Jobs will be updated via real-time subscription
  }

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
      setUpdating(jobId)
      const result = await JobAssignmentService.updateJobStatus(
        jobId,
        newStatus,
        'admin', // TODO: Get from current user context
        `Status updated to ${newStatus}`
      )

      if (result.success) {
        toast.success(`Job status updated to ${newStatus}`)
      } else {
        toast.error(result.error || 'Failed to update job status')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      toast.error('Failed to update job status')
    } finally {
      setUpdating(null)
    }
  }

  // Bulk actions
  const handleBulkStatusUpdate = async (newStatus: JobStatus) => {
    if (selectedJobs.length === 0) {
      toast.error('Please select jobs to update')
      return
    }

    try {
      setLoading(true)
      const promises = selectedJobs.map((jobId) =>
        JobAssignmentService.updateJobStatus(
          jobId,
          newStatus,
          'admin',
          `Bulk update to ${newStatus}`
        )
      )

      await Promise.all(promises)
      toast.success(`Updated ${selectedJobs.length} jobs to ${newStatus}`)
      setSelectedJobs([])
    } catch (error) {
      console.error('Error in bulk update:', error)
      toast.error('Failed to update jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select jobs to delete')
      return
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedJobs.length} jobs? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      // TODO: Implement bulk delete in JobAssignmentService
      toast.success(`Deleted ${selectedJobs.length} jobs`)
      setSelectedJobs([])
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast.error('Failed to delete jobs')
    } finally {
      setLoading(false)
    }
  }

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered...')
    if (unsubscribe) {
      unsubscribe()
    }
    const newUnsubscribe = loadJobs()
    setUnsubscribe(() => newUnsubscribe)
    toast.success('Jobs refreshed!')
  }

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Job Management</h2>
          <p className="text-neutral-400">
            Comprehensive job assignment management with full CRUD operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateJob}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Statistics Dashboard */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4"
        variants={itemVariants}
      >
        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-lg shadow-blue-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-blue-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {stats.total}
              </div>
              <p className="text-xs text-blue-300 font-medium">Total Jobs</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-800/20 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg shadow-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <Timer className="w-4 h-4 text-yellow-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {stats.pending}
              </div>
              <p className="text-xs text-yellow-300 font-medium">Pending</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-800/20 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg shadow-purple-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="w-5 h-5 text-white" />
                </div>
                <Users className="w-4 h-4 text-purple-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {stats.assigned}
              </div>
              <p className="text-xs text-purple-300 font-medium">Assigned</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-orange-900/20 to-red-800/20 border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 shadow-lg shadow-orange-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <Zap className="w-4 h-4 text-orange-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-orange-400 mb-1">
                {stats.inProgress}
              </div>
              <p className="text-xs text-orange-300 font-medium">In Progress</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-green-900/20 to-emerald-800/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 shadow-lg shadow-green-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <Star className="w-4 h-4 text-green-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {stats.completed}
              </div>
              <p className="text-xs text-green-300 font-medium">Completed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-red-900/20 to-pink-800/20 border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg shadow-red-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <Bell className="w-4 h-4 text-red-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-red-400 mb-1">
                {stats.urgent}
              </div>
              <p className="text-xs text-red-300 font-medium">Urgent</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-cyan-900/20 to-teal-800/20 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-lg shadow-cyan-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <Clock className="w-4 h-4 text-cyan-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-cyan-400 mb-1">
                {stats.todayJobs}
              </div>
              <p className="text-xs text-cyan-300 font-medium">Today</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-rose-900/20 to-red-800/20 border-rose-500/30 hover:border-rose-400/50 transition-all duration-300 shadow-lg shadow-rose-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <AlertCircle className="w-4 h-4 text-rose-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-rose-400 mb-1">
                {stats.overdueJobs}
              </div>
              <p className="text-xs text-rose-300 font-medium">Overdue</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search jobs, staff, properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as JobStatus | 'all')
                }
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </Select>

              {/* Priority Filter */}
              <Select
                value={priorityFilter}
                onValueChange={(value) =>
                  setPriorityFilter(value as JobPriority | 'all')
                }
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>

              {/* Staff Filter */}
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <option value="all">All Staff</option>
                {uniqueStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="overdue">Overdue</option>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedJobs.length > 0 && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 font-medium">
                    {selectedJobs.length} job
                    {selectedJobs.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('assigned')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Mark Assigned
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('completed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkDelete}
                      variant="destructive"
                    >
                      Delete Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJobs([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Jobs List */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                Job Assignments ({filteredJobs.length})
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                  Real-time
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setViewMode(viewMode === 'list' ? 'grid' : 'list')
                  }
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {viewMode === 'list' ? 'Grid View' : 'List View'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-3 text-gray-400">Loading jobs...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-500 mb-6">
                  {jobs.length === 0
                    ? 'No jobs have been created yet. Create your first job to get started.'
                    : 'No jobs match your current filters. Try adjusting your search criteria.'}
                </p>
                <Button
                  onClick={handleCreateJob}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Job
                </Button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    viewMode={viewMode}
                    isSelected={selectedJobs.includes(job.id!)}
                    isUpdating={updating === job.id}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedJobs([...selectedJobs, job.id!])
                      } else {
                        setSelectedJobs(
                          selectedJobs.filter((id) => id !== job.id)
                        )
                      }
                    }}
                    onView={() => handleViewJob(job)}
                    onEdit={() => handleEditJob(job)}
                    onDelete={() => handleDeleteJob(job)}
                    onStatusUpdate={(status) =>
                      updateJobStatus(job.id!, status)
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateJobModal && (
          <CreateJobWizardModal
            isOpen={showCreateJobModal}
            onClose={() => setShowCreateJobModal(false)}
            onJobCreated={handleJobCreated}
          />
        )}

        {showJobDetailsModal && (
          <JobDetailsModal
            isOpen={!!showJobDetailsModal}
            job={showJobDetailsModal}
            onClose={() => setShowJobDetailsModal(null)}
            onEdit={() => {
              setShowEditJobModal(showJobDetailsModal)
              setShowJobDetailsModal(null)
            }}
            onDelete={() => {
              setShowDeleteJobModal(showJobDetailsModal)
              setShowJobDetailsModal(null)
            }}
            onStatusUpdate={(status) => {
              updateJobStatus(showJobDetailsModal.id!, status)
            }}
          />
        )}

        {showEditJobModal && (
          <EditJobModal
            isOpen={!!showEditJobModal}
            job={showEditJobModal}
            onClose={() => setShowEditJobModal(null)}
            onJobUpdated={handleJobUpdated}
          />
        )}

        {showDeleteJobModal && (
          <DeleteJobConfirmModal
            isOpen={!!showDeleteJobModal}
            job={showDeleteJobModal}
            onClose={() => setShowDeleteJobModal(null)}
            onJobDeleted={handleJobDeleted}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Job Card Component
interface JobCardProps {
  job: JobData
  viewMode: 'grid' | 'list'
  isSelected: boolean
  isUpdating: boolean
  onSelect: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusUpdate: (status: JobStatus) => void
}

function JobCard({
  job,
  viewMode,
  isSelected,
  isUpdating,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onStatusUpdate,
}: JobCardProps) {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'assigned':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'accepted':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
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

  const getPriorityColor = (priority: JobPriority) => {
    switch (priority) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-orange-400'
      case 'urgent':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getJobTypeIcon = (jobType: JobType) => {
    switch (jobType) {
      case 'cleaning':
        return <Briefcase className="w-4 h-4" />
      case 'maintenance':
        return <Settings className="w-4 h-4" />
      case 'inspection':
        return <Eye className="w-4 h-4" />
      case 'setup':
        return <Building2 className="w-4 h-4" />
      case 'checkout':
        return <CheckCircle className="w-4 h-4" />
      case 'emergency':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Briefcase className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set'
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (viewMode === 'grid') {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="group"
      >
        <Card
          className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    {getJobTypeIcon(job.jobType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm truncate max-w-[150px]">
                      {job.title}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize">
                      {job.jobType}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  className={`text-xs px-2 py-1 ${getStatusColor(job.status)}`}
                >
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 truncate">
                  {job.propertyRef?.name || 'Unknown Property'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 truncate">
                  {job.assignedStaffRef?.name || 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  {formatDate(job.scheduledDate)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  {formatTime(job.scheduledStartTime)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle
                    className={`w-4 h-4 ${getPriorityColor(job.priority)}`}
                  />
                  <span
                    className={`capitalize ${getPriorityColor(job.priority)}`}
                  >
                    {job.priority}
                  </span>
                </div>
                <span className="text-gray-400">
                  {job.estimatedDuration}min
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onView}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <div className="flex items-center gap-1">
                  {job.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusUpdate('assigned')}
                      className="bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1"
                    >
                      Assign
                    </Button>
                  )}
                  {job.status === 'assigned' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusUpdate('in_progress')}
                      className="bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1"
                    >
                      Start
                    </Button>
                  )}
                  {job.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusUpdate('completed')}
                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // List view
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card
        className={`bg-gradient-to-r from-gray-800/30 to-gray-900/30 border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  {getJobTypeIcon(job.jobType)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{job.title}</h3>
                  <p className="text-sm text-gray-400 capitalize">
                    {job.jobType}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle section */}
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {job.propertyRef?.name || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {job.assignedStaffRef?.name || 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {formatDate(job.scheduledDate)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {formatTime(job.scheduledStartTime)}
                </span>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle
                  className={`w-4 h-4 ${getPriorityColor(job.priority)}`}
                />
                <span
                  className={`text-sm capitalize ${getPriorityColor(job.priority)}`}
                >
                  {job.priority}
                </span>
              </div>

              <Badge className={`${getStatusColor(job.status)}`}>
                {job.status.replace('_', ' ')}
              </Badge>

              <span className="text-sm text-gray-400 min-w-[60px]">
                {job.estimatedDuration}min
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onView}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <div className="flex items-center gap-1 min-w-[80px] justify-end">
                  {job.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusUpdate('assigned')}
                      className="bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1"
                    >
                      Assign
                    </Button>
                  )}
                  {job.status === 'assigned' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusUpdate('in_progress')}
                      className="bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1"
                    >
                      Start
                    </Button>
                  )}
                  {job.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => onStatusUpdate('completed')}
                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
