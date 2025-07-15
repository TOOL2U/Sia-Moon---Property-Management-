'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface DynamicChartWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function DynamicChartWrapper({ children, fallback }: DynamicChartWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-64 bg-neutral-900 rounded-lg">
          <div className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading chart...</span>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
