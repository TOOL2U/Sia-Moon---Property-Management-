'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// SSR-safe motion wrapper
export function SSRMotion(props: any) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a div without motion during SSR
    const { children, ...otherProps } = props
    return <div {...otherProps}>{children}</div>
  }

  return <motion.div {...props} />
}

// Export common motion components with SSR safety
export const MotionDiv = SSRMotion
export const MotionSpan = (props: any) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    const { children, ...otherProps } = props
    return <span {...otherProps}>{children}</span>
  }

  return <motion.span {...props} />
}

export const MotionSection = (props: any) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    const { children, ...otherProps } = props
    return <section {...otherProps}>{children}</section>
  }

  return <motion.section {...props} />
}
