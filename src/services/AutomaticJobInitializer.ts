/**
 * Automatic Job Creation Initializer
 * Starts the automatic job creation monitoring when the app loads
 */

import { automaticJobCreationService } from './AutomaticJobCreationService'

class AutomaticJobInitializer {
  private initialized = false

  /**
   * Initialize automatic job creation monitoring
   */
  initialize(): void {
    if (this.initialized) {
      console.log('⏭️ Automatic job creation already initialized')
      return
    }

    try {
      console.log('🚀 Initializing automatic job creation system...')
      
      // Start monitoring confirmed bookings
      automaticJobCreationService.startMonitoring()
      
      this.initialized = true
      console.log('✅ Automatic job creation system initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize automatic job creation:', error)
    }
  }

  /**
   * Stop automatic job creation monitoring
   */
  shutdown(): void {
    if (!this.initialized) {
      return
    }

    try {
      console.log('🔄 Shutting down automatic job creation system...')
      
      automaticJobCreationService.stopMonitoring()
      
      this.initialized = false
      console.log('✅ Automatic job creation system shut down')
      
    } catch (error) {
      console.error('❌ Error shutting down automatic job creation:', error)
    }
  }

  /**
   * Check if the system is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Export singleton instance
export const automaticJobInitializer = new AutomaticJobInitializer()
export default automaticJobInitializer
