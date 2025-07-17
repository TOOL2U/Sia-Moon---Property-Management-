/**
 * Local Database Abstraction Layer
 *
 * This file provides a local in-memory database that mimics Supabase's structure and API.
 * It's designed for development purposes and can be easily swapped back to Supabase for production.
 *
 * Features:
 * - Matches Supabase schema (users, properties, bookings)
 * - Returns Promises to mimic async behavior
 * - Same field names and data structures as Supabase
 * - Password hashing for security (even in development)
 * - Easy migration path back to Supabase
 */

import bcrypt from 'bcryptjs'

// Types matching Supabase schema
export interface User {
  id: string
  email: string
  name: string
  role: 'client' | 'staff'
  password_hash?: string // For local development only
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  name: string
  description: string
  location: string
  owner_id: string
  status: 'active' | 'inactive'
  // Booking sync configuration
  airbnb_ical_url?: string
  booking_com_ical_url?: string
  sync_enabled?: boolean
  last_sync?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  property_id: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  status: 'confirmed' | 'pending' | 'cancelled'
  // Booking sync metadata
  external_id?: string // ID from external platform (Airbnb, Booking.com)
  platform?: 'airbnb' | 'booking_com' | 'manual' | 'other'
  sync_source?: string // iCal URL or API source
  last_synced?: string // Last sync timestamp
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  type: 'cleaning' | 'maintenance' | 'inspection' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string // staff user ID
  property_id?: string // optional property association
  booking_id?: string // optional booking association (for auto-generated cleaning tasks)
  due_date: string
  completed_at?: string
  notes?: string
  created_by: string // admin/system user ID
  created_at: string
  updated_at: string
}

export interface BookingSyncLog {
  id: string
  property_id: string
  sync_source: string // iCal URL or API endpoint
  platform: 'airbnb' | 'booking_com' | 'other'
  status: 'success' | 'error' | 'partial'
  bookings_found: number
  bookings_created: number
  bookings_updated: number
  error_message?: string
  sync_duration_ms: number
  created_at: string
}

export interface FinancialTransaction {
  id: string
  property_id: string
  booking_id?: string // Optional link to booking
  type: 'income' | 'expense'
  category: 'booking_revenue' | 'cleaning_fee' | 'maintenance' | 'utilities' | 'supplies' | 'management_fee' | 'other'
  amount: number // In cents to avoid floating point issues
  currency: 'USD' | 'EUR' | 'GBP' | 'THB'
  description: string
  date: string // Transaction date (YYYY-MM-DD)
  receipt_url?: string // Optional receipt/invoice URL
  created_by: string // User ID who created the transaction
  created_at: string
  updated_at: string
}

export interface MonthlyReport {
  id: string
  property_id: string
  year: number
  month: number // 1-12
  status: 'generating' | 'completed' | 'error'

  // Financial Summary
  total_income: number // In cents
  total_expenses: number // In cents
  net_income: number // In cents
  currency: 'USD' | 'EUR' | 'GBP' | 'THB'

  // Occupancy Data
  total_nights: number // Total nights in the month
  occupied_nights: number // Nights with bookings
  occupancy_rate: number // Percentage (0-100)

  // Booking Statistics
  total_bookings: number
  average_booking_value: number // In cents
  average_stay_length: number // In days

  // Key Metrics
  revenue_per_available_night: number // RevPAN in cents

  // Report Data
  income_breakdown: Record<string, number> // Category -> amount in cents
  expense_breakdown: Record<string, number> // Category -> amount in cents
  booking_details: Array<{
    id: string
    guest_name: string
    check_in: string
    check_out: string
    nights: number
    revenue: number
    platform: string
  }>

  // Notes and Highlights
  key_notes: string[]
  maintenance_summary?: string
  recommendations?: string[]

  // Report Generation
  generated_at: string
  generated_by: string // 'system' or user ID
  pdf_url?: string // URL to generated PDF

  created_at: string
  updated_at: string
}

export interface VillaOnboarding {
  id: string
  user_id: string
  // Owner Details
  owner_full_name: string
  owner_nationality?: string
  owner_contact_number: string
  owner_email: string
  preferred_contact_method?: string
  bank_details?: string

