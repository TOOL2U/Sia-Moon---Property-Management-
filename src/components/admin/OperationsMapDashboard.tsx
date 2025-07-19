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
  Loader2,
  MapPin,
  Maximize2,
  MessageSquare,
  Minimize2,
  Phone,
  RefreshCw,
  Search,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PropertyLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'emergency'
  currentGuests?: number
  maxGuests: number
  checkInToday?: boolean
  checkOutToday?: boolean
  urgentTasks?: number
  revenue?: {
    daily: number
    weekly: number
    monthly: number
  }
  occupancyRate?: number
  lastCleaned?: Date
  nextMaintenance?: Date
  guestSatisfaction?: number
  emergencyContacts?: string[]
  amenities?: string[]
  pricePerNight?: number
}

interface StaffLocation {
  id: string
  name: string
  role: string
  latitude: number
  longitude: number
  status:
    | 'available'
    | 'on_job'
    | 'traveling'
    | 'break'
    | 'offline'
    | 'emergency'
  currentTask?: string
  batteryLevel: number
  lastUpdate: Date
  isOnline: boolean
  accuracy?: number
  speed?: number
  heading?: number
  assignedProperties?: string[]
  skills?: string[]
  performance?: {
    tasksCompleted: number
    averageRating: number
    onTimeRate: number
  }
  emergencyContact?: string
  shift?: {
    start: string
    end: string
  }
  route?: {
    destination: string
    eta: number
    distance: number
  }
}

interface MapLayer {
  id: string
  name: string
  visible: boolean
  color: string
  icon: any
  count?: number
}

interface ActiveTask {
  id: string
  title: string
  description: string
  propertyId: string
  staffId?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimatedDuration: number
  actualDuration?: number
  location: {
    latitude: number
    longitude: number
  }
  createdAt: Date
  dueDate: Date
  completedAt?: Date
}

