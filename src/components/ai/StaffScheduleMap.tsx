'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { googleMapsConfig } from '@/lib/env'
import { AlertCircle, Clock, MapPin, Navigation, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StaffAssignment {
  id: string
  staffName: string
  propertyName: string
  lat: number
  lng: number
  eta: number
  status: 'assigned' | 'en_route' | 'arrived' | 'completed'
  distance: number
  jobType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedAt: string
}

interface StaffScheduleMapProps {
  className?: string
}

export default function StaffScheduleMap({ className }: StaffScheduleMapProps) {
  const [assignments, setAssignments] = useState<StaffAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realStaffData, setRealStaffData] = useState<any[]>([])
  const [realPropertyData, setRealPropertyData] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState({ lat: 9.6, lng: 100.1 })
  const [showInteractiveMap, setShowInteractiveMap] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [isLoadingRealData, setIsLoadingRealData] = useState(true)

  useEffect(() => {
    loadAssignments()
    loadRealMapData()

    // Refresh assignments every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadAssignments()
      loadRealMapData()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load real property and staff data for maps
  const loadRealMapData = async () => {
    try {
      setIsLoadingRealData(true)

      // Import the service dynamically to avoid SSR issues
      const { default: mapDataService } = await import('@/lib/services/mapDataService')

      // Load real properties and staff data
      const [properties, staff] = await Promise.all([
        mapDataService.getPropertiesForMap(),
        mapDataService.getStaffForMap()
      ])

      setRealPropertyData(properties)
      setRealStaffData(staff)

      console.log(`📍 Loaded ${properties.length} properties and ${staff.length} staff for map`)
    } catch (error) {
      console.error('Error loading real map data:', error)
    } finally {
      setIsLoadingRealData(false)
    }
  }

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-coo/assignments')

      if (!response.ok) {
        throw new Error('Failed to load assignments')
      }

      const data = await response.json()
      setAssignments(data.assignments || [])

      // Update map center based on assignments
      if (data.assignments && data.assignments.length > 0) {
        const avgLat = data.assignments.reduce((sum: number, a: StaffAssignment) => sum + a.lat, 0) / data.assignments.length
        const avgLng = data.assignments.reduce((sum: number, a: StaffAssignment) => sum + a.lng, 0) / data.assignments.length
        setMapCenter({ lat: avgLat, lng: avgLng })
      }

      setError(null)
    } catch (err) {
      console.error('Failed to load staff assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')

      // Use mock data for development
      setAssignments(generateMockAssignments())
    } finally {
      setLoading(false)
    }
  }

  const generateMockAssignments = (): StaffAssignment[] => {
    const mockStaff = ['Somchai', 'Niran', 'Ploy', 'Kamon', 'Siriporn']
    const mockProperties = ['Villa Breeze', 'Ocean View Villa', 'Sunset Paradise', 'Palm Garden', 'Lotus Villa']
    const mockJobTypes = ['Cleaning', 'Maintenance', 'Check-in Prep', 'Inspection', 'Repair']
    const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent']
    const statuses: ('assigned' | 'en_route' | 'arrived' | 'completed')[] = ['assigned', 'en_route', 'arrived', 'completed']

    return Array.from({ length: 6 }, (_, i) => ({
      id: `JOB-${String(i + 1).padStart(3, '0')}`,
      staffName: mockStaff[i % mockStaff.length],
      propertyName: mockProperties[i % mockProperties.length],
      lat: 9.6 + (Math.random() - 0.5) * 0.2, // Phuket area coordinates
      lng: 100.1 + (Math.random() - 0.5) * 0.2,
      eta: Math.floor(Math.random() * 45) + 5, // 5-50 minutes
      status: statuses[i % statuses.length],
      distance: Math.round((Math.random() * 15 + 1) * 10) / 10, // 1-15 km
      jobType: mockJobTypes[i % mockJobTypes.length],
      priority: priorities[i % priorities.length],
      assignedAt: new Date(Date.now() - Math.random() * 3600000).toISOString() // Within last hour
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500'
      case 'en_route': return 'bg-yellow-500'
      case 'arrived': return 'bg-green-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 border-red-500'
      case 'high': return 'text-orange-500 border-orange-500'
      case 'medium': return 'text-yellow-500 border-yellow-500'
      case 'low': return 'text-green-500 border-green-500'
      default: return 'text-gray-500 border-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <User className="w-4 h-4" />
      case 'en_route': return <Navigation className="w-4 h-4" />
      case 'arrived': return <MapPin className="w-4 h-4" />
      case 'completed': return <AlertCircle className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  // Check if Google Maps is available
  const isGoogleMapsAvailable = googleMapsConfig.enabled && googleMapsConfig.apiKey !== 'YOUR_API_KEY'

  // Generate Google Maps embed URL (Embed API doesn't support markers, so we'll use a simple view)
  const generateMapUrl = () => {
    if (!isGoogleMapsAvailable) {
      return null
    }

    const apiKey = googleMapsConfig.apiKey
    const center = `${mapCenter.lat},${mapCenter.lng}`

    // Use the Embed API view mode (markers not supported in embed API)
    return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=12`
  }

  // Alternative: Generate Static Maps API URL with markers (for display only, not interactive)
  const generateStaticMapUrl = () => {
    if (!isGoogleMapsAvailable) {
      return null
    }

    const apiKey = googleMapsConfig.apiKey
    const center = `${mapCenter.lat},${mapCenter.lng}`
    const size = '600x400'

    // Add markers for each assignment using Static Maps API
    const markers = assignments.map(assignment =>
      `&markers=color:red%7Clabel:${assignment.staffName.charAt(0)}%7C${assignment.lat},${assignment.lng}`
    ).join('')

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=12&size=${size}&key=${apiKey}${markers}`
  }

  // Fallback map component when Google Maps fails or is not configured
  const FallbackMap = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center relative">
      <div className="text-center text-white max-w-md px-4">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-300" />
        <h3 className="text-lg font-semibold mb-2">Staff Locations</h3>
        <p className="text-sm text-blue-200 mb-2">Koh Phangan, Thailand</p>

        {!isGoogleMapsAvailable && (
          <div className="mb-4 p-2 bg-yellow-900/50 rounded-lg border border-yellow-600/50">
            <p className="text-xs text-yellow-200">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Google Maps API key not configured
            </p>
          </div>
        )}

        <div className="space-y-2">
          {assignments.length > 0 ? (
            assignments.slice(0, 5).map((assignment, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>{assignment.staffName} - {assignment.jobTitle}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-blue-300">No active assignments</p>
          )}
          {assignments.length > 5 && (
            <div className="text-xs text-blue-300">+{assignments.length - 5} more assignments</div>
          )}
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full opacity-60"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
      <div className="absolute bottom-6 left-8 w-4 h-4 bg-orange-400 rounded-full opacity-40"></div>
    </div>
  )

  if (loading) {
    return (
      <Card className={`bg-neutral-900 border-neutral-700 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5" />
            Staff Schedule Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px] bg-neutral-800 rounded-lg flex items-center justify-center">
            <div className="text-neutral-400">Loading assignments...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MapPin className="h-5 w-5" />
          Staff Schedule Map
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary">
              {assignments.length} Active
            </Badge>
            {!isGoogleMapsAvailable && (
              <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                Maps Offline
              </Badge>
            )}
            {assignments.length > 0 && isGoogleMapsAvailable && (
              <Button
                onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                size="sm"
                variant="outline"
                className="text-xs border-neutral-600 text-neutral-300 hover:text-white"
              >
                {showInteractiveMap ? 'Show Markers' : 'Interactive'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[500px] border border-neutral-700 rounded-lg overflow-hidden">
          {/* Show fallback map if Google Maps is not available or there are errors */}
          {!isGoogleMapsAvailable || mapError ? (
            <FallbackMap />
          ) : showInteractiveMap || assignments.length === 0 ? (
            /* Interactive embed map */
            <iframe
              src={generateMapUrl() || ''}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Staff Schedule Map"
              onError={() => {
                console.warn('Embed map failed to load, using fallback')
                setMapError(true)
              }}
            />
          ) : (
            /* Static map with markers */
            <div className="relative w-full h-full">
              <img
                src={generateStaticMapUrl() || ''}
                alt="Staff Schedule Map with Markers"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to interactive map if static map fails
                  console.warn('Static map failed to load, trying interactive map')
                  setShowInteractiveMap(true)
                }}
              />
              {/* Overlay with assignment details */}
              <div className="absolute top-2 left-2 bg-black/80 rounded-lg p-2 max-w-xs">
                <div className="text-xs text-white space-y-1">
                  <div className="font-semibold">Active Assignments:</div>
                  {assignments.slice(0, 3).map((assignment, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{assignment.staffName} - {assignment.jobTitle}</span>
                    </div>
                  ))}
                  {assignments.length > 3 && (
                    <div className="text-neutral-400">+{assignments.length - 3} more</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Overlay with AI schedule summary */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-neutral-700 p-4 max-h-48 overflow-y-auto">
            <div className="text-white text-sm font-medium mb-3">
              AI COO Assignments ({assignments.length})
            </div>

            {error && (
              <div className="text-red-400 text-xs mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error} - Showing mock data
              </div>
            )}

            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between text-xs text-neutral-300 bg-neutral-800/50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(assignment.status)}`} />
                    {getStatusIcon(assignment.status)}
                    <span className="font-medium text-white">{assignment.staffName}</span>
                    <span>→</span>
                    <span>{assignment.propertyName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(assignment.priority)}`}>
                      {assignment.priority}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>ETA: {assignment.eta}m</span>
                    </div>
                    <div className="text-neutral-400">
                      {assignment.distance}km
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {assignments.length === 0 && (
              <div className="text-neutral-400 text-center py-4">
                No active assignments
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
