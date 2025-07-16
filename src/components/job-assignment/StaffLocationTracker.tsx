/**
 * Staff Location Tracking Dashboard
 * Real-time GPS tracking with map view and status monitoring
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Battery, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  Users,
  Activity
} from 'lucide-react'
import { 
  StaffLocation, 
  StaffStatus, 
  Geofence, 
  GeofenceAlert,
  LocationAccuracy 
} from '@/types/enhancedJobAssignment'
import { EnhancedJobAssignmentService } from '@/lib/services/enhancedJobAssignmentService'

interface StaffLocationTrackerProps {
  onStaffSelect?: (staffId: string) => void
}

export default function StaffLocationTracker({ onStaffSelect }: StaffLocationTrackerProps) {
  const [staffLocations, setStaffLocations] = useState<StaffLocation[]>([])
  const [filteredLocations, setFilteredLocations] = useState<StaffLocation[]>([])
  const [geofenceAlerts, setGeofenceAlerts] = useState<GeofenceAlert[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const mapRef = useRef<HTMLDivElement>(null)

  // Mock map component (replace with actual map library like Google Maps or Mapbox)
  const MapView = () => (
    <div 
      ref={mapRef}
      className="w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700"
    >
      <div className="text-center text-gray-400">
        <MapPin className="w-12 h-12 mx-auto mb-2" />
        <p className="text-sm">Interactive Map View</p>
        <p className="text-xs">Real-time staff locations will appear here</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {staffLocations.slice(0, 4).map((staff) => (
            <div key={staff.staffId} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(staff.status)}`} />
              <span className="truncate">{staff.staffName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const getStatusColor = (status: StaffStatus): string => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'on_job': return 'bg-blue-500'
      case 'offline': return 'bg-gray-500'
      case 'break': return 'bg-yellow-500'
      case 'emergency': return 'bg-red-500'
      case 'traveling': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: StaffStatus): string => {
    switch (status) {
      case 'available': return 'Available'
      case 'on_job': return 'On Job'
      case 'offline': return 'Offline'
      case 'break': return 'On Break'
      case 'emergency': return 'Emergency'
      case 'traveling': return 'Traveling'
      default: return 'Unknown'
    }
  }

  const getAccuracyColor = (accuracy: LocationAccuracy): string => {
    switch (accuracy) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatLastSeen = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Load staff locations
  useEffect(() => {
    loadStaffLocations()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadStaffLocations()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Filter locations based on search and status
  useEffect(() => {
    let filtered = staffLocations

    if (searchQuery) {
      filtered = filtered.filter(staff =>
        staff.staffName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(staff => staff.status === statusFilter)
    }

    setFilteredLocations(filtered)
  }, [staffLocations, searchQuery, statusFilter])

  const loadStaffLocations = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with real Firebase query to get staff location data
      // For now, load from staff_accounts collection and generate location data
      const response = await fetch('/api/admin/staff-accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch staff accounts')
      }

      const { staffAccounts } = await response.json()

      // Transform staff accounts to location format
      const locationData: StaffLocation[] = staffAccounts
        .filter((staff: any) => staff.status === 'active')
        .map((staff: any) => ({
          staffId: staff.id,
          staffName: staff.name,
          currentLocation: {
            latitude: -8.6705 + (Math.random() - 0.5) * 0.1, // TODO: Track actual location
            longitude: 115.2126 + (Math.random() - 0.5) * 0.1, // TODO: Track actual location
            accuracy: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
            timestamp: new Date(Date.now() - Math.random() * 60 * 60000), // TODO: Track actual timestamp
            address: 'Location tracking not implemented', // TODO: Reverse geocode actual address
            isInsideGeofence: Math.random() > 0.3 // TODO: Calculate actual geofence status
          },
          lastUpdated: new Date(Date.now() - Math.random() * 60 * 60000),
          status: ['available', 'on_job', 'traveling', 'break'][Math.floor(Math.random() * 4)] as any, // TODO: Track actual status
          currentJobId: Math.random() > 0.5 ? `job-${Math.floor(Math.random() * 100)}` : undefined, // TODO: Track actual job
          batteryLevel: Math.floor(Math.random() * 100), // TODO: Track actual battery level
          isOnline: Math.random() > 0.2 // TODO: Track actual online status
        }))

      setStaffLocations(locationData)
      setLastUpdate(new Date())
      
      // TODO: Load real geofence alerts from Firebase
      // For now, generate sample alerts based on location data
      const alertData: GeofenceAlert[] = locationData
        .filter(() => Math.random() > 0.8) // Only some staff have alerts
        .map((staff, index) => ({
          id: `alert-${index}`,
          staffId: staff.staffId,
          staffName: staff.staffName,
          geofenceId: `geo-${index}`,
          propertyName: 'Property Name TBD', // TODO: Get actual property name
          type: Math.random() > 0.5 ? 'exit' : 'entry' as 'exit' | 'entry',
          timestamp: new Date(Date.now() - Math.random() * 60 * 60000),
          location: staff.currentLocation,
          acknowledged: false
        }))

      setGeofenceAlerts(alertData)
      
    } catch (error) {
      console.error('Error loading staff locations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadStaffLocations()
  }

  const handleStaffClick = (staffId: string) => {
    setSelectedStaff(staffId)
    onStaffSelect?.(staffId)
  }

  const acknowledgeAlert = (alertId: string) => {
    setGeofenceAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  const getStatusStats = () => {
    const stats = {
      available: 0,
      on_job: 0,
      offline: 0,
      break: 0,
      emergency: 0,
      traveling: 0
    }
    
    staffLocations.forEach(staff => {
      stats[staff.status]++
    })
    
    return stats
  }

  const statusStats = getStatusStats()
  const unacknowledgedAlerts = geofenceAlerts.filter(alert => !alert.acknowledged)

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Location Tracking</h2>
          <p className="text-gray-400">Real-time GPS monitoring and status updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-400 border-green-400">
            <Activity className="w-3 h-3 mr-1" />
            {staffLocations.filter(s => s.isOnline).length} Online
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-gray-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm text-gray-400">Available</p>
                <p className="text-xl font-bold text-white">{statusStats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm text-gray-400">On Job</p>
                <p className="text-xl font-bold text-white">{statusStats.on_job}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm text-gray-400">On Break</p>
                <p className="text-xl font-bold text-white">{statusStats.break}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <div>
                <p className="text-sm text-gray-400">Traveling</p>
                <p className="text-xl font-bold text-white">{statusStats.traveling}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <div>
                <p className="text-sm text-gray-400">Offline</p>
                <p className="text-xl font-bold text-white">{statusStats.offline}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-sm text-gray-400">Emergency</p>
                <p className="text-xl font-bold text-white">{statusStats.emergency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geofence Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="bg-red-900/20 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Geofence Alerts ({unacknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-red-900/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{alert.staffName}</p>
                    <p className="text-sm text-gray-300">
                      {alert.type === 'exit' ? 'Left' : 'Entered'} {alert.propertyName}
                    </p>
                    <p className="text-xs text-gray-400">{formatLastSeen(alert.timestamp)}</p>
                  </div>
                  <Button
                    onClick={() => acknowledgeAlert(alert.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/20"
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map View */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Live Location Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapView />
            <div className="mt-4 text-xs text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Status ({filteredLocations.length})
            </CardTitle>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StaffStatus | 'all')}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="on_job">On Job</option>
                <option value="break">On Break</option>
                <option value="traveling">Traveling</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLocations.map((staff) => (
                <div
                  key={staff.staffId}
                  onClick={() => handleStaffClick(staff.staffId)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedStaff === staff.staffId
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(staff.status)}`} />
                        <span className="font-medium text-white">{staff.staffName}</span>
                        {staff.isOnline ? (
                          <Wifi className="w-4 h-4 text-green-400" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Badge variant="outline" className="text-xs">
                            {getStatusText(staff.status)}
                          </Badge>
                          {staff.currentJobId && (
                            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                              Job: {staff.currentJobId}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{staff.currentLocation.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastSeen(staff.lastUpdated)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Navigation className={`w-3 h-3 ${getAccuracyColor(staff.currentLocation.accuracy)}`} />
                            {staff.currentLocation.accuracy}
                          </div>
                          
                          {staff.batteryLevel && (
                            <div className="flex items-center gap-1">
                              <Battery className={`w-3 h-3 ${
                                staff.batteryLevel > 50 ? 'text-green-400' : 
                                staff.batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'
                              }`} />
                              {staff.batteryLevel}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredLocations.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No staff members found</p>
                  {searchQuery && (
                    <p className="text-sm">Try adjusting your search or filters</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
