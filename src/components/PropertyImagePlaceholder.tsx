'use client'

import { Building, ImageIcon } from 'lucide-react'

interface PropertyImagePlaceholderProps {
  propertyName?: string
  className?: string
  showText?: boolean
}

export function PropertyImagePlaceholder({ 
  propertyName = 'Property', 
  className = '',
  showText = true 
}: PropertyImagePlaceholderProps) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 ${className}`}>
      <div className="text-center">
        <div className="relative">
          <Building className="h-12 w-12 text-neutral-600 mx-auto mb-2" />
          <ImageIcon className="h-6 w-6 text-neutral-500 absolute -bottom-1 -right-1" />
        </div>
        {showText && (
          <div>
            <p className="text-neutral-400 text-sm font-medium">{propertyName}</p>
            <p className="text-neutral-500 text-xs mt-1">No cover photo</p>
          </div>
        )}
      </div>
    </div>
  )
}
