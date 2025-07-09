'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProviderProps {
  children: React.ReactNode
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      // If user prefers reduced motion, don't initialize smooth scrolling
      return
    }

    // Initialize Lenis with basic settings
    const lenis = new Lenis({
      duration: 1.2, // Smooth duration for Apple-like feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like easing curve
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
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
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

    // Cleanup
    return () => {
      document.removeEventListener('click', handleAnchorClick)
      window.removeEventListener('beforeunload', handleRouteChange)
      lenis.destroy()
    }
  }, [])

  // Expose lenis instance for external use
  useEffect(() => {
    if (lenisRef.current) {
      // Make lenis available globally for other components
      ;(window as Window & { lenis?: Lenis }).lenis = lenisRef.current
    }
  }, [])

  return <>{children}</>
}
