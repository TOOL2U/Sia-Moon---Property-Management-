'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FullScreenChartModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function FullScreenChartModal({
  isOpen,
  onClose,
  children,
  title = "Chart View",
  subtitle = "Tap to interact with the chart"
}: FullScreenChartModalProps) {
  const [isLandscape, setIsLandscape] = useState(false)
  const [showRotateHint, setShowRotateHint] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Check if device is mobile
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // Lock to landscape orientation if supported
      if (screen.orientation && 'lock' in screen.orientation) {
        (screen.orientation as { lock?: (orientation: string) => Promise<void> }).lock?.('landscape').catch(() => {
          // If orientation lock fails, show rotate hint
          setShowRotateHint(true)
        })
      } else {
        // Show rotate hint for devices that don't support orientation lock
        setShowRotateHint(true)
      }

      // Check current orientation
      const checkOrientation = () => {
        setIsLandscape(window.innerWidth > window.innerHeight)
      }

      checkOrientation()
      window.addEventListener('orientationchange', checkOrientation)
      window.addEventListener('resize', checkOrientation)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        window.removeEventListener('orientationchange', checkOrientation)
        window.removeEventListener('resize', checkOrientation)
        document.body.style.overflow = 'unset'
        
        // Unlock orientation when closing
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as { unlock?: () => void }).unlock?.()
        }
      }
    }
  }, [isOpen])

  useEffect(() => {
    // Hide rotate hint after 3 seconds if in landscape
    if (isLandscape && showRotateHint) {
      const timer = setTimeout(() => {
        setShowRotateHint(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isLandscape, showRotateHint])

  // Handle swipe gestures for closing modal
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y

    // Swipe down to close (minimum 100px swipe)
    if (deltaY > 100 && Math.abs(deltaX) < 100) {
      onClose()
    }

    setTouchStart(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black chart-modal-fullscreen"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-sm border-b border-neutral-800"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg">{title}</h2>
              <p className="text-neutral-400 text-sm">{subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Rotate Hint Overlay */}
        <AnimatePresence>
          {showRotateHint && !isLandscape && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center"
            >
              <div className="text-center text-white p-8">
                <motion.div
                  animate={{ rotate: 90 }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                  className="mx-auto mb-4"
                >
                  <RotateCcw className="h-12 w-12 text-blue-400" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Rotate Your Device</h3>
                <p className="text-neutral-400">
                  Turn your device to landscape mode for the best chart viewing experience
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 pt-20 pb-16 px-2"
        >
          <div className="w-full h-full bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
            <div className="w-full h-full p-2 md:p-4">
              {/* Enhanced chart container with touch optimization */}
              <div className="w-full h-full touch-pan-x touch-pan-y">
                {children}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Touch Instructions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 left-4 right-4 z-10"
        >
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-lg p-3 border border-neutral-700">
            <p className="text-neutral-400 text-sm text-center">
              Pinch to zoom • Drag to pan • Tap data points • Swipe down to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for mobile detection and chart modal management
export function useFullScreenChart() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const openChart = () => {
    if (isMobile) {
      setIsModalOpen(true)
    }
  }

  const closeChart = () => {
    setIsModalOpen(false)
  }

  return {
    isModalOpen,
    isMobile,
    openChart,
    closeChart
  }
}