  // Property Details
  property_name: string
  property_address: string
  google_maps_url?: string
  bedrooms?: number
  bathrooms?: number
  land_size_sqm?: number
  villa_size_sqm?: number
  year_built?: number

  // Amenities
  has_pool: boolean
  has_garden: boolean
  has_air_conditioning: boolean
  internet_provider?: string
  has_parking: boolean
  has_laundry: boolean
  has_backup_power: boolean

  // Access & Staff
  access_details?: string
  has_smart_lock: boolean
  gate_remote_details?: string
  onsite_staff?: string

  // Utilities
  electricity_provider?: string
  water_source?: string
  internet_package?: string

  // Rental & Marketing
  rental_rates?: string
  platforms_listed?: string[]
  average_occupancy_rate?: string
  minimum_stay_requirements?: string
  target_guests?: string
  owner_blackout_dates?: string

  // Preferences & Rules
  pets_allowed: boolean
  parties_allowed: boolean
  smoking_allowed: boolean
  maintenance_auto_approval_limit?: string

  // Current Condition
  repairs_needed?: string

  // Photos & Media
  professional_photos_status?: string
  floor_plan_images_available: boolean
  video_walkthrough_available: boolean

  // Emergency Contact
  emergency_contact_name?: string
  emergency_contact_phone?: string

  // File URLs
  title_deed_url?: string
  floor_plans_url?: string
  furniture_appliances_list_url?: string

  // Status and metadata
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

// Database response types (matching Supabase format)
export interface DatabaseResponse<T> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseError {
  message: string
  code?: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'email' | 'push' | 'in_app'
  category: 'report_generated' | 'task_assigned' | 'task_completed' | 'invoice_created' | 'booking_confirmed' | 'maintenance_required' | 'system_alert'
  title: string
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any> // Additional data for the notification

  // Delivery Status
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
  sent_at?: string
  delivered_at?: string
  read_at?: string

  // Targeting
  priority: 'low' | 'normal' | 'high' | 'urgent'
  channels: ('email' | 'push' | 'in_app')[]

  // Email specific
  email_subject?: string
  email_template?: string

  // Push notification specific
  push_title?: string
  push_body?: string
  push_icon?: string
  push_url?: string

  // Metadata
  created_at: string
  updated_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string

  // Email preferences
  email_enabled: boolean
  email_reports: boolean
  email_tasks: boolean
  email_invoices: boolean
  email_bookings: boolean
  email_maintenance: boolean
  email_marketing: boolean

  // Push notification preferences
  push_enabled: boolean
  push_tasks: boolean
  push_urgent_only: boolean
  push_quiet_hours_start?: string // HH:MM format
  push_quiet_hours_end?: string // HH:MM format

  // In-app notification preferences
  in_app_enabled: boolean
  in_app_sound: boolean

  // OneSignal player ID for push notifications
  onesignal_player_id?: string

  created_at: string
  updated_at: string
}

export interface NotificationTemplate {
  id: string
  name: string
  category: string
  type: 'email' | 'push' | 'in_app'

  // Template content
  subject?: string // For email
  title: string
  body: string
  html_body?: string // For email

  // Variables that can be used in the template
  variables: string[] // e.g., ['property_name', 'guest_name', 'amount']

  // Template metadata
  is_active: boolean
  created_at: string
  updated_at: string
}

// In-memory database store
class LocalDatabase {
  private users: User[] = []
  private properties: Property[] = []
  private bookings: Booking[] = []
  private villaOnboardings: VillaOnboarding[] = []
  private tasks: Task[] = []
  private bookingSyncLogs: BookingSyncLog[] = []
  private financialTransactions: FinancialTransaction[] = []
  private monthlyReports: MonthlyReport[] = []
  private notifications: Notification[] = []
  private notificationPreferences: NotificationPreference[] = []
  private notificationTemplates: NotificationTemplate[] = []
  private initialized = false

