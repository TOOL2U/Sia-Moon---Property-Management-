'use client'

import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface FloatingAIIconProps {
  className?: string
}

export default function FloatingAIIcon({ className }: FloatingAIIconProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Only show for authenticated admin users
  useEffect(() => {
    setIsVisible(user?.role === 'admin')
  }, [user])

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  const handleClick = () => {
    router.push('/dashboard/ai')
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 group",
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg shadow-lg border border-neutral-700 whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
          AI Dashboard
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleClick}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
          "text-white shadow-lg hover:shadow-xl",
          "transform transition-all duration-300 ease-out",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-4 focus:ring-blue-500/30",
          "border border-blue-500/20"
        )}
        aria-label="Open AI Dashboard"
      >
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse opacity-20"></div>

        {/* Brain Icon */}
        <Brain className="w-6 h-6 relative z-10" />

        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
      </button>

      {/* Mobile-specific adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .group {
            bottom: 1rem;
            right: 1rem;
          }

          .group button {
            width: 3rem;
            height: 3rem;
          }

          .group button svg {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}

// Hook to check if user is admin (fallback if useAuth doesn't work)
function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check for admin status from localStorage, cookies, or other auth method
    const checkAdminStatus = () => {
      try {
        // Try to get user data from localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          setIsAdmin(user?.role === 'admin')
          return
        }

        // Check for auth tokens that might indicate admin status
        const authToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))

        const firebaseToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('firebase-auth-token='))

        // If we have tokens, assume admin for now (can be refined)
        setIsAdmin(!!(authToken || firebaseToken))
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [])

  return isAdmin
}

// Alternative component that doesn't rely on useAuth hook
export function FloatingAIIconStandalone({ className }: FloatingAIIconProps) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const [showTooltip, setShowTooltip] = useState(false)

  // Don't render if not admin
  if (!isAdmin) {
    return null
  }

  const handleClick = () => {
    router.push('/dashboard/ai')
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 group",
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg shadow-lg border border-neutral-700 whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
          AI Dashboard
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleClick}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
          "text-white shadow-lg hover:shadow-xl",
          "transform transition-all duration-300 ease-out",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-4 focus:ring-blue-500/30",
          "border border-blue-500/20"
        )}
        aria-label="Open AI Dashboard"
      >
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse opacity-20"></div>

        {/* Brain Icon */}
        <Brain className="w-6 h-6 relative z-10" />

        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
      </button>
    </div>
  )
}
