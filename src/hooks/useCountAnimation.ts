'use client'

import { useEffect, useState } from 'react'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface UseCountAnimationOptions {
  end: number
  start?: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
  separator?: string
}

export const useCountAnimation = ({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  suffix = '',
  prefix = '',
  separator = ','
}: UseCountAnimationOptions) => {
  const [count, setCount] = useState(start)
  const [isComplete, setIsComplete] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = start + (end - start) * easeOutQuart
      
      setCount(currentCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setIsComplete(true)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isInView, end, start, duration])

  // Format the number with separators and decimals
  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')
    
    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    
    return parts.join('.')
  }

  const displayValue = `${prefix}${formatNumber(count)}${suffix}`

  return {
    ref,
    displayValue,
    currentCount: count,
    isComplete,
    isInView
  }
}

// Preset configurations for common use cases
export const countPresets = {
  percentage: (end: number) => ({
    end,
    suffix: '%',
    decimals: 1,
    duration: 1500
  }),
  
  currency: (end: number, currency = '$') => ({
    end,
    prefix: currency,
    separator: ',',
    duration: 2000
  }),
  
  large: (end: number) => ({
    end,
    separator: ',',
    duration: 2500
  }),
  
  decimal: (end: number, decimals = 1) => ({
    end,
    decimals,
    duration: 1800
  })
}
