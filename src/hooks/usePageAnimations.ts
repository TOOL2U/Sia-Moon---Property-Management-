'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Master animation timing configuration
export const ANIMATION_CONFIG = {
  // Easing curves for consistent feel
  easing: {
    smooth: [0.25, 0.46, 0.45, 0.94] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
    sharp: [0.4, 0, 0.2, 1] as const,
    gentle: [0.25, 0.1, 0.25, 1] as const
  },
  
  // Duration presets - Much slower for smoother feel
  duration: {
    fast: 0.6,
    normal: 0.8,
    slow: 1.2,
    slower: 1.8,
    sequence: 2.5
  },

  // Stagger delays - Increased for better coordination
  stagger: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    text: 0.2
  }
}

// Page load animation states - Enhanced with single trigger prevention
export const usePageLoadAnimation = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'hero' | 'content' | 'complete'>('loading')
  const [hasStarted, setHasStarted] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    // Prevent double initialization
    if (hasStarted) return

    setHasStarted(true)

    // Much slower, coordinated sequence
    const loadTimer = setTimeout(() => {
      setIsLoaded(true)
      setAnimationPhase('hero')
    }, 200)

    // Extended timing for smoother coordination
    const heroTimer = setTimeout(() => {
      setAnimationPhase('content')
    }, 3000) // Updated from 2000ms to 3000ms for longer hero image duration

    const completeTimer = setTimeout(() => {
      setAnimationPhase('complete')
    }, 4000) // Increased from 1500ms

    return () => {
      clearTimeout(loadTimer)
      clearTimeout(heroTimer)
      clearTimeout(completeTimer)
    }
  }, [hasStarted])

  return {
    isLoaded,
    animationPhase,
    shouldReduceMotion,
    hasStarted,
    // Skip animations if reduced motion is preferred
    skipAnimations: shouldReduceMotion
  }
}

// Hero section coordinated animation variants - Much slower and smoother
export const heroAnimationVariants = {
  // Background image animation - Slower and more subtle
  backgroundImage: {
    initial: {
      scale: 1.02,
      opacity: 0
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.sequence,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 0.2
      }
    }
  },

  // Headline staggered animation - Much slower
  headline: {
    initial: {
      opacity: 0,
      y: 60
    },
    animate: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.slower,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 0.8 + (custom * ANIMATION_CONFIG.stagger.slow)
      }
    })
  },

  // Subtitle with blur effect - Slower and smoother
  subtitle: {
    initial: {
      opacity: 0,
      y: 30,
      filter: 'blur(6px)'
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: ANIMATION_CONFIG.duration.slower,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 1.8
      }
    }
  },

  // CTA buttons scale-in - Much slower
  ctaButton: {
    initial: {
      opacity: 0,
      scale: 0.85,
      y: 20
    },
    animate: (custom: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 2.5 + (custom * ANIMATION_CONFIG.stagger.normal)
      }
    })
  },

  // Trusted by logos - Slower cascade
  trustedLogo: {
    initial: {
      opacity: 0,
      x: -30,
      scale: 0.9
    },
    animate: (custom: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 3.2 + (custom * ANIMATION_CONFIG.stagger.fast)
      }
    })
  }
}

// Navbar animation variants
export const navbarAnimationVariants = {
  navbar: {
    initial: { 
      y: -100, 
      opacity: 0,
      backdropFilter: 'blur(0px)'
    },
    animate: { 
      y: 0, 
      opacity: 1,
      backdropFilter: 'blur(12px)',
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  navLink: {
    initial: { 
      opacity: 0, 
      y: -10 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  logo: {
    initial: { 
      opacity: 0, 
      scale: 0.8 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 0.2
      }
    }
  }
}

// Content section animation variants
export const contentAnimationVariants = {
  // Feature cards
  featureCard: {
    initial: { 
      opacity: 0, 
      y: 30, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  // Stats with count-up effect
  statNumber: {
    initial: { 
      opacity: 0, 
      scale: 0.5 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.bounce
      }
    }
  },

  // Icon rotation
  iconRotate: {
    initial: { 
      opacity: 0, 
      rotate: -180, 
      scale: 0.5 
    },
    animate: { 
      opacity: 1, 
      rotate: 0, 
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  // Shimmer effect for buttons
  shimmer: {
    initial: { 
      x: '-100%' 
    },
    animate: { 
      x: '100%',
      transition: {
        duration: 0.8,
        ease: 'linear',
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  }
}

// Scroll-triggered animation variants
export const scrollAnimationVariants = {
  fadeInUp: {
    initial: { 
      opacity: 0, 
      y: 60 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  fadeInScale: {
    initial: { 
      opacity: 0, 
      scale: 0.8 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  slideInLeft: {
    initial: { 
      opacity: 0, 
      x: -60 
    },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  slideInRight: {
    initial: { 
      opacity: 0, 
      x: 60 
    },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  }
}

// Viewport configuration for scroll animations
export const viewportConfig = {
  once: true,
  margin: '-100px',
  amount: 0.3
}

// Stagger container variants - Slower and more coordinated
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: ANIMATION_CONFIG.stagger.normal,
      delayChildren: 0.3,
      when: "beforeChildren"
    }
  }
}

export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: ANIMATION_CONFIG.stagger.fast,
      delayChildren: 0.2,
      when: "beforeChildren"
    }
  }
}

// Hero-specific stagger container with no conflicts
export const heroStaggerContainer = {
  initial: {},
  animate: {
    transition: {
      when: "beforeChildren",
      delayChildren: 0.5
    }
  }
}
