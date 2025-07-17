'use client'

import AIDisabledWarning from '@/components/admin/AIDisabledWarning'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import '@/styles/calendar.css'
import { clientToast as toast } from '@/utils/clientToast'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Building2,
  Calendar as CalendarIcon,
  Calendar as CalendarIconSmall,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// FullCalendar wrapper - handles SSR issues
import FullCalendarWrapper from './FullCalendarWrapper'

// Firebase imports
import { db } from '@/lib/firebase'
import CalendarEventService from '@/services/CalendarEventService'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
} from 'firebase/firestore'

interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
  status: string
  propertyName?: string
  assignedStaff?: string
  bookingType?: string
  description?: string
  resourceId?: string
}

interface CalendarViewProps {
  className?: string
}

export function CalendarView({ className }: CalendarViewProps) {
  // State management
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dayGridMonth')
  const [selectedFilters, setSelectedFilters] = useState({
    staff: 'all',
    property: 'all',
    status: 'all',
  })
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [conflictCheck, setConflictCheck] = useState<any>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})

  // Auto-assignment removed - use manual assignment

  // Filter options
  const [staffOptions, setStaffOptions] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [propertyOptions, setPropertyOptions] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [statusOptions] = useState([
    { id: 'pending', name: 'Pending', color: 'bg-yellow-500' },
    { id: 'assigned', name: 'Assigned', color: 'bg-blue-500' },
    { id: 'accepted', name: 'Accepted', color: 'bg-green-500' },
    { id: 'in_progress', name: 'In Progress', color: 'bg-purple-500' },
    { id: 'completed', name: 'Completed', color: 'bg-emerald-500' },
    { id: 'declined', name: 'Declined', color: 'bg-orange-500' },
    { id: 'cancelled', name: 'Cancelled', color: 'bg-red-500' },
    { id: 'confirmed', name: 'Confirmed', color: 'bg-cyan-500' },
  ])

  // Firebase subscription
  const [unsubscribe, setUnsubscribe] = useState<Unsubscribe | null>(null)

  // Load calendar events from Firebase
  const loadCalendarEvents = useCallback(() => {
    console.log('📅 Setting up calendar events listener...')

    try {
      const eventsRef = collection(db, 'calendarEvents')
      const eventsQuery = query(eventsRef, orderBy('startDate', 'asc'))

      const unsubscribeFn = onSnapshot(
        eventsQuery,
        (snapshot) => {
          const calendarEvents: CalendarEvent[] = []
          const staffSet = new Set<string>()
          const propertySet = new Set<string>()

          snapshot.forEach((doc) => {
            const data = doc.data()
            const event: CalendarEvent = {
              id: doc.id,
              title: data.title || 'Untitled Event',
              startDate: data.startDate,
              endDate: data.endDate,
              color: data.color || '#3b82f6',
              status: data.status || 'pending',
              propertyName: data.propertyName,
              assignedStaff: data.assignedStaff,
              bookingType: data.bookingType,
              description: data.description,
              resourceId: data.resourceId,
            }

            calendarEvents.push(event)

            // Collect unique staff and properties for filters
            if (data.assignedStaff) staffSet.add(data.assignedStaff)
            if (data.propertyName) propertySet.add(data.propertyName)
          })

          setEvents(calendarEvents)

          // Update filter options
          setStaffOptions(
            Array.from(staffSet).map((staff) => ({ id: staff, name: staff }))
          )
          setPropertyOptions(
            Array.from(propertySet).map((property) => ({
              id: property,
              name: property,
            }))
          )

          setLoading(false)
          console.log(`✅ Loaded ${calendarEvents.length} calendar events`)
        },
        (error) => {
          console.error('❌ Error loading calendar events:', error)
          toast.error('Failed to load calendar events')
          setLoading(false)
        }
      )

      setUnsubscribe(() => unsubscribeFn)
      return unsubscribeFn
    } catch (error) {
      console.error('❌ Error setting up calendar listener:', error)
      toast.error('Failed to initialize calendar')
      setLoading(false)
    }
  }, [])

  // Filter events based on selected filters
  const getFilteredEvents = useCallback(() => {
    return events.filter((event) => {
      const staffMatch =
        selectedFilters.staff === 'all' ||
        event.assignedStaff === selectedFilters.staff
      const propertyMatch =
        selectedFilters.property === 'all' ||
        event.propertyName === selectedFilters.property
      const statusMatch =
        selectedFilters.status === 'all' ||
        event.status === selectedFilters.status

      return staffMatch && propertyMatch && statusMatch
    })
  }, [events, selectedFilters])

  // Get enhanced event color based on type and status
  const getEventColor = (event: CalendarEvent) => {
    // Base colors by type - enhanced for job assignments
    const typeColors: Record<string, string> = {
      // Booking types
      'Check-in': '#2196F3', // Blue
      'check-in': '#2196F3', // Blue
      'Check-out': '#FF9800', // Orange
      'check-out': '#FF9800', // Orange

      // Job types
      Cleaning: '#4CAF50', // Green
      cleaning: '#4CAF50', // Green
      Maintenance: '#F44336', // Red
      maintenance: '#F44336', // Red
      Inspection: '#9C27B0', // Purple
      inspection: '#9C27B0', // Purple
      Setup: '#00BCD4', // Cyan
      setup: '#00BCD4', // Cyan
      Checkout: '#FF5722', // Deep Orange
      checkout: '#FF5722', // Deep Orange
      Task: '#795548', // Brown
      task: '#795548', // Brown
      'Villa Service': '#607D8B', // Blue Grey
      default: '#3b82f6', // Default blue
    }

    // Status modifiers with more granular control
    const statusModifiers: Record<string, number> = {
      completed: 0.7, // Darker
      accepted: 1.0, // Normal
      assigned: 1.0, // Normal
      pending: 0.8, // Slightly darker
      in_progress: 1.2, // Brighter
      declined: 0.4, // Much darker
      cancelled: 0.4, // Much darker
    }

    const baseColor =
      typeColors[event.bookingType || event.type || 'Villa Service'] ||
      event.color ||
      typeColors.default
    const modifier = statusModifiers[event.status] || 1.0

    // Apply opacity modifier for status
    if (modifier < 1.0) {
      const hex = baseColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return `rgba(${r}, ${g}, ${b}, ${modifier})`
    }

    return baseColor
  }

  // Convert events to FullCalendar format
  const getFullCalendarEvents = useCallback(() => {
    const filteredEvents = getFilteredEvents()

    return filteredEvents.map((event) => {
      const eventColor = getEventColor(event)
      const staffIndicator = event.assignedStaff
        ? `👤 ${event.assignedStaff}`
        : '🔍 Unassigned'

      return {
        id: event.id,
        title: `${event.bookingType || 'Event'} - ${event.propertyName || 'Property'}`,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: eventColor,
        borderColor: eventColor,
        textColor: '#ffffff',
        extendedProps: {
          propertyName: event.propertyName,
          assignedStaff: event.assignedStaff,
          bookingType: event.bookingType,
          status: event.status,
          description: event.description,
          staffIndicator,
        },
        resourceId: event.resourceId,
        // Add visual indicators
        classNames: [
          'enhanced-event',
          `event-${event.status}`,
          `event-type-${(event.bookingType || 'service').toLowerCase().replace(/[^a-z]/g, '')}`,
        ],
      }
    })
  }, [getFilteredEvents])

  // Handle view change
  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  // Handle filter change
  const handleFilterChange = (
    filterType: 'staff' | 'property' | 'status',
    value: string
  ) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const props = event.extendedProps

    // Convert FullCalendar event back to CalendarEvent format
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      startDate: event.start.toISOString(),
      endDate:
        event.end?.toISOString() ||
        new Date(event.start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      color: event.backgroundColor,
      status: props.status,
      propertyName: props.propertyName,
      assignedStaff: props.assignedStaff,
      bookingType: props.bookingType,
      description: props.description,
      propertyId: props.propertyId || '',
      type: props.bookingType || 'Villa Service',
    }

    // Set selected event and show details modal
    setSelectedEvent(calendarEvent)
    setShowEventDetails(true)
    setIsEditMode(false)

    // Initialize edit form data
    setEditFormData({
      title: calendarEvent.title,
      startDate: calendarEvent.startDate.split('T')[0],
      startTime:
        calendarEvent.startDate.split('T')[1]?.substring(0, 5) || '09:00',
      endDate: calendarEvent.endDate.split('T')[0],
      endTime: calendarEvent.endDate.split('T')[1]?.substring(0, 5) || '17:00',
      status: calendarEvent.status,
      assignedStaff: calendarEvent.assignedStaff || '',
      description: calendarEvent.description || '',
      type: calendarEvent.type || calendarEvent.bookingType || '',
    })
  }

  // Sample events creation removed - use real booking data instead

  // Handle drag-and-drop event rescheduling
  const handleEventDrop = async (dropInfo: any) => {
    try {
      console.log('📅 Event dropped:', dropInfo)

      const eventId = dropInfo.event.id
      const newStart = dropInfo.event.start.toISOString()
      const newEnd =
        dropInfo.event.end?.toISOString() ||
        new Date(
          dropInfo.event.start.getTime() + 2 * 60 * 60 * 1000
        ).toISOString()

      // Conflict checking removed - manual verification required

      // Update event times in Firebase
      const result = await CalendarEventService.updateEventTimes(
        eventId,
        newStart,
        newEnd
      )

      if (result.success) {
        toast.success('✅ Event rescheduled successfully')
        console.log('✅ Event rescheduled:', eventId)
      } else {
        toast.error(`❌ Failed to reschedule event: ${result.error}`)
        dropInfo.revert() // Revert the drag on error
      }
    } catch (error) {
      console.error('❌ Error handling event drop:', error)
      toast.error('❌ Failed to reschedule event')
      dropInfo.revert()
    }
  }

  // Handle event resize (duration change)
  const handleEventResize = async (resizeInfo: any) => {
    try {
      console.log('📅 Event resized:', resizeInfo)

      const eventId = resizeInfo.event.id
      const newStart = resizeInfo.event.start.toISOString()
      const newEnd =
        resizeInfo.event.end?.toISOString() ||
        new Date(
          resizeInfo.event.start.getTime() + 2 * 60 * 60 * 1000
        ).toISOString()

      // Update event times in Firebase
      const result = await CalendarEventService.updateEventTimes(
        eventId,
        newStart,
        newEnd
      )

      if (result.success) {
        toast.success('✅ Event duration updated')
        console.log('✅ Event resized:', eventId)
      } else {
        toast.error(`❌ Failed to update event: ${result.error}`)
        resizeInfo.revert()
      }
    } catch (error) {
      console.error('❌ Error handling event resize:', error)
      toast.error('❌ Failed to update event')
      resizeInfo.revert()
    }
  }

  // Get AI staff suggestions
  // AI staff suggestions removed - use manual assignment

  // Staff assignment now handled manually through calendar interface

  // Auto-assignment functions removed - use manual assignment

  // Handle edit mode toggle
  const handleEditToggle = () => {
    setIsEditMode(!isEditMode)
  }

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle save event changes
  const handleSaveEvent = async () => {
    try {
      if (!selectedEvent) return

      // Construct new start and end dates
      const newStartDate = new Date(
        `${editFormData.startDate}T${editFormData.startTime}:00`
      )
      const newEndDate = new Date(
        `${editFormData.endDate}T${editFormData.endTime}:00`
      )

      // Update event in Firebase
      const result = await CalendarEventService.updateEvent(selectedEvent.id, {
        title: editFormData.title,
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
        status: editFormData.status,
        assignedStaff: editFormData.assignedStaff,
        description: editFormData.description,
        type: editFormData.type,
      })

      if (result.success) {
        toast.success('✅ Event updated successfully')

        // Update the selected event with new data
        const updatedEvent = {
          ...selectedEvent,
          title: editFormData.title,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
          status: editFormData.status,
          assignedStaff: editFormData.assignedStaff,
          description: editFormData.description,
          type: editFormData.type,
        }
        setSelectedEvent(updatedEvent)
        setIsEditMode(false)

        // Refresh calendar events
        loadCalendarEvents()
      } else {
        toast.error(`❌ Failed to update event: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error saving event:', error)
      toast.error('❌ Failed to save event changes')
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false)
    // Reset form data to original values
    if (selectedEvent) {
      setEditFormData({
        title: selectedEvent.title,
        startDate: selectedEvent.startDate.split('T')[0],
        startTime:
          selectedEvent.startDate.split('T')[1]?.substring(0, 5) || '09:00',
        endDate: selectedEvent.endDate.split('T')[0],
        endTime:
          selectedEvent.endDate.split('T')[1]?.substring(0, 5) || '17:00',
        status: selectedEvent.status,
        assignedStaff: selectedEvent.assignedStaff || '',
        description: selectedEvent.description || '',
        type: selectedEvent.type || selectedEvent.bookingType || '',
      })
    }
  }

  // Setup Firebase listener on mount
  useEffect(() => {
    const unsubscribeFn = loadCalendarEvents()

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn()
      }
    }
  }, [loadCalendarEvents])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [unsubscribe])

  // Update calendar view
  useEffect(() => {
    console.log(`📅 Calendar view changed to: ${currentView}`)
  }, [currentView])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Disabled Warning */}
      <AIDisabledWarning context="calendar" />

      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Calendar View
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Manage bookings, events, and staff schedules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </Badge>

              {/* Sample events creation removed - use real booking data */}

              {/* Auto-assignment removed - use manual assignment */}

              <Button
                onClick={loadCalendarEvents}
                variant="outline"
                size="sm"
                disabled={loading}
                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and View Controls */}
      <Card className="bg-gray-900/30 border-gray-700/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 mr-2">View:</span>
              {[
                { id: 'dayGridMonth', name: 'Month', icon: CalendarIcon },
                { id: 'timeGridWeek', name: 'Week', icon: Clock },
                { id: 'timeGridDay', name: 'Day', icon: Eye },
                { id: 'resourceTimeGridWeek', name: 'Resources', icon: Users },
              ].map((view) => (
                <Button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  variant={currentView === view.id ? 'default' : 'outline'}
                  size="sm"
                  className={
                    currentView === view.id
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }
                >
                  <view.icon className="w-4 h-4 mr-1" />
                  {view.name}
                </Button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              {/* Staff Filter */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedFilters.staff}
                  onChange={(e) => handleFilterChange('staff', e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Staff</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Filter */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedFilters.property}
                  onChange={(e) =>
                    handleFilterChange('property', e.target.value)
                  }
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Properties</option>
                  {propertyOptions.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="bg-gray-900/30 border-gray-700/30">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-400">
                Loading calendar events...
              </span>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendarWrapper
                events={getFullCalendarEvents()}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                view={currentView}
                resources={[]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Summary */}
      <Card className="bg-gray-900/30 border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Event Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusOptions.map((status) => {
              const count = getFilteredEvents().filter(
                (event) => event.status === status.id
              ).length
              return (
                <div key={status.id} className="text-center">
                  <div
                    className={`w-8 h-8 ${status.color} rounded-full mx-auto mb-2`}
                  ></div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-sm text-gray-400">{status.name}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Staff Suggestions Modal removed - use manual assignment */}

      {/* Conflict Detection Dialog */}
      {showConflictDialog && conflictCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-red-500/50 rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Scheduling Conflict
                </h3>
                <p className="text-red-400 text-sm">
                  Staff member is already assigned during this time
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {conflictCheck.conflictingEvents.map((conflict: any) => (
                <div
                  key={conflict.id}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  <div className="font-medium text-white">{conflict.title}</div>
                  <div className="text-sm text-red-300">
                    {new Date(conflict.startDate).toLocaleString()} -{' '}
                    {new Date(conflict.endDate).toLocaleString()}
                  </div>
                  <div className="text-xs text-red-400 mt-1">
                    Status: {conflict.status}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <h4 className="font-medium text-yellow-300 mb-2">Suggestions:</h4>
              <ul className="text-sm text-yellow-200 space-y-1">
                {conflictCheck.suggestions.map(
                  (suggestion: string, index: number) => (
                    <li key={index}>• {suggestion}</li>
                  )
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConflictDialog(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowConflictDialog(false)
                  setSelectedEvent(null)
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Find Alternative Staff
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 rounded-xl border border-gray-700/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedEvent.color }}
                  />
                  <h2 className="text-xl font-semibold text-white">
                    {selectedEvent.title}
                  </h2>
                </div>
                <Button
                  onClick={() => {
                    setShowEventDetails(false)
                    setSelectedEvent(null)
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {!isEditMode ? (
                  <>
                    {/* View Mode - Event Status */}
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`
                        ${selectedEvent.status === 'completed' ? 'bg-green-600 text-green-100' : ''}
                        ${selectedEvent.status === 'in-progress' ? 'bg-blue-600 text-blue-100' : ''}
                        ${selectedEvent.status === 'pending' ? 'bg-yellow-600 text-yellow-100' : ''}
                        ${selectedEvent.status === 'cancelled' ? 'bg-red-600 text-red-100' : ''}
                      `}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {selectedEvent.status?.charAt(0).toUpperCase() +
                          selectedEvent.status?.slice(1)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                      >
                        {selectedEvent.type}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Edit Mode - Form Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <Edit className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-medium text-white">
                        Edit Event
                      </h3>
                    </div>
                  </>
                )}

                {!isEditMode ? (
                  <>
                    {/* View Mode - Event Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Date & Time */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Schedule
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-300">
                            <CalendarIconSmall className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">
                              {new Date(
                                selectedEvent.startDate
                              ).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">
                              {new Date(
                                selectedEvent.startDate
                              ).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(
                                selectedEvent.endDate
                              ).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Property Info */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Property
                        </h3>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Building2 className="w-4 h-4 text-green-400" />
                          <span className="text-sm">
                            {selectedEvent.propertyName || 'Not specified'}
                          </span>
                        </div>
                      </div>

                      {/* Staff Assignment */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Assigned Staff
                        </h3>
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-purple-400" />
                          <span className="text-sm">
                            {selectedEvent.assignedStaff || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      {/* Event Type */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Service Type
                        </h3>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Settings className="w-4 h-4 text-orange-400" />
                          <span className="text-sm">
                            {selectedEvent.bookingType || selectedEvent.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedEvent.description && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Description
                        </h3>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {selectedEvent.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Event ID & Metadata */}
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                        Event Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Event ID:</span>
                          <span className="text-gray-300 font-mono">
                            {selectedEvent.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-gray-300">
                            {Math.round(
                              (new Date(selectedEvent.endDate).getTime() -
                                new Date(selectedEvent.startDate).getTime()) /
                                (1000 * 60 * 60)
                            )}{' '}
                            hours
                          </span>
                        </div>
                        {selectedEvent.propertyId && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Property ID:</span>
                            <span className="text-gray-300 font-mono">
                              {selectedEvent.propertyId}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-gray-300">
                            {new Date(
                              selectedEvent.startDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Edit Mode - Form Fields */}
                    <div className="space-y-6">
                      {/* Event Title */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                          Event Title
                        </label>
                        <Input
                          value={editFormData.title || ''}
                          onChange={(e) =>
                            handleFormChange('title', e.target.value)
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Enter event title"
                        />
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={editFormData.startDate || ''}
                            onChange={(e) =>
                              handleFormChange('startDate', e.target.value)
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">
                            Start Time
                          </label>
                          <Input
                            type="time"
                            value={editFormData.startTime || ''}
                            onChange={(e) =>
                              handleFormChange('startTime', e.target.value)
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">
                            End Date
                          </label>
                          <Input
                            type="date"
                            value={editFormData.endDate || ''}
                            onChange={(e) =>
                              handleFormChange('endDate', e.target.value)
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">
                            End Time
                          </label>
                          <Input
                            type="time"
                            value={editFormData.endTime || ''}
                            onChange={(e) =>
                              handleFormChange('endTime', e.target.value)
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                      </div>

                      {/* Status and Staff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">
                            Status
                          </label>
                          <Select
                            value={editFormData.status || ''}
                            onValueChange={(value) =>
                              handleFormChange('status', value)
                            }
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400">
                            Assigned Staff
                          </label>
                          <Input
                            value={editFormData.assignedStaff || ''}
                            onChange={(e) =>
                              handleFormChange('assignedStaff', e.target.value)
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="Enter staff name"
                          />
                        </div>
                      </div>

                      {/* Event Type */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                          Event Type
                        </label>
                        <Select
                          value={editFormData.type || ''}
                          onValueChange={(value) =>
                            handleFormChange('type', value)
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="maintenance">
                              Maintenance
                            </SelectItem>
                            <SelectItem value="inspection">
                              Inspection
                            </SelectItem>
                            <SelectItem value="setup">Setup</SelectItem>
                            <SelectItem value="checkout">Checkout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                          Description
                        </label>
                        <Textarea
                          value={editFormData.description || ''}
                          onChange={(e) =>
                            handleFormChange('description', e.target.value)
                          }
                          className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                          placeholder="Enter event description"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
                  {!isEditMode ? (
                    <>
                      {/* View Mode Buttons */}
                      <Button
                        onClick={handleEditToggle}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>
                      <Button
                        onClick={() => {
                          // TODO: Implement delete functionality
                          toast.success('Delete functionality coming soon!')
                        }}
                        variant="outline"
                        className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        onClick={() => {
                          setShowEventDetails(false)
                          setSelectedEvent(null)
                          setIsEditMode(false)
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Close
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Edit Mode Buttons */}
                      <Button
                        onClick={handleSaveEvent}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auto-Assignment Modal removed - use manual assignment */}
    </div>
  )
}
