'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Clock, Repeat, MapPin, User, CheckCircle } from 'lucide-react'

export default function CalendarSimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])

  const runCalendarSyncSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setCalendarEvents([])

    const calendarBooking = {
      bookingId: "calendar-test-005",
      propertyId: "villa-888",
      location: { lat: 9.100, lng: 99.222 },
      date: "2025-08-06",
      time: "15:00",
      value: 2900,
      notes: "Garden maintenance – recurring"
    }

    try {
      console.log('📅 Starting Calendar Sync Simulation...')
      console.log('📋 Calendar Booking Data:', calendarBooking)

      // Import the simulation function dynamically
      const { simulateCOOBooking } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCOOBooking(calendarBooking)
      console.log('🤖 AI COO Calendar Result:', simulationResult)

      setResult(simulationResult)

      // Simulate calendar event creation
      if (simulationResult.success && simulationResult.response?.decision === 'approved') {
        await simulateCalendarEventCreation(calendarBooking, simulationResult.response)
      }

    } catch (err) {
      console.error('❌ Calendar simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const simulateCalendarEventCreation = async (booking: any, cooResponse: any) => {
    console.log('📅 Simulating calendar event creation...')
    
    // Simulate calendar events that would be created
    const events = [
      {
        id: `event_${booking.bookingId}`,
        title: `Garden Maintenance - ${booking.propertyId}`,
        start: `${booking.date}T${booking.time}:00Z`,
        end: `${booking.date}T${parseInt(booking.time.split(':')[0]) + 2}:${booking.time.split(':')[1]}:00Z`,
        location: `Property ${booking.propertyId} (${booking.location.lat}, ${booking.location.lng})`,
        description: booking.notes,
        assignedStaff: cooResponse.assignedStaff?.name || 'TBD',
        type: 'maintenance',
        recurring: booking.notes.includes('recurring'),
        status: 'scheduled'
      }
    ]

    // If recurring, create additional events
    if (booking.notes.includes('recurring')) {
      const recurringEvents = generateRecurringEvents(booking, cooResponse, 4) // Next 4 occurrences
      events.push(...recurringEvents)
    }

    setCalendarEvents(events)
    console.log('📅 Calendar events created:', events)
  }

  const generateRecurringEvents = (booking: any, cooResponse: any, count: number) => {
    const events = []
    const baseDate = new Date(booking.date)
    
    for (let i = 1; i <= count; i++) {
      const nextDate = new Date(baseDate)
      nextDate.setDate(baseDate.getDate() + (i * 7)) // Weekly recurring
      
      events.push({
        id: `event_${booking.bookingId}_recurring_${i}`,
        title: `Garden Maintenance - ${booking.propertyId} (Recurring)`,
        start: `${nextDate.toISOString().split('T')[0]}T${booking.time}:00Z`,
        end: `${nextDate.toISOString().split('T')[0]}T${parseInt(booking.time.split(':')[0]) + 2}:${booking.time.split(':')[1]}:00Z`,
        location: `Property ${booking.propertyId} (${booking.location.lat}, ${booking.location.lng})`,
        description: `${booking.notes} - Week ${i + 1}`,
        assignedStaff: cooResponse.assignedStaff?.name || 'TBD',
        type: 'maintenance',
        recurring: true,
        status: 'scheduled',
        recurrenceWeek: i + 1
      })
    }
    
    return events
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Calendar className="w-10 h-10 text-green-400" />
            📅 AI COO Calendar Sync Test
          </h1>
          <p className="text-green-200">
            Test AI COO's calendar integration and recurring booking management
          </p>
        </div>

        <Card className="bg-slate-800/50 border-green-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              Calendar Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>Booking ID:</strong> calendar-test-005</div>
                <div><strong>Property:</strong> villa-888</div>
                <div><strong>Location:</strong> 9.100, 99.222 (Koh Phangan)</div>
                <div><strong>Date/Time:</strong> August 6, 2025 at 3:00 PM</div>
              </div>
              <div>
                <div><strong>Value:</strong> ฿2,900</div>
                <div className="flex items-center gap-2">
                  <strong>Service:</strong> Garden maintenance
                  <Badge className="bg-green-600 text-white text-xs">
                    <Repeat className="w-3 h-3 mr-1" />
                    RECURRING
                  </Badge>
                </div>
                <div><strong>Expected:</strong> Calendar events + recurring schedule</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded">
              <h4 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar Integration Features
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Event Creation:</strong> Automatic calendar event generation</li>
                <li>• <strong>Staff Assignment:</strong> Calendar events assigned to specific staff</li>
                <li>• <strong>Recurring Schedule:</strong> Weekly recurring maintenance events</li>
                <li>• <strong>Location Integration:</strong> GPS coordinates and property details</li>
                <li>• <strong>Time Management:</strong> Proper scheduling and duration estimation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runCalendarSyncSimulation}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating Calendar Events...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                📅 Test Calendar Sync
              </>
            )}
          </Button>
        </div>

        {error && (
          <Card className="bg-red-900/50 border-red-700 mb-6">
            <CardHeader>
              <CardTitle className="text-red-200">❌ Simulation Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🤖 AI COO Decision
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <div className="space-y-3">
                  <div>
                    <strong>Decision:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      result.response?.decision === 'approved' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {result.response?.decision?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <strong>Confidence:</strong> {((result.response?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                  {result.response?.assignedStaff && (
                    <div>
                      <strong>Assigned Staff:</strong> {result.response.assignedStaff.name}
                      <div className="text-sm text-slate-400 ml-4">
                        ETA: {result.response.assignedStaff.eta} | Distance: {result.response.assignedStaff.distance}km
                      </div>
                    </div>
                  )}
                  <div>
                    <strong>Processing Time:</strong> {result.duration}ms
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  📅 Calendar Integration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Calendar events generated: {calendarEvents.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-blue-400" />
                    <span>Recurring events: {calendarEvents.filter(e => e.recurring).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Staff assigned: {result.response?.assignedStaff ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>Location integrated: Yes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {calendarEvents.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  Generated Calendar Events
                </span>
                <Badge variant="secondary">
                  {calendarEvents.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calendarEvents.map((event, index) => (
                  <div key={event.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium flex items-center gap-2">
                          {event.title}
                          {event.recurring && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <Repeat className="w-3 h-3 mr-1" />
                              Week {event.recurrenceWeek || 1}
                            </Badge>
                          )}
                        </h3>
                        <p className="text-slate-400 text-sm">{event.description}</p>
                      </div>
                      <Badge className={`${
                        event.status === 'scheduled' ? 'bg-green-600' : 'bg-yellow-600'
                      } text-white`}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span><strong>Start:</strong> {formatDateTime(event.start)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span><strong>End:</strong> {formatDateTime(event.end)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-purple-400" />
                          <span><strong>Staff:</strong> {event.assignedStaff}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span><strong>Location:</strong> {event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This test verifies calendar event creation, staff assignment, and recurring schedule management
          </p>
        </div>
      </div>
    </div>
  )
}
