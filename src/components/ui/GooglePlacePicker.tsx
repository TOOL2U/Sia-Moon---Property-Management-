'use client'

import { useEffect, useRef, useState } from 'react'
import { googleMapsConfig } from '@/lib/env'
import { MapPin, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface PlaceResult {
  address: string
  coordinates?: {
    lat: number
    lng: number
  }
  placeId?: string
  formattedAddress?: string
  displayName?: string
}

interface GooglePlacePickerProps {
  value: string
  onChange: (value: string, placeResult?: PlaceResult) => void
  onPlaceSelect?: (placeResult: PlaceResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  helperText?: string
  error?: string
  countryRestriction?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any
      'gmpx-place-picker': any
    }
  }
}

export default function GooglePlacePicker({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address",
  label,
  required = false,
  className = "",
  helperText,
  error,
  countryRestriction = 'th'
}: GooglePlacePickerProps) {
  const placePickerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if Google Maps is available
  const isGoogleMapsAvailable = googleMapsConfig.enabled && googleMapsConfig.apiKey !== 'YOUR_API_KEY'

  useEffect(() => {
    if (!isGoogleMapsAvailable) {
      return
    }

    loadGoogleExtendedComponents()
  }, [isGoogleMapsAvailable])

  const loadGoogleExtendedComponents = async () => {
    if (document.querySelector('script[src*="@googlemaps/extended-component-library"]')) {
      setIsLoaded(true)
      return
    }

    setIsLoading(true)

    try {
      // Load the Google Maps Extended Component Library
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js'
      
      script.onload = () => {
        setIsLoaded(true)
        setIsLoading(false)
        setupPlacePicker()
      }

      script.onerror = () => {
        setIsLoading(false)
        console.error('Failed to load Google Extended Component Library')
      }

      document.head.appendChild(script)
    } catch (error) {
      setIsLoading(false)
      console.error('Error loading Google Extended Components:', error)
    }
  }

  const setupPlacePicker = () => {
    // Wait for custom elements to be defined
    if (typeof customElements !== 'undefined') {
      customElements.whenDefined('gmpx-place-picker').then(() => {
        const placePicker = placePickerRef.current
        if (placePicker) {
          placePicker.addEventListener('gmpx-placechange', handlePlaceChange)
        }
      })
    }
  }

  const handlePlaceChange = (event: any) => {
    const place = event.target.value
    
    if (!place) return

    const placeResult: PlaceResult = {
      address: place.formattedAddress || place.displayName || '',
      coordinates: place.location ? {
        lat: place.location.lat,
        lng: place.location.lng
      } : undefined,
      placeId: place.id,
      formattedAddress: place.formattedAddress,
      displayName: place.displayName
    }

    onChange(placeResult.address, placeResult)
    onPlaceSelect?.(placeResult)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // Fallback component when Google Places is not available
  const FallbackInput = () => (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={className}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <MapPin className="h-4 w-4 text-neutral-400" />
        </div>
      </div>
      {!isGoogleMapsAvailable && (
        <div className="flex items-center gap-1 text-xs text-yellow-400">
          <AlertCircle className="h-3 w-3" />
          <span>Address autocomplete unavailable - Google Maps API not configured</span>
        </div>
      )}
      {helperText && (
        <p className="text-sm text-neutral-400">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )

  // Show fallback if Google Maps is not available
  if (!isGoogleMapsAvailable) {
    return <FallbackInput />
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      {/* Google Maps API Loader */}
      {isGoogleMapsAvailable && (
        <gmpx-api-loader 
          key={googleMapsConfig.apiKey} 
          solution-channel="GMP_GE_placepicker_v2"
        />
      )}

      <div className="relative">
        {isLoaded ? (
          <div className="w-full">
            <gmpx-place-picker
              ref={placePickerRef}
              placeholder={placeholder}
              className={`w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-neutral-600 ${className}`}
              country={countryRestriction}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <MapPin className="h-4 w-4 text-green-400" />
            </div>
          </div>
        ) : (
          <div className="relative">
            <Input
              value={value}
              onChange={handleInputChange}
              placeholder={isLoading ? "Loading address autocomplete..." : placeholder}
              required={required}
              className={className}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-neutral-400 border-t-transparent rounded-full" />
              ) : (
                <MapPin className="h-4 w-4 text-neutral-400" />
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-1 text-xs text-blue-400">
          <div className="animate-spin h-3 w-3 border border-blue-400 border-t-transparent rounded-full" />
          <span>Loading Google Places...</span>
        </div>
      )}
      
      {isLoaded && (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <MapPin className="h-3 w-3" />
          <span>Address autocomplete enabled</span>
        </div>
      )}
      
      {helperText && (
        <p className="text-sm text-neutral-400">{helperText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
