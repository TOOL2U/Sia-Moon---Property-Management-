'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import {
    AlertTriangle,
    Home,
    Loader2,
    MapPin,
    Users
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import CommandCenterControls from './CommandCenterControls'
import IntegrationAutomationPanel from './IntegrationAutomationPanel'
import LiveActivityFeed from './LiveActivityFeed'

interface PropertyLocation {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance'
  coordinates: { lat: number; lng: number }
  urgentTasks?: number
}

interface StaffLocation {
  id: string
  name: string
  role: string
  status: 'available' | 'on_job' | 'traveling' | 'break' | 'offline'
  coordinates: { lat: number; lng: number }
  currentTask?: string
}

interface ActiveTask {
  id: string
  title: string
  type: 'cleaning' | 'maintenance' | 'inspection' | 'guest_service'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string
  propertyId: string
  estimatedDuration: number
  status: 'pending' | 'in_progress' | 'completed'
}

interface OperationalAlert {
  id: string
  type: 'emergency' | 'maintenance' | 'security' | 'guest_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  propertyId: string
  timestamp: Date
  resolved: boolean
}

interface LiveMetrics {
  totalProperties: number
  occupiedProperties: number
  availableProperties: number
  maintenanceProperties: number
  activeStaff: number
  activeTasks: number
  pendingAlerts: number
  dailyRevenue: number
  occupancyRate: number
  averageGuestSatisfaction: number
}

