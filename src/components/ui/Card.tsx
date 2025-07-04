import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Augment dark card styling with enhanced micro-interactions
        'rounded-lg border border-neutral-850 bg-neutral-950 text-white shadow-lg',
        'transition-all duration-200 ease-out',
        'hover:shadow-xl hover:border-neutral-800 hover:scale-[1.01]',
        'hover:bg-neutral-900',
        'w-full', // Full width by default for mobile
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Linear padding system
        'flex flex-col space-y-1.5 p-6',
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        // Augment dark typography
        'text-lg font-semibold leading-tight tracking-tight',
        'text-white',
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        // Augment dark description styling
        'text-sm text-neutral-400 leading-relaxed',
        className
      )}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Linear content padding
        'p-6 pt-0',
        className
      )}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Mobile-first footer with better spacing
        'flex flex-col space-y-2 p-4 pt-0 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 sm:p-6 sm:pt-0',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
