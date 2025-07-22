'use client'

import { StaffLocation } from '@/services/StaffGPSService'
import { useEffect, useRef, useState } from 'react'

interface StaffMarkerProps {
  map: google.maps.Map
  location: StaffLocation
}

// Status color mapping
const STATUS_COLORS = {
  working: '#10B981', // Green
  traveling: '#3B82F6', // Blue
  break: '#F59E0B', // Orange
  emergency: '#EF4444', // Red
  offline: '#6B7280' // Gray
}

// Create custom marker icon SVG
const createMarkerIcon = (status: StaffLocation['status'], isActive: boolean = true) => {
  const color = STATUS_COLORS[status]
  const pulseClass = isActive && status !== 'offline' ? 'animate-pulse' : ''

  return `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${pulseClass}"
           style="background-color: ${color}">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        </svg>
      </div>
      ${isActive && status !== 'offline' ? `
        <div class="absolute w-12 h-12 rounded-full border-2 animate-ping"
             style="border-color: ${color}; opacity: 0.3;"></div>
      ` : ''}
    </div>
  `
}

export default function StaffMarker({ map, location }: StaffMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [staffInfo, setStaffInfo] = useState<any>(null)

  // Fetch staff information
  useEffect(() => {
    // In a real implementation, you'd fetch from your staff_accounts collection
    // For now, we'll use mock data
    setStaffInfo({
      name: `Staff ${location.staffId}`,
      role: 'Housekeeper',
      phone: '+62 123 456 789',
      currentTask: location.status === 'working' ? 'Villa Cleaning' : 'Available'
    })
  }, [location.staffId])

  // Create or update marker
  useEffect(() => {
    if (!map || !location) return

    const position = { lat: location.latitude, lng: location.longitude }

    // Create custom icon using SVG
    const color = STATUS_COLORS[location.status]
    const svgIcon = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new google.maps.Point(12, 24)
    }

    // Create standard marker
    const marker = new google.maps.Marker({
      map,
      position,
      icon: svgIcon,
      title: `${staffInfo?.name || location.staffId} - ${location.status}`,
      animation: location.status !== 'offline' ? google.maps.Animation.BOUNCE : undefined
    })

    // Create info window content
    const infoContent = `
      <div class="p-3 bg-gray-800 text-white rounded-lg min-w-[200px]">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-lg">${staffInfo?.name || location.staffId}</h3>
          <span class="px-2 py-1 rounded text-xs font-medium"
                style="background-color: ${STATUS_COLORS[location.status]}20; color: ${STATUS_COLORS[location.status]}">
            ${location.status.toUpperCase()}
          </span>
        </div>

        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Role:</span>
            <span>${staffInfo?.role || 'Staff'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Current Task:</span>
            <span>${staffInfo?.currentTask || 'None'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Last Update:</span>
            <span>${new Date(location.timestamp.toMillis()).toLocaleTimeString()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Accuracy:</span>
            <span>${Math.round(location.accuracy)}m</span>
          </div>
          ${location.speed ? `
            <div class="flex justify-between">
              <span class="text-gray-400">Speed:</span>
              <span>${Math.round(location.speed * 3.6)} km/h</span>
            </div>
          ` : ''}
          ${location.batteryLevel ? `
            <div class="flex justify-between">
              <span class="text-gray-400">Battery:</span>
              <span class="${location.batteryLevel < 20 ? 'text-red-400' : 'text-green-400'}">${location.batteryLevel}%</span>
            </div>
          ` : ''}
        </div>

        <div class="mt-3 pt-2 border-t border-gray-700">
          <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm transition-colors">
            Contact Staff
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

    // Store references
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
  }, [map, location, staffInfo])

  // Update marker position when location changes
  useEffect(() => {
    if (markerRef.current && location) {
      const newPosition = { lat: location.latitude, lng: location.longitude }
      markerRef.current.setPosition(newPosition)

      // Update marker icon if status changed
      const color = STATUS_COLORS[location.status]
      const svgIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.5,
        anchor: new google.maps.Point(12, 24)
      }
      markerRef.current.setIcon(svgIcon)

      // Update animation
      markerRef.current.setAnimation(
        location.status !== 'offline' ? google.maps.Animation.BOUNCE : null
      )
    }
  }, [location.latitude, location.longitude, location.status])

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
