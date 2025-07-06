'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Master animation timing configuration
export const ANIMATION_CONFIG = {
  // Easing curves for consistent feel
  easing: {
    smooth: "easeOut",
    bounce: "backOut",
    sharp: "easeInOut",
    gentle: "easeInOut"
  },
  
  // Duration presets
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
    sequence: 1.2
  },
  
  // Stagger delays
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.2,
    text: 0.05
  }
}

// Page load animation states
export const usePageLoadAnimation = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'hero' | 'content' | 'complete'>('loading')
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    // Simulate page load completion
    const timer = setTimeout(() => {
      setIsLoaded(true)
      setAnimationPhase('hero')
      
      // Progress through animation phases
      setTimeout(() => setAnimationPhase('content'), 800)
      setTimeout(() => setAnimationPhase('complete'), 1500)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return {
    isLoaded,
    animationPhase,
    shouldReduceMotion,
    // Skip animations if reduced motion is preferred
    skipAnimations: shouldReduceMotion
  }
}

// Hero section coordinated animation variants
export const heroAnimationVariants = {
  // Background image animation
  backgroundImage: {
    initial: {
      scale: 0.95,
      opacity: 0
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.sequence,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  },

  // Headline staggered animation
  headline: {
    initial: {
      opacity: 0,
      y: 40
    },
    animate: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: custom * ANIMATION_CONFIG.stagger.slow
      }
    })
  },

  // Subtitle with blur effect
  subtitle: {
    initial: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)'
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 0.4
      }
    }
  },

  // CTA buttons scale-in
  ctaButton: {
    initial: {
      opacity: 0,
      scale: 0.9
    },
    animate: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 0.6 + (custom * ANIMATION_CONFIG.stagger.normal)
      }
    })
  },

  // Trusted by logos
  trustedLogo: {
    initial: {
      opacity: 0,
      x: -20
    },
    animate: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.easing.smooth,
        delay: 0.8 + (custom * ANIMATION_CONFIG.stagger.fast)
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

// Stagger container variants
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: ANIMATION_CONFIG.stagger.normal,
      delayChildren: 0.1
    }
  }
}

export const staggerContainerFast = {
  animate: {
    transition: {
      staggerChildren: ANIMATION_CONFIG.stagger.fast,
      delayChildren: 0.05
    }
  }
}
