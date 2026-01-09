'use client'

import { useEffect } from 'react'
import { initializeServices } from '@/lib/initializeServices'

/**
 * 🚀 Service Initializer Component
 * 
 * Initializes global real-time services when the app loads
 * - Job-to-calendar sync
 * - Real-time listeners
 */
export default function ServiceInitializer() {
  useEffect(() => {
    // Initialize services on client side only
    initializeServices()
  }, [])

  // This component doesn't render anything
  return null
}
