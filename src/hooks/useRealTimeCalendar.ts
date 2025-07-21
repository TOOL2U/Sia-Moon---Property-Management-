import { useState, useEffect, useCallback, useRef } from 'react'
import { CalendarEvent, CalendarUpdate, ConflictAlert } from '@/services/RealTimeCalendarService'

/**
 * 🔄 Real-Time Calendar Hook
 * 
 * React hook for real-time calendar updates and conflict alerts
 * Provides live synchronization with automatic reconnection
 */

interface UseRealTimeCalendarOptions {
  propertyName?: string
  dateRange?: { start: string; end: string }
  eventTypes?: string[]
  includeConflicts?: boolean
  autoReconnect?: boolean
  reconnectDelay?: number
}

interface UseRealTimeCalendarReturn {
  events: CalendarEvent[]
  conflicts: ConflictAlert[]
  isConnected: boolean
  isReconnecting: boolean
  lastUpdate: number | null
  connectionError: string | null
  reconnect: () => void
  disconnect: () => void
}

export function useRealTimeCalendar(
  options: UseRealTimeCalendarOptions = {}
): UseRealTimeCalendarReturn {
  const {
    propertyName,
    dateRange,
    eventTypes,
    includeConflicts = true,
    autoReconnect = true,
    reconnectDelay = 3000
  } = options

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [conflicts, setConflicts] = useState<ConflictAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventsMapRef = useRef<Map<string, CalendarEvent>>(new Map())

  // Build SSE URL with parameters
  const buildStreamUrl = useCallback(() => {
    const params = new URLSearchParams()
    
    if (propertyName) params.set('property', propertyName)
    if (dateRange) {
      params.set('start', dateRange.start)
      params.set('end', dateRange.end)
    }
    if (eventTypes && eventTypes.length > 0) {
      params.set('types', eventTypes.join(','))
    }
    if (includeConflicts) params.set('conflicts', 'true')

    return `/api/calendar-stream?${params.toString()}`
  }, [propertyName, dateRange, eventTypes, includeConflicts])

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = buildStreamUrl()
    console.log('🔄 Connecting to calendar stream:', url)

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('✅ Calendar stream connected')
      setIsConnected(true)
      setIsReconnecting(false)
      setConnectionError(null)
    }

    eventSource.onerror = (error) => {
      console.error('❌ Calendar stream error:', error)
      setIsConnected(false)
      setConnectionError('Connection error')

      if (autoReconnect && !isReconnecting) {
        setIsReconnecting(true)
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          connect()
        }, reconnectDelay)
      }
    }

    // Handle connection events
    eventSource.addEventListener('connection', (event) => {
      const data = JSON.parse(event.data)
      console.log('🔄 Calendar stream:', data.message)
    })

    // Handle calendar updates
    eventSource.addEventListener('calendar_update', (event) => {
      const update: CalendarUpdate = JSON.parse(event.data)
      setLastUpdate(update.timestamp)

      // Update events map
      if (update.type === 'created' || update.type === 'updated') {
        eventsMapRef.current.set(update.event.id, update.event)
      } else if (update.type === 'deleted') {
        eventsMapRef.current.delete(update.event.id)
      }

      // Update events state
      setEvents(Array.from(eventsMapRef.current.values()))

      console.log('📅 Calendar update:', update.type, update.event.title)
    })

    // Handle conflict alerts
    eventSource.addEventListener('conflict_alert', (event) => {
      const conflict: ConflictAlert = JSON.parse(event.data)
      
      setConflicts(prev => {
        // Check if conflict already exists
        const exists = prev.some(c => c.id === conflict.id)
        if (exists) return prev
        
        // Add new conflict
        return [...prev, conflict].sort((a, b) => b.timestamp - a.timestamp)
      })

      console.log('⚠️ Conflict alert:', conflict.type, conflict.severity)
    })

    // Handle heartbeat
    eventSource.addEventListener('heartbeat', (event) => {
      const data = JSON.parse(event.data)
      console.log('💓 Calendar heartbeat:', data.activeEvents, 'events')
    })

  }, [buildStreamUrl, autoReconnect, isReconnecting, reconnectDelay])

  // Disconnect from stream
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setIsConnected(false)
    setIsReconnecting(false)
    console.log('🔄 Calendar stream disconnected')
  }, [])

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(connect, 100)
  }, [disconnect, connect])

  // Initialize connection
  useEffect(() => {
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Handle visibility change (reconnect when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && autoReconnect) {
        console.log('🔄 Tab visible, reconnecting calendar stream...')
        reconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, autoReconnect, reconnect])

  return {
    events,
    conflicts,
    isConnected,
    isReconnecting,
    lastUpdate,
    connectionError,
    reconnect,
    disconnect
  }
}

export default useRealTimeCalendar
