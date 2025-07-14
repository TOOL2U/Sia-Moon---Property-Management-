import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, asChild = false, ...props }, ref) => {
    const baseStyles = cn(
      // Linear button base styles with micro-interactions
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
      'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
      'active:scale-[0.98] transform touch-manipulation',
      // Hover micro-interaction
      'hover:shadow-lg',
      // Full width option
      fullWidth && 'w-full'
    )

    const variantStyles = {
      // Primary - Linear's signature style with gradient
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus-visible:ring-primary-500 shadow-lg hover:shadow-xl border border-primary-500/20',
      // Default - Same as primary for compatibility
      default: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus-visible:ring-primary-500 shadow-lg hover:shadow-xl border border-primary-500/20',
      // Secondary - Dark background
      secondary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-500 border border-neutral-800 hover:border-neutral-700',
      // Outline - Clean border style for dark theme
      outline: 'border border-neutral-700 bg-transparent text-white hover:bg-neutral-900 hover:border-neutral-600 focus-visible:ring-neutral-500',
      // Ghost - Minimal style for dark theme
      ghost: 'text-white hover:bg-neutral-900 focus-visible:ring-neutral-500',
      // Destructive - Red style for dangerous actions
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 border border-red-600'
    }

    const sizeStyles = {
      sm: 'h-9 px-3 text-sm gap-1.5 min-w-[44px]',
      md: 'h-10 px-4 text-sm gap-2 min-w-[44px]',
      lg: 'h-11 px-6 text-sm gap-2 min-w-[44px]'
    }

    if (asChild) {
      return (
        <span
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            className
          )}
          {...props}
        />
      )
    }

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
