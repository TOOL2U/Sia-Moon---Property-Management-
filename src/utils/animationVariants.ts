/**
 * Animation variants for framer-motion
 * These can be reused across the application for consistent animations
 */

export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInDelay = (delay: number = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
});

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const scaleInDelay = (delay: number = 0) => ({
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
});

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const cardHover = {
  rest: { 
    scale: 1, 
    y: 0, 
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94]
    } 
  },
  hover: { 
    scale: 1.03, 
    y: -5,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    } 
  }
};

/**
 * Animation settings for mobile devices
 * Can be used to reduce or disable animations on mobile
 */
export const mobileAnimationSettings = {
  // Reduce animation distance on mobile
  fadeIn: {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  
  // Disable hover animations on mobile
  cardHover: {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1, y: 0 }
  }
};

/**
 * Utility to conditionally apply animations based on device
 * Usage: 
 * const animations = useResponsiveAnimations();
 * ...
 * <motion.div variants={animations.fadeIn}>
 */
export const useResponsiveAnimations = (isMobile: boolean = false) => {
  return isMobile ? mobileAnimationSettings : {
    fadeIn,
    scaleIn,
    staggerContainer,
    slideFromRight,
    slideFromLeft,
    cardHover
  };
};
