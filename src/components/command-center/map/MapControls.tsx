'use client'

import { useState } from 'react'

interface MapControlsProps {
  map: google.maps.Map
  onLayerToggle: (layer: string, enabled: boolean) => void
  layers: {
    traffic: boolean
    staff: boolean
    properties: boolean
    routes: boolean
  }
}

export default function MapControls({ map, onLayerToggle, layers }: MapControlsProps) {
  const [showLayerPanel, setShowLayerPanel] = useState(false)

  const handleZoomIn = () => {
    const currentZoom = map.getZoom() || 12
    map.setZoom(currentZoom + 1)
  }

  const handleZoomOut = () => {
    const currentZoom = map.getZoom() || 12
    map.setZoom(Math.max(currentZoom - 1, 1))
  }

  const handleRecenter = () => {
    // Recenter to Bali
    map.setCenter({ lat: -8.3405, lng: 115.0920 })
    map.setZoom(12)
  }

  const toggleMapType = () => {
    const currentType = map.getMapTypeId()
    const newType = currentType === 'roadmap' ? 'satellite' : 'roadmap'
    map.setMapTypeId(newType)
  }

  return (
    <>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Recenter Map"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={toggleMapType}
          className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Toggle Map Type"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        </button>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 left-4">
        <div className="relative">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center space-x-2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white hover:bg-gray-700 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span className="text-sm font-medium">Layers</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showLayerPanel ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Layer Panel */}
          {showLayerPanel && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10">
              <div className="p-3">
                <h3 className="text-white font-medium mb-3">Map Layers</h3>
                
                <div className="space-y-3">
                  {/* Staff Tracking */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-white text-sm">Staff Tracking</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layers.staff}
                        onChange={(e) => onLayerToggle('staff', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Property Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded"></div>
                      <span className="text-white text-sm">Property Status</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layers.properties}
                        onChange={(e) => onLayerToggle('properties', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Job Routes */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-1 bg-orange-400 rounded"></div>
                      <span className="text-white text-sm">Job Routes</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layers.routes}
                        onChange={(e) => onLayerToggle('routes', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Traffic */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-1 bg-red-400 rounded"></div>
                      <span className="text-white text-sm">Traffic</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layers.traffic}
                        onChange={(e) => onLayerToggle('traffic', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    Toggle layers to customize your view
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Mode Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">Normal Operations</span>
          </div>
        </div>
      </div>
    </>
  )
}
