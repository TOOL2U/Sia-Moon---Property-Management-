'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { clientToast as toast } from '@/utils/clientToast';
import '@/styles/pms-calendar.css';
import {
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Loader2,
    MapPin,
    User,
    X
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamic imports for FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-900">
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading PMS Calendar...</span>
      </div>
    </div>
  ),
});

// Dynamically import plugins to avoid SSR issues
const loadCalendarPlugins = async () => {
  const [
    { default: resourceTimelinePlugin },
    { default: interactionPlugin },
  ] = await Promise.all([
    import('@fullcalendar/resource-timeline'),
    import('@fullcalendar/interaction'),
  ]);

  return { resourceTimelinePlugin, interactionPlugin };
};

// Firebase imports
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';

interface PropertyResource {
  id: string
  title: string
  extendedProps?: {
    address?: string
    status?: string
  }
}

interface CalendarEvent {
  id: string
  resourceId: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps?: {
    type: 'booking' | 'job' | 'approved_booking'
    description?: string
    propertyName?: string
    assignedStaff?: string
    jobType?: string
    priority?: string
    status?: string
    guestName?: string
    checkIn?: string
    checkOut?: string
    originalBookingId?: string
    approvedAt?: any
    bookingRef?: string
  }
}

interface PMSResourceCalendarProps {
  className?: string
  currentView?: string
}

