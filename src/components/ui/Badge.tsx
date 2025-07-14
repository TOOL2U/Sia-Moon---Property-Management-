import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'error'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
            'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          },
          // Augment dark theme colors
          {
            'bg-primary-500 text-white hover:bg-primary-600': variant === 'default',
            'bg-neutral-800 text-white hover:bg-neutral-700': variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
            'text-white border border-neutral-700 bg-transparent hover:bg-neutral-900': variant === 'outline',
            'bg-green-500 text-white hover:bg-green-600': variant === 'success',
            'bg-yellow-500 text-black hover:bg-yellow-600': variant === 'warning',
            'bg-red-600 text-white hover:bg-red-700': variant === 'error',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
