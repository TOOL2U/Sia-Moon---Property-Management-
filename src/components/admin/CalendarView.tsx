'use client'

import React, { useState, useEffect, useCallback } from 'react'
import '@/styles/calendar.css'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import {
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Users,
  Building2,
  Clock,
  ChevronDown,
  Eye,
  Settings,
  Loader2,
  Plus,
  X,
  AlertTriangle
} from 'lucide-react'

// FullCalendar imports
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// Firebase imports
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore'
import CalendarTestService from '@/services/CalendarTestService'
import CalendarEventService from '@/services/CalendarEventService'
import AISchedulingService from '@/services/AISchedulingService'
import AutoAssignmentModal from '@/components/admin/AutoAssignmentModal'

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
    status: 'all'
  })
  const [creatingEvents, setCreatingEvents] = useState(false)

  // AI Scheduling state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [conflictCheck, setConflictCheck] = useState<any>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)

  // Auto-Assignment Modal state
  const [showAutoAssignment, setShowAutoAssignment] = useState(false)
  const [autoAssignmentEvent, setAutoAssignmentEvent] = useState<CalendarEvent | null>(null)

  // Filter options
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([])
  const [propertyOptions, setPropertyOptions] = useState<Array<{ id: string; name: string }>>([])
  const [statusOptions] = useState([
    { id: 'confirmed', name: 'Confirmed', color: 'bg-green-500' },
    { id: 'pending', name: 'Pending', color: 'bg-yellow-500' },
    { id: 'cancelled', name: 'Cancelled', color: 'bg-red-500' },
    { id: 'completed', name: 'Completed', color: 'bg-blue-500' }
  ])

  // Firebase subscription
  const [unsubscribe, setUnsubscribe] = useState<Unsubscribe | null>(null)

  // Load calendar events from Firebase
  const loadCalendarEvents = useCallback(() => {
    console.log('📅 Setting up calendar events listener...')
    
    try {
      const eventsRef = collection(db, 'calendarEvents')
      const eventsQuery = query(eventsRef, orderBy('startDate', 'asc'))
      
      const unsubscribeFn = onSnapshot(eventsQuery, (snapshot) => {
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
            resourceId: data.resourceId
          }
          
          calendarEvents.push(event)
          
          // Collect unique staff and properties for filters
          if (data.assignedStaff) staffSet.add(data.assignedStaff)
          if (data.propertyName) propertySet.add(data.propertyName)
        })

        setEvents(calendarEvents)
        
        // Update filter options
        setStaffOptions(Array.from(staffSet).map(staff => ({ id: staff, name: staff })))
        setPropertyOptions(Array.from(propertySet).map(property => ({ id: property, name: property })))
        
        setLoading(false)
        console.log(`✅ Loaded ${calendarEvents.length} calendar events`)
      }, (error) => {
        console.error('❌ Error loading calendar events:', error)
        toast.error('Failed to load calendar events')
        setLoading(false)
      })

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
    return events.filter(event => {
      const staffMatch = selectedFilters.staff === 'all' || event.assignedStaff === selectedFilters.staff
      const propertyMatch = selectedFilters.property === 'all' || event.propertyName === selectedFilters.property
      const statusMatch = selectedFilters.status === 'all' || event.status === selectedFilters.status
      
      return staffMatch && propertyMatch && statusMatch
    })
  }, [events, selectedFilters])

  // Get enhanced event color based on type and status
  const getEventColor = (event: CalendarEvent) => {
    // Base colors by type
    const typeColors: Record<string, string> = {
      'Cleaning': '#4CAF50',        // Green
      'Check-in': '#2196F3',        // Blue
      'Check-out': '#FF9800',       // Orange
      'Maintenance': '#F44336',     // Red
      'Inspection': '#9C27B0',      // Purple
      'Villa Service': '#607D8B'    // Blue Grey
    }

    // Status modifiers
    const statusModifiers: Record<string, number> = {
      'completed': 0.7,   // Darker
      'accepted': 1.0,    // Normal
      'pending': 0.8,     // Slightly darker
      'cancelled': 0.4    // Much darker
    }

    const baseColor = typeColors[event.bookingType || 'Villa Service'] || event.color || '#3b82f6'
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

    return filteredEvents.map(event => {
      const eventColor = getEventColor(event)
      const staffIndicator = event.assignedStaff ? `👤 ${event.assignedStaff}` : '🔍 Click for AI suggestions'

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
          staffIndicator
        },
        resourceId: event.resourceId,
        // Add visual indicators
        classNames: [
          'enhanced-event',
          `event-${event.status}`,
          `event-type-${(event.bookingType || 'service').toLowerCase().replace(/[^a-z]/g, '')}`
        ]
      }
    })
  }, [getFilteredEvents])

  // Handle view change
  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  // Handle filter change
  const handleFilterChange = (filterType: 'staff' | 'property' | 'status', value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
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
      endDate: event.end?.toISOString() || new Date(event.start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      color: event.backgroundColor,
      status: props.status,
      propertyName: props.propertyName,
      assignedStaff: props.assignedStaff,
      bookingType: props.bookingType,
      description: props.description,
      propertyId: props.propertyId || '',
      type: props.bookingType || 'Villa Service'
    }

    // Show auto-assignment modal if no staff assigned
    if (!props.assignedStaff) {
      openAutoAssignment(calendarEvent)
    } else {
      toast(`Event: ${event.title}\nStaff: ${props.assignedStaff} • Status: ${props.status}`, {
        icon: 'ℹ️'
      })
    }
  }

  // Create sample calendar events
  const createSampleEvents = async () => {
    try {
      setCreatingEvents(true)
      console.log('📅 Creating sample calendar events...')

      const result = await CalendarTestService.createSampleEvents()

      if (result.success) {
        toast.success(`✅ Created ${result.eventsCreated} sample calendar events`)
        console.log('✅ Sample events created successfully')
      } else {
        toast.error(`❌ Failed to create sample events: ${result.error}`)
        console.error('❌ Sample events creation failed:', result.error)
      }

    } catch (error) {
      console.error('❌ Error creating sample events:', error)
      toast.error(`❌ Failed to create sample events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingEvents(false)
    }
  }

  // Handle drag-and-drop event rescheduling
  const handleEventDrop = async (dropInfo: any) => {
    try {
      console.log('📅 Event dropped:', dropInfo)

      const eventId = dropInfo.event.id
      const newStart = dropInfo.event.start.toISOString()
      const newEnd = dropInfo.event.end?.toISOString() || new Date(dropInfo.event.start.getTime() + 2 * 60 * 60 * 1000).toISOString()

      // Check for conflicts if staff is assigned
      const staffId = dropInfo.event.extendedProps.staffId
      if (staffId) {
        const conflicts = await AISchedulingService.checkConflicts(staffId, newStart, newEnd, eventId)

        if (conflicts.hasConflict) {
          setConflictCheck(conflicts)
          setShowConflictDialog(true)
          dropInfo.revert() // Revert the drag
          return
        }
      }

      // Update event times in Firebase
      const result = await CalendarEventService.updateEventTimes(eventId, newStart, newEnd)

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
      const newEnd = resizeInfo.event.end?.toISOString() || new Date(resizeInfo.event.start.getTime() + 2 * 60 * 60 * 1000).toISOString()

      // Update event times in Firebase
      const result = await CalendarEventService.updateEventTimes(eventId, newStart, newEnd)

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
  const getAIStaffSuggestions = async (event: CalendarEvent) => {
    try {
      setLoadingSuggestions(true)
      setSelectedEvent(event)
      setShowAISuggestions(true)

      console.log('🧠 Getting AI staff suggestions for event:', event.id)

      const suggestions = await AISchedulingService.getStaffSuggestions({
        startDate: event.startDate,
        endDate: event.endDate,
        propertyId: event.propertyName || undefined,
        type: event.bookingType || 'Villa Service'
      })

      setAiSuggestions(suggestions)
      console.log(`✅ Got ${suggestions.length} AI suggestions`)

    } catch (error) {
      console.error('❌ Error getting AI suggestions:', error)
      toast.error('❌ Failed to get AI suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Apply AI staff suggestion
  const applyStaffSuggestion = async (suggestion: any) => {
    try {
      if (!selectedEvent) return

      console.log('👤 Applying staff suggestion:', suggestion)

      // Check for conflicts
      const conflicts = await AISchedulingService.checkConflicts(
        suggestion.staffId,
        selectedEvent.startDate,
        selectedEvent.endDate,
        selectedEvent.id
      )

      if (conflicts.hasConflict) {
        setConflictCheck(conflicts)
        setShowConflictDialog(true)
        return
      }

      // Update event staff assignment
      const result = await CalendarEventService.updateEventStaff(
        selectedEvent.id,
        suggestion.staffId,
        suggestion.staffName
      )

      if (result.success) {
        toast.success(`✅ ${suggestion.staffName} assigned to event`)
        setShowAISuggestions(false)
        setSelectedEvent(null)
      } else {
        toast.error(`❌ Failed to assign staff: ${result.error}`)
      }

    } catch (error) {
      console.error('❌ Error applying staff suggestion:', error)
      toast.error('❌ Failed to assign staff')
    }
  }

  // Open auto-assignment modal
  const openAutoAssignment = (event: CalendarEvent) => {
    console.log('🤖 Opening auto-assignment for event:', event.id)
    setAutoAssignmentEvent(event)
    setShowAutoAssignment(true)
  }

  // Handle auto-assignment completion
  const handleAutoAssignmentComplete = (eventId: string, staffId: string, staffName: string) => {
    console.log(`✅ Auto-assignment completed: ${staffName} assigned to ${eventId}`)

    // Update local events state to reflect the assignment
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, staffId, assignedStaff: staffName, status: 'pending' }
          : event
      )
    )

    // Close modal
    setShowAutoAssignment(false)
    setAutoAssignmentEvent(null)
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

              <Button
                onClick={createSampleEvents}
                disabled={creatingEvents}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {creatingEvents ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Sample Events
              </Button>

              <Button
                onClick={() => {
                  const unassignedEvents = events.filter(e => !e.assignedStaff)
                  if (unassignedEvents.length > 0) {
                    openAutoAssignment(unassignedEvents[0])
                  } else {
                    toast('All events have staff assigned', { icon: 'ℹ️' })
                  }
                }}
                disabled={loadingSuggestions}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {loadingSuggestions ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <span className="mr-2">🤖</span>
                )}
                Auto-Assign
              </Button>

              <Button
                onClick={loadCalendarEvents}
                variant="outline"
                size="sm"
                disabled={loading}
                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                { id: 'resourceTimeGridWeek', name: 'Resources', icon: Users }
              ].map(view => (
                <Button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  variant={currentView === view.id ? 'default' : 'outline'}
                  size="sm"
                  className={currentView === view.id 
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
                  {staffOptions.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>

              {/* Property Filter */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedFilters.property}
                  onChange={(e) => handleFilterChange('property', e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Properties</option>
                  {propertyOptions.map(property => (
                    <option key={property.id} value={property.id}>{property.name}</option>
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
                  {statusOptions.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
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
              <span className="ml-3 text-gray-400">Loading calendar events...</span>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendar
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  resourceDayGridPlugin,
                  resourceTimeGridPlugin,
                  interactionPlugin
                ]}
                initialView={currentView}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                events={getFullCalendarEvents()}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                height="auto"
                aspectRatio={1.8}
                eventDisplay="block"
                dayMaxEvents={3}
                moreLinkClick="popover"
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                nowIndicator={true}
                selectable={true}
                selectMirror={true}
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
                themeSystem="standard"
                // Drag and drop configuration
                editable={true}
                droppable={true}
                eventStartEditable={true}
                eventDurationEditable={true}
                eventResizableFromStart={true}
                dragScroll={true}
                // Update view when currentView changes
                key={currentView}
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
            {statusOptions.map(status => {
              const count = getFilteredEvents().filter(event => event.status === status.id).length
              return (
                <div key={status.id} className="text-center">
                  <div className={`w-8 h-8 ${status.color} rounded-full mx-auto mb-2`}></div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-sm text-gray-400">{status.name}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Staff Suggestions Modal */}
      {showAISuggestions && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🧠 AI Staff Suggestions
                </h3>
                <p className="text-gray-400 mt-1">
                  {selectedEvent.title} • {new Date(selectedEvent.startDate).toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowAISuggestions(false)
                  setSelectedEvent(null)
                }}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-400">Getting AI suggestions...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.length > 0 ? (
                  aiSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.staffId}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {suggestion.staffName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{suggestion.staffName}</h4>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  suggestion.availability === 'available' ? 'bg-green-400' :
                                  suggestion.availability === 'busy' ? 'bg-red-400' : 'bg-yellow-400'
                                }`}></div>
                                <span className="text-sm text-gray-400 capitalize">{suggestion.availability}</span>
                                <span className="text-sm text-gray-500">• {suggestion.currentJobs} current jobs</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            <strong>{Math.round(suggestion.confidence * 100)}% match:</strong> {suggestion.reasons.slice(0, 2).join(', ')}
                          </div>
                          {suggestion.reasons.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{suggestion.reasons.length - 2} more reasons
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => applyStaffSuggestion(suggestion)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          size="sm"
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No staff suggestions available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conflict Detection Dialog */}
      {showConflictDialog && conflictCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-red-500/50 rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Scheduling Conflict</h3>
                <p className="text-red-400 text-sm">Staff member is already assigned during this time</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {conflictCheck.conflictingEvents.map((conflict: any) => (
                <div key={conflict.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="font-medium text-white">{conflict.title}</div>
                  <div className="text-sm text-red-300">
                    {new Date(conflict.startDate).toLocaleString()} - {new Date(conflict.endDate).toLocaleString()}
                  </div>
                  <div className="text-xs text-red-400 mt-1">Status: {conflict.status}</div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <h4 className="font-medium text-yellow-300 mb-2">Suggestions:</h4>
              <ul className="text-sm text-yellow-200 space-y-1">
                {conflictCheck.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>• {suggestion}</li>
                ))}
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
                  if (selectedEvent) {
                    getAIStaffSuggestions(selectedEvent)
                  }
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Find Alternative Staff
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Assignment Modal */}
      <AutoAssignmentModal
        isOpen={showAutoAssignment}
        onClose={() => {
          setShowAutoAssignment(false)
          setAutoAssignmentEvent(null)
        }}
        event={autoAssignmentEvent}
        onAssignmentComplete={handleAutoAssignmentComplete}
      />
    </div>
  )
}
