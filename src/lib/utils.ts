import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize data for Firestore by removing undefined values
 * Firestore does not accept undefined values and will throw an error
 */
export function sanitizeForFirestore<T extends Record<string, any>>(data: T): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key as keyof T] = sanitizeForFirestore(value)
      } else {
        sanitized[key as keyof T] = value
      }
    }
  }

  return sanitized
}