  // localStorage keys for persistence
  private readonly STORAGE_KEYS = {
    users: 'sia_moon_users',
    properties: 'sia_moon_properties',
    bookings: 'sia_moon_bookings',
    villaOnboardings: 'sia_moon_villa_onboardings',
    tasks: 'sia_moon_tasks',
    bookingSyncLogs: 'sia_moon_booking_sync_logs',
    financialTransactions: 'sia_moon_financial_transactions',
    monthlyReports: 'sia_moon_monthly_reports',
    notifications: 'sia_moon_notifications',
    notificationPreferences: 'sia_moon_notification_preferences',
    notificationTemplates: 'sia_moon_notification_templates'
  }

  constructor() {
    this.loadFromStorage()
    this.initializeEmptyData()
  }

  // Load data from localStorage
  private loadFromStorage() {
    if (typeof window === 'undefined') return // Skip on server-side

    try {
      const usersData = localStorage.getItem(this.STORAGE_KEYS.users)
      const propertiesData = localStorage.getItem(this.STORAGE_KEYS.properties)
      const bookingsData = localStorage.getItem(this.STORAGE_KEYS.bookings)
      const villaOnboardingsData = localStorage.getItem(this.STORAGE_KEYS.villaOnboardings)
      const tasksData = localStorage.getItem(this.STORAGE_KEYS.tasks)
      const syncLogsData = localStorage.getItem(this.STORAGE_KEYS.bookingSyncLogs)
      const financialTransactionsData = localStorage.getItem(this.STORAGE_KEYS.financialTransactions)
      const monthlyReportsData = localStorage.getItem(this.STORAGE_KEYS.monthlyReports)
      const notificationsData = localStorage.getItem(this.STORAGE_KEYS.notifications)
      const notificationPreferencesData = localStorage.getItem(this.STORAGE_KEYS.notificationPreferences)
      const notificationTemplatesData = localStorage.getItem(this.STORAGE_KEYS.notificationTemplates)

      if (usersData) this.users = JSON.parse(usersData)
      if (propertiesData) this.properties = JSON.parse(propertiesData)
      if (bookingsData) this.bookings = JSON.parse(bookingsData)
      if (villaOnboardingsData) this.villaOnboardings = JSON.parse(villaOnboardingsData)
      if (tasksData) this.tasks = JSON.parse(tasksData)
      if (syncLogsData) this.bookingSyncLogs = JSON.parse(syncLogsData)
      if (financialTransactionsData) this.financialTransactions = JSON.parse(financialTransactionsData)
      if (monthlyReportsData) this.monthlyReports = JSON.parse(monthlyReportsData)
      if (notificationsData) this.notifications = JSON.parse(notificationsData)
      if (notificationPreferencesData) this.notificationPreferences = JSON.parse(notificationPreferencesData)
      if (notificationTemplatesData) this.notificationTemplates = JSON.parse(notificationTemplatesData)

      console.log('📦 Loaded data from localStorage:', {
        users: this.users.length,
        properties: this.properties.length,
        bookings: this.bookings.length,
        villaOnboardings: this.villaOnboardings.length,
        tasks: this.tasks.length,
        syncLogs: this.bookingSyncLogs.length,
        financialTransactions: this.financialTransactions.length,
        monthlyReports: this.monthlyReports.length,
        notifications: this.notifications.length,
        notificationPreferences: this.notificationPreferences.length,
        notificationTemplates: this.notificationTemplates.length
      })
    } catch (error) {
      console.warn('⚠️ Failed to load data from localStorage:', error)
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    if (typeof window === 'undefined') return // Skip on server-side

    try {
      localStorage.setItem(this.STORAGE_KEYS.users, JSON.stringify(this.users))
      localStorage.setItem(this.STORAGE_KEYS.properties, JSON.stringify(this.properties))
      localStorage.setItem(this.STORAGE_KEYS.bookings, JSON.stringify(this.bookings))
      localStorage.setItem(this.STORAGE_KEYS.villaOnboardings, JSON.stringify(this.villaOnboardings))
      localStorage.setItem(this.STORAGE_KEYS.tasks, JSON.stringify(this.tasks))
      localStorage.setItem(this.STORAGE_KEYS.bookingSyncLogs, JSON.stringify(this.bookingSyncLogs))
      localStorage.setItem(this.STORAGE_KEYS.financialTransactions, JSON.stringify(this.financialTransactions))
      localStorage.setItem(this.STORAGE_KEYS.monthlyReports, JSON.stringify(this.monthlyReports))
      localStorage.setItem(this.STORAGE_KEYS.notifications, JSON.stringify(this.notifications))
      localStorage.setItem(this.STORAGE_KEYS.notificationPreferences, JSON.stringify(this.notificationPreferences))
      localStorage.setItem(this.STORAGE_KEYS.notificationTemplates, JSON.stringify(this.notificationTemplates))

      console.log('💾 Saved data to localStorage')
    } catch (error) {
      console.warn('⚠️ Failed to save data to localStorage:', error)
    }
  }

  // Ensure database is initialized before operations
  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeTestData()
      this.initialized = true
    }
  }

