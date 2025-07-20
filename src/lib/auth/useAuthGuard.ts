'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { canAccessAIFeature, createMockAdminUser, getAdminStatus, isAdminWithBypass } from './isAdmin'

// Interface for user object
interface User {
  id?: string
  email?: string
  role?: string
  permissions?: string[]
  isAdmin?: boolean
  adminLevel?: number
}

// Interface for auth guard options
interface AuthGuardOptions {
  requireAdmin?: boolean
  requiredFeature?: string
  redirectTo?: string
  bypassInDev?: boolean
  showUnauthorized?: boolean
}

// Interface for auth guard result
interface AuthGuardResult {
  isAuthorized: boolean
  isLoading: boolean
  user: User | null
  adminStatus: ReturnType<typeof getAdminStatus>
  error?: string
}

/**
 * Custom hook for protecting routes with role-based access control
 * @param options - Configuration options for the auth guard
 * @returns Auth guard result with authorization status
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const {
    requireAdmin = true,
    requiredFeature,
    redirectTo = '/unauthorized',
    bypassInDev = true,
    showUnauthorized = true
  } = options

  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      setIsLoading(true)
      setError(undefined)

      // In development mode with bypass enabled, create mock admin user
      if (bypassInDev && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
        const mockUser = createMockAdminUser()
        setUser(mockUser)
        setIsAuthorized(true)
        setIsLoading(false)
        console.log('🚧 Auth Guard: Development bypass enabled, granting access')
        return
      }

      // Try to get user from session/auth context
      // In a real app, this would integrate with your auth provider (NextAuth, Supabase, etc.)
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        console.log('🚫 Auth Guard: No user session found')
        handleUnauthorized('no_session')
        return
      }

      setUser(currentUser)

      // Check admin requirement
      if (requireAdmin && !isAdminWithBypass(currentUser)) {
        console.log('🚫 Auth Guard: User is not an admin')
        handleUnauthorized('admin_required')
        return
      }

      // Check feature-specific access
      if (requiredFeature && !canAccessAIFeature(currentUser, requiredFeature)) {
        console.log(`🚫 Auth Guard: User cannot access feature: ${requiredFeature}`)
        handleUnauthorized('feature_restricted')
        return
      }

      // Authorization successful
      setIsAuthorized(true)
      console.log('✅ Auth Guard: Authorization successful')

    } catch (err) {
      console.error('❌ Auth Guard: Error during authorization check:', err)
      setError(err instanceof Error ? err.message : 'Authorization check failed')
      handleUnauthorized('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnauthorized = (reason: string) => {
    setIsAuthorized(false)

    if (showUnauthorized) {
      const params = new URLSearchParams({
        reason,
        ...(requiredFeature && { feature: requiredFeature }),
        returnUrl: window.location.pathname
      })

      router.push(`${redirectTo}?${params.toString()}`)
    }
  }

  // Get current user - this would integrate with your auth system
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      // In a real application, this would call your auth API
      // For now, we'll simulate different scenarios based on environment

      if (process.env.NODE_ENV === 'development') {
        // Development mode - check for mock user in localStorage or return null
        const mockUserData = localStorage.getItem('mockUser')
        if (mockUserData) {
          return JSON.parse(mockUserData)
        }

        // Return null to test unauthorized flow
        return null
      }

      // Production mode - integrate with your auth provider
      // Example with NextAuth:
      // const session = await getSession()
      // return session?.user || null

      // Example with Supabase:
      // const { data: { user } } = await supabase.auth.getUser()
      // return user

      // For now, return null (unauthorized)
      return null

    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  const adminStatus = getAdminStatus(user)

  return {
    isAuthorized,
    isLoading,
    user,
    adminStatus,
    error
  }
}

/**
 * Higher-order component for protecting pages with auth guard
 * Note: Use the useAuthGuard hook directly in components instead
 * This function is kept for reference but not recommended for use
 */
export function withAuthGuard<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: AuthGuardOptions = {}
) {
  console.warn('withAuthGuard HOC is deprecated. Use useAuthGuard hook directly in your components.')
  return WrappedComponent
}

/**
 * Hook for checking if user can access specific AI features
 * @param feature - Feature name to check
 * @returns boolean indicating if user can access the feature
 */
export function useCanAccessFeature(feature: string): boolean {
  const { user, adminStatus } = useAuthGuard({
    requireAdmin: false,
    showUnauthorized: false
  })

  if (adminStatus.bypassActive) {
    return true
  }

  return canAccessAIFeature(user, feature)
}

/**
 * Development helper to set mock user for testing
 * @param user - Mock user object
 */
export function setMockUser(user: User | null) {
  if (process.env.NODE_ENV === 'development') {
    if (user) {
      localStorage.setItem('mockUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('mockUser')
    }

    // Reload page to trigger auth check
    window.location.reload()
  }
}

/**
 * Development helper to clear mock user
 */
export function clearMockUser() {
  setMockUser(null)
}
