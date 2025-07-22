'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { clientToast as toast } from '@/utils/clientToast';
import {
    Clock,
    Loader2,
    MapPin,
    User
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamic imports for FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading calendar...</span>
      </div>
    </div>
  ),
});

// Dynamically import plugins to avoid SSR issues
const loadCalendarPlugins = async () => {
  const [
    { default: dayGridPlugin },
    { default: timeGridPlugin },
    { default: interactionPlugin },
    { default: listPlugin }
  ] = await Promise.all([
    import('@fullcalendar/daygrid'),
    import('@fullcalendar/timegrid'),
    import('@fullcalendar/interaction'),
    import('@fullcalendar/list')
  ]);

  return { dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin };
};

// Firebase imports
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps?: {
    description?: string
    propertyName?: string
    assignedStaff?: string
    jobType?: string
    priority?: string
    status?: string
    guestName?: string
    checkIn?: string
    checkOut?: string
  }
}

interface EnhancedFullCalendarProps {
  className?: string
  currentView?: string
}

export function EnhancedFullCalendar({ className, currentView: parentCurrentView }: EnhancedFullCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState(parentCurrentView || 'dayGridMonth')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([])

  // Ensure we're on the client side and load plugins
  useEffect(() => {
    setIsClient(true)
    loadCalendarPlugins().then(({ dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin }) => {
      setCalendarPlugins([dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]);
    });
  }, [])

  // Sync currentView with parent
  useEffect(() => {
    if (parentCurrentView && parentCurrentView !== currentView) {
      setCurrentView(parentCurrentView)
    }
  }, [parentCurrentView, currentView])

  // Load events from Firebase
  useEffect(() => {
    console.log('🗓️ Loading calendar events from Firebase...')

    const loadEvents = () => {
      // Check if Firebase is initialized
      if (!db) {
        console.error('Firebase not initialized')
        setLoading(false)
        return () => {}
      }

      // Listen to ONLY jobs and confirmed bookings for calendar data
      const unsubscribers: (() => void)[] = []

      // 1. Listen to jobs collection
      const jobsQuery = query(
        collection(db, 'jobs'),
        orderBy('scheduledDate', 'asc')
      )

      const jobsUnsubscribe = onSnapshot(jobsQuery, (snapshot) => {
        const jobEvents: CalendarEvent[] = []

        snapshot.forEach((doc) => {
          const job = doc.data()
          if (job.scheduledDate) {
            const startDate = new Date(job.scheduledDate)
            const endDate = new Date(startDate)

            // Add duration if available
            if (job.estimatedDuration) {
              endDate.setMinutes(endDate.getMinutes() + job.estimatedDuration)
            } else {
              endDate.setHours(endDate.getHours() + 2) // Default 2 hours
            }

            // Add start time if available
            if (job.scheduledStartTime) {
              const [hours, minutes] = job.scheduledStartTime.split(':')
              startDate.setHours(parseInt(hours), parseInt(minutes))
            }

            jobEvents.push({
              id: `job-${doc.id}`,
              title: `🔧 ${job.title || 'Job Assignment'}`,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              backgroundColor: getJobColor(job.priority, job.status),
              borderColor: getJobBorderColor(job.priority, job.status),
              textColor: '#ffffff',
              extendedProps: {
                description: job.description,
                propertyName: job.propertyRef?.name || job.propertyName,
                assignedStaff: job.assignedStaffRef?.name || job.assignedStaffName,
                jobType: job.jobType,
                priority: job.priority,
                status: job.status
              }
            })
          }
        })

        console.log(`📋 Loaded ${jobEvents.length} job events`)
        updateEvents('jobs', jobEvents)
      })

      unsubscribers.push(jobsUnsubscribe)

      // 2. Listen to bookings collection (approved and confirmed bookings)
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('status', 'in', ['approved', 'confirmed'])
      )

      const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const bookingEvents: CalendarEvent[] = []

        snapshot.forEach((doc) => {
          const booking = doc.data()
          if (booking.checkIn && booking.checkOut) {
            bookingEvents.push({
              id: `booking-${doc.id}`,
              title: `🏠 ${booking.guestName || 'Guest'} - ${booking.propertyName || 'Property'}`,
              start: booking.checkIn,
              end: booking.checkOut,
              backgroundColor: getBookingColor(booking.status),
              borderColor: getBookingBorderColor(booking.status),
              textColor: '#ffffff',
              extendedProps: {
                description: `Check-in: ${booking.checkIn}, Check-out: ${booking.checkOut}`,
                propertyName: booking.propertyName,
                guestName: booking.guestName,
                status: booking.status,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut
              }
            })
          }
        })

        console.log(`🏠 Loaded ${bookingEvents.length} approved/confirmed booking events`)
        updateEvents('bookings', bookingEvents)
      })

      unsubscribers.push(bookingsUnsubscribe)

      // 3. Listen to bookings_approved collection (all approved bookings)
      const approvedBookingsQuery = query(collection(db, 'bookings_approved'))

      const approvedBookingsUnsubscribe = onSnapshot(approvedBookingsQuery, (snapshot) => {
        const approvedBookingEvents: CalendarEvent[] = []

        snapshot.forEach((doc) => {
          const booking = doc.data()
          if (booking.checkIn && booking.checkOut) {
            approvedBookingEvents.push({
              id: `approved-booking-${doc.id}`,
              title: `✅ ${booking.guestName || 'Guest'} - ${booking.propertyName || 'Property'}`,
              start: booking.checkIn,
              end: booking.checkOut,
              backgroundColor: '#10B981', // Green for approved bookings
              borderColor: '#059669',
              textColor: '#ffffff',
              extendedProps: {
                description: `Approved Booking - Check-in: ${booking.checkIn}, Check-out: ${booking.checkOut}`,
                propertyName: booking.propertyName,
                guestName: booking.guestName,
                status: 'approved',
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                originalBookingId: booking.originalBookingId,
                approvedAt: booking.movedToApprovedAt
              }
            })
          }
        })

        console.log(`✅ Loaded ${approvedBookingEvents.length} approved booking events`)
        updateEvents('approved_bookings', approvedBookingEvents)
      })

      unsubscribers.push(approvedBookingsUnsubscribe)

      // REMOVED: calendarEvents collection listener to prevent duplicates
      // Calendar now only shows jobs, confirmed bookings, and approved bookings directly

      setLoading(false)

      // Cleanup function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe())
      }
    }

    return loadEvents()
  }, [])

  // Event storage by type for merging
  const [eventsByType, setEventsByType] = useState<{
    jobs: CalendarEvent[]
    bookings: CalendarEvent[]
    approved_bookings: CalendarEvent[]
  }>({
    jobs: [],
    bookings: [],
    approved_bookings: []
  })

  const updateEvents = (type: 'jobs' | 'bookings' | 'approved_bookings', newEvents: CalendarEvent[]) => {
    setEventsByType(prev => {
      const updated = { ...prev, [type]: newEvents }
      const allEvents = [...updated.jobs, ...updated.bookings, ...updated.approved_bookings]
      setEvents(allEvents)
      return updated
    })
  }

  // Color functions for different event types
  const getJobColor = (priority: string, status: string) => {
    if (status === 'completed') return '#10b981' // Green
    if (status === 'in_progress') return '#f59e0b' // Yellow
    if (priority === 'urgent') return '#ef4444' // Red
    if (priority === 'high') return '#f97316' // Orange
    return '#6366f1' // Default blue
  }

  const getJobBorderColor = (priority: string, status: string) => {
    return getJobColor(priority, status)
  }

  const getBookingColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981' // Green
      case 'pending': return '#f59e0b' // Yellow
      case 'cancelled': return '#ef4444' // Red
      default: return '#8b5cf6' // Purple
    }
  }

  const getBookingBorderColor = (status: string) => {
    return getBookingColor(status)
  }

  // Event handlers
  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event)
    setShowEventModal(true)
    toast.success(`Selected: ${clickInfo.event.title}`)
  }

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Enter event title:')
    if (title) {
      const newEvent: CalendarEvent = {
        id: `custom-${Date.now()}`,
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        textColor: '#ffffff'
      }

      setEvents(prev => [...prev, newEvent])
      toast.success('Event added successfully!')
    }

    // Selection cleared automatically
  }

  // Removed unused functions: handleViewChange, exportCalendar, refreshCalendar

  // If not client-side, show loading state
  if (!isClient) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-neutral-400">Loading Enhanced Calendar...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>


      {/* Main Calendar */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-6">
          <div className="calendar-container">
            {isClient && calendarPlugins.length > 0 ? (
              <FullCalendar
                plugins={calendarPlugins}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView={currentView}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                eventClick={handleEventClick}
                select={handleDateSelect}
                height="auto"
                eventDisplay="block"
                displayEventTime={true}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                slotLabelFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                // Custom styling
                eventClassNames="calendar-event"
                dayCellClassNames="calendar-day-cell"
                // Loading state
                loading={setLoading}
              />
            ) : (
              <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading calendar...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Card className="bg-neutral-900 border-neutral-800 w-full max-w-md m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{selectedEvent.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventModal(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-300 text-sm">
                    {new Date(selectedEvent.start).toLocaleString()} -
                    {new Date(selectedEvent.end || selectedEvent.start).toLocaleString()}
                  </span>
                </div>

                {selectedEvent.extendedProps?.propertyName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-300 text-sm">
                      {selectedEvent.extendedProps.propertyName}
                    </span>
                  </div>
                )}

                {selectedEvent.extendedProps?.assignedStaff && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-300 text-sm">
                      {selectedEvent.extendedProps.assignedStaff}
                    </span>
                  </div>
                )}

                {selectedEvent.extendedProps?.status && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: selectedEvent.backgroundColor,
                        color: selectedEvent.backgroundColor
                      }}
                    >
                      {selectedEvent.extendedProps.status}
                    </Badge>
                  </div>
                )}

                {selectedEvent.extendedProps?.description && (
                  <div className="mt-3 p-3 bg-neutral-800 rounded-lg">
                    <p className="text-neutral-300 text-sm">
                      {selectedEvent.extendedProps.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics Card */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Calendar Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {eventsByType.jobs.length}
              </div>
              <div className="text-neutral-400 text-sm">Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {eventsByType.bookings.length}
              </div>
              <div className="text-neutral-400 text-sm">Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {eventsByType.approved_bookings.length}
              </div>
              <div className="text-neutral-400 text-sm">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {events.length}
              </div>
              <div className="text-neutral-400 text-sm">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedFullCalendar
