'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PropertyDashboard from '@/components/property/PropertyDashboard'
import PropertyListing from '@/components/property/PropertyListing'
import PropertyModal from '@/components/property/PropertyModal'
import { Property } from '@/types/property'
import { Button } from '@/components/ui/Button'
import { Building2, LayoutGrid, List } from 'lucide-react'

// Admin Properties Management Page
export default function AdminPropertiesPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property)
    setModalOpen(true)
  }

  const handleEditProperty = (property: Property) => {
    router.push(`/properties/${property.id}/edit`)
  }

  const handleCreateProperty = () => {
    router.push('/properties/add')
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setTimeout(() => setSelectedProperty(null), 300) // Clear after animation
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Properties Management</h1>
              <p className="text-neutral-400">Manage villas, occupancy, and performance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1">
              <Button
                variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dashboard')}
                className={viewMode === 'dashboard' ? 'bg-blue-600' : ''}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-blue-600' : ''}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </div>

            <Button onClick={handleCreateProperty} className="bg-blue-600 hover:bg-blue-700">
              <Building2 className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'dashboard' ? (
          <PropertyDashboard
            onViewProperty={handleViewProperty}
            onCreateProperty={handleCreateProperty}
          />
        ) : (
          <PropertyListing
            onViewProperty={handleViewProperty}
            onEditProperty={handleEditProperty}
            onCreateProperty={handleCreateProperty}
            onBulkAction={(action, propertyIds) => {
              console.log('Bulk action:', action, propertyIds)
            }}
          />
        )}

        {/* Property Details Modal */}
        <PropertyModal
          property={selectedProperty}
          open={modalOpen}
          onClose={handleCloseModal}
          onEdit={handleEditProperty}
        />
      </div>
    </div>
  )
}
