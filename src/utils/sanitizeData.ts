/**
 * Utility functions for sanitizing form data before Firestore writes
 * to prevent undefined field errors
 */

export type SanitizedRecord = Record<string, unknown>

/**
 * Sanitizes form data by removing undefined values and converting them to null
 * @param obj - The object to sanitize
 * @returns The sanitized object with no undefined values
 */
export function sanitizeFormData(obj: Record<string, unknown>): SanitizedRecord {
  const sanitized: SanitizedRecord = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // Keep all non-undefined values
      sanitized[key] = value
    }
    // Skip undefined values (they won't be included in Firestore write)
  }
  
  return sanitized
}

/**
 * Sanitizes numeric fields by converting empty strings to undefined
 * @param value - The string value to convert
 * @returns The parsed number or undefined if invalid/empty
 */
export function sanitizeNumericField(value: string | undefined): number | undefined {
  if (!value || value.trim() === '') return undefined
  const parsed = Number(value)
  return isNaN(parsed) ? undefined : parsed
}

/**
 * Sanitizes numeric fields by converting empty strings to null (for systems that prefer null)
 * @param value - The string value to convert
 * @returns The parsed number or null if invalid/empty
 */
export function sanitizeNumericFieldToNull(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null
  const parsed = Number(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Recursively sanitizes nested objects, removing undefined values
 * @param obj - The object to sanitize
 * @returns The sanitized object
 */
export function deepSanitizeFormData(obj: Record<string, unknown>): SanitizedRecord {
  const sanitized: SanitizedRecord = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = deepSanitizeFormData(value as Record<string, unknown>)
      } else {
        sanitized[key] = value
      }
    }
  }
  
  return sanitized
}
