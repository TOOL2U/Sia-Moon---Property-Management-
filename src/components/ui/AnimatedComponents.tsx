import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

/**
 * AnimatedSection component for consistent section animations
 * 
 * This component provides standard fade-in animations for page sections
 * with customizable delay and other options
 * 
 * @param children - The section content
 * @param className - Additional CSS classes
 * @param delay - Animation delay in seconds
 * @param once - Whether to trigger the animation only once
 */
export const AnimatedSection = ({
  children,
  className = '',
  delay = 0,
  once = true,
}: AnimatedSectionProps) => {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      viewport={{ once, margin: "-100px" }}
    >
      {children}
    </motion.section>
  );
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  scale?: boolean;
}

/**
 * AnimatedCard component for consistent card animations
 * 
 * This component provides standard animations for cards with hover effects
 * 
 * @param children - The card content
 * @param className - Additional CSS classes
 * @param delay - Animation delay in seconds
 * @param scale - Whether to include a scale animation
 */
export const AnimatedCard = ({
  children,
  className = '',
  delay = 0,
  scale = true,
}: AnimatedCardProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30, scale: scale ? 0.95 : 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 17 
        }
      }}
      transition={{
        duration: 0.5, 
        delay, 
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      {children}
    </motion.div>
  );
};
