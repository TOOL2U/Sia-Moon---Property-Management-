'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Navigation, Users, Clock, Zap, AlertTriangle } from 'lucide-react'

export default function LocationSimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [staffAnalysis, setStaffAnalysis] = useState<any[]>([])

  const runLocationBasedAssignment = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setStaffAnalysis([])

    const locationBooking = {
      bookingId: "map-booking-006",
      propertyId: "villa-999",
      location: { lat: 9.8000, lng: 99.3500 },
      date: "2025-08-07",
      time: "10:00",
      value: 3100,
      notes: "AC repair request"
    }

    try {
      console.log('📍 Starting Location-Based Staff Assignment Test...')
      console.log('📋 Location Booking Data:', locationBooking)

      // First, simulate staff analysis
      const staffData = simulateStaffDistanceAnalysis(locationBooking.location)
      setStaffAnalysis(staffData)

      // Import the simulation function dynamically
      const { simulateCOOBooking } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCOOBooking(locationBooking)
      console.log('🤖 AI COO Location Result:', simulationResult)

      setResult(simulationResult)

    } catch (err) {
      console.error('❌ Location simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const simulateStaffDistanceAnalysis = (jobLocation: { lat: number; lng: number }) => {
    // Simulate Thai staff members with realistic locations around Koh Phangan
    const staffMembers = [
      {
        id: 'staff_001',
        name: 'Somchai Jaidee',
        role: 'AC Technician',
        location: { lat: 9.7800, lng: 99.3400 },
        available: true,
        skills: ['ac_repair', 'electrical'],
        rating: 4.8
      },
      {
        id: 'staff_002', 
        name: 'Niran Thanakit',
        role: 'Maintenance Tech',
        location: { lat: 9.8200, lng: 99.3600 },
        available: true,
        skills: ['ac_repair', 'plumbing', 'general'],
        rating: 4.6
      },
      {
        id: 'staff_003',
        name: 'Ploy Siriporn',
        role: 'Cleaner',
        location: { lat: 9.7500, lng: 99.3200 },
        available: false,
        skills: ['cleaning', 'organizing'],
        rating: 4.9
      },
      {
        id: 'staff_004',
        name: 'Kamon Rattana',
        role: 'Electrician',
        location: { lat: 9.8500, lng: 99.4000 },
        available: true,
        skills: ['electrical', 'ac_repair'],
        rating: 4.7
      },
      {
        id: 'staff_005',
        name: 'Malee Suksawat',
        role: 'General Maintenance',
        location: { lat: 9.7200, lng: 99.2800 },
        available: true,
        skills: ['general', 'painting'],
        rating: 4.3
      }
    ]

    // Calculate distances using Haversine formula approximation
    return staffMembers.map(staff => {
      const distance = calculateDistance(jobLocation, staff.location)
      const travelTime = Math.round(distance * 3) // ~3 minutes per km
      const withinRadius = distance <= 5.0
      const hasSkills = staff.skills.includes('ac_repair') || staff.skills.includes('electrical')
      
      return {
        ...staff,
        distance: Math.round(distance * 10) / 10,
        travelTime: `${travelTime} minutes`,
        withinRadius,
        hasSkills,
        assignmentScore: calculateAssignmentScore(distance, staff.available, hasSkills, staff.rating)
      }
    }).sort((a, b) => b.assignmentScore - a.assignmentScore)
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

  const calculateAssignmentScore = (distance: number, available: boolean, hasSkills: boolean, rating: number) => {
    if (!available) return 0
    
    let score = 100
    score -= distance * 10 // Penalty for distance
    score += hasSkills ? 20 : -30 // Bonus for relevant skills
    score += (rating - 4.0) * 10 // Rating bonus
    
    return Math.max(0, score)
  }

  const getDistanceColor = (distance: number, withinRadius: boolean) => {
    if (!withinRadius) return 'bg-red-600'
    if (distance <= 2) return 'bg-green-600'
    if (distance <= 4) return 'bg-yellow-600'
    return 'bg-orange-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <MapPin className="w-10 h-10 text-blue-400" />
            📍 AI COO Location-Based Assignment
          </h1>
          <p className="text-blue-200">
            Test AI COO's distance-based staff assignment with 5km radius optimization
          </p>
        </div>

        <Card className="bg-slate-800/50 border-blue-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Location-Based Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>Booking ID:</strong> map-booking-006</div>
                <div><strong>Property:</strong> villa-999</div>
                <div className="flex items-center gap-2">
                  <strong>Location:</strong> 9.8000, 99.3500
                  <Badge className="bg-blue-600 text-white text-xs">
                    <Navigation className="w-3 h-3 mr-1" />
                    GPS
                  </Badge>
                </div>
                <div><strong>Date/Time:</strong> August 7, 2025 at 10:00 AM</div>
              </div>
              <div>
                <div><strong>Value:</strong> ฿3,100</div>
                <div className="flex items-center gap-2">
                  <strong>Service:</strong> AC repair request
                  <Badge className="bg-orange-600 text-white text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    TECHNICAL
                  </Badge>
                </div>
                <div><strong>Skill Required:</strong> AC repair / Electrical</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
              <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Location Assignment Rules
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Primary Rule:</strong> Select staff within 5km radius</li>
                <li>• <strong>Skill Matching:</strong> Prioritize AC repair/electrical skills</li>
                <li>• <strong>Distance Priority:</strong> Nearest available staff preferred</li>
                <li>• <strong>Availability Check:</strong> Only assign available staff</li>
                <li>• <strong>Fallback:</strong> If no staff within 5km, escalate or assign remote-capable</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runLocationBasedAssignment}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Calculating Distances...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 mr-2" />
                📍 Test Location Assignment
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

        {staffAnalysis.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Staff Distance Analysis
                </span>
                <Badge variant="secondary">
                  {staffAnalysis.filter(s => s.withinRadius && s.available).length} within 5km
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffAnalysis.map((staff, index) => (
                  <div key={staff.id} className={`p-4 rounded-lg border ${
                    staff.assignmentScore > 80 ? 'bg-green-900/30 border-green-700' :
                    staff.assignmentScore > 60 ? 'bg-yellow-900/30 border-yellow-700' :
                    'bg-slate-700/50 border-slate-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium">{staff.name}</h3>
                        <Badge className="bg-purple-600 text-white text-xs">
                          {staff.role}
                        </Badge>
                        <Badge className={`${getDistanceColor(staff.distance, staff.withinRadius)} text-white text-xs`}>
                          {staff.distance}km
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {staff.available ? (
                          <Badge className="bg-green-600 text-white text-xs">AVAILABLE</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white text-xs">BUSY</Badge>
                        )}
                        <span className="text-sm text-slate-400">Score: {staff.assignmentScore.toFixed(0)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Travel Time:</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span className="text-white">{staff.travelTime}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Skills Match:</span>
                        <div className="flex items-center gap-1">
                          {staff.hasSkills ? (
                            <>
                              <Zap className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">AC Repair</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400">General</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Rating:</span>
                        <div className="text-white">⭐ {staff.rating}/5.0</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Within 5km:</span>
                        <div className={staff.withinRadius ? 'text-green-400' : 'text-red-400'}>
                          {staff.withinRadius ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🤖 AI COO Assignment Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Assignment Decision</h3>
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
                    <h3 className="text-white font-semibold mb-3">Selected Staff</h3>
                    <div className="space-y-2">
                      <div><strong>Staff:</strong> {result.response.assignedStaff.name}</div>
                      <div><strong>ETA:</strong> {result.response.assignedStaff.eta}</div>
                      <div><strong>Distance:</strong> {result.response.assignedStaff.distance}km</div>
                      <div>
                        <strong>Within 5km:</strong>
                        <span className={`ml-2 ${
                          result.response.assignedStaff.distance <= 5 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {result.response.assignedStaff.distance <= 5 ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {result.response?.reason && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">AI Reasoning</h3>
                  <div className="bg-slate-700 p-4 rounded">
                    <p className="text-slate-300">{result.response.reason}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-700 rounded">
                <h3 className="text-white font-semibold mb-2">Raw AI Response</h3>
                <pre className="text-xs text-slate-300 overflow-auto max-h-32">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This test verifies distance-based staff assignment with 5km radius optimization and skill matching
          </p>
        </div>
      </div>
    </div>
  )
}
