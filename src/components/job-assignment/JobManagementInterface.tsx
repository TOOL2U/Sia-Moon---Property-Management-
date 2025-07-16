/**
 * Advanced Job Management Interface
 * Comprehensive job assignment management with CRUD operations and workflow
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Timer,
  DollarSign
} from 'lucide-react'
import {
  JobAssignment,
  JobStatus,
  JobCategory,
  JobPriority,
  JobFilters,
  JobAnalytics
} from '@/types/enhancedJobAssignment'
import { EnhancedJobAssignmentService } from '@/lib/services/enhancedJobAssignmentService'

interface JobManagementInterfaceProps {
  onCreateJob?: () => void
  onEditJob?: (job: JobAssignment) => void
  onViewJob?: (job: JobAssignment) => void
}

export default function JobManagementInterface({
  onCreateJob,
  onEditJob,
  onViewJob
}: JobManagementInterfaceProps) {
  const [jobs, setJobs] = useState<JobAssignment[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobAssignment[]>([])
  const [analytics, setAnalytics] = useState<JobAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<JobFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Load jobs and analytics
  useEffect(() => {
    loadJobs()
  }, [filters])

  // Filter jobs based on search query
  useEffect(() => {
    let filtered = jobs

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.assignedStaffNames.some(name =>
          name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    setFilteredJobs(filtered)
  }, [jobs, searchQuery])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const response = await EnhancedJobAssignmentService.getJobAssignments(filters)

      if (response.success) {
        setJobs(response.data || [])
        setAnalytics(response.stats || null)
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'assigned': return <User className="w-4 h-4" />
      case 'in_progress': return <Play className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'verified': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: JobStatus): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'in_progress': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'paused': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
      case 'verified': return 'bg-teal-500/20 text-teal-400 border-teal-500/50'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'overdue': return 'bg-red-600/20 text-red-300 border-red-600/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getPriorityColor = (priority: JobPriority): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getCategoryIcon = (category: JobCategory) => {
    // Add category-specific icons here
    return <MapPin className="w-4 h-4" />
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      await EnhancedJobAssignmentService.updateJobAssignment(jobId, { status: newStatus })
      loadJobs() // Reload to get updated data
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) return

    try {
      // Implement bulk actions here
      console.log(`Performing ${action} on jobs:`, selectedJobs)
      setSelectedJobs([])
      loadJobs()
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    )
  }

  const selectAllJobs = () => {
    setSelectedJobs(
      selectedJobs.length === filteredJobs.length
        ? []
        : filteredJobs.map(job => job.id)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Analytics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Job Management</h2>
          <p className="text-gray-400">Comprehensive job assignment and workflow management</p>
        </div>
        <Button onClick={onCreateJob} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalJobs}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.completedJobs}</p>
                  <p className="text-xs text-gray-500">{analytics.completionRate.toFixed(1)}% rate</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-400">{analytics.overdueJobs}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg. Time</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(analytics.averageCompletionTime)}
                  </p>
                </div>
                <Timer className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search jobs, properties, or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filters.status?.[0] || 'all'}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? undefined : [value as JobStatus]
                  }))
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={filters.priority?.[0] || 'all'}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    priority: value === 'all' ? undefined : [value as JobPriority]
                  }))
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.category?.[0] || 'all'}
                onChange={(e) => {
                  const value = e.target.value
                  setFilters(prev => ({
                    ...prev,
                    category: value === 'all' ? undefined : [value as JobCategory]
                  }))
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
                <option value="security">Security</option>
                <option value="landscaping">Landscaping</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedJobs.length > 0 && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-400">
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('assign')}
                    className="border-blue-500 text-blue-400"
                  >
                    Bulk Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('complete')}
                    className="border-green-500 text-green-400"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedJobs([])}
                    className="border-gray-500 text-gray-400"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              Job Assignments ({filteredJobs.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllJobs}
                className="border-gray-600"
              >
                {selectedJobs.length === filteredJobs.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-2 text-gray-400">Loading jobs...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-sm">
                {searchQuery || Object.keys(filters).some(key => filters[key as keyof JobFilters])
                  ? 'Try adjusting your search or filters'
                  : 'Create your first job assignment to get started'
                }
              </p>
              {!searchQuery && !Object.keys(filters).some(key => filters[key as keyof JobFilters]) && (
                <Button onClick={onCreateJob} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedJobs.includes(job.id)
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={() => toggleJobSelection(job.id)}
                        className="mt-1 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(job.status)}
                          <h3 className="font-medium text-white truncate">{job.title}</h3>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                          {job.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewJob?.(job)}
                        className="p-1 h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditJob?.(job)}
                        className="p-1 h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-3">
                    {/* Status and Priority */}
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(job.priority)}>
                        {job.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryIcon(job.category)}
                        <span className="ml-1">{job.category}</span>
                      </Badge>
                    </div>

                    {/* Property and Staff */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{job.propertyName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="w-4 h-4" />
                        <span className="truncate">
                          {job.assignedStaffNames.length > 0
                            ? job.assignedStaffNames.join(', ')
                            : 'Unassigned'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Timing and Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(job.scheduledStartDate).toLocaleDateString()}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{job.scheduledStartTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Timer className="w-4 h-4" />
                          <span>{formatDuration(job.estimatedDuration)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {job.status === 'in_progress' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Progress</span>
                            <span>{job.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-600">
                      {job.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(job.id, 'assigned')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Assign
                        </Button>
                      )}
                      {job.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(job.id, 'in_progress')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {job.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(job.id, 'paused')}
                            variant="outline"
                            className="flex-1 border-orange-500 text-orange-400"
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(job.id, 'completed')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        </>
                      )}
                      {job.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(job.id, 'verified')}
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}