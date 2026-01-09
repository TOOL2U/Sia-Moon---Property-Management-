'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Grid3X3,
  List,
  RefreshCw,
  Plus
} from 'lucide-react'
import { Property, PropertyFilters, PropertySearchResult, PropertyStatus, PROPERTY_STATUSES } from '@/types/property'
import { PropertyService } from '@/lib/services/propertyService'
import { clientToast as toast } from '@/utils/clientToast'

interface PropertyListingProps {
  onViewProperty?: (property: Property) => void
  onEditProperty?: (property: Property) => void
  onBulkAction?: (propertyIds: string[], action: string) => void
  onCreateProperty?: () => void
}

export default function PropertyListing({ onViewProperty, onEditProperty, onBulkAction, onCreateProperty }: PropertyListingProps) {
  const [properties, setProperties] = useState<PropertySearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filters
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    status: [],
    page: 1,
    limit: 12,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  useEffect(() => {
    loadProperties()
  }, [filters])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const result = await PropertyService.getAllPropertiesAdvanced(filters)
      setProperties(result)
    } catch (error) {
      console.error('Error loading properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadProperties()
      toast.success('Properties refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh properties')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }))
  }

  const handleStatusFilter = (status: PropertyStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status) 
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
      page: 1
    }))
  }

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProperties.length === properties?.properties.length) {
      setSelectedProperties([])
    } else {
      setSelectedProperties(properties?.properties.map(p => p.id) || [])
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedProperties.length === 0) {
      toast.error('Please select properties first')
      return
    }
    
    onBulkAction?.(selectedProperties, action)
    setSelectedProperties([])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: PropertyStatus) => {
    const statusConfig = PROPERTY_STATUSES.find(s => s.value === status)
    return statusConfig?.color || 'gray'
  }

  const getStatusBadgeClass = (status: PropertyStatus) => {
    const color = getStatusColor(status)
    const colorClasses = {
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      neutral: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
  }

  if (loading && !properties) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-neutral-700 rounded w-1/3 animate-pulse"></div>
          <div className="h-10 bg-neutral-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-neutral-900 border-neutral-800 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-neutral-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Property Management</h2>
          <p className="text-neutral-400">
            {properties?.total || 0} properties found
            {filters.search && ` for "${filters.search}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCreateProperty && (
            <Button
              onClick={onCreateProperty}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          )}
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center border border-neutral-700 rounded-lg">
            <Button
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search properties by name, location, or owner..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Status Filters */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_STATUSES.map((status) => (
                <Button
                  key={status.value}
                  onClick={() => handleStatusFilter(status.value)}
                  variant={filters.status?.includes(status.value) ? 'default' : 'outline'}
                  size="sm"
                  className={`${
                    filters.status?.includes(status.value)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-300">Sort by:</label>
            <div className="flex gap-2">
              {[
                { key: 'name', label: 'Name' },
                { key: 'updatedAt', label: 'Updated' },
                { key: 'createdAt', label: 'Created' },
                { key: 'pricePerNight', label: 'Price' }
              ].map((sort) => (
                <Button
                  key={sort.key}
                  onClick={() => handleSort(sort.key)}
                  variant={filters.sortBy === sort.key ? 'default' : 'outline'}
                  size="sm"
                  className={`${
                    filters.sortBy === sort.key
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {sort.label}
                  {filters.sortBy === sort.key && (
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <span className="text-blue-400 font-medium">
                  {selectedProperties.length} properties selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBulkAction('activate')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkAction('deactivate')}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Deactivate
                </Button>
                <Button
                  onClick={() => handleBulkAction('export')}
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid/List */}
      {properties?.properties.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Properties Found</h3>
            <p className="text-neutral-400 mb-4">
              {filters.search || filters.status?.length 
                ? 'Try adjusting your filters or search terms'
                : 'No properties have been added yet'
              }
            </p>
            <Button
              onClick={() => setFilters({ page: 1, limit: 12, sortBy: 'updatedAt', sortOrder: 'desc' })}
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties?.properties.map((property) => (
                <Card key={property.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedProperties.includes(property.id)}
                            onChange={() => handleSelectProperty(property.id)}
                            className="rounded border-neutral-600 bg-neutral-800 text-blue-600"
                          />
                          <CardTitle className="text-white text-lg">{property.name}</CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.city}, {property.country}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusBadgeClass(property.status)}>
                        {property.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-neutral-400" />
                          <span className="text-neutral-300">{property.maxGuests || 'N/A'} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-neutral-400" />
                          <span className="text-neutral-300">{property.bedrooms || 'N/A'} bed</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-white font-medium">
                            {property.pricePerNight ? formatCurrency(property.pricePerNight) : 'N/A'}/night
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {onViewProperty && (
                            <Button
                              onClick={() => onViewProperty(property)}
                              size="sm"
                              variant="outline"
                              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEditProperty && (
                            <Button
                              onClick={() => onEditProperty(property)}
                              size="sm"
                              variant="outline"
                              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Properties List</CardTitle>
                  <Button
                    onClick={handleSelectAll}
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    {selectedProperties.length === properties?.properties.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {properties?.properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-750 transition-colors">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(property.id)}
                          onChange={() => handleSelectProperty(property.id)}
                          className="rounded border-neutral-600 bg-neutral-800 text-blue-600"
                        />
                        <div>
                          <h4 className="text-white font-medium">{property.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.city}, {property.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {property.maxGuests || 'N/A'} guests
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {property.bedrooms || 'N/A'} bed
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusBadgeClass(property.status)}>
                          {property.status}
                        </Badge>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            {property.pricePerNight ? formatCurrency(property.pricePerNight) : 'N/A'}/night
                          </p>
                          <p className="text-xs text-neutral-400">
                            Updated {new Date(property.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {onViewProperty && (
                            <Button
                              onClick={() => onViewProperty(property)}
                              size="sm"
                              variant="outline"
                              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEditProperty && (
                            <Button
                              onClick={() => onEditProperty(property)}
                              size="sm"
                              variant="outline"
                              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {properties && properties.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Showing {((properties.page - 1) * (filters.limit || 12)) + 1} to{' '}
                {Math.min(properties.page * (filters.limit || 12), properties.total)} of{' '}
                {properties.total} properties
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(properties.page - 1)}
                  disabled={properties.page === 1}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-neutral-400">
                  Page {properties.page} of {properties.totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(properties.page + 1)}
                  disabled={properties.page === properties.totalPages}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
