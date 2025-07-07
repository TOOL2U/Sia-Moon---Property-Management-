'use client'

import { motion } from 'framer-motion'
import { useCountAnimation } from '@/hooks/useCountAnimation'

interface CountUpNumberProps {
  end: number
  start?: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
  separator?: string
  className?: string
}

export const CountUpNumber = ({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  suffix = '',
  prefix = '',
  separator = ',',
  className = ''
}: CountUpNumberProps) => {
  const { ref, displayValue, isInView } = useCountAnimation({
    end,
    start,
    duration,
    decimals,
    suffix,
    prefix,
    separator
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ scale: 1 }}
      whileInView={{ scale: [1, 1.2, 1] }}
      transition={{ 
        duration: 1.2, 
        delay: 0.3, 
        times: [0, 0.5, 1],
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      viewport={{ once: true, margin: '-100px' }}
    >
      {displayValue}
    </motion.div>
  )
}

// Preset components for common use cases
export const PercentageCounter = ({ end, className }: { end: number; className?: string }) => (
  <CountUpNumber
    end={end}
    suffix="%"
    decimals={1}
    duration={1500}
    className={className}
  />
)

export const CurrencyCounter = ({ 
  end, 
  currency = '$', 
  className 
}: { 
  end: number; 
  currency?: string; 
  className?: string 
}) => (
  <CountUpNumber
    end={end}
    prefix={currency}
    separator=","
    duration={2000}
    className={className}
  />
)

export const LargeNumberCounter = ({ end, className }: { end: number; className?: string }) => (
  <CountUpNumber
    end={end}
    separator=","
    duration={2500}
    className={className}
  />
)
