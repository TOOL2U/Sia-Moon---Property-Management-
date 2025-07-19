'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  MapPin,
  Users,
  Activity,
  Target,
  Car,
  Eye,
  EyeOff,
  Loader2,
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
    const interval = setInterval(loadOperationalData, 30000)
    return () => clearInterval(interval)
  }, [])

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

  // Simple Interactive Map Component
  const InteractiveMap = () => (
    <div
      ref={mapRef}
      className={`relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg overflow-hidden ${
        isFullScreen ? 'h-screen' : 'h-96 lg:h-[600px]'
      }`}
    >
      {/* Map Background */}
      <div className="absolute inset-0 opacity-20" />

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
