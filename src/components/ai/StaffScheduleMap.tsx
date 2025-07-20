'use client'

import { useEffect, useState } from 'react'
import { MapPin, Clock, User, Navigation, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  const [mapCenter, setMapCenter] = useState({ lat: 9.6, lng: 100.1 })

  useEffect(() => {
    loadAssignments()
    
    // Refresh assignments every 30 seconds for real-time updates
    const interval = setInterval(loadAssignments, 30000)
    return () => clearInterval(interval)
  }, [])

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

  // Generate Google Maps embed URL with markers
  const generateMapUrl = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'
    const center = `${mapCenter.lat},${mapCenter.lng}`
    
    // Add markers for each assignment
    const markers = assignments.map(assignment => 
      `&markers=color:red%7Clabel:${assignment.staffName.charAt(0)}%7C${assignment.lat},${assignment.lng}`
    ).join('')
    
    return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=12${markers}`
  }

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
          <Badge variant="secondary" className="ml-auto">
            {assignments.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[500px] border border-neutral-700 rounded-lg overflow-hidden">
          {/* Google Maps Embed */}
          <iframe
            src={generateMapUrl()}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Staff Schedule Map"
          />

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
