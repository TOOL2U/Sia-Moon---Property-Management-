'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import { Property, Booking } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  RefreshCw as Sync,
  Calendar,
  ExternalLink,
  Settings,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PropertySyncConfig {
  id: string
  name: string
  sync_enabled?: boolean
  airbnb_ical_url?: string
  booking_com_ical_url?: string
  last_sync?: string
}

interface SyncResult {
  success: boolean
  propertyId: string
  totalBookingsFound: number
  newBookingsCreated: number
  existingBookingsUpdated: number
  errors: string[]
  syncDurationMs: number
  cleaningTasksCreated: number
}

export default function BookingSyncDashboard() {
  const { profile: user } = useAuth()
  const router = useRouter()
  
  const [properties, setProperties] = useState<PropertySyncConfig[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PropertySyncConfig>>({})

  useEffect(() => {
    // Check if user is admin/staff
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Admin access required.')
      router.push('/dashboard/client')
      return
    }
    
    if (user) {
      loadData()
    }
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [propertiesResult, bookingsResult] = await Promise.all([
        DatabaseService.getAllProperties(),
        DatabaseService.getAllBookings()
      ])

      if (propertiesResult.error) {
        console.error('Error loading properties:', propertiesResult.error)
        toast.error('Failed to load properties')
      } else {
        setProperties(propertiesResult.data || [])
      }

      if (bookingsResult.error) {
        console.error('Error loading bookings:', bookingsResult.error)
        toast.error('Failed to load bookings')
      } else {
        setBookings(bookingsResult.data || [])
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncProperty = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    if (!property) return

    if (!property.airbnb_ical_url && !property.booking_com_ical_url) {
      toast.error('No iCal URLs configured for this property')
      return
    }

    try {
      setSyncing(propertyId)
      
      const response = await fetch(`/api/booking-sync/property/${propertyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airbnbICalUrl: property.airbnb_ical_url,
          bookingComICalUrl: property.booking_com_ical_url,
          enableAutoCleaningTasks: true
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setSyncResults(prev => [result.result, ...prev.slice(0, 9)]) // Keep last 10 results
        await loadData() // Refresh data
      } else {
        toast.error(result.error || 'Sync failed')
      }

    } catch (error) {
      console.error('Error syncing property:', error)
      toast.error('Failed to sync property')
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing('all')
      
      const response = await fetch('/api/booking-sync/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Synced ${result.summary.successful_syncs}/${result.summary.total_properties} properties`)
        setSyncResults(result.results.slice(0, 10)) // Keep last 10 results
        await loadData() // Refresh data
      } else {
        toast.error(result.error || 'Sync failed')
      }

    } catch (error) {
      console.error('Error syncing all properties:', error)
      toast.error('Failed to sync all properties')
    } finally {
      setSyncing(null)
    }
  }

  const handleUpdateProperty = async (propertyId: string) => {
    try {
      const { data: updatedProperty, error } = await DatabaseService.updateProperty(propertyId, editForm)

      if (error) {
        toast.error('Failed to update property')
        return
      }

      toast.success('Property updated successfully')
      setEditingProperty(null)
      setEditForm({})
      await loadData()

    } catch (error) {
      console.error('Error updating property:', error)
      toast.error('Failed to update property')
    }
  }

  const startEdit = (property: PropertySyncConfig) => {
    setEditingProperty(property.id)
    setEditForm({
      sync_enabled: property.sync_enabled,
      airbnb_ical_url: property.airbnb_ical_url,
      booking_com_ical_url: property.booking_com_ical_url
    })
  }

  const getSyncStatusBadge = (property: PropertySyncConfig) => {
    if (!property.sync_enabled) {
      return <Badge className="bg-gray-500/10 text-gray-500">Disabled</Badge>
    }
    
    if (!property.airbnb_ical_url && !property.booking_com_ical_url) {
      return <Badge className="bg-yellow-500/10 text-yellow-500">No URLs</Badge>
    }

    if (property.last_sync) {
      const lastSync = new Date(property.last_sync)
      const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      
      if (hoursAgo < 2) {
        return <Badge className="bg-green-500/10 text-green-500">Recent</Badge>
      } else if (hoursAgo < 24) {
        return <Badge className="bg-blue-500/10 text-blue-500">Today</Badge>
      } else {
        return <Badge className="bg-orange-500/10 text-orange-500">Stale</Badge>
      }
    }

    return <Badge className="bg-gray-500/10 text-gray-500">Never</Badge>
  }

  const getBookingStats = () => {
    const syncedBookings = bookings.filter(b => b.external_id)
    const airbnbBookings = syncedBookings.filter(b => b.platform === 'airbnb')
    const bookingComBookings = syncedBookings.filter(b => b.platform === 'booking_com')
    const manualBookings = bookings.filter(b => !b.external_id)

    return {
      total: bookings.length,
      synced: syncedBookings.length,
      airbnb: airbnbBookings.length,
      bookingCom: bookingComBookings.length,
      manual: manualBookings.length
    }
  }

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Admin access required to view this page.</p>
          <Link href="/dashboard/admin">
            <Button className="mt-4">Go to Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const bookingStats = getBookingStats()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Booking Sync Management</h1>
              <p className="text-neutral-400">Manage iCal integration with Airbnb and Booking.com</p>
            </div>
            
            <Button 
              onClick={handleSyncAll}
              disabled={syncing !== null}
              className="flex items-center gap-2"
            >
              {syncing === 'all' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sync className="h-4 w-4" />
              )}
              Sync All Properties
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookingStats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Synced</p>
                  <p className="text-2xl font-bold">{bookingStats.synced}</p>
                </div>
                <Sync className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Airbnb</p>
                  <p className="text-2xl font-bold">{bookingStats.airbnb}</p>
                </div>
                <ExternalLink className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Booking.com</p>
                  <p className="text-2xl font-bold">{bookingStats.bookingCom}</p>
                </div>
                <ExternalLink className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Manual</p>
                  <p className="text-2xl font-bold">{bookingStats.manual}</p>
                </div>
                <Upload className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Properties Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Properties Sync Configuration</CardTitle>
              <CardDescription>
                Configure iCal URLs for each property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-neutral-400">Loading properties...</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Properties</h3>
                  <p className="text-neutral-400">
                    Add properties to configure booking sync.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="border border-neutral-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-white">{property.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getSyncStatusBadge(property)}
                            {property.last_sync && (
                              <span className="text-xs text-neutral-500">
                                Last sync: {new Date(property.last_sync).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(property)}
                            disabled={editingProperty === property.id}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleSyncProperty(property.id)}
                            disabled={syncing !== null || (!property.airbnb_ical_url && !property.booking_com_ical_url)}
                          >
                            {syncing === property.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {editingProperty === property.id ? (
                        <div className="space-y-3 mt-4 pt-4 border-t border-neutral-700">
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Airbnb iCal URL
                            </label>
                            <Input
                              value={editForm.airbnb_ical_url || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, airbnb_ical_url: e.target.value }))}
                              placeholder="https://www.airbnb.com/calendar/ical/..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                              Booking.com iCal URL
                            </label>
                            <Input
                              value={editForm.booking_com_ical_url || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, booking_com_ical_url: e.target.value }))}
                              placeholder="https://admin.booking.com/hotel/hoteladmin/ical/..."
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`sync-enabled-${property.id}`}
                              checked={editForm.sync_enabled || false}
                              onChange={(e) => setEditForm(prev => ({ ...prev, sync_enabled: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor={`sync-enabled-${property.id}`} className="text-sm text-neutral-300">
                              Enable automatic sync
                            </label>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateProperty(property.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingProperty(null)
                                setEditForm({})
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-400 space-y-1">
                          {property.airbnb_ical_url && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-3 w-3 text-red-500" />
                              <span>Airbnb configured</span>
                            </div>
                          )}
                          {property.booking_com_ical_url && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-3 w-3 text-blue-600" />
                              <span>Booking.com configured</span>
                            </div>
                          )}
                          {!property.airbnb_ical_url && !property.booking_com_ical_url && (
                            <span className="text-neutral-500">No iCal URLs configured</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sync Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Results</CardTitle>
              <CardDescription>
                Latest synchronization results and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncResults.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Sync Results</h3>
                  <p className="text-neutral-400">
                    Run a sync to see results here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncResults.map((result, index) => {
                    const property = properties.find(p => p.id === result.propertyId)
                    
                    return (
                      <div key={index} className="border border-neutral-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-white">
                              {property?.name || result.propertyId}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm text-neutral-400">
                                {result.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                          </div>
                          
                          <span className="text-xs text-neutral-500">
                            {result.syncDurationMs}ms
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-neutral-400">Found:</span>
                            <span className="ml-2 text-white">{result.totalBookingsFound}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Created:</span>
                            <span className="ml-2 text-green-400">{result.newBookingsCreated}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Updated:</span>
                            <span className="ml-2 text-blue-400">{result.existingBookingsUpdated}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Tasks:</span>
                            <span className="ml-2 text-purple-400">{result.cleaningTasksCreated}</span>
                          </div>
                        </div>
                        
                        {result.errors.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-700">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium text-orange-500">Errors</span>
                            </div>
                            <div className="space-y-1">
                              {result.errors.map((error, errorIndex) => (
                                <p key={errorIndex} className="text-xs text-red-400">
                                  {error}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-neutral-300">
              <div>
                <h4 className="font-medium text-white mb-2">Airbnb iCal Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to your Airbnb hosting dashboard</li>
                  <li>Navigate to Calendar → Availability settings</li>
                  <li>Find "Export calendar" and copy the iCal URL</li>
                  <li>Paste the URL in the Airbnb iCal URL field above</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Booking.com iCal Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Log into your Booking.com partner dashboard</li>
                  <li>Go to Property → Calendar</li>
                  <li>Look for "Export calendar" or "iCal export"</li>
                  <li>Copy the iCal URL and paste it in the Booking.com field above</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Automatic Features:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Bookings are synced every 2 hours automatically</li>
                  <li>Cleaning tasks are created automatically for new checkouts</li>
                  <li>Duplicate bookings are prevented by checking external IDs</li>
                  <li>Staff members receive email notifications for new cleaning tasks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
