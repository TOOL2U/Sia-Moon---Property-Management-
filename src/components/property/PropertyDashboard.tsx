'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Filter,
  Download,
  Plus,
  Eye,
  MapPin,
  Image as ImageIcon
} from 'lucide-react'
import { PropertyDashboard as PropertyDashboardType, Property } from '@/types/property'
import { PropertyService } from '@/lib/services/propertyService'
import { clientToast as toast } from '@/utils/clientToast'
import { PropertyImageGallery } from './PropertyImageGallery'

// Utility function to safely convert Firebase Timestamp to Date
const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date()

  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp

  // If it's a Firebase Timestamp with seconds and nanoseconds
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000)
  }

  // If it's a string or number
  return new Date(timestamp)
}

interface PropertyDashboardProps {
  onViewProperty?: (property: Property) => void
  onCreateProperty?: () => void
}

export default function PropertyDashboard({ onViewProperty, onCreateProperty }: PropertyDashboardProps) {
  const [dashboard, setDashboard] = useState<PropertyDashboardType | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [allProperties, setAllProperties] = useState<any[]>([])

  useEffect(() => {
    loadDashboard()
    loadAllProperties()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const dashboardData = await PropertyService.getPropertyDashboard()
      setDashboard(dashboardData)
    } catch (error) {
      console.error('Error loading property dashboard:', error)
      toast.error('Failed to load property dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadAllProperties = async () => {
    try {
      const properties = await PropertyService.getAllProperties()
      setAllProperties(properties)
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const handleOpenGallery = (property: Property) => {
    setSelectedProperty(property)
    setGalleryOpen(true)
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadDashboard()
      toast.success('Dashboard refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-neutral-900 border-neutral-800 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-neutral-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Dashboard Data</h3>
        <p className="text-neutral-400 mb-4">Unable to load property dashboard</p>
        <Button onClick={loadDashboard} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Property Management Dashboard</h2>
          <p className="text-neutral-400">Comprehensive overview of all properties and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={onCreateProperty}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboard.overview.totalProperties}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {dashboard.overview.activeProperties} Active
              </Badge>
              {dashboard.overview.inactiveProperties > 0 && (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                  {dashboard.overview.inactiveProperties} Inactive
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Average Occupancy</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatPercentage(dashboard.overview.averageOccupancy)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+{formatPercentage(dashboard.performance.occupancyTrend)} vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(dashboard.overview.totalRevenue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+{formatPercentage(dashboard.performance.revenueTrend)} vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboard.overview.averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-neutral-400">From {dashboard.overview.totalBookings} bookings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Properties
            </CardTitle>
            <CardDescription>Properties with highest revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.performance.topPerformers.slice(0, 5).map((property, index) => (
                <div key={property.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{property.name}</h4>
                      <p className="text-sm text-neutral-400">{property.location?.city}, {property.location?.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(property.pricing?.baseRate || 0)}/night</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${
                        property.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {property.status}
                      </Badge>
                      {onViewProperty && (
                        <Button
                          onClick={() => onViewProperty(property)}
                          size="sm"
                          variant="outline"
                          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 h-6 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Properties Needing Attention
            </CardTitle>
            <CardDescription>Properties with low performance or issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.performance.underPerformers.slice(0, 5).map((property, index) => (
                <div key={property.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                      !
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{property.name}</h4>
                      <p className="text-sm text-neutral-400">{property.location?.city}, {property.location?.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(property.pricing?.baseRate || 0)}/night</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${
                        property.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        property.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {property.status}
                      </Badge>
                      {onViewProperty && (
                        <Button
                          onClick={() => onViewProperty(property)}
                          size="sm"
                          variant="outline"
                          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 h-6 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Active Issues</span>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {dashboard.maintenance.activeIssues}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Urgent Issues</span>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {dashboard.maintenance.urgentIssues}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Scheduled</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {dashboard.maintenance.scheduledMaintenance}
                </Badge>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Total Cost</span>
                  <span className="text-white font-medium">{formatCurrency(dashboard.maintenance.maintenanceCosts)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    <Activity className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="text-xs text-neutral-400">{activity.propertyName}</p>
                    <p className="text-xs text-neutral-500">{toDate(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-2 bg-neutral-800 rounded">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                    alert.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{alert.message}</p>
                    <p className="text-xs text-neutral-400">{alert.propertyName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        alert.severity === 'warning' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        alert.severity === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        {alert.severity}
                      </Badge>
                      {alert.actionRequired && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Properties Grid */}
      {allProperties.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  All Properties ({allProperties.length})
                </CardTitle>
                <CardDescription>View and manage your property portfolio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProperties.map((property) => {
                const mainImage = property.images?.find((img: any) => img.isMain) || property.images?.[0]
                const basePrice = property.pricing?.baseRate || 0
                
                return (
                  <Card 
                    key={property.id} 
                    className="bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-all overflow-hidden group cursor-pointer"
                  >
                    {/* Property Image */}
                    <div 
                      className="relative h-48 bg-neutral-900 overflow-hidden"
                      onClick={() => mainImage && mainImage.url && handleOpenGallery(property)}
                    >
                      {mainImage && mainImage.url ? (
                        <>
                          <Image
                            src={mainImage.url}
                            alt={mainImage.caption || property.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white border-none"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              View {property.images?.length || 0} Photos
                            </Button>
                          </div>
                          {property.images && property.images.length > 1 && (
                            <Badge className="absolute top-2 right-2 bg-black/70 text-white border-none">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {property.images.length}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-neutral-700" />
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-white text-lg line-clamp-1">
                          {property.name}
                        </CardTitle>
                        <Badge className={
                          property.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          property.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }>
                          {property.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1 line-clamp-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {property.location?.city}, {property.location?.state || property.location?.country}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-neutral-400" />
                          <span className="text-neutral-300">{property.details?.bedrooms || 0} bed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-neutral-400" />
                          <span className="text-neutral-300">{property.details?.bathrooms || 0} bath</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-700">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">
                              ${basePrice}
                            </span>
                            <span className="text-sm text-neutral-400">/night</span>
                          </div>
                          {property.pricing?.dynamicPricing && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs mt-1">
                              Dynamic Pricing
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => onViewProperty?.(property)}
                          size="sm"
                          variant="outline"
                          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Gallery Modal */}
      {selectedProperty && selectedProperty.images && (
        <PropertyImageGallery
          images={selectedProperty.images}
          propertyName={selectedProperty.name}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}
