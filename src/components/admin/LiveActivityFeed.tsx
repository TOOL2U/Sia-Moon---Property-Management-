'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Star,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface ActivityEvent {
  id: string
  type:
    | 'staff_checkin'
    | 'staff_checkout'
    | 'task_started'
    | 'task_completed'
    | 'guest_arrival'
    | 'guest_departure'
    | 'emergency_alert'
    | 'maintenance_request'
    | 'guest_feedback'
    | 'system_notification'
  title: string
  description: string
  timestamp: Date
  staffId?: string
  staffName?: string
  propertyId?: string
  propertyName?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  metadata?: {
    guestName?: string
    rating?: number
    taskType?: string
    alertType?: string
    location?: string
  }
}

interface LiveActivityFeedProps {
  isFullScreen?: boolean
  maxItems?: number
}

export default function LiveActivityFeed({
  isFullScreen = false,
  maxItems = 50,
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<
    'all' | 'staff' | 'guests' | 'tasks' | 'alerts'
  >('all')

  // Mock real-time activity data - replace with real Firebase/WebSocket data
  useEffect(() => {
    const generateMockActivity = (): ActivityEvent => {
      const types: ActivityEvent['type'][] = [
        'staff_checkin',
        'staff_checkout',
        'task_started',
        'task_completed',
        'guest_arrival',
        'guest_departure',
        'emergency_alert',
        'maintenance_request',
        'guest_feedback',
        'system_notification',
      ]

      const staffNames = [
        'Maria Santos',
        'Carlos Rodriguez',
        'Ana Silva',
        'James Wilson',
      ]
      const propertyNames = [
        'Villa Sunset Paradise',
        'Ocean View Villa',
        'Mountain Retreat',
        'Beachfront Luxury',
      ]
      const guestNames = [
        'John Smith',
        'Sarah Johnson',
        'Michael Brown',
        'Emma Davis',
      ]

      const type = types[Math.floor(Math.random() * types.length)]
      const staffName =
        staffNames[Math.floor(Math.random() * staffNames.length)]
      const propertyName =
        propertyNames[Math.floor(Math.random() * propertyNames.length)]
      const guestName =
        guestNames[Math.floor(Math.random() * guestNames.length)]

      const baseActivity: Partial<ActivityEvent> = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        timestamp: new Date(),
        staffName,
        propertyName,
      }

      switch (type) {
        case 'staff_checkin':
          return {
            ...baseActivity,
            title: `${staffName} checked in`,
            description: `Started shift at ${propertyName}`,
            priority: 'low',
            status: 'completed',
          } as ActivityEvent

        case 'staff_checkout':
          return {
            ...baseActivity,
            title: `${staffName} checked out`,
            description: `Completed shift at ${propertyName}`,
            priority: 'low',
            status: 'completed',
          } as ActivityEvent

        case 'task_started':
          return {
            ...baseActivity,
            title: `Task started`,
            description: `${staffName} began cleaning at ${propertyName}`,
            priority: 'medium',
            status: 'in_progress',
            metadata: { taskType: 'cleaning' },
          } as ActivityEvent

        case 'task_completed':
          return {
            ...baseActivity,
            title: `Task completed`,
            description: `${staffName} finished maintenance at ${propertyName}`,
            priority: 'medium',
            status: 'completed',
            metadata: { taskType: 'maintenance' },
          } as ActivityEvent

        case 'guest_arrival':
          return {
            ...baseActivity,
            title: `Guest arrival`,
            description: `${guestName} checked in to ${propertyName}`,
            priority: 'high',
            status: 'completed',
            metadata: { guestName },
          } as ActivityEvent

        case 'guest_departure':
          return {
            ...baseActivity,
            title: `Guest departure`,
            description: `${guestName} checked out from ${propertyName}`,
            priority: 'medium',
            status: 'completed',
            metadata: { guestName },
          } as ActivityEvent

        case 'emergency_alert':
          return {
            ...baseActivity,
            title: `Emergency Alert`,
            description: `Urgent maintenance required at ${propertyName}`,
            priority: 'critical',
            status: 'pending',
            metadata: { alertType: 'maintenance' },
          } as ActivityEvent

        case 'maintenance_request':
          return {
            ...baseActivity,
            title: `Maintenance Request`,
            description: `Pool cleaning scheduled for ${propertyName}`,
            priority: 'medium',
            status: 'pending',
            metadata: { taskType: 'pool_maintenance' },
          } as ActivityEvent

        case 'guest_feedback':
          return {
            ...baseActivity,
            title: `Guest Feedback`,
            description: `${guestName} rated stay at ${propertyName}`,
            priority: 'low',
            status: 'completed',
            metadata: { guestName, rating: Math.floor(Math.random() * 2) + 4 }, // 4-5 stars
          } as ActivityEvent

        default:
          return {
            ...baseActivity,
            title: `System Notification`,
            description: `Automated backup completed successfully`,
            priority: 'low',
            status: 'completed',
          } as ActivityEvent
      }
    }

    // Initial mock data
    const initialActivities: ActivityEvent[] = Array.from({ length: 10 }, () =>
      generateMockActivity()
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setActivities(initialActivities)

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newActivity = generateMockActivity()
      setActivities((prev) => [newActivity, ...prev].slice(0, maxItems))
    }, 15000) // New activity every 15 seconds

    return () => clearInterval(interval)
  }, [maxItems])

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'staff_checkin':
      case 'staff_checkout':
        return <Users className="w-4 h-4" />
      case 'task_started':
      case 'task_completed':
        return <CheckCircle className="w-4 h-4" />
      case 'guest_arrival':
      case 'guest_departure':
        return <User className="w-4 h-4" />
      case 'emergency_alert':
        return <AlertTriangle className="w-4 h-4" />
      case 'maintenance_request':
        return <Wrench className="w-4 h-4" />
      case 'guest_feedback':
        return <Star className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: ActivityEvent['type'], priority?: string) => {
    if (priority === 'critical') return 'text-red-400'
    if (priority === 'high') return 'text-orange-400'

    switch (type) {
      case 'staff_checkin':
      case 'staff_checkout':
        return 'text-green-400'
      case 'task_completed':
        return 'text-blue-400'
      case 'guest_arrival':
      case 'guest_departure':
        return 'text-purple-400'
      case 'emergency_alert':
        return 'text-red-400'
      case 'maintenance_request':
        return 'text-yellow-400'
      case 'guest_feedback':
        return 'text-pink-400'
      default:
        return 'text-gray-400'
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-600 text-white text-xs">Critical</Badge>
      case 'high':
        return <Badge className="bg-orange-600 text-white text-xs">High</Badge>
      case 'medium':
        return (
          <Badge className="bg-yellow-600 text-white text-xs">Medium</Badge>
        )
      case 'low':
        return <Badge className="bg-gray-600 text-white text-xs">Low</Badge>
      default:
        return null
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return timestamp.toLocaleDateString()
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true
    if (filter === 'staff')
      return ['staff_checkin', 'staff_checkout'].includes(activity.type)
    if (filter === 'guests')
      return ['guest_arrival', 'guest_departure', 'guest_feedback'].includes(
        activity.type
      )
    if (filter === 'tasks')
      return ['task_started', 'task_completed', 'maintenance_request'].includes(
        activity.type
      )
    if (filter === 'alerts')
      return ['emergency_alert', 'system_notification'].includes(activity.type)
    return true
  })

  return (
    <Card className="bg-gray-800 border-gray-700 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            Live Activity Feed
            {isLoading && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </CardTitle>
          <div className="flex gap-1">
            {(['all', 'staff', 'guests', 'tasks', 'alerts'] as const).map(
              (filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className={`text-xs px-2 py-1 h-6 ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto">
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div
                    className={`mt-0.5 ${getActivityColor(activity.type, activity.priority)}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getPriorityBadge(activity.priority)}
                        <span className="text-gray-400 text-xs">
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                    {activity.metadata?.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from(
                          { length: activity.metadata.rating },
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 text-yellow-400 fill-current"
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No activities found</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
