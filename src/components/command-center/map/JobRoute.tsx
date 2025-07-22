'use client'

import { useEffect, useRef, useState } from 'react'
import { StaffLocation, PropertyStatus } from '@/services/StaffGPSService'
import { distance } from '@turf/distance'
import { point } from '@turf/helpers'

interface JobRouteProps {
  map: google.maps.Map
  staffLocation: StaffLocation
  properties: PropertyStatus[]
}

// Route color mapping based on priority/status
const ROUTE_COLORS = {
  high: '#EF4444', // Red for high priority
  medium: '#F59E0B', // Orange for medium priority
  low: '#10B981', // Green for low priority
  traveling: '#3B82F6' // Blue for currently traveling
}

export default function JobRoute({ map, staffLocation, properties }: JobRouteProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const [assignedProperty, setAssignedProperty] = useState<PropertyStatus | null>(null)
  const [routeInfo, setRouteInfo] = useState<{
    distance: string
    duration: string
    priority: 'high' | 'medium' | 'low'
  } | null>(null)

  // Mock job assignment logic - in real implementation, this would come from your jobs collection
  useEffect(() => {
    // Find the nearest property that needs attention
    const needsAttention = properties.filter(p => 
      ['cleaning', 'maintenance', 'checkout', 'checkin'].includes(p.status)
    )

    if (needsAttention.length === 0) {
      setAssignedProperty(null)
      return
    }

    // For demo purposes, assign to the nearest property
    // In real implementation, this would be based on actual job assignments
    const mockPropertyCoordinates = {
      'villa-001': { lat: -8.6905, lng: 115.1729 },
      'villa-002': { lat: -8.6482, lng: 115.1378 },
      'villa-003': { lat: -8.5069, lng: 115.2625 }
    }

    let nearestProperty = needsAttention[0]
    let minDistance = Infinity

    needsAttention.forEach(property => {
      const propCoords = mockPropertyCoordinates[property.propertyId as keyof typeof mockPropertyCoordinates]
      if (propCoords) {
        const staffPoint = point([staffLocation.longitude, staffLocation.latitude])
        const propPoint = point([propCoords.lng, propCoords.lat])
        const dist = distance(staffPoint, propPoint, { units: 'kilometers' })
        
        if (dist < minDistance) {
          minDistance = dist
          nearestProperty = property
        }
      }
    })

    setAssignedProperty(nearestProperty)
  }, [staffLocation, properties])

  // Create or update route
  useEffect(() => {
    if (!map || !assignedProperty || !staffLocation) {
      // Clear existing route
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
      return
    }

    // Initialize directions service
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService()
    }

    // Mock property coordinates
    const mockPropertyCoordinates = {
      'villa-001': { lat: -8.6905, lng: 115.1729 },
      'villa-002': { lat: -8.6482, lng: 115.1378 },
      'villa-003': { lat: -8.5069, lng: 115.2625 }
    }

    const propertyCoords = mockPropertyCoordinates[assignedProperty.propertyId as keyof typeof mockPropertyCoordinates]
    if (!propertyCoords) return

    const staffPosition = { lat: staffLocation.latitude, lng: staffLocation.longitude }
    const propertyPosition = propertyCoords

    // Determine route priority based on property status
    let priority: 'high' | 'medium' | 'low' = 'medium'
    if (assignedProperty.status === 'emergency' || assignedProperty.status === 'maintenance') {
      priority = 'high'
    } else if (assignedProperty.status === 'cleaning') {
      priority = 'medium'
    } else {
      priority = 'low'
    }

    // Get route from Google Directions API
    directionsServiceRef.current.route(
      {
        origin: staffPosition,
        destination: propertyPosition,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: false,
        avoidHighways: false
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Clear existing polyline
          if (polylineRef.current) {
            polylineRef.current.setMap(null)
          }

          // Create new polyline
          const route = result.routes[0]
          const leg = route.legs[0]
          
          // Set route info
          setRouteInfo({
            distance: leg.distance?.text || 'Unknown',
            duration: leg.duration?.text || 'Unknown',
            priority
          })

          // Create polyline
          const polyline = new google.maps.Polyline({
            path: route.overview_path,
            geodesic: true,
            strokeColor: staffLocation.status === 'traveling' ? ROUTE_COLORS.traveling : ROUTE_COLORS[priority],
            strokeOpacity: 0.8,
            strokeWeight: staffLocation.status === 'traveling' ? 4 : 3,
            map: map
          })

          // Add animation for traveling staff
          if (staffLocation.status === 'traveling') {
            const symbols = [{
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: ROUTE_COLORS.traveling,
                fillColor: ROUTE_COLORS.traveling,
                fillOpacity: 1
              },
              offset: '100%',
              repeat: '50px'
            }]
            polyline.setOptions({ icons: symbols })
          }

          polylineRef.current = polyline

          // Add click listener for route info
          polyline.addListener('click', (event: google.maps.MapMouseEvent) => {
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-3 bg-gray-800 text-white rounded-lg">
                  <h3 class="font-semibold mb-2">Route Information</h3>
                  <div class="space-y-1 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Staff:</span>
                      <span>Staff ${staffLocation.staffId}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Destination:</span>
                      <span>Property ${assignedProperty.propertyId}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Distance:</span>
                      <span>${routeInfo?.distance}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">ETA:</span>
                      <span>${routeInfo?.duration}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Priority:</span>
                      <span class="px-2 py-1 rounded text-xs font-medium" 
                            style="background-color: ${ROUTE_COLORS[priority]}20; color: ${ROUTE_COLORS[priority]}">
                        ${priority.toUpperCase()}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Status:</span>
                      <span class="capitalize">${staffLocation.status}</span>
                    </div>
                  </div>
                </div>
              `,
              position: event.latLng
            })
            infoWindow.open(map)
          })

        } else {
          console.error('Directions request failed:', status)
          
          // Fallback: create straight line
          const polyline = new google.maps.Polyline({
            path: [staffPosition, propertyPosition],
            geodesic: true,
            strokeColor: ROUTE_COLORS[priority],
            strokeOpacity: 0.6,
            strokeWeight: 2,
            strokeStyle: 'dashed',
            map: map
          })

          polylineRef.current = polyline

          // Calculate straight-line distance
          const staffPoint = point([staffLocation.longitude, staffLocation.latitude])
          const propPoint = point([propertyCoords.lng, propertyCoords.lat])
          const dist = distance(staffPoint, propPoint, { units: 'kilometers' })
          
          setRouteInfo({
            distance: `${dist.toFixed(1)} km`,
            duration: 'Calculating...',
            priority
          })
        }
      }
    )

    // Cleanup function
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
    }
  }, [map, staffLocation, assignedProperty])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }
    }
  }, [])

  return null // This component doesn't render anything directly
}
