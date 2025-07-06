# Animation System Documentation

This document provides an overview of the animation system implemented in the Villa Management application.

## Overview

The animation system is designed to provide subtle, premium animations and visual effects while maintaining performance and accessibility. The animations are implemented using Framer Motion and follow best practices for web animations.

## Key Components

### 1. Animation Hooks

Located in `src/hooks/useScrollAnimation.ts`:

- `useScrollAnimation`: Original hook for class-based animations
- `useScrollAnimationGroup`: Hook for animating multiple elements with stagger
- `useFramerAnimation`: Hook for Framer Motion animations triggered on scroll
- `useResponsiveAnimation`: Hook providing responsive animation variants

### 2. Animation Variants

Located in `src/utils/animationVariants.ts`:

Reusable animation configurations including:
- `fadeIn`: Standard fade-in from bottom animation
- `scaleIn`: Scale and fade-in animation
- `staggerContainer`: Container for staggered child animations
- `slideFromLeft/Right`: Side entrance animations
- `cardHover`: Hover effect animations for cards

### 3. Animated Components

Located in `src/components/ui/AnimatedComponents.tsx`:

- `AnimatedSection`: Component for section animations
- `AnimatedCard`: Component for card animations with hover effects

## Usage Examples

### Basic Section Animation

```tsx
import { AnimatedSection } from '@/components/ui/AnimatedComponents';

<AnimatedSection>
  <h2>Section Title</h2>
  <p>Section content...</p>
</AnimatedSection>
```

### Card Animation

```tsx
import { AnimatedCard } from '@/components/ui/AnimatedComponents';

<AnimatedCard delay={0.1}>
  <div className="card-content">
    <h3>Card Title</h3>
    <p>Card content...</p>
  </div>
</AnimatedCard>
```

### Using Animation Hooks with Framer Motion

```tsx
import { useFramerAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const MyComponent = () => {
  const { ref, inView } = useFramerAnimation();
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
    >
      Content here
    </motion.div>
  );
};
```

### Responsive Animations

```tsx
import { useResponsiveAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const MyComponent = () => {
  const { variants, isMobile } = useResponsiveAnimation();
  
  return (
    <motion.div
      variants={variants.fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      Content will animate differently on mobile vs desktop
    </motion.div>
  );
};
```

## Customization

### Animation Timing

- Most animations use durations between 200ms-700ms
- Standard fade-in: 600ms
- Card animations: 500ms
- Hover effects: 200-300ms

### Easing Functions

- Most animations use a custom easing: `[0.25, 0.46, 0.45, 0.94]`
- Hover animations use spring physics for more responsive feedback

### Mobile Considerations

- Animations are subtler and faster on mobile devices
- Some hover effects are disabled on touch devices
- Stagger timings are reduced on mobile

## Accessibility

The animation system respects the user's preference for reduced motion:

```tsx
// Example from useScrollAnimation.ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (prefersReducedMotion) {
  // Disable or minimize animations
}
```

## Performance Considerations

- Animations are set to `once: true` by default to avoid unnecessary re-animations
- GPU-accelerated properties (transform, opacity) are used where possible
- Staggered animations prevent too many animations running simultaneously
