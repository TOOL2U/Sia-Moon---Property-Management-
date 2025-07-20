// Role-based access control for AI Dashboard
// Determines if a user has admin privileges to access advanced AI features

// Interface for user object
interface User {
  id?: string
  email?: string
  role?: string
  permissions?: string[]
  isAdmin?: boolean
  adminLevel?: number
}

// Interface for session object
interface Session {
  user?: User
}

/**
 * Check if a user has admin privileges
 * @param user - User object from session or auth context
 * @returns boolean indicating if user is an admin
 */
export function isAdmin(user?: User | null): boolean {
  if (!user) {
    console.log('🔒 Auth: No user provided, denying admin access')
    return false
  }

  // Check explicit admin role
  if (user.role === "admin") {
    console.log('🔑 Auth: User has admin role, granting access')
    return true
  }

  // Check specific admin email (as specified in Prompt 18)
  if (user.email === "admin@siamoon.com") {
    console.log('🔑 Auth: User has admin email, granting access')
    return true
  }

  // Check explicit admin flag
  if (user.isAdmin === true) {
    console.log('🔑 Auth: User has admin flag, granting access')
    return true
  }

  // Check admin permissions
  if (user.permissions && user.permissions.includes('admin')) {
    console.log('🔑 Auth: User has admin permission, granting access')
    return true
  }

  // Check admin level (if using numeric admin levels)
  if (user.adminLevel && user.adminLevel >= 5) {
    console.log('🔑 Auth: User has sufficient admin level, granting access')
    return true
  }

  // Additional admin emails for development/testing
  const adminEmails = [
    "admin@siamoon.com",
    "developer@siamoon.com", 
    "test@siamoon.com",
    "demo@siamoon.com"
  ]

  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    console.log('🔑 Auth: User email in admin list, granting access')
    return true
  }

  console.log('🚫 Auth: User does not have admin privileges, denying access')
  return false
}

/**
 * Check if a user has admin privileges from session
 * @param session - Session object containing user
 * @returns boolean indicating if user is an admin
 */
export function isAdminFromSession(session?: Session | null): boolean {
  return isAdmin(session?.user)
}

/**
 * Get admin level for a user (0 = no access, 10 = super admin)
 * @param user - User object from session or auth context
 * @returns number indicating admin level (0-10)
 */
export function getAdminLevel(user?: User | null): number {
  if (!user) return 0

  // Super admin
  if (user.email === "admin@siamoon.com" || user.role === "super_admin") {
    return 10
  }

  // Full admin
  if (user.role === "admin" || user.isAdmin === true) {
    return 8
  }

  // Admin with specific permissions
  if (user.permissions?.includes('admin')) {
    return 7
  }

  // Numeric admin level
  if (user.adminLevel && user.adminLevel > 0) {
    return Math.min(user.adminLevel, 10)
  }

  // Developer/test access
  const devEmails = ["developer@siamoon.com", "test@siamoon.com", "demo@siamoon.com"]
  if (user.email && devEmails.includes(user.email.toLowerCase())) {
    return 6
  }

  return 0
}

/**
 * Check if user can access specific AI features
 * @param user - User object from session or auth context
 * @param feature - Feature name to check access for
 * @returns boolean indicating if user can access the feature
 */
export function canAccessAIFeature(user?: User | null, feature?: string): boolean {
  const adminLevel = getAdminLevel(user)
  
  if (adminLevel === 0) return false

  // Feature-specific access levels
  const featureRequirements: Record<string, number> = {
    'overview': 1,        // Basic dashboard access
    'rules': 5,           // Rules management
    'feedback': 6,        // Training and feedback
    'simulation': 7,      // Simulation testing
    'monitor': 7,         // API monitoring
    'settings': 8,        // AI settings configuration
    'logs': 6,            // Decision logs
    'staff-map': 5,       // Staff scheduling
    'analytics': 6,       // Advanced analytics
    'escalation': 7       // Escalation management
  }

  const requiredLevel = featureRequirements[feature || ''] || 8
  const hasAccess = adminLevel >= requiredLevel

  console.log(`🔍 Auth: Feature '${feature}' requires level ${requiredLevel}, user has ${adminLevel}, access: ${hasAccess}`)
  
  return hasAccess
}

/**
 * Get list of accessible AI features for a user
 * @param user - User object from session or auth context
 * @returns array of feature names the user can access
 */
export function getAccessibleAIFeatures(user?: User | null): string[] {
  const features = [
    'overview',
    'rules', 
    'feedback',
    'simulation',
    'monitor',
    'settings',
    'logs',
    'staff-map',
    'analytics',
    'escalation'
  ]

  return features.filter(feature => canAccessAIFeature(user, feature))
}

/**
 * Development mode bypass (only in development environment)
 * @returns boolean indicating if development bypass is active
 */
export function isDevelopmentBypass(): boolean {
  const isDev = process.env.NODE_ENV === 'development'
  const bypassEnabled = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  
  if (isDev && bypassEnabled) {
    console.log('🚧 Auth: Development bypass enabled - granting admin access')
    return true
  }
  
  return false
}

/**
 * Check admin access with development bypass
 * @param user - User object from session or auth context
 * @returns boolean indicating if user has admin access
 */
export function isAdminWithBypass(user?: User | null): boolean {
  // Development bypass
  if (isDevelopmentBypass()) {
    return true
  }
  
  // Normal admin check
  return isAdmin(user)
}

/**
 * Create a mock admin user for development/testing
 * @returns User object with admin privileges
 */
export function createMockAdminUser(): User {
  return {
    id: 'mock-admin-001',
    email: 'admin@siamoon.com',
    role: 'admin',
    isAdmin: true,
    adminLevel: 10,
    permissions: ['admin', 'ai_dashboard', 'settings', 'monitor']
  }
}

/**
 * Validate admin session and return user or null
 * @param session - Session object to validate
 * @returns User object if valid admin, null otherwise
 */
export function validateAdminSession(session?: Session | null): User | null {
  if (!session?.user) {
    console.log('🚫 Auth: No session or user found')
    return null
  }

  if (!isAdmin(session.user)) {
    console.log('🚫 Auth: User is not an admin')
    return null
  }

  console.log('✅ Auth: Valid admin session confirmed')
  return session.user
}

/**
 * Get admin status with detailed information
 * @param user - User object from session or auth context
 * @returns object with admin status and details
 */
export function getAdminStatus(user?: User | null): {
  isAdmin: boolean
  adminLevel: number
  accessibleFeatures: string[]
  bypassActive: boolean
  reason?: string
} {
  const bypassActive = isDevelopmentBypass()
  
  if (bypassActive) {
    return {
      isAdmin: true,
      adminLevel: 10,
      accessibleFeatures: getAccessibleAIFeatures(createMockAdminUser()),
      bypassActive: true,
      reason: 'Development bypass enabled'
    }
  }

  const adminStatus = isAdmin(user)
  const adminLevel = getAdminLevel(user)
  const accessibleFeatures = getAccessibleAIFeatures(user)

  return {
    isAdmin: adminStatus,
    adminLevel,
    accessibleFeatures,
    bypassActive: false,
    reason: adminStatus ? 'Valid admin credentials' : 'Insufficient privileges'
  }
}
