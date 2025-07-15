'use client'

import { useEffect, useRef } from 'react'

interface SmoothScrollProviderProps {
  children: React.ReactNode
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<any>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // If user prefers reduced motion, don't initialize smooth scrolling
      return
    }

    // Dynamically import Lenis to avoid SSR issues
    Promise.resolve().then(() => require('lenis')).then(({ default: Lenis }) => {
      // Initialize Lenis with basic settings
      const lenis = new Lenis({
        duration: 1.2, // Smooth duration for Apple-like feel
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like easing curve
      })

      lenisRef.current = lenis

      // Animation loop
      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)

      // Handle anchor links with smooth scrolling
      const handleAnchorClick = (e: Event) => {
        const target = e.target as HTMLAnchorElement
        if (target.tagName === 'A' && target.hash && target.hostname === window.location.hostname) {
          e.preventDefault()
          const targetElement = document.querySelector(target.hash)
          if (targetElement && targetElement instanceof HTMLElement) {
            lenis.scrollTo(targetElement, {
              offset: -80, // Offset for sticky header
              duration: 1.5,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            })
          }
        }
      }

      // Handle route changes - scroll to top on navigation
      const handleRouteChange = () => {
        lenis.scrollTo(0, { immediate: true })
      }

      // Add event listeners
      document.addEventListener('click', handleAnchorClick)
      window.addEventListener('beforeunload', handleRouteChange)

      // Make lenis available globally for other components
      ;(window as Window & { lenis?: any }).lenis = lenis

      // Cleanup function
      const cleanup = () => {
        document.removeEventListener('click', handleAnchorClick)
        window.removeEventListener('beforeunload', handleRouteChange)
        lenis.destroy()
      }

      // Store cleanup function for later use
      lenisRef.current = { ...lenis, cleanup }
    }).catch((error) => {
      console.warn('Failed to load Lenis:', error)
    })

    // Cleanup on unmount
    return () => {
      if (lenisRef.current && lenisRef.current.cleanup) {
        lenisRef.current.cleanup()
      }
    }
  }, [])

  return <>{children}</>
}
