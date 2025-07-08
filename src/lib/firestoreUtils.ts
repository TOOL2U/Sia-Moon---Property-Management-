import { doc, getDoc, enableNetwork, disableNetwork } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Check if Firestore is online and accessible
 */
export async function checkFirestoreConnectivity(): Promise<boolean> {
  try {
    // Try to enable network first
    await enableNetwork(db)
    
    // Try a simple read operation to test connectivity
    const testDoc = doc(db, 'connectivity-test', 'test')
    await getDoc(testDoc)
    
    console.log('✅ Firestore connectivity check passed')
    return true
  } catch (error: any) {
    console.warn('⚠️ Firestore connectivity check failed:', error.message)
    return false
  }
}

/**
 * Retry a Firestore operation with exponential backoff
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Firestore operation attempt ${attempt}/${maxRetries}`)
      return await operation()
    } catch (error: any) {
      lastError = error
      console.warn(`❌ Firestore operation failed (attempt ${attempt}/${maxRetries}):`, error.message)
      
      // Don't retry on certain error types
      if (error.code === 'permission-denied' || error.code === 'not-found') {
        throw error
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Check if an error is related to connectivity issues
 */
export function isConnectivityError(error: any): boolean {
  if (!error) return false
  
  const connectivityErrorCodes = [
    'unavailable',
    'deadline-exceeded',
    'failed-precondition'
  ]
  
  const connectivityErrorMessages = [
    'offline',
    'network',
    'connection',
    'timeout'
  ]
  
  return (
    connectivityErrorCodes.includes(error.code) ||
    connectivityErrorMessages.some(msg => 
      error.message?.toLowerCase().includes(msg)
    )
  )
}

/**
 * Get user document with retry logic and offline handling
 */
export async function getUserDocument(userId: string) {
  return retryFirestoreOperation(async () => {
    const userDoc = await getDoc(doc(db, 'users', userId))
    return userDoc
  })
}
