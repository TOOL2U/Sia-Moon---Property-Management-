'use client'

import { useState, useEffect } from 'react'
import { Property } from '@/types/property'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  MapPin,
  Users,
  Home,
  Bath,
  DollarSign,
  Star,
  Wifi,
  Car,
  Waves,
  UtensilsCrossed,
  Wind,
  Snowflake,
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Calendar,
  Phone,
  Key,
  ExternalLink
} from 'lucide-react'

interface PropertyModalProps {
  property: Property | null
  open: boolean
  onClose: () => void
  onEdit?: (property: Property) => void
}

export default function PropertyModal({ property, open, onClose, onEdit }: PropertyModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Reset photo index when property changes
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [property?.id])

  if (!property) return null

  const photos = property.images?.map(img => img.url) || []
  const hasPhotos = photos.length > 0

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'inactive':
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
      case 'pending_approval':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: property.pricing?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const bedrooms = property.details?.bedrooms || 0
  const bathrooms = property.details?.bathrooms || 0
  const maxGuests = property.details?.maxGuests || 0
  const basePrice = property.pricing?.baseRate || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800 text-white">
        {/* Header */}
        <DialogHeader className="sticky top-0 bg-neutral-900 z-10 pb-4 border-b border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                {property.name}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-neutral-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {property.location?.address}, {property.location?.city}, {property.location?.country}
                  </span>
                </div>
                <Badge className={getStatusBadgeClass(property.status)}>
                  {property.status}
                </Badge>
              </div>
            </div>
            {onEdit && (
              <Button
                onClick={() => onEdit(property)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Property
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Photo Gallery */}
          {hasPhotos && (
            <div className="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden">
              <img
                src={photos[currentPhotoIndex]}
                alt={`${property.name} - Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Photo Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Photo Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                  
                  {/* Photo Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">Bedrooms</span>
              </div>
              <p className="text-2xl font-bold text-white">{bedrooms}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <Bath className="h-4 w-4" />
                <span className="text-sm">Bathrooms</span>
              </div>
              <p className="text-2xl font-bold text-white">{bathrooms}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Max Guests</span>
              </div>
              <p className="text-2xl font-bold text-white">{maxGuests}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm">Per Night</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatPrice(basePrice)}
              </p>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">About This Property</h3>
              <p className="text-neutral-300 leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Pricing Details */}
          {property.pricing && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pricing Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Base Price</p>
                  <p className="text-white font-medium">{formatPrice(property.pricing.baseRate)}/night</p>
                </div>
                {property.pricing.minimumRate && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Low Season</p>
                    <p className="text-white font-medium">{formatPrice(property.pricing.minimumRate)}/night</p>
                  </div>
                )}
                {property.pricing.maximumRate && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">High Season</p>
                    <p className="text-white font-medium">{formatPrice(property.pricing.maximumRate)}/night</p>
                  </div>
                )}
                {property.details?.cleaningFee && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Cleaning Fee</p>
                    <p className="text-white font-medium">{formatPrice(property.details.cleaningFee)}</p>
                  </div>
                )}
                {property.pricing.weeklyDiscount && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Weekly Discount</p>
                    <p className="text-green-400 font-medium">{property.pricing.weeklyDiscount}% off</p>
                  </div>
                )}
                {property.pricing.monthlyDiscount && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Monthly Discount</p>
                    <p className="text-green-400 font-medium">{property.pricing.monthlyDiscount}% off</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2 text-neutral-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{typeof amenity === 'string' ? amenity : amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {property.details && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">House Rules</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Check-in</p>
                  <p className="text-white font-medium">{property.details.checkInTime || 'Flexible'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Check-out</p>
                  <p className="text-white font-medium">{property.details.checkOutTime || 'Flexible'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Minimum Stay</p>
                  <p className="text-white font-medium">{property.details.minimumStay || 1} night(s)</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Children</p>
                  <p className="text-green-400">Allowed</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Pets</p>
                  <p className={property.details.petPolicy === 'allowed' ? 'text-green-400' : 'text-red-400'}>
                    {property.details.petPolicy === 'allowed' ? 'Allowed' : 'Not Allowed'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Smoking</p>
                  <p className={property.details.smokingPolicy === 'allowed' ? 'text-green-400' : 'text-red-400'}>
                    {property.details.smokingPolicy === 'allowed' ? 'Allowed' : property.details.smokingPolicy === 'outdoor_only' ? 'Outdoor Only' : 'Not Allowed'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Location Details */}
          {property.location && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Location & Access</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Full Address</p>
                  <p className="text-white">{property.location.address}</p>
                  <p className="text-neutral-300">
                    {property.location.city}, {property.location.state}, {property.location.country} {property.location.zipCode}
                  </p>
                </div>
                
                {property.location.accessInstructions && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Access Instructions</p>
                    <p className="text-neutral-300">{property.location.accessInstructions}</p>
                  </div>
                )}
                
                {property.location.parkingInstructions && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Parking</p>
                    <p className="text-neutral-300">{property.location.parkingInstructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {property.location.entryCode && (
                    <div>
                      <p className="text-sm text-neutral-400 mb-1 flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Entry Code
                      </p>
                      <p className="text-white font-mono">{property.location.entryCode}</p>
                    </div>
                  )}
                  {property.location.wifiPassword && (
                    <div>
                      <p className="text-sm text-neutral-400 mb-1 flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        WiFi Password
                      </p>
                      <p className="text-white font-mono">{property.location.wifiPassword}</p>
                    </div>
                  )}
                </div>

                {property.location.emergencyContact && (
                  <div>
                    <p className="text-sm text-neutral-400 mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency Contact
                    </p>
                    <p className="text-white">{property.location.emergencyContact.name}</p>
                    <p className="text-neutral-300">{property.location.emergencyContact.phone}</p>
                  </div>
                )}

                {property.location.googleMapsLink && (
                  <Button
                    onClick={() => window.open(property.location.googleMapsLink, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Open in Google Maps
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