interface OperationalAlert {
  id: string
  type: 'emergency' | 'maintenance' | 'guest' | 'staff' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  propertyId?: string
  staffId?: string
  location?: {
    latitude: number
    longitude: number
  }
  createdAt: Date
  acknowledged: boolean
  resolvedAt?: Date
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
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyLocation | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffLocation | null>(null)
  const [selectedTask, setSelectedTask] = useState<ActiveTask | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<
    'all' | 'properties' | 'staff' | 'tasks' | 'alerts'
  >('all')
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    {
      id: 'properties',
      name: 'Properties',
      visible: true,
      color: '#3B82F6',
      icon: Home,
      count: 0,
    },
    {
      id: 'staff',
      name: 'Staff Locations',
      visible: true,
      color: '#10B981',
      icon: Users,
      count: 0,
    },
    {
      id: 'tasks',
      name: 'Active Tasks',
      visible: true,
      color: '#F59E0B',
      icon: Activity,
      count: 0,
    },
    {
      id: 'alerts',
      name: 'Alerts',
      visible: true,
      color: '#EF4444',
      icon: AlertTriangle,
      count: 0,
    },
    {
      id: 'routes',
      name: 'Routes',
      visible: false,
      color: '#8B5CF6',
      icon: Navigation,
      count: 0,
    },
  ])
  const [properties, setProperties] = useState<PropertyLocation[]>([])
  const [staff, setStaff] = useState<StaffLocation[]>([])
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([])
  const [alerts, setAlerts] = useState<OperationalAlert[]>([])
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
  const [autoRefresh, setAutoRefresh] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)

  // Enhanced data loading with auto-refresh
  useEffect(() => {
    loadOperationalData()
    if (autoRefresh) {
      const interval = setInterval(loadOperationalData, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadOperationalData = async () => {
    setIsLoading(true)
    try {
      // Enhanced mock properties data with comprehensive information
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
          urgentTasks: 0,
          revenue: { daily: 850, weekly: 5950, monthly: 25500 },
          occupancyRate: 85,
          lastCleaned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          guestSatisfaction: 4.8,
          amenities: ['Pool', 'WiFi', 'Kitchen', 'Beach Access'],
          pricePerNight: 850,
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
          revenue: { daily: 0, weekly: 7200, monthly: 28800 },
          occupancyRate: 72,
          lastCleaned: new Date(),
          nextMaintenance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          guestSatisfaction: 4.6,
          amenities: ['Pool', 'WiFi', 'Kitchen', 'Ocean View', 'Gym'],
          pricePerNight: 1200,
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
          urgentTasks: 0,
          revenue: { daily: 0, weekly: 3500, monthly: 14000 },
          occupancyRate: 58,
          lastCleaned: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          guestSatisfaction: 4.9,
          amenities: ['WiFi', 'Kitchen', 'Mountain View', 'Fireplace'],
          pricePerNight: 650,
        },
        {
          id: '4',
          name: 'Beachfront Luxury',
          address: '321 Coastal Drive, Phuket',
          latitude: 7.8904,
          longitude: 98.4023,
          status: 'maintenance',
          currentGuests: 0,
          maxGuests: 10,
          urgentTasks: 1,
          revenue: { daily: 0, weekly: 0, monthly: 35000 },
          occupancyRate: 0,
          lastCleaned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(),
          guestSatisfaction: 4.7,
          amenities: [
            'Pool',
            'WiFi',
            'Kitchen',
            'Beach Access',
            'Spa',
            'Butler',
          ],
          pricePerNight: 2500,
        },
      ]

      // Enhanced mock staff data with comprehensive tracking
      const mockStaff: StaffLocation[] = [
        {
          id: '1',
          name: 'Maria Santos',
          role: 'Housekeeper',
          latitude: 7.8824,
          longitude: 98.3943,
          status: 'on_job',
          currentTask: 'Deep cleaning Ocean View Villa',
          batteryLevel: 85,
          lastUpdate: new Date(),
          isOnline: true,
          accuracy: 5,
          speed: 0,
          heading: 180,
          assignedProperties: ['1', '2'],
          skills: ['Deep Cleaning', 'Laundry', 'Inventory Management'],
          performance: {
            tasksCompleted: 156,
            averageRating: 4.8,
            onTimeRate: 95,
          },
          emergencyContact: '+66-123-456-789',
          shift: { start: '08:00', end: '16:00' },
        },
        {
          id: '2',
          name: 'Carlos Rodriguez',
          role: 'Maintenance',
          latitude: 7.8774,
          longitude: 98.3893,
          status: 'traveling',
          currentTask: 'Pool maintenance at Beachfront Luxury',
          batteryLevel: 62,
          lastUpdate: new Date(),
          isOnline: true,
          accuracy: 8,
          speed: 25,
          heading: 45,
          assignedProperties: ['3', '4'],
          skills: ['Plumbing', 'Electrical', 'Pool Maintenance', 'HVAC'],
          performance: {
            tasksCompleted: 89,
            averageRating: 4.9,
            onTimeRate: 98,
          },
          emergencyContact: '+66-987-654-321',
          shift: { start: '07:00', end: '15:00' },
          route: { destination: 'Beachfront Luxury', eta: 12, distance: 2.3 },
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
          accuracy: 3,
          speed: 0,
          heading: 0,
          assignedProperties: ['1', '2', '3', '4'],
          skills: [
            'Guest Communication',
            'Problem Resolution',
            'Concierge Services',
          ],
          performance: {
            tasksCompleted: 234,
            averageRating: 4.9,
            onTimeRate: 99,
          },
          emergencyContact: '+66-555-123-456',
          shift: { start: '09:00', end: '17:00' },
        },
        {
          id: '4',
          name: 'James Wilson',
          role: 'Security',
          latitude: 7.8854,
          longitude: 98.3973,
          status: 'on_job',
          currentTask: 'Night patrol - All properties',
          batteryLevel: 78,
          lastUpdate: new Date(),
          isOnline: true,
          accuracy: 4,
          speed: 5,
          heading: 270,
          assignedProperties: ['1', '2', '3', '4'],
          skills: ['Security Patrol', 'Emergency Response', 'First Aid'],
          performance: {
            tasksCompleted: 67,
            averageRating: 4.7,
            onTimeRate: 96,
          },
          emergencyContact: '+66-777-888-999',
          shift: { start: '22:00', end: '06:00' },
        },
      ]

      // Mock active tasks
      const mockTasks: ActiveTask[] = [
        {
          id: '1',
          title: 'Deep Clean Ocean View Villa',
          description:
            'Complete deep cleaning including all bathrooms, kitchen, and bedrooms',
          propertyId: '2',
          staffId: '1',
          priority: 'high',
          status: 'in_progress',
          estimatedDuration: 180,
          actualDuration: 120,
          location: { latitude: 7.8854, longitude: 98.3973 },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
        },
        {
          id: '2',
          title: 'Pool Maintenance',
          description:
            'Check chemical levels, clean filters, and test equipment',
          propertyId: '4',
          staffId: '2',
          priority: 'medium',
          status: 'pending',
          estimatedDuration: 90,
          location: { latitude: 7.8904, longitude: 98.4023 },
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      ]

      // Mock alerts
      const mockAlerts: OperationalAlert[] = [
        {
          id: '1',
          type: 'maintenance',
          severity: 'high',
          title: 'HVAC System Issue',
          message: 'Air conditioning unit not responding at Beachfront Luxury',
          propertyId: '4',
          location: { latitude: 7.8904, longitude: 98.4023 },
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
          acknowledged: false,
        },
        {
          id: '2',
          type: 'guest',
          severity: 'medium',
          title: 'Late Check-out Request',
          message: 'Guest at Villa Sunset Paradise requesting 2-hour extension',
          propertyId: '1',
          location: { latitude: 7.8804, longitude: 98.3923 },
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          acknowledged: true,
        },
      ]

      // Calculate live metrics
      const metrics: LiveMetrics = {
        totalProperties: mockProperties.length,
        occupiedProperties: mockProperties.filter(
          (p) => p.status === 'occupied'
        ).length,
        availableProperties: mockProperties.filter(
          (p) => p.status === 'available'
        ).length,
        maintenanceProperties: mockProperties.filter(
          (p) => p.status === 'maintenance'
        ).length,
        activeStaff: mockStaff.filter((s) => s.isOnline).length,
        activeTasks: mockTasks.filter((t) => t.status !== 'completed').length,
        pendingAlerts: mockAlerts.filter((a) => !a.acknowledged).length,
        dailyRevenue: mockProperties.reduce(
          (sum, p) => sum + (p.revenue?.daily || 0),
          0
        ),
        occupancyRate: Math.round(
          mockProperties.reduce((sum, p) => sum + (p.occupancyRate || 0), 0) /
            mockProperties.length
        ),
        averageGuestSatisfaction:
          Math.round(
            (mockProperties.reduce(
              (sum, p) => sum + (p.guestSatisfaction || 0),
              0
            ) /
              mockProperties.length) *
              10
          ) / 10,
      }

      // Update layer counts
      setMapLayers((prev) =>
        prev.map((layer) => ({
          ...layer,
          count:
            layer.id === 'properties'
              ? mockProperties.length
              : layer.id === 'staff'
                ? mockStaff.length
                : layer.id === 'tasks'
                  ? mockTasks.length
                  : layer.id === 'alerts'
                    ? mockAlerts.length
                    : layer.id === 'routes'
                      ? mockStaff.filter((s) => s.route).length
                      : 0,
        }))
      )

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
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant="outline"
                className={`border-gray-700 ${autoRefresh ? 'text-green-400 border-green-600' : 'text-gray-300'} hover:bg-gray-800`}
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto
              </Button>
              <Button
                onClick={loadOperationalData}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Live Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Properties</p>
                    <p className="text-lg font-bold text-white">
                      {liveMetrics.totalProperties}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Active Staff</p>
                    <p className="text-lg font-bold text-white">
                      {liveMetrics.activeStaff}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Active Tasks</p>
                    <p className="text-lg font-bold text-white">
                      {liveMetrics.activeTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-400">Alerts</p>
                    <p className="text-lg font-bold text-white">
                      {liveMetrics.pendingAlerts}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Daily Revenue</p>
                    <p className="text-lg font-bold text-white">
                      ${liveMetrics.dailyRevenue}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Occupancy</p>
                    <p className="text-lg font-bold text-white">
                      {liveMetrics.occupancyRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Operations Interface */}
      <div
        className={`grid gap-6 ${isFullScreen ? 'grid-cols-6 h-full' : 'grid-cols-1 lg:grid-cols-6'}`}
      >
        {/* Interactive Map */}
        <div className={`${isFullScreen ? 'col-span-3' : 'lg:col-span-3'}`}>
          <Card className="bg-gray-800 border-gray-700 h-full">
            <CardContent className="p-0">
              <InteractiveMap />
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <div className={`${isFullScreen ? 'col-span-2' : 'lg:col-span-2'}`}>
          <LiveActivityFeed isFullScreen={isFullScreen} />
        </div>

        {/* Enhanced Control Panel */}
        <div className="space-y-4">
          <Tabs defaultValue="status" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger
                value="status"
                className="text-gray-300 data-[state=active]:text-white text-xs"
              >
                Status
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="text-gray-300 data-[state=active]:text-white text-xs"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="text-gray-300 data-[state=active]:text-white text-xs"
              >
                Alerts
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="text-gray-300 data-[state=active]:text-white text-xs"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4">
              {/* Quick Stats */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Live Status
                  </CardTitle>
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
                    <span className="text-gray-400 text-sm">Active Tasks</span>
                    <Badge className="bg-yellow-600 text-white">
                      {activeTasks.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      Pending Alerts
                    </span>
                    <Badge className="bg-red-600 text-white">
                      {alerts.filter((a) => !a.acknowledged).length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {/* Analytics Panel */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Revenue Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">
                        Daily Revenue
                      </span>
                      <span className="text-white font-bold">
                        ${liveMetrics.dailyRevenue}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">
                        Occupancy Rate
                      </span>
                      <span className="text-white font-bold">
                        {liveMetrics.occupancyRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">
                        Guest Satisfaction
                      </span>
                      <span className="text-white font-bold">
                        {liveMetrics.averageGuestSatisfaction}
                      </span>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div className="space-y-2 pt-2 border-t border-gray-700">
                    <h4 className="text-xs font-medium text-gray-300">
                      Performance
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">
                          Staff Efficiency
                        </span>
                        <Badge className="bg-green-600 text-white text-xs">
                          92%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">
                          Task Completion
                        </span>
                        <Badge className="bg-blue-600 text-white text-xs">
                          88%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {/* Alerts Panel */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.filter((a) => !a.acknowledged).length === 0 ? (
                    <p className="text-gray-400 text-xs">No active alerts</p>
                  ) : (
                    alerts
                      .filter((a) => !a.acknowledged)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className="p-2 bg-gray-700 rounded border-l-2 border-red-500"
                        >
                          <p className="text-white text-xs font-medium">
                            {alert.title}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={`text-xs ${
                                alert.severity === 'critical'
                                  ? 'bg-red-600'
                                  : alert.severity === 'high'
                                    ? 'bg-orange-600'
                                    : alert.severity === 'medium'
                                      ? 'bg-yellow-600'
                                      : 'bg-gray-600'
                              } text-white`}
                            >
                              {alert.severity}
                            </Badge>
                            <span className="text-gray-400 text-xs">
                              {Math.round(
                                (Date.now() - alert.createdAt.getTime()) / 60000
                              )}
                              m ago
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {/* Activity Controls */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Activity Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-300">
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        onClick={() => console.log('Create task')}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        New Task
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white text-xs"
                        onClick={() => console.log('Emergency alert')}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Alert
                      </Button>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="space-y-2 pt-2 border-t border-gray-700">
                    <h4 className="text-xs font-medium text-gray-300">
                      Today's Activity
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">
                          Staff Check-ins
                        </span>
                        <Badge className="bg-green-600 text-white text-xs">
                          12
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">
                          Tasks Completed
                        </span>
                        <Badge className="bg-blue-600 text-white text-xs">
                          8
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">
                          Guest Arrivals
                        </span>
                        <Badge className="bg-purple-600 text-white text-xs">
                          3
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