  // Initialize empty arrays for production
  private initializeEmptyData() {
    if (!this.users) this.users = []
    if (!this.properties) this.properties = []
    if (!this.bookings) this.bookings = []
    if (!this.villaOnboardings) this.villaOnboardings = []
    if (!this.tasks) this.tasks = []
    if (!this.bookingSyncLogs) this.bookingSyncLogs = []
    if (!this.financialTransactions) this.financialTransactions = []
    if (!this.monthlyReports) this.monthlyReports = []
    if (!this.notifications) this.notifications = []
    if (!this.notificationPreferences) this.notificationPreferences = []
    if (!this.notificationTemplates) this.notificationTemplates = []
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // USER METHODS
  async getUser(id: string): Promise<DatabaseResponse<User>> {
    await this.ensureInitialized()
    await this.delay()
    const user = this.users.find(u => u.id === id)
    if (user) {
      // Return user without password hash for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _, ...userWithoutPassword } = user
      return {
        data: userWithoutPassword as User,
        error: null
      }
    }
    return {
      data: null,
      error: { message: 'User not found' }
    }
  }

  async getUserByEmail(email: string): Promise<DatabaseResponse<User>> {
    await this.ensureInitialized()
    await this.delay()
    const user = this.users.find(u => u.email === email)
    if (user) {
      // Return user without password hash for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...userWithoutPassword } = user
      return {
        data: userWithoutPassword as User,
        error: null
      }
    }
    return {
      data: null,
      error: { message: 'User not found' }
    }
  }

  async getAllUsers(): Promise<DatabaseResponse<User[]>> {
    await this.ensureInitialized()
    await this.delay()
    // Return users without password hashes for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usersWithoutPasswords = this.users.map(({ password_hash, ...user }) => user as User)
    return {
      data: usersWithoutPasswords,
      error: null
    }
  }

  async addUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<User>> {
    await this.ensureInitialized()
    await this.delay()

    // Check if user already exists
    const existingUser = this.users.find(u => u.email === userData.email)
    if (existingUser) {
      return {
        data: null,
        error: { message: 'User with this email already exists' }
      }
    }

    const newUser: User = {
      ...userData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.users.push(newUser)

    // Save to localStorage
    this.saveToStorage()

    // Return user without password hash for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = newUser
    return {
      data: userWithoutPassword as User,
      error: null
    }
  }

  // Enhanced user creation with password hashing
  async createUserWithPassword(
    email: string,
    password: string,
    name: string,
    role: 'client' | 'staff'
  ): Promise<DatabaseResponse<User>> {
    await this.ensureInitialized()
    await this.delay()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        data: null,
        error: { message: 'Invalid email format' }
      }
    }

    // Check if user already exists
    const existingUser = this.users.find(u => u.email === email)
    if (existingUser) {
      return {
        data: null,
        error: { message: 'User with this email already exists' }
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    const newUser: User = {
      id: this.generateId(),
      email,
      name,
      role,
      password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.users.push(newUser)

    // Save to localStorage
    this.saveToStorage()

    // Return user without password hash for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...userWithoutPassword } = newUser
    return {
      data: userWithoutPassword as User,
      error: null
    }
  }

  // Verify user password
  async verifyUserPassword(email: string, password: string): Promise<DatabaseResponse<User>> {
    await this.ensureInitialized()
    await this.delay()

    const user = this.users.find(u => u.email === email)
    if (!user || !user.password_hash) {
      return {
        data: null,
        error: { message: 'Invalid email or password' }
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return {
        data: null,
        error: { message: 'Invalid email or password' }
      }
    }

    // Return user without password hash for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user
    return {
      data: userWithoutPassword as User,
      error: null
    }
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<DatabaseResponse<User>> {
    await this.delay()
    
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return {
        data: null,
        error: { message: 'User not found' }
      }
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return {
      data: this.users[userIndex],
      error: null
    }
  }

  async deleteUser(id: string): Promise<DatabaseResponse<boolean>> {
    await this.delay()
    
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return {
        data: null,
        error: { message: 'User not found' }
      }
    }

    this.users.splice(userIndex, 1)
    return {
      data: true,
      error: null
    }
  }

  // PROPERTY METHODS
  async getProperty(id: string): Promise<DatabaseResponse<Property>> {
    await this.delay()
    const property = this.properties.find(p => p.id === id)
    return {
      data: property || null,
      error: property ? null : { message: 'Property not found' }
    }
  }

  async getAllProperties(): Promise<DatabaseResponse<Property[]>> {
    await this.delay()
    return {
      data: this.properties,
      error: null
    }
  }

  async getPropertiesByOwner(ownerId: string): Promise<DatabaseResponse<Property[]>> {
    await this.delay()
    const properties = this.properties.filter(p => p.owner_id === ownerId)
    return {
      data: properties,
      error: null
    }
  }

  async addProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Property>> {
    await this.delay()

    const newProperty: Property = {
      ...propertyData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.properties.push(newProperty)

    // Save to localStorage
    this.saveToStorage()

    return {
      data: newProperty,
      error: null
    }
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<DatabaseResponse<Property>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.properties.findIndex(p => p.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Property not found' }
      }
    }

    this.properties[index] = {
      ...this.properties[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Save to localStorage
    this.saveToStorage()

    return {
      data: this.properties[index],
      error: null
    }
  }

  // BOOKING METHODS
  async getAllBookings(): Promise<DatabaseResponse<Booking[]>> {
    await this.ensureInitialized()
    await this.delay()
    return {
      data: [...this.bookings],
      error: null
    }
  }

  async getBooking(id: string): Promise<DatabaseResponse<Booking>> {
    await this.ensureInitialized()
    await this.delay()
    const booking = this.bookings.find(b => b.id === id)
    return {
      data: booking || null,
      error: booking ? null : { message: 'Booking not found' }
    }
  }

  async getBookingsByProperty(propertyId: string): Promise<DatabaseResponse<Booking[]>> {
    await this.ensureInitialized()
    await this.delay()
    const bookings = this.bookings.filter(b => b.property_id === propertyId)
    return {
      data: bookings,
      error: null
    }
  }

  async addBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Booking>> {
    await this.ensureInitialized()
    await this.delay()

    const newBooking: Booking = {
      ...bookingData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.bookings.push(newBooking)

    // Save to localStorage
    this.saveToStorage()

    return {
      data: newBooking,
      error: null
    }
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<DatabaseResponse<Booking>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.bookings.findIndex(b => b.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Booking not found' }
      }
    }

    this.bookings[index] = {
      ...this.bookings[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Save to localStorage
    this.saveToStorage()

    return {
      data: this.bookings[index],
      error: null
    }
  }

  // VILLA ONBOARDING METHODS
  async getAllVillaOnboardings(): Promise<DatabaseResponse<VillaOnboarding[]>> {
    await this.ensureInitialized()
    await this.delay()
    return {
      data: [...this.villaOnboardings],
      error: null
    }
  }

  async getVillaOnboarding(id: string): Promise<DatabaseResponse<VillaOnboarding>> {
    await this.ensureInitialized()
    await this.delay()
    const onboarding = this.villaOnboardings.find(v => v.id === id)
    return {
      data: onboarding || null,
      error: onboarding ? null : { message: 'Villa onboarding not found' }
    }
  }

  async getVillaOnboardingsByUserId(userId: string): Promise<DatabaseResponse<VillaOnboarding[]>> {
    await this.ensureInitialized()
    await this.delay()
    const userOnboardings = this.villaOnboardings.filter(v => v.user_id === userId)
    return {
      data: userOnboardings,
      error: null
    }
  }

  async addVillaOnboarding(onboardingData: Omit<VillaOnboarding, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<VillaOnboarding>> {
    await this.ensureInitialized()
    await this.delay()

    const newOnboarding: VillaOnboarding = {
      id: this.generateId(),
      ...onboardingData,
      status: onboardingData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.villaOnboardings.push(newOnboarding)

    // Save to localStorage
    this.saveToStorage()

    return {
      data: newOnboarding,
      error: null
    }
  }

  async updateVillaOnboarding(id: string, updates: Partial<VillaOnboarding>): Promise<DatabaseResponse<VillaOnboarding>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.villaOnboardings.findIndex(v => v.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Villa onboarding not found' }
      }
    }

    this.villaOnboardings[index] = {
      ...this.villaOnboardings[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Save to localStorage
    this.saveToStorage()

    return {
      data: this.villaOnboardings[index],
      error: null
    }
  }

  async deleteVillaOnboarding(id: string): Promise<DatabaseResponse<boolean>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.villaOnboardings.findIndex(v => v.id === id)
    if (index === -1) {
      return {
        data: false,
        error: { message: 'Villa onboarding not found' }
      }
    }

    this.villaOnboardings.splice(index, 1)
    return {
      data: true,
      error: null
    }
  }

  // TASK MANAGEMENT METHODS
  async getAllTasks(): Promise<DatabaseResponse<Task[]>> {
    await this.ensureInitialized()
    await this.delay()
    return {
      data: [...this.tasks],
      error: null
    }
  }

  async getTask(id: string): Promise<DatabaseResponse<Task>> {
    await this.ensureInitialized()
    await this.delay()
    const task = this.tasks.find(t => t.id === id)
    return {
      data: task || null,
      error: task ? null : { message: 'Task not found' }
    }
  }

  async getTasksByAssignee(assigneeId: string): Promise<DatabaseResponse<Task[]>> {
    await this.ensureInitialized()
    await this.delay()
    const userTasks = this.tasks.filter(t => t.assigned_to === assigneeId)
    return {
      data: userTasks,
      error: null
    }
  }

  async getTasksByProperty(propertyId: string): Promise<DatabaseResponse<Task[]>> {
    await this.ensureInitialized()
    await this.delay()
    const propertyTasks = this.tasks.filter(t => t.property_id === propertyId)
    return {
      data: propertyTasks,
      error: null
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Task>> {
    await this.ensureInitialized()
    await this.delay()

    const newTask: Task = {
      id: this.generateId(),
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.tasks.push(newTask)

    // Save to localStorage
    this.saveToStorage()

    // Trigger notification for task assignment (if assigned to someone)
    if (newTask.assigned_to) {
      // Notification system disabled during cleanup
      console.log('Task assignment notification would be sent here')
    }

    return {
      data: newTask,
      error: null
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<DatabaseResponse<Task>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Task not found' }
      }
    }

    const previousStatus = this.tasks[index].status

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Save to localStorage
    this.saveToStorage()

    // Trigger notification for task completion
    if (previousStatus !== 'completed' && this.tasks[index].status === 'completed') {
      // Notification system disabled during cleanup
      console.log('Task completion notification would be sent here')
    }

    return {
      data: this.tasks[index],
      error: null
    }
  }

  async deleteTask(id: string): Promise<DatabaseResponse<boolean>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) {
      return {
        data: false,
        error: { message: 'Task not found' }
      }
    }

    this.tasks.splice(index, 1)

    // Save to localStorage
    this.saveToStorage()

    return {
      data: true,
      error: null
    }
  }

  // Auto-create cleaning task when booking checkout is recorded
  async createCleaningTaskForBooking(bookingId: string): Promise<DatabaseResponse<Task>> {
    await this.ensureInitialized()
    await this.delay()

    // Get the booking details
    const booking = this.bookings.find(b => b.id === bookingId)
    if (!booking) {
      return {
        data: null,
        error: { message: 'Booking not found' }
      }
    }

    // Get property details
    const property = this.properties.find(p => p.id === booking.property_id)
    if (!property) {
      return {
        data: null,
        error: { message: 'Property not found' }
      }
    }

    // Find a staff member to assign the task to (for now, assign to first staff member)
    const staffMember = this.users.find(u => u.role === 'staff')
    if (!staffMember) {
      return {
        data: null,
        error: { message: 'No staff members available for task assignment' }
      }
    }

    // Check if cleaning task already exists for this booking
    const existingTask = this.tasks.find(t => t.booking_id === bookingId && t.type === 'cleaning')
    if (existingTask) {
      return {
        data: existingTask,
        error: null
      }
    }

    // Create cleaning task
    const cleaningTask: Task = {
      id: this.generateId(),
      title: `Post-Checkout Cleaning - ${property.name}`,
      description: `Clean and prepare ${property.name} after guest checkout. Guest: ${booking.guest_name}`,
      type: 'cleaning',
      priority: 'high',
      status: 'pending',
      assigned_to: staffMember.id,
      property_id: booking.property_id,
      booking_id: bookingId,
      due_date: new Date(new Date(booking.check_out).getTime() + 24 * 60 * 60 * 1000).toISOString(), // Due 24 hours after checkout
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.tasks.push(cleaningTask)

    // Save to localStorage
    this.saveToStorage()

    return {
      data: cleaningTask,
      error: null
    }
  }

  // Financial Transaction Methods
  async createFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<FinancialTransaction>> {
    await this.ensureInitialized()
    await this.delay()

    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.financialTransactions.push(newTransaction)
    this.saveToStorage()

    return {
      data: newTransaction,
      error: null
    }
  }

  async getFinancialTransactionsByProperty(propertyId: string): Promise<DatabaseResponse<FinancialTransaction[]>> {
    await this.ensureInitialized()
    await this.delay()

    const transactions = this.financialTransactions.filter(t => t.property_id === propertyId)

    return {
      data: transactions,
      error: null
    }
  }

  async getFinancialTransactionsByDateRange(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<DatabaseResponse<FinancialTransaction[]>> {
    await this.ensureInitialized()
    await this.delay()

    const transactions = this.financialTransactions.filter(t =>
      t.property_id === propertyId &&
      t.date >= startDate &&
      t.date <= endDate
    )

    return {
      data: transactions,
      error: null
    }
  }

  async updateFinancialTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<DatabaseResponse<FinancialTransaction>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.financialTransactions.findIndex(t => t.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Financial transaction not found' }
      }
    }

    this.financialTransactions[index] = {
      ...this.financialTransactions[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveToStorage()

    return {
      data: this.financialTransactions[index],
      error: null
    }
  }

  async deleteFinancialTransaction(id: string): Promise<DatabaseResponse<boolean>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.financialTransactions.findIndex(t => t.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Financial transaction not found' }
      }
    }

    this.financialTransactions.splice(index, 1)
    this.saveToStorage()

    return {
      data: true,
      error: null
    }
  }

  // Monthly Report Methods
  async createMonthlyReport(report: Omit<MonthlyReport, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<MonthlyReport>> {
    await this.ensureInitialized()
    await this.delay()

    const newReport: MonthlyReport = {
      ...report,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.monthlyReports.push(newReport)
    this.saveToStorage()

    return {
      data: newReport,
      error: null
    }
  }

  async getMonthlyReportsByProperty(propertyId: string): Promise<DatabaseResponse<MonthlyReport[]>> {
    await this.ensureInitialized()
    await this.delay()

    const reports = this.monthlyReports
      .filter(r => r.property_id === propertyId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    return {
      data: reports,
      error: null
    }
  }

  async getMonthlyReport(propertyId: string, year: number, month: number): Promise<DatabaseResponse<MonthlyReport | null>> {
    await this.ensureInitialized()
    await this.delay()

    const report = this.monthlyReports.find(r =>
      r.property_id === propertyId &&
      r.year === year &&
      r.month === month
    )

    return {
      data: report || null,
      error: null
    }
  }

  async updateMonthlyReport(id: string, updates: Partial<MonthlyReport>): Promise<DatabaseResponse<MonthlyReport>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.monthlyReports.findIndex(r => r.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Monthly report not found' }
      }
    }

    this.monthlyReports[index] = {
      ...this.monthlyReports[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveToStorage()

    return {
      data: this.monthlyReports[index],
      error: null
    }
  }

  async getAllMonthlyReports(): Promise<DatabaseResponse<MonthlyReport[]>> {
    await this.ensureInitialized()
    await this.delay()

    const reports = this.monthlyReports.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })

    return {
      data: reports,
      error: null
    }
  }

  // Notification Methods
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Notification>> {
    await this.ensureInitialized()
    await this.delay()

    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.notifications.push(newNotification)
    this.saveToStorage()

    return {
      data: newNotification,
      error: null
    }
  }

  async getNotificationsByUser(userId: string): Promise<DatabaseResponse<Notification[]>> {
    await this.ensureInitialized()
    await this.delay()

    const notifications = this.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      data: notifications,
      error: null
    }
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<DatabaseResponse<Notification>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.notifications.findIndex(n => n.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Notification not found' }
      }
    }

    this.notifications[index] = {
      ...this.notifications[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveToStorage()

    return {
      data: this.notifications[index],
      error: null
    }
  }

  async markNotificationAsRead(id: string): Promise<DatabaseResponse<Notification>> {
    return this.updateNotification(id, {
      status: 'read',
      read_at: new Date().toISOString()
    })
  }

  // Notification Preference Methods
  async createNotificationPreference(preference: Omit<NotificationPreference, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<NotificationPreference>> {
    await this.ensureInitialized()
    await this.delay()

    const newPreference: NotificationPreference = {
      ...preference,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.notificationPreferences.push(newPreference)
    this.saveToStorage()

    return {
      data: newPreference,
      error: null
    }
  }

  async getNotificationPreferences(userId: string): Promise<DatabaseResponse<NotificationPreference | null>> {
    await this.ensureInitialized()
    await this.delay()

    const preference = this.notificationPreferences.find(p => p.user_id === userId)

    return {
      data: preference || null,
      error: null
    }
  }

  async updateNotificationPreference(id: string, updates: Partial<NotificationPreference>): Promise<DatabaseResponse<NotificationPreference>> {
    await this.ensureInitialized()
    await this.delay()

    const index = this.notificationPreferences.findIndex(p => p.id === id)
    if (index === -1) {
      return {
        data: null,
        error: { message: 'Notification preference not found' }
      }
    }

    this.notificationPreferences[index] = {
      ...this.notificationPreferences[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveToStorage()

    return {
      data: this.notificationPreferences[index],
      error: null
    }
  }

  // Notification Template Methods
  async createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<NotificationTemplate>> {
    await this.ensureInitialized()
    await this.delay()

    const newTemplate: NotificationTemplate = {
      ...template,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.notificationTemplates.push(newTemplate)
    this.saveToStorage()

    return {
      data: newTemplate,
      error: null
    }
  }

  async getNotificationTemplates(): Promise<DatabaseResponse<NotificationTemplate[]>> {
    await this.ensureInitialized()
    await this.delay()

    const templates = this.notificationTemplates.filter(t => t.is_active)

    return {
      data: templates,
      error: null
    }
  }
}

// Singleton instance
const db = new LocalDatabase()

// Export the database instance
export default db

// TODO: Replace with Supabase client for production
// Example migration:
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(url, key)
// 
// async getUser(id: string) {
//   const { data, error } = await supabase
//     .from('users')
//     .select('*')
//     .eq('id', id)
//     .single()
//   return { data, error }
// }
