'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  color: string
  extendedProps: {
    status: string
    type: string
    staffId?: string
    propertyId?: string
    description?: string
  }
}

interface FullCalendarWrapperProps {
  events: CalendarEvent[]
  onEventClick?: (eventInfo: any) => void
  onDateSelect?: (selectInfo: any) => void
  onEventDrop?: (dropInfo: any) => void
  onEventResize?: (resizeInfo: any) => void
  view: string
  resources?: any[]
}

export default function FullCalendarWrapper({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  view,
  resources = []
}: FullCalendarWrapperProps) {
  const [FullCalendar, setFullCalendar] = useState<any>(null)
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Dynamically import FullCalendar and plugins only on client side
    const loadCalendar = async () => {
      try {
        const [
          FullCalendarComponent,
          dayGridPlugin,
          timeGridPlugin,
          resourceDayGridPlugin,
          resourceTimeGridPlugin,
          interactionPlugin
        ] = await Promise.all([
          import('@fullcalendar/react'),
          import('@fullcalendar/daygrid'),
          import('@fullcalendar/timegrid'),
          import('@fullcalendar/resource-daygrid'),
          import('@fullcalendar/resource-timegrid'),
          import('@fullcalendar/interaction')
        ])

        setFullCalendar(() => FullCalendarComponent.default)
        setPlugins([
          dayGridPlugin.default,
          timeGridPlugin.default,
          resourceDayGridPlugin.default,
          resourceTimeGridPlugin.default,
          interactionPlugin.default
        ])
        setLoading(false)
        console.log('✅ FullCalendar loaded successfully')
      } catch (error) {
        console.error('❌ Error loading FullCalendar:', error)
        setError(error instanceof Error ? error.message : 'Failed to load calendar')
        setLoading(false)
      }
    }

    loadCalendar()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900/50 rounded-lg border border-red-700/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400">⚠️</span>
          </div>
          <p className="text-red-400">Failed to load calendar</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (loading || !FullCalendar) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900/50 rounded-lg border border-gray-700/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-gray-400">Loading calendar...</p>
        </div>
      </div>
    )
  }

  const calendarOptions = {
    plugins,
    initialView: view,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events,
    resources: resources.length > 0 ? resources : undefined,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    editable: true,
    droppable: true,
    eventClick: onEventClick,
    select: onDateSelect,
    eventDrop: onEventDrop,
    eventResize: onEventResize,
    height: 'auto',
    aspectRatio: 1.8,
    eventDisplay: 'block',
    eventTextColor: '#ffffff',
    eventBorderColor: 'transparent',
    eventBackgroundColor: '#3b82f6',
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    slotDuration: '01:00:00',
    snapDuration: '00:30:00',
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      startTime: '08:00',
      endTime: '18:00'
    },
    eventClassNames: (arg: any) => {
      const status = arg.event.extendedProps?.status
      const type = arg.event.extendedProps?.type
      
      const classes = ['calendar-event']
      
      if (status) {
        classes.push(`status-${status}`)
      }
      
      if (type) {
        classes.push(`type-${type}`)
      }
      
      return classes
    },
    eventContent: (arg: any) => {
      const { event } = arg
      const status = event.extendedProps?.status
      const type = event.extendedProps?.type
      
      return {
        html: `
          <div class="calendar-event-content">
            <div class="event-title">${event.title}</div>
            <div class="event-meta">
              ${type ? `<span class="event-type">${type}</span>` : ''}
              ${status ? `<span class="event-status status-${status}">${status}</span>` : ''}
            </div>
          </div>
        `
      }
    }
  }

  return (
    <div className="fullcalendar-wrapper">
      <FullCalendar {...calendarOptions} />
    </div>
  )
}
