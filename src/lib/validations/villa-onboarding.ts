import { z } from 'zod'

// Phone number validation (international format)
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/

// Email validation
const emailSchema = z.string().email('Please enter a valid email address')

// URL validation (optional)
const urlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''))

// JSON string validation
const jsonStringSchema = z.string().refine((val) => {
  if (!val.trim()) return true // Allow empty strings
  try {
    JSON.parse(val)
    return true
  } catch {
    return false
  }
}, 'Please enter valid JSON format')

// File validation schema (currently unused but kept for future use)
// const fileSchema = z.object({
//   name: z.string(),
//   size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
//   type: z.string()
// })

export const villaOnboardingSchema = z.object({
  // Owner Details
  ownerFullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  ownerNationality: z.string()
    .max(50, 'Nationality must be less than 50 characters')
    .optional(),
  
  ownerContactNumber: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .min(8, 'Phone number must be at least 8 digits'),
  
  ownerEmail: emailSchema,
  
  preferredContactMethod: z.enum(['phone', 'whatsapp', 'line', 'email'])
    .or(z.literal(''))
    .optional(),
  
  bankDetails: z.string().max(1000, 'Bank details must be less than 1000 characters').optional(),
  
  // Property Details
  propertyName: z.string()
    .min(2, 'Property name must be at least 2 characters')
    .max(100, 'Property name must be less than 100 characters'),
  
  propertyAddress: z.string()
    .min(10, 'Please provide a complete address')
    .max(500, 'Address must be less than 500 characters'),
  
  googleMapsUrl: urlSchema,
  
  bedrooms: z.string()
    .refine((val) => {
      const num = parseInt(val)
      return !isNaN(num) && num >= 1 && num <= 20
    }, 'Bedrooms must be between 1 and 20'),
  
  bathrooms: z.string()
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 1 && num <= 20
    }, 'Bathrooms must be between 1 and 20'),
  
  landSizeSqm: z.string()
    .refine((val) => {
      if (!val.trim()) return true // Optional field
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num <= 100000
    }, 'Land size must be a positive number less than 100,000 sqm')
    .optional(),
  
  villaSizeSqm: z.string()
    .refine((val) => {
      if (!val.trim()) return true // Optional field
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num <= 10000
    }, 'Villa size must be a positive number less than 10,000 sqm')
    .optional(),
  
  yearBuilt: z.string()
    .refine((val) => {
      if (!val.trim()) return true // Optional field
      const year = parseInt(val)
      const currentYear = new Date().getFullYear()
      return !isNaN(year) && year >= 1900 && year <= currentYear
    }, `Year built must be between 1900 and ${new Date().getFullYear()}`)
    .optional(),
  
  // Amenities (boolean fields)
  hasPool: z.boolean(),
  hasGarden: z.boolean(),
  hasAirConditioning: z.boolean(),
  hasParking: z.boolean(),
  hasLaundry: z.boolean(),
  hasBackupPower: z.boolean(),
  
  internetProvider: z.string().max(100).optional(),
  
  // Access & Staff
  accessDetails: z.string().max(1000, 'Access details must be less than 1000 characters').optional(),
  hasSmartLock: z.boolean(),
  gateRemoteDetails: z.string().max(500).optional(),
  onsiteStaff: z.string().max(1000, 'Onsite staff details must be less than 1000 characters').optional(),
  
  // Utilities
  electricityProvider: z.string().max(100).optional(),
  waterSource: z.string().max(100).optional(),
  internetPackage: z.string().max(100).optional(),
  
  // Rental & Marketing
  rentalRates: z.string().max(1000, 'Rental rates must be less than 1000 characters').optional(),
  platformsListed: z.array(z.string()).default([]),
  
  averageOccupancyRate: z.string()
    .refine((val) => {
      if (!val.trim()) return true // Optional field
      const rate = parseFloat(val)
      return !isNaN(rate) && rate >= 0 && rate <= 100
    }, 'Occupancy rate must be between 0 and 100')
    .optional(),
  
  minimumStayRequirements: z.string().max(200).optional(),
  targetGuests: z.string().max(200).optional(),
  ownerBlackoutDates: z.string().max(500, 'Blackout dates must be less than 500 characters').optional(),
  
  // Preferences & Rules
  petsAllowed: z.boolean(),
  partiesAllowed: z.boolean(),
  smokingAllowed: z.boolean(),
  
  maintenanceAutoApprovalLimit: z.string()
    .refine((val) => {
      if (!val.trim()) return true // Optional field
      const amount = parseFloat(val)
      return !isNaN(amount) && amount >= 0 && amount <= 1000000
    }, 'Maintenance limit must be a positive number less than 1,000,000')
    .optional(),
  
  // Current Condition
  repairsNeeded: z.string().max(1000).optional(),
  lastSepticService: z.string().optional(),
  pestControlSchedule: z.string().max(200).optional(),
  
  // Photos & Media
  professionalPhotosStatus: z.enum(['available', 'not_available', 'need_photos'])
    .or(z.literal(''))
    .optional(),
  floorPlanImagesAvailable: z.boolean(),
  videoWalkthroughAvailable: z.boolean(),
  
  // Emergency Contact
  emergencyContactName: z.string()
    .min(2, 'Emergency contact name is required')
    .max(100, 'Name must be less than 100 characters'),
  
  emergencyContactPhone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .min(8, 'Phone number must be at least 8 digits'),
  
  // Confirmation
  informationConfirmed: z.boolean()
    .refine((val) => val === true, 'You must confirm the information is accurate')
})

export type VillaOnboardingFormData = z.infer<typeof villaOnboardingSchema>

// Validation helper function
export function validateVillaOnboarding(data: unknown) {
  try {
    const validatedData = villaOnboardingSchema.parse(data)
    return { success: true, data: validatedData, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        fieldErrors[path] = err.message
      })
      return { success: false, data: null, errors: fieldErrors }
    }
    return { success: false, data: null, errors: { general: 'Validation failed' } }
  }
}

// Individual field validation for real-time feedback
export function validateField(fieldName: string, value: unknown) {
  try {
    const fieldSchema = villaOnboardingSchema.shape[fieldName as keyof typeof villaOnboardingSchema.shape]
    if (fieldSchema) {
      fieldSchema.parse(value)
      return { isValid: true, error: null }
    }
    return { isValid: true, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || 'Invalid value' }
    }
    return { isValid: false, error: 'Validation error' }
  }
}
