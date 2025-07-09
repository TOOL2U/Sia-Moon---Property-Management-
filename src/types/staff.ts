/**
 * Staff Profile Types for Sia Moon Property Management
 */

export type StaffRole = 'cleaner' | 'maintenance' | 'admin' | 'supervisor'
export type StaffStatus = 'active' | 'inactive'

export interface StaffProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: StaffRole
  status: StaffStatus
  created_at: string
  updated_at: string
  last_active?: string
}

export interface CreateStaffData {
  name: string
  email: string
  phone?: string
  role: StaffRole
  status?: StaffStatus
}

export interface UpdateStaffData {
  name?: string
  email?: string
  phone?: string
  role?: StaffRole
  status?: StaffStatus
}

export interface StaffFilters {
  search?: string
  role?: StaffRole | 'all'
  status?: StaffStatus | 'all'
  sortBy?: 'name' | 'role' | 'status' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export interface StaffStats {
  total: number
  active: number
  inactive: number
  byRole: Record<StaffRole, number>
}

// Form validation types
export interface StaffFormErrors {
  name?: string
  email?: string
  phone?: string
  role?: string
  status?: string
  general?: string
}

// API response types
export interface StaffApiResponse {
  success: boolean
  data?: StaffProfile | StaffProfile[]
  error?: string
  message?: string
}

export interface StaffListResponse {
  success: boolean
  data: StaffProfile[]
  stats: StaffStats
  error?: string
}

// Constants
export const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: 'cleaner', label: 'Cleaner', description: 'Housekeeping and cleaning services' },
  { value: 'maintenance', label: 'Maintenance', description: 'Property maintenance and repairs' },
  { value: 'admin', label: 'Admin', description: 'Administrative and management tasks' },
  { value: 'supervisor', label: 'Supervisor', description: 'Team supervision and coordination' }
]

export const STAFF_STATUSES: { value: StaffStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' }
]
