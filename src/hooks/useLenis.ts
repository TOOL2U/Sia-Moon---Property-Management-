'use client'

import { useEffect, useState } from 'react'
import type Lenis from 'lenis'

export function useLenis() {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Get lenis instance from global window object
    const lenisInstance = (window as any).lenis
    if (lenisInstance) {
      setLenis(lenisInstance)
    }

    // Listen for lenis initialization
    const checkLenis = () => {
      const lenisInstance = (window as any).lenis
      if (lenisInstance && !lenis) {
        setLenis(lenisInstance)
      }
    }

    const interval = setInterval(checkLenis, 100)

    return () => {
      clearInterval(interval)
    }
  }, [lenis])

  return lenis
}

// Utility function for smooth scrolling to elements
export function scrollToElement(selector: string, offset: number = -80) {
  // Only run on client side
  if (typeof window === 'undefined') return

  const lenis = (window as any).lenis
  if (lenis) {
    const element = document.querySelector(selector)
    if (element) {
      lenis.scrollTo(element, {
        offset,
        duration: 1.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      })
    }
  } else {
    // Fallback to native scrolling
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// Utility function for smooth scrolling to top
export function scrollToTop() {
  // Only run on client side
  if (typeof window === 'undefined') return

  const lenis = (window as any).lenis
  if (lenis) {
    lenis.scrollTo(0, {
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })
  } else {
    // Fallback to native scrolling
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
