'use client'

import { PropertyStatus, staffGPSService, StaffLocation } from '@/services/StaffGPSService'
import { Loader } from '@googlemaps/js-api-loader'
import { useCallback, useEffect, useRef, useState } from 'react'
import JobRoute from './JobRoute'
import MapControls from './MapControls'
import MapStats from './MapStats'
import PropertyMarker from './PropertyMarker'
import StaffMarker from './StaffMarker'

interface LiveOperationsMapProps {
  className?: string
}

// Koh Phangan, Thailand center coordinates
const KOH_PHANGAN_CENTER = { lat: 9.7380, lng: 100.0194 }

// Dark map theme
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
]

export default function LiveOperationsMap({ className }: LiveOperationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [staffLocations, setStaffLocations] = useState<StaffLocation[]>([])
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [showStaff, setShowStaff] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.warn('⚠️ Google Maps API key not configured')
        setMapError('Google Maps is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable maps.')
        setIsLoaded(true) // Set loaded to hide loading spinner
        return
      }

      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry', 'marker']
      })

      const google = await loader.load()

      const map = new google.maps.Map(mapRef.current, {
        center: KOH_PHANGAN_CENTER,
        zoom: 13,
        styles: DARK_MAP_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false, // We'll use custom controls
        gestureHandling: 'greedy',
        backgroundColor: '#1f2937'
      })

      mapInstanceRef.current = map
      setIsLoaded(true)
      console.log('✅ Google Maps initialized successfully')

    } catch (error) {
      console.error('❌ Error initializing Google Maps:', error)
      setMapError(error instanceof Error ? error.message : 'Failed to load map')
      setIsLoaded(true) // Set loaded to hide loading spinner
    }
  }, [])

  // Subscribe to real-time data
  useEffect(() => {
    let staffUnsubscribe: (() => void) | null = null
    let propertyUnsubscribe: (() => void) | null = null

    const setupSubscriptions = () => {
      // Subscribe to staff locations
      staffUnsubscribe = staffGPSService.subscribeToStaffLocations(
        (locations) => {
          setStaffLocations(locations)
          console.log(`📍 Updated ${locations.length} staff locations`)
        },
        { activeOnly: true, maxAge: 30 }
      )

      // Subscribe to property statuses
      propertyUnsubscribe = staffGPSService.subscribeToPropertyStatus(
        (properties) => {
          setPropertyStatuses(properties)
          console.log(`🏠 Updated ${properties.length} property statuses`)
        }
      )
    }

    setupSubscriptions()

    return () => {
      if (staffUnsubscribe) staffUnsubscribe()
      if (propertyUnsubscribe) propertyUnsubscribe()
    }
  }, [])

  // Initialize map on mount
  useEffect(() => {
    initializeMap()
  }, [initializeMap])

  // Handle traffic layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const trafficLayer = new google.maps.TrafficLayer()

    if (showTraffic) {
      trafficLayer.setMap(mapInstanceRef.current)
    } else {
      trafficLayer.setMap(null)
    }

    return () => {
      trafficLayer.setMap(null)
    }
  }, [showTraffic, isLoaded])

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    switch (layer) {
      case 'traffic':
        setShowTraffic(enabled)
        break
      case 'staff':
        setShowStaff(enabled)
        break
      case 'properties':
        setShowProperties(enabled)
        break
      case 'routes':
        setShowRoutes(enabled)
        break
    }
  }

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Maps Unavailable</h3>
          <p className="text-gray-400 text-sm mb-4">{mapError}</p>
          <div className="text-xs text-gray-500 bg-gray-800 rounded p-3 text-left">
            <p className="font-semibold mb-1">To enable maps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enable billing in Google Cloud Console</li>
              <li>Enable Maps JavaScript API</li>
              <li>Add API key to .env.local</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full rounded-lg overflow-hidden" />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading Map...</p>
            <p className="text-gray-400 text-sm mt-2">Initializing GPS tracking</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {isLoaded && mapInstanceRef.current && (
        <MapControls
          map={mapInstanceRef.current}
          onLayerToggle={handleLayerToggle}
          layers={{
            traffic: showTraffic,
            staff: showStaff,
            properties: showProperties,
            routes: showRoutes
          }}
        />
      )}

      {/* Live Stats Overlay */}
      {isLoaded && (
        <MapStats
          staffCount={staffLocations.length}
          activeJobs={staffLocations.filter(s => s.status === 'working').length}
          propertiesInTransition={propertyStatuses.filter(p =>
            ['cleaning', 'maintenance', 'checkout', 'checkin'].includes(p.status)
          ).length}
        />
      )}

      {/* Staff Markers */}
      {isLoaded && showStaff && mapInstanceRef.current && staffLocations.map((location, index) => (
        <StaffMarker
          key={`staff-${location.staffId}-${location.id || index}`}
          map={mapInstanceRef.current!}
          location={location}
        />
      ))}

      {/* Property Markers */}
      {isLoaded && showProperties && mapInstanceRef.current && propertyStatuses.map((property, index) => (
        <PropertyMarker
          key={`property-${property.propertyId}-${property.id || index}`}
          map={mapInstanceRef.current!}
          property={property}
        />
      ))}

      {/* Job Routes */}
      {isLoaded && showRoutes && mapInstanceRef.current && staffLocations
        .filter(location => location.status === 'working' || location.status === 'traveling')
        .map((location, index) => (
          <JobRoute
            key={`route-${location.staffId}-${location.id || index}`}
            map={mapInstanceRef.current!}
            staffLocation={location}
            properties={propertyStatuses}
          />
        ))}
    </div>
  )
}