export function PMSResourceCalendar({ className, currentView: parentCurrentView }: PMSResourceCalendarProps) {
  const [resources, setResources] = useState<PropertyResource[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState(parentCurrentView || 'resourceTimelineMonth')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([])

  // Ensure we're on the client side and load plugins
  useEffect(() => {
    setIsClient(true)
    loadCalendarPlugins().then(({ resourceTimelinePlugin, interactionPlugin }) => {
      setCalendarPlugins([resourceTimelinePlugin, interactionPlugin]);
    });
  }, [])

  // Sync currentView with parent
  useEffect(() => {
    if (parentCurrentView && parentCurrentView !== currentView) {
      setCurrentView(parentCurrentView)
    }
  }, [parentCurrentView, currentView])

  // Load properties as resources
  useEffect(() => {
    console.log('🏠 Loading properties as calendar resources...')

    if (!db) {
      console.error('Firebase not initialized')
      return () => {}
    }

    const propertiesQuery = query(
      collection(db, 'properties'),
      orderBy('name', 'asc')
    )

    const unsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
      const propertyResources: PropertyResource[] = []

      snapshot.forEach((doc) => {
        const property = doc.data()
        propertyResources.push({
          id: doc.id,
          title: property.name || 'Unnamed Property',
          extendedProps: {
            address: property.location?.address,
            status: property.status || 'active'
          }
        })
      })

      console.log(`✅ Loaded ${propertyResources.length} properties as resources`)
      setResources(propertyResources)
    })

    return () => unsubscribe()
  }, [])

  // Load events from Firebase
  useEffect(() => {
    console.log('🗓️ Loading calendar events from Firebase...')

    const loadEvents = () => {
      if (!db) {
        console.error('Firebase not initialized')
        setLoading(false)
        return () => {}
      }

      const unsubscribers: (() => void)[] = []

      // 1. Listen to operational_jobs collection
      const jobsQuery = query(
        collection(db, 'operational_jobs'),
        orderBy('createdAt', 'desc')
      )

      const jobsUnsubscribe = onSnapshot(jobsQuery, (snapshot) => {
        const jobEvents: CalendarEvent[] = []

        snapshot.forEach((doc) => {
          const job = doc.data()
          const dateField = job.scheduledFor || job.scheduledDate || job.scheduledStart
          
          if (dateField && job.propertyId) {
            try {
              let startDate: Date;
              if (dateField.toDate) {
                startDate = dateField.toDate()
              } else if (typeof dateField === 'string') {
                startDate = new Date(dateField)
              } else if (dateField instanceof Date) {
                startDate = dateField
              } else {
                return
              }

              if (isNaN(startDate.getTime())) {
                return
              }

              const endDate = new Date(startDate)

              if (job.estimatedDuration) {
                endDate.setMinutes(endDate.getMinutes() + job.estimatedDuration)
              } else {
                endDate.setHours(endDate.getHours() + 2)
              }

              if (job.scheduledStartTime) {
                const [hours, minutes] = job.scheduledStartTime.split(':')
                startDate.setHours(parseInt(hours), parseInt(minutes))
              }

              let propertyName = job.propertyName || job.propertyRef?.name
              if (!propertyName && job.title) {
                const parts = job.title.split(' - ')
                if (parts.length > 1) {
                  propertyName = parts.slice(1).join(' - ')
                }
              }

              // Status-based colors (keeping existing logic)
              let backgroundColor = '#FFA500'
              let borderColor = '#FF8C00'
              
              if (job.status === 'in_progress') {
                backgroundColor = '#9370DB'
                borderColor = '#8A2BE2'
              } else if (job.status === 'accepted') {
                backgroundColor = '#4169E1'
                borderColor = '#1E90FF'
              } else if (job.status === 'completed') {
                backgroundColor = '#228B22'
                borderColor = '#006400'
              } else if (job.status === 'cancelled') {
                backgroundColor = '#808080'
                borderColor = '#696969'
              } else if (job.status === 'pending') {
                backgroundColor = '#FFA500'
                borderColor = '#FF8C00'
              }

              jobEvents.push({
                id: `job-${doc.id}`,
                resourceId: job.propertyId,
                title: `${job.jobType?.replace(/_/g, ' ') || 'Job'}`,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                textColor: '#ffffff',
                extendedProps: {
                  type: 'job',
                  description: job.description,
                  propertyName: propertyName,
                  assignedStaff: job.assignedStaffRef?.name || job.assignedStaffName,
                  jobType: job.jobType,
                  priority: job.priority,
                  status: job.status
                }
              })
            } catch (error) {
              console.error('Error processing job date:', error)
            }
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
          const checkIn = booking.checkIn || booking.checkInDate;
          const checkOut = booking.checkOut || booking.checkOutDate;
          
          if (checkIn && checkOut && booking.propertyId) {
            let startDateStr: string;
            let endDateStr: string;
            
            try {
              if (checkIn.toDate) {
                startDateStr = checkIn.toDate().toISOString();
              } else if (typeof checkIn === 'string') {
                startDateStr = new Date(checkIn).toISOString();
              } else {
                startDateStr = checkIn.toISOString();
              }
              
              if (checkOut.toDate) {
                endDateStr = checkOut.toDate().toISOString();
              } else if (typeof checkOut === 'string') {
                endDateStr = new Date(checkOut).toISOString();
              } else {
                endDateStr = checkOut.toISOString();
              }
              
              bookingEvents.push({
                id: `booking-${doc.id}`,
                resourceId: booking.propertyId,
                title: `${booking.guestName || 'Guest'}`,
                start: startDateStr,
                end: endDateStr,
                backgroundColor: getBookingColor(booking.status),
                borderColor: getBookingBorderColor(booking.status),
                textColor: '#ffffff',
                extendedProps: {
                  type: 'booking',
                  description: `Booking: ${booking.guestName || 'Guest'}`,
                  propertyName: booking.propertyName || booking.propertyRef?.name,
                  guestName: booking.guestName,
                  status: booking.status,
                  checkIn: startDateStr,
                  checkOut: endDateStr,
                  bookingRef: doc.id
                }
              })
            } catch (error) {
              console.error(`Error converting dates for booking ${doc.id}:`, error);
            }
          }
        })

        console.log(`🏠 Loaded ${bookingEvents.length} booking events`)
        updateEvents('bookings', bookingEvents)
      })

      unsubscribers.push(bookingsUnsubscribe)

      // 3. Listen to bookings_approved collection
      const approvedBookingsQuery = query(collection(db, 'bookings_approved'))

      const approvedBookingsUnsubscribe = onSnapshot(approvedBookingsQuery, (snapshot) => {
        const approvedBookingEvents: CalendarEvent[] = []

        snapshot.forEach((doc) => {
          const booking = doc.data()
          const checkIn = booking.checkIn || booking.checkInDate;
          const checkOut = booking.checkOut || booking.checkOutDate;
          
          if (checkIn && checkOut && booking.propertyId) {
            let startDateStr: string;
            let endDateStr: string;
            
            try {
              if (checkIn.toDate) {
                startDateStr = checkIn.toDate().toISOString();
              } else if (typeof checkIn === 'string') {
                startDateStr = new Date(checkIn).toISOString();
              } else {
                startDateStr = checkIn.toISOString();
              }
              
              if (checkOut.toDate) {
                endDateStr = checkOut.toDate().toISOString();
              } else if (typeof checkOut === 'string') {
                endDateStr = new Date(checkOut).toISOString();
              } else {
                endDateStr = checkOut.toISOString();
              }
              
              approvedBookingEvents.push({
                id: `approved-booking-${doc.id}`,
                resourceId: booking.propertyId,
                title: `${booking.guestName || 'Guest'} ✓`,
                start: startDateStr,
                end: endDateStr,
                backgroundColor: '#10B981',
                borderColor: '#059669',
                textColor: '#ffffff',
                extendedProps: {
                  type: 'approved_booking',
                  description: `Approved: ${booking.guestName || 'Guest'}`,
                  propertyName: booking.propertyName || booking.propertyRef?.name,
                  guestName: booking.guestName,
                  status: 'approved',
                  checkIn: startDateStr,
                  checkOut: endDateStr,
                  originalBookingId: booking.originalBookingId,
                  approvedAt: booking.movedToApprovedAt
                }
              })
            } catch (error) {
              console.error(`Error converting dates for approved booking ${doc.id}:`, error);
            }
          }
        })

        console.log(`✅ Loaded ${approvedBookingEvents.length} approved booking events`)
        updateEvents('approved_bookings', approvedBookingEvents)
      })

      unsubscribers.push(approvedBookingsUnsubscribe)

      setLoading(false)

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

  // Color functions (keeping existing logic)
  const getBookingColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return '#8b5cf6'
    }
  }

  const getBookingBorderColor = (status: string) => {
    return getBookingColor(status)
  }

  // Event handlers
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    setSelectedEvent({
      id: event.id,
      resourceId: event.getResources()[0]?.id || '',
      title: event.title,
      start: event.start?.toISOString() || '',
      end: event.end?.toISOString() || event.start?.toISOString() || '',
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps
    })
    setShowEventModal(true)
  }

  // If not client-side, show loading state
  if (!isClient) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-neutral-400">Loading PMS Calendar...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{resources.length}</div>
                <div className="text-xs text-neutral-400">Properties</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{eventsByType.bookings.length}</div>
                <div className="text-xs text-neutral-400">Bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{eventsByType.approved_bookings.length}</div>
                <div className="text-xs text-neutral-400">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">{eventsByType.jobs.length}</div>
                <div className="text-xs text-neutral-400">Jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">PMS Resource Timeline</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                <Calendar className="w-3 h-3 mr-1" />
                {resources.length} Properties
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Clock className="w-3 h-3 mr-1" />
                {events.length} Events
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="pms-calendar-container">
            {isClient && calendarPlugins.length > 0 && resources.length > 0 ? (
              <FullCalendar
                plugins={calendarPlugins}
                initialView="resourceTimelineMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
                }}
                resources={resources}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                resourceAreaHeaderContent="Properties"
                resourceAreaWidth="200px"
                slotMinWidth={50}
                eventMinWidth={20}
                eventDisplay="block"
                eventOverlap={false}
                slotLabelFormat={[
                  { month: 'long', year: 'numeric' },
                  { weekday: 'short', day: 'numeric' }
                ]}
                // Custom styling
                eventClassNames="pms-event"
                resourceLabelClassNames="pms-resource-label"
              />
            ) : (
              <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-900">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading properties and events...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedEvent.backgroundColor }}
                  />
                  <CardTitle className="text-white text-lg">
                    {selectedEvent.extendedProps?.type === 'job' ? '🔧' : '🏠'} {selectedEvent.title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventModal(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Event Type Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                  style={{
                    borderColor: selectedEvent.backgroundColor,
                    color: selectedEvent.backgroundColor
                  }}
                >
                  {selectedEvent.extendedProps?.type?.replace('_', ' ')}
                </Badge>
                {selectedEvent.extendedProps?.status && (
                  <Badge
                    variant="outline"
                    className="text-xs capitalize"
                  >
                    {selectedEvent.extendedProps.status}
                  </Badge>
                )}
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-400 mb-1">Schedule</div>
                    <div className="text-white text-sm">
                      <div>Start: {new Date(selectedEvent.start).toLocaleString()}</div>
                      <div>End: {new Date(selectedEvent.end || selectedEvent.start).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property */}
              {selectedEvent.extendedProps?.propertyName && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-400 mb-1">Property</div>
                    <div className="text-white text-sm">
                      {selectedEvent.extendedProps.propertyName}
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Name (for bookings) */}
              {selectedEvent.extendedProps?.guestName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-400 mb-1">Guest</div>
                    <div className="text-white text-sm">
                      {selectedEvent.extendedProps.guestName}
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned Staff (for jobs) */}
              {selectedEvent.extendedProps?.assignedStaff && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-400 mb-1">Assigned Staff</div>
                    <div className="text-white text-sm">
                      {selectedEvent.extendedProps.assignedStaff}
                    </div>
                  </div>
                </div>
              )}

              {/* Job Type & Priority */}
              {selectedEvent.extendedProps?.jobType && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-400 mb-1">Job Details</div>
                    <div className="text-white text-sm">
                      <div>Type: {selectedEvent.extendedProps.jobType.replace(/_/g, ' ')}</div>
                      {selectedEvent.extendedProps.priority && (
                        <div>Priority: {selectedEvent.extendedProps.priority}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.extendedProps?.description && (
                <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="text-sm text-neutral-400 mb-2">Notes</div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    {selectedEvent.extendedProps.description}
                  </p>
                </div>
              )}

              {/* Booking Reference */}
              {selectedEvent.extendedProps?.bookingRef && (
                <div className="text-xs text-neutral-500 font-mono">
                  Ref: {selectedEvent.extendedProps.bookingRef}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default PMSResourceCalendar
