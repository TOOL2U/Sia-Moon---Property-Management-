'use client'

import { useEffect, useRef } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -80px 0px',
    triggerOnce = true
  } = options

  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return elementRef
}

// Hook for animating multiple elements with stagger - Ultra smooth
export function useScrollAnimationGroup(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -80px 0px',
    triggerOnce = true
  } = options

  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const elements = container.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale')

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
            // Double requestAnimationFrame for smoother integration with Lenis
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
        rootMargin
      }
    )

    elements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return containerRef
}
