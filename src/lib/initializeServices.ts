/**
 * 🚀 Global Service Initializer
 * 
 * Initializes real-time services that need to run application-wide
 * Call this once when the app starts (in root layout)
 */

import { realTimeCalendarService } from '@/services/RealTimeCalendarService'

let servicesInitialized = false

export function initializeServices() {
  // Prevent multiple initializations
  if (servicesInitialized) {
    console.log('⏭️ Services already initialized, skipping...')
    return
  }

  console.log('🚀 Initializing global services...')

  try {
    // Initialize job-to-calendar sync
    realTimeCalendarService.subscribeToJobUpdates()
    console.log('✅ Job-to-calendar sync activated')

    servicesInitialized = true
    console.log('✅ All services initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing services:', error)
  }
}

// Export flag for debugging
export function areServicesInitialized() {
  return servicesInitialized
}
