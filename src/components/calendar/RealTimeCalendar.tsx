'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import useRealTimeCalendar from '@/hooks/useRealTimeCalendar'
import { CalendarEvent, ConflictAlert } from '@/services/RealTimeCalendarService'
import {
    AlertTriangle,
    Calendar,
    Clock,
    Home,
    RefreshCw,
    Users,
    Wifi,
    WifiOff
} from 'lucide-react'
import { useMemo, useState } from 'react'

/**
 * 🔄 Real-Time Calendar Component
 *
 * Live calendar with real-time updates, conflict alerts, and multi-user sync
 */

interface RealTimeCalendarProps {
  propertyName?: string
  dateRange?: { start: string; end: string }
  eventTypes?: string[]
  showConflicts?: boolean
  className?: string
}

export default function RealTimeCalendar({
  propertyName,
  dateRange,
  eventTypes,
  showConflicts = true,
  className = ''
}: RealTimeCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showConflictDetails, setShowConflictDetails] = useState(false)

  const {
    events,
    conflicts,
    isConnected,
    isReconnecting,
    lastUpdate,
    connectionError,
    reconnect
  } = useRealTimeCalendar({
    propertyName,
    dateRange,
    eventTypes,
    includeConflicts: showConflicts
  })

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}

    events.forEach(event => {
      const date = new Date(event.startDate).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(event)
    })

    // Sort events within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
    })

    return grouped
  }, [events])

  // Get event type icon
  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'booking': return '🏨'
      case 'job': return '🔧'
      case 'maintenance': return '⚙️'
      case 'blocked': return '🚫'
      default: return '📅'
    }
  }

  // Get conflict severity color
  const getConflictColor = (severity: ConflictAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'high': return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      case 'low': return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Real-Time Calendar
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge className="bg-green-500/20 border-green-500/30 text-green-400">
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : isReconnecting ? (
                <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Reconnecting
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 border-red-500/30 text-red-400">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {events.length} events
              </span>
              {showConflicts && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {conflicts.length} conflicts
                </span>
              )}
              {lastUpdate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            {connectionError && (
              <Button
                onClick={reconnect}
                size="sm"
                variant="outline"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Alerts */}
      {showConflicts && conflicts.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Conflict Alerts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.slice(0, 3).map((conflict) => (
              <Alert key={conflict.id} className={getConflictColor(conflict.severity)}>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{conflict.type.replace('_', ' ').toUpperCase()}</strong>
                      <span className="ml-2">at {conflict.affectedProperty}</span>
                      <div className="text-xs mt-1 opacity-75">
                        {conflict.suggestedResolution}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {conflict.severity}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            {conflicts.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConflictDetails(!showConflictDetails)}
                className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                {showConflictDetails ? 'Hide' : 'Show'} {conflicts.length - 3} more conflicts
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar Events */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Calendar Events</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(eventsByDate).length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
              {propertyName && <p className="text-sm">for {propertyName}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(eventsByDate)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, dayEvents]) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-neutral-700 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedEvent(event)}
                          style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getEventIcon(event)}</span>
                            <div>
                              <div className="font-medium text-white">{event.title}</div>
                              <div className="text-sm text-neutral-400">
                                {formatTime(event.startDate)} - {formatTime(event.endDate)}
                                {event.assignedStaff && (
                                  <span className="ml-2 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {event.assignedStaff}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ color: event.color, borderColor: event.color }}
                            >
                              {event.status}
                            </Badge>
                            {event.propertyName && (
                              <Badge variant="outline" className="text-xs text-neutral-400">
                                <Home className="w-3 h-3 mr-1" />
                                {event.propertyName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>Event Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Title:</span>
                <div className="text-white font-medium">{selectedEvent.title}</div>
              </div>
              <div>
                <span className="text-neutral-400">Type:</span>
                <div className="text-white">{selectedEvent.type}</div>
              </div>
              <div>
                <span className="text-neutral-400">Start:</span>
                <div className="text-white">{new Date(selectedEvent.startDate).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-neutral-400">End:</span>
                <div className="text-white">{new Date(selectedEvent.endDate).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-neutral-400">Property:</span>
                <div className="text-white">{selectedEvent.propertyName}</div>
              </div>
              <div>
                <span className="text-neutral-400">Status:</span>
                <div className="text-white">{selectedEvent.status}</div>
              </div>
            </div>
            {selectedEvent.description && (
              <div>
                <span className="text-neutral-400">Description:</span>
                <div className="text-white mt-1">{selectedEvent.description}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
