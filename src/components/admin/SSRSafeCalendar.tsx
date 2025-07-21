'use client'

import dynamic from 'next/dynamic'
import { ComponentProps, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Types for the calendar component
interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  status?: string
  guestName?: string
  bookingId?: string
  source?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

interface CalendarProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (selectInfo: any) => void
  refreshTrigger?: number
  loading?: boolean
}

// Loading component for SSR fallback
const CalendarLoading = () => (
  <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
    <div className="flex items-center gap-2 text-gray-600">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Loading calendar...</span>
    </div>
  </div>
)

// Dynamically import the calendar with no SSR
const DynamicEnhancedCalendar = dynamic(
  () => import('./EnhancedFullCalendar'),
  {
    ssr: false,
    loading: CalendarLoading,
  }
)

// SSR-Safe Calendar wrapper
const SSRSafeCalendar: React.FC<{ 
  className?: string
  currentView?: string
}> = ({ className, currentView }) => {
  return (
    <Suspense fallback={<CalendarLoading />}>
      <DynamicEnhancedCalendar 
        className={className} 
        currentView={currentView}
      />
    </Suspense>
  )
}

export default SSRSafeCalendar
export type { CalendarEvent, CalendarProps }
