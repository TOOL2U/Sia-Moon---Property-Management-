'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Battery,
  Car,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Home,
  Layers,
  MapPin,
  Maximize2,
  MessageSquare,
  Minimize2,
  Phone,
  RefreshCw,
  Search,
  Target,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PropertyLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
  currentGuests?: number
  maxGuests: number
  checkInToday?: boolean
  checkOutToday?: boolean
  urgentTasks?: number
}

interface StaffLocation {
  id: string
  name: string
  role: string
  latitude: number
  longitude: number
  status: 'available' | 'on_job' | 'traveling' | 'break' | 'offline'
  currentTask?: string
  batteryLevel: number
  lastUpdate: Date
  isOnline: boolean
}

interface MapLayer {
  id: string
  name: string
  visible: boolean
  color: string
  icon: any
}

export default function OperationsMapDashboard() {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyLocation | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    {
      id: 'properties',
      name: 'Properties',
      visible: true,
      color: '#3B82F6',
      icon: Home,
    },
    {
      id: 'staff',
      name: 'Staff Locations',
      visible: true,
      color: '#10B981',
      icon: Users,
    },
    {
      id: 'tasks',
      name: 'Active Tasks',
      visible: true,
      color: '#F59E0B',
      icon: Activity,
    },
    {
      id: 'alerts',
      name: 'Alerts',
      visible: true,
      color: '#EF4444',
      icon: AlertTriangle,
    },
  ])
  const [properties, setProperties] = useState<PropertyLocation[]>([])
  const [staff, setStaff] = useState<StaffLocation[]>([])
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const mapRef = useRef<HTMLDivElement>(null)

  // Mock data - replace with real data from Firebase
  useEffect(() => {
    loadOperationalData()
    const interval = setInterval(loadOperationalData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadOperationalData = async () => {
    // Mock properties data
    const mockProperties: PropertyLocation[] = [
      {
        id: '1',
        name: 'Villa Sunset Paradise',
        address: '123 Beach Road, Phuket',
        latitude: 7.8804,
        longitude: 98.3923,
        status: 'occupied',
        currentGuests: 4,
        maxGuests: 6,
        checkOutToday: true,
      },
      {
        id: '2',
        name: 'Ocean View Villa',
        address: '456 Cliff Drive, Phuket',
        latitude: 7.8854,
        longitude: 98.3973,
        status: 'cleaning',
        currentGuests: 0,
        maxGuests: 8,
        checkInToday: true,
        urgentTasks: 2,
      },
      {
        id: '3',
        name: 'Mountain Retreat',
        address: '789 Hill Top, Phuket',
        latitude: 7.8754,
        longitude: 98.3873,
        status: 'available',
        currentGuests: 0,
        maxGuests: 4,
      },
    ]

    // Mock staff data
    const mockStaff: StaffLocation[] = [
      {
        id: '1',
        name: 'Maria Santos',
        role: 'Housekeeper',
        latitude: 7.8824,
        longitude: 98.3943,
        status: 'on_job',
        currentTask: 'Cleaning Villa Sunset Paradise',
        batteryLevel: 85,
        lastUpdate: new Date(),
        isOnline: true,
      },
      {
        id: '2',
        name: 'Carlos Rodriguez',
        role: 'Maintenance',
        latitude: 7.8774,
        longitude: 98.3893,
        status: 'traveling',
        currentTask: 'En route to Ocean View Villa',
        batteryLevel: 62,
        lastUpdate: new Date(),
        isOnline: true,
      },
      {
        id: '3',
        name: 'Ana Silva',
        role: 'Guest Relations',
        latitude: 7.8804,
        longitude: 98.3923,
        status: 'available',
        batteryLevel: 95,
        lastUpdate: new Date(),
        isOnline: true,
      },
    ]

    setProperties(mockProperties)
    setStaff(mockStaff)
    setLastUpdate(new Date())
  }

  const toggleLayer = (layerId: string) => {
    setMapLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
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
        return 'bg-purple-500'
      case 'break':
        return 'bg-orange-500'
      case 'offline':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return CheckCircle
      case 'occupied':
        return Users
      case 'cleaning':
        return Activity
      case 'maintenance':
        return AlertTriangle
      case 'on_job':
        return Target
      case 'traveling':
        return Car
      case 'break':
        return Clock
      case 'offline':
        return EyeOff
      default:
        return Eye
    }
  }

  // Interactive Map Component (placeholder for real map implementation)
  const InteractiveMap = () => (
    <div
      ref={mapRef}
      className={`relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg overflow-hidden ${
        isFullScreen ? 'h-screen' : 'h-96 lg:h-[600px]'
      }`}
    >
      {/* Map Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button
          onClick={() => setIsFullScreen(!isFullScreen)}
          size="sm"
          className="bg-black/50 hover:bg-black/70 text-white border-white/20"
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
        <Button
          onClick={loadOperationalData}
          size="sm"
          className="bg-black/50 hover:bg-black/70 text-white border-white/20"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-black/50 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Map Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mapLayers.map((layer) => {
              const IconComponent = layer.icon
              return (
                <div key={layer.id} className="flex items-center gap-2">
                  <Button
                    onClick={() => toggleLayer(layer.id)}
                    size="sm"
                    variant="ghost"
                    className={`p-1 ${layer.visible ? 'text-white' : 'text-gray-500'}`}
                  >
                    {layer.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>
                  <div
                    className={`w-3 h-3 rounded-full ${layer.visible ? '' : 'opacity-50'}`}
                    style={{ backgroundColor: layer.color }}
                  />
                  <span
                    className={`text-xs ${layer.visible ? 'text-white' : 'text-gray-500'}`}
                  >
                    {layer.name}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Properties on Map */}
      {mapLayers.find((l) => l.id === 'properties')?.visible &&
        properties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
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

      {/* Staff on Map */}
      {mapLayers.find((l) => l.id === 'staff')?.visible &&
        staff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${40 + index * 20}%`,
              top: `${50 + index * 10}%`,
            }}
            onClick={() => setSelectedStaff(member)}
          >
            <div
              className={`w-6 h-6 rounded-full ${getStatusColor(member.status)} flex items-center justify-center shadow-lg border-2 border-white`}
            >
              <Users className="w-3 h-3 text-white" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap">
              {member.name}
            </div>
          </motion.div>
        ))}

      {/* Map Center Indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-white rounded-full opacity-50" />
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 text-white text-xs bg-black/50 px-3 py-2 rounded">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  )

  return (
    <div
      className={`space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : ''}`}
    >
      {/* Header */}
      {!isFullScreen && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-400" />
              Operations Command Center
            </h2>
            <p className="text-gray-400 mt-1">
              Real-time operational overview with interactive mapping
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search properties, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
              />
            </div>
            <Button
              onClick={loadOperationalData}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Main Map Interface */}
      <div
        className={`grid gap-6 ${isFullScreen ? 'grid-cols-4 h-full' : 'grid-cols-1 lg:grid-cols-4'}`}
      >
        {/* Interactive Map */}
        <div className={`${isFullScreen ? 'col-span-3' : 'lg:col-span-3'}`}>
          <Card className="bg-gray-800 border-gray-700 h-full">
            <CardContent className="p-0">
              <InteractiveMap />
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Live Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Properties</span>
                <Badge className="bg-blue-600 text-white">
                  {properties.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Active Staff</span>
                <Badge className="bg-green-600 text-white">
                  {staff.filter((s) => s.status !== 'offline').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Urgent Tasks</span>
                <Badge className="bg-red-600 text-white">
                  {properties.reduce((sum, p) => sum + (p.urgentTasks || 0), 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Selected Item Details */}
          <AnimatePresence>
            {(selectedProperty || selectedStaff) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center justify-between">
                      {selectedProperty ? 'Property Details' : 'Staff Details'}
                      <Button
                        onClick={() => {
                          setSelectedProperty(null)
                          setSelectedStaff(null)
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedProperty && (
                      <>
                        <h3 className="text-white font-medium">
                          {selectedProperty.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {selectedProperty.address}
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(selectedProperty.status)}`}
                          />
                          <span className="text-gray-300 text-sm capitalize">
                            {selectedProperty.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Guests: {selectedProperty.currentGuests || 0}/
                          {selectedProperty.maxGuests}
                        </div>
                        {selectedProperty.urgentTasks && (
                          <Badge className="bg-red-600 text-white">
                            {selectedProperty.urgentTasks} urgent tasks
                          </Badge>
                        )}
                      </>
                    )}
                    {selectedStaff && (
                      <>
                        <h3 className="text-white font-medium">
                          {selectedStaff.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {selectedStaff.role}
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(selectedStaff.status)}`}
                          />
                          <span className="text-gray-300 text-sm capitalize">
                            {selectedStaff.status.replace('_', ' ')}
                          </span>
                        </div>
                        {selectedStaff.currentTask && (
                          <p className="text-gray-400 text-sm">
                            {selectedStaff.currentTask}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {selectedStaff.batteryLevel}%
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
