'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { scrollToTop } from '@/hooks/useLenis'
import { cn } from '@/utils/cn'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Listen for scroll events
    window.addEventListener('scroll', toggleVisibility)

    // Listen for Lenis scroll events if available
    const lenis = (window as any).lenis
    if (lenis) {
      lenis.on('scroll', ({ scroll }: { scroll: number }) => {
        if (scroll > 300) {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      })
    }

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const handleScrollToTop = () => {
    scrollToTop()
  }

  return (
    <Button
      onClick={handleScrollToTop}
      size="sm"
      className={cn(
        'fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full p-0 shadow-lg transition-all duration-300',
        'bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600',
        'hover:shadow-xl hover:scale-105',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-16 opacity-0 pointer-events-none'
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
