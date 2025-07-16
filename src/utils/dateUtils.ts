/**
 * Date utility functions for handling Firebase Timestamps and other date operations
 */

/**
 * Safely converts Firebase Timestamp objects to Date objects
 * Handles various input types including Firebase Timestamps, Date objects, strings, and numbers
 * 
 * @param timestamp - The timestamp to convert (Firebase Timestamp, Date, string, or number)
 * @returns Date object
 */
export const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date()
  
  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp
  
  // If it's a Firebase Timestamp with seconds and nanoseconds
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000)
  }
  
  // If it's a string or number
  return new Date(timestamp)
}

/**
 * Formats a timestamp for display with relative time (e.g., "2 hours ago")
 * 
 * @param timestamp - The timestamp to format
 * @returns Formatted string
 */
export const formatRelativeTime = (timestamp: any): string => {
  const date = toDate(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

/**
 * Formats a timestamp for display in local date format
 * 
 * @param timestamp - The timestamp to format
 * @returns Formatted date string
 */
export const formatLocalDate = (timestamp: any): string => {
  return toDate(timestamp).toLocaleDateString()
}

/**
 * Formats a timestamp for display in local date and time format
 * 
 * @param timestamp - The timestamp to format
 * @returns Formatted date and time string
 */
export const formatLocalDateTime = (timestamp: any): string => {
  return toDate(timestamp).toLocaleString()
}

/**
 * Checks if a timestamp is today
 * 
 * @param timestamp - The timestamp to check
 * @returns True if the timestamp is today
 */
export const isToday = (timestamp: any): boolean => {
  const date = toDate(timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Gets the start of today as a Date object
 * 
 * @returns Date object representing start of today
 */
export const getStartOfToday = (): Date => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Gets the end of today as a Date object
 * 
 * @returns Date object representing end of today
 */
export const getEndOfToday = (): Date => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return today
}

/**
 * Calculates the difference between two timestamps in minutes
 * 
 * @param startTimestamp - The start timestamp
 * @param endTimestamp - The end timestamp (defaults to now)
 * @returns Difference in minutes
 */
export const getDifferenceInMinutes = (startTimestamp: any, endTimestamp: any = new Date()): number => {
  const start = toDate(startTimestamp)
  const end = toDate(endTimestamp)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
}

/**
 * Calculates the difference between two timestamps in hours
 * 
 * @param startTimestamp - The start timestamp
 * @param endTimestamp - The end timestamp (defaults to now)
 * @returns Difference in hours
 */
export const getDifferenceInHours = (startTimestamp: any, endTimestamp: any = new Date()): number => {
  return Math.floor(getDifferenceInMinutes(startTimestamp, endTimestamp) / 60)
}

/**
 * Formats a duration in minutes to a human-readable string
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}
