/**
 * Mobile Integration Layer
 * Handles mobile app compatibility and real-time sync
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Smartphone,
  Wifi,
  WifiOff,
  Sync,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Download,
  Upload,
  Activity,
  Users,
  MessageSquare
} from 'lucide-react'

interface MobileDevice {
  id: string
  staffId: string
  staffName: string
  deviceType: 'android' | 'ios'
  appVersion: string
  isOnline: boolean
  lastSync: Date
  batteryLevel: number
  pendingUpdates: number
  unreadNotifications: number
}

interface SyncStatus {
  isConnected: boolean
  lastSync: Date
  pendingJobs: number
  pendingUpdates: number
  syncErrors: number
}

interface MobileIntegrationLayerProps {
  onSendNotification?: (staffId: string, message: string) => void
  onForcSync?: (deviceId: string) => void
}

export default function MobileIntegrationLayer({ 
  onSendNotification, 
  onForcSync 
}: MobileIntegrationLayerProps) {
  const [devices, setDevices] = useState<MobileDevice[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: true,
    lastSync: new Date(),
    pendingJobs: 0,
    pendingUpdates: 0,
    syncErrors: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMobileDevices()
    
    // Set up real-time sync monitoring
    const interval = setInterval(() => {
      updateSyncStatus()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadMobileDevices = async () => {
    try {
      setIsLoading(true)
      
      // Mock mobile device data
      const mockDevices: MobileDevice[] = [
        {
          id: 'device-001',
          staffId: 'staff-001',
          staffName: 'Maria Santos',
          deviceType: 'android',
          appVersion: '2.1.3',
          isOnline: true,
          lastSync: new Date(Date.now() - 2 * 60000), // 2 minutes ago
          batteryLevel: 85,
          pendingUpdates: 0,
          unreadNotifications: 2
        },
        {
          id: 'device-002',
          staffId: 'staff-002',
          staffName: 'Carlos Rodriguez',
          deviceType: 'ios',
          appVersion: '2.1.3',
          isOnline: true,
          lastSync: new Date(Date.now() - 5 * 60000), // 5 minutes ago
          batteryLevel: 92,
          pendingUpdates: 1,
          unreadNotifications: 0
        },
        {
          id: 'device-003',
          staffId: 'staff-003',
          staffName: 'Ana Silva',
          deviceType: 'android',
          appVersion: '2.1.2',
          appVersion: '2.1.2',
          isOnline: false,
          lastSync: new Date(Date.now() - 45 * 60000), // 45 minutes ago
          batteryLevel: 23,
          pendingUpdates: 3,
          unreadNotifications: 5
        }
      ]
      
      setDevices(mockDevices)
      
      // Update sync status
      setSyncStatus({
        isConnected: true,
        lastSync: new Date(),
        pendingJobs: mockDevices.reduce((sum, device) => sum + device.pendingUpdates, 0),
        pendingUpdates: mockDevices.filter(d => !d.isOnline).length,
        syncErrors: mockDevices.filter(d => d.lastSync < new Date(Date.now() - 60 * 60000)).length
      })
      
    } catch (error) {
      console.error('Error loading mobile devices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSyncStatus = () => {
    // Simulate real-time sync status updates
    setSyncStatus(prev => ({
      ...prev,
      lastSync: new Date(),
      pendingJobs: Math.max(0, prev.pendingJobs - 1)
    }))
  }

  const handleSendNotification = async (staffId: string) => {
    try {
      const message = "New job assignment available. Please check your mobile app."
      onSendNotification?.(staffId, message)
      
      // Update device notification count
      setDevices(prev => prev.map(device => 
        device.staffId === staffId 
          ? { ...device, unreadNotifications: device.unreadNotifications + 1 }
          : device
      ))
      
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  const handleForceSync = async (deviceId: string) => {
    try {
      onForcSync?.(deviceId)
      
      // Update device sync status
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, lastSync: new Date(), pendingUpdates: 0 }
          : device
      ))
      
    } catch (error) {
      console.error('Error forcing sync:', error)
    }
  }

  const formatLastSync = (date: Date): string => {
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

  const getDeviceIcon = (deviceType: 'android' | 'ios') => {
    return <Smartphone className="w-4 h-4" />
  }

  const getBatteryColor = (level: number): string => {
    if (level > 50) return 'text-green-400'
    if (level > 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mobile Integration</h2>
          <p className="text-gray-400">Real-time mobile app sync and notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={syncStatus.isConnected ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}>
            {syncStatus.isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
          <Button
            onClick={loadMobileDevices}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-gray-600"
          >
            <Sync className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Connected Devices</p>
                <p className="text-2xl font-bold text-white">{devices.filter(d => d.isOnline).length}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Updates</p>
                <p className="text-2xl font-bold text-yellow-400">{syncStatus.pendingJobs}</p>
              </div>
              <Upload className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sync Errors</p>
                <p className="text-2xl font-bold text-red-400">{syncStatus.syncErrors}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last Sync</p>
                <p className="text-lg font-bold text-white">{formatLastSync(syncStatus.lastSync)}</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mobile Devices ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {getDeviceIcon(device.deviceType)}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-800 ${
                        device.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{device.staffName}</h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {device.deviceType} • v{device.appVersion}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={device.isOnline ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-500/20 text-gray-400 border-gray-500/50'}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    {device.unreadNotifications > 0 && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                        {device.unreadNotifications} notifications
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-400">Last Sync</p>
                    <p className="text-white font-medium">{formatLastSync(device.lastSync)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Battery</p>
                    <p className={`font-medium ${getBatteryColor(device.batteryLevel)}`}>
                      {device.batteryLevel}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Pending Updates</p>
                    <p className="text-white font-medium">{device.pendingUpdates}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Notifications</p>
                    <p className="text-white font-medium">{device.unreadNotifications}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendNotification(device.staffId)}
                    size="sm"
                    variant="outline"
                    className="border-blue-500 text-blue-400"
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Notify
                  </Button>
                  <Button
                    onClick={() => handleForceSync(device.id)}
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-400"
                    disabled={!device.isOnline}
                  >
                    <Sync className="w-3 h-3 mr-1" />
                    Force Sync
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500 text-purple-400"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            ))}
            
            {devices.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No mobile devices found</h3>
                <p className="text-sm">Staff members need to install and login to the mobile app</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
