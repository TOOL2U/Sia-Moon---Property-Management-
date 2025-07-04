import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          className={cn(
            // Augment dark input styling
            'flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2',
            'text-sm text-white placeholder:text-neutral-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-800',
            // File input specific styles
            'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-300',
            // Touch-friendly on mobile
            'touch-manipulation',
            // Error state
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-neutral-400">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
