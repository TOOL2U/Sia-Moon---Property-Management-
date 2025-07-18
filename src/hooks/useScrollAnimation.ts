'use client'

import { useEffect, useRef, useState } from 'react'

// Define MarginType to match Framer Motion's expected type
type MarginValue = `${number}${'px' | '%'}`
type MarginType =
  | MarginValue
  | `${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue} ${MarginValue}`

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string // Correct type for rootMargin
  triggerOnce?: boolean
}

// Original scroll animation hook for class-based animations
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -80px 0px',
    triggerOnce = true,
  } = options

  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) {
      element.classList.add('animate-in')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Use requestAnimationFrame for smoother integration with Lenis
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                entry.target.classList.add('animate-in')
              })
            })
            if (triggerOnce) {
              observer.unobserve(entry.target)
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove('animate-in')
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return elementRef
}

// Original hook for animating multiple elements with stagger
export function useScrollAnimationGroup(
  options: UseScrollAnimationOptions = {}
) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -80px 0px',
    triggerOnce = true,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const elements = container.querySelectorAll(
      '.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale'
    )

    if (prefersReducedMotion) {
      elements.forEach((element) => {
        element.classList.add('animate-in')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                entry.target.classList.add('animate-in')
              })
            })
          }
        })
      },
      { threshold, rootMargin }
    )

    elements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return containerRef
}

/**
 * Hook to provide responsive animation variants based on device type
 * Automatically detects mobile devices and adjusts animation parameters
 */
export function useResponsiveAnimation() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if the device is mobile based on screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check on mount
    checkMobile()

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile)

    // Clean up
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Standard animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: isMobile ? 10 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.3 : 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: isMobile ? 0.3 : 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.05 : 0.1,
      },
    },
  }

  // Card hover animations - disabled on mobile
  const cardHover = {
    rest: {
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: isMobile
      ? { scale: 1, y: 0 }
      : {
          scale: 1.03,
          y: -5,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 17,
          },
        },
  }

  return {
    isMobile,
    variants: {
      fadeIn,
      scaleIn,
      staggerContainer,
      cardHover,
    },
  }
}
