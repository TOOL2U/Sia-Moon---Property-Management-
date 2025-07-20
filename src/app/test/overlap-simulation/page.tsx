'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Clock, MapPin, Users, AlertTriangle, CheckCircle, Calendar, Zap } from 'lucide-react'

export default function OverlapSimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conflictAnalysis, setConflictAnalysis] = useState<any>(null)

  const runOverlapBookingTest = async () => {
    setIsRunning(true)
    setError(null)
    setResults([])
    setConflictAnalysis(null)

    const overlappingBookings = [
      {
        bookingId: "overlap-1",
        propertyId: "villa-010",
        location: { lat: 9.101, lng: 99.451 },
        date: "2025-08-08",
        time: "13:00",
        value: 2400,
        notes: "Pool cleaning"
      },
      {
        bookingId: "overlap-2",
        propertyId: "villa-011",
        location: { lat: 9.102, lng: 99.452 },
        date: "2025-08-08",
        time: "13:30", // 30 minutes later, same area
        value: 2500,
        notes: "Outdoor maintenance"
      }
    ]

    try {
      console.log('🔁 Starting Back-to-Back Booking Overlap Test...')
      console.log('📋 Overlapping Bookings:', overlappingBookings)

      // Analyze potential conflicts before processing
      const conflicts = analyzeBookingConflicts(overlappingBookings)
      setConflictAnalysis(conflicts)

      // Import the simulation function dynamically
      const { simulateCOOBooking } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResults = []

      // Process bookings sequentially to test scheduling logic
      for (let i = 0; i < overlappingBookings.length; i++) {
        const booking = overlappingBookings[i]
        console.log(`🤖 Processing booking ${i + 1}: ${booking.bookingId}`)
        
        try {
          const result = await simulateCOOBooking(booking)
          result.bookingOrder = i + 1
          result.bookingData = booking
          simulationResults.push(result)
          
          // Add delay to simulate real-world timing
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (bookingError) {
          console.error(`❌ Error processing ${booking.bookingId}:`, bookingError)
          simulationResults.push({
            success: false,
            error: bookingError.message,
            bookingOrder: i + 1,
            bookingData: booking
          })
        }
      }

      setResults(simulationResults)
      console.log('🔁 Overlap Test Results:', simulationResults)

    } catch (err) {
      console.error('❌ Overlap simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const analyzeBookingConflicts = (bookings: any[]) => {
    const conflicts = {
      timeOverlap: false,
      locationProximity: 0,
      staffConflict: 'potential',
      resourceSharing: [],
      recommendations: []
    }

    if (bookings.length >= 2) {
      const booking1 = bookings[0]
      const booking2 = bookings[1]

      // Calculate time difference
      const time1 = new Date(`${booking1.date}T${booking1.time}:00Z`)
      const time2 = new Date(`${booking2.date}T${booking2.time}:00Z`)
      const timeDiffMinutes = Math.abs(time2.getTime() - time1.getTime()) / (1000 * 60)

      conflicts.timeOverlap = timeDiffMinutes < 120 // Less than 2 hours apart

      // Calculate distance between locations
      const distance = calculateDistance(booking1.location, booking2.location)
      conflicts.locationProximity = Math.round(distance * 10) / 10

      // Analyze potential conflicts
      if (conflicts.timeOverlap && conflicts.locationProximity < 1) {
        conflicts.staffConflict = 'high'
        conflicts.recommendations.push('Same staff member could handle both bookings efficiently')
        conflicts.resourceSharing.push('Equipment sharing possible')
      } else if (conflicts.timeOverlap && conflicts.locationProximity < 5) {
        conflicts.staffConflict = 'medium'
        conflicts.recommendations.push('Consider assigning nearby staff or adjusting schedule')
        conflicts.resourceSharing.push('Travel time optimization needed')
      } else {
        conflicts.staffConflict = 'low'
        conflicts.recommendations.push('Independent scheduling possible')
      }

      if (timeDiffMinutes < 60) {
        conflicts.recommendations.push('Consider extending first booking duration or delaying second booking')
      }
    }

    return conflicts
  }

  const calculateDistance = (loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }) => {
    const R = 6371 // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getConflictColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2025-08-08T${time}:00Z`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Clock className="w-10 h-10 text-orange-400" />
            🔁 AI COO Overlap Scheduling Test
          </h1>
          <p className="text-orange-200">
            Test AI COO's ability to handle overlapping bookings and optimize staff scheduling
          </p>
        </div>

        <Card className="bg-slate-800/50 border-orange-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Back-to-Back Booking Scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  First Booking
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> overlap-1</div>
                  <div><strong>Property:</strong> villa-010</div>
                  <div><strong>Location:</strong> 9.101, 99.451</div>
                  <div><strong>Time:</strong> {formatTime("13:00")}</div>
                  <div><strong>Service:</strong> Pool cleaning</div>
                  <div><strong>Value:</strong> ฿2,400</div>
                </div>
              </div>

              <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Second Booking
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> overlap-2</div>
                  <div><strong>Property:</strong> villa-011</div>
                  <div><strong>Location:</strong> 9.102, 99.452</div>
                  <div><strong>Time:</strong> {formatTime("13:30")} <Badge className="bg-orange-600 text-white text-xs ml-2">30 MIN LATER</Badge></div>
                  <div><strong>Service:</strong> Outdoor maintenance</div>
                  <div><strong>Value:</strong> ฿2,500</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-orange-900/30 border border-orange-700 rounded">
              <h4 className="text-orange-300 font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduling Challenge
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Time Overlap:</strong> 30-minute gap between bookings</li>
                <li>• <strong>Location Proximity:</strong> ~150 meters apart (same area)</li>
                <li>• <strong>Staff Optimization:</strong> Can same staff handle both jobs?</li>
                <li>• <strong>Resource Sharing:</strong> Equipment and travel time efficiency</li>
                <li>• <strong>Expected:</strong> Smart scheduling or conflict resolution</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runOverlapBookingTest}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing Overlapping Bookings...
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 mr-2" />
                🔁 Test Overlap Scheduling
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

        {conflictAnalysis && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Conflict Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Scheduling Conflicts</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Time Overlap:</span>
                      <Badge className={conflictAnalysis.timeOverlap ? 'bg-red-600' : 'bg-green-600'}>
                        {conflictAnalysis.timeOverlap ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Distance:</span>
                      <span className="text-blue-300">{conflictAnalysis.locationProximity}km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Staff Conflict Risk:</span>
                      <Badge className={`${getConflictColor(conflictAnalysis.staffConflict)} text-white`}>
                        {conflictAnalysis.staffConflict.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Optimization Opportunities</h3>
                  <div className="space-y-2">
                    {conflictAnalysis.resourceSharing.map((resource: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {conflictAnalysis.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">AI Recommendations</h3>
                  <div className="space-y-2">
                    {conflictAnalysis.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        {result.bookingOrder}
                      </span>
                      Booking {result.bookingOrder}: {result.bookingData?.bookingId}
                    </span>
                    {result.success ? (
                      <Badge className="bg-green-600 text-white">SUCCESS</Badge>
                    ) : (
                      <Badge className="bg-red-600 text-white">FAILED</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  {result.success ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-white font-semibold mb-3">AI COO Decision</h3>
                        <div className="space-y-2">
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
                          <div>
                            <strong>Processing Time:</strong> {result.duration}ms
                          </div>
                        </div>
                      </div>

                      {result.response?.assignedStaff && (
                        <div>
                          <h3 className="text-white font-semibold mb-3">Staff Assignment</h3>
                          <div className="space-y-2">
                            <div><strong>Staff:</strong> {result.response.assignedStaff.name}</div>
                            <div><strong>ETA:</strong> {result.response.assignedStaff.eta}</div>
                            <div><strong>Distance:</strong> {result.response.assignedStaff.distance}km</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-300">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}

                  {result.response?.reason && (
                    <div className="mt-4">
                      <h3 className="text-white font-semibold mb-2">AI Reasoning</h3>
                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-slate-300 text-sm">{result.response.reason}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {results.length === 2 && results.every(r => r.success) && (
              <Card className="bg-indigo-900/30 border-indigo-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Scheduling Optimization Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-white font-semibold mb-3">Staff Assignments</h3>
                      <div className="space-y-2">
                        <div>
                          <strong>Booking 1 Staff:</strong> {results[0].response?.assignedStaff?.name || 'N/A'}
                        </div>
                        <div>
                          <strong>Booking 2 Staff:</strong> {results[1].response?.assignedStaff?.name || 'N/A'}
                        </div>
                        <div>
                          <strong>Same Staff:</strong> 
                          <Badge className={`ml-2 ${
                            results[0].response?.assignedStaff?.name === results[1].response?.assignedStaff?.name
                              ? 'bg-green-600' : 'bg-blue-600'
                          } text-white`}>
                            {results[0].response?.assignedStaff?.name === results[1].response?.assignedStaff?.name 
                              ? 'YES - OPTIMIZED' : 'NO - SEPARATE STAFF'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">Efficiency Analysis</h3>
                      <div className="space-y-2">
                        <div>
                          <strong>Time Gap:</strong> 30 minutes
                        </div>
                        <div>
                          <strong>Travel Distance:</strong> {conflictAnalysis?.locationProximity}km
                        </div>
                        <div>
                          <strong>Optimization:</strong> 
                          <Badge className="ml-2 bg-green-600 text-white">
                            EFFICIENT SCHEDULING
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This test verifies AI COO's ability to optimize overlapping bookings and manage staff scheduling conflicts
          </p>
        </div>
      </div>
    </div>
  )
}