export default function OperationsMapDashboard() {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffLocation | null>(null)
  const [selectedTask, setSelectedTask] = useState<ActiveTask | null>(null)
  const [properties, setProperties] = useState<PropertyLocation[]>([])
  const [staff, setStaff] = useState<StaffLocation[]>([])
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([])
  const [alerts, setAlerts] = useState<OperationalAlert[]>([])
  const [realMapData, setRealMapData] = useState<{ properties: any[], staff: any[] }>({ properties: [], staff: [] })
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    totalProperties: 0,
    occupiedProperties: 0,
    availableProperties: 0,
    maintenanceProperties: 0,
    activeStaff: 0,
    activeTasks: 0,
    pendingAlerts: 0,
    dailyRevenue: 0,
    occupancyRate: 0,
    averageGuestSatisfaction: 0,
  })
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Load operational data
  useEffect(() => {
    loadOperationalData()
    loadRealMapData()
    const interval = setInterval(() => {
      loadOperationalData()
      loadRealMapData()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load real property and staff data for operations map
  const loadRealMapData = async () => {
    try {
      // Import the service dynamically to avoid SSR issues
      const { default: mapDataService } = await import('@/lib/services/mapDataService')

      // Load real properties and staff data
      const [properties, staff] = await Promise.all([
        mapDataService.getPropertiesForMap(),
        mapDataService.getStaffForMap()
      ])

      setRealMapData({ properties, staff })
      console.log(`🗺️ Operations: Loaded ${properties.length} properties and ${staff.length} staff`)
    } catch (error) {
      console.error('Error loading real operations map data:', error)
    }
  }

  const loadOperationalData = async () => {
    setIsLoading(true)
    try {
      // Mock data for demonstration
      const mockProperties: PropertyLocation[] = [
        {
          id: '1',
          name: 'Ocean View Villa',
          address: '123 Beach Road',
          status: 'occupied',
          coordinates: { lat: 7.9985, lng: 98.2965 },
          urgentTasks: 2
        },
        {
          id: '2',
          name: 'Mountain Retreat',
          address: '456 Hill Street',
          status: 'available',
          coordinates: { lat: 7.9990, lng: 98.2970 }
        },
        {
          id: '3',
          name: 'Garden Suite',
          address: '789 Garden Lane',
          status: 'cleaning',
          coordinates: { lat: 7.9980, lng: 98.2960 }
        }
      ]

      const mockStaff: StaffLocation[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          role: 'Housekeeper',
          status: 'on_job',
          coordinates: { lat: 7.9985, lng: 98.2965 },
          currentTask: 'Cleaning Ocean View Villa'
        },
        {
          id: '2',
          name: 'Mike Chen',
          role: 'Maintenance',
          status: 'available',
          coordinates: { lat: 7.9990, lng: 98.2970 }
        }
      ]

      const mockTasks: ActiveTask[] = [
        {
          id: '1',
          title: 'Deep cleaning',
          type: 'cleaning',
          priority: 'high',
          assignedTo: 'Sarah Johnson',
          propertyId: '1',
          estimatedDuration: 120,
          status: 'in_progress'
        }
      ]

      const mockAlerts: OperationalAlert[] = [
        {
          id: '1',
          type: 'maintenance',
          severity: 'medium',
          title: 'AC Unit Issue',
          description: 'Air conditioning not cooling properly',
          propertyId: '2',
          timestamp: new Date(),
          resolved: false
        }
      ]

      const metrics: LiveMetrics = {
        totalProperties: mockProperties.length,
        occupiedProperties: mockProperties.filter(p => p.status === 'occupied').length,
        availableProperties: mockProperties.filter(p => p.status === 'available').length,
        maintenanceProperties: mockProperties.filter(p => p.status === 'maintenance').length,
        activeStaff: mockStaff.filter(s => s.status !== 'offline').length,
        activeTasks: mockTasks.filter(t => t.status !== 'completed').length,
        pendingAlerts: mockAlerts.filter(a => !a.resolved).length,
        dailyRevenue: 15420,
        occupancyRate: 85.5,
        averageGuestSatisfaction: 4.7
      }

      setProperties(mockProperties)
      setStaff(mockStaff)
      setActiveTasks(mockTasks)
      setAlerts(mockAlerts)
      setLiveMetrics(metrics)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading operational data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500'
      case 'occupied':
        return 'bg-blue-500'
      case 'cleaning':
        return 'bg-yellow-500'
      case 'maintenance':
        return 'bg-red-500'
      case 'on_job':
        return 'bg-blue-500'
      case 'traveling':
        return 'bg-orange-500'
      case 'break':
        return 'bg-purple-500'
      case 'offline':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Import Google Maps config
  const { googleMapsConfig } = require('@/lib/env')

  // Check if Google Maps is available
  const isGoogleMapsAvailable = googleMapsConfig?.enabled && googleMapsConfig?.apiKey !== 'YOUR_API_KEY'

  // Generate Google Maps embed URL for operations center
  const generateOperationsMapUrl = () => {
    if (!isGoogleMapsAvailable) {
      return null
    }

    const apiKey = googleMapsConfig.apiKey
    // Center on Koh Phangan, Thailand (operations area)
    const center = '9.7349,100.0269'

    return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=13`
  }

  // Generate Static Maps API URL with property and staff markers
  const generateOperationsStaticMapUrl = () => {
    if (!isGoogleMapsAvailable) {
      return null
    }

    const apiKey = googleMapsConfig.apiKey
    const center = '9.7349,100.0269'
    const size = '800x600'

    // Add markers for properties
    const propertyMarkers = properties.map((property, index) =>
      `&markers=color:blue%7Clabel:P${index + 1}%7C${property.coordinates.lat},${property.coordinates.lng}`
    ).join('')

    // Add markers for staff
    const staffMarkers = staff.map((member, index) =>
      `&markers=color:green%7Clabel:S${index + 1}%7C${member.coordinates.lat},${member.coordinates.lng}`
    ).join('')

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=13&size=${size}&key=${apiKey}${propertyMarkers}${staffMarkers}`
  }

  // Fallback Map Component
  const FallbackMap = () => (
    <div
      ref={mapRef}
      className={`relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg overflow-hidden ${
        isFullScreen ? 'h-screen' : 'h-96 lg:h-[600px]'
      }`}
    >
      {/* Map Background */}
      <div className="absolute inset-0 opacity-20" />

      {/* Google Maps unavailable notice */}
      {!isGoogleMapsAvailable && (
        <div className="absolute top-4 left-4 bg-yellow-900/80 border border-yellow-600/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-200 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Google Maps API not configured - Using fallback view</span>
          </div>
        </div>
      )}

      {/* Property Markers */}
      {properties.map((property, index) => (
        <motion.div
          key={property.id}
          className="absolute cursor-pointer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          style={{
            left: `${20 + index * 25}%`,
            top: `${30 + index * 15}%`,
          }}
          onClick={() => setSelectedProperty(property)}
        >
          <div
            className={`w-8 h-8 rounded-full ${getStatusColor(property.status)} flex items-center justify-center shadow-lg border-2 border-white`}
          >
            <Home className="w-4 h-4 text-white" />
          </div>
          {property.urgentTasks && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">
                {property.urgentTasks}
              </span>
            </div>
          )}
        </motion.div>
      ))}

      {/* Staff Markers */}
      {staff.map((member, index) => (
        <motion.div
          key={member.id}
          className="absolute cursor-pointer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          style={{
            left: `${60 + index * 15}%`,
            top: `${20 + index * 20}%`,
          }}
        >
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white">
            <Users className="w-3 h-3 text-white" />
          </div>
        </motion.div>
      ))}

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 text-white text-xs bg-black/50 px-3 py-2 rounded">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  )

  // Main Interactive Map Component
  const InteractiveMap = () => {
    if (!isGoogleMapsAvailable) {
      return <FallbackMap />
    }

    return (
      <div className={`relative rounded-lg overflow-hidden ${
        isFullScreen ? 'h-screen' : 'h-96 lg:h-[600px]'
      }`}>
        {/* Google Maps Embed */}
        <iframe
          src={generateOperationsMapUrl() || ''}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Operations Map"
          onError={() => {
            console.warn('Google Maps failed to load, using fallback')
          }}
        />

        {/* Operations Overlay */}
        <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-3 max-w-xs">
          <div className="text-xs text-white space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <MapPin className="w-3 h-3 text-blue-400" />
              Operations Overview
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-blue-300">Properties:</span>
                <span>{properties.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-300">Active Staff:</span>
                <span>{staff.filter(s => s.status !== 'offline').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-300">Active Tasks:</span>
                <span>{activeTasks.filter(t => t.status !== 'completed').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-4 left-4 bg-green-900/80 border border-green-600/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-green-200 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Google Maps Active</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : ''}`}>
      {/* Enhanced Header with Live Metrics */}
      {!isFullScreen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-400" />
                Operations Command Center
                {isLoading && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                )}
              </h2>
              <p className="text-gray-400 mt-1">
                Real-time operational oversight and control
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Operations Interface */}
      <div className="space-y-6">
        {/* Top Row - Map and Activity Feed */}
        <div className={`grid gap-6 ${isFullScreen ? 'grid-cols-3 h-96' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Interactive Map */}
          <div className={`${isFullScreen ? 'col-span-2' : 'lg:col-span-2'}`}>
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardContent className="p-0">
                <InteractiveMap />
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Feed */}
          <div className="col-span-1">
            <LiveActivityFeed isFullScreen={isFullScreen} />
          </div>
        </div>

        {/* Bottom Row - Control Panels */}
        <div className={`grid gap-6 ${isFullScreen ? 'grid-cols-2 h-96' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Command Center Controls */}
          <CommandCenterControls isFullScreen={isFullScreen} />

          {/* Integration & Automation Panel */}
          <IntegrationAutomationPanel isFullScreen={isFullScreen} />
        </div>
      </div>
    </div>
  )
}
