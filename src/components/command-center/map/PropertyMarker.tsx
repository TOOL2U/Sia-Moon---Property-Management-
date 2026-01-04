'use client'

import { PropertyStatus } from '@/services/StaffGPSService'
import { useEffect, useRef, useState } from 'react'

interface PropertyMarkerProps {
  map: google.maps.Map
  property: PropertyStatus
}

// Property status color mapping
const PROPERTY_STATUS_COLORS = {
  occupied: '#10B981', // Green
  vacant: '#6B7280', // Gray
  cleaning: '#F59E0B', // Orange
  maintenance: '#EF4444', // Red
  checkout: '#8B5CF6', // Purple
  checkin: '#3B82F6' // Blue
}

// Create property marker icon
const createPropertyIcon = (status: PropertyStatus['status'], guestCount: number) => {
  const color = PROPERTY_STATUS_COLORS[status]

  return `
    <div class="relative flex items-center justify-center">
      <div class="w-10 h-10 rounded-lg border-2 border-white shadow-lg flex items-center justify-center"
           style="background-color: ${color}">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      </div>
      ${guestCount > 0 ? `
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border border-white">
          ${guestCount}
        </div>
      ` : ''}
    </div>
  `
}

export default function PropertyMarker({ map, property }: PropertyMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  // Create or update marker
  useEffect(() => {
    if (!map || !property) return

    // Use coordinates from property data (from database)
    const position = {
      lat: (property as any).coordinates?.latitude || 9.7380,
      lng: (property as any).coordinates?.longitude || 100.0194
    }

    // Create custom icon for property
    const color = PROPERTY_STATUS_COLORS[property.status]
    const svgIcon = {
      path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.2,
      anchor: new google.maps.Point(12, 24)
    }

    // Create standard marker
    const marker = new google.maps.Marker({
      map,
      position,
      icon: svgIcon,
      title: `${(property as any).name || property.propertyId} - ${property.status}`
    })

    // Format next event
    const nextEventText = property.nextEvent
      ? `${property.nextEvent.type.toUpperCase()} at ${new Date(property.nextEvent.time.toMillis()).toLocaleTimeString()}`
      : 'No upcoming events'

    // Create info window content
    const propertyName = (property as any).name || property.propertyId
    const propertyAddress = (property as any).address || 'Koh Phangan, Thailand'
    const propertyArea = (property as any).area || 'Island'

    const infoContent = `
      <div class="p-3 bg-gray-800 text-white rounded-lg min-w-[250px]">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-lg">${propertyName}</h3>
          <span class="px-2 py-1 rounded text-xs font-medium"
                style="background-color: ${PROPERTY_STATUS_COLORS[property.status]}20; color: ${PROPERTY_STATUS_COLORS[property.status]}">
            ${property.status.toUpperCase()}
          </span>
        </div>

        <div class="space-y-1 text-sm mb-3">
          <div class="flex justify-between">
            <span class="text-gray-400">Area:</span>
            <span>${propertyArea}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Address:</span>
            <span class="text-xs">${propertyAddress}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Current Guests:</span>
            <span class="${property.guestCount > 0 ? 'text-green-400' : 'text-gray-400'}">${property.guestCount}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Last Updated:</span>
            <span>${new Date(property.lastUpdated.toMillis()).toLocaleTimeString()}</span>
          </div>
        </div>

        ${property.nextEvent ? `
          <div class="mb-3 p-2 bg-blue-500/20 rounded border border-blue-500/30">
            <div class="text-xs text-blue-400 font-medium">NEXT EVENT</div>
            <div class="text-sm">${nextEventText}</div>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-2">
          <button class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm transition-colors">
            View Details
          </button>
          <button class="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded text-sm transition-colors">
            Update Status
          </button>
        </div>
      </div>
    `

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: infoContent,
      maxWidth: 300
    })

    // Add click listener
    marker.addListener('click', () => {
      // Close any open info windows
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }

      infoWindow.open(map, marker)
      infoWindowRef.current = infoWindow
    })

    // Store reference
    markerRef.current = marker

    // Cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
    }
  }, [map, property])

  // Update marker when property status changes
  useEffect(() => {
    if (markerRef.current && property) {
      // Update marker icon
      const color = PROPERTY_STATUS_COLORS[property.status]
      const svgIcon = {
        path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.2,
        anchor: new google.maps.Point(12, 24)
      }
      markerRef.current.setIcon(svgIcon)
    }
  }, [property.status, property.guestCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
    }
  }, [])

  return null // This component doesn't render anything directly
}
