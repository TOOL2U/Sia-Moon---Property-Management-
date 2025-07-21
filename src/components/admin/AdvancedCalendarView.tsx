'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { db } from '@/lib/firebase'
import { CALENDAR_EVENT_TYPES, type CalendarViewType, type EnhancedCalendarEvent } from '@/services/CalendarEventService'
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore'
import {
    AlertTriangle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Home,
    RefreshCw,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface CalendarViewProps {
  initialView?: CalendarViewType
  propertyFilter?: string[]
  staffFilter?: string[]
}

export default function AdvancedCalendarView({
  initialView = 'week',
  propertyFilter = [],
  staffFilter = []
}: CalendarViewProps) {
  const [currentView, setCurrentView] = useState<CalendarViewType>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<EnhancedCalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    propertyIds: propertyFilter,
    staffIds: staffFilter,
    eventTypes: [] as string[],
    status: [] as string[]
  })

  useEffect(() => {
    loadCalendarEvents()
  }, [currentDate, currentView, filters])

  const loadCalendarEvents = async () => {
    setIsLoading(true)
    try {
      if (!db) throw new Error("Firebase not initialized")

      const { startDate, endDate } = getDateRange()

      let eventsQuery = query(
        collection(db, 'calendarEvents'),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('startDate', 'asc')
      )

      const eventsSnapshot = await getDocs(eventsQuery)
      let calendarEvents: EnhancedCalendarEvent[] = []

      eventsSnapshot.forEach((doc) => {
        const eventData = doc.data()
        calendarEvents.push({
          id: doc.id,
          ...eventData,
          startDate: eventData.startDate,
          endDate: eventData.endDate
        } as EnhancedCalendarEvent)
      })

      // Apply filters
      calendarEvents = applyFilters(calendarEvents)

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error loading calendar events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (currentView) {
      case 'day':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
      default:
        // For property and staff views, show current month
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
    }

    return { startDate: start, endDate: end }
  }

  const applyFilters = (events: EnhancedCalendarEvent[]) => {
    return events.filter(event => {
      // Property filter
      if (filters.propertyIds.length > 0 && !filters.propertyIds.includes(event.propertyId)) {
        return false
      }

      // Staff filter
      if (filters.staffIds.length > 0 && event.staffId && !filters.staffIds.includes(event.staffId)) {
        return false
      }

      // Event type filter
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType)) {
        return false
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(event.status)) {
        return false
      }

      return true
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)

    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
      case 'property':
      case 'staff':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  const getEventTypeConfig = (eventType: string) => {
    switch (eventType) {
      case 'booking':
        return CALENDAR_EVENT_TYPES.BOOKING
      case 'cleaning':
        return CALENDAR_EVENT_TYPES.CLEANING
      case 'maintenance':
        return CALENDAR_EVENT_TYPES.MAINTENANCE
      case 'check_in_prep':
        return CALENDAR_EVENT_TYPES.CHECK_IN_PREP
      case 'inspection':
        return CALENDAR_EVENT_TYPES.INSPECTION
      default:
        return CALENDAR_EVENT_TYPES.MAINTENANCE
    }
  }

  const formatDateRange = () => {
    const { startDate, endDate } = getDateRange()

    switch (currentView) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      case 'week':
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'month':
      case 'property':
      case 'staff':
        return currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const renderEventCard = (event: EnhancedCalendarEvent) => {
    const config = getEventTypeConfig(event.eventType)

    return (
      <div
        key={event.id}
        className="p-3 rounded-lg border border-neutral-700 mb-2"
        style={{
          backgroundColor: config.backgroundColor + '20',
          borderColor: config.color
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-white text-sm">{event.title}</h4>
          <Badge variant={getStatusBadgeVariant(event.status)} className="text-xs">
            {event.status}
          </Badge>
        </div>

        <div className="text-xs text-neutral-400 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              {event.startDate.toDate().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
              {event.estimatedDuration && ` (${event.estimatedDuration}m)`}
            </span>
          </div>

          {event.propertyName && (
            <div className="flex items-center gap-2">
              <Home className="h-3 w-3" />
              <span>{event.propertyName}</span>
            </div>
          )}

          {event.staffName && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>{event.staffName}</span>
            </div>
          )}

          {event.guestName && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Guest: {event.guestName}</span>
            </div>
          )}
        </div>

        {event.conflictResolved === false && (
          <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <span>Conflict Detected</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Advanced Calendar View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCalendarEvents}
              disabled={isLoading}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month', 'property', 'staff'] as CalendarViewType[]).map((view) => (
              <Button
                key={view}
                variant={currentView === view ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView(view)}
                className={currentView === view ? 'bg-blue-600 hover:bg-blue-700' : 'border-neutral-700 hover:bg-neutral-800'}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white font-medium px-4">
              {formatDateRange()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(CALENDAR_EVENT_TYPES).map(([key, config]) => {
            const count = events.filter(e => e.eventType === config.type).length
            return (
              <div key={key} className="text-center">
                <div
                  className="w-4 h-4 rounded mx-auto mb-1"
                  style={{ backgroundColor: config.color }}
                ></div>
                <div className="text-sm text-neutral-400">{config.type}</div>
                <div className="text-lg font-bold text-white">{count}</div>
              </div>
            )
          })}
        </div>

        {/* Events List */}
        <div className="space-y-2">
          <h3 className="text-white font-medium">
            Events ({events.length})
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-neutral-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading calendar events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              No events found for the selected period
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {events.map(renderEventCard)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
