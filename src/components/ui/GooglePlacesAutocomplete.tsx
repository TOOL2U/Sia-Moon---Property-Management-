'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { googleMapsConfig } from '@/lib/env'
import { MapPin, AlertCircle } from 'lucide-react'

interface PlaceResult {
  address: string
  coordinates?: {
    lat: number
    lng: number
  }
  placeId?: string
  formattedAddress?: string
  addressComponents?: google.maps.GeocoderAddressComponent[]
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string, placeResult?: PlaceResult) => void
  onPlaceSelect?: (placeResult: PlaceResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  helperText?: string
  error?: string
  countryRestriction?: string[] // e.g., ['th'] for Thailand only
  types?: string[] // e.g., ['address', 'establishment']
}

declare global {
  interface Window {
    google: typeof google
    initGooglePlaces: () => void
  }
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address",
  label,
  required = false,
  className = "",
  helperText,
  error,
  countryRestriction = ['th'], // Default to Thailand
  types = ['address']
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if Google Maps is available
  const isGoogleMapsAvailable = googleMapsConfig.enabled && googleMapsConfig.apiKey !== 'YOUR_API_KEY'

  useEffect(() => {
    if (!isGoogleMapsAvailable) {
      return
    }

    // Load Google Maps API if not already loaded
    if (!window.google) {
      loadGoogleMapsAPI()
    } else {
      initializeAutocomplete()
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isGoogleMapsAvailable])

  const loadGoogleMapsAPI = () => {
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    setIsLoading(true)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsConfig.apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true

    window.initGooglePlaces = () => {
      setIsGoogleLoaded(true)
      setIsLoading(false)
      initializeAutocomplete()
    }

    script.onerror = () => {
      setIsLoading(false)
      console.error('Failed to load Google Maps API')
    }

    document.head.appendChild(script)
  }

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: types,
        componentRestrictions: countryRestriction.length > 0 ? { country: countryRestriction } : undefined,
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
      })

      autocompleteRef.current = autocomplete

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        
        if (!place.geometry || !place.geometry.location) {
          console.warn('No geometry found for selected place')
          return
        }

        const placeResult: PlaceResult = {
          address: place.formatted_address || place.name || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          placeId: place.place_id,
          formattedAddress: place.formatted_address,
          addressComponents: place.address_components
        }

        onChange(placeResult.address, placeResult)
        onPlaceSelect?.(placeResult)
      })

      setIsGoogleLoaded(true)
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error)
    }
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
      <div className="relative">
        <Input
          ref={inputRef}
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
          ) : isGoogleLoaded ? (
            <MapPin className="h-4 w-4 text-green-400" />
          ) : (
            <MapPin className="h-4 w-4 text-neutral-400" />
          )}
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center gap-1 text-xs text-blue-400">
          <div className="animate-spin h-3 w-3 border border-blue-400 border-t-transparent rounded-full" />
          <span>Loading Google Places...</span>
        </div>
      )}
      {isGoogleLoaded && (
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
