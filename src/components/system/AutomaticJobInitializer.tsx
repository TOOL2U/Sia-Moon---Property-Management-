'use client'

/**
 * Client-side component to initialize automatic job creation system
 */

import { useEffect } from 'react'

export default function AutomaticJobInitializer() {
  useEffect(() => {
    // Initialize automatic job creation system on client side
    const initializeJobSystem = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { automaticJobInitializer } = await import('@/services/AutomaticJobInitializer')

        // Initialize the system
        automaticJobInitializer.initialize()

        // Cleanup on unmount
        return () => {
          automaticJobInitializer.shutdown()
        }
      } catch (error) {
        console.error('❌ Failed to initialize automatic job creation system:', error)
      }
    }

    initializeJobSystem()
  }, [])

  // This component doesn't render anything
  return null
}
