/**
 * Authentication utilities for API routes
 */

import { NextRequest } from 'next/server'

/**
 * Get Firebase ID token from request
 * Since middleware already handles authentication, this is a simple implementation
 */
export function getIdTokenFromRequest(request: NextRequest): string | null {
  // Check for Firebase token in cookies (set by middleware)
  const firebaseToken = request.cookies.get('firebase-auth-token')?.value
  const authToken = request.cookies.get('auth-token')?.value
  
  // Return the token if it exists and is valid
  if (firebaseToken && firebaseToken.length > 10) {
    return firebaseToken
  }
  
  if (authToken && authToken.length > 10) {
    return authToken
  }
  
  // Check for Authorization header as fallback
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

/**
 * Simple authentication check for API routes
 * Since middleware already handles auth, this just validates the token exists
 */
export function isAuthenticated(request: NextRequest): boolean {
  const token = getIdTokenFromRequest(request)
  return token !== null && token.length > 10
}

/**
 * Get current user info from request (placeholder)
 * TODO: Implement proper user extraction from Firebase token
 */
export function getCurrentUser(request: NextRequest): { id: string; name: string } {
  // For now, return a default admin user
  // TODO: Decode Firebase token to get actual user info
  return {
    id: 'admin',
    name: 'Admin User'
  }
}
