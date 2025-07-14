/**
 * Staff Service for Database Operations
 * Handles CRUD operations for staff profiles with Supabase/localStorage fallback
 */

import {
  StaffProfile,
  CreateStaffData,
  UpdateStaffData,
  StaffFilters,
  StaffStats,
  StaffApiResponse,
  StaffListResponse,
  STAFF_ROLES
} from '@/types/staff'

// Local storage key for development fallback
const STAFF_STORAGE_KEY = 'sia_moon_staff_profiles'

class StaffService {
  private useLocalStorage = true // Set to false when Supabase is configured

  /**
   * Generate UUID for new staff profiles
   */
  private generateId(): string {
    return 'staff_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
  }

  /**
   * Get current timestamp in ISO format
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString()
  }

  /**
   * Get all staff from localStorage
   */
  private getLocalStaff(): StaffProfile[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STAFF_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading staff from localStorage:', error)
      return []
    }
  }

  /**
   * Save staff to localStorage
   */
  private saveLocalStaff(staff: StaffProfile[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff))
    } catch (error) {
      console.error('Error saving staff to localStorage:', error)
      throw new Error('Failed to save staff data')
    }
  }

  /**
   * Calculate staff statistics
   */
  private calculateStats(staff: StaffProfile[]): StaffStats {
    const stats: StaffStats = {
      total: staff.length,
      active: staff.filter(s => s.status === 'active').length,
      inactive: staff.filter(s => s.status === 'inactive').length,
      byRole: {
        cleaner: 0,
        maintenance: 0,
        admin: 0,
        supervisor: 0
      },
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueeTasks: 0,
      todayTasks: 0,
      upcomingTasks: 0,
      averageCompletionTime: 0,
      completionRate: 0
    }

    staff.forEach(member => {
      stats.byRole[member.role]++
    })

    return stats
  }

  /**
   * Apply filters and sorting to staff list
   */
  private applyFilters(staff: StaffProfile[], filters: StaffFilters): StaffProfile[] {
    let filtered = [...staff]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)
      )
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(member => member.role === filters.role)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name
            bValue = b.name
            break
          case 'role':
            aValue = a.role
            bValue = b.role
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          case 'created':
            aValue = a.created_at || ''
            bValue = b.created_at || ''
            break
          default:
            return 0
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue)
          return filters.sortOrder === 'desc' ? -comparison : comparison
        }

        return 0
      })
    }

    return filtered
  }

  /**
   * Validate staff data
   */
  private validateStaffData(data: CreateStaffData | UpdateStaffData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Name validation
    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters long'
      }
    }

    // Email validation
    if ('email' in data && data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!data.email || !emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address'
      }
    }

    // Phone validation (optional)
    if ('phone' in data && data.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.phone = 'Please enter a valid phone number'
      }
    }

    // Role validation
    if ('role' in data && data.role !== undefined) {
      const validRoles = STAFF_ROLES.map(r => r.value)
      if (!validRoles.includes(data.role)) {
        errors.role = 'Please select a valid role'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Get all staff with optional filtering
   */
  async getAllStaff(filters: StaffFilters = {}): Promise<StaffListResponse> {
    try {
      console.log('📋 Fetching staff with filters:', filters)

      if (this.useLocalStorage) {
        const allStaff = this.getLocalStaff()
        const filteredStaff = this.applyFilters(allStaff, filters)
        const stats = this.calculateStats(allStaff)

        return {
          success: true,
          data: filteredStaff,
          stats
        }
      }

      // TODO: Implement Supabase query when ready
      throw new Error('Supabase integration not yet implemented')

    } catch (error) {
      console.error('❌ Error fetching staff:', error)
      return {
        success: false,
        data: [],
        stats: {
          total: 0,
          active: 0,
          inactive: 0,
          byRole: { cleaner: 0, maintenance: 0, admin: 0, supervisor: 0 },
          totalTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
          overdueeTasks: 0,
          todayTasks: 0,
          upcomingTasks: 0,
          averageCompletionTime: 0,
          completionRate: 0
        },
        error: error instanceof Error ? error.message : 'Failed to fetch staff'
      }
    }
  }

  /**
   * Get staff member by ID
   */
  async getStaffById(id: string): Promise<StaffApiResponse> {
    try {
      console.log('🔍 Fetching staff member:', id)

      if (this.useLocalStorage) {
        const allStaff = this.getLocalStaff()
        const staff = allStaff.find(s => s.id === id)

        if (!staff) {
          return {
            success: false,
            error: 'Staff member not found'
          }
        }

        return {
          success: true,
          data: staff
        }
      }

      // TODO: Implement Supabase query when ready
      throw new Error('Supabase integration not yet implemented')

    } catch (error) {
      console.error('❌ Error fetching staff member:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch staff member'
      }
    }
  }

  /**
   * Create new staff member
   */
  async createStaff(data: CreateStaffData): Promise<StaffApiResponse> {
    try {
      console.log('➕ Creating new staff member:', data.name)

      // Validate data
      const validation = this.validateStaffData(data)
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0]
        }
      }

      if (this.useLocalStorage) {
        const allStaff = this.getLocalStaff()
        
        // Check for duplicate email
        const existingStaff = allStaff.find(s => s.email.toLowerCase() === data.email.toLowerCase())
        if (existingStaff) {
          return {
            success: false,
            error: 'A staff member with this email already exists'
          }
        }

        const newStaff: StaffProfile = {
          id: this.generateId(),
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim(),
          role: data.role,
          status: data.status || 'active',
          created_at: this.getCurrentTimestamp(),
          updated_at: this.getCurrentTimestamp()
        }

        allStaff.push(newStaff)
        this.saveLocalStaff(allStaff)

        return {
          success: true,
          data: newStaff,
          message: 'Staff member created successfully'
        }
      }

      // TODO: Implement Supabase insert when ready
      throw new Error('Supabase integration not yet implemented')

    } catch (error) {
      console.error('❌ Error creating staff member:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create staff member'
      }
    }
  }

  /**
   * Update staff member
   */
  async updateStaff(id: string, data: UpdateStaffData): Promise<StaffApiResponse> {
    try {
      console.log('✏️ Updating staff member:', id)

      // Validate data
      const validation = this.validateStaffData(data)
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0]
        }
      }

      if (this.useLocalStorage) {
        const allStaff = this.getLocalStaff()
        const staffIndex = allStaff.findIndex(s => s.id === id)

        if (staffIndex === -1) {
          return {
            success: false,
            error: 'Staff member not found'
          }
        }

        // Check for duplicate email (excluding current staff member)
        if (data.email) {
          const existingStaff = allStaff.find(s => 
            s.id !== id && s.email.toLowerCase() === data.email!.toLowerCase()
          )
          if (existingStaff) {
            return {
              success: false,
              error: 'A staff member with this email already exists'
            }
          }
        }

        const updatedStaff: StaffProfile = {
          ...allStaff[staffIndex],
          ...data,
          email: data.email ? data.email.toLowerCase().trim() : allStaff[staffIndex].email,
          name: data.name ? data.name.trim() : allStaff[staffIndex].name,
          phone: data.phone?.trim(),
          updated_at: this.getCurrentTimestamp()
        }

        allStaff[staffIndex] = updatedStaff
        this.saveLocalStaff(allStaff)

        return {
          success: true,
          data: updatedStaff,
          message: 'Staff member updated successfully'
        }
      }

      // TODO: Implement Supabase update when ready
      throw new Error('Supabase integration not yet implemented')

    } catch (error) {
      console.error('❌ Error updating staff member:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update staff member'
      }
    }
  }

  /**
   * Delete staff member
   */
  async deleteStaff(id: string): Promise<StaffApiResponse> {
    try {
      console.log('🗑️ Deleting staff member:', id)

      if (this.useLocalStorage) {
        const allStaff = this.getLocalStaff()
        const staffIndex = allStaff.findIndex(s => s.id === id)

        if (staffIndex === -1) {
          return {
            success: false,
            error: 'Staff member not found'
          }
        }

        const deletedStaff = allStaff[staffIndex]
        allStaff.splice(staffIndex, 1)
        this.saveLocalStaff(allStaff)

        return {
          success: true,
          data: deletedStaff,
          message: 'Staff member deleted successfully'
        }
      }

      // TODO: Implement Supabase delete when ready
      throw new Error('Supabase integration not yet implemented')

    } catch (error) {
      console.error('❌ Error deleting staff member:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete staff member'
      }
    }
  }

  /**
   * Bulk update staff status
   */
  async bulkUpdateStatus(ids: string[], status: 'active' | 'inactive'): Promise<StaffApiResponse> {
    try {
      console.log('🔄 Bulk updating staff status:', { ids, status })

      if (this.useLocalStorage) {
        const allStaff = this.getLocalStaff()
        let updatedCount = 0

        allStaff.forEach(staff => {
          if (ids.includes(staff.id)) {
            staff.status = status
            staff.updated_at = this.getCurrentTimestamp()
            updatedCount++
          }
        })

        this.saveLocalStaff(allStaff)

        return {
          success: true,
          message: `Updated ${updatedCount} staff member(s) to ${status}`
        }
      }

      // TODO: Implement Supabase bulk update when ready
      throw new Error('Supabase integration not yet implemented')

    } catch (error) {
      console.error('❌ Error bulk updating staff:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update staff members'
      }
    }
  }
}

const staffServiceInstance = new StaffService()
export default staffServiceInstance
