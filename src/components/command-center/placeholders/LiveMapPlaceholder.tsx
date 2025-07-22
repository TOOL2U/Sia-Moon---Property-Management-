'use client'

export default function LiveMapPlaceholder() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Live Operations Map</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Live Tracking</span>
          </div>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Placeholder Map Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Interactive Map</h3>
            <p className="text-gray-400 max-w-md">
              Real-time staff locations, property status, and active job tracking will be displayed here.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Google Maps integration ready for implementation
            </div>
          </div>
        </div>

        {/* Mock Location Markers */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button className="w-8 h-8 bg-gray-800 border border-gray-600 rounded flex items-center justify-center text-white hover:bg-gray-700">
            <span className="text-lg">+</span>
          </button>
          <button className="w-8 h-8 bg-gray-800 border border-gray-600 rounded flex items-center justify-center text-white hover:bg-gray-700">
            <span className="text-lg">-</span>
          </button>
        </div>
      </div>

      {/* Map Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Active Staff (3)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Properties (12)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-300">Active Jobs (5)</span>
            </div>
          </div>
          <div className="text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}
