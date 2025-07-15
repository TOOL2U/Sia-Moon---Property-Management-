'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import CloudinaryImage from './CloudinaryImage'

interface SlideData {
  id: string
  publicId?: string
  externalUrl?: string
  alt: string
  title?: string
  subtitle?: string
}

interface HeroSlideshowProps {
  slides: SlideData[]
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  className?: string
}

export default function HeroSlideshow({
  slides,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = false,
  className = ''
}: HeroSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  // Auto-play functionality - simplified
  useEffect(() => {
    console.log(`🎬 Auto-play useEffect triggered - slides: ${slides.length}, isPlaying: ${isPlaying}`)

    if (!isPlaying || slides.length <= 1) {
      console.log(`🎬 Auto-play disabled - isPlaying: ${isPlaying}, slides: ${slides.length}`)
      return
    }

    console.log(`🎬 Starting auto-play timer with ${autoPlayInterval}ms interval`)

    const interval = setInterval(() => {
      console.log(`🎬 Timer fired - advancing slide`)
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slides.length
        console.log(`🎬 Advancing from slide ${prev} to slide ${nextSlide}`)
        return nextSlide
      })
    }, autoPlayInterval)

    return () => {
      console.log(`🎬 Cleaning up auto-play timer`)
      clearInterval(interval)
    }
  }, [slides.length, autoPlayInterval, isPlaying])

  // Debug current slide changes
  useEffect(() => {
    console.log(`🎬 Current slide is now: ${currentSlide}`)
  }, [currentSlide])

  // Pause on hover
  const handleMouseEnter = () => setIsPlaying(false)
  const handleMouseLeave = () => setIsPlaying(true)

  // Navigation functions
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-400">No slides available</span>
      </div>
    )
  }

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slideshow Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            scale: { duration: 8 }
          }}
        >
          {/* Image Container */}
          <div className="absolute inset-0">
            {slides[currentSlide].publicId ? (
              // Cloudinary Image
              <CloudinaryImage
                publicId={slides[currentSlide].publicId!}
                alt={slides[currentSlide].alt}
                fill
                priority={currentSlide === 0}
                quality={100}
                format="webp"
                crop="fill"
                gravity="center"
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              // External URL Image using Next.js Image
              <Image
                src={slides[currentSlide].externalUrl!}
                alt={slides[currentSlide].alt}
                fill
                priority={currentSlide === 0}
                quality={100}
                className="object-cover"
                sizes="100vw"
              />
            )}
          </div>

          {/* Gradient Overlay - Consistent with original design */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/100 via-black/90 to-black/70" />
          
          {/* Optional Text Overlay */}
          {(slides[currentSlide].title || slides[currentSlide].subtitle) && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="text-center text-white max-w-4xl mx-auto px-6">
                {slides[currentSlide].title && (
                  <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white/90 via-gray-300 to-transparent bg-clip-text text-transparent">
                    {slides[currentSlide].title}
                  </h2>
                )}
                {slides[currentSlide].subtitle && (
                  <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                    {slides[currentSlide].subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-300 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-300 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-1 h-1 rounded-full transition-all duration-300 backdrop-blur-sm ${
                index === currentSlide
                  ? 'bg-white shadow-lg scale-50'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 z-10">
        <motion.div
          className="h-full bg-white/60"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ 
            duration: autoPlayInterval / 1000, 
            ease: 'linear',
            repeat: Infinity 
          }}
          key={currentSlide}
        />
      </div>
    </div>
  )
}
