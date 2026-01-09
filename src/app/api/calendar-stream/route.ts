import { NextRequest } from 'next/server'
import realTimeCalendarService, { CalendarUpdate, ConflictAlert } from '@/services/RealTimeCalendarService'

/**
 * 🔄 Calendar Real-Time Stream API
 * 
 * Server-Sent Events endpoint for real-time calendar updates
 * Provides live synchronization across all connected clients
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Parse filters from query parameters
  const propertyName = searchParams.get('property')
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const eventTypes = searchParams.get('types')?.split(',')
  const includeConflicts = searchParams.get('conflicts') === 'true'

  console.log('🔄 Calendar stream connection:', {
    propertyName,
    dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
    eventTypes,
    includeConflicts
  })

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder()
      
      const sendMessage = (data: any, event?: string) => {
        const message = `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Send connection established message
      sendMessage({
        type: 'connection',
        message: 'Calendar stream connected',
        timestamp: Date.now()
      }, 'connection')

      // 🔄 NEW: Activate job-to-calendar sync
      realTimeCalendarService.subscribeToJobUpdates()

      // Subscribe to calendar updates
      const calendarSubscription = realTimeCalendarService.subscribeToCalendarUpdates(
        (update: CalendarUpdate) => {
          sendMessage({
            type: 'calendar_update',
            ...update
          }, 'calendar_update')
        },
        {
          propertyName: propertyName || undefined,
          dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
          eventTypes: eventTypes || undefined
        }
      )

      // Subscribe to conflict alerts if requested
      let conflictSubscription: string | null = null
      if (includeConflicts) {
        conflictSubscription = realTimeCalendarService.subscribeToConflictAlerts(
          (conflict: ConflictAlert) => {
            sendMessage({
              type: 'conflict_alert',
              ...conflict
            }, 'conflict_alert')
          }
        )
      }

      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        sendMessage({
          type: 'heartbeat',
          timestamp: Date.now(),
          activeEvents: realTimeCalendarService.getActiveEvents().length
        }, 'heartbeat')
      }, 30000) // Every 30 seconds

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        realTimeCalendarService.unsubscribe(calendarSubscription)
        if (conflictSubscription) {
          realTimeCalendarService.unsubscribe(conflictSubscription)
        }
        console.log('🔄 Calendar stream disconnected')
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)

      // Store cleanup function for potential manual cleanup
      ;(controller as any).cleanup = cleanup
    },

    cancel() {
      // Cleanup when stream is cancelled
      if ((this as any).cleanup) {
        (this as any).cleanup()
      }
    }
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}
