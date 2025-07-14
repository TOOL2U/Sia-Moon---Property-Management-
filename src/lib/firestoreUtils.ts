import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Check if Firestore is online and accessible
 */
export async function checkFirestoreConnectivity(): Promise<boolean> {
  try {
    if (!db) {
      console.warn('⚠️ Firestore not initialized')
      return false
    }

    // Try a simple read operation to test connectivity
    const testDoc = doc(db, 'connectivity-test', 'test')
    await getDoc(testDoc)

    console.log('✅ Firestore connectivity check passed')
    return true
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.warn('⚠️ Firestore connectivity check failed:', errorMessage)
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
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Firestore operation attempt ${attempt}/${maxRetries}`)
      return await operation()
    } catch (error: unknown) {
      lastError = error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : null
      
      console.warn(`❌ Firestore operation failed (attempt ${attempt}/${maxRetries}):`, errorMessage)
      
      // Don't retry on certain error types
      if (errorCode === 'permission-denied' || errorCode === 'not-found') {
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
export function isConnectivityError(error: unknown): boolean {
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
  
  const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : null
  const errorMessage = error instanceof Error ? error.message : null
  
  return (
    (errorCode && connectivityErrorCodes.includes(errorCode)) ||
    (errorMessage && connectivityErrorMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg)
    )) || false
  )
}

/**
 * Get user document with retry logic and offline handling
 */
export async function getUserDocument(userId: string) {
  return retryFirestoreOperation(async () => {
    if (!db) {
      throw new Error('Firestore not initialized')
    }
    const userDoc = await getDoc(doc(db, 'users', userId))
    return userDoc
  })
}
