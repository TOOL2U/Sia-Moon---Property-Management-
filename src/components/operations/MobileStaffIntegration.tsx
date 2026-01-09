/**
 * Mobile Staff Integration - Phase 3
 * Mobile-optimized interface for staff task management
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle, 
  AlertTriangle,
  Camera,
  MessageSquare,
  User,
  Home,
  Wrench,
  Calendar
} from 'lucide-react'

import TaskDashboard from './TaskDashboard'

interface MobileStaffProps {
  staffMember: {
    id: string
    name: string
    role: 'cleaner' | 'inspector' | 'maintenance'
    phone: string
    currentLocation?: {
      lat: number
      lng: number
      address: string
    }
  }
  onLocationUpdate?: (location: { lat: number; lng: number }) => void
  onTaskUpdate?: (taskId: string, updates: any) => void
}

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  variant?: 'default' | 'destructive' | 'outline'
}

export default function MobileStaffIntegration({
  staffMember,
  onLocationUpdate,
  onTaskUpdate
}: MobileStaffProps) {
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [showEmergencyContact, setShowEmergencyContact] = useState(false)

  // Request location access on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position)
          setLocationEnabled(true)
          onLocationUpdate?.({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error("Location access denied:", error)
          setLocationEnabled(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [onLocationUpdate])

  // Update location every 5 minutes
  useEffect(() => {
    if (!locationEnabled) return
    
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position)
          onLocationUpdate?.({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => console.error("Location update failed:", error)
      )
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [locationEnabled, onLocationUpdate])

  const emergencyContacts = [
    { name: 'Operations Manager', phone: '+1 (305) 555-0100' },
    { name: 'Maintenance Emergency', phone: '+1 (305) 555-0101' },
    { name: 'Guest Services', phone: '+1 (305) 555-0102' },
    { name: '911 Emergency', phone: '911' }
  ]

  const quickActions: QuickAction[] = [
    {
      id: 'emergency',
      label: 'Emergency',
      icon: AlertTriangle,
      variant: 'destructive',
      action: () => setShowEmergencyContact(true)
    },
    {
      id: 'photo',
      label: 'Quick Photo',
      icon: Camera,
      action: () => {
        // Open camera for quick photo documentation
        console.log('📸 Opening camera for quick photo')
      }
    },
    {
      id: 'message',
      label: 'Send Message',
      icon: MessageSquare,
      action: () => {
        // Open messaging interface
        console.log('💬 Opening messaging interface')
      }
    },
    {
      id: 'navigate',
      label: 'Navigation',
      icon: Navigation,
      action: () => {
        // Open navigation to next property
        console.log('🗺️ Opening navigation')
      }
    }
  ]

  const handleCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self')
  }

  const formatLocation = () => {
    if (!currentLocation) return 'Location unavailable'
    
    return `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
  }

  const getTaskCountForRole = () => {
    // This would typically come from your task management system
    const counts = {
      cleaner: { pending: 3, assigned: 2, in_progress: 1 },
      inspector: { pending: 1, assigned: 1, in_progress: 0 },
      maintenance: { pending: 2, assigned: 1, in_progress: 1 }
    }
    
    return counts[staffMember.role] || { pending: 0, assigned: 0, in_progress: 0 }
  }

  const taskCounts = getTaskCountForRole()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Sia Moon PMS</h1>
            <p className="text-sm text-gray-600">
              {staffMember.name} • {staffMember.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {locationEnabled ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                📍 Live
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                📍 Off
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmergencyContact(true)}
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Location Status */}
      {locationEnabled && currentLocation && (
        <div className="bg-blue-50 border-b p-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <MapPin className="w-4 h-4" />
            <span>Current Location: {formatLocation()}</span>
            <span className="ml-auto text-xs">
              {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Task Summary */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{taskCounts.pending}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{taskCounts.assigned}</div>
                <div className="text-xs text-gray-500">Assigned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{taskCounts.in_progress}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <h3 className="font-medium mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              onClick={action.action}
              className="h-16 flex-col gap-1"
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Task Dashboard */}
      <div className="px-4">
        <TaskDashboard
          currentUser={{
            id: staffMember.id,
            name: staffMember.name,
            role: staffMember.role === 'cleaner' ? 'cleaner' : 
                  staffMember.role === 'inspector' ? 'inspector' : 'staff'
          }}
          onTaskUpdate={onTaskUpdate}
        />
      </div>

      {/* Emergency Contact Modal */}
      {showEmergencyContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Emergency Contacts</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmergencyContact(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.phone}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCall(contact.phone)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowEmergencyContact(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
        <div className="grid grid-cols-4 gap-1">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-16">
            <Home className="w-5 h-5" />
            <span className="text-xs">Tasks</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-16">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Schedule</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-16">
            <Camera className="w-5 h-5" />
            <span className="text-xs">Photos</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-16">
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Bottom padding for fixed navigation */}
      <div className="h-20"></div>
    </div>
  )
}

// Companion component for admin monitoring of mobile staff
export function MobileStaffMonitoring() {
  const [staffMembers] = useState([
    {
      id: 'staff_1',
      name: 'Maria Garcia',
      role: 'cleaner' as const,
      status: 'active',
      currentTask: 'Cleaning - Villa Seaside',
      location: { lat: 25.7617, lng: -80.1918, address: '123 Beach Dr, Miami, FL' },
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    {
      id: 'staff_2',
      name: 'Carlos Rodriguez',
      role: 'cleaner' as const,
      status: 'available',
      currentTask: null,
      location: { lat: 25.7749, lng: -80.1950, address: '456 Ocean Ave, Miami, FL' },
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      id: 'staff_3',
      name: 'Ana Martinez',
      role: 'inspector' as const,
      status: 'active',
      currentTask: 'Inspection - Ocean View Condo',
      location: { lat: 25.7663, lng: -80.1898, address: '789 Bay St, Miami, FL' },
      lastUpdate: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'available': return 'bg-blue-100 text-blue-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile Staff Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium">{staff.name}</div>
                  <div className="text-sm text-gray-500">{staff.role}</div>
                  {staff.currentTask && (
                    <div className="text-xs text-blue-600">{staff.currentTask}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(staff.status)}>
                  {staff.status}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  <MapPin className="inline w-3 h-3 mr-1" />
                  {formatTimeAgo(staff.lastUpdate)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs mt-1"
                  onClick={() => window.open(`tel:${staff.id}`, '_self')}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
