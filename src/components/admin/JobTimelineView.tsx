'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { toast } from 'sonner'
import {
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Square,
  RotateCcw,
  MapPin,
  Camera,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Timer,
  Zap,
  Star,
  FileText,
  Image,
  Navigation,
  Activity,
  TrendingUp,
  BarChart3,
  Eye,
  Download,
  ExternalLink,
  X,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Loader2
} from 'lucide-react'
import { JobData, JobStatus } from '@/services/JobAssignmentService'
import { toDate, formatRelativeTime } from '@/utils/dateUtils'

interface JobTimelineViewProps {
  isOpen: boolean
  onClose: () => void
  job: JobData | null
  className?: string
}

interface TimelineEvent {
  id: string
  type: 'status_change' | 'photo_upload' | 'note_added' | 'location_update' | 'notification_sent' | 'system_event'
  timestamp: string
  title: string
  description: string
  actor: {
    name: string
    role: string
    avatar?: string
  }
  metadata?: {
    oldStatus?: JobStatus
    newStatus?: JobStatus
    location?: { latitude: number; longitude: number }
    photoCount?: number
    notificationType?: string
    systemAction?: string
  }
  icon: React.ReactNode
  color: string
}

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

const timelineVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const eventVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
}

export function JobTimelineView({ isOpen, onClose, job, className }: JobTimelineViewProps) {
  // State management
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Load timeline when job changes
  useEffect(() => {
    if (job && isOpen) {
      loadTimeline()
    }
  }, [job, isOpen])

  // Load job timeline
  const loadTimeline = async () => {
    if (!job) return

    try {
      setLoading(true)
      console.log(`📋 Loading timeline for job ${job.id}`)

      // Generate timeline events from job data
      const events: TimelineEvent[] = []

      // Job creation event
      events.push({
        id: 'job_created',
        type: 'system_event',
        timestamp: job.createdAt as string,
        title: 'Job Created',
        description: `Job "${job.title}" was created and assigned to ${job.assignedStaffRef?.name}`,
        actor: {
          name: (job as any).createdBy?.name || 'System',
          role: 'Admin',
          avatar: (job as any).createdBy?.avatar
        },
        metadata: {
          systemAction: 'job_creation'
        },
        icon: <FileText className="w-4 h-4" />,
        color: 'text-blue-400'
      })

      // Status history events
      if (job.statusHistory) {
        job.statusHistory.forEach((statusChange, index) => {
          const previousStatus = index > 0 ? job.statusHistory![index - 1].status : 'pending'
          
          events.push({
            id: `status_${index}`,
            type: 'status_change',
            timestamp: statusChange.timestamp as string,
            title: `Status Changed to ${statusChange.status.replace('_', ' ').toUpperCase()}`,
            description: statusChange.notes || `Job status updated from ${previousStatus} to ${statusChange.status}`,
            actor: {
              name: statusChange.updatedBy === 'mobile_app' ? job.assignedStaffRef?.name || 'Staff' : statusChange.updatedBy,
              role: statusChange.updatedBy === 'mobile_app' ? 'Staff' : 'Admin',
              avatar: statusChange.updatedBy === 'mobile_app' ? (job.assignedStaffRef as any)?.avatar : undefined
            },
            metadata: {
              oldStatus: previousStatus as JobStatus,
              newStatus: statusChange.status
            },
            icon: getStatusIcon(statusChange.status),
            color: getStatusColor(statusChange.status)
          })
        })
      }

      // Photo upload events
      if (job.completionPhotos && job.completionPhotos.length > 0) {
        job.completionPhotos.forEach((photo, index) => {
          events.push({
            id: `photo_${index}`,
            type: 'photo_upload',
            timestamp: (photo as any).uploadedAt || job.completedAt as string,
            title: 'Photo Proof Uploaded',
            description: `Photo "${(photo as any).filename || 'completion.jpg'}" was uploaded as completion proof`,
            actor: {
              name: job.assignedStaffRef?.name || 'Staff',
              role: 'Staff',
              avatar: (job.assignedStaffRef as any)?.avatar
            },
            metadata: {
              photoCount: 1
            },
            icon: <Camera className="w-4 h-4" />,
            color: 'text-green-400'
          })
        })
      }

      // Notification events
      if (job.notificationSent) {
        events.push({
          id: 'notification_sent',
          type: 'notification_sent',
          timestamp: job.lastNotificationAt as string || job.createdAt as string,
          title: 'Notification Sent',
          description: 'Push notification sent to staff member about job assignment',
          actor: {
            name: 'System',
            role: 'System'
          },
          metadata: {
            notificationType: 'job_assigned'
          },
          icon: <Zap className="w-4 h-4" />,
          color: 'text-yellow-400'
        })
      }

      // Location updates
      if ((job as any).lastKnownLocation) {
        events.push({
          id: 'location_update',
          type: 'location_update',
          timestamp: (job as any).lastKnownLocation.timestamp || job.updatedAt,
          title: 'Location Updated',
          description: 'Staff location was updated during job execution',
          actor: {
            name: job.assignedStaffRef?.name || 'Staff',
            role: 'Staff',
            avatar: (job.assignedStaffRef as any)?.avatar
          },
          metadata: {
            location: {
              latitude: (job as any).lastKnownLocation.latitude,
              longitude: (job as any).lastKnownLocation.longitude
            }
          },
          icon: <MapPin className="w-4 h-4" />,
          color: 'text-purple-400'
        })
      }

      // Sort events by timestamp
      events.sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime())

      setTimeline(events)
      console.log(`✅ Loaded ${events.length} timeline events`)

    } catch (error) {
      console.error('❌ Error loading timeline:', error)
      toast.error('Failed to load job timeline')
    } finally {
      setLoading(false)
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

  // Get status color
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400'
      case 'assigned':
        return 'text-blue-400'
      case 'accepted':
        return 'text-indigo-400'
      case 'in_progress':
        return 'text-purple-400'
      case 'completed':
        return 'text-green-400'
      case 'verified':
        return 'text-emerald-400'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  // Toggle event expansion
  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  // Filter timeline events
  const filteredTimeline = timeline.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.actor.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesSearch
  })

  // Use centralized formatRelativeTime from dateUtils
  const formatTimestamp = formatRelativeTime

  // Calculate job duration
  const calculateJobDuration = (): string => {
    if (!job) return '0m'

    const start = toDate(job.createdAt)
    const end = job.completedAt ? toDate(job.completedAt) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  if (!isOpen || !job) return null

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-hidden">
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full flex flex-col"
          >
            <DialogHeader className="border-b border-gray-700/50 pb-4 flex-shrink-0">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Job Timeline & History
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span>Job: <span className="text-white font-medium">{job.title}</span></span>
                  <span>Duration: <span className="text-white font-medium">{calculateJobDuration()}</span></span>
                  <Badge className={`${getStatusColor(job.status)} border-current/30`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Filters */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-700/30 flex-shrink-0">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search timeline events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Events</option>
                  <option value="status_change">Status Changes</option>
                  <option value="photo_upload">Photo Uploads</option>
                  <option value="notification_sent">Notifications</option>
                  <option value="location_update">Location Updates</option>
                  <option value="system_event">System Events</option>
                </select>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <span className="ml-3 text-gray-400">Loading timeline...</span>
                  </div>
                ) : filteredTimeline.length === 0 ? (
                  <div className="text-center py-16">
                    <Activity className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Timeline Events</h3>
                    <p className="text-gray-500">
                      {searchTerm || filterType !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No timeline events found for this job'
                      }
                    </p>
                  </div>
                ) : (
                  <motion.div
                    variants={timelineVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative"
                  >
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-green-500"></div>
                    
                    <div className="space-y-6">
                      <AnimatePresence>
                        {filteredTimeline.map((event, index) => (
                          <motion.div
                            key={event.id}
                            variants={eventVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="relative flex items-start gap-4"
                          >
                            {/* Timeline dot */}
                            <div className={`relative z-10 w-12 h-12 rounded-full bg-gray-900 border-2 border-current ${event.color} flex items-center justify-center flex-shrink-0`}>
                              {event.icon}
                            </div>
                            
                            {/* Event content */}
                            <Card className="flex-1 bg-gray-800/50 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-semibold text-white">{event.title}</h4>
                                    <Badge className={`${event.color} border-current/30 text-xs`}>
                                      {event.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {formatTimestamp(event.timestamp)}
                                  </div>
                                </div>
                                
                                <p className="text-gray-300 text-sm mb-3">{event.description}</p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={event.actor.avatar} />
                                      <AvatarFallback className="bg-indigo-500 text-white text-xs">
                                        {event.actor.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-400">
                                      {event.actor.name} ({event.actor.role})
                                    </span>
                                  </div>
                                  
                                  {event.metadata && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => toggleEventExpansion(event.id)}
                                      className="text-gray-400 hover:text-white p-1"
                                    >
                                      {expandedEvents.has(event.id) ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Expanded metadata */}
                                <AnimatePresence>
                                  {expandedEvents.has(event.id) && event.metadata && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-3 pt-3 border-t border-gray-700/30"
                                    >
                                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                                        {event.metadata.oldStatus && event.metadata.newStatus && (
                                          <>
                                            <div>Previous Status: <span className="text-white">{event.metadata.oldStatus}</span></div>
                                            <div>New Status: <span className="text-white">{event.metadata.newStatus}</span></div>
                                          </>
                                        )}
                                        {event.metadata.location && (
                                          <>
                                            <div>Latitude: <span className="text-white">{event.metadata.location.latitude.toFixed(6)}</span></div>
                                            <div>Longitude: <span className="text-white">{event.metadata.location.longitude.toFixed(6)}</span></div>
                                          </>
                                        )}
                                        {event.metadata.photoCount && (
                                          <div>Photos: <span className="text-white">{event.metadata.photoCount}</span></div>
                                        )}
                                        {event.metadata.notificationType && (
                                          <div>Type: <span className="text-white">{event.metadata.notificationType}</span></div>
                                        )}
                                        {event.metadata.systemAction && (
                                          <div>Action: <span className="text-white">{event.metadata.systemAction}</span></div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-gray-700/50 p-4 flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-gray-400">
                  {filteredTimeline.length} events shown
                </div>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}
